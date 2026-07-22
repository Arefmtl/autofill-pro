// AutoFill Pro v1.8 - UX Overhaul
document.addEventListener('DOMContentLoaded', () => {
  // Dynamic version badge from manifest
  const version = chrome.runtime.getManifest().version;
  const versionBadge = document.getElementById('versionBadge');
  if (versionBadge) versionBadge.textContent = 'v' + version;

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
  const saveData = document.getElementById('saveData') || { addEventListener: () => {} }; // may not exist anymore
  const fillBtn = document.getElementById('fillBtn');
  const statusBar = document.getElementById('statusBar');
  const statusText = document.getElementById('statusText');

  const convertDropZone = document.getElementById('convertDropZone');
  const convertFileInput = document.getElementById('convertFileInput');
  const convertFileInfo = document.getElementById('convertFileInfo');
  const convertFileName = document.getElementById('convertFileName');
  const convertFileSize = document.getElementById('convertFileSize');
  const convertBtn = document.getElementById('convertBtn');
  const convertResult = document.getElementById('convertResult');
  const resultPreview = document.getElementById('resultPreview');
  const downloadResult = document.getElementById('downloadResult');
  const copyResult = document.getElementById('copyResult');
  const sourceFormat = document.getElementById('sourceFormat');
  const targetFormat = document.getElementById('targetFormat');

  const batchDropZone = document.getElementById('batchDropZone');
  const batchFileInput = document.getElementById('batchFileInput');
  const batchFiles = document.getElementById('batchFiles');
  const batchConvertBtn = document.getElementById('batchConvertBtn');

  let currentConvertFile = null;
  let currentConvertResult = '';
  let batchFileList = [];

  // ==================== SANITIZE ====================
  function sanitize(str) {
    if (!str) return '';
    return String(str).replace(/[<>&"']/g, c => ({
      '<': '<', '>': '>', '&': '&', '"': '"', "'": '&#39;'
    }[c]));
  }

  // ==================== RATE LIMITING ====================
  let lastAICall = 0;
  const AI_COOLDOWN = 5000; // 5 seconds between AI calls
  function canCallAI() {
    const now = Date.now();
    if (now - lastAICall < AI_COOLDOWN) return false;
    lastAICall = now;
    return true;
  }

  // ==================== TABS ====================
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });

  // ==================== FILE UPLOAD ====================
  selectFile.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('click', (e) => {
    if (e.target === dropZone || e.target.closest('.upload-area') === dropZone) fileInput.click();
  });
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); });
  fileInput.addEventListener('change', (e) => { if (e.target.files[0]) processFile(e.target.files[0]); });

  // ==================== TEXT EXTRACTION ====================
  async function extractText(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'txt') return await file.text();
    if (ext === 'pdf') return await extractPDF(file);
    if (ext === 'docx') return await extractDOCX(file);
    if (['jpg', 'jpeg', 'png'].includes(ext)) return `[Image: ${sanitize(file.name)}] - OCR not available.`;
    return await file.text();
  }

  async function extractPDF(file) {
    try {
      const pdfjsLib = await loadPDFJS();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map(item => item.str).join(' ') + '\n\n';
      }
      return fullText.trim();
    } catch (err) {
      const buffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(buffer);
      let text = '';
      for (let i = 0; i < uint8.length; i++) {
        if (uint8[i] >= 32 && uint8[i] <= 126) text += String.fromCharCode(uint8[i]);
      }
      return text;
    }
  }

  async function loadPDFJS() {
    if (window.pdfjsLib) return window.pdfjsLib;
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('lib/pdf.min.mjs');
      script.type = 'module';
      script.onload = async () => {
        try {
          const mod = await import(chrome.runtime.getURL('lib/pdf.min.mjs'));
          window.pdfjsLib = mod;
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('lib/pdf.worker.min.mjs');
          resolve(window.pdfjsLib);
        } catch (e) { reject(e); }
      };
      script.onerror = () => reject(new Error('PDF.js load failed'));
      document.head.appendChild(script);
    });
  }

  async function extractDOCX(file) {
    try {
      const JSZip = await loadJSZip();
      const zip = await JSZip.loadAsync(file);
      const docXml = await zip.file('word/document.xml').async('text');
      const matches = docXml.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
      if (matches) return matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
      return docXml;
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

  // ==================== RESUME PARSER ====================
  function parseResume(text) {
    const data = {
      fullName: '', email: '', phone: '', address: '',
      linkedin: '', github: '', website: '', summary: '',
      skills: '', experience: '', education: '',
      dateOfBirth: '', nationality: '', visaStatus: ''
    };

    if (!text || text.length < 10) return data;

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Email
    const emailMatch = text.match(/[\w.+-]+@[\w.-]+\.\w{2,}/);
    if (emailMatch) data.email = emailMatch[0];

    // Phone
    const phonePatterns = [
      /[\+]\d{1,4}[\s\-]?\d{3,4}[\s\-]?\d{3,4}[\s\-]?\d{0,4}/,
      /0\d{2,4}[\s\-]?\d{3,4}[\s\-]?\d{3,4}/,
      /\(\d{3,4}\)[\s\-]?\d{3,4}[\s\-]?\d{3,4}/
    ];
    for (const pat of phonePatterns) {
      const m = text.match(pat);
      if (m && m[0].replace(/\D/g, '').length >= 8) { data.phone = m[0].trim(); break; }
    }

    // LinkedIn
    const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w\-]+\/?/i);
    if (linkedinMatch) data.linkedin = linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : 'https://' + linkedinMatch[0];

    // GitHub
    const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w\-]+\/?/i);
    if (githubMatch) data.github = githubMatch[0].startsWith('http') ? githubMatch[0] : 'https://' + githubMatch[0];

    // Website
    const websiteMatch = text.match(/(?:https?:\/\/)?(?:www\.)?[\w\-]+\.\w{2,}(?:\/\S*)?/g);
    if (websiteMatch) {
      const site = websiteMatch.find(s => !s.includes('linkedin') && !s.includes('github') && !s.includes('@'));
      if (site) data.website = site.startsWith('http') ? site : 'https://' + site;
    }

    // Name
    const sectionHeaders = ['experience', 'education', 'skills', 'summary', 'about', 'contact',
      'profile', 'work', 'projects', 'certifications', 'languages', 'interests',
      'تجربه', 'تحصیلات', 'مهارت', 'درباره', 'تماس', 'پروژه'];
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (sectionHeaders.some(h => lower.includes(h))) continue;
      if (lower.includes('@') || lower.includes('http') || lower.includes('www')) continue;
      if (line.length < 2 || line.length > 60) continue;
      if (/\d{3,}/.test(line)) continue;
      const words = line.split(/\s+/);
      if (words.length >= 2 && words.length <= 5) {
        if (/^[A-Za-zÀ-ÿ\s\-\.]+$/.test(line) || /^[\u0600-\u06FF\s]+$/.test(line)) {
          data.fullName = line; break;
        }
      }
    }

    // Sections
    const fullText = lines.join('\n');
    const sec = (pattern) => {
      const m = fullText.match(pattern);
      return m ? cleanText(m[1]) : '';
    };
    data.skills = sec(/(?:skills?|capabilities|technologies|مهارت|fähigkeiten)[:\s]*\n?([\s\S]*?)(?=\n(?:experience|work|education|projects|summary|about|contact|تجربه|تحصیلات|پروژه|درباره)|\n\n\n|$)/i);
    data.experience = sec(/(?:experience|work experience|work history|employment|سابقه کاری|تجربه کاری|berufserfahrung)[:\s]*\n?([\s\S]*?)(?=\n(?:education|skills|projects|summary|about|contact|certifications|تحصیلات|مهارت|پروژه|درباره)|\n\n\n|$)/i);
    data.education = sec(/(?:education|academic|qualification|degree|تحصیلات|bildung|ausbildung|studium)[:\s]*\n?([\s\S]*?)(?=\n(?:experience|skills|projects|summary|about|contact|certifications|تجربه|مهارت|پروژه|درباره)|\n\n\n|$)/i);
    data.summary = sec(/(?:about me|summary|profile|objective|bio|overview|درباره من|über mich|profil)[:\s]*\n?([\s\S]*?)(?=\n(?:experience|education|skills|work|contact|تجربه|تحصیلات|مهارت|تماس)|\n\n\n|$)/i);

    // Address
    const addressMatch = fullText.match(/(?:address|location|stadt|ort|wohnort|آدرس)[:\s]*([^\n]+)/i);
    if (addressMatch) data.address = addressMatch[1].trim();
    else {
      const cityMatch = fullText.match(/(?:Berlin|München|Hamburg|Frankfurt|Köln|Stuttgart|Düsseldorf|Leipzig|Dresden|Hannover|Wien|Zürich|Bern|Amsterdam|London|Paris|Tehran|Isfahan|Shiraz|Tabriz)/i);
      if (cityMatch) data.address = cityMatch[0];
    }

    // DOB
    const dobMatch = fullText.match(/(?:date of birth|dob|geburtstag|تاریخ تولد|تولد|born)[:\s]*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4}|\d{4}[\/\.\-]\d{1,2}[\/\.\-]\d{1,2})/i);
    if (dobMatch) data.dateOfBirth = dobMatch[1];

    // Nationality
    const natMatch = fullText.match(/(?:nationality|staatsangehörigkeit|ملیت)[:\s]*([^\n]+)/i);
    if (natMatch) data.nationality = natMatch[1].trim();

    // Visa
    const visaMatch = fullText.match(/(?:visa|work permit|aufenthaltstitel|arbeitserlaubnis|ویزا|اقامت)[:\s]*([^\n]+)/i);
    if (visaMatch) data.visaStatus = visaMatch[1].trim();

    return data;
  }

  function cleanText(text) {
    return text.replace(/\n{3,}/g, '\n\n').replace(/^\s*[\-\*•]\s*/gm, '').trim().substring(0, 1000);
  }

  // ==================== FILE PROCESSING (XSS-SAFE) ====================
  async function processFile(file) {
    showStatus('در حال پردازش فایل...', '');
    try {
      const text = await extractText(file);
      const parsed = parseResume(text);

      dropZone.style.display = 'none';
      uploadedFile.style.display = 'flex';
      fileName.textContent = file.name;

      extractedData.style.display = 'block';
      while (dataPreview.firstChild) dataPreview.removeChild(dataPreview.firstChild);

      let fieldCount = 0;
      for (const [key, value] of Object.entries(parsed)) {
        if (value && value.length > 0) {
          fieldCount++;
          const field = document.createElement('div');
          field.className = 'field';
          const label = document.createElement('span');
          label.className = 'field-label';
          label.textContent = getFieldLabel(key);
          const val = document.createElement('span');
          val.className = 'field-value';
          val.textContent = truncate(value, 60);
          field.appendChild(label);
          field.appendChild(val);
          dataPreview.appendChild(field);
        }
      }

      if (fieldCount === 0) {
        const warn = document.createElement('div');
        warn.style.cssText = 'color:#ff4444;padding:8px';
        warn.textContent = '⚠️ اطلاعاتی استخراج نشد. فایل دیگری امتحان کنید.';
        dataPreview.appendChild(warn);
      }

      // Save to resumeData and load into profile tab
      chrome.storage.local.set({ resumeData: parsed });

      // Auto-populate current profile with extracted data
      if (!profiles[currentProfileId]) {
        profiles[currentProfileId] = { name: 'Profile 1', data: {}, language: 'fa' };
      }
      // Split fullName into first/last if parsed as single field
      if (parsed.fullName && !parsed.firstName) {
        const parts = parsed.fullName.split(/\s+/);
        parsed.firstName = parts[0] || '';
        parsed.lastName = parts.slice(1).join(' ') || '';
      }
      Object.assign(profiles[currentProfileId].data, parsed);
      loadProfileToForm();
      saveProfiles();

      showStatus(`${fieldCount} فیلد استخراج شد! → پرشون تب پروفایل`, 'success');
      fillBtn.style.display = 'block';

      // Hide empty state, show profile form
      const emptyState = document.getElementById('emptyState');
      const profileForm = document.getElementById('profileForm');
      if (emptyState) emptyState.style.display = 'none';
      if (profileForm) profileForm.style.display = 'block';

      // Auto-switch to profile tab
      const profileTab = document.querySelector('[data-tab="profile"]');
      if (profileTab) profileTab.click();
    } catch (error) {
      showStatus('❌ خطا: ' + error.message, 'error');
    }
  }

  // ==================== HELPERS ====================
  function getFieldLabel(key) {
    const labels = {
      fullName: '👤 نام', email: '📧 ایمیل', phone: '📞 تلفن',
      address: '📍 آدرس', linkedin: '🔗 لینکدین', github: '💻 گیت‌هاب',
      website: '🌐 وب‌سایت', summary: '📝 خلاصه', skills: '🛠️ مهارت‌ها',
      experience: '💼 تجربه', education: '🎓 تحصیلات', dateOfBirth: '🎂 تولد',
      nationality: '🌍 ملیت', visaStatus: '📋 ویزا'
    };
    return labels[key] || key;
  }

  function truncate(text, len) {
    if (!text) return '';
    return text.length > len ? text.substring(0, len) + '...' : text;
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function showStatus(text, type) {
    statusText.textContent = text;
    statusBar.className = 'status-bar ' + (type || '');
  }

  // ==================== EVENT LISTENERS ====================
  saveData.addEventListener('click', () => {
    chrome.storage.local.get('resumeData', (result) => {
      if (result.resumeData) {
        ['fullName', 'email', 'phone', 'address', 'linkedin', 'github', 'website', 'summary'].forEach(f => {
          const el = document.getElementById(f);
          if (el && result.resumeData[f]) el.value = result.resumeData[f];
        });
        showStatus('✅ اطلاعات ذخیره شد!', 'success');
      }
    });
  });

  // ==================== MULTI-PROFILE SYSTEM ====================
  const PROFILE_FIELDS = ['firstName', 'lastName', 'email', 'phone', 'address',
    'linkedin', 'github', 'website', 'summary', 'skills', 'experience',
    'education', 'nationality', 'visaStatus'];

  let profiles = {};
  let currentProfileId = 'default';
  let uiLanguage = 'fa';

  // i18n labels
  const i18n = {
    fa: {
      firstName: 'نام', lastName: 'نام خانوادگی', email: 'ایمیل', phone: 'تلفن',
      address: 'آدرس', linkedin: 'لینکدین', github: 'گیت‌هاب', website: 'وب‌سایت',
      summary: 'درباره من', skills: 'مهارت‌ها', experience: 'تجربه کاری',
      education: 'تحصیلات', nationality: 'ملیت', visaStatus: 'وضعیت ویزا',
      language: '🌐 زبان رزومه', saved: '✅ پروفایل ذخیره شد!',
      savedAs: '✅ پروفایل جدید ذخیره شد!', deleted: '✅ پروفایل حذف شد',
      confirmDelete: 'آیا از حذف این پروفایل مطمئن هستید؟', namePrompt: 'نام پروفایل جدید',
      cannotDelete: '❌ حداقل یک پروفایل باید باقی بماند', fillPrompt: 'نام پروفایل را وارد کنید'
    },
    en: {
      firstName: 'First Name', lastName: 'Last Name', email: 'Email', phone: 'Phone',
      address: 'Address', linkedin: 'LinkedIn', github: 'GitHub', website: 'Website',
      summary: 'About Me', skills: 'Skills', experience: 'Experience',
      education: 'Education', nationality: 'Nationality', visaStatus: 'Visa Status',
      language: '🌐 Resume Language', saved: '✅ Profile saved!',
      savedAs: '✅ New profile saved!', deleted: '✅ Profile deleted',
      confirmDelete: 'Delete this profile?', namePrompt: 'New profile name',
      cannotDelete: '❌ At least one profile required', fillPrompt: 'Enter profile name'
    },
    de: {
      firstName: 'Vorname', lastName: 'Nachname', email: 'E-Mail', phone: 'Telefon',
      address: 'Adresse', linkedin: 'LinkedIn', github: 'GitHub', website: 'Website',
      summary: 'Über mich', skills: 'Fähigkeiten', experience: 'Berufserfahrung',
      education: 'Bildung', nationality: 'Nationalität', visaStatus: 'Visum-Status',
      language: '🌐 Lebenslauf-Sprache', saved: '✅ Profil gespeichert!',
      savedAs: '✅ Neues Profil gespeichert!', deleted: '✅ Profil gelöscht',
      confirmDelete: 'Profil löschen?', namePrompt: 'Neuer Profilname',
      cannotDelete: '❌ Mindestens ein Profil erforderlich', fillPrompt: 'Profilname eingeben'
    }
  };

  // Load profiles from storage
  async function loadProfiles() {
    return new Promise(resolve => {
      chrome.storage.local.get(['profiles', 'currentProfileId', 'uiLanguage'], (result) => {
        profiles = result.profiles || {
          default: { name: 'Profile 1', data: {}, language: 'fa' }
        };
        currentProfileId = result.currentProfileId || 'default';
        uiLanguage = result.uiLanguage || 'fa';
        resolve();
      });
    });
  }

  async function saveProfiles() {
    return new Promise(resolve => {
      chrome.storage.local.set({ profiles, currentProfileId, uiLanguage }, resolve);
    });
  }

  function applyLanguage() {
    const labels = i18n[uiLanguage] || i18n.fa;
    const labelMap = {
      lblFirstName: 'firstName', lblLastName: 'lastName', lblEmail: 'email',
      lblPhone: 'phone', lblAddress: 'address', lblLinkedin: 'linkedin',
      lblGithub: 'github', lblWebsite: 'website', lblSummary: 'summary',
      lblSkills: 'skills', lblExperience: 'experience', lblEducation: 'education',
      lblNationality: 'nationality', lblVisa: 'visaStatus', lblLanguage: 'language'
    };
    Object.entries(labelMap).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = labels[key];
    });
    document.documentElement.lang = uiLanguage;
    document.documentElement.dir = uiLanguage === 'fa' ? 'rtl' : 'ltr';
  }

  // Populate profile select dropdown
  function refreshProfileSelect() {
    const select = document.getElementById('profileSelect');
    while (select.firstChild) select.removeChild(select.firstChild);
    Object.entries(profiles).forEach(([id, p]) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = p.name || id;
      if (id === currentProfileId) opt.selected = true;
      select.appendChild(opt);
    });
  }

  // Load profile data into form fields
  function loadProfileToForm() {
    const p = profiles[currentProfileId];
    if (!p) return;
    // Split fullName if present (migration)
    if (p.data.fullName && !p.data.firstName && !p.data.lastName) {
      const parts = p.data.fullName.split(/\s+/);
      p.data.firstName = parts[0] || '';
      p.data.lastName = parts.slice(1).join(' ') || '';
      delete p.data.fullName;
    }
    PROFILE_FIELDS.forEach(f => {
      const el = document.getElementById(f);
      if (el) el.value = p.data[f] || '';
    });
    const langSelect = document.getElementById('resumeLanguage');
    if (langSelect && p.language) langSelect.value = p.language;
  }

  // Collect form data into profile
  function collectProfileData() {
    const data = {};
    PROFILE_FIELDS.forEach(f => {
      const el = document.getElementById(f);
      if (el) data[f] = sanitize(el.value);
    });
    return data;
  }

  function generateId() {
    return 'p_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  }

  // Profile select change
  document.getElementById('profileSelect').addEventListener('change', (e) => {
    currentProfileId = e.target.value;
    loadProfileToForm();
    saveProfiles();
  });

  // Add profile button
  document.getElementById('addProfileBtn').addEventListener('click', () => {
    document.getElementById('profileNameEdit').style.display = 'flex';
    const nameInput = document.getElementById('profileName');
    nameInput.value = '';
    nameInput.focus();
    nameInput.placeholder = i18n[uiLanguage].fillPrompt || 'نام پروفایل';
  });

  // Confirm new profile name
  document.getElementById('confirmProfileName').addEventListener('click', () => {
    const name = document.getElementById('profileName').value.trim() || `Profile ${Object.keys(profiles).length + 1}`;
    const id = generateId();
    profiles[id] = { name, data: {}, language: uiLanguage };
    currentProfileId = id;
    document.getElementById('profileNameEdit').style.display = 'none';
    refreshProfileSelect();
    loadProfileToForm();
    saveProfiles();
    showStatus(i18n[uiLanguage].savedAs, 'success');
  });

  // Delete profile
  document.getElementById('deleteProfileBtn').addEventListener('click', () => {
    if (Object.keys(profiles).length <= 1) {
      showStatus(i18n[uiLanguage].cannotDelete, 'error');
      return;
    }
    if (!confirm(i18n[uiLanguage].confirmDelete)) return;
    delete profiles[currentProfileId];
    currentProfileId = Object.keys(profiles)[0];
    refreshProfileSelect();
    loadProfileToForm();
    saveProfiles();
    showStatus(i18n[uiLanguage].deleted, 'success');
  });

  // Save current profile
  document.getElementById('saveProfile').addEventListener('click', () => {
    if (!profiles[currentProfileId]) {
      profiles[currentProfileId] = { name: 'Profile', data: {}, language: 'fa' };
    }
    profiles[currentProfileId].data = collectProfileData();
    profiles[currentProfileId].language = document.getElementById('resumeLanguage').value;
    // Also save as resumeData for content script compatibility
    const langSelect = document.getElementById('resumeLanguage');
    const data = { ...profiles[currentProfileId].data };
    // For backward compat: combine firstName+lastName into fullName for form filling
    data.fullName = [data.firstName, data.lastName].filter(Boolean).join(' ');
    chrome.storage.local.set({ resumeData: data, profile: data });
    saveProfiles();
    showStatus(i18n[uiLanguage].saved, 'success');
  });

  // Save as new profile (inline input — no prompt())
  document.getElementById('saveAsProfile').addEventListener('click', () => {
    // Reuse the profile name edit input
    const editDiv = document.getElementById('profileNameEdit');
    const nameInput = document.getElementById('profileName');
    editDiv.style.display = 'flex';
    nameInput.value = `Profile ${Object.keys(profiles).length + 1}`;
    nameInput.focus();
    nameInput.select();

    // Temporarily override the confirm button
    const confirmBtn = document.getElementById('confirmProfileName');
    const originalHandler = confirmBtn.onclick;
    confirmBtn.onclick = null;
    confirmBtn.addEventListener('click', function saveAsHandler() {
      const name = nameInput.value.trim();
      if (!name) { nameInput.focus(); return; }
      const id = generateId();
      profiles[id] = { name, data: collectProfileData(), language: document.getElementById('resumeLanguage').value };
      currentProfileId = id;
      editDiv.style.display = 'none';
      refreshProfileSelect();
      saveProfiles();
      showStatus(i18n[uiLanguage].savedAs, 'success');
      confirmBtn.removeEventListener('click', saveAsHandler);
    }, { once: true });
  });

  // Language change
  document.getElementById('resumeLanguage').addEventListener('change', (e) => {
    if (profiles[currentProfileId]) profiles[currentProfileId].language = e.target.value;
    saveProfiles();
  });

  // SECURE: API key stored encrypted via SecureStorage
  document.getElementById('saveSettings').addEventListener('click', () => {
    const apiKeyVal = document.getElementById('apiKey').value;
    const settings = {
      autoFillEnabled: document.getElementById('autoFillEnabled').checked,
      jobSitesOnly: document.getElementById('jobSitesOnly').checked,
      allowedSites: document.getElementById('allowedSites').value.split(',').map(s => s.trim())
    };
    // Store API key separately (encrypted if SecureStorage available)
    if (window.SecureStorage && apiKeyVal) {
      window.SecureStorage.set('apiKey', apiKeyVal);
      settings.hasApiKey = true;
    } else {
      settings.apiKey = apiKeyVal;
    }
    chrome.storage.local.set({ settings });
    showStatus('✅ تنظیمات ذخیره شد!', 'success');
  });

  fillBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'fillForms' });
    showStatus('🚀 در حال پر کردن فرم...', 'success');
    setTimeout(() => window.close(), 1000);
  });

  removeFile.addEventListener('click', () => {
    chrome.storage.local.remove('resumeData');
    dropZone.style.display = 'block';
    uploadedFile.style.display = 'none';
    extractedData.style.display = 'none';
    fillBtn.style.display = 'none';
    fileInput.value = '';
    showStatus('فایل حذف شد', '');
  });

  // ==================== CONVERT ====================
  convertDropZone.addEventListener('click', () => convertFileInput.click());
  convertDropZone.addEventListener('dragover', (e) => { e.preventDefault(); convertDropZone.classList.add('dragover'); });
  convertDropZone.addEventListener('dragleave', () => convertDropZone.classList.remove('dragover'));
  convertDropZone.addEventListener('drop', (e) => { e.preventDefault(); convertDropZone.classList.remove('dragover'); if (e.dataTransfer.files[0]) setConvertFile(e.dataTransfer.files[0]); });
  convertFileInput.addEventListener('change', (e) => { if (e.target.files[0]) setConvertFile(e.target.files[0]); });

  function setConvertFile(file) {
    currentConvertFile = file;
    convertDropZone.style.display = 'none';
    convertFileInfo.style.display = 'flex';
    convertFileName.textContent = file.name;
    convertFileSize.textContent = formatSize(file.size);
    convertBtn.style.display = 'block';
    convertResult.style.display = 'none';
    const ext = file.name.split('.').pop().toLowerCase();
    if (['pdf', 'docx', 'txt', 'jpg', 'jpeg', 'png'].includes(ext)) sourceFormat.value = ext;
  }

  convertBtn.addEventListener('click', async () => {
    if (!currentConvertFile) return;
    showStatus('🔄 در حال تبدیل...', '');
    convertBtn.disabled = true;
    convertBtn.textContent = '⏳ در حال پردازش...';
    try {
      const text = await extractText(currentConvertFile);
      const target = targetFormat.value;
      let result = '';
      switch (target) {
        case 'txt': result = text; break;
        case 'json': result = JSON.stringify({ filename: sanitize(currentConvertFile.name), extractedAt: new Date().toISOString(), content: text, fields: parseResume(text) }, null, 2); break;
        case 'csv': const f = parseResume(text); result = [['Field', 'Value'], ...Object.entries(f).map(([k, v]) => [k, `"${(v || '').replace(/"/g, '""')}"`])].map(r => r.join(',')).join('\n'); break;
        case 'html': result = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${sanitize(currentConvertFile.name)}</title><style>body{font-family:Arial;max-width:800px;margin:0 auto;padding:20px}h1{color:#00d4ff}.f{margin:10px 0;padding:10px;background:#f5f5f5;border-radius:5px}.l{font-weight:bold}.v{color:#666;margin-top:5px}</style></head><body><h1>📄 ${sanitize(currentConvertFile.name)}</h1>${Object.entries(parseResume(text)).map(([k, v]) => v ? `<div class="f"><div class="l">${sanitize(k)}</div><div class="v">${sanitize(v)}</div></div>` : '').join('')}<hr><pre>${sanitize(text)}</pre></body></html>`; break;
        case 'md': let md = `# 📄 ${currentConvertFile.name}\n\n`; Object.entries(parseResume(text)).forEach(([k, v]) => { if (v) md += `## ${k}\n\n${v}\n\n`; }); md += `---\n\n## Full Text\n\n\`\`\`\n${text}\n\`\`\`\n`; result = md; break;
        default: result = text;
      }
      currentConvertResult = result;
      resultPreview.textContent = result;
      convertResult.style.display = 'block';
      showStatus('✅ تبدیل انجام شد!', 'success');
    } catch (error) {
      showStatus('❌ خطا: ' + error.message, 'error');
    } finally {
      convertBtn.disabled = false;
      convertBtn.textContent = '🔄 تبدیل کن';
    }
  });

  downloadResult.addEventListener('click', () => {
    if (!currentConvertResult) return;
    const ext = targetFormat.value;
    const mime = { txt: 'text/plain', json: 'application/json', csv: 'text/csv', html: 'text/html', md: 'text/markdown' };
    const blob = new Blob([currentConvertResult], { type: mime[ext] || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus('📥 دانلود شد!', 'success');
  });

  copyResult.addEventListener('click', () => {
    navigator.clipboard.writeText(currentConvertResult).then(() => showStatus('📋 کپی شد!', 'success'));
  });

  // ==================== BATCH (XSS-SAFE, no inline handlers) ====================
  batchDropZone.addEventListener('click', () => batchFileInput.click());
  batchDropZone.addEventListener('dragover', (e) => { e.preventDefault(); batchDropZone.classList.add('dragover'); });
  batchDropZone.addEventListener('dragleave', () => batchDropZone.classList.remove('dragover'));
  batchDropZone.addEventListener('drop', (e) => { e.preventDefault(); batchDropZone.classList.remove('dragover'); addBatchFiles(Array.from(e.dataTransfer.files)); });
  batchFileInput.addEventListener('change', (e) => addBatchFiles(Array.from(e.target.files)));

  function addBatchFiles(files) {
    files.forEach(f => { if (!batchFileList.find(x => x.name === f.name)) batchFileList.push(f); });
    updateBatchUI();
  }

  function updateBatchUI() {
    if (batchFileList.length === 0) { batchFiles.style.display = 'none'; batchConvertBtn.style.display = 'none'; return; }
    batchFiles.style.display = 'block';
    batchConvertBtn.style.display = 'block';
    // SAFE: build DOM elements, no innerHTML
    while (batchFiles.firstChild) batchFiles.removeChild(batchFiles.firstChild);
    batchFileList.forEach((f, i) => {
      const item = document.createElement('div');
      item.className = 'batch-file-item';
      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = '📄 ' + f.name;
      const size = document.createElement('span');
      size.className = 'size';
      size.textContent = formatSize(f.size);
      const btn = document.createElement('button');
      btn.className = 'btn btn-danger btn-sm';
      btn.textContent = '✕';
      // SAFE: event listener instead of onclick
      btn.addEventListener('click', () => { batchFileList.splice(i, 1); updateBatchUI(); });
      item.appendChild(name);
      item.appendChild(size);
      item.appendChild(btn);
      batchFiles.appendChild(item);
    });
  }

  batchConvertBtn.addEventListener('click', async () => {
    if (batchFileList.length === 0) return;
    showStatus(`🔄 تبدیل ${batchFileList.length} فایل...`, '');
    batchConvertBtn.disabled = true;
    let ok = 0;
    for (const file of batchFileList) {
      try {
        const text = await extractText(file);
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name.replace(/\.[^.]+$/, `.${targetFormat.value}`);
        a.click();
        URL.revokeObjectURL(url);
        ok++;
      } catch (e) { /* silent */ }
    }
    batchConvertBtn.disabled = false;
    showStatus(`✅ ${ok}/${batchFileList.length} تبدیل شد`, 'success');
  });

  // ==================== AUTO UPDATE CHECK ====================
  const checkUpdatesBtn = document.getElementById('checkUpdates');
  const updateStatus = document.getElementById('updateStatus');
  const updateBanner = document.getElementById('updateBanner');

  async function checkForUpdate(silent = false) {
    try {
      const resp = await fetch('https://api.github.com/repos/Arefmtl/autofill-pro/releases/latest');
      const data = await resp.json();
      const latest = data.tag_name || 'v0';
      const current = chrome.runtime.getManifest().version;
      const latestNum = parseFloat(latest.replace('v', ''));
      const currentNum = parseFloat(current);

      if (latestNum > currentNum) {
        // Show GLOBAL banner (on all tabs)
        if (updateBanner) {
          updateBanner.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:8px;padding:8px 12px;background:linear-gradient(135deg,rgba(0,212,255,0.15),rgba(124,58,237,0.15));border:1px solid #00d4ff;border-radius:8px;font-size:11px;cursor:pointer;text-decoration:none;color:#00d4ff';
          updateBanner.textContent = '';
          const icon = document.createElement('span');
          icon.textContent = '🆕';
          const text = document.createElement('span');
          text.textContent = `آپدیت جدید: ${latest} — کلیک کن`;
          text.style.flex = '1';
          updateBanner.appendChild(icon);
          updateBanner.appendChild(text);
          updateBanner.addEventListener('click', () => {
            chrome.tabs.create({ url: data.html_url });
          });
        }
        if (updateStatus) {
          while (updateStatus.firstChild) updateStatus.removeChild(updateStatus.firstChild);
          updateStatus.textContent = `🆕 آپدیت جدید: ${latest}`;
          updateStatus.style.color = '#00d4ff';
        }
      } else {
        if (!silent && updateStatus) {
          updateStatus.textContent = '✅ آخرین نسخه (v' + current + ')';
          updateStatus.style.color = '#00ff88';
        }
      }
    } catch (e) {
      if (!silent && updateStatus) {
        updateStatus.textContent = '❌ خطا در بررسی آپدیت';
        updateStatus.style.color = '#ff4444';
      }
    }
  }

  if (checkUpdatesBtn) {
    checkUpdatesBtn.addEventListener('click', () => checkForUpdate(false));
  }
  // Auto-check on startup (silent — only shows if update available)
  checkForUpdate(true);

  // ==================== LOAD SAVED ====================
  // Init profiles on startup
  (async () => {
    await loadProfiles();
    refreshProfileSelect();
    loadProfileToForm();
    applyLanguage();

    // Empty state vs profile form
    const emptyState = document.getElementById('emptyState');
    const profileForm = document.getElementById('profileForm');
    const fillBtn = document.getElementById('fillBtn');

    function checkEmptyState() {
      const hasData = Object.keys(profiles).length > 0 &&
        profiles[currentProfileId] &&
        Object.values(profiles[currentProfileId].data).some(v => v && v.length > 0);
      if (hasData) {
        if (emptyState) emptyState.style.display = 'none';
        if (profileForm) profileForm.style.display = 'block';
        if (fillBtn) fillBtn.style.display = 'block';
      } else {
        if (emptyState) emptyState.style.display = 'block';
        if (profileForm) profileForm.style.display = 'none';
        if (fillBtn) fillBtn.style.display = 'block'; // still show — user can fill with partial data
      }
    }
    checkEmptyState();

    // Empty state upload button
    const emptyUploadBtn = document.getElementById('emptyUploadBtn');
    if (emptyUploadBtn) {
      emptyUploadBtn.addEventListener('click', () => {
        const uploadTab = document.querySelector('[data-tab="upload"]');
        if (uploadTab) uploadTab.click();
      });
    }

    chrome.storage.local.get(['settings', 'resumeData'], async (result) => {
      if (result.settings) {
        // Load API key from SecureStorage if available
        if (window.SecureStorage && result.settings.hasApiKey) {
          const key = await window.SecureStorage.get('apiKey');
          if (key) document.getElementById('apiKey').value = key;
        } else if (result.settings.apiKey) {
          document.getElementById('apiKey').value = result.settings.apiKey;
        }
        document.getElementById('autoFillEnabled').checked = result.settings.autoFillEnabled !== false;
        document.getElementById('jobSitesOnly').checked = result.settings.jobSitesOnly || false;
        document.getElementById('allowedSites').value = (result.settings.allowedSites || []).join(', ');
      }
      if (result.resumeData) { fillBtn.style.display = 'block'; showStatus('📄 رزومه بارگذاری شده', 'success'); }
    });
  })();
});