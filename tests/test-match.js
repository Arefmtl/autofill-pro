// AutoFill Pro — TDD Tests: Job Detection + Match Score
// Run: node tests/test-match.js

const assert = require('assert');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`✅ ${name}`); }
  catch (e) { failed++; console.log(`❌ ${name}: ${e.message}`); }
}

// ==================== ATS DETECTION ====================
console.log('\n🔍 ATS Detection Tests:');

const ATS_DOMAINS = {
  greenhouse: ['greenhouse.io', 'grnh.se'],
  lever: ['lever.co'],
  workday: ['myworkdayjobs.com', 'workday.com'],
  ashby: ['ashbyhq.com', 'jobs.ashbyhq.com'],
  linkedin: ['linkedin.com'],
  smartrecruiters: ['smartrecruiters.com'],
  bamboohr: ['bamboohr.com'],
  icims: ['icims.com'],
  taleo: ['taleo.net', 'oracle.com/taleo'],
  workable: ['workable.com'],
  indeed: ['indeed.com'],
  glassdoor: ['glassdoor.com'],
  stepstone: ['stepstone.de', 'stepstone.at', 'stepstone.be'],
  xing: ['xing.com'],
  monster: ['monster.de', 'monster.com'],
  arbeitsagentur: ['arbeitsagentur.de'],
  personio: ['personio.de', 'personio.com'],
  recruitee: ['recruitee.com'],
  teamtailor: ['teamtailor.com'],
  jobvite: ['jobvite.com'],
  successfactors: ['successfactors.com', 'sf-cf.com']
};

function detectATS(hostname) {
  const h = hostname.toLowerCase();
  for (const [name, domains] of Object.entries(ATS_DOMAINS)) {
    if (domains.some(d => h.includes(d))) return name;
  }
  return null;
}

test('detect Greenhouse', () => {
  assert.strictEqual(detectATS('boards.greenhouse.io/jobs/123'), 'greenhouse');
});

test('detect Lever', () => {
  assert.strictEqual(detectATS('jobs.lever.co/company'), 'lever');
});

test('detect LinkedIn', () => {
  assert.strictEqual(detectATS('www.linkedin.com/jobs/view/123'), 'linkedin');
});

test('detect Indeed', () => {
  assert.strictEqual(detectATS('de.indeed.com/viewjob?q=dev'), 'indeed');
});

test('detect StepStone (German)', () => {
  assert.strictEqual(detectATS('www.stepstone.de/jobs/data-scientist'), 'stepstone');
});

test('detect Xing (German)', () => {
  assert.strictEqual(detectATS('www.xing.com/jobs/developer'), 'xing');
});

test('detect Personio (German)', () => {
  assert.strictEqual(detectATS('apply.personio.de/job/123'), 'personio');
});

test('detect Arbeitsagentur (German)', () => {
  assert.strictEqual(detectATS('www.arbeitsagentur.de/jobangebote/123'), 'arbeitsagentur');
});

test('detect unknown site', () => {
  assert.strictEqual(detectATS('www.google.com'), null);
});

test('detect empty hostname', () => {
  assert.strictEqual(detectATS(''), null);
});

// ==================== KEYWORD EXTRACTION ====================
console.log('\n📝 Keyword Extraction Tests:');

function extractKeywords(text) {
  if (!text) return { skills: [], experience: [], education: [], soft: [] };
  const lower = text.toLowerCase();
  
  const skills = [];
  const skillPatterns = [
    /\b(python|javascript|typescript|java|c\+\+|sql|r|scala|go|rust)\b/gi,
    /\b(machine learning|deep learning|data science|nlp|computer vision)\b/gi,
    /\b(react|angular|vue|node\.?js|express|django|flask|fastapi)\b/gi,
    /\b(aws|azure|gcp|docker|kubernetes|terraform|jenkins|git|linux)\b/gi
  ];
  skillPatterns.forEach(p => {
    const matches = text.match(p);
    if (matches) skills.push(...matches.map(m => m.toLowerCase()));
  });

  const expMatch = text.match(/(\d+)[\s+]?(years?|jahre?)\s+(experience|erfahrung|of experience)/gi);
  const experience = expMatch ? [expMatch[0]] : [];

  const eduKeywords = ['bachelor', 'master', 'phd', 'degree', 'university'];
  const education = eduKeywords.filter(k => lower.includes(k));

  const softKeywords = ['communication', 'teamwork', 'leadership', 'problem solving', 'analytical'];
  const soft = softKeywords.filter(k => lower.includes(k));

  return { skills: [...new Set(skills)], experience, education, soft };
}

test('extract Python skill', () => {
  const kw = extractKeywords('We need Python and JavaScript experience');
  assert.ok(kw.skills.includes('python'));
  assert.ok(kw.skills.includes('javascript'));
});

test('extract ML skills', () => {
  const kw = extractKeywords('Experience in machine learning and deep learning required');
  assert.ok(kw.skills.includes('machine learning'));
  assert.ok(kw.skills.includes('deep learning'));
});

test('extract experience years', () => {
  const kw = extractKeywords('5 years of experience required');
  assert.strictEqual(kw.experience.length, 1);
});

test('extract education', () => {
  const kw = extractKeywords('Bachelor or Master degree in Computer Science');
  assert.ok(kw.education.includes('bachelor'));
  assert.ok(kw.education.includes('master'));
});

test('extract soft skills', () => {
  const kw = extractKeywords('Strong communication and teamwork skills');
  assert.ok(kw.soft.includes('communication'));
  assert.ok(kw.soft.includes('teamwork'));
});

test('extract from German text', () => {
  const kw = extractKeywords('Python, Docker und Kubernetes Erfahrung');
  assert.ok(kw.skills.includes('python'));
  assert.ok(kw.skills.includes('docker'));
  assert.ok(kw.skills.includes('kubernetes'));
});

test('empty text', () => {
  const kw = extractKeywords('');
  assert.strictEqual(kw.skills.length, 0);
});

test('null text', () => {
  const kw = extractKeywords(null);
  assert.strictEqual(kw.skills.length, 0);
});

// ==================== MATCH SCORE ====================
console.log('\n🎯 Match Score Tests:');

function calculateMatchScore(jobData, resumeData) {
  if (!resumeData || !jobData.description) return { score: 0, matched: [], missing: [] };
  
  const jobKeywords = extractKeywords(jobData.description);
  const resumeText = [
    resumeData.skills || '',
    resumeData.experience || '',
    resumeData.education || '',
    resumeData.summary || ''
  ].join(' ').toLowerCase();

  const matched = [];
  const missing = [];

  jobKeywords.skills.forEach(skill => {
    if (resumeText.includes(skill.toLowerCase())) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  });

  jobKeywords.education.forEach(edu => {
    if (resumeText.includes(edu.toLowerCase())) {
      matched.push(edu);
    } else {
      missing.push(edu);
    }
  });

  const total = matched.length + missing.length;
  const score = total > 0 ? Math.round((matched.length / total) * 100) : 50;

  return { score, matched, missing, jobKeywords };
}

test('perfect match', () => {
  const job = { description: 'Python and JavaScript required' };
  const resume = { skills: 'Python, JavaScript, SQL' };
  const result = calculateMatchScore(job, resume);
  assert.strictEqual(result.score, 100);
  assert.strictEqual(result.missing.length, 0);
});

test('partial match', () => {
  const job = { description: 'Python, JavaScript, and Go required' };
  const resume = { skills: 'Python, JavaScript' };
  const result = calculateMatchScore(job, resume);
  assert.ok(result.score > 0 && result.score < 100);
  assert.ok(result.missing.includes('go'));
});

test('no match', () => {
  const job = { description: 'Scala and Rust required' };
  const resume = { skills: 'Python, JavaScript' };
  const result = calculateMatchScore(job, resume);
  assert.strictEqual(result.score, 0);
  assert.strictEqual(result.matched.length, 0);
});

test('empty job description', () => {
  const job = { description: '' };
  const resume = { skills: 'Python' };
  const result = calculateMatchScore(job, resume);
  assert.strictEqual(result.score, 0);
});

test('empty resume', () => {
  const job = { description: 'Python required' };
  const resume = {};
  const result = calculateMatchScore(job, resume);
  assert.strictEqual(result.score, 0);
});

test('null resume', () => {
  const job = { description: 'Python required' };
  const result = calculateMatchScore(job, null);
  assert.strictEqual(result.score, 0);
});

test('education match', () => {
  const job = { description: 'Bachelor degree required' };
  const resume = { education: 'Bachelor in Computer Science' };
  const result = calculateMatchScore(job, resume);
  assert.ok(result.matched.includes('bachelor'));
});

test('mixed skills match', () => {
  const job = { description: 'Python, AWS, and Docker experience needed' };
  const resume = { skills: 'Python, AWS, Docker, Kubernetes' };
  const result = calculateMatchScore(job, resume);
  assert.strictEqual(result.score, 100);
});

// ==================== JOB DATA EXTRACTION ====================
console.log('\n📋 Job Data Extraction Tests:');

function extractJobData(title, company, location, description, url) {
  return {
    title: title || 'Unknown Position',
    company: company || 'Unknown Company',
    location: location || 'Not specified',
    description: description || '',
    url: url || '',
    detectedAt: new Date().toISOString(),
    ats: 'unknown'
  };
}

test('extract job data', () => {
  const job = extractJobData('Data Scientist', 'Google', 'Berlin', 'Python required', 'https://linkedin.com/jobs/123');
  assert.strictEqual(job.title, 'Data Scientist');
  assert.strictEqual(job.company, 'Google');
  assert.strictEqual(job.location, 'Berlin');
});

test('default values', () => {
  const job = extractJobData(null, null, null, null, null);
  assert.strictEqual(job.title, 'Unknown Position');
  assert.strictEqual(job.company, 'Unknown Company');
  assert.strictEqual(job.location, 'Not specified');
});

test('detect timestamp', () => {
  const job = extractJobData('Dev', 'Co', 'City', 'desc', 'url');
  assert.ok(job.detectedAt);
  assert.ok(new Date(job.detectedAt) instanceof Date);
});

// ==================== JOB KEYWORDS ====================
console.log('\n🔑 Job Page Detection Tests:');

const JOB_KEYWORDS = [
  'requirements', 'qualifications', 'responsibilities', 'about the role',
  'what you.ll do', 'we.re looking for', 'join our team', 'apply now',
  'uber uns', 'anforderungen', 'stellenbeschreibung', 'aufgaben'
];

function isJobPage(text) {
  const lower = text.toLowerCase();
  return JOB_KEYWORDS.some(k => lower.includes(k));
}

test('detect English job page', () => {
  assert.strictEqual(isJobPage('Requirements: Python, 3+ years experience'), true);
});

test('detect German job page', () => {
  assert.strictEqual(isJobPage('Anforderungen: Python, 3+ Jahre Erfahrung'), true);
});

test('detect non-job page', () => {
  assert.strictEqual(isJobPage('Welcome to our homepage'), false);
});

test('detect empty text', () => {
  assert.strictEqual(isJobPage(''), false);
});

// ==================== SUMMARY ====================
console.log(`\n${'='.repeat(40)}`);
console.log(`📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`${'='.repeat(40)}`);

process.exit(failed > 0 ? 1 : 0);
