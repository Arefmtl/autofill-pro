// AutoFill Pro — TDD Tests: API Key Validation
// Run: node tests/test-api.js

const assert = require('assert');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`✅ ${name}`); }
  catch (e) { failed++; console.log(`❌ ${name}: ${e.message}`); }
}

// ==================== API KEY VALIDATION ====================
console.log('\n🔑 API Key Tests:');

function validateApiKey(key) {
  if (!key || key.trim() === '') return { valid: false, error: 'empty' };
  if (key.length < 10) return { valid: false, error: 'too_short' };
  if (key.includes(' ')) return { valid: false, error: 'contains_spaces' };
  if (!key.match(/^[a-zA-Z0-9\-_]+$/)) return { valid: false, error: 'invalid_chars' };
  return { valid: true, error: null };
}

test('valid API key', () => {
  const r = validateApiKey('sk-abc123def456ghi789');
  assert.strictEqual(r.valid, true);
});

test('empty key', () => {
  const r = validateApiKey('');
  assert.strictEqual(r.valid, false);
  assert.strictEqual(r.error, 'empty');
});

test('null key', () => {
  const r = validateApiKey(null);
  assert.strictEqual(r.valid, false);
  assert.strictEqual(r.error, 'empty');
});

test('too short', () => {
  const r = validateApiKey('abc');
  assert.strictEqual(r.valid, false);
  assert.strictEqual(r.error, 'too_short');
});

test('contains spaces', () => {
  const r = validateApiKey('sk-abc def123');
  assert.strictEqual(r.valid, false);
  assert.strictEqual(r.error, 'contains_spaces');
});

test('invalid chars', () => {
  const r = validateApiKey('sk-abc@def!123');
  assert.strictEqual(r.valid, false);
  assert.strictEqual(r.error, 'invalid_chars');
});

test('valid with hyphens', () => {
  const r = validateApiKey('sk-abc-123-def-456');
  assert.strictEqual(r.valid, true);
});

test('valid with underscores', () => {
  const r = validateApiKey('sk_abc_123_def_456');
  assert.strictEqual(r.valid, true);
});

// ==================== API RESPONSE PARSING ====================
console.log('\n📡 API Response Tests:');

function parseApiResponse(resp) {
  if (!resp) return { success: false, error: 'no_response' };
  if (resp.status === 401) return { success: false, error: 'unauthorized' };
  if (resp.status === 429) return { success: false, error: 'rate_limited' };
  if (resp.status >= 500) return { success: false, error: 'server_error' };
  if (!resp.ok) return { success: false, error: `http_${resp.status}` };
  return { success: true, error: null };
}

test('success response', () => {
  const r = parseApiResponse({ ok: true, status: 200 });
  assert.strictEqual(r.success, true);
});

test('401 unauthorized', () => {
  const r = parseApiResponse({ ok: false, status: 401 });
  assert.strictEqual(r.success, false);
  assert.strictEqual(r.error, 'unauthorized');
});

test('429 rate limited', () => {
  const r = parseApiResponse({ ok: false, status: 429 });
  assert.strictEqual(r.success, false);
  assert.strictEqual(r.error, 'rate_limited');
});

test('500 server error', () => {
  const r = parseApiResponse({ ok: false, status: 500 });
  assert.strictEqual(r.success, false);
  assert.strictEqual(r.error, 'server_error');
});

test('null response', () => {
  const r = parseApiResponse(null);
  assert.strictEqual(r.success, false);
  assert.strictEqual(r.error, 'no_response');
});

test('403 forbidden', () => {
  const r = parseApiResponse({ ok: false, status: 403 });
  assert.strictEqual(r.success, false);
  assert.strictEqual(r.error, 'http_403');
});

// ==================== SETTINGS STORAGE ====================
console.log('\n💾 Settings Tests:');

function createSettings(apiKey, model, lang, autoFill) {
  return {
    apiKey: apiKey || '',
    model: model || 'mimo-2.5',
    lang: lang || 'auto',
    autoFillEnabled: autoFill !== false,
    skipFilled: true,
    highlightFilled: true
  };
}

test('default settings', () => {
  const s = createSettings();
  assert.strictEqual(s.model, 'mimo-2.5');
  assert.strictEqual(s.lang, 'auto');
  assert.strictEqual(s.autoFillEnabled, true);
  assert.strictEqual(s.skipFilled, true);
  assert.strictEqual(s.highlightFilled, true);
});

test('custom settings', () => {
  const s = createSettings('sk-test', 'groq/llama-3.3-70b-versatile', 'de', false);
  assert.strictEqual(s.apiKey, 'sk-test');
  assert.strictEqual(s.model, 'groq/llama-3.3-70b-versatile');
  assert.strictEqual(s.lang, 'de');
  assert.strictEqual(s.autoFillEnabled, false);
});

test('settings with empty key', () => {
  const s = createSettings('');
  assert.strictEqual(s.apiKey, '');
  assert.strictEqual(s.model, 'mimo-2.5');
});

// ==================== SUMMARY ====================
console.log(`\n${'='.repeat(40)}`);
console.log(`📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`${'='.repeat(40)}`);

process.exit(failed > 0 ? 1 : 0);
