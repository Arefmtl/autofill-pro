// AutoFill Pro - Popup Script v1.2 (with File Converter)
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

  // Batch elements
  const batchDropZone = document.getElementById('batchDropZone');
  const batchFileInput = document.getElementById('batchFileInput');
  const batchFiles = document.getElementById('batchFiles');
  const batchConvertBtn = document.getElementById('batchConvertBtn');

  let currentConvertFile = null;
  let currentConvertResult = '';
  let batchFileList = [];

  // Tab switching
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
    if (e.target === dropZone || e.target.parentElement === dropZone) {
      fileInput.click();
    }
  });

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

  // ==================== FILE CONVERTER ====================
  convertDropZone.addEventListener('click', () => convertFileInput.click());
  convertDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    convertDropZone.classList.add('dragover');
  });
  convertDropZone.addEventListener('dragleave', () => {
    convertDropZone.classList.remove('dragover');
  });
  convertDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    convertDropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) setConvertFile(file);
  });
  convertFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) setConvertFile(file);
  });

  function setConvertFile(file) {
    currentConvertFile = file;
    convertDropZone.style.display = 'none';
    convertFileInfo.style.display = 'flex';
    convertFileName.textContent = file.name;
    convertFileSize.textContent = formatSize(file.size);
    convertBtn.style.display = 'block';
    convertResult.style.display = 'none';

    // Auto-detect format
    const ext = file.name.split('.').pop().toLowerCase();
    if (['pdf', 'docx', 'txt', 'jpg', 'jpeg', 'png'].includes(ext)) {
      sourceFormat.value = ext;
    }
  }

  // Convert button
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
        case 'txt':
          result = text;
          break;
        case 'json':
          result = convertToJSON(text, currentConvertFile.name);
          break;
        case 'csv':
          result = convertToCSV(text);
          break;
        case 'html':
          result = convertToHTML(text, currentConvertFile.name);
          break;
        case 'md':
          result = convertToMarkdown(text, currentConvertFile.name);
          break;
        case 'pdf':
          result = text + '\n\n[PDF output requires server-side processing]';
          break;
        default:
          result = text;
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

  // Download result
  downloadResult.addEventListener('click', () => {
    if (!currentConvertResult) return;

    const ext = targetFormat.value;
    const mimeTypes = {
      txt: 'text/plain',
      json: 'application/json',
      csv: 'text/csv',
      html: 'text/html',
      md: 'text/markdown'
    };

    const blob = new Blob([currentConvertResult], { type: mimeTypes[ext] || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus('📥 فایل دانلود شد!', 'success');
  });

  // Copy result
  copyResult.addEventListener('click', () => {
    navigator.clipboard.writeText(currentConvertResult).then(() => {
      showStatus('📋 کپی شد!', 'success');
    });
  });

  // ==================== BATCH CONVERT ====================
  batchDropZone.addEventListener('click', () => batchFileInput.click());
  batchDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    batchDropZone.classList.add('dragover');
  });
  batchDropZone.addEventListener('dragleave', () => {
    batchDropZone.classList.remove('dragover');
  });
  batchDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    batchDropZone.classList.remove('dragover');
    addBatchFiles(Array.from(e.dataTransfer.files));
  });
  batchFileInput.addEventListener('change', (e) => {
    addBatchFiles(Array.from(e.target.files));
  });

  function addBatchFiles(files) {
    files.forEach(file => {
      if (!batchFileList.find(f => f.name === file.name)) {
        batchFileList.push(file);
      }
    });
    updateBatchUI();
  }

  function updateBatchUI() {
    if (batchFileList.length === 0) {
      batchFiles.style.display = 'none';
      batchConvertBtn.style.display = 'none';
      return;
    }

    batchFiles.style.display = 'block';
    batchConvertBtn.style.display = 'block';
    batchFiles.innerHTML = '';

    batchFileList.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'batch-file-item';
      item.innerHTML = `
        <span class="name">📄 ${file.name}</span>
        <span class="size">${formatSize(file.size)}</span>
        <button class="btn btn-danger btn-sm" onclick="removeBatchFile(${index})">✕</button>
      `;
      batchFiles.appendChild(item);
    });
  }

  // Global function for batch file removal
  window.removeBatchFile = (index) => {
    batchFileList.splice(index, 1);
    updateBatchUI();
  };

  // Batch convert
  batchConvertBtn.addEventListener('click', async () => {
    if (batchFileList.length === 0) return;

    showStatus(`🔄 در حال تبدیل ${batchFileList.length} فایل...`, '');
    batchConvertBtn.disabled = true;

    const results = [];
    for (const file of batchFileList) {
      try {
        const text = await extractText(file);
        const target = targetFormat.value;
        let result = '';

        switch (target) {
          case 'txt': result = text; break;
          case 'json': result = convertToJSON(text, file.name); break;
          case 'csv': result = convertToCSV(text); break;
          case 'html': result = convertToHTML(text, file.name); break;
          case 'md': result = convertToMarkdown(text, file.name); break;
          default: result = text;
        }

        results.push({ name: file.name, content: result, status: '✅' });
      } catch (error) {
        results.push({ name: file.name, content: '', status: '❌ ' + error.message });
      }
    }

    // Download all as zip (or individual files)
    results.forEach(r => {
      if (r.status === '✅') {
        const blob = new Blob([r.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = r.name.replace(/\.[^.]+$/, `.${targetFormat.value}`);
        a.click();
        URL.revokeObjectURL(url);
      }
    });

    batchConvertBtn.disabled = false;
    showStatus(`✅ ${results.filter(r => r.status === '✅').length}/${results.length} فایل تبدیل شد`, 'success');
  });

  // ==================== CONVERSION FUNCTIONS ====================

  function convertToJSON(text, filename) {
    const data = {
      filename: filename,
      extractedAt: new Date().toISOString(),
      content: text,
      fields: parseResume(text)
    };
    return JSON.stringify(data, null, 2);
  }

  function convertToCSV(text) {
    const fields = parseResume(text);
    const rows = [
      ['Field', 'Value'],
      ...Object.entries(fields).map(([k, v]) => [k, `"${(v || '').replace(/"/g, '""')}"`])
    ];
    return rows.map(r => r.join(',')).join('\n');
  }

  function convertToHTML(text, filename) {
    const fields = parseResume(text);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Resume - ${filename}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #00d4ff; }
    .field { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
    .label { font-weight: bold; color: #333; }
    .value { color: #666; margin-top: 5px; }
  </style>
</head>
<body>
  <h1>📄 ${filename}</h1>
  ${Object.entries(fields).map(([k, v]) => v ? `
  <div class="field">
    <div class="label">${k}</div>
    <div class="value">${v}</div>
  </div>` : '').join('')}
  <hr>
  <pre>${text}</pre>
</body>
</html>`;
  }

  function convertToMarkdown(text, filename) {
    const fields = parseResume(text);
    let md = `# 📄 ${filename}\n\n`;
    md += `*Extracted: ${new Date().toLocaleDateString()}*\n\n`;

    for (const [key, value] of Object.entries(fields)) {
      if (value) {
        md += `## ${key}\n\n${value}\n\n`;
      }
    }

    md += `---\n\n## Full Text\n\n\`\`\`\n${text}\n\`\`\`\n`;
    return md;
  }

  // ==================== TEXT EXTRACTION ====================

  async function extractText(file) {
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'txt') return await file.text();
    if (ext === 'pdf') return await extractPDF(file);
    if (ext === 'docx') return await extractDOCX(file);
    if (['jpg', 'jpeg', 'png'].includes(ext)) return await extractImage(file);
    return await file.text();
  }

  async function extractPDF(file) {
    const pdfjsLib = await loadPDFJS();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map(item => item.str).join(' ') + '\n\n';
    }

    return fullText.trim();
  }

  async function loadPDFJS() {
    if (window.pdfjsLib) return window.pdfjsLib;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('lib/pdf.min.mjs');
      script.type = 'module';

      script.onload = async () => {
        const pdfjsModule = await import(chrome.runtime.getURL('lib/pdf.min.mjs'));
        window.pdfjsLib = pdfjsModule;
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          chrome.runtime.getURL('lib/pdf.worker.min.mjs');
        resolve(window.pdfjsLib);
      };

      script.onerror = () => {
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

  async function extractDOCX(file) {
    try {
      const JSZip = await loadJSZip();
      const zip = await JSZip.loadAsync(file);
      const docXml = await zip.file('word/document.xml').async('text');
      const matches = docXml.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
      if (matches) return matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
      return docXml;
    } catch (error) {
      return await file.text();
    }
  }

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

  async function extractImage(file) {
    return `[Image: ${file.name}] - نیاز به OCR API. لطفاً فایل PDF یا متن آپلود کنید.`;
  }

  // ==================== RESUME PARSER ====================

  function parseResume(text) {
    const data = {
      fullName: '', email: '', phone: '', address: '',
      linkedin: '', github: '', website: '', summary: '',
      skills: '', experience: '', education: ''
    };

    if (!text) return data;

    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) data.email = emailMatch[0];

    const phoneMatch = text.match(/[\+]?[\d\s\-\(\)]{8,20}/);
    if (phoneMatch) data.phone = phoneMatch[0].trim();

    const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
    if (linkedinMatch) data.linkedin = 'https://' + linkedinMatch[0];

    const githubMatch = text.match(/github\.com\/[\w-]+/i);
    if (githubMatch) data.github = 'https://' + githubMatch[0];

    const lines = text.split('\n').filter(l => l.trim());
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^[A-Za-zÀ-ÿ\s]{2,40}$/.test(trimmed) && !trimmed.includes('@')) {
        data.fullName = trimmed;
        break;
      }
      if (/^[\u0600-\u06FF\s]{2,40}$/.test(trimmed)) {
        data.fullName = trimmed;
        break;
      }
    }

    const skillsMatch = text.match(/(?:skills|مهارت|fähigkeiten)[\s:]*([\s\S]*?)(?:\n\n|\n(?=[A-Z\u0600-\u06FF]{2}))/i);
    if (skillsMatch) data.skills = skillsMatch[1].trim();

    const summaryMatch = text.match(/(?:about|summary|profile|درباره)[\s:]*([\s\S]*?)(?:\n\n|\n(?=[A-Z\u0600-\u06FF]{2}))/i);
    if (summaryMatch) data.summary = summaryMatch[1].trim();
    else if (lines.length > 0) {
      const fp = lines.slice(0, 3).join(' ');
      if (fp.length > 20 && fp.length < 500) data.summary = fp;
    }

    return data;
  }

  // ==================== HELPERS ====================

  function getFieldLabel(key) {
    const labels = {
      fullName: 'نام', email: 'ایمیل', phone: 'تلفن', address: 'آدرس',
      linkedin: 'لینکدین', github: 'گیت‌هاب', website: 'وب‌سایت',
      summary: 'خلاصه', skills: 'مهارت‌ها', experience: 'تجربه',
      education: 'تحصیلات'
    };
    return labels[key] || key;
  }

  function truncate(text, len) {
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

      chrome.storage.local.set({ resumeData: parsed });
      showStatus('✅ اطلاعات استخراج شد!', 'success');
      fillBtn.style.display = 'block';
    } catch (error) {
      showStatus('❌ خطا: ' + error.message, 'error');
    }
  }

  // ==================== EVENT LISTENERS ====================

  saveData.addEventListener('click', () => {
    chrome.storage.local.get('resumeData', (result) => {
      if (result.resumeData) {
        ['fullName', 'email', 'phone', 'address', 'linkedin', 'github', 'website', 'summary'].forEach(field => {
          const el = document.getElementById(field);
          if (el && result.resumeData[field]) el.value = result.resumeData[field];
        });
        showStatus('✅ اطلاعات ذخیره شد!', 'success');
      }
    });
  });

  document.getElementById('saveProfile').addEventListener('click', () => {
    const profile = {};
    ['fullName', 'email', 'phone', 'address', 'linkedin', 'github', 'website', 'summary'].forEach(field => {
      profile[field] = document.getElementById(field).value;
    });
    chrome.storage.local.set({ profile });
    showStatus('✅ پروفایل ذخیره شد!', 'success');
  });

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
