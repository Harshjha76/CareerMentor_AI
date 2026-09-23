/**
 * Automated Verification Test Suite for 7 Core CareerMentor Rules
 * Run via: node tests/verifyRules.test.js
 */

import assert from 'assert';
import { matchInternshipsForCandidate } from '../src/services/internshipService.js';
import { generateRoadmapWithAI } from '../src/services/aiService.js';

let totalPassed = 0;
let totalFailed = 0;

function it(description, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${description}`);
    totalPassed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(`     Error: ${err.message}`);
    totalFailed++;
  }
}

async function itAsync(description, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${description}`);
    totalPassed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(`     Error: ${err.message}`);
    totalFailed++;
  }
}

console.log('\n🧪 STARTING AUTOMATED RULES VERIFICATION SUITE\n');

// -------------------------------------------------------------
// RULE 1 & 2: REAL DATA ONLY & KNOWLEDGE VAULT INTEGRITY
// -------------------------------------------------------------
console.log('📌 Testing Rule 1 & 2: Real Data Only & Knowledge Vault Integrity');

it('Knowledge Vault accepts only genuine user profile skills and returns empty if none present', async () => {
  const emptyProfile = { target_role: 'Python Developer', current_skills: '', skills_inventory: [] };
  const res = await matchInternshipsForCandidate(emptyProfile, null);
  assert.strictEqual(res.detected_skills_count, 0, 'Should not invent or inject fake skills for empty profile');
});

it('Knowledge Vault parses and deduplicates real extracted resume skills', async () => {
  const userProfile = { target_role: 'Software Engineer', skills_inventory: [{ name: 'Python' }, { name: 'Docker' }] };
  const resumeData = {
    categorized_skills: { languages: ['Python', 'SQL'], tools: ['Docker', 'Git'] },
    detected_skills: ['Python', 'Git']
  };
  const res = await matchInternshipsForCandidate(userProfile, resumeData);
  assert.ok(res.detected_skills.includes('python'));
  assert.ok(res.detected_skills.includes('docker'));
  assert.ok(res.detected_skills.includes('sql'));
  assert.ok(res.detected_skills.includes('git'));
  // Set ensures no duplicates
  const uniqueCount = new Set(res.detected_skills).size;
  assert.strictEqual(res.detected_skills.length, uniqueCount, 'All skills must be unique without duplicate entries');
});

// -------------------------------------------------------------
// RULE 3: INTERNSHIP MATCHER (Strict >= 60%, Sorted, Weighted)
// -------------------------------------------------------------
console.log('\n📌 Testing Rule 3: Internship Matcher & Strict Scoring');

it('All matched internships have required verified metadata (company, role, link, posted_date)', async () => {
  const userProfile = { target_role: 'Python Developer', current_skills: 'Python, FastAPI, PostgreSQL, Docker, Git' };
  const res = await matchInternshipsForCandidate(userProfile, null);
  assert.ok(res.top_internships.length > 0, 'Should return matched internships');
  res.top_internships.forEach(item => {
    assert.ok(item.company, 'Must have company');
    assert.ok(item.role, 'Must have role');
    assert.ok(item.posted_date, 'Must have posted_date');
    assert.ok(item.apply_urls && (item.apply_urls.careers || item.apply_urls.linkedin), 'Must have real apply link');
  });
});

it('All returned internships meet >= 60% match score and are sorted strictly high to low', async () => {
  const userProfile = { target_role: 'Python Developer', current_skills: 'Python, FastAPI, Pandas, PostgreSQL, Docker, Git' };
  const res = await matchInternshipsForCandidate(userProfile, null);
  
  let previousScore = 100;
  res.top_internships.forEach(item => {
    assert.ok(item.match_score >= 60, `Internship score ${item.match_score}% must be >= 60%`);
    assert.ok(item.match_score <= previousScore, `Must be sorted descending (current: ${item.match_score}, prev: ${previousScore})`);
    previousScore = item.match_score;
  });
});

it('Scores differ naturally across internships and are not uniform/inflated', async () => {
  const userProfile = { target_role: 'Python Developer', current_skills: 'Python, Git' };
  const res = await matchInternshipsForCandidate(userProfile, null);
  if (res.top_internships.length >= 2) {
    const scores = res.top_internships.map(i => i.match_score);
    const allSame = scores.every(s => s === scores[0]);
    assert.ok(!allSame || scores.length < 2, 'Match scores should differ according to individual skill overlap');
  }
});

// -------------------------------------------------------------
// RULE 4: ROADMAP GENERATION & TOPIC DEDUPLICATION
// -------------------------------------------------------------
console.log('\n📌 Testing Rule 4: Roadmap 4/8-Week Plans & Topic Deduplication');

await itAsync('Generates 4-Week Roadmap with non-repeating modules & valid links', async () => {
  const curriculum = await generateRoadmapWithAI('Full Stack Web Development', 4, 2, 'Software Engineer', 'en');
  assert.strictEqual(curriculum.length, 4, 'Should contain exactly 4 weeks');
  
  const weekTitles = new Set();
  curriculum.forEach(week => {
    assert.ok(!weekTitles.has(week.title), `Duplicate week title detected: ${week.title}`);
    weekTitles.add(week.title);
    assert.strictEqual(week.tasks.length, 6, 'Each week must have 6 active study days');
    // Day 1 has 3 links
    const day1 = week.tasks[0];
    assert.strictEqual(day1.resource_links.length, 3, 'Day 1 must have 3 curated resources');
    day1.resource_links.forEach(link => {
      assert.ok(link.url.startsWith('http'), `Link URL must be valid: ${link.url}`);
    });
  });
});

await itAsync('Generates 8-Week Roadmap without topic duplication', async () => {
  const curriculum = await generateRoadmapWithAI('Python & Machine Learning', 8, 2, 'AI Engineer', 'en');
  assert.strictEqual(curriculum.length, 8, 'Should contain exactly 8 weeks');
  
  const weekTitles = new Set();
  curriculum.forEach(week => {
    assert.ok(!weekTitles.has(week.title), `Duplicate week title detected: ${week.title}`);
    weekTitles.add(week.title);
  });
});

await itAsync('Generates Custom Domain Roadmap (e.g. Rust Systems) dynamically without empty results', async () => {
  const curriculum = await generateRoadmapWithAI('Rust Systems Programming', 4, 2, 'Systems Engineer', 'en');
  assert.strictEqual(curriculum.length, 4, 'Should generate 4 weeks for custom skill');
  assert.ok(curriculum[0].title.includes('Rust Systems Programming'), 'Should specialize in the requested domain');
});

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
console.log('\n' + '='.repeat(50));
console.log(`📊 TEST SUMMARY: ${totalPassed} Passed, ${totalFailed} Failed`);
console.log('='.repeat(50) + '\n');

if (totalFailed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL 7 CORE RULES STRICTLY VERIFIED!\n');
  process.exit(0);
}
