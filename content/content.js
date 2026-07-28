// AutoFill Pro v6.0 — Phase 1: More ATS + JD Highlights + Career Chat
(() => {
  'use strict';

  const AI_ENDPOINT = 'https://api.opencode.ai/v1/chat/completions';
  const AI_MODEL = 'mimo-2.5';

  // ==================== ATS DETECTION (20+ platforms) ====================
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
    // New ATS platforms
    oracle: { domain: ['oracle.com/careers', 'oracle.com/recruiting'], name: 'Oracle' },
    successfactors: { domain: ['successfactors.com', 'sf-cf.com'], name: 'SuccessFactors' },
    jobvite: { domain: ['jobvite.com'], name: 'Jobvite' },
    icims: { domain: ['icims.com'], name: 'iCIMS' },
    ultipro: { domain: ['ultipro.com', 'paylocity.com'], name: 'UltiPro' },
    adp: { domain: ['adp.com'], name: 'ADP' },
    glassdoor: { domain: ['glassdoor.com'], name: 'Glassdoor' },
    indeed: { domain: ['indeed.com'], name: 'Indeed' },
    stepstone: { domain: ['stepstone.de', 'stepstone.at', 'stepstone.be'], name: 'StepStone' },
    xing: { domain: ['xing.com'], name: 'Xing' },
    monster: { domain: ['monster.de', 'monster.com'], name: 'Monster' },
    arbeitsagentur: { domain: ['arbeitsagentur.de'], name: 'Arbeitsagentur' },
    personio: { domain: ['personio.de', 'personio.com'], name: 'Personio' },
    haufe: { domain: ['haufe-akademie.de', 'haufe.com'], name: 'Haufe' },
    softgarden: { domain: ['softgarden.de'], name: 'Softgarden' },
    jobware: { domain: ['jobware.de'], name: 'Jobware' },
    recruitee: { domain: ['recruitee.com'], name: 'Recruitee' },
    teamtailor: { domain: ['teamtailor.com'], name: 'Teamtailor' },
    factorial: { domain: ['factorialhr.com'], name: 'Factorial' },
    kenjo: { domain: ['kenjo.io'], name: 'Kenjo' },
  };

  function detectATS() {
    const h = window.location.hostname.toLowerCase();
    for (const [name, cfg] of Object.entries(ATS_REGISTRY)) {
      if (cfg.domain.some(d => h.includes(d))) return { id: name, name: cfg.name };
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

  async function getJobs() {
    return new Promise(resolve => {
      chrome.storage.local.get('jobs', r => resolve(r.jobs || []));
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
    const ac = (field.autocomplete || '').toLowerCase();
    if (ac && ac !== 'on' && ac !== 'off') {
      for (const [p, k] of Object.entries(FIELD_MAP)) if (ac === p || ac.includes(p)) return k;
    }
    const al = (field.getAttribute('aria-label') || '').toLowerCase();
    for (const [p, k] of Object.entries(FIELD_MAP)) if (al.includes(p)) return k;
    const lbl = labelFor(field);
    if (lbl) { const l = lbl.toLowerCase(); for (const [p, k] of Object.entries(FIELD_MAP)) if (l.includes(p)) return k; }
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
      '.description', '.job-posting-summary', '.job-description__text',
      '[data-testid="job-description"]', '.jd-info'];
    for (const s of sels) {
      const el = document.querySelector(s);
      if (el && el.textContent.trim().length > 100) return el.textContent.trim().substring(0, 6000);
    }
    const blocks = document.querySelectorAll('div, section, article');
    let max = '';
    for (const b of blocks) {
      const t = b.textContent.trim();
      if (t.length > max.length && t.length < 12000) {
        if (/requirements|qualifications|responsibilities|about the role|what you.ll do|uber uns|anforderungen/i.test(t)) max = t;
      }
    }
    return max.substring(0, 6000);
  }

  // ==================== JD HIGHLIGHTS ====================
  function highlightJDKeywords(keywords) {
    if (!keywords || !keywords.length) return;
    
    // Remove existing highlights
    document.querySelectorAll('.afp-highlight').forEach(el => {
      el.replaceWith(el.textContent);
    });

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    let highlighted = 0;
    for (const node of textNodes) {
      const text = node.textContent;
      if (!text || text.length < 3) continue;
      
      for (const kw of keywords) {
        if (kw.length < 3) continue;
        const regex = new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        if (regex.test(text)) {
          const span = document.createElement('span');
          span.className = 'afp-highlight';
          span.style.cssText = 'background:rgba(250,204,21,0.3);border-radius:2px;padding:0 2px;border-bottom:2px solid #facc15;';
          span.innerHTML = text.replace(regex, '<mark class="afp-highlight">$1</mark>');
          node.parentNode.replaceChild(span, node);
          highlighted++;
          break;
        }
      }
    }
    return highlighted;
  }

  // Remove highlights
  function removeHighlights() {
    document.querySelectorAll('.afp-highlight').forEach(el => {
      el.replaceWith(el.textContent);
    });
  }

  // ==================== CAREER CHAT ====================
  let chatHistory = [];
  const MAX_CHAT_HISTORY = 20;

  async function careerChat(message) {
    const profile = await getProfile();
    const jd = extractJDText();
    const ats = detectATS();
    const jobs = await getJobs();

    const systemPrompt = `You are a career coach AI assistant inside AutoFill Pro Chrome extension.

CANDIDATE PROFILE:
${JSON.stringify(profile, null, 2)}

CURRENT JOB PAGE:
${jd ? jd.substring(0, 2000) : 'No job page detected'}
${ats ? `ATS Platform: ${ats.name}` : ''}

RECENT APPLICATIONS:
${jobs.slice(0, 5).map(j => `- ${j.company}: ${j.title} (${j.status})`).join('\n') || 'None yet'}

GUIDELINES:
- Be concise and actionable (2-4 sentences max)
- Give specific advice based on the candidate's profile
- If asked about the current job, analyze fit
- If asked about interview prep, give tailored questions
- If asked about resume improvement, suggest specific changes
- Support both English and Persian (Farsi)
- Never fabricate information — only use what's in the profile`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.slice(-MAX_CHAT_HISTORY),
      { role: 'user', content: message }
    ];

    try {
      const apiKey = await getApiKey();
      if (!apiKey) return '❌ API Key not set. Go to Settings.';
      
      const resp = await fetch(AI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: AI_MODEL, messages, temperature: 0.7, max_tokens: 800 })
      });
      
      if (!resp.ok) return '❌ AI error. Try again.';
      const d = await resp.json();
      const reply = d.choices[0]?.message?.content || 'No response';
      
      chatHistory.push({ role: 'user', content: message });
      chatHistory.push({ role: 'assistant', content: reply });
      if (chatHistory.length > MAX_CHAT_HISTORY * 2) chatHistory = chatHistory.slice(-MAX_CHAT_HISTORY);
      
      return reply;
    } catch (e) {
      return '❌ Connection error. Check API key.';
    }
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

  // ==================== LISTENERS ====================
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'fillForms') { fillForms(); sendResponse({ ok: true }); }
    if (msg.action === 'detectATS') { sendResponse({ ats: detectATS() }); }
    if (msg.action === 'extractJD') {
      const jd = extractJDText();
      sendResponse({ jd, length: jd.length });
    }
    if (msg.action === 'highlightKeywords') {
      const count = highlightJDKeywords(msg.keywords);
      sendResponse({ highlighted: count });
    }
    if (msg.action === 'removeHighlights') {
      removeHighlights();
      sendResponse({ ok: true });
    }
    if (msg.action === 'careerChat') {
      careerChat(msg.message).then(reply => sendResponse({ reply }));
      return true; // async response
    }
    if (msg.action === 'getProfile') {
      getProfile().then(p => sendResponse(p));
      return true;
    }
    if (msg.action === 'getChatHistory') {
      sendResponse({ history: chatHistory });
    }
  });
})();
