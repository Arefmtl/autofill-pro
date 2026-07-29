// AutoFill Pro — TDD Tests: New Features
// Run: node tests/test-features-v2.js

const assert = require('assert');

// Import modules
const { InterviewPrep } = require('../content/interview-prep.js');
const { SkillGapAnalysis } = require('../content/skill-gap.js');
const { Dashboard } = require('../content/dashboard.js');
const { SalaryBenchmark } = require('../content/salary-benchmark.js');
const { ATSVerification } = require('../content/ats-verification.js');
const { DrafterReviewer } = require('../content/drafter-reviewer.js');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.log(`  ❌ ${name}: ${e.message}`); }
}

// ==================== INTERVIEW PREP ====================
console.log('\n📋 INTERVIEW PREP');

test('stage questions exist', () => {
  assert.ok(InterviewPrep.stageQuestions.phone.length > 0);
  assert.ok(InterviewPrep.stageQuestions.technical.length > 0);
  assert.ok(InterviewPrep.stageQuestions.behavioral.length > 0);
  assert.ok(InterviewPrep.stageQuestions.final.length > 0);
});

test('match STAR to question', () => {
  InterviewPrep.starExamples = [
    { id: 'star-1', tags: ['problem-solving', 'coding'], action: 'Built system', result: '50% faster' },
  ];
  const question = { q: 'Tell me about a problem', tags: ['problem-solving', 'technical'] };
  const { star, score } = InterviewPrep.matchSTAR(question);
  assert.ok(star);
  assert.ok(score > 0);
});

test('generate prep pack', () => {
  const pack = InterviewPrep.generatePrepPack('phone', 'Google', 'SWE');
  assert.strictEqual(pack.company, 'Google');
  assert.strictEqual(pack.stage, 'phone');
  assert.ok(pack.questions.length > 0);
  assert.ok(pack.questions[0].tips.length > 0);
});

test('tips for category', () => {
  const tips = InterviewPrep.getTips('motivation');
  assert.ok(tips.length > 0);
  assert.ok(tips[0].includes('company'));
});

// ==================== SKILL GAP ====================
console.log('\n🎯 SKILL GAP ANALYSIS');

test('extract skills from job', () => {
  const job = { description: 'Python and React required' };
  const skills = SkillGapAnalysis.extractSkillsFromJob(job);
  assert.ok(skills.includes('python'));
  assert.ok(skills.includes('react'));
});

test('calculate gap score', () => {
  const job = { fitRating: 30 };
  const score = SkillGapAnalysis.calculateGapScore(job);
  assert.strictEqual(score, 0.7);
});

test('pass 1 hard skill diff', () => {
  SkillGapAnalysis.profileSkills = ['Python', 'JavaScript'];
  SkillGapAnalysis.trackedJobs = [
    { description: 'Python React Docker required', fitRating: 30 },
    { description: 'JavaScript React AWS required', fitRating: 50 },
  ];
  const gaps = SkillGapAnalysis.pass1HardSkillDiff();
  assert.ok(gaps['react']);
  assert.ok(gaps['docker']);
  assert.ok(!gaps['python']); // Already in profile
});

test('get priority', () => {
  assert.strictEqual(SkillGapAnalysis.getPriority(0.8, 6), 'critical');
  assert.strictEqual(SkillGapAnalysis.getPriority(0.6, 4), 'high');
  assert.strictEqual(SkillGapAnalysis.getPriority(0.4, 2), 'medium');
  assert.strictEqual(SkillGapAnalysis.getPriority(0.2, 1), 'low');
});

test('generate learning plan', () => {
  const gaps = {
    'react': { count: 3, score: 0.6, priority: 'high' },
    'docker': { count: 5, score: 0.8, priority: 'critical' },
  };
  const plan = SkillGapAnalysis.generateLearningPlan(gaps);
  assert.ok(plan.critical.length > 0);
  assert.ok(plan.high.length > 0);
  assert.ok(plan.critical[0].resources.length > 0);
});

// ==================== DASHBOARD ====================
console.log('\n📊 DASHBOARD');

test('normalize status', () => {
  assert.strictEqual(Dashboard.normalizeStatus('applied'), 'Active');
  assert.strictEqual(Dashboard.normalizeStatus('interview'), 'Interview');
  assert.strictEqual(Dashboard.normalizeStatus('offer'), 'Offer');
  assert.strictEqual(Dashboard.normalizeStatus('hired'), 'Hired');
  assert.strictEqual(Dashboard.normalizeStatus('rejected'), 'Rejected/Closed');
});

test('compute stats', () => {
  const apps = [
    { company: 'A', role: 'SWE', status: 'applied', sector: 'Tech', channel: 'Online' },
    { company: 'B', role: 'PM', status: 'interview', sector: 'Finance', channel: 'Referral' },
    { company: 'C', role: 'SWE', status: 'hired', sector: 'Tech', channel: 'Online' },
  ];
  const stats = Dashboard.computeStats(apps);
  assert.strictEqual(stats.total, 3);
  assert.strictEqual(stats.byStatus['Active'], 1);
  assert.strictEqual(stats.byStatus['Interview'], 1);
  assert.strictEqual(stats.byStatus['Hired'], 1);
  assert.strictEqual(stats.funnel.applied, 1);
  assert.strictEqual(stats.funnel.interview, 1);
  assert.strictEqual(stats.funnel.hired, 1);
});

test('generate doughnut SVG', () => {
  const stats = { byStatus: { Active: 5, Interview: 3, Hired: 1 } };
  const svg = Dashboard.generateDoughnutSVG(stats);
  assert.ok(svg.includes('<svg'));
  assert.ok(svg.includes('<path'));
});

test('generate bar SVG', () => {
  const data = { Tech: 10, Finance: 5, Healthcare: 3 };
  const svg = Dashboard.generateBarSVG(data);
  assert.ok(svg.includes('<svg'));
  assert.ok(svg.includes('Tech'));
});

test('generate funnel SVG', () => {
  const funnel = { applied: 100, interview: 30, offer: 10, hired: 5 };
  const svg = Dashboard.generateFunnelSVG(funnel);
  assert.ok(svg.includes('<svg'));
  assert.ok(svg.includes('Applied: 100'));
});

test('generate full HTML', () => {
  const apps = [
    { company: 'A', role: 'SWE', status: 'applied', date: '2026-01-01' },
  ];
  const html = Dashboard.generateHTML(apps);
  assert.ok(html.includes('<!DOCTYPE html>'));
  assert.ok(html.includes('AutoFill Pro'));
  assert.ok(html.includes('A'));
});

test('escape HTML', () => {
  assert.strictEqual(Dashboard.escapeHTML('<script>'), '&lt;script&gt;');
  assert.strictEqual(Dashboard.escapeHTML('a&b'), 'a&amp;b');
});

// ==================== SALARY BENCHMARK ====================
console.log('\n💰 SALARY BENCHMARK');

test('normalize company name', () => {
  assert.strictEqual(SalaryBenchmark.normalize('Google A/S'), 'google');
  assert.strictEqual(SalaryBenchmark.normalize('Microsoft (Denmark)'), 'microsoft');
  assert.strictEqual(SalaryBenchmark.normalize('Novo Nordisk Group'), 'novo nordisk');
});

test('anglicize', () => {
  assert.strictEqual(SalaryBenchmark.normalize('Ørsted'), 'orsted');
  assert.strictEqual(SalaryBenchmark.normalize('Mærsk'), 'maersk');
});

test('extract core words', () => {
  const words = SalaryBenchmark.extractCoreWords('Microsoft Corporation');
  assert.ok(words.includes('microsoft'));
  assert.ok(words.includes('corporation'));
});

test('match score exact', () => {
  assert.strictEqual(SalaryBenchmark.matchScore('Google', 'Google'), 100);
});

test('match score containment', () => {
  const score = SalaryBenchmark.matchScore('Google', 'Google Denmark');
  assert.ok(score >= 80);
});

test('match score word overlap', () => {
  const score = SalaryBenchmark.matchScore('Google Search', 'Google');
  assert.ok(score >= 70);
});

test('lookup salary data', () => {
  const data = {
    metadata: { baseline_description: 'national average' },
    companies: [
      { company: 'Google', city: 'Copenhagen', categories: { tech: { index: 120 } } },
      { company: 'Microsoft', city: 'Aarhus', categories: { tech: { index: 110 } } },
    ],
  };
  const result = SalaryBenchmark.lookup('Google', 'Copenhagen', data);
  assert.strictEqual(result.results.length, 1);
  assert.strictEqual(result.results[0].company, 'Google');
});

// ==================== ATS VERIFICATION ====================
console.log('\n🔍 ATS VERIFICATION');

test('check parseability clean', () => {
  const text = 'John Doe\njohn@email.com\n+45 12345678\n2024';
  const result = ATSVerification.checkParseability(text);
  assert.ok(result.parseable);
  assert.strictEqual(result.issues.length, 0);
});

test('check parseability with CID', () => {
  const text = 'John (cid:123) Doe';
  const result = ATSVerification.checkParseability(text);
  assert.ok(!result.parseable);
  assert.ok(result.issues.some(i => i.type === 'garbage'));
});

test('extract keywords', () => {
  const jobDesc = 'Required: Python, React, Docker. Preferred: Kubernetes, AWS.';
  const keywords = ATSVerification.extractKeywords(jobDesc);
  assert.ok(keywords.some(k => k.keyword === 'python'));
  assert.ok(keywords.some(k => k.keyword === 'react'));
  assert.ok(keywords.some(k => k.keyword === 'docker'));
});

test('analyze coverage', () => {
  const keywords = [
    { keyword: 'python', priority: 'required' },
    { keyword: 'react', priority: 'required' },
    { keyword: 'java', priority: 'required' },
  ];
  const resumeText = 'Python expert with JavaScript experience';
  const coverage = ATSVerification.analyzeCoverage(keywords, resumeText);
  assert.ok(coverage.some(c => c.status === 'covered')); // python
  assert.ok(coverage.some(c => c.status === 'missing (gap)')); // java
});

test('generate report', () => {
  const jobDesc = 'Required: Python, React';
  const resumeText = 'Python expert';
  const report = ATSVerification.generateReport(jobDesc, resumeText);
  assert.ok(report.keywords.length > 0);
  assert.ok(report.stats.total > 0);
  assert.ok(report.summary.includes('Coverage'));
});

// ==================== DRAFTER-REVIEWER ====================
console.log('\n✍️ DRAFTER-REVIEWER');

test('parse job posting', () => {
  const text = 'Looking for a Software Engineer at Google in Mountain View. Required: Python, React.';
  const job = DrafterReviewer.drafter.parseJobPosting(text);
  assert.ok(job.company.includes('Google'));
  assert.ok(job.keywords.includes('python'));
});

test('extract requirements', () => {
  const text = 'Required: Python and React. Must have Docker experience.';
  const reqs = DrafterReviewer.drafter.extractRequirements(text);
  assert.ok(reqs.length > 0);
});

test('draft CV', () => {
  const profile = {
    experience: [{ highlights: ['Built Python system', 'React frontend'] }],
    skills: ['Python', 'JavaScript', 'React'],
  };
  const job = { keywords: ['python', 'react'] };
  const cv = DrafterReviewer.drafter.draftCV(profile, job);
  assert.strictEqual(cv.type, 'cv');
  assert.ok(cv.sections.length > 0);
});

test('draft cover letter', () => {
  const profile = { field: 'Software Engineering' };
  const job = { role: 'SWE', company: 'Google' };
  const cl = DrafterReviewer.drafter.draftCoverLetter(profile, job);
  assert.strictEqual(cl.type, 'cover_letter');
  assert.ok(cl.paragraphs.length === 3);
  assert.ok(cl.paragraphs[0].includes('Google'));
});

test('grounding audit passes', () => {
  const draft = { text: 'Built system in 2024' };
  const profile = { text: 'Built system in 2024' };
  const issues = DrafterReviewer.reviewer.groundingAudit(draft, profile, '', '');
  assert.strictEqual(issues.length, 0);
});

test('grounding audit fails', () => {
  const draft = { text: 'Won award in 2025' };
  const profile = { text: 'Built system' };
  const issues = DrafterReviewer.reviewer.groundingAudit(draft, profile, '', '');
  assert.ok(issues.length > 0);
});

test('generate feedback', () => {
  const auditResults = [{ claim: '2025', message: 'Not found' }];
  const companyResearch = { recentNews: ['New product launch'] };
  const feedback = DrafterReviewer.reviewer.generateFeedback({}, auditResults, companyResearch);
  assert.ok(feedback.edits.length > 0);
  assert.ok(feedback.suggestions.length > 0);
});

// ==================== SUMMARY ====================
console.log('\n' + '='.repeat(40));
console.log(`📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log('='.repeat(40));

process.exit(failed > 0 ? 1 : 0);
