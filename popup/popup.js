// AutoFill Pro v1.3 - Popup with Fixed Parser
document.addEventListener('DOMContentLoaded', () => {
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

  // Convert elements
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
    if (['jpg', 'jpeg', 'png'].includes(ext)) return `[Image: ${file.name}] - OCR not available. Please use PDF or text.`;
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
      console.error('PDF extraction failed:', err);
      // Fallback: try raw text extraction
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
      script.onerror = () => {
        // CDN fallback
        const s2 = document.createElement('script');
        s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs';
        s2.type = 'module';
        s2.onload = async () => {
          try {
            const mod = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs');
            window.pdfjsLib = mod;
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';
            resolve(window.pdfjsLib);
          } catch (e) { reject(e); }
        };
        s2.onerror = () => reject(new Error('PDF.js load failed'));
        document.head.appendChild(s2);
      };
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
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      s.onload = () => resolve(window.JSZip);
      s.onerror = () => reject(new Error('JSZip load failed'));
      document.head.appendChild(s);
    });
  }

  // ==================== RESUME PARSER (IMPROVED) ====================
  function parseResume(text) {
    const data = {
      fullName: '', email: '', phone: '', address: '',
      linkedin: '', github: '', website: '', summary: '',
      skills: '', experience: '', education: '',
      dateOfBirth: '', nationality: '', visaStatus: ''
    };

    if (!text || text.length < 10) return data;

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // === EMAIL ===
    const emailMatch = text.match(/[\w.+-]+@[\w.-]+\.\w{2,}/);
    if (emailMatch) data.email = emailMatch[0];

    // === PHONE ===
    // Match international formats: +49 170 1234567, +98 912 3456789, 0170 1234567
    const phonePatterns = [
      /[\+]\d{1,4}[\s\-]?\d{3,4}[\s\-]?\d{3,4}[\s\-]?\d{0,4}/,
      /0\d{2,4}[\s\-]?\d{3,4}[\s\-]?\d{3,4}/,
      /\(\d{3,4}\)[\s\-]?\d{3,4}[\s\-]?\d{3,4}/
    ];
    for (const pat of phonePatterns) {
      const m = text.match(pat);
      if (m && m[0].replace(/\D/g, '').length >= 8) {
        data.phone = m[0].trim();
        break;
      }
    }

    // === LINKEDIN ===
    const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w\-]+\/?/i);
    if (linkedinMatch) data.linkedin = linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : 'https://' + linkedinMatch[0];

    // === GITHUB ===
    const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w\-]+\/?/i);
    if (githubMatch) data.github = githubMatch[0].startsWith('http') ? githubMatch[0] : 'https://' + githubMatch[0];

    // === WEBSITE ===
    const websiteMatch = text.match(/(?:https?:\/\/)?(?:www\.)?[\w\-]+\.\w{2,}(?:\/\S*)?/g);
    if (websiteMatch) {
      const site = websiteMatch.find(s => !s.includes('linkedin') && !s.includes('github') && !s.includes('@'));
      if (site) data.website = site.startsWith('http') ? site : 'https://' + site;
    }

    // === FULL NAME ===
    // Strategy: look for the first line that looks like a name
    // (2-5 words, mostly letters, not an email, not a section header)
    const nameIndicators = ['name', 'نام', 'vorname', 'nachname', 'full name'];
    const sectionHeaders = ['experience', 'education', 'skills', 'summary', 'about', 'contact',
      'profile', 'work', 'projects', 'certifications', 'languages', 'interests',
      'تجربه', 'تحصیلات', 'مهارت', 'درباره', 'تماس', 'پروژه'];

    for (const line of lines) {
      const lower = line.toLowerCase();
      // Skip section headers
      if (sectionHeaders.some(h => lower.includes(h))) continue;
      // Skip emails, URLs, phone numbers
      if (lower.includes('@') || lower.includes('http') || lower.includes('www')) continue;
      // Skip lines that are too short or too long
      if (line.length < 2 || line.length > 60) continue;
      // Skip lines with numbers (likely phone/address)
      if (/\d{3,}/.test(line)) continue;

      // Check if it looks like a name
      const words = line.split(/\s+/);
      if (words.length >= 2 && words.length <= 5) {
        // English name: mostly letters
        if (/^[A-Za-zÀ-ÿÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßŒœĄąĆćĘęŁłŃńŚśŹźŻż\s\-\.]+$/.test(line)) {
          data.fullName = line;
          break;
        }
        // Persian/Arabic name
        if (/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]+$/.test(line)) {
          data.fullName = line;
          break;
        }
      }
    }

    // === SECTION-BASED EXTRACTION ===
    const fullText = lines.join('\n');

    // Skills
    const skillsMatch = fullText.match(/(?:skills?|capabilities|technologies|مهارت|مهارات|fähigkeiten|tech stack)[:\s]*\n?([\s\S]*?)(?=\n(?:experience|work|education|projects|summary|about|contact|تجربه|تحصیلات|پروژه|درباره)|\n\n\n|\Z)/i);
    if (skillsMatch) data.skills = cleanText(skillsMatch[1]);

    // Experience
    const expMatch = fullText.match(/(?:experience|work experience|work history|employment|سابقه کاری|تجربه کاری|berufserfahrung|berufserfahrungen)[:\s]*\n?([\s\S]*?)(?=\n(?:education|skills|projects|summary|about|contact|certifications|تحصیلات|مهارت|پروژه|درباره)|\n\n\n|\Z)/i);
    if (expMatch) data.experience = cleanText(expMatch[1]);

    // Education
    const eduMatch = fullText.match(/(?:education|academic|qualification|degree|تحصیلات|bildung|ausbildung|studium)[:\s]*\n?([\s\S]*?)(?=\n(?:experience|skills|projects|summary|about|contact|certifications|تجربه|مهارت|پروژه|درباره)|\n\n\n|\Z)/i);
    if (eduMatch) data.education = cleanText(eduMatch[1]);

    // Summary / About
    const summaryMatch = fullText.match(/(?:about me|summary|profile|objective|bio|overview|درباره من|درباره|über mich|profil)[:\s]*\n?([\s\S]*?)(?=\n(?:experience|education|skills|work|contact|تجربه|تحصیلات|مهارت|تماس)|\n\n\n|\Z)/i);
    if (summaryMatch) data.summary = cleanText(summaryMatch[1]);
    else if (lines.length > 0) {
      // Use first 2-3 lines as summary if they're long enough
      const firstLines = lines.slice(0, 3).join(' ');
      if (firstLines.length > 30 && firstLines.length < 600 && !data.fullName) {
        data.summary = firstLines;
      }
    }

    // Address (look for city/country patterns)
    const addressMatch = fullText.match(/(?:address|location|stadt|ort|wohnort|آدرس)[:\s]*([^\n]+)/i);
    if (addressMatch) data.address = addressMatch[1].trim();
    else {
      // Try to find a city name
      const cityMatch = fullText.match(/(?:Berlin|München|Hamburg|Frankfurt|Köln|Stuttgart|Düsseldorf|Leipzig|Dresden|Hannover|Wien|Zürich|Bern|Amsterdam|Rotterdam|London|Paris|Tehran|Tehran|Isfahan|Shiraz|Tabriz)/i);
      if (cityMatch) data.address = cityMatch[0];
    }

    // Date of Birth
    const dobMatch = fullText.match(/(?:date of birth|dob|geburtstag|تاریخ تولد|تولد|born)[:\s]*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4}|\d{4}[\/\.\-]\d{1,2}[\/\.\-]\d{1,2})/i);
    if (dobMatch) data.dateOfBirth = dobMatch[1];

    // Nationality
    const natMatch = fullText.match(/(?:nationality|staatsangehörigkeit|ملیت)[:\s]*([^\n]+)/i);
    if (natMatch) data.nationality = natMatch[1].trim();

    // Visa Status
    const visaMatch = fullText.match(/(?:visa|work permit|aufenthaltstitel|arbeitserlaubnis|ویزا|اقامت)[:\s]*([^\n]+)/i);
    if (visaMatch) data.visaStatus = visaMatch[1].trim();

    return data;
  }

  // Clean extracted text
  function cleanText(text) {
    return text
      .replace(/\n{3,}/g, '\n\n')  // Remove excessive newlines
      .replace(/^\s*[\-\*•]\s*/gm, '')  // Remove bullet points
      .trim()
      .substring(0, 1000);  // Limit length
  }

  // ==================== FILE PROCESSING ====================
  async function processFile(file) {
    showStatus('در حال پردازش فایل...', '');
    try {
      const text = await extractText(file);
      const parsed = parseResume(text);

      dropZone.style.display = 'none';
      uploadedFile.style.display = 'flex';
      fileName.textContent = file.name;

      extractedData.style.display = 'block';
      dataPreview.innerHTML = '';

      let fieldCount = 0;
      for (const [key, value] of Object.entries(parsed)) {
        if (value && value.length > 0) {
          fieldCount++;
          const field = document.createElement('div');
          field.className = 'field';
          field.innerHTML = `
            <span class="field-label">${getFieldLabel(key)}</span>
            <span class="field-value">${truncate(value, 60)}</span>
          `;
          dataPreview.appendChild(field);
        }
      }

      if (fieldCount === 0) {
        dataPreview.innerHTML = '<div style="color:#ff4444;padding:8px">⚠️ اطلاعاتی استخراج نشد. فایل دیگری امتحان کنید.</div>';
      }

      chrome.storage.local.set({ resumeData: parsed });
      showStatus(`✅ ${fieldCount} فیلد استخراج شد!`, 'success');
      fillBtn.style.display = 'block';

      // Debug: log parsed data
      console.log('Parsed resume:', parsed);

    } catch (error) {
      showStatus('❌ خطا: ' + error.message, 'error');
      console.error('Parse error:', error);
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
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function showStatus(text, type) {
    statusText.textContent = text;
    statusBar.className = 'status-bar ' + type;
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

  document.getElementById('saveProfile').addEventListener('click', () => {
    const profile = {};
    ['fullName', 'email', 'phone', 'address', 'linkedin', 'github', 'website', 'summary'].forEach(f => {
      profile[f] = document.getElementById(f).value;
    });
    chrome.storage.local.set({ profile });
    showStatus('✅ پروفایل ذخیره شد!', 'success');
  });

  document.getElementById('saveSettings').addEventListener('click', () => {
    chrome.storage.local.set({
      settings: {
        apiKey: document.getElementById('apiKey').value,
        autoFillEnabled: document.getElementById('autoFillEnabled').checked,
        jobSitesOnly: document.getElementById('jobSitesOnly').checked,
        allowedSites: document.getElementById('allowedSites').value.split(',').map(s => s.trim())
      }
    });
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
        case 'json': result = JSON.stringify({ filename: currentConvertFile.name, extractedAt: new Date().toISOString(), content: text, fields: parseResume(text) }, null, 2); break;
        case 'csv': const f = parseResume(text); result = [['Field', 'Value'], ...Object.entries(f).map(([k, v]) => [k, `"${(v || '').replace(/"/g, '""')}"`])].map(r => r.join(',')).join('\n'); break;
        case 'html': result = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${currentConvertFile.name}</title><style>body{font-family:Arial;max-width:800px;margin:0 auto;padding:20px}h1{color:#00d4ff}.f{margin:10px 0;padding:10px;background:#f5f5f5;border-radius:5px}.l{font-weight:bold}.v{color:#666;margin-top:5px}</style></head><body><h1>📄 ${currentConvertFile.name}</h1>${Object.entries(parseResume(text)).map(([k, v]) => v ? `<div class="f"><div class="l">${k}</div><div class="v">${v}</div></div>` : '').join('')}<hr><pre>${text}</pre></body></html>`; break;
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

  // ==================== BATCH ====================
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
    batchFiles.innerHTML = '';
    batchFileList.forEach((f, i) => {
      batchFiles.innerHTML += `<div class="batch-file-item"><span class="name">📄 ${f.name}</span><span class="size">${formatSize(f.size)}</span><button class="btn btn-danger btn-sm" onclick="window.removeBatchFile(${i})">✕</button></div>`;
    });
  }

  window.removeBatchFile = (i) => { batchFileList.splice(i, 1); updateBatchUI(); };

  batchConvertBtn.addEventListener('click', async () => {
    if (batchFileList.length === 0) return;
    showStatus(`🔄 تبدیل ${batchFileList.length} فایل...`, '');
    batchConvertBtn.disabled = true;
    let ok = 0;
    for (const file of batchFileList) {
      try {
        const text = await extractText(file);
        const result = text;
        const blob = new Blob([result], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name.replace(/\.[^.]+$/, `.${targetFormat.value}`);
        a.click();
        URL.revokeObjectURL(url);
        ok++;
      } catch (e) { console.error(e); }
    }
    batchConvertBtn.disabled = false;
    showStatus(`✅ ${ok}/${batchFileList.length} تبدیل شد`, 'success');
  });

  // ==================== LOAD SAVED ====================
  chrome.storage.local.get(['profile', 'settings', 'resumeData'], (result) => {
    if (result.profile) {
      Object.entries(result.profile).forEach(([k, v]) => { const el = document.getElementById(k); if (el) el.value = v; });
    }
    if (result.settings) {
      document.getElementById('apiKey').value = result.settings.apiKey || '';
      document.getElementById('autoFillEnabled').checked = result.settings.autoFillEnabled !== false;
      document.getElementById('jobSitesOnly').checked = result.settings.jobSitesOnly || false;
      document.getElementById('allowedSites').value = (result.settings.allowedSites || []).join(', ');
    }
    if (result.resumeData) { fillBtn.style.display = 'block'; showStatus('📄 رزومه بارگذاری شده', 'success'); }
  });
});
