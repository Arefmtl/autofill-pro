// AutoFill Pro - Popup Script v1.1 (with PDF.js)
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
      showStatus('❌ خطا در پردازش فایل: ' + error.message, 'error');
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

  // PDF extraction using pdf.js
  async function extractPDF(file) {
    // Load pdf.js dynamically
    const pdfjsLib = await loadPDFJS();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n\n';
    }

    return fullText.trim();
  }

  // Load pdf.js library dynamically
  async function loadPDFJS() {
    // Check if already loaded
    if (window.pdfjsLib) return window.pdfjsLib;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('lib/pdf.min.mjs');
      script.type = 'module';

      script.onload = async () => {
        // Import as module
        const pdfjsModule = await import(chrome.runtime.getURL('lib/pdf.min.mjs'));
        window.pdfjsLib = pdfjsModule;

        // Set worker
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          chrome.runtime.getURL('lib/pdf.worker.min.mjs');

        resolve(window.pdfjsLib);
      };

      script.onerror = () => {
        // Fallback: try to load from CDN
        const fallback = document.createElement('script');
        fallback.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs';
        fallback.type = 'module';
        fallback.onload = async () => {
          const mod = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs');
          window.pdfjsLib = mod;
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';
          resolve(window.pdfjsLib);
        };
        fallback.onerror = () => reject(new Error('Could not load PDF.js'));
        document.head.appendChild(fallback);
      };

      document.head.appendChild(script);
    });
  }

  // DOCX extraction
  async function extractDOCX(file) {
    try {
      // Load JSZip for DOCX parsing
      const JSZip = await loadJSZip();
      const zip = await JSZip.loadAsync(file);

      // Read document.xml
      const docXml = await zip.file('word/document.xml').async('text');

      // Extract text from XML tags
      const matches = docXml.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
      if (matches) {
        return matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
      }

      return docXml;
    } catch (error) {
      console.warn('DOCX parsing failed, trying raw text:', error);
      return await file.text();
    }
  }

  // Load JSZip dynamically
  async function loadJSZip() {
    if (window.JSZip) return window.JSZip;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      script.onload = () => resolve(window.JSZip);
      script.onerror = () => reject(new Error('Could not load JSZip'));
      document.head.appendChild(script);
    });
  }

  // Image OCR (placeholder - needs API for production)
  async function extractImage(file) {
    // For production, integrate with:
    // - Tesseract.js (client-side OCR)
    // - Google Cloud Vision API
    // - AWS Textract
    // - OpenAI GPT-4 Vision

    return `[Image: ${file.name}] - نیاز به OCR API دارد. لطفاً متن رزومه را به صورت PDF یا متن آپلود کنید.`;
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
      education: '',
      dateOfBirth: '',
      nationality: '',
      visaStatus: ''
    };

    if (!text) return data;

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

    // Website (generic)
    const websiteMatches = text.match(/(?:https?:\/\/)?(?:www\.)?[\w-]+\.\w+/g);
    if (websiteMatches) {
      const site = websiteMatches.find(s =>
        !s.includes('linkedin') && !s.includes('github') && !s.includes('email')
      );
      if (site) data.website = site.startsWith('http') ? site : 'https://' + site;
    }

    // Name (first line that looks like a name)
    const lines = text.split('\n').filter(l => l.trim());
    for (const line of lines) {
      const trimmed = line.trim();
      // English name: 2-4 words, letters only
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

    // Skills
    const skillsSection = text.match(/(?:skills?|مهارت|fähigkeiten)[\s:]*([\s\S]*?)(?:\n\n|\n(?=[A-Z\u0600-\u06FF]{2}))/i);
    if (skillsSection) {
      data.skills = skillsSection[1].trim();
    }

    // Summary / About
    const summarySection = text.match(/(?:about|summary|profile|درباره|uber mich)[\s:]*([\s\S]*?)(?:\n\n|\n(?=[A-Z\u0600-\u06FF]{2}))/i);
    if (summarySection) {
      data.summary = summarySection[1].trim();
    } else if (lines.length > 0) {
      // Use first paragraph as summary
      const firstPara = lines.slice(0, 3).join(' ');
      if (firstPara.length > 20 && firstPara.length < 500) {
        data.summary = firstPara;
      }
    }

    // Experience
    const expSection = text.match(/(?:experience|work|تجربه|سابقه|berufserfahrung)[\s:]*([\s\S]*?)(?=\n(?:education|skills|projects|تحصیلات))/i);
    if (expSection) {
      data.experience = expSection[1].trim();
    }

    // Education
    const eduSection = text.match(/(?:education|degree|university|تحصیلات|bildung)[\s:]*([\s\S]*?)(?=\n(?:experience|skills|projects|تجربه))/i);
    if (eduSection) {
      data.education = eduSection[1].trim();
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
      education: 'تحصیلات',
      dateOfBirth: 'تاریخ تولد',
      nationality: 'ملیت',
      visaStatus: 'وضعیت ویزا'
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
