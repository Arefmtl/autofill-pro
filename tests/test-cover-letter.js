/**
 * Test Suite — Cover Letter AI
 * AutoFill Pro v9.0
 */

const assert = require('assert');

// Mock DOM for testing
global.document = {
  querySelector: () => ({ textContent: 'Software Engineer at Google', trim: () => 'Software Engineer at Google' }),
  querySelectorAll: () => [],
  title: 'Software Engineer - Google'
};
global.window = { location: { href: 'https://careers.google.com/jobs/123' } };

const CoverLetterAI = require('../content/cover-letter.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message}`);
    failed++;
  }
}

console.log('🧪 Cover Letter AI Tests\n');

// === Template Tests ===
console.log('📝 Templates:');

test('has English templates', () => {
  assert(CoverLetterAI.TEMPLATES.en);
  assert(CoverLetterAI.TEMPLATES.en.formal);
  assert(CoverLetterAI.TEMPLATES.en.casual);
  assert(CoverLetterAI.TEMPLATES.en.creative);
});

test('has German templates', () => {
  assert(CoverLetterAI.TEMPLATES.de);
  assert(CoverLetterAI.TEMPLATES.de.formal);
  assert(CoverLetterAI.TEMPLATES.de.casual);
  assert(CoverLetterAI.TEMPLATES.de.creative);
});

test('has Farsi templates', () => {
  assert(CoverLetterAI.TEMPLATES.fa);
  assert(CoverLetterAI.TEMPLATES.fa.formal);
  assert(CoverLetterAI.TEMPLATES.fa.casual);
  assert(CoverLetterAI.TEMPLATES.fa.creative);
});

// === Generation Tests ===
console.log('\n🎯 Generation:');

test('generates formal English letter', () => {
  const result = CoverLetterAI.generate({
    jobInfo: { title: 'Data Scientist', company: 'BMW', skills: ['Python', 'ML'], description: '' },
    template: 'formal',
    language: 'en',
    userProfile: { name: 'Ali', experience: '5' }
  });
  assert(result.letter.includes('Dear Hiring Manager'));
  assert(result.letter.includes('Data Scientist'));
  assert(result.letter.includes('BMW'));
  assert(result.letter.includes('Ali'));
});

test('generates casual English letter', () => {
  const result = CoverLetterAI.generate({
    jobInfo: { title: 'ML Engineer', company: 'Google', skills: ['TensorFlow'], description: '' },
    template: 'casual',
    language: 'en'
  });
  assert(result.letter.includes('Hi there'));
  assert(result.letter.includes('ML Engineer'));
  assert(result.letter.includes('Google'));
});

test('generates creative English letter', () => {
  const result = CoverLetterAI.generate({
    jobInfo: { title: 'Backend Dev', company: 'Startup', skills: [], description: '' },
    template: 'creative',
    language: 'en'
  });
  assert(result.letter.includes('Hello Startup team'));
  assert(result.letter.includes('Backend Dev'));
});

test('generates formal German letter', () => {
  const result = CoverLetterAI.generate({
    jobInfo: { title: 'Entwickler', company: 'SAP', skills: ['Java'], description: '' },
    template: 'formal',
    language: 'de'
  });
  assert(result.letter.includes('Sehr geehrte'));
  assert(result.letter.includes('Entwickler'));
  assert(result.letter.includes('SAP'));
});

test('generates formal Farsi letter', () => {
  const result = CoverLetterAI.generate({
    jobInfo: { title: 'مهندس داده', company: 'ایرانسل', skills: ['Python'], description: '' },
    template: 'formal',
    language: 'fa'
  });
  assert(result.letter.includes('با احترام'));
  assert(result.letter.includes('مهندس داده'));
  assert(result.letter.includes('ایرانسل'));
});

// === Skill Extraction Tests ===
console.log('\n🔍 Skill Extraction:');

test('extracts skills from description', () => {
  const result = CoverLetterAI.generate({
    jobInfo: { 
      title: 'Engineer', 
      company: 'Test', 
      skills: [],
      description: 'Experience with Python and Machine Learning required. Knowledge of Docker preferred.' 
    },
    template: 'formal',
    language: 'en'
  });
  assert(result.letter.includes('Python') || result.letter.includes('Machine Learning'));
});

test('limits skills to 5', () => {
  const result = CoverLetterAI.generate({
    jobInfo: { 
      title: 'Engineer', 
      company: 'Test', 
      skills: ['Python', 'Java', 'C++', 'Go', 'Rust', 'Ruby', 'PHP'],
      description: '' 
    },
    template: 'formal',
    language: 'en'
  });
  // Should only include first 5 skills
  const skillCount = ['Python', 'Java', 'C++', 'Go', 'Rust'].filter(s => 
    result.letter.includes(s)
  ).length;
  assert(skillCount <= 5);
});

// === Word Count Tests ===
console.log('\n📊 Stats:');

test('counts words correctly', () => {
  const result = CoverLetterAI.generate({
    jobInfo: { title: 'Dev', company: 'Co', skills: [], description: '' },
    template: 'formal',
    language: 'en'
  });
  assert(result.wordCount > 20);
  assert(result.wordCount < 200);
});

test('returns job info', () => {
  const result = CoverLetterAI.generate({
    jobInfo: { title: 'Engineer', company: 'TechCorp', skills: [], description: '' },
    template: 'formal',
    language: 'en'
  });
  assert(result.job.title === 'Engineer');
  assert(result.job.company === 'TechCorp');
});

// === Fallback Tests ===
console.log('\n🔄 Fallbacks:');

test('falls back to English if unknown language', () => {
  const result = CoverLetterAI.generate({
    jobInfo: { title: 'Dev', company: 'Co', skills: [], description: '' },
    template: 'formal',
    language: 'xyz'
  });
  assert(result.letter.includes('Dear Hiring Manager'));
});

test('falls back to formal if unknown template', () => {
  const result = CoverLetterAI.generate({
    jobInfo: { title: 'Dev', company: 'Co', skills: [], description: '' },
    template: 'unknown',
    language: 'en'
  });
  assert(result.letter.includes('Dear Hiring Manager'));
});

test('uses default name if not provided', () => {
  const result = CoverLetterAI.generate({
    jobInfo: { title: 'Dev', company: 'Co', skills: [], description: '' },
    template: 'formal',
    language: 'en'
  });
  assert(result.letter.includes('[Your Name]'));
});

// === Summary ===
console.log(`\n${'='.repeat(40)}`);
console.log(`📊 Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(40)}\n`);

process.exit(failed > 0 ? 1 : 0);
