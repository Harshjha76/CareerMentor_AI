import assert from 'assert';
import { query, initDB } from '../src/config/db.js';
import { googleLogin, saveOnboarding, getMe } from '../src/controllers/authController.js';
import { v4 as uuidv4 } from 'uuid';

let totalPassed = 0;
let totalFailed = 0;

async function it(name, fn) {
  try {
    await fn();
    console.log('  ✅ PASS: ' + name);
    totalPassed++;
  } catch (err) {
    console.error('  ❌ FAIL: ' + name);
    console.error('     Error: ' + err.message);
    totalFailed++;
  }
}

function createMockReqRes(body = {}, user = null) {
  let statusCode = 200;
  let responseData = null;
  const req = { body, user };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    getStatusCode() { return statusCode; },
    getData() { return responseData; }
  };
  return { req, res };
}

async function run() {
  console.log('\n🧪 RUNNING GOOGLE AUTH & MULTI-ACCOUNT ISOLATION TEST SUITE\n');
  await initDB();

  // Clean test accounts before starting
  await query("DELETE FROM goals WHERE user_id IN (SELECT id FROM users WHERE email IN ('harshjha101ab@gmail.com', '125harsh6001@sjcem.edu.in', 'virat100cent@gmail.com', 'onboarding_test@gmail.com'))");
  await query("DELETE FROM users WHERE email IN ('harshjha101ab@gmail.com', '125harsh6001@sjcem.edu.in', 'virat100cent@gmail.com', 'onboarding_test@gmail.com')");

  let accountAUser = null;

  // Test 1: Account A Login
  await it('Account A (harshjha101ab@gmail.com) Google login creates isolated verified account', async () => {
    const { req, res } = createMockReqRes({
      email: 'harshjha101ab@gmail.com',
      name: 'Harsh Jha',
      sub: 'google_sub_harsh_101',
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    });

    await googleLogin(req, res);
    assert.strictEqual(res.getStatusCode(), 200);
    const data = res.getData();
    assert.ok(data.token, 'Must return session token');
    assert.strictEqual(data.user.email, 'harshjha101ab@gmail.com');
    assert.strictEqual(data.user.name, 'Harsh Jha');

    accountAUser = data.user;
  });

  // Test 2: Save Data for Account A
  await it('Save custom goals and study hours for Account A', async () => {
    const goalId = uuidv4();
    await query(
      'INSERT INTO goals (id, user_id, goal_description, target_date, progress_percentage, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [goalId, accountAUser.id, 'Account A Goal: Master AI/ML Pipelines', '2026-12-31', 40, 'active']
    );

    const goalsRes = await query('SELECT * FROM goals WHERE user_id = $1', [accountAUser.id]);
    assert.strictEqual(goalsRes.rows.length, 1);
    assert.strictEqual(goalsRes.rows[0].goal_description, 'Account A Goal: Master AI/ML Pipelines');
  });

  // Test 3: Account B Login
  let accountBUser = null;
  await it('Account B (125harsh6001@sjcem.edu.in) Google login creates completely distinct account', async () => {
    const { req, res } = createMockReqRes({
      email: '125harsh6001@sjcem.edu.in',
      name: 'Harsh Jha SJCEM',
      sub: 'google_sub_sjcem_6001'
    });

    await googleLogin(req, res);
    assert.strictEqual(res.getStatusCode(), 200);
    const data = res.getData();
    assert.ok(data.token);
    assert.strictEqual(data.user.email, '125harsh6001@sjcem.edu.in');
    assert.notStrictEqual(data.user.id, accountAUser.id, 'Account B must have a unique user ID');

    accountBUser = data.user;
  });

  // Test 4: Verify Account B has zero data from Account A
  await it('Account B has completely isolated database data (cannot access Account A data)', async () => {
    const accountBGoals = await query('SELECT * FROM goals WHERE user_id = $1', [accountBUser.id]);
    assert.strictEqual(accountBGoals.rows.length, 0, 'Account B must not see any goals created by Account A');
  });

  // Test 5: Account C Login
  await it('Account C (virat100cent@gmail.com) Google login creates isolated 3rd account', async () => {
    const { req, res } = createMockReqRes({
      email: 'virat100cent@gmail.com',
      name: 'Virat Kohli',
      sub: 'google_sub_virat_100'
    });

    await googleLogin(req, res);
    assert.strictEqual(res.getStatusCode(), 200);
    const data = res.getData();
    assert.strictEqual(data.user.email, 'virat100cent@gmail.com');
    assert.notStrictEqual(data.user.id, accountAUser.id);
    assert.notStrictEqual(data.user.id, accountBUser.id);
  });

  // Test 6: Account A Re-login -> Verifies no duplicate created & original data is 100% restored!
  await it('Account A re-login finds existing record (no duplicates) and restores original data', async () => {
    const userCountBefore = (await query('SELECT COUNT(*) as count FROM users WHERE email = $1', ['harshjha101ab@gmail.com'])).rows[0].count;

    const { req, res } = createMockReqRes({
      email: 'harshjha101ab@gmail.com',
      sub: 'google_sub_harsh_101'
    });

    await googleLogin(req, res);
    assert.strictEqual(res.getStatusCode(), 200);
    const data = res.getData();
    assert.strictEqual(data.user.id, accountAUser.id, 'Must return the same persistent user ID');
    assert.strictEqual(data.user.email, 'harshjha101ab@gmail.com');

    const userCountAfter = (await query('SELECT COUNT(*) as count FROM users WHERE email = $1', ['harshjha101ab@gmail.com'])).rows[0].count;
    assert.strictEqual(Number(userCountAfter), Number(userCountBefore), 'No duplicate accounts allowed');

    const restoredGoals = await query('SELECT * FROM goals WHERE user_id = $1', [data.user.id]);
    assert.strictEqual(restoredGoals.rows.length, 1);
    assert.strictEqual(restoredGoals.rows[0].goal_description, 'Account A Goal: Master AI/ML Pipelines');
  });

  // Test 7: Onboarding Questionnaire Completion & is_onboarded Flag
  await it('Completes onboarding questionnaire, updates target_role, skills, and sets is_onboarded to true', async () => {
    const { req: loginReq, res: loginRes } = createMockReqRes({
      email: 'onboarding_test@gmail.com',
      name: 'Onboarding Tester',
      sub: 'google_sub_onboard_test'
    });
    await googleLogin(loginReq, loginRes);
    const testUser = loginRes.getData().user;
    assert.strictEqual(testUser.is_onboarded, false, 'New user must start with is_onboarded: false');

    const { req: onboardReq, res: onboardRes } = createMockReqRes(
      {
        target_role: 'Cloud Solutions Architect',
        dream_companies: 'AWS, Google Cloud',
        university_name: 'Stanford University',
        branch: 'Computer Systems',
        phone_number: '+1 555-0199',
        available_study_minutes: 90,
        current_skills: ['AWS', 'Docker', 'Kubernetes', 'Python'],
        daily_study_hours: 2,
        preferred_language: 'en'
      },
      testUser
    );

    await saveOnboarding(onboardReq, onboardRes);
    assert.strictEqual(onboardRes.getStatusCode(), 200);
    const onboardedUser = onboardRes.getData().user;
    assert.strictEqual(onboardedUser.is_onboarded, true, 'is_onboarded must be true after saving onboarding');
    assert.strictEqual(onboardedUser.target_role, 'Cloud Solutions Architect');
    assert.strictEqual(onboardedUser.university_name, 'Stanford University');
    assert.strictEqual(onboardedUser.available_study_minutes, 90);
    assert.ok(onboardedUser.skills_inventory.length > 0, 'Skills inventory should be populated');
  });

  // Test 8: Rejection of Invalid / Missing Email
  await it('Rejects empty or invalid authentication payloads with real HTTP 400 error', async () => {
    const { req, res } = createMockReqRes({ email: '' });
    await googleLogin(req, res);
    assert.strictEqual(res.getStatusCode(), 400);
    assert.ok(res.getData().error, 'Must provide clear error message');
  });

  console.log('\n==================================================');
  console.log('📊 GOOGLE AUTH TEST SUMMARY: ' + totalPassed + ' Passed, ' + totalFailed + ' Failed');
  console.log('==================================================\n');
  if (totalFailed > 0) process.exit(1);
}

run();
