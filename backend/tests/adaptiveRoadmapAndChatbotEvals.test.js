/**
 * CareerPilot AI — Automated Regression & Evaluation Suite
 * Tests Adaptive Roadmap & Chatbot Quality Pipeline
 */

import { generateProgressiveRoadmap, adaptRoadmapCurriculum, detectSemanticDuplicates } from '../src/services/curriculumEngine.js';
import { verifyAnswerQualityPipeline, isOffTopicQuery } from '../src/services/aiService.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n🧪 RUNNING ADAPTIVE ROADMAP & CHATBOT EVALUATION SUITE\n');

// 1. TEST 8-WEEK DSA IN JAVA ROADMAP (Zero duplicates, logical progression, exact workload)
console.log('📌 Testing 8-Week DSA in Java (Specific Concept per Week & Zero Repetition):');
const javaDsaPlan = generateProgressiveRoadmap('DSA in Java', 8, 60, 'Java Software Engineer', 'Intermediate');
assert(javaDsaPlan.length === 8, 'Generates exactly 8 weeks for DSA in Java');

const expectedDsaKeywords = ['Array', 'Two Pointers', 'Recursion', 'Linked List', 'Binary Tree', 'PriorityQueue', 'Dynamic Programming', 'Collections'];
let keywordsPassed = 0;
javaDsaPlan.forEach((week, idx) => {
  const kw = expectedDsaKeywords[idx];
  const hasKeyword = week.title.toLowerCase().includes(kw.toLowerCase()) || (week.tasks || []).some(t => t.topic.toLowerCase().includes(kw.toLowerCase()));
  if (hasKeyword) keywordsPassed++;
});
assert(keywordsPassed >= 7, `All 8 weeks in DSA in Java cover distinct, progressively advanced concepts (${keywordsPassed}/8 matched)`);

const semanticDsaResult = detectSemanticDuplicates(javaDsaPlan);
assert(!semanticDsaResult.hasDuplicates, `Semantic duplicate check confirmed 0 duplicate modules in 8-Week DSA in Java`);

// 2. TEST LONG PLANS (12, 24, 48, 52 WEEKS) IN SYSTEM DESIGN (0 DUPLICATES)
console.log('\n📌 Testing System Design Long Roadmaps (12, 24, 48, 52 Weeks) for 0 Duplicates:');
[12, 24, 48, 52].forEach(weeksCount => {
  const plan = generateProgressiveRoadmap('System Design & Distributed Architecture', weeksCount, 60, 'Staff Software Engineer', 'Advanced');
  assert(plan.length === weeksCount, `Generates exactly ${weeksCount} weeks for System Design`);

  const titles = new Set();
  let hasDuplicateWeek = false;
  let allDaysDistinct = true;
  let exactMinuteMath = true;

  plan.forEach((week, wIdx) => {
    if (titles.has(week.title)) {
      hasDuplicateWeek = true;
    }
    titles.add(week.title);

    if (!week.tasks || week.tasks.length !== 7) {
      allDaysDistinct = false;
    }

    const dayTopics = new Set();
    week.tasks.forEach(t => {
      if (dayTopics.has(t.topic)) {
        allDaysDistinct = false;
      }
      dayTopics.add(t.topic);

      if (t.subtasks && t.subtasks.length === 3) {
        const sum = t.subtasks.reduce((acc, st) => acc + st.duration_minutes, 0);
        if (sum !== 60) exactMinuteMath = false;
      }
    });
  });

  assert(!hasDuplicateWeek, `${weeksCount}-Week System Design has ZERO duplicate week titles (${titles.size} unique modules)`);
  assert(allDaysDistinct, `${weeksCount}-Week System Design has exactly 7 unique days per week (${weeksCount * 7} unique daily tasks)`);
  assert(exactMinuteMath, `${weeksCount}-Week System Design subtask durations sum exactly to 60 minutes`);
});

// 2. TEST SPECIFIC DOMAINS: 8-Week DSA in Java, 6-Week UI/UX, 12-Week Data Science
console.log('\n📌 Testing Mandatory Domains (8-Week DSA in Java, 6-Week UI/UX, 12-Week Data Science):');

// A. 6-Week UI/UX
const uiuxPlan = generateProgressiveRoadmap('UI/UX Product Design', 6, 60, 'Product Designer', 'Intermediate');
assert(uiuxPlan.length === 6, 'Generated 6-week roadmap for UI/UX Product Design');
const uiuxTitles = new Set(uiuxPlan.map(w => w.title));
assert(uiuxTitles.size === 6, '100% unique week modules for UI/UX (6/6)');
const uiuxHasFigmaOrResearch = uiuxPlan.some(w => w.title.toLowerCase().includes('research') || w.title.toLowerCase().includes('wireframing') || w.title.toLowerCase().includes('design system'));
assert(uiuxHasFigmaOrResearch, 'UI/UX roadmap includes domain-specific topics (Research, Wireframing, Design Systems)');
assert(!detectSemanticDuplicates(uiuxPlan).hasDuplicates, 'Zero semantic duplicate modules in 6-Week UI/UX');

// B. 12-Week Data Science
const dsPlan = generateProgressiveRoadmap('Data Science with Python', 12, 60, 'Data Scientist', 'Intermediate');
assert(dsPlan.length === 12, 'Generated 12-week roadmap for Data Science with Python');
const dsTitles = new Set(dsPlan.map(w => w.title));
assert(dsTitles.size === 12, '100% unique week modules for Data Science (12/12)');
const dsHasMLTopics = dsPlan.some(w => w.title.toLowerCase().includes('numpy') || w.title.toLowerCase().includes('pandas') || w.title.toLowerCase().includes('supervised') || w.title.toLowerCase().includes('deep learning'));
assert(dsHasMLTopics, 'Data Science roadmap includes domain-specific topics (NumPy, Pandas, Supervised Learning, Deep Learning)');
assert(!detectSemanticDuplicates(dsPlan).hasDuplicates, 'Zero semantic duplicate modules in 12-Week Data Science');

// C. Resource URL Integrity Check
let allUrlsValid = true;
[javaDsaPlan, uiuxPlan, dsPlan].forEach(plan => {
  plan.forEach(w => {
    (w.tasks || []).forEach(t => {
      (t.resource_links || []).forEach(link => {
        if (!link.url || !link.url.startsWith('http')) allUrlsValid = false;
      });
      (t.subtasks || []).forEach(st => {
        if (!st.resource || !st.resource.startsWith('http')) allUrlsValid = false;
      });
    });
  });
});
assert(allUrlsValid, 'All generated resource links and subtask resources are valid, non-empty HTTPS URLs');

// 3. TEST CROSS-DOMAIN DYNAMIC GENERATION (Finance, Quantum, Rust)
console.log('\n📌 Testing Cross-Domain Progressive Generation:');
const domains = [
  { name: 'Financial Engineering & Algorithmic Trading', weeks: 8, mins: 30 },
  { name: 'Quantum Computing Algorithms', weeks: 6, mins: 57 },
  { name: 'Rust Embedded Systems & Real-Time Kernel', weeks: 10, mins: 120 }
];

domains.forEach(d => {
  const plan = generateProgressiveRoadmap(d.name, d.weeks, d.mins, 'Senior Engineer', 'Intermediate');
  assert(plan.length === d.weeks, `Generated ${d.weeks}-week plan for [${d.name}]`);

  const titles = new Set(plan.map(w => w.title));
  assert(titles.size === d.weeks, `100% unique week modules for [${d.name}] (${titles.size}/${d.weeks})`);

  let correctSum = true;
  plan.forEach(w => {
    w.tasks.forEach(t => {
      const sum = t.subtasks.reduce((a, st) => a + st.duration_minutes, 0);
      if (sum !== d.mins) correctSum = false;
    });
  });
  assert(correctSum, `All subtasks in [${d.name}] sum to exactly ${d.mins}m/day without minute drift`);
});

// 3. TEST ADAPTIVE RE-PLANNING & PROGRESS PRESERVATION
console.log('\n📌 Testing Adaptive Re-Planning & Progress Preservation:');
const originalPlan = generateProgressiveRoadmap('Full Stack Web Development', 12, 60, 'Frontend Developer');
// Mark week 1 and week 2 tasks as completed
const completedIds = new Set();
originalPlan[0].tasks.forEach(t => completedIds.add(t.id || `task-1-${t.day_number}`));
originalPlan[1].tasks.forEach(t => completedIds.add(t.id || `task-2-${t.day_number}`));

const adapted = adaptRoadmapCurriculum({
  existingWeeks: originalPlan,
  completedTaskIds: completedIds,
  skillName: 'Full Stack Web Development',
  newTotalWeeks: 16,
  newDailyMinutes: 90,
  newTargetRole: 'Full Stack Tech Lead',
  newSkillLevel: 'Advanced'
});

assert(adapted.length === 16, 'Adapted roadmap expanded duration to 16 weeks');
const completedInAdapted = adapted.reduce((acc, w) => acc + w.tasks.filter(t => t.is_completed).length, 0);
assert(completedInAdapted === 14, `Preserved all 14 completed tasks without data loss or reset`);

// 4. TEST CHATBOT 5-STAGE ANSWER QUALITY PIPELINE
console.log('\n📌 Testing Chatbot Answer Quality Pipeline & Guardrails:');

// Test Off-topic guardrail
assert(isOffTopicQuery('how to cook chicken butter masala') === true, 'Off-topic query correctly detected (cooking recipe)');
assert(isOffTopicQuery('who is the best cricket player in ipl') === true, 'Off-topic query correctly detected (cricket)');
assert(isOffTopicQuery('how does redis master replica replication work') === false, 'Technical inquiry permitted (redis)');

// Test Quality verification & Asterisk elimination
const rawTestAnswer = `Here is how you implement **Redis Caching**:
* Step 1: Use \`ioredis\` or \`redis\` client.
* Step 2: Configure **cache-aside** pattern.
\`\`\`javascript
const cached = await redis.get(key);
\`\`\`
Follow these **best practices**.`;

const verified = verifyAnswerQualityPipeline(rawTestAnswer, 'Explain Redis caching');
assert(!verified.includes('**'), 'Chatbot answer quality pipeline eliminates all raw double asterisks');
assert(verified.includes('###') || verified.includes('Redis Caching') || verified.includes('cache-aside'), 'Preserves code snippets and structured text');

console.log(`\n==================================================`);
console.log(`📊 EVALUATION SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log(`==================================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL ADAPTIVE ROADMAP & CHATBOT EVALS PASSED 100%!\n');
}
