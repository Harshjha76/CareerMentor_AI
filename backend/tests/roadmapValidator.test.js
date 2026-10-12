/**
 * CareerPilot AI — Anti-Repetition Roadmap Validator Test Suite
 *
 * Verifies:
 * 1. Known-bad repetitive plans fail the validator with similarity >= 0.50 and banned phrase flags.
 * 2. Varied, progressive plans pass the validator with similarity < 0.50.
 * 3. 3 mandatory sample domains:
 *    - Data Analyst & SQL (12 weeks)
 *    - DSA in Java (8 weeks)
 *    - UI / UX & Product Design (6 weeks)
 *    all produce max pairwise Jaccard similarity < 0.50 across all days.
 * 4. Prints clean repetition summary report.
 */

import { generateProgressiveRoadmap, validateRoadmapQuality } from '../src/services/curriculumEngine.js';

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

console.log('\n🧪 RUNNING ANTI-REPETITION ROADMAP VALIDATOR TEST SUITE\n');

// --------------------------------------------------------------------------
// TEST 1: KNOWN-BAD REPETITIVE PLAN MUST FAIL VALIDATOR
// --------------------------------------------------------------------------
console.log('📌 Test 1: Known-Bad Repetitive Plan Rejection');

const knownBadPlan = [
  {
    week_number: 1,
    title: 'Week 1: Fundamentals of Python',
    tasks: [
      {
        day_number: 1,
        title: 'Theoretical Deep Dive: Variables & Types',
        topic: 'Theoretical Deep Dive: Variables & Types',
        done_when: 'Successfully completed Variables with verified test cases and documented notes.',
        exercise: 'Theoretical Deep Dive into memory layout.',
        subtasks: [
          { name: 'Theoretical Deep Dive: Variables', duration_minutes: 24 },
          { name: 'Hands-On Implementation & Unit Testing', duration_minutes: 21 },
          { name: 'Benchmarking, Code Review & Synthesis', duration_minutes: 15 }
        ],
        newConcepts: ['Variables']
      },
      {
        day_number: 2,
        title: 'Theoretical Deep Dive: Control Flow',
        topic: 'Theoretical Deep Dive: Control Flow',
        done_when: 'Successfully completed Control Flow with verified test cases and documented notes.',
        exercise: 'Theoretical Deep Dive into branching logic.',
        subtasks: [
          { name: 'Theoretical Deep Dive: Control Flow', duration_minutes: 24 },
          { name: 'Hands-On Implementation & Unit Testing', duration_minutes: 21 },
          { name: 'Benchmarking, Code Review & Synthesis', duration_minutes: 15 }
        ],
        newConcepts: ['Control Flow']
      }
    ]
  },
  {
    week_number: 2,
    title: 'Week 2: Advanced Python',
    tasks: [
      {
        day_number: 1,
        title: 'Theoretical Deep Dive: Functions & Lambdas',
        topic: 'Theoretical Deep Dive: Functions & Lambdas',
        done_when: 'Successfully completed Functions with verified test cases and documented notes.',
        exercise: 'Theoretical Deep Dive into call stacks.',
        subtasks: [
          { name: 'Theoretical Deep Dive: Functions', duration_minutes: 24 },
          { name: 'Hands-On Implementation & Unit Testing', duration_minutes: 21 },
          { name: 'Benchmarking, Code Review & Synthesis', duration_minutes: 15 }
        ],
        newConcepts: ['Variables'] // intentional duplicate in concept ledger!
      }
    ]
  }
];

const badValidation = validateRoadmapQuality(knownBadPlan, { maxAllowedSimilarity: 0.50, checkLedger: true });

assert(badValidation.isValid === false, 'Known-bad repetitive plan correctly rejected by validator');
assert(badValidation.maxSimilarity >= 0.50, `Pairwise similarity correctly detected high repetition (${(badValidation.maxSimilarity * 100).toFixed(1)}% >= 50%)`);
const hasBannedPhraseViolation = badValidation.violations.some(v => v.type === 'BANNED_PHRASE');
assert(hasBannedPhraseViolation, 'Validator flags banned generic phrases ("Theoretical Deep Dive", "Hands-On Implementation")');
const hasConceptDuplication = badValidation.violations.some(v => v.type === 'CONCEPT_DUPLICATION');
assert(hasConceptDuplication, 'Validator flags concept duplication in concept ledger without revision tag');

// --------------------------------------------------------------------------
// TEST 2: KNOWN-GOOD VARIED PLAN MUST PASS VALIDATOR
// --------------------------------------------------------------------------
console.log('\n📌 Test 2: Known-Good Varied Plan Acceptance');

const sampleVariedPlan = generateProgressiveRoadmap('DSA in Java', 4, 60);
const goodValidation = validateRoadmapQuality(sampleVariedPlan, { maxAllowedSimilarity: 0.50, checkLedger: true });

assert(goodValidation.isValid === true, 'Known-good varied plan passes validator');
assert(goodValidation.maxSimilarity < 0.50, `Max pairwise similarity is strictly under 0.50 (actual: ${goodValidation.maxSimilarity})`);
assert(goodValidation.violations.length === 0, 'Zero violations reported for properly varied plan');

// --------------------------------------------------------------------------
// TEST 3: MANDATORY 3 DOMAINS & REPETITION REPORT
// --------------------------------------------------------------------------
console.log('\n📌 Test 3: Mandatory 3 Sample Domains Evaluation (<0.50 Max Similarity)');

const sampleDomains = [
  { name: 'Data Analyst & SQL', weeks: 12 },
  { name: 'DSA in Java', weeks: 8 },
  { name: 'UI / UX & Product Design', weeks: 6 }
];

const repetitionReport = [];

sampleDomains.forEach(domainSpec => {
  const roadmap = generateProgressiveRoadmap(domainSpec.name, domainSpec.weeks, 60);
  const result = validateRoadmapQuality(roadmap, { maxAllowedSimilarity: 0.50, checkLedger: true });

  assert(result.isValid === true, `[${domainSpec.name}] (${domainSpec.weeks} Weeks) generated valid roadmap`);
  assert(result.maxSimilarity < 0.50, `[${domainSpec.name}] max pairwise similarity is ${result.maxSimilarity} (< 0.50 threshold)`);

  repetitionReport.push({
    domain: domainSpec.name,
    weeks: domainSpec.weeks,
    totalDays: result.totalDays,
    maxSimilarity: result.maxSimilarity,
    highestPair: `${result.maxPair?.dayA} ↔ ${result.maxPair?.dayB}`,
    status: result.isValid ? 'PASSED (Unique)' : 'FAILED'
  });
});

// --------------------------------------------------------------------------
// SUMMARY REPETITION REPORT
// --------------------------------------------------------------------------
console.log('\n' + '='.repeat(80));
console.log('📊 CAREERPILOT AI — ROADMAP REPETITION & DIVERSITY AUDIT REPORT');
console.log('='.repeat(80));
console.table(repetitionReport);
console.log('='.repeat(80));

console.log(`\nTest Results: ${passed} Passed, ${failed} Failed`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL ROADMAP VALIDATOR TESTS PASSED WITH 0 WARNINGS!\n');
  process.exit(0);
}
