// AutoFill Pro v1.6 - Security Hardened
(() => {
  'use strict';

  // ==================== CONFIG ====================
  const AI_ENDPOINT = 'https://api.opencode.ai/v1/chat/completions';
  const AI_MODEL = 'mimo-2.5';

  // ==================== FIELD MAP (Multi-language) ====================
  const FIELD_MAP = {
    'نام': 'fullName', 'نام کامل': 'fullName', 'full name': 'fullName',
    'fullname': 'fullName', 'first name': 'firstName', 'last name': 'lastName',
    'vorname': 'firstName', 'nachname': 'lastName', 'name': 'fullName',
    'ایمیل': 'email', 'email': 'email', 'e-mail': 'email', 'mail': 'email',
    'تلفن': 'phone', 'شماره تلفن': 'phone', 'phone': 'phone', 'tel': 'phone',
    'telephone': 'phone', 'mobile': 'phone', 'handy': 'phone', 'telefon': 'phone',
    'آدرس': 'address', 'address': 'address', 'adresse': 'address',
    'stadt': 'city', 'city': 'city', 'land': 'country', 'country': 'country',
    'لینکدین': 'linkedin', 'linkedin': 'linkedin',
    'گیت‌هاب': 'github', 'github': 'github',
    'وب‌سایت': 'website', 'website': 'website', 'webseite': 'website', 'homepage': 'website',
    'درباره من': 'summary', 'summary': 'summary', 'about': 'summary', 'über mich': 'summary',
    'مهارت‌ها': 'skills', 'skills': 'skills', 'fähigkeiten': 'skills',
    'تجربه': 'experience', 'experience': 'experience', 'berufserfahrung': 'experience',
    'تحصیلات': 'education', 'education': 'education', 'bildung': 'education',
    'تاریخ تولد': 'dateOfBirth', 'date of birth': 'dateOfBirth', 'dob': 'dateOfBirth',
    'ملیت': 'nationality', 'nationality': 'nationality',
    'ویزا': 'visaStatus', 'work permit': 'visaStatus', 'visa status': 'visaStatus',
  };

  // ==================== RATE LIMITING ====================
  let lastAICall = 0;
  const AI_COOLDOWN = 5000;
  function canCallAI() {
    const now = Date.now();
    if (now - lastAICall < AI_COOLDOWN) return false;
    lastAICall = now;
    return true;
  }

  // ==================== STORAGE ====================
  async function getProfile() {
    return new Promise(resolve => {
      chrome.storage.local.get(['profile', 'resumeData'], r => {
        resolve({ ...(r.resumeData || {}), ...(r.profile || {}) });
      });
    });
  }

  async function getApiKey() {
    // Try SecureStorage first, then fallback
    if (window.SecureStorage) {
      const key = await window.SecureStorage.get('apiKey');
      if (key) return key;
    }
    return new Promise(resolve => {
      chrome.storage.local.get('settings', r => {
        resolve(r.settings?.apiKey || '');
      });
    });
  }

  // ==================== TEXT EXTRACTION ====================
  async function extractText(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'txt') return await file.text();
    if (ext === 'pdf') return await extractPDF(file);
    if (ext === 'docx') return await extractDOCX(file);
    return await file.text();
  }

  async function extractPDF(file) {
    try {
      const lib = await loadPDFJS();
      const buf = await file.arrayBuffer();
      const pdf = await lib.getDocument({ data: buf }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(' ') + '\n\n';
      }
      return text.trim();
    } catch (e) {
      // Fallback: raw text extraction from buffer
      try {
        const buf = await file.arrayBuffer();
        const u8 = new Uint8Array(buf);
        let t = '';
        for (let i = 0; i < u8.length; i++) {
          if (u8[i] >= 32 && u8[i] <= 126) t += String.fromCharCode(u8[i]);
        }
        return t;
      } catch { return ''; }
    }
  }

  async function loadPDFJS() {
    if (window.pdfjsLib) return window.pdfjsLib;
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = chrome.runtime.getURL('lib/pdf.min.mjs');
      s.type = 'module';
      s.onload = async () => {
        try {
          const mod = await import(chrome.runtime.getURL('lib/pdf.min.mjs'));
          window.pdfjsLib = mod;
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('lib/pdf.worker.min.mjs');
          resolve(window.pdfjsLib);
        } catch (e) { reject(e); }
      };
      s.onerror = () => reject(new Error('PDF.js load failed'));
      document.head.appendChild(s);
    });
  }

  async function extractDOCX(file) {
    try {
      const zip = await (await loadJSZip()).loadAsync(file);
      const xml = await zip.file('word/document.xml').async('text');
      const matches = xml.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
      return matches ? matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ') : xml;
    } catch (e) { return await file.text(); }
  }

  async function loadJSZip() {
    if (window.JSZip) return window.JSZip;
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = chrome.runtime.getURL('lib/jszip.min.js');
      s.onload = () => resolve(window.JSZip);
      s.onerror = () => reject(new Error('JSZip load failed'));
      document.head.appendChild(s);
    });
  }

  // ==================== REGEX PARSER (Fallback) ====================
  function parseWithRegex(text) {
    const data = {
      fullName: '', email: '', phone: '', address: '',
      linkedin: '', github: '', website: '', summary: '',
      skills: '', experience: '', education: '',
      dateOfBirth: '', nationality: '', visaStatus: ''
    };
    if (!text || text.length < 10) return data;

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const em = text.match(/[\w.+-]+@[\w.-]+\.\w{2,}/);
    if (em) data.email = em[0];

    const phonePatterns = [
      /[\+]\d{1,4}[\s\-]?\d{3,4}[\s\-]?\d{3,4}[\s\-]?\d{0,4}/,
      /0\d{2,4}[\s\-]?\d{3,4}[\s\-]?\d{3,4}/,
      /\(\d{3,4}\)[\s\-]?\d{3,4}[\s\-]?\d{3,4}/
    ];
    for (const pat of phonePatterns) {
      const m = text.match(pat);
      if (m && m[0].replace(/\D/g, '').length >= 8) { data.phone = m[0].trim(); break; }
    }

    const li = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w\-]+\/?/i);
    if (li) data.linkedin = li[0].startsWith('http') ? li[0] : 'https://' + li[0];

    const gh = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w\-]+\/?/i);
    if (gh) data.github = gh[0].startsWith('http') ? gh[0] : 'https://' + gh[0];

    const wm = text.match(/(?:https?:\/\/)?(?:www\.)?[\w\-]+\.\w{2,}(?:\/\S*)?/g);
    if (wm) {
      const site = wm.find(s => !s.includes('linkedin') && !s.includes('github') && !s.includes('@'));
      if (site) data.website = site.startsWith('http') ? site : 'https://' + site;
    }

    const skipHeaders = ['experience', 'education', 'skills', 'summary', 'about', 'contact',
      'profile', 'work', 'projects', 'تجربه', 'تحصیلات', 'مهارت', 'درباره', 'تماس'];
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (skipHeaders.some(h => lower.includes(h))) continue;
      if (lower.includes('@') || lower.includes('http') || lower.includes('www')) continue;
      if (line.length < 2 || line.length > 60 || /\d{3,}/.test(line)) continue;
      const words = line.split(/\s+/);
      if (words.length >= 2 && words.length <= 5) {
        if (/^[A-Za-zÀ-ÿ\s\-\.]+$/.test(line) || /^[\u0600-\u06FF\s]+$/.test(line)) {
          data.fullName = line; break;
        }
      }
    }

    const full = lines.join('\n');
    const sec = (pattern) => {
      const m = full.match(pattern);
      return m ? m[1].replace(/\n{3,}/g, '\n\n').replace(/^\s*[\-\*•]\s*/gm, '').trim().substring(0, 1000) : '';
    };
    data.skills = sec(/(?:skills?|مهارت|capabilities|technologies|fähigkeiten)[:\s]*\n?([\s\S]*?)(?=\n(?:experience|work|education|projects|summary|about|contact|تجربه|تحصیلات|پروژه|درباره)|\n\n\n|$)/i);
    data.experience = sec(/(?:experience|work history|سابقه کاری|تجربه کاری|berufserfahrung)[:\s]*\n?([\s\S]*?)(?=\n(?:education|skills|projects|summary|about|contact|certifications|تحصیلات|مهارت|پروژه|درباره)|\n\n\n|$)/i);
    data.education = sec(/(?:education|degree|تحصیلات|bildung|ausbildung|studium)[:\s]*\n?([\s\S]*?)(?=\n(?:experience|skills|projects|summary|about|contact|certifications|تجربه|مهارت|پروژه|درباره)|\n\n\n|$)/i);
    data.summary = sec(/(?:about me|summary|profile|objective|درباره من|über mich|profil)[:\s]*\n?([\s\S]*?)(?=\n(?:experience|education|skills|work|contact|تجربه|تحصیلات|مهارت|تماس)|\n\n\n|$)/i);

    const addr = full.match(/(?:address|location|stadt|ort|wohnort|آدرس)[:\s]*([^\n]+)/i);
    if (addr) data.address = addr[1].trim();
    else {
      const cities = ['Berlin', 'München', 'Hamburg', 'Frankfurt', 'Köln', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dresden', 'Hannover', 'Wien', 'Zürich', 'Bern', 'Amsterdam', 'London', 'Paris', 'Tehran', 'Isfahan', 'Shiraz', 'Tabriz'];
      for (const c of cities) {
        if (full.match(new RegExp(c, 'i'))) { data.address = c; break; }
      }
    }

    const dob = full.match(/(?:date of birth|dob|geburtstag|تاریخ تولد|تولد|born)[:\s]*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4}|\d{4}[\/\.\-]\d{1,2}[\/\.\-]\d{1,2})/i);
    if (dob) data.dateOfBirth = dob[1];

    const nat = full.match(/(?:nationality|staatsangehörigkeit|ملیت)[:\s]*([^\n]+)/i);
    if (nat) data.nationality = nat[1].trim();

    const visa = full.match(/(?:visa|work permit|aufenthaltstitel|arbeitserlaubnis|ویزا|اقامت)[:\s]*([^\n]+)/i);
    if (visa) data.visaStatus = visa[1].trim();

    return data;
  }

  // ==================== AI PARSER ====================
  async function parseWithAI(text, apiKey) {
    if (!apiKey || !canCallAI()) return null;

    const prompt = `Extract structured data from this resume. Return ONLY a JSON object:
{"fullName":"","email":"","phone":"","address":"","linkedin":"","github":"","website":"","summary":"","skills":"","experience":"","education":"","dateOfBirth":"","nationality":"","visaStatus":""}

Resume text:
---
${text.substring(0, 4000)}
---

Return ONLY the JSON.`;

    try {
      const response = await fetch(AI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: AI_MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0.1, max_tokens: 1000 })
      });
      if (!response.ok) return null;
      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (err) { /* silent */ }
    return null;
  }

  async function parseResume(text) {
    const apiKey = await getApiKey();
    if (apiKey) {
      const aiResult = await parseWithAI(text, apiKey);
      if (aiResult && aiResult.fullName) return aiResult;
    }
    return parseWithRegex(text);
  }

  // ==================== FORM FILLING ====================
  function matchField(field) {
    const label = getFieldLabel(field);
    if (!label) return null;
    const lower = label.toLowerCase().trim();
    for (const [pattern, key] of Object.entries(FIELD_MAP)) {
      if (lower.includes(pattern.toLowerCase())) return key;
    }
    const attrs = [field.name, field.id, field.placeholder, field.autocomplete]
      .map(a => (a || '').toLowerCase()).join(' ');
    for (const [pattern, key] of Object.entries(FIELD_MAP)) {
      if (attrs.includes(pattern.toLowerCase())) return key;
    }
    return null;
  }

  function getFieldLabel(field) {
    if (field.id) {
      const label = document.querySelector(`label[for="${field.id}"]`);
      if (label) return label.textContent;
    }
    const parentLabel = field.closest('label');
    if (parentLabel) {
      const clone = parentLabel.cloneNode(true);
      clone.querySelectorAll('input, textarea, select').forEach(el => el.remove());
      return clone.textContent;
    }
    const prev = field.previousElementSibling;
    if (prev && ['LABEL', 'SPAN', 'DIV'].includes(prev.tagName)) return prev.textContent;
    const parent = field.parentElement;
    if (parent) {
      const texts = Array.from(parent.childNodes)
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => n.textContent.trim()).filter(t => t.length > 0);
      if (texts.length > 0) return texts[0];
    }
    return field.placeholder || field.name || field.id || '';
  }

  function fillField(field, value) {
    if (!field || !value || field.type === 'hidden') return false;
    if (field.value && field.value.trim() !== '') return false;
    field.focus();
    field.dispatchEvent(new Event('focus', { bubbles: true }));
    const setter = Object.getOwnPropertyDescriptor(
      field.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value'
    )?.set;
    if (setter) setter.call(field, value); else field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    field.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    return true;
  }

  async function fillForms() {
    const data = await getProfile();
    if (!data || Object.keys(data).length === 0) {
      showNotification('❌ رزومه‌ای ذخیره نشده!', 'error'); return;
    }
    let filled = 0, total = 0;
    document.querySelectorAll('input, textarea, select').forEach(field => {
      const t = field.type?.toLowerCase();
      if (['submit', 'button', 'reset', 'file', 'image', 'checkbox', 'radio'].includes(t)) return;
      total++;
      const key = matchField(field);
      if (key && data[key] && fillField(field, data[key])) {
        filled++;
        field.style.outline = '2px solid #00ff88';
        setTimeout(() => field.style.outline = '', 2000);
      }
    });
    showNotification(filled > 0 ? `${filled}/${total} فیلد پر شد` : '⚠️ فیلدی مطابقت نداشت',
      filled > 0 ? 'success' : 'warning');
  }

  function showNotification(text, type) {
    const colors = { success: '#00ff88', error: '#ff4444', warning: '#ffaa00' };
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;top:20px;right:20px;background:#1a1a2e;color:${colors[type] || '#fff'};padding:16px 24px;border-radius:12px;border:1px solid ${colors[type] || '#333'};box-shadow:0 8px 32px rgba(0,0,0,.5);z-index:999999;font-size:14px;direction:rtl`;
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, 3000);
  }

  // ==================== LISTENERS ====================
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'fillForms') { fillForms(); sendResponse({ success: true }); }
    if (msg.action === 'detectForms') {
      sendResponse({ formCount: document.querySelectorAll('form').length, url: window.location.href });
    }
  });
})();