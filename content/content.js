// AutoFill Pro - Content Script
// Runs on every web page to detect and fill forms

(() => {
  'use strict';

  // Field mapping: Persian/English labels → data keys
  const FIELD_MAP = {
    // Name fields
    'نام': 'fullName',
    'نام کامل': 'fullName',
    'full name': 'fullName',
    'fullname': 'fullName',
    'first name': 'firstName',
    'last name': 'lastName',
    'vorname': 'firstName',      // German
    'nachname': 'lastName',      // German
    'name': 'fullName',

    // Email fields
    'ایمیل': 'email',
    'پست الکترونیکی': 'email',
    'email': 'email',
    'e-mail': 'email',
    'mail': 'email',

    // Phone fields
    'تلفن': 'phone',
    'تلفن همراه': 'phone',
    'شماره تلفن': 'phone',
    'phone': 'phone',
    'tel': 'phone',
    'telephone': 'phone',
    'mobile': 'phone',
    'handy': 'phone',           // German
    'mobil': 'phone',           // German
    'telefon': 'phone',         // German

    // Address fields
    'آدرس': 'address',
    'address': 'address',
    'adresse': 'address',       // German
    'stadt': 'city',            // German
    'city': 'city',
    'stadt': 'city',
    'plz': 'postalCode',       // German
    'postal code': 'postalCode',
    'zip code': 'postalCode',
    'zip': 'postalCode',
    'land': 'country',         // German
    'country': 'country',
    'land': 'country',

    // LinkedIn
    'لینکدین': 'linkedin',
    'linkedin': 'linkedin',
    'linkedin url': 'linkedin',
    'linkedin profile': 'linkedin',

    // GitHub
    'گیت‌هاب': 'github',
    'github': 'github',
    'github url': 'github',
    'github profile': 'github',

    // Website
    'وب‌سایت': 'website',
    'وبسایت': 'website',
    'website': 'website',
    'webseite': 'website',      // German
    'homepage': 'website',
    'personal website': 'website',

    // Summary / About
    'درباره من': 'summary',
    'خلاصه': 'summary',
    'bio': 'summary',
    'about': 'summary',
    'about me': 'summary',
    'über mich': 'summary',     // German
    'summary': 'summary',
    'objective': 'summary',
    'cover letter': 'coverLetter',
    'coverletter': 'coverLetter',
    'anschreiben': 'coverLetter', // German

    // Skills
    'مهارت‌ها': 'skills',
    'مهارت': 'skills',
    'skills': 'skills',
    'fähigkeiten': 'skills',    // German

    // Experience
    'تجربه': 'experience',
    'سابقه کاری': 'experience',
    'experience': 'experience',
    'berufserfahrung': 'experience', // German

    // Education
    'تحصیلات': 'education',
    'education': 'education',
    'bildung': 'education',     // German
    'ausbildung': 'education',  // German

    // Date of Birth
    'تاریخ تولد': 'dateOfBirth',
    'تولد': 'dateOfBirth',
    'date of birth': 'dateOfBirth',
    'dob': 'dateOfBirth',
    'geburtstag': 'dateOfBirth', // German
    'geboren': 'dateOfBirth',    // German

    // Gender
    'جنسیت': 'gender',
    'جنسی': 'gender',
    'gender': 'gender',
    'geschlecht': 'gender',     // German

    // Nationality
    'ملیت': 'nationality',
    'nationality': 'nationality',
    'staatsangehörigkeit': 'nationality', // German

    // Visa / Work Permit
    'ویزا': 'visaStatus',
    'اقامت': 'visaStatus',
    'work permit': 'visaStatus',
    'visa status': 'visaStatus',
    'arbeitserlaubnis': 'visaStatus', // German
    'aufenthaltstitel': 'visaStatus', // German
  };

  // Get profile data from storage
  async function getProfileData() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['profile', 'resumeData'], (result) => {
        const data = { ...(result.resumeData || {}), ...(result.profile || {}) };
        resolve(data);
      });
    });
  }

  // Match form field to data key
  function matchField(field) {
    const label = getFieldLabel(field);
    if (!label) return null;

    const lowerLabel = label.toLowerCase().trim();

    // Direct match
    for (const [pattern, key] of Object.entries(FIELD_MAP)) {
      if (lowerLabel.includes(pattern.toLowerCase())) {
        return key;
      }
    }

    // Match by field attributes
    const name = (field.name || '').toLowerCase();
    const id = (field.id || '').toLowerCase();
    const placeholder = (field.placeholder || '').toLowerCase();
    const autocomplete = (field.autocomplete || '').toLowerCase();

    for (const [pattern, key] of Object.entries(FIELD_MAP)) {
      if (name.includes(pattern.toLowerCase()) ||
          id.includes(pattern.toLowerCase()) ||
          placeholder.includes(pattern.toLowerCase()) ||
          autocomplete.includes(pattern.toLowerCase())) {
        return key;
      }
    }

    return null;
  }

  // Get label for a form field
  function getFieldLabel(field) {
    // Check for associated label
    if (field.id) {
      const label = document.querySelector(`label[for="${field.id}"]`);
      if (label) return label.textContent;
    }

    // Check parent label
    const parentLabel = field.closest('label');
    if (parentLabel) {
      const clone = parentLabel.cloneNode(true);
      clone.querySelectorAll('input, textarea, select').forEach(el => el.remove());
      return clone.textContent;
    }

    // Check preceding text
    const prev = field.previousElementSibling;
    if (prev && (prev.tagName === 'LABEL' || prev.tagName === 'SPAN' || prev.tagName === 'DIV')) {
      return prev.textContent;
    }

    // Check parent container's first text
    const parent = field.parentElement;
    if (parent) {
      const textNodes = Array.from(parent.childNodes)
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => n.textContent.trim())
        .filter(t => t.length > 0);
      if (textNodes.length > 0) return textNodes[0];
    }

    // Fallback to attributes
    return field.placeholder || field.name || field.id || '';
  }

  // Fill a single field
  function fillField(field, value) {
    if (!field || !value) return false;

    // Skip hidden fields
    if (field.type === 'hidden') return false;

    // Skip if already filled (unless empty)
    if (field.value && field.value.trim() !== '') return false;

    // Focus the field
    field.focus();
    field.dispatchEvent(new Event('focus', { bubbles: true }));

    // Set value using native input setter (bypasses React/Vue)
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    )?.set;

    const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, 'value'
    )?.set;

    if (field.tagName === 'TEXTAREA' && nativeTextareaValueSetter) {
      nativeTextareaValueSetter.call(field, value);
    } else if (nativeInputValueSetter) {
      nativeInputValueSetter.call(field, value);
    } else {
      field.value = value;
    }

    // Trigger React/Vue/Angular events
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    field.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

    return true;
  }

  // Handle file upload fields
  function handleFileUpload(field, fileName) {
    // Check if there's a file input nearby
    const fileInput = field.closest('form')?.querySelector('input[type="file"]') ||
                      field.parentElement?.querySelector('input[type="file"]');

    if (fileInput) {
      // Store file reference for later
      fileInput.dataset.autofillFile = fileName;
      return true;
    }
    return false;
  }

  // Main fill function
  async function fillForms() {
    const data = await getProfileData();
    if (!data || Object.keys(data).length === 0) {
      showNotification('❌ رزومه‌ای ذخیره نشده!', 'error');
      return;
    }

    let filledCount = 0;
    let totalFields = 0;

    // Find all form fields
    const fields = document.querySelectorAll('input, textarea, select');

    fields.forEach(field => {
      const fieldType = field.type?.toLowerCase();
      if (['submit', 'button', 'reset', 'file', 'image', 'checkbox', 'radio'].includes(fieldType)) {
        return; // Skip these types
      }

      totalFields++;
      const dataKey = matchField(field);

      if (dataKey && data[dataKey]) {
        const success = fillField(field, data[dataKey]);
        if (success) {
          filledCount++;
          // Visual feedback
          field.style.outline = '2px solid #00ff88';
          field.style.outlineOffset = '1px';
          setTimeout(() => {
            field.style.outline = '';
            field.style.outlineOffset = '';
          }, 2000);
        }
      }
    });

    // Handle file upload fields
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
      const label = getFieldLabel(input);
      const lowerLabel = (label || '').toLowerCase();

      if (lowerLabel.includes('resume') || lowerLabel.includes('cv') ||
          lowerLabel.includes('رزومه') || lowerLabel.includes('profile photo') ||
          lowerLabel.includes('عکس') || lowerLabel.includes('photo')) {
        input.dataset.autofillHint = lowerLabel.includes('photo') || lowerLabel.includes('عکس')
          ? 'photo' : 'resume';
      }
    });

    // Show result
    if (filledCount > 0) {
      showNotification(`✅ ${filledCount} فیلد پر شد از ${totalFields} فیلد`, 'success');
    } else if (totalFields === 0) {
      showNotification('⚠️ فرمی پیدا نشد', 'warning');
    } else {
      showNotification('⚠️ فیلدی با رزومه مطابقت نداشت', 'warning');
    }
  }

  // Show floating notification
  function showNotification(text, type) {
    const colors = {
      success: '#00ff88',
      error: '#ff4444',
      warning: '#ffaa00',
      info: '#00d4ff'
    };

    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1a1a2e;
      color: ${colors[type] || '#fff'};
      padding: 16px 24px;
      border-radius: 12px;
      border: 1px solid ${colors[type] || '#333'};
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      z-index: 999999;
      font-family: 'Segoe UI', Tahoma, sans-serif;
      font-size: 14px;
      direction: rtl;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = text;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'fillForms') {
      fillForms();
      sendResponse({ success: true });
    }

    if (message.action === 'detectForms') {
      const forms = document.querySelectorAll('form');
      const inputs = document.querySelectorAll('input, textarea');
      sendResponse({
        formCount: forms.length,
        inputCount: inputs.length,
        url: window.location.href
      });
    }
  });

  // Auto-detect forms on page load
  const observer = new MutationObserver(() => {
    const forms = document.querySelectorAll('form');
    if (forms.length > 0) {
      // Show fill button indicator
      chrome.runtime.sendMessage({
        action: 'formsDetected',
        count: forms.length,
        url: window.location.href
      });
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('AutoFill Pro: Content script loaded ✅');
})();
