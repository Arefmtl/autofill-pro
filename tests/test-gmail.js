// AutoFill Pro — TDD Tests: Gmail + Email Categorization
// Run: node tests/test-gmail.js

const assert = require('assert');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`✅ ${name}`); }
  catch (e) { failed++; console.log(`❌ ${name}: ${e.message}`); }
}

// ==================== EMAIL CATEGORIZATION ====================
console.log('\n📧 Email Categorization Tests:');

const PATTERNS = {
  interview: {
    en: [/interview/i, /phone screen/i, /technical interview/i, /onsite/i, /meeting/i, /call scheduled/i, /gespräch/i, /vorstellungsgespräch/i],
    keywords: ['interview', 'screen', 'meeting', 'call', 'gespräch', 'vorstellung']
  },
  rejection: {
    en: [/rejection/i, /not selected/i, /unfortunately/i, /decided not to/i, /we regret/i, /abgelehnt/i, /leider/i, /nicht ausgewählt/i],
    keywords: ['rejection', 'unfortunately', 'regret', 'abgelehnt', 'leider']
  },
  offer: {
    en: [/offer/i, /congratulations/i, /we are pleased/i, /welcome to/i, /job offer/i, /angebot/i, /herzlichen/i, /willkommen/i],
    keywords: ['offer', 'congratulations', 'pleased', 'angebot', 'herzlichen']
  },
  assessment: {
    en: [/assessment/i, /test assignment/i, /coding challenge/i, /take.home/i, /aufgabe/i],
    keywords: ['assessment', 'challenge', 'assignment', 'aufgabe']
  },
  application: {
    en: [/application received/i, /thank you for applying/i, /bewerbung erhalten/i, /vielen dank/i],
    keywords: ['application', 'received', 'applying', 'bewerbung']
  }
};

function categorize(subject, body = '') {
  const text = `${subject} ${body}`.toLowerCase();
  
  for (const [status, patterns] of Object.entries(PATTERNS)) {
    for (const pattern of patterns.en) {
      if (pattern.test(text)) {
        return { status, confidence: 'high', matched: pattern.source };
      }
    }
    for (const keyword of patterns.keywords) {
      if (text.includes(keyword)) {
        return { status, confidence: 'medium', matched: keyword };
      }
    }
  }
  
  return { status: 'unknown', confidence: 'none', matched: null };
}

// Interview emails
test('detect interview (EN)', () => {
  const r = categorize('Interview Invitation - Google');
  assert.strictEqual(r.status, 'interview');
});

test('detect phone screen', () => {
  const r = categorize('Phone Screen Schedule');
  assert.strictEqual(r.status, 'interview');
});

test('detect interview (DE)', () => {
  const r = categorize('Vorstellungsgespräch bei Google');
  assert.strictEqual(r.status, 'interview');
});

test('detect gespräch', () => {
  const r = categorize('Einladung zum Gespräch');
  assert.strictEqual(r.status, 'interview');
});

// Rejection emails
test('detect rejection (EN)', () => {
  const r = categorize('Update on your application - Unfortunately');
  assert.strictEqual(r.status, 'rejection');
});

test('detect rejection (DE)', () => {
  const r = categorize('Leider haben wir uns für einen anderen Kandidaten entschieden');
  assert.strictEqual(r.status, 'rejection');
});

test('detect abgelehnt', () => {
  const r = categorize('Ihre Bewerbung wurde abgelehnt');
  assert.strictEqual(r.status, 'rejection');
});

test('detect not selected', () => {
  const r = categorize('You were not selected for this position');
  assert.strictEqual(r.status, 'rejection');
});

// Offer emails
test('detect offer (EN)', () => {
  const r = categorize('Job Offer - Data Scientist at Google');
  assert.strictEqual(r.status, 'offer');
});

test('detect congratulations', () => {
  const r = categorize('Congratulations! We are pleased to offer you');
  assert.strictEqual(r.status, 'offer');
});

test('detect offer (DE)', () => {
  const r = categorize('Herzlichen Glückwunsch! Wir möchten Ihnen ein Angebot machen');
  assert.strictEqual(r.status, 'offer');
});

test('detect angebot', () => {
  const r = categorize('Ihr Job-Angebot bei Google');
  assert.strictEqual(r.status, 'offer');
});

// Assessment emails
test('detect assessment', () => {
  const r = categorize('Technical Assessment - Complete by Friday');
  assert.strictEqual(r.status, 'assessment');
});

test('detect coding challenge', () => {
  const r = categorize('Your coding challenge is ready');
  assert.strictEqual(r.status, 'assessment');
});

test('detect aufgabe', () => {
  const r = categorize('Hier ist Ihre Aufgabe');
  assert.strictEqual(r.status, 'assessment');
});

// Application emails
test('detect application received', () => {
  const r = categorize('Thank you for applying to Google');
  assert.strictEqual(r.status, 'application');
});

test('detect bewerbung', () => {
  const r = categorize('Ihre Bewerbung wurde erhalten');
  assert.strictEqual(r.status, 'application');
});

// Unknown emails
test('detect newsletter (unknown)', () => {
  const r = categorize('Weekly Tech News Digest');
  assert.strictEqual(r.status, 'unknown');
});

test('detect empty subject', () => {
  const r = categorize('');
  assert.strictEqual(r.status, 'unknown');
});

// ==================== COMPANY EXTRACTION ====================
console.log('\n🏢 Company Extraction Tests:');

function extractCompany(from, subject) {
  const fromMatch = from.match(/@([^.]+)/);
  if (fromMatch) {
    const domain = fromMatch[1].toLowerCase();
    const atsDomains = {
      'greenhouse': 'Greenhouse', 'lever': 'Lever', 'workday': 'Workday',
      'ashbyhq': 'Ashby', 'smartrecruiters': 'SmartRecruiters',
      'icims': 'iCIMS', 'bamboohr': 'BambooHR', 'indeed': 'Indeed',
      'glassdoor': 'Glassdoor', 'stepstone': 'StepStone', 'xing': 'Xing'
    };
    for (const [key, name] of Object.entries(atsDomains)) {
      if (domain.includes(key)) return name;
    }
    // If not a known ATS, try subject
    const subjectMatch = subject.match(/(?:at|bei|@)\s+([A-Z][a-zA-Z0-9\s&]+)/);
    if (subjectMatch) return subjectMatch[1].trim();
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  }
  const subjectMatch = subject.match(/(?:at|bei|@)\s+([A-Z][a-zA-Z0-9\s&]+)/);
  if (subjectMatch) return subjectMatch[1].trim();
  return 'Unknown Company';
}

test('extract company from Greenhouse', () => {
  assert.strictEqual(extractCompany('jobs@greenhouse.io', ''), 'Greenhouse');
});

test('extract company from Lever', () => {
  assert.strictEqual(extractCompany('hr@lever.co', ''), 'Lever');
});

test('extract company from domain', () => {
  assert.strictEqual(extractCompany('hr@techcorp.com', ''), 'Techcorp');
});

test('extract company from subject', () => {
  assert.strictEqual(extractCompany('hr@company.com', 'Job Offer at Google'), 'Google');
});

test('extract company from subject (DE)', () => {
  assert.strictEqual(extractCompany('hr@firma.de', 'Angebot bei Siemens'), 'Siemens');
});

test('unknown company', () => {
  assert.strictEqual(extractCompany('', ''), 'Unknown Company');
});

// ==================== GMAIL QUERY BUILDER ====================
console.log('\n🔍 Gmail Query Tests:');

function buildJobQuery(lookbackDays = 30) {
  return `in:inbox newer_than:${lookbackDays}d ({from:greenhouse.io from:lever.co from:myworkdayjobs.com from:ashbyhq.com from:smartrecruiters.com from:icims.com from:bamboohr.com from:indeed.com from:glassdoor.com from:stepstone.de from:xing.com} OR {subject:(interview OR offer OR rejection OR application OR bewerbung)})`;
}

test('build default query', () => {
  const q = buildJobQuery();
  assert.ok(q.includes('newer_than:30d'));
  assert.ok(q.includes('from:greenhouse.io'));
  assert.ok(q.includes('from:lever.co'));
  assert.ok(q.includes('subject:(interview'));
});

test('build custom lookback', () => {
  const q = buildJobQuery(7);
  assert.ok(q.includes('newer_than:7d'));
});

test('query includes German keywords', () => {
  const q = buildJobQuery();
  assert.ok(q.includes('bewerbung'));
});

// ==================== BATCH PROCESSING ====================
console.log('\n📊 Batch Processing Tests:');

function categorizeBatch(emails) {
  const results = { interview: 0, rejection: 0, offer: 0, assessment: 0, application: 0, unknown: 0 };
  emails.forEach(e => {
    const r = categorize(e.subject, e.body);
    results[r.status]++;
  });
  return results;
}

test('categorize batch of emails', () => {
  const emails = [
    { subject: 'Interview at Google', body: '' },
    { subject: 'Rejection from Amazon', body: '' },
    { subject: 'Job Offer from Meta', body: '' },
    { subject: 'Weekly Newsletter', body: '' },
    { subject: 'Assessment for Microsoft', body: '' }
  ];
  const results = categorizeBatch(emails);
  assert.strictEqual(results.interview, 1);
  assert.strictEqual(results.rejection, 1);
  assert.strictEqual(results.offer, 1);
  assert.strictEqual(results.assessment, 1);
  assert.strictEqual(results.unknown, 1);
});

test('empty batch', () => {
  const results = categorizeBatch([]);
  assert.strictEqual(results.interview, 0);
});

test('all same status', () => {
  const emails = [
    { subject: 'Interview 1', body: '' },
    { subject: 'Interview 2', body: '' },
    { subject: 'Interview 3', body: '' }
  ];
  const results = categorizeBatch(emails);
  assert.strictEqual(results.interview, 3);
});

// ==================== SUMMARY ====================
console.log(`\n${'='.repeat(40)}`);
console.log(`📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`${'='.repeat(40)}`);

process.exit(failed > 0 ? 1 : 0);
