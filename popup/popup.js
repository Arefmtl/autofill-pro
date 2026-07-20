// AutoFill Pro - Popup Script
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const selectFile = document.getElementById('selectFile');
  const uploadedFile = document.getElementById('uploadedFile');
  const fileName = document.getElementById('fileName');
  const removeFile = document.getElementById('removeFile');
  const extractedData = document.getElementById('extractedData');
  const dataPreview = document.getElementById('dataPreview');
  const saveData = document.getElementById('saveData');
  const fillBtn = document.getElementById('fillBtn');
  const statusBar = document.getElementById('statusBar');
  const statusText = document.getElementById('statusText');

  // Tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });

  // File upload
  selectFile.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('click', (e) => {
    if (e.target === dropZone || e.target.parentElement === dropZone) {
      fileInput.click();
    }
  });

  // Drag & Drop
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  });

  // Process uploaded file
  async function processFile(file) {
    showStatus('در حال پردازش فایل...', '');

    try {
      const text = await extractText(file);
      const parsed = parseResume(text);

      // Show uploaded file
      dropZone.style.display = 'none';
      uploadedFile.style.display = 'flex';
      fileName.textContent = file.name;

      // Show extracted data
      extractedData.style.display = 'block';
      dataPreview.innerHTML = '';

      for (const [key, value] of Object.entries(parsed)) {
        if (value) {
          const field = document.createElement('div');
          field.className = 'field';
          field.innerHTML = `
            <span class="field-label">${getFieldLabel(key)}</span>
            <span class="field-value">${truncate(value, 50)}</span>
          `;
          dataPreview.appendChild(field);
        }
      }

      // Store parsed data
      chrome.storage.local.set({ resumeData: parsed });
      showStatus('✅ اطلاعات استخراج شد!', 'success');
      fillBtn.style.display = 'block';

    } catch (error) {
      showStatus('❌ خطا در پردازش فایل', 'error');
      console.error(error);
    }
  }

  // Extract text from file
  async function extractText(file) {
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'txt') {
      return await file.text();
    }

    if (ext === 'pdf') {
      return await extractPDF(file);
    }

    if (ext === 'docx') {
      return await extractDOCX(file);
    }

    if (['jpg', 'jpeg', 'png'].includes(ext)) {
      return await extractImage(file);
    }

    return await file.text();
  }

  // PDF extraction (basic)
  async function extractPDF(file) {
    // For PDF, we'll use a simple approach
    // In production, use pdf.js library
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Simple text extraction from PDF
    let text = '';
    for (let i = 0; i < uint8Array.length; i++) {
      if (uint8Array[i] >= 32 && uint8Array[i] <= 126) {
        text += String.fromCharCode(uint8Array[i]);
      }
    }

    // Extract readable text between BT and ET markers
    const matches = text.match(/BT[\s\S]*?ET/g);
    if (matches) {
      return matches.map(m => {
        const textMatch = m.match(/\(([^)]+)\)/g);
        return textMatch ? textMatch.map(t => t.slice(1, -1)).join(' ') : '';
      }).join('\n');
    }

    return text;
  }

  // DOCX extraction (basic)
  async function extractDOCX(file) {
    // DOCX is a ZIP file with XML inside
    // For basic extraction, read as text
    const text = await file.text();
    // Extract text from XML tags
    const matches = text.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    if (matches) {
      return matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
    }
    return text;
  }

  // Image OCR (basic - needs API for production)
  async function extractImage(file) {
    // Basic: just return filename as hint
    // For production: use Tesseract.js or cloud OCR API
    return `[Image: ${file.name}] - نیاز به OCR API دارد`;
  }

  // Parse resume text into structured data
  function parseResume(text) {
    const data = {
      fullName: '',
      email: '',
      phone: '',
      address: '',
      linkedin: '',
      github: '',
      website: '',
      summary: '',
      skills: '',
      experience: '',
      education: ''
    };

    // Email
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) data.email = emailMatch[0];

    // Phone (international formats)
    const phoneMatch = text.match(/[\+]?[\d\s\-\(\)]{8,20}/);
    if (phoneMatch) data.phone = phoneMatch[0].trim();

    // LinkedIn
    const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
    if (linkedinMatch) data.linkedin = 'https://' + linkedinMatch[0];

    // GitHub
    const githubMatch = text.match(/github\.com\/[\w-]+/i);
    if (githubMatch) data.github = 'https://' + githubMatch[0];

    // Website
    const websiteMatch = text.match(/(?:https?:\/\/)?(?:www\.)?[\w-]+\.\w+/g);
    if (websiteMatch) {
      const site = websiteMatch.find(s => !s.includes('linkedin') && !s.includes('github'));
      if (site) data.website = site.startsWith('http') ? site : 'https://' + site;
    }

    // Name (first line that looks like a name)
    const lines = text.split('\n').filter(l => l.trim());
    for (const line of lines) {
      const trimmed = line.trim();
      // Name is usually 2-4 words, no special chars
      if (/^[A-Za-zÀ-ÿ\s]{2,40}$/.test(trimmed) && !trimmed.includes('@')) {
        data.fullName = trimmed;
        break;
      }
      // Persian name
      if (/^[\u0600-\u06FF\s]{2,40}$/.test(trimmed)) {
        data.fullName = trimmed;
        break;
      }
    }

    // Skills (look for skills section)
    const skillsSection = text.match(/(?:skills?|مهارت)[\s\S]*?(?:\n\n|\n(?=[A-Z]))/i);
    if (skillsSection) {
      data.skills = skillsSection[0].replace(/skills?:?\s*/i, '').trim();
    }

    // Summary (first paragraph)
    if (lines.length > 0) {
      const firstPara = lines.slice(0, 3).join(' ');
      if (firstPara.length > 20) {
        data.summary = firstPara;
      }
    }

    return data;
  }

  // Get field label in Persian
  function getFieldLabel(key) {
    const labels = {
      fullName: 'نام',
      email: 'ایمیل',
      phone: 'تلفن',
      address: 'آدرس',
      linkedin: 'لینکدین',
      github: 'گیت‌هاب',
      website: 'وب‌سایت',
      summary: 'خلاصه',
      skills: 'مهارت‌ها',
      experience: 'تجربه',
      education: 'تحصیلات'
    };
    return labels[key] || key;
  }

  // Truncate text
  function truncate(text, len) {
    return text.length > len ? text.substring(0, len) + '...' : text;
  }

  // Show status
  function showStatus(text, type) {
    statusText.textContent = text;
    statusBar.className = 'status-bar ' + type;
  }

  // Save extracted data
  saveData.addEventListener('click', () => {
    chrome.storage.local.get('resumeData', (result) => {
      if (result.resumeData) {
        // Also save to profile fields
        const fields = ['fullName', 'email', 'phone', 'address', 'linkedin', 'github', 'website', 'summary'];
        fields.forEach(field => {
          const el = document.getElementById(field);
          if (el && result.resumeData[field]) {
            el.value = result.resumeData[field];
          }
        });
        showStatus('✅ اطلاعات ذخیره شد!', 'success');
      }
    });
  });

  // Save profile
  document.getElementById('saveProfile').addEventListener('click', () => {
    const profile = {
      fullName: document.getElementById('fullName').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      address: document.getElementById('address').value,
      linkedin: document.getElementById('linkedin').value,
      github: document.getElementById('github').value,
      website: document.getElementById('website').value,
      summary: document.getElementById('summary').value
    };
    chrome.storage.local.set({ profile });
    showStatus('✅ پروفایل ذخیره شد!', 'success');
  });

  // Save settings
  document.getElementById('saveSettings').addEventListener('click', () => {
    const settings = {
      apiKey: document.getElementById('apiKey').value,
      autoFillEnabled: document.getElementById('autoFillEnabled').checked,
      jobSitesOnly: document.getElementById('jobSitesOnly').checked,
      allowedSites: document.getElementById('allowedSites').value.split(',').map(s => s.trim())
    };
    chrome.storage.local.set({ settings });
    showStatus('✅ تنظیمات ذخیره شد!', 'success');
  });

  // Fill button
  fillBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'fillForms' });
    showStatus('🚀 در حال پر کردن فرم...', 'success');
    setTimeout(() => window.close(), 1000);
  });

  // Remove file
  removeFile.addEventListener('click', () => {
    chrome.storage.local.remove('resumeData');
    dropZone.style.display = 'block';
    uploadedFile.style.display = 'none';
    extractedData.style.display = 'none';
    fillBtn.style.display = 'none';
    fileInput.value = '';
    showStatus('فایل حذف شد', '');
  });

  // Load saved data
  chrome.storage.local.get(['profile', 'settings', 'resumeData'], (result) => {
    if (result.profile) {
      Object.entries(result.profile).forEach(([key, value]) => {
        const el = document.getElementById(key);
        if (el) el.value = value;
      });
    }
    if (result.settings) {
      document.getElementById('apiKey').value = result.settings.apiKey || '';
      document.getElementById('autoFillEnabled').checked = result.settings.autoFillEnabled !== false;
      document.getElementById('jobSitesOnly').checked = result.settings.jobSitesOnly || false;
      document.getElementById('allowedSites').value = (result.settings.allowedSites || []).join(', ');
    }
    if (result.resumeData) {
      fillBtn.style.display = 'block';
      showStatus('📄 رزومه بارگذاری شده', 'success');
    }
  });
});
