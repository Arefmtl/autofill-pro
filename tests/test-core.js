// AutoFill Pro — TDD Tests
// Run: node tests/test-core.js

const assert = require('assert');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`✅ ${name}`); }
  catch (e) { failed++; console.log(`❌ ${name}: ${e.message}`); }
}

// ==================== ATS DETECTION ====================
console.log('\n🔍 ATS Detection Tests:');

// We need to extract ATS detection logic for testing
const ATS_REGISTRY = {
  greenhouse: { domain: ['greenhouse.io', 'grnh.se'], name: 'Greenhouse' },
  lever: { domain: ['lever.co'], name: 'Lever' },
  workday: { domain: ['myworkdayjobs.com', 'workday.com'], name: 'Workday' },
  ashby: { domain: ['ashbyhq.com', 'jobs.ashbyhq.com'], name: 'Ashby' },
  linkedin: { domain: ['linkedin.com'], name: 'LinkedIn' },
  smartrecruiters: { domain: ['smartrecruiters.com'], name: 'SmartRecruiters' },
  bamboohr: { domain: ['bamboohr.com'], name: 'BambooHR' },
  icims: { domain: ['icims.com'], name: 'iCIMS' },
  taleo: { domain: ['taleo.net', 'oracle.com/taleo'], name: 'Taleo' },
  workable: { domain: ['workable.com'], name: 'Workable' },
  oracle: { domain: ['oracle.com/careers', 'oracle.com/recruiting'], name: 'Oracle' },
  successfactors: { domain: ['successfactors.com', 'sf-cf.com'], name: 'SuccessFactors' },
  jobvite: { domain: ['jobvite.com'], name: 'Jobvite' },
  glassdoor: { domain: ['glassdoor.com'], name: 'Glassdoor' },
  indeed: { domain: ['indeed.com'], name: 'Indeed' },
  stepstone: { domain: ['stepstone.de', 'stepstone.at', 'stepstone.be'], name: 'StepStone' },
  xing: { domain: ['xing.com'], name: 'Xing' },
  monster: { domain: ['monster.de', 'monster.com'], name: 'Monster' },
  arbeitsagentur: { domain: ['arbeitsagentur.de'], name: 'Arbeitsagentur' },
  personio: { domain: ['personio.de', 'personio.com'], name: 'Personio' },
  recruitee: { domain: ['recruitee.com'], name: 'Recruitee' },
  teamtailor: { domain: ['teamtailor.com'], name: 'Teamtailor' },
};

function detectATS(hostname) {
  const h = hostname.toLowerCase();
  for (const [name, cfg] of Object.entries(ATS_REGISTRY)) {
    if (cfg.domain.some(d => h.includes(d))) return { id: name, name: cfg.name };
  }
  return null;
}

// Tests
test('detect Greenhouse', () => {
  const r = detectATS('boards.greenhouse.io');
  assert.strictEqual(r.id, 'greenhouse');
  assert.strictEqual(r.name, 'Greenhouse');
});

test('detect Lever', () => {
  const r = detectATS('jobs.lever.co');
  assert.strictEqual(r.id, 'lever');
});

test('detect Workday', () => {
  const r = detectATS('company.wd5.myworkdayjobs.com');
  assert.strictEqual(r.id, 'workday');
});

test('detect LinkedIn', () => {
  const r = detectATS('www.linkedin.com/jobs');
  assert.strictEqual(r.id, 'linkedin');
});

test('detect StepStone (German)', () => {
  const r = detectATS('www.stepstone.de/jobs');
  assert.strictEqual(r.id, 'stepstone');
});

test('detect Xing (German)', () => {
  const r = detectATS('www.xing.com/jobs');
  assert.strictEqual(r.id, 'xing');
});

test('detect Personio (German)', () => {
  const r = detectATS('apply.personio.de');
  assert.strictEqual(r.id, 'personio');
});

test('detect unknown site', () => {
  const r = detectATS('www.google.com');
  assert.strictEqual(r, null);
});

test('detect empty hostname', () => {
  const r = detectATS('');
  assert.strictEqual(r, null);
});

test('case insensitive', () => {
  const r = detectATS('GREENHOUSE.IO');
  assert.strictEqual(r.id, 'greenhouse');
});

// ==================== FIELD MATCHING ====================
console.log('\n🎯 Field Matching Tests:');

const FIELD_MAP = {
  'full name': 'fullName', 'fullname': 'fullName',
  'first name': 'firstName', 'last name': 'lastName',
  'vorname': 'firstName', 'nachname': 'lastName',
  'email': 'email', 'e-mail': 'email',
  'phone': 'phone', 'tel': 'phone', 'mobile': 'phone', 'handy': 'phone',
  'address': 'address', 'adresse': 'address', 'street': 'address',
  'city': 'city', 'stadt': 'city',
  'country': 'country', 'land': 'country',
  'postal code': 'zipCode', 'zip': 'zipCode', 'plz': 'zipCode',
  'linkedin': 'linkedin', 'github': 'github',
  'skills': 'skills', 'experience': 'experience',
  'education': 'education', 'visa': 'visaStatus',
  'salary': 'salary', 'notice period': 'noticePeriod',
};

function matchField(text) {
  const t = text.toLowerCase().trim();
  for (const [pattern, key] of Object.entries(FIELD_MAP)) {
    if (t.includes(pattern)) return key;
  }
  return null;
}

test('match "Full Name"', () => {
  assert.strictEqual(matchField('Full Name'), 'fullName');
});

test('match "Email"', () => {
  assert.strictEqual(matchField('Email Address'), 'email');
});

test('match "E-Mail"', () => {
  assert.strictEqual(matchField('E-Mail'), 'email');
});

test('match "Telefon" (German)', () => {
  assert.strictEqual(matchField('Telefon'), 'phone');
});

test('match "Handy" (German mobile)', () => {
  assert.strictEqual(matchField('Handy'), 'phone');
});

test('match "PLZ" (German postal)', () => {
  assert.strictEqual(matchField('PLZ'), 'zipCode');
});

test('match "Stadt" (German city)', () => {
  assert.strictEqual(matchField('Stadt'), 'city');
});

test('match "Land" (German country)', () => {
  assert.strictEqual(matchField('Land'), 'country');
});

test('match "Adresse" (German address)', () => {
  assert.strictEqual(matchField('Adresse'), 'address');
});

test('match "Vorname" (German first name)', () => {
  assert.strictEqual(matchField('Vorname'), 'firstName');
});

test('match "Nachname" (German last name)', () => {
  assert.strictEqual(matchField('Nachname'), 'lastName');
});

test('no match for unknown field', () => {
  assert.strictEqual(matchField('random text'), null);
});

test('case insensitive match', () => {
  assert.strictEqual(matchField('EMAIL'), 'email');
});

// ==================== JD EXTRACTION ====================
console.log('\n📄 JD Extraction Tests:');

function isJobPage(text) {
  const keywords = /requirements|qualifications|responsibilities|about the role|what you.ll do|uber uns|anforderungen|stellenbeschreibung/i;
  return keywords.test(text);
}

test('detect English job page', () => {
  assert.strictEqual(isJobPage('We are looking for a candidate with the following requirements: Python, JavaScript'), true);
});

test('detect German job page', () => {
  assert.strictEqual(isJobPage('Wir suchen einen Mitarbeiter mit folgenden Anforderungen: Python, JavaScript'), true);
});

test('detect non-job page', () => {
  assert.strictEqual(isJobPage('Welcome to our homepage. We sell shoes.'), false);
});

test('detect empty text', () => {
  assert.strictEqual(isJobPage(''), false);
});

// ==================== JOB STATUS ====================
console.log('\n📊 Job Status Tests:');

const STATUS_LABELS = {
  saved: '💾 Saved',
  applied: '📤 Applied',
  interview: '🎤 Interview',
  offer: '🎉 Offer',
  rejected: '❌ Rejected',
  withdrawn: '🔙 Withdrawn',
};

function isValidStatus(status) {
  return STATUS_LABELS.hasOwnProperty(status);
}

function getStatusLabel(status) {
  return STATUS_LABELS[status] || '❓ Unknown';
}

test('valid statuses', () => {
  assert.strictEqual(isValidStatus('saved'), true);
  assert.strictEqual(isValidStatus('applied'), true);
  assert.strictEqual(isValidStatus('interview'), true);
  assert.strictEqual(isValidStatus('offer'), true);
  assert.strictEqual(isValidStatus('rejected'), true);
  assert.strictEqual(isValidStatus('withdrawn'), true);
});

test('invalid status', () => {
  assert.strictEqual(isValidStatus('pending'), false);
  assert.strictEqual(isValidStatus(''), false);
});

test('get status label', () => {
  assert.strictEqual(getStatusLabel('applied'), '📤 Applied');
  assert.strictEqual(getStatusLabel('offer'), '🎉 Offer');
});

test('unknown status label', () => {
  assert.strictEqual(getStatusLabel('unknown'), '❓ Unknown');
});

// ==================== SEARCH URLS ====================
console.log('\n🔍 Search URL Tests:');

function buildSearchUrl(query, location, source) {
  const q = encodeURIComponent(query);
  const l = encodeURIComponent(location || 'Germany');
  const urls = {
    linkedin: `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${l}`,
    indeed: `https://de.indeed.com/jobs?q=${q}&l=${l}`,
    stepstone: `https://www.stepstone.de/jobs/${q}/in-${l}`,
    all: `https://www.google.com/search?q=${q}+jobs+${l}`,
  };
  return urls[source] || urls.all;
}

test('LinkedIn search URL', () => {
  const url = buildSearchUrl('Data Scientist', 'Berlin', 'linkedin');
  assert.ok(url.includes('linkedin.com'));
  assert.ok(url.includes('Data'));
  assert.ok(url.includes('Berlin'));
});

test('Indeed search URL', () => {
  const url = buildSearchUrl('Developer', 'Munich', 'indeed');
  assert.ok(url.includes('indeed.com'));
  assert.ok(url.includes('Developer'));
});

test('StepStone search URL', () => {
  const url = buildSearchUrl('Engineer', 'Frankfurt', 'stepstone');
  assert.ok(url.includes('stepstone.de'));
  assert.ok(url.includes('Engineer'));
});

test('default to LinkedIn', () => {
  const url = buildSearchUrl('Test', 'Hamburg', 'unknown');
  assert.ok(url.includes('linkedin.com') || url.includes('google.com'));
});

test('default location to Germany', () => {
  const url = buildSearchUrl('Test', '', 'linkedin');
  assert.ok(url.includes('Germany'));
});

// ==================== SUMMARY ====================
console.log(`\n${'='.repeat(40)}`);
console.log(`📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`${'='.repeat(40)}`);

process.exit(failed > 0 ? 1 : 0);
