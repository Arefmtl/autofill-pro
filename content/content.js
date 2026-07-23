// AutoFill Pro v3.0 — JobWizard Clone
(() => {
  'use strict';

  const AI_ENDPOINT = 'https://api.opencode.ai/v1/chat/completions';
  const AI_MODEL = 'mimo-2.5';

  // ==================== ATS DETECTION ====================
  const ATS_REGISTRY = {
    greenhouse: {
      domain: ['greenhouse.io', 'grnh.se'],
      selectors: ['form.application', '[class*="application_form"]', '#application_form'],
      fieldMap: { 'first_name': 'firstName', 'last_name': 'lastName', 'email': 'email', 'phone': 'phone', 'resume_text': 'summary', 'cover_letter_text': 'coverLetter' }
    },
    lever: {
      domain: ['lever.co'],
      selectors: ['form#application-form', '.posting-apply'],
      fieldMap: { 'name': 'fullName', 'email': 'email', 'phone': 'phone' }
    },
    workday: {
      domain: ['myworkdayjobs.com', 'workday.com'],
      selectors: ['[class*="WD"]', 'form[action*="workday"]'],
      fieldMap: { 'fullName': 'fullName', 'email': 'email', 'phone': 'phone', 'address': 'address' }
    },
    ashby: {
      domain: ['ashbyhq.com', 'jobs.ashbyhq.com'],
      selectors: ['[class*="ashby"]', 'form[class*="application"]'],
      fieldMap: { 'name': 'fullName', 'email': 'email', 'phone': 'phone' }
    },
    linkedin: {
      domain: ['linkedin.com'],
      selectors: ['form.jobs-easy-apply-form', '[data-job-id]'],
      fieldMap: { 'first-name': 'firstName', 'last-name': 'lastName', 'email': 'email', 'phone': 'phone' }
    },
    smartrecruiters: {
      domain: ['smartrecruiters.com', 'jobs.smartrecruiters.com'],
      selectors: ['.apply-form', '[class*="apply-form"]'],
      fieldMap: { 'name': 'fullName', 'email': 'email', 'phone': 'phone' }
    },
    bamboohr: {
      domain: ['bamboohr.com', 'jobs.bamboohr.com'],
      selectors: ['form#application', '.sticky-apply-form'],
      fieldMap: { 'firstName': 'firstName', 'lastName': 'lastName', 'email': 'email', 'phone': 'phone' }
    }
  };

  function detectATS() {
    const hostname = window.location.hostname.toLowerCase();
    for (const [name, cfg] of Object.entries(ATS_REGISTRY)) {
      if (cfg.domain.some(d => hostname.includes(d))) return { name, ...cfg };
    }
    // Generic ATS detection by DOM
    if (document.querySelector('form.application') || document.querySelector('[data-automation="job-application"]')) return { name: 'generic', selectors: ['form.application'], fieldMap: {} };
    if (document.querySelector('.job-application-form') || document.querySelector('[class*="apply-form"]')) return { name: 'generic', selectors: ['.job-application-form'], fieldMap: {} };
    return null;
  }

  // ==================== EXPANDED FIELD MAP ====================
  const FIELD_MAP = {
    'نام': 'fullName', 'نام کامل': 'fullName', 'full name': 'fullName', 'fullname': 'fullName',
    'first name': 'firstName', 'last name': 'lastName', 'vorname': 'firstName', 'nachname': 'lastName',
    'surname': 'lastName', 'firstName': 'firstName', 'lastName': 'lastName', 'name': 'fullName',
    'ایمیل': 'email', 'email': 'email', 'e-mail': 'email', 'mail': 'email', 'emailaddress': 'email',
    'تلفن': 'phone', 'phone': 'phone', 'tel': 'phone', 'telephone': 'phone', 'mobile': 'phone',
    'handy': 'phone', 'telefon': 'phone', 'phonenumber': 'phone', 'cellphone': 'phone',
    'آدرس': 'address', 'address': 'address', 'adresse': 'address', 'street': 'address',
    'stadt': 'city', 'city': 'city', 'country': 'country', 'land': 'country',
    'plz': 'zipCode', 'zip': 'zipCode', 'postalcode': 'zipCode',
    'لینکدین': 'linkedin', 'linkedin': 'linkedin', 'گیت‌هاب': 'github', 'github': 'github',
    'وب‌سایت': 'website', 'website': 'website', 'webseite': 'website',
    'skills': 'skills', 'مهارت': 'skills', 'experience': 'experience', 'تجربه': 'experience',
    'education': 'education', 'تحصیلات': 'education',
    'nationality': 'nationality', 'ملیت': 'nationality', 'visa': 'visaStatus', 'ویزا': 'visaStatus',
    'gender': 'gender', 'years of experience': 'yearsOfExperience', 'notice period': 'noticePeriod',
    'expected salary': 'salary', 'current salary': 'salary', 'salary expectation': 'salary',
    'github': 'github', 'portfolio': 'portfolio', 'website url': 'website',
    'title': 'currentTitle', 'job title': 'currentTitle', 'cover letter': 'coverLetter',
    'given-name': 'firstName', 'family-name': 'lastName', 'email': 'email', 'tel': 'phone',
    'street-address': 'address', 'postal-code': 'zipCode', 'organization': 'company',
    'organization-title': 'currentTitle', 'address-level2': 'city', 'address-level1': 'country',
  };

  // ==================== RATE LIMITING ====================
  let lastAICall = 0;
  const AI_COOLDOWN = 5000;
  function canCallAI() { const now = Date.now(); if (now - lastAICall < AI_COOLDOWN) return false; lastAICall = now; return true; }

  // ==================== STORAGE ====================
  async function getProfile() {
    return new Promise(resolve => chrome.storage.local.get(['profile', 'resumeData'], r => resolve({ ...(r.resumeData || {}), ...(r.profile || {}), fullName: r.profile?.fullName || r.resumeData?.fullName || [r.profile?.firstName, r.profile?.lastName].filter(Boolean).join(' ') })));
  }
  async function getApiKey() {
    if (window.SecureStorage) { const k = await window.SecureStorage.get('apiKey'); if (k) return k; }
    return new Promise(resolve => chrome.storage.local.get('settings', r => resolve(r.settings?.apiKey || '')));
  }

  // ==================== AI CALL ====================
  async function callAI(prompt, maxTokens = 500) {
    const apiKey = await getApiKey();
    if (!apiKey || !canCallAI()) return null;
    try {
      const resp = await fetch(AI_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }, body: JSON.stringify({ model: AI_MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0.3, max_tokens: maxTokens }) });
      if (!resp.ok) return null;
      const d = await resp.json();
      return d.choices[0]?.message?.content || null;
    } catch { return null; }
  }

  // ==================== FIELD MATCHING ====================
  function matchField(field) {
    const ac = (field.autocomplete || '').toLowerCase();
    if (ac && ac !== 'on' && ac !== 'off') { for (const [p, k] of Object.entries(FIELD_MAP)) if (ac === p || ac.includes(p)) return k; }
    const al = (field.getAttribute('aria-label') || '').toLowerCase();
    for (const [p, k] of Object.entries(FIELD_MAP)) if (al.includes(p)) return k;
    const lbl = field.getAttribute('aria-labelledby');
    if (lbl) { const el = document.getElementById(lbl); if (el) { const t = el.textContent.toLowerCase(); for (const [p, k] of Object.entries(FIELD_MAP)) if (t.includes(p)) return k; } }
    const label = labelFor(field);
    if (label) { const l = label.toLowerCase(); for (const [p, k] of Object.entries(FIELD_MAP)) if (l.includes(p)) return k; }
    const attrs = [field.name, field.id, field.placeholder, field.title, field.getAttribute('data-bind'), field.getAttribute('ng-model')].map(a => (a || '').toLowerCase()).join(' ');
    for (const [p, k] of Object.entries(FIELD_MAP)) if (attrs.includes(p)) return k;
    return null;
  }
  function labelFor(field) {
    if (field.id) { const l = document.querySelector(`label[for="${field.id}"]`); if (l) return l.textContent; }
    const pl = field.closest('label'); if (pl) { const c = pl.cloneNode(true); c.querySelectorAll('input, textarea, select').forEach(el => el.remove()); return c.textContent; }
    const prev = field.previousElementSibling; if (prev && ['LABEL', 'SPAN', 'DIV'].includes(prev.tagName)) return prev.textContent;
    return field.placeholder || field.name || field.id || '';
  }

  // ==================== FIELD FILLING ====================
  function fillInput(f, v) {
    if (!f || !v || f.type === 'hidden') return false;
    if (f.value && f.value.trim() !== '') return false;
    f.focus(); f.dispatchEvent(new Event('focus', { bubbles: true }));
    const setter = Object.getOwnPropertyDescriptor(f.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value')?.set;
    if (setter) setter.call(f, v); else f.value = v;
    f.dispatchEvent(new Event('input', { bubbles: true })); f.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  function fillSelect(s, v) {
    if (!s || !v) return false;
    if (s.value && s.value.trim() !== '') return false;
    const opts = Array.from(s.options);
    let m = opts.find(o => o.text.trim().toLowerCase() === v.toString().trim().toLowerCase());
    if (!m) m = opts.find(o => o.text.toLowerCase().includes(v.toString().toLowerCase()));
    if (!m) m = opts.find(o => o.value.toLowerCase() === v.toString().toLowerCase());
    if (m) { s.value = m.value; s.dispatchEvent(new Event('change', { bubbles: true })); return true; }
    return false;
  }
  function fillCheckbox(f, v) {
    if (!f) return false;
    const check = ['yes', 'true', '1', 'on', 'checked'].includes(String(v).toLowerCase().trim());
    if (f.checked !== check) { f.click(); f.dispatchEvent(new Event('change', { bubbles: true })); }
    return true;
  }

  // ==================== CUSTOM QUESTIONS ====================
  async function answerCustomQuestion(question, profile) {
    const prompt = `Job application question: "${question}".\nCandidate profile: ${JSON.stringify(profile)}\nAnswer in 1-3 sentences. Direct answer only.`;
    return await callAI(prompt, 200);
  }

  function detectCustomQuestions() {
    const questions = [];
    // Look for question-like elements: "Describe your experience with..."
    document.querySelectorAll('label, h4, h5, .question, .form-label').forEach(el => {
      const text = el.textContent.trim();
      if (!text) return;
      const keywords = ['describe', 'explain', 'tell us', 'why do you want', 'what is your', 'how would you', 'provide an example', ' درباره', 'توضیح', 'شرح'];
      if (keywords.some(k => text.toLowerCase().includes(k))) {
        const field = el.nextElementSibling || el.parentElement?.querySelector('textarea, input[type="text"]');
        if (field && (field.tagName === 'TEXTAREA' || field.type === 'text') && !field.value.trim()) {
          questions.push({ text, field });
        }
      }
    });
    return questions;
  }

  // ==================== JD SUMMARIZER ====================
  function extractJDText() {
    // Try common JD containers
    const selectors = [
      '.job-description', '.job-details', '[class*="description"]',
      '#job-description', '.posting-content', '.job-body',
      '[data-automation="job-description"]', '.jobs-description-content',
      '.description', '.job-posting-summary', '.jd-content'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim().length > 100) return el.textContent.trim().substring(0, 5000);
    }
    // Fallback: biggest text block on page
    const blocks = document.querySelectorAll('div, section, article');
    let max = '';
    for (const b of blocks) {
      const t = b.textContent.trim();
      if (t.length > max.length && t.length < 10000) {
        const hasJobKeywords = /requirements|qualifications|responsibilities|about the role|what you'll do/i.test(t);
        if (hasJobKeywords) max = t;
      }
    }
    return max.substring(0, 5000);
  }
  async function summarizeJD(jdText) {
    return await callAI(`Summarize this job description. Return JSON:
{"oneLiner":"1-sentence pitch","requirements":"3-5 bullet points","culture":"1-2 sentences about company culture","techStack":"comma-separated","salaryRange":"if mentioned"}

JD:
${jdText}

Return ONLY JSON.`, 500);
  }

  // ==================== MATCH SCORE ====================
  async function calculateMatchScore(profile, jdText) {
    return await callAI(`Compare candidate profile to job description. Return ONLY JSON:
{"score":85,"strengths":["Good match on ML skills","5yr experience"],"gaps":["No AWS listed","Missing German C1"],"recommendations":["Add AWS cert","Mention German"]}

Profile: ${JSON.stringify(profile)}
JD: ${jdText.substring(0, 3000)}`, 500);
  }

  // ==================== COVER LETTER ====================
  async function generateCoverLetter(profile, jdText, tone = 'professional') {
    return await callAI(`Write a tailored cover letter. Tone: ${tone}. Use the profile and JD.

Candidate: ${JSON.stringify(profile)}
Job (excerpt): ${jdText.substring(0, 2000)}

4 paragraphs max. Include specific skills from profile matched to JD requirements.`, 1000);
  }

  // ==================== MAIN FILL FUNCTION ====================
  async function fillForms(data) {
    if (!data || Object.keys(data).length === 0) {
      data = await getProfile();
      if (!data || Object.keys(data).length === 0) { showNotification('❌ پروفایل نداره!', 'error'); return; }
    }
    let filled = 0, total = 0;
    const ats = detectATS();
    // ATS-specific: use atsFieldMap as priority matcher
    const atsFieldMap = ats?.fieldMap || {};
    document.querySelectorAll('input, textarea, select').forEach(f => {
      const tag = f.tagName.toLowerCase(); const type = f.type?.toLowerCase();
      if (['submit', 'button', 'reset', 'file', 'image', 'hidden'].includes(type) || tag === 'hidden') return;
      total++;
      // Try ATS fieldMap first
      let key = atsFieldMap[(f.name || '').split('.').pop()] || atsFieldMap[(f.id || '').split('.').pop()] || matchField(f);
      if (tag === 'select') { if (key && data[key] && fillSelect(f, data[key])) filled++; return; }
      if (type === 'checkbox') { if (key && data[key] && fillCheckbox(f, data[key])) filled++; return; }
      if (type === 'radio') { if (key && data[key]) { f.click(); f.dispatchEvent(new Event('change', { bubbles: true })); filled++; } return; }
      if (key && data[key] && fillInput(f, data[key])) { filled++; f.style.outline = '2px solid #00ff88'; setTimeout(() => f.style.outline = '', 2000); }
    });
    showNotification(`${filled}/${total} فیلد (ATS: ${ats?.name || 'none'})`, filled > 0 ? 'success' : 'warning');
    return { filled, total, ats };
  }

  // ==================== Custom Questions Handler ====================
  async function answerQuestions(profile) {
    const questions = detectCustomQuestions();
    if (!questions.length) return;
    showNotification(`🤖 ${questions.length} سوال سفارشی — درحال پاسخ...`, 'warning');
    for (const q of questions) {
      const answer = await answerCustomQuestion(q.text, profile);
      if (answer) {
        q.field.value = answer;
        q.field.dispatchEvent(new Event('change', { bubbles: true }));
        q.field.style.outline = '2px solid #7c3aed';
        setTimeout(() => q.field.style.outline = '', 3000);
      }
    }
  }

  // ==================== SIDE PANEL ====================
  // Inject JobWizard-style sidebar with info
  async function injectSidePanel(profile, jdText) {
    // Don't inject twice
    if (document.getElementById('afp-sidebar')) return;
    const sidebar = document.createElement('div');
    sidebar.id = 'afp-sidebar';
    sidebar.style.cssText = `position:fixed;top:80px;right:20px;width:320px;max-height:calc(100vh-120px);background:#0f0f23;border:1px solid #00d4ff;border-radius:16px;z-index:999999;padding:16px;font-size:12px;color:#e0e0e0;direction:rtl;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.6);font-family:'Segoe UI',Tahoma,sans-serif`;
    sidebar.innerHTML = `<div style="color:#00d4ff;font-size:14px;font-weight:700;margin-bottom:8px">🤖 AutoFill Pro</div>`;
    document.body.appendChild(sidebar);

    // Show ATS detected
    const ats = detectATS();
    if (ats) showSidebarItem(sidebar, '🔍', `ATS شناسی شد: **${ats.name}**`);

    // Fetch JD + Summarize + Match + Cover Letter in parallel
    if (jdText && jdText.length > 100) {
      showSidebarItem(sidebar, '⏳', 'درحال تحلیل JD و پروفایل...');
      const profile = await getProfile();
      const apiKey = await getApiKey();

      if (apiKey) {
        // Parallel AI calls
        const prompt_combined = `Do all 3 tasks using the provided data:

TASK 1 — Summarize this job description concisely (2-3 bullet points about role, skills required, company vibe).

TASK 2 — Calculate fit score (0–100) between candidate profile and JD. Show 2 strengths and 2 gaps.

TASK 3 — Draft a cover letter (3 paragraphs, professional tone, match skills to JD).

Candidate profile:
${JSON.stringify(profile)}

Job description:
${jdText.substring(0, 3000)}

Return JSON:
{"summary":"...","score":85,"strengths":["a","b"],"gaps":["c","d"],"coverLetter":"..."}`;

        try {
          const result = await callAI(prompt_combined, 1200);
          const json = result ? JSON.parse(result.match(/\{[\s\S]*\}/)?.[0] || '{}') : {};
          if (json.summary) showSidebarItem(sidebar, '📊', `<b>خلاصه JD:</b><div style="margin-top:4px;font-size:11px">${json.summary}</div>`);
          if (json.score) showSidebarItem(sidebar, '⭐', `<b>Match Score: ${json.score}%</b><div style="margin-top:4px">✅ ${(json.strengths||[]).join('<br>✅ ')}<br>⚠️ ${(json.gaps||[]).join('<br>⚠️ ')}</div>`);
          if (json.coverLetter) {
            showSidebarItem(sidebar, '📧', `<b>Cover Letter:</b><div style="margin-top:4px;font-size:11px;white-space:pre-wrap">${json.coverLetter.substring(0, 800)}...</div>`);
            // Add copy button
            const copyBtn = document.createElement('button');
            copyBtn.style.cssText = 'margin-top:8px;padding:6px 12px;background:#00d4ff;color:#000;border:none;border-radius:6px;font-size:11px;cursor:pointer;width:100%';
            copyBtn.textContent = '📋 کپی Cover Letter';
            copyBtn.addEventListener('click', () => { navigator.clipboard.writeText(json.coverLetter); showNotification('📋 کپی شد!', 'success'); });
            sidebar.appendChild(copyBtn);
          }
        } catch (e) { showSidebarItem(sidebar, '❌', 'خطا در تحلیل JD'); }
      } else {
        showSidebarItem(sidebar, '🔑', 'API Key رایگان بگیر تا JD تحلیل بشه');
      }
    }
  }

  function showSidebarItem(sidebar, icon, html) {
    const div = document.createElement('div');
    div.style.cssText = 'margin-bottom:12px;padding:8px;background:rgba(0,212,255,0.05);border-radius:8px;border-left:2px solid #00d4ff';
    div.innerHTML = `<span style="margin-right:4px">${icon}</span> ${html}`;
    // Clear "loading" placeholder
    const loading = sidebar.querySelector('[data-loading]');
    if (loading) loading.remove();
    sidebar.appendChild(div);
  }

  // ==================== NOTIFICATIONS ====================
  function showNotification(text, type) {
    const colors = { success: '#00ff88', error: '#ff4444', warning: '#ffaa00' };
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;top:20px;right:340px;background:#1a1a2e;color:${colors[type]||'#fff'};padding:16px 24px;border-radius:12px;border:1px solid ${colors[type]||'#333'};box-shadow:0 8px 32px rgba(0,0,0,.5);z-index:999999;font-size:14px;direction:rtl`;
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, 3000);
  }

  // ==================== LISTENERS ====================
  chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
    if (msg.action === 'fillForms') {
      const profile = msg.profile || await getProfile();
      fillForms(profile);
      const jdText = extractJDText();
      injectSidePanel(profile, jdText);
      answerQuestions(profile);
      sendResponse({ success: true });
    }
    if (msg.action === 'analyzePage') {
      const jdText = extractJDText();
      const profile = await getProfile();
      injectSidePanel(profile, jdText);
      sendResponse({ jdFound: !!jdText, jdLength: jdText.length });
    }
    if (msg.action === 'generateCoverLetter') {
      const jdText = extractJDText();
      const profile = await getProfile();
      const letter = await generateCoverLetter(profile, jdText, msg.tone || 'professional');
      sendResponse({ coverLetter: letter });
    }
    if (msg.action === 'detectATS') {
      const ats = detectATS();
      sendResponse({ ats: ats?.name, selectors: ats?.selectors });
    }
  });
})();