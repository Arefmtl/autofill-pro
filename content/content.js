// AutoFill Pro v4.0 — AI-First (JobWizard clone)
(() => {
  'use strict';

  const AI_ENDPOINT = 'https://api.opencode.ai/v1/chat/completions';
  const AI_MODEL = 'mimo-2.5';

  // ==================== ATS DETECTION ====================
  const ATS_REGISTRY = {
    greenhouse: { domain: ['greenhouse.io', 'grnh.se'] },
    lever: { domain: ['lever.co'] },
    workday: { domain: ['myworkdayjobs.com', 'workday.com'] },
    ashby: { domain: ['ashbyhq.com', 'jobs.ashbyhq.com'] },
    linkedin: { domain: ['linkedin.com'] },
    smartrecruiters: { domain: ['smartrecruiters.com'] },
    bamboohr: { domain: ['bamboohr.com'] },
    icims: { domain: ['icims.com'] },
    taleo: { domain: ['taleo.net'] },
    workable: { domain: ['workable.com'] }
  };

  function detectATS() {
    const h = window.location.hostname.toLowerCase();
    for (const [name, cfg] of Object.entries(ATS_REGISTRY)) {
      if (cfg.domain.some(d => h.includes(d))) return name;
    }
    return null;
  }

  // ==================== STORAGE ====================
  async function getProfile() {
    return new Promise(resolve => {
      chrome.storage.local.get(['resumeData', 'profile'], r => {
        resolve({ ...(r.resumeData || {}), ...(r.profile || {}) });
      });
    });
  }

  async function getApiKey() {
    if (window.SecureStorage) {
      const k = await window.SecureStorage.get('apiKey');
      if (k) return k;
    }
    return new Promise(resolve => {
      chrome.storage.local.get('settings', r => resolve(r.settings?.apiKey || ''));
    });
  }

  // ==================== AI ENGINE ====================
  let lastCall = 0;
  const COOLDOWN = 4000;
  async function ai(prompt, maxTokens = 1000) {
    const apiKey = await getApiKey();
    if (!apiKey) return null;
    const now = Date.now();
    if (now - lastCall < COOLDOWN) return null;
    lastCall = now;
    try {
      const resp = await fetch(AI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: AI_MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0.3, max_tokens: maxTokens })
      });
      if (!resp.ok) return null;
      const d = await resp.json();
      return d.choices[0]?.message?.content || null;
    } catch { return null; }
  }

  // ==================== FIELD MAP ====================
  const FIELD_MAP = {
    'نام': 'fullName', 'full name': 'fullName', 'fullname': 'fullName',
    'first name': 'firstName', 'last name': 'lastName',
    'vorname': 'firstName', 'nachname': 'lastName', 'surname': 'lastName',
    'ایمیل': 'email', 'email': 'email', 'e-mail': 'email',
    'تلفن': 'phone', 'phone': 'phone', 'tel': 'phone', 'mobile': 'phone',
    'handy': 'phone', 'telefon': 'phone', 'cellphone': 'phone',
    'آدرس': 'address', 'address': 'address', 'adresse': 'address', 'street': 'address',
    'city': 'city', 'stadt': 'city', 'country': 'country', 'land': 'country',
    'postal code': 'zipCode', 'zip': 'zipCode', 'plz': 'zipCode',
    'linkedin': 'linkedin', 'github': 'github',
    'website': 'website', 'webseite': 'website', 'portfolio': 'website',
    'skills': 'skills', 'مهارت': 'skills', 'experience': 'experience', 'تجربه': 'experience',
    'education': 'education', 'تحصیلات': 'education',
    'nationality': 'nationality', 'ملیت': 'nationality',
    'visa': 'visaStatus', 'work permit': 'visaStatus', 'ویزا': 'visaStatus',
    'years of experience': 'yearsOfExperience', 'notice period': 'noticePeriod',
    'expected salary': 'salary', 'salary': 'salary', 'salary expectation': 'salary',
    'current salary': 'salary', 'gender': 'gender',
    'title': 'currentTitle', 'job title': 'currentTitle',
    'given-name': 'firstName', 'family-name': 'lastName',
    'street-address': 'address', 'postal-code': 'zipCode',
    'address-level2': 'city', 'address-level1': 'country',
    'organization': 'company', 'organization-title': 'currentTitle',
  };

  // ==================== FIELD MATCHING ====================
  function matchField(field) {
    // autocomplete attr first
    const ac = (field.autocomplete || '').toLowerCase();
    if (ac && ac !== 'on' && ac !== 'off') {
      for (const [p, k] of Object.entries(FIELD_MAP)) if (ac === p || ac.includes(p)) return k;
    }
    // aria-label
    const al = (field.getAttribute('aria-label') || '').toLowerCase();
    for (const [p, k] of Object.entries(FIELD_MAP)) if (al.includes(p)) return k;
    // label text
    const lbl = labelFor(field);
    if (lbl) { const l = lbl.toLowerCase(); for (const [p, k] of Object.entries(FIELD_MAP)) if (l.includes(p)) return k; }
    // name, id, placeholder, title
    const attrs = [field.name, field.id, field.placeholder, field.title].map(a => (a || '').toLowerCase()).join(' ');
    for (const [p, k] of Object.entries(FIELD_MAP)) if (attrs.includes(p)) return k;
    return null;
  }

  function labelFor(field) {
    if (field.id) { const l = document.querySelector(`label[for="${field.id}"]`); if (l) return l.textContent; }
    const pl = field.closest('label');
    if (pl) { const c = pl.cloneNode(true); c.querySelectorAll('input,textarea,select').forEach(el => el.remove()); return c.textContent; }
    const prev = field.previousElementSibling;
    if (prev && ['LABEL', 'SPAN', 'DIV'].includes(prev.tagName)) return prev.textContent;
    return field.placeholder || field.name || field.id || '';
  }

  // ==================== FILLING ====================
  function fillInput(f, v) {
    if (!f || !v || f.type === 'hidden') return false;
    if (f.value && f.value.trim() !== '') return false;
    f.focus(); f.dispatchEvent(new Event('focus', { bubbles: true }));
    const setter = Object.getOwnPropertyDescriptor(
      f.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value'
    )?.set;
    if (setter) setter.call(f, v); else f.value = v;
    f.dispatchEvent(new Event('input', { bubbles: true }));
    f.dispatchEvent(new Event('change', { bubbles: true }));
    f.style.outline = '2px solid #22c55e';
    setTimeout(() => f.style.outline = '', 2000);
    return true;
  }

  function fillSelect(s, v) {
    if (!s || !v || s.value) return false;
    const opts = Array.from(s.options);
    let m = opts.find(o => o.text.trim().toLowerCase() === v.trim().toLowerCase());
    if (!m) m = opts.find(o => o.text.toLowerCase().includes(v.toLowerCase()));
    if (!m) m = opts.find(o => o.value.toLowerCase() === v.toLowerCase());
    if (m) { s.value = m.value; s.dispatchEvent(new Event('change', { bubbles: true })); return true; }
    return false;
  }

  function fillCheckbox(f, v) {
    if (!f) return false;
    const check = ['yes', 'true', '1', 'on'].includes(String(v).toLowerCase());
    if (f.checked !== check) { f.click(); f.dispatchEvent(new Event('change', { bubbles: true })); }
    return true;
  }

  // ==================== JD EXTRACTION ====================
  function extractJDText() {
    const sels = ['.job-description', '.job-details', '[class*="description"]',
      '#job-description', '.posting-content', '.job-body',
      '[data-automation="job-description"]', '.jobs-description-content',
      '.description', '.job-posting-summary'];
    for (const s of sels) {
      const el = document.querySelector(s);
      if (el && el.textContent.trim().length > 100) return el.textContent.trim().substring(0, 6000);
    }
    const blocks = document.querySelectorAll('div, section, article');
    let max = '';
    for (const b of blocks) {
      const t = b.textContent.trim();
      if (t.length > max.length && t.length < 12000) {
        if (/requirements|qualifications|responsibilities|about the role|what you.ll do/i.test(t)) max = t;
      }
    }
    return max.substring(0, 6000);
  }

  // ==================== MAIN FILL ====================
  async function fillForms() {
    const data = await getProfile();
    if (!data || Object.keys(data).length === 0) { notify('❌ پروفایل خالیه — اول رزومه آپلود کن', 'error'); return; }
    let filled = 0, total = 0;
    document.querySelectorAll('input, textarea, select').forEach(f => {
      const tag = f.tagName.toLowerCase();
      const type = f.type?.toLowerCase();
      if (['submit', 'button', 'reset', 'file', 'image', 'hidden'].includes(type)) return;
      total++;
      const key = matchField(f);
      if (tag === 'select') { if (key && data[key] && fillSelect(f, data[key])) filled++; return; }
      if (type === 'checkbox') { if (key && data[key]) { fillCheckbox(f, data[key]); filled++; } return; }
      if (type === 'radio') { if (key && data[key]) { f.click(); filled++; } return; }
      if (key && data[key] && fillInput(f, data[key])) filled++;
    });
    notify(`${filled}/${total} فیلد پر شد`, filled > 0 ? 'success' : 'warning');
    return { filled, total };
  }

  // ==================== NOTIFICATION ====================
  function notify(text, type) {
    const colors = { success: '#22c55e', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;top:16px;right:16px;background:#0f172a;color:${colors[type]||'#fff'};padding:12px 20px;border-radius:10px;border:1px solid ${colors[type]||'#334155'};box-shadow:0 8px 32px rgba(0,0,0,.5);z-index:999999;font-size:13px;font-family:'Segoe UI',Tahoma,sans-serif;`;
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, 3000);
  }

  // ==================== LISTENERS ====================
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'fillForms') { fillForms(); sendResponse({ ok: true }); }
    if (msg.action === 'detectATS') { sendResponse({ ats: detectATS() }); }
    if (msg.action === 'extractJD') {
      const jd = extractJDText();
      sendResponse({ jd, length: jd.length });
    }
    if (msg.action === 'getProfile') {
      getProfile().then(p => sendResponse(p));
      return true;
    }
  });
})();