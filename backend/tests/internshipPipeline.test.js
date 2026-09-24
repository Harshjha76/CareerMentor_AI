import {
  matchInternshipsForCandidate,
  calculateMatchScore,
  normalizeSkill,
  expandRoleQueries
} from '../src/services/internshipService.js';

async function runPipelineTests() {
  console.log('\n================================================================');
  console.log('🧪 RUNNING INTERNSHIP PIPELINE STEP 1 & STEP 3 VERIFICATION');
  console.log('================================================================\n');

  // STEP 3 TEST: 3 Fake fixtures for deterministic scoring function
  console.log('📌 STEP 3: Testing Deterministic Scoring Function on 3 Fixtures');
  const candidateFixture = {
    target_role: 'AI/ML Intern',
    skills: ['Python', 'PyTorch', 'Machine Learning', 'Git'],
    preferred_mode: 'Remote'
  };

  const fixtureA = {
    role: 'AI/ML Engineering Intern',
    company: 'Test AI Labs',
    work_mode: 'Remote',
    required_skills: ['Python', 'PyTorch', 'Machine Learning', 'Git'],
    nice_to_have_skills: ['Docker'],
    description: 'Build neural network models and training pipelines.'
  };

  const fixtureB = {
    role: 'Data Science & Analytics Intern',
    company: 'Test Analytics Co',
    work_mode: 'Hybrid',
    required_skills: ['Python', 'SQL', 'Pandas', 'Statistics'],
    nice_to_have_skills: ['Machine Learning'],
    description: 'Data reporting and SQL queries.'
  };

  const fixtureC = {
    role: 'Frontend Web Development Intern',
    company: 'Test Web Inc',
    work_mode: 'On-site',
    required_skills: ['React', 'JavaScript', 'HTML', 'CSS'],
    nice_to_have_skills: ['TypeScript'],
    description: 'UI components in React.'
  };

  const scoreA = calculateMatchScore(candidateFixture, fixtureA);
  const scoreB = calculateMatchScore(candidateFixture, fixtureB);
  const scoreC = calculateMatchScore(candidateFixture, fixtureC);

  console.log(`   - Fixture A (High Fit: AI/ML with matching skills): ${scoreA.match_score}%`);
  console.log(`   - Fixture B (Partial Fit: Data Science with partial skills): ${scoreB.match_score}%`);
  console.log(`   - Fixture C (Low Fit: Frontend Web with zero skills): ${scoreC.match_score}%`);

  if (scoreA.match_score > scoreB.match_score && scoreB.match_score > scoreC.match_score) {
    console.log('   ✅ PASS: Fixture scores differ naturally and monotonically based on overlap & role fit.\n');
  } else {
    throw new Error('Scoring did not produce distinct monotonic scores across fixtures!');
  }

  // STEP 1 RUN FOR 3 TARGET ROLES
  const testRoles = [
    {
      role: 'AI/ML Intern',
      profile: { target_role: 'AI/ML Intern', skills: ['Python', 'PyTorch', 'Machine Learning', 'Git', 'Linux'] }
    },
    {
      role: 'Data Science Intern',
      profile: { target_role: 'Data Science Intern', skills: ['Python', 'SQL', 'Pandas', 'Statistics', 'Git'] }
    },
    {
      role: 'Web Development Intern',
      profile: { target_role: 'Web Development Intern', skills: ['React', 'JavaScript', 'Node.js', 'HTML', 'CSS', 'Git'] }
    }
  ];

  const summaryTable = [];

  for (const testCase of testRoles) {
    console.log(`----------------------------------------------------------------`);
    console.log(`▶ Executing Pipeline for: "${testCase.role}"`);
    console.log(`----------------------------------------------------------------`);
    const result = await matchInternshipsForCandidate(testCase.profile);

    const stats = result.pipeline_stats;
    summaryTable.push({
      Role: testCase.role,
      'Raw Fetched': stats.stage_counts.raw_fetched,
      'Normalized': stats.stage_counts.normalized,
      'Deduped': stats.stage_counts.deduplicated,
      'Expiry Filtered': stats.stage_counts.expiry_filtered,
      'Link Validated': stats.stage_counts.link_validated,
      'Score Min/Med/Max': `${stats.score_distribution.min}% / ${stats.score_distribution.median}% / ${stats.score_distribution.max}%`,
      '>= 60% (Passed)': stats.stage_counts.passed_60_percent,
      '< 60% (Below)': stats.stage_counts.below_60_percent
    });

    console.log(`Top Matched Openings (${result.top_internships.length}):`);
    result.top_internships.slice(0, 3).forEach((item, i) => {
      console.log(`   ${i + 1}. [${item.match_score}%] ${item.company} - ${item.role} (${item.work_mode}, ${item.location})`);
      console.log(`      Source: ${item.source} | Apply: ${item.apply_url}`);
      console.log(`      Matched Skills: ${item.matching_skills.join(', ')}`);
      console.log(`      Missing Skills: ${item.missing_skills.join(', ')}`);
    });
    console.log('\n');
  }

  console.log('================================================================');
  console.log('📊 STEP 1: PIPELINE STAGE COUNTS TABLE FOR 3 TARGET ROLES');
  console.log('================================================================');
  console.table(summaryTable);
  console.log('\n🎉 Verification completed successfully.\n');
}

runPipelineTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
