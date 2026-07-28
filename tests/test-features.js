// AutoFill Pro — TDD Tests: Sidebar + Career Chat + Resume Retouch
// Run: node tests/test-features.js

const assert = require('assert');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`✅ ${name}`); }
  catch (e) { failed++; console.log(`❌ ${name}: ${e.message}`); }
}

// ==================== SIDEBAR TOGGLE ====================
console.log('\n⚡ Sidebar Tests:');

function toggleSidebar(isOpen) {
  return !isOpen;
}

test('toggle from closed to open', () => {
  assert.strictEqual(toggleSidebar(false), true);
});

test('toggle from open to closed', () => {
  assert.strictEqual(toggleSidebar(true), false);
});

test('double toggle returns to original', () => {
  assert.strictEqual(toggleSidebar(toggleSidebar(false)), false);
});

// ==================== CAREER CHAT ====================
console.log('\n💬 Career Chat Tests:');

const chatHistory = [];
const MAX_HISTORY = 20;

function addChatMessage(role, content) {
  chatHistory.push({ role, content });
  if (chatHistory.length > MAX_HISTORY) {
    chatHistory.splice(0, chatHistory.length - MAX_HISTORY);
  }
  return chatHistory.length;
}

function getChatHistory() {
  return [...chatHistory];
}

function clearChatHistory() {
  chatHistory.length = 0;
}

test('add user message', () => {
  clearChatHistory();
  const count = addChatMessage('user', 'Hello');
  assert.strictEqual(count, 1);
});

test('add AI response', () => {
  addChatMessage('assistant', 'Hi there!');
  assert.strictEqual(chatHistory.length, 2);
});

test('history has correct roles', () => {
  clearChatHistory();
  addChatMessage('user', 'Question');
  addChatMessage('assistant', 'Answer');
  const history = getChatHistory();
  assert.strictEqual(history[0].role, 'user');
  assert.strictEqual(history[1].role, 'assistant');
});

test('max history limit', () => {
  clearChatHistory();
  for (let i = 0; i < 50; i++) {
    addChatMessage('user', `msg ${i}`);
    addChatMessage('assistant', `reply ${i}`);
  }
  assert.ok(chatHistory.length <= MAX_HISTORY);
});

test('clear history', () => {
  clearChatHistory();
  assert.strictEqual(chatHistory.length, 0);
});

// ==================== JOB TRACKER ====================
console.log('\n📊 Job Tracker Tests:');

let jobs = [];

let jobCounter = 0;
function addJob(company, title, status = 'saved') {
  jobCounter++;
  const job = { id: jobCounter.toString(), company, title, status, date: new Date().toISOString() };
  jobs.unshift(job);
  return job;
}

function updateJobStatus(id, newStatus) {
  const job = jobs.find(j => j.id === id);
  if (job) job.status = newStatus;
  return job;
}

function deleteJob(id) {
  jobs = jobs.filter(j => j.id !== id);
  return jobs.length;
}

function getJobStats() {
  const stats = { total: jobs.length, saved: 0, applied: 0, interview: 0, offer: 0, rejected: 0 };
  jobs.forEach(j => { if (stats[j.status] !== undefined) stats[j.status]++; });
  return stats;
}

function findJobs(query) {
  const q = query.toLowerCase();
  return jobs.filter(j => j.company.toLowerCase().includes(q) || j.title.toLowerCase().includes(q));
}

test('add job', () => {
  jobs = [];
  const job = addJob('Google', 'Data Scientist');
  assert.strictEqual(job.company, 'Google');
  assert.strictEqual(job.status, 'saved');
});

test('add multiple jobs', () => {
  jobs = [];
  addJob('Google', 'DS');
  addJob('Amazon', 'ML Engineer');
  addJob('Meta', 'AI Research');
  assert.strictEqual(jobs.length, 3);
});

test('update job status', () => {
  jobs = [];
  const job = addJob('Google', 'DS');
  const updated = updateJobStatus(job.id, 'applied');
  assert.strictEqual(updated.status, 'applied');
});

test('delete job', () => {
  jobs = [];
  addJob('Google', 'DS');
  addJob('Amazon', 'ML');
  deleteJob(jobs[0].id);
  assert.strictEqual(jobs.length, 1);
});

test('job stats', () => {
  jobs = [];
  addJob('G', 'DS', 'saved');
  addJob('A', 'ML', 'applied');
  addJob('M', 'AI', 'interview');
  addJob('O', 'Eng', 'offer');
  const stats = getJobStats();
  assert.strictEqual(stats.total, 4);
  assert.strictEqual(stats.applied, 1);
  assert.strictEqual(stats.interview, 1);
  assert.strictEqual(stats.offer, 1);
});

test('find jobs by company', () => {
  jobs = [];
  addJob('Google', 'DS');
  addJob('Amazon', 'ML');
  addJob('Google', 'SWE');
  const results = findJobs('google');
  assert.strictEqual(results.length, 2);
});

test('find jobs by title', () => {
  jobs = [];
  addJob('Google', 'Data Scientist');
  addJob('Amazon', 'ML Engineer');
  const results = findJobs('scientist');
  assert.strictEqual(results.length, 1);
});

test('find no jobs', () => {
  jobs = [];
  addJob('Google', 'DS');
  const results = findJobs('facebook');
  assert.strictEqual(results.length, 0);
});

// ==================== RESUME RETOUCH ====================
console.log('\n✨ Resume Retouch Tests:');

function calculateATSScore(resume) {
  let score = 0;
  if (resume.fullName) score += 10;
  if (resume.email) score += 5;
  if (resume.phone) score += 5;
  if (resume.skills && resume.skills.length > 10) score += 15;
  if (resume.experience && resume.experience.length > 20) score += 15;
  if (resume.education) score += 10;
  if (resume.summary && resume.summary.length > 20) score += 10;
  return Math.min(score, 100);
}

function generateSuggestions(resume) {
  const suggestions = [];
  if (!resume.fullName) suggestions.push({ type: 'add', text: 'Add your full name' });
  if (!resume.email) suggestions.push({ type: 'add', text: 'Add your email' });
  if (!resume.phone) suggestions.push({ type: 'add', text: 'Add your phone number' });
  if (!resume.skills || resume.skills.length < 10) suggestions.push({ type: 'improve', text: 'Add more skills (aim for 5+)' });
  if (!resume.experience || resume.experience.length < 20) suggestions.push({ type: 'improve', text: 'Add more experience details' });
  if (!resume.summary) suggestions.push({ type: 'add', text: 'Add a professional summary' });
  return suggestions;
}

test('full resume gets high score', () => {
  const resume = {
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+49 123 456',
    skills: 'Python, JavaScript, ML, Data Science, SQL',
    experience: '5 years as Data Scientist at Google',
    education: 'MSc Computer Science',
    summary: 'Experienced data scientist with 5+ years'
  };
  const score = calculateATSScore(resume);
  assert.ok(score >= 60, `Score should be >= 60, got ${score}`);
});

test('empty resume gets low score', () => {
  const score = calculateATSScore({});
  assert.strictEqual(score, 0);
});

test('partial resume gets medium score', () => {
  const resume = { fullName: 'Jane', email: 'jane@test.com' };
  const score = calculateATSScore(resume);
  assert.ok(score > 0 && score < 60);
});

test('suggestions for empty resume', () => {
  const suggestions = generateSuggestions({});
  assert.ok(suggestions.length >= 3);
  assert.ok(suggestions.some(s => s.text.includes('name')));
});

test('suggestions for complete resume', () => {
  const resume = {
    fullName: 'John',
    email: 'j@t.com',
    phone: '+123',
    skills: 'Python, JS, ML, Data, SQL, R, Java, C++',
    experience: '5 years at Google as Data Scientist',
    education: 'MSc CS',
    summary: 'Experienced professional'
  };
  const suggestions = generateSuggestions(resume);
  assert.strictEqual(suggestions.length, 0);
});

test('score capped at 100', () => {
  const resume = {
    fullName: 'John Doe',
    email: 'j@t.com',
    phone: '+123',
    skills: 'Python, JavaScript, ML, Data Science, SQL, R, Java',
    experience: '10 years at Google, Amazon, Meta as Senior Data Scientist',
    education: 'PhD Computer Science from MIT',
    summary: 'World-class data scientist with 10+ years'
  };
  const score = calculateATSScore(resume);
  assert.ok(score <= 100);
});

// ==================== SUMMARY ====================
console.log(`\n${'='.repeat(40)}`);
console.log(`📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`${'='.repeat(40)}`);

process.exit(failed > 0 ? 1 : 0);
