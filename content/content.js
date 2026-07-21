// AutoFill Pro v1.3 - Fixed Parser
(() => {
  'use strict';

  // ==================== FIELD MAP ====================
  const FIELD_MAP = {
    'نام': 'fullName', 'نام کامل': 'fullName', 'full name': 'fullName',
    'fullname': 'fullName', 'first name': 'firstName', 'last name': 'lastName',
    'vorname': 'firstName', 'nachname': 'lastName', 'name': 'fullName',
    'ایمیل': 'email', 'پست الکترونیکی': 'email', 'email': 'email',
    'e-mail': 'email', 'mail': 'email',
    'تلفن': 'phone', 'تلفن همراه': 'phone', 'شماره تلفن': 'phone',
    'phone': 'phone', 'tel': 'phone', 'telephone': 'phone',
    'mobile': 'phone', 'handy': 'phone', 'mobil': 'phone', 'telefon': 'phone',
    'آدرس': 'address', 'address': 'address', 'adresse': 'address',
    'stadt': 'city', 'city': 'city', 'plz': 'postalCode',
    'postal code': 'postalCode', 'zip code': 'postalCode', 'zip': 'postalCode',
    'land': 'country', 'country': 'country',
    'لینکدین': 'linkedin', 'linkedin': 'linkedin', 'linkedin url': 'linkedin',
    'گیت‌هاب': 'github', 'github': 'github', 'github url': 'github',
    'وب‌سایت': 'website', 'وبسایت': 'website', 'website': 'website',
    'webseite': 'website', 'homepage': 'website', 'personal website': 'website',
    'درباره من': 'summary', 'خلاصه': 'summary', 'bio': 'summary',
    'about': 'summary', 'about me': 'summary', 'über mich': 'summary',
    'summary': 'summary', 'objective': 'summary',
    'cover letter': 'coverLetter', 'anschreiben': 'coverLetter',
    'مهارت‌ها': 'skills', 'مهارت': 'skills', 'skills': 'skills',
    'fähigkeiten': 'skills',
    'تجربه': 'experience', 'سابقه کاری': 'experience', 'experience': 'experience',
    'berufserfahrung': 'experience', 'work experience': 'experience',
    'تحصیلات': 'education', 'education': 'education', 'bildung': 'education',
    'ausbildung': 'education', 'degree': 'education',
    'تاریخ تولد': 'dateOfBirth', 'تولد': 'dateOfBirth',
    'date of birth': 'dateOfBirth', 'dob': 'dateOfBirth', 'geburtstag': 'dateOfBirth',
    'جنسیت': 'gender', 'gender': 'gender', 'geschlecht': 'gender',
    'ملیت': 'nationality', 'nationality': 'nationality',
    'ویزا': 'visaStatus', 'اقامت': 'visaStatus', 'work permit': 'visaStatus',
    'visa status': 'visaStatus', 'arbeitserlaubnis': 'visaStatus',
  };

  // ==================== GET PROFILE ====================
  async function getProfileData() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['profile', 'resumeData'], (result) => {
        resolve({ ...(result.resumeData || {}), ...(result.profile || {}) });
      });
    });
  }

  // ==================== MATCH FIELD ====================
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

  // ==================== GET FIELD LABEL ====================
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
    if (prev && ['LABEL', 'SPAN', 'DIV'].includes(prev.tagName)) {
      return prev.textContent;
    }
    const parent = field.parentElement;
    if (parent) {
      const textNodes = Array.from(parent.childNodes)
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => n.textContent.trim())
        .filter(t => t.length > 0);
      if (textNodes.length > 0) return textNodes[0];
    }
    return field.placeholder || field.name || field.id || '';
  }

  // ==================== FILL FIELD ====================
  function fillField(field, value) {
    if (!field || !value) return false;
    if (field.type === 'hidden') return false;
    if (field.value && field.value.trim() !== '') return false;

    field.focus();
    field.dispatchEvent(new Event('focus', { bubbles: true }));

    const nativeSetter = Object.getOwnPropertyDescriptor(
      field.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
      'value'
    )?.set;

    if (nativeSetter) nativeSetter.call(field, value);
    else field.value = value;

    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    field.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

    return true;
  }

  // ==================== FILL FORMS ====================
  async function fillForms() {
    const data = await getProfileData();
    if (!data || Object.keys(data).length === 0) {
      showNotification('❌ رزومه‌ای ذخیره نشده!', 'error');
      return;
    }

    let filledCount = 0;
    let totalFields = 0;
    const fields = document.querySelectorAll('input, textarea, select');

    fields.forEach(field => {
      const t = field.type?.toLowerCase();
      if (['submit', 'button', 'reset', 'file', 'image', 'checkbox', 'radio'].includes(t)) return;

      totalFields++;
      const dataKey = matchField(field);

      if (dataKey && data[dataKey]) {
        const success = fillField(field, data[dataKey]);
        if (success) {
          filledCount++;
          field.style.outline = '2px solid #00ff88';
          field.style.outlineOffset = '1px';
          setTimeout(() => { field.style.outline = ''; field.style.outlineOffset = ''; }, 2000);
        }
      }
    });

    if (filledCount > 0) {
      showNotification(`✅ ${filledCount} فیلد پر شد از ${totalFields} فیلد`, 'success');
    } else if (totalFields === 0) {
      showNotification('⚠️ فرمی پیدا نشد', 'warning');
    } else {
      showNotification('⚠️ فیلدی با رزومه مطابقت نداشت', 'warning');
    }
  }

  // ==================== NOTIFICATION ====================
  function showNotification(text, type) {
    const colors = { success: '#00ff88', error: '#ff4444', warning: '#ffaa00', info: '#00d4ff' };
    const el = document.createElement('div');
    el.style.cssText = `
      position: fixed; top: 20px; right: 20px;
      background: #1a1a2e; color: ${colors[type] || '#fff'};
      padding: 16px 24px; border-radius: 12px;
      border: 1px solid ${colors[type] || '#333'};
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      z-index: 999999; font-family: 'Segoe UI', Tahoma, sans-serif;
      font-size: 14px; direction: rtl;
    `;
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }, 3000);
  }

  // ==================== LISTENERS ====================
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'fillForms') { fillForms(); sendResponse({ success: true }); }
    if (message.action === 'detectForms') {
      sendResponse({ formCount: document.querySelectorAll('form').length, inputCount: document.querySelectorAll('input, textarea').length, url: window.location.href });
    }
  });

  // Auto-detect forms
  const observer = new MutationObserver(() => {
    if (document.querySelectorAll('form').length > 0) {
      chrome.runtime.sendMessage({ action: 'formsDetected', count: document.querySelectorAll('form').length, url: window.location.href });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  console.log('AutoFill Pro v1.3: Content script loaded ✅');
})();
