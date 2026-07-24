// AutoFill Pro v4.0 — AI-First (JobWizard clone)
document.addEventListener('DOMContentLoaded', () => {

  // Dynamic version
  const version = chrome.runtime.getManifest().version;
  const vBadge = document.getElementById('versionBadge');
  if (vBadge) vBadge.textContent = 'v' + version;

  // ==================== AI ENGINE ====================
  const AI_ENDPOINT = 'https://api.opencode.ai/v1/chat/completions';
  const AI_MODEL = 'mimo-2.5';
  let lastAICall = 0;
  const COOLDOWN = 4000;

  async function ai(prompt, maxTokens = 800) {
    const apiKey = await getApiKey();
    if (!apiKey) return null;
    const now = Date.now();
    if (now - lastAICall < COOLDOWN) return null;
    lastAICall = now;
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

  async function getApiKey() {
    if (window.SecureStorage) { const k = await window.SecureStorage.get('apiKey'); if (k) return k; }
    return new Promise(resolve => chrome.storage.local.get('settings', r => resolve(r.settings?.apiKey || '')));
  }

  // ==================== STORAGE ====================
  const PROFILE_FIELDS = ['firstName','lastName','email','phone','address','linkedin','github','website','summary','skills','experience','education','nationality','visaStatus','city','country','zipCode','yearsOfExperience','noticePeriod','salary'];
  let profiles = {};
  let currentProfileId = 'default';

  async function loadProfiles() {
    return new Promise(resolve => {
      chrome.storage.local.get(['profiles','currentProfileId'], r => {
        profiles = r.profiles || { default: { name: 'Profile 1', data: {} } };
        currentProfileId = r.currentProfileId || 'default';
        resolve();
      });
    });
  }
  async function saveProfiles() {
    return new Promise(resolve => chrome.storage.local.set({ profiles, currentProfileId }, resolve));
  }

  function refreshProfileSelect() {
    const s = document.getElementById('profileSelect');
    if (!s) return;
    while (s.firstChild) s.removeChild(s.firstChild);
    Object.entries(profiles).forEach(([id, p]) => {
      const o = document.createElement('option');
      o.value = id; o.textContent = p.name || id;
      if (id === currentProfileId) o.selected = true;
      s.appendChild(o);
    });
  }

  function loadProfileToForm() {
    const p = profiles[currentProfileId];
    if (!p) return;
    PROFILE_FIELDS.forEach(f => { const el = document.getElementById(f); if (el) el.value = p.data[f] || ''; });
  }

  function collectProfileData() {
    const data = {};
    PROFILE_FIELDS.forEach(f => { const el = document.getElementById(f); if (el) data[f] = el.value; });
    return data;
  }

  function checkEmptyState() {
    const p = profiles[currentProfileId];
    const hasData = p && Object.values(p.data).some(v => v && v.length > 0);
    document.getElementById('emptyState').style.display = hasData ? 'none' : 'block';
    document.getElementById('profileForm').style.display = hasData ? 'block' : 'none';
  }

  // ==================== ONBOARDING ====================
  async function checkOnboarding() {
    const apiKey = await getApiKey();
    if (!apiKey) {
      document.getElementById('onboarding').style.display = 'block';
      document.getElementById('mainApp').style.display = 'none';
    } else {
      document.getElementById('onboarding').style.display = 'none';
      document.getElementById('mainApp').style.display = 'block';
    }
  }

  const onboardBtn = document.getElementById('onboardStart');
  if (onboardBtn) {
    onboardBtn.addEventListener('click', async () => {
      const key = document.getElementById('onboardApiKey').value.trim();
      if (!key) { document.getElementById('onboardApiKey').style.borderColor = '#f38ba8'; return; }
      await chrome.storage.local.get('settings', async (r) => {
        const s = r.settings || {};
        s.apiKey = key;
        await chrome.storage.local.set({ settings: s });
        checkOnboarding();
      });
    });
  }

  // ==================== TABS ====================
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
      if (tab.dataset.tab === 'profile') checkEmptyState();
    });
  });

  // ==================== UPLOAD (AI extract) ====================
  async function processFile(file) {
    document.getElementById('uploadIdle').style.display = 'none';
    document.getElementById('uploadLoading').style.display = 'block';

    // Read file as text (simplified — no pdf.js in popup, use content script)
    let text = '';
    if (file.name.endsWith('.txt')) {
      text = await file.text();
    } else {
      // For PDF/DOCX: send to content script to extract
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      // Store file info for content script
      text = `[${file.name}] — PDF/DOCX parsing requires content script`;
    }

    const prompt = `Extract all data from this resume. Return ONLY a JSON object:
{"firstName":"","lastName":"","email":"","phone":"","address":"","city":"","country":"","zipCode":"","linkedin":"","github":"","website":"","summary":"2-3 sentences","skills":"comma separated","experience":"most recent job title @ company, years","education":"degree @ university","nationality":"","visaStatus":"","yearsOfExperience":"number","noticePeriod":"","salary":""}

Resume text:
---
${text.substring(0, 5000)}
---

Return ONLY the JSON object.`;

    const result = await ai(prompt, 600);
    let data = {};
    try {
      data = result ? JSON.parse(result.match(/\{[\s\S]*\}/)?.[0] || '{}') : {};
    } catch { data = {}; }

    // Save to profile
    if (!profiles[currentProfileId]) profiles[currentProfileId] = { name: 'Profile 1', data: {} };
    Object.assign(profiles[currentProfileId].data, data);
    await saveProfiles();

    // Also save as resumeData for content script
    await chrome.storage.local.set({ resumeData: data });

    document.getElementById('uploadLoading').style.display = 'none';
    document.getElementById('uploadDone').style.display = 'block';
    const fieldCount = Object.values(data).filter(v => v && v.length > 0).length;
    document.getElementById('uploadDoneSummary').textContent = `${fieldCount} فیلد استخراج شد ✅`;
  }

  const selectFile = document.getElementById('selectFile');
  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');

  if (selectFile) selectFile.addEventListener('click', () => fileInput.click());
  if (dropZone) {
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('dragover'); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); });
  }
  if (fileInput) fileInput.addEventListener('change', e => { if (e.target.files[0]) processFile(e.target.files[0]); });

  // View profile button
  document.getElementById('viewProfileBtn')?.addEventListener('click', () => {
    document.querySelector('[data-tab="profile"]').click();
  });
  document.getElementById('goToJobsBtn')?.addEventListener('click', () => {
    document.querySelector('[data-tab="jobs"]').click();
  });
  document.getElementById('emptyUploadBtn')?.addEventListener('click', () => {
    document.querySelector('[data-tab="upload"]').click();
  });

  // ==================== JOBS TAB ====================
  async function analyzePage() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    // Detect ATS
    chrome.tabs.sendMessage(tab.id, { action: 'detectATS' }, (resp) => {
      document.getElementById('atsName').textContent = resp?.ats || 'عمومی';
      document.getElementById('atsName').style.color = resp?.ats ? '#a6e3a1' : '#f9e2af';
      document.getElementById('atsUrl').textContent = tab.url || '';
    });

    // Extract JD
    chrome.tabs.sendMessage(tab.id, { action: 'extractJD' }, async (resp) => {
      if (!resp?.jd || resp.length < 50) {
        document.getElementById('jdSummary').textContent = '❌ JD پیدا نشد — مطمئنی روی صفحه job هستی؟';
        return;
      }

      document.getElementById('jdSummary').textContent = '⏳ تحلیل توسط AI...';
      const profile = profiles[currentProfileId]?.data || {};

      // Combined AI call
      const prompt = `Analyze this job description against the candidate profile. Return JSON:

{
  "summary":"2-3 bullet points about the role",
  "requirements":"key requirements",
  "culture":"company vibe",
  "score":85,
  "strengths":["...","..."],
  "gaps":["...","..."],
  "keywords":["keyword1","keyword2","keyword3","keyword4","keyword5"],
  "tailoredSummary":"A 2-sentence professional summary tailored for THIS specific job, highlighting the most relevant experience",
  "coverLetter":"A 3-paragraph cover letter tailored to this job. Paragraph 1: introduction + why excited. Paragraph 2: matching skills/experience to JD requirements. Paragraph 3: call to action. Professional tone."
}

Candidate Profile:
${JSON.stringify(profile)}

Job Description:
${resp.jd.substring(0, 4000)}

Return ONLY JSON.`;

      const result = await ai(prompt, 1500);
      let data = {};
      try { data = result ? JSON.parse(result.match(/\{[\s\S]*\}/)?.[0] || '{}') : {}; } catch {}

      // JD Summary
      if (data.summary) {
        document.getElementById('jdSummary').textContent = data.summary;
        if (data.requirements) document.getElementById('jdSummary').textContent += '\n\n📌 نیازمندی‌ها: ' + data.requirements;
        if (data.culture) document.getElementById('jdSummary').textContent += '\n🏢 فرهنگ: ' + data.culture;
      }

      // Match Score
      if (data.score) {
        document.getElementById('matchCard').style.display = 'block';
        document.getElementById('scoreNum').textContent = data.score + '%';
        const ring = document.getElementById('scoreRing');
        ring.style.borderColor = data.score > 70 ? '#a6e3a1' : data.score > 40 ? '#f9e2af' : '#f38ba8';
        document.getElementById('scoreNum').style.color = data.score > 70 ? '#a6e3a1' : data.score > 40 ? '#f9e2af' : '#f38ba8';
        let details = '';
        if (data.strengths?.length) details += '✅ ' + data.strengths.join('<br>✅ ');
        if (data.gaps?.length) details += '<br>⚠️ ' + data.gaps.join('<br>⚠️ ');
        document.getElementById('scoreDetails').innerHTML = details;
      }

      // Keywords
      if (data.keywords?.length) {
        document.getElementById('keywordsCard').style.display = 'block';
        document.getElementById('keywordsList').innerHTML = data.keywords.map(k => `<span class="kw-tag">${k}</span>`).join(' ');
      }

      // Tailored Resume
      if (data.tailoredSummary) {
        document.getElementById('resumeCard').style.display = 'block';
        document.getElementById('tailoredResume').textContent = data.tailoredSummary;
      }

      // Cover Letter
      if (data.coverLetter) {
        document.getElementById('clCard').style.display = 'block';
        document.getElementById('coverLetter').textContent = data.coverLetter;
      }
    });
  }

  document.getElementById('analyzeBtn')?.addEventListener('click', analyzePage);
  document.getElementById('fillBtn')?.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'fillForms' });
    showStatus('🚀 فرم پر شد!', 'success');
    setTimeout(() => window.close(), 800);
  });

  // Copy buttons
  document.getElementById('copyCL')?.addEventListener('click', () => {
    const t = document.getElementById('coverLetter')?.textContent;
    if (t) navigator.clipboard.writeText(t).then(() => showStatus('📋 کپی شد!', 'success'));
  });
  document.getElementById('copyResume')?.addEventListener('click', () => {
    const t = document.getElementById('tailoredResume')?.textContent;
    if (t) navigator.clipboard.writeText(t).then(() => showStatus('📋 کپی شد!', 'success'));
  });

  // ==================== PROFILE TAB ====================
  document.getElementById('profileSelect')?.addEventListener('change', e => {
    currentProfileId = e.target.value;
    loadProfileToForm();
    saveProfiles();
  });
  document.getElementById('addProfileBtn')?.addEventListener('click', () => {
    document.getElementById('profileNameEdit').style.display = 'flex';
    document.getElementById('profileName').focus();
  });
  document.getElementById('confirmProfileName')?.addEventListener('click', () => {
    const name = document.getElementById('profileName').value.trim() || 'Profile';
    const id = 'p_' + Date.now().toString(36);
    profiles[id] = { name, data: {} };
    currentProfileId = id;
    document.getElementById('profileNameEdit').style.display = 'none';
    refreshProfileSelect();
    loadProfileToForm();
    saveProfiles();
    showStatus('✅ پروفایل جدید', 'success');
  });
  document.getElementById('deleteProfileBtn')?.addEventListener('click', () => {
    if (Object.keys(profiles).length <= 1) return;
    delete profiles[currentProfileId];
    currentProfileId = Object.keys(profiles)[0];
    refreshProfileSelect();
    loadProfileToForm();
    saveProfiles();
  });
  document.getElementById('saveProfile')?.addEventListener('click', async () => {
    if (!profiles[currentProfileId]) profiles[currentProfileId] = { name: 'Profile', data: {} };
    profiles[currentProfileId].data = collectProfileData();
    await saveProfiles();
    const data = { ...profiles[currentProfileId].data };
    data.fullName = [data.firstName, data.lastName].filter(Boolean).join(' ');
    await chrome.storage.local.set({ resumeData: data, profile: data });
    showStatus('✅ ذخیره شد!', 'success');
  });

  // ==================== SETTINGS ====================
  document.getElementById('saveSettings')?.addEventListener('click', () => {
    const key = document.getElementById('apiKey').value.trim();
    chrome.storage.local.get('settings', async (r) => {
      const s = r.settings || {};
      if (key) s.apiKey = key;
      s.autoFillEnabled = document.getElementById('autoFillEnabled')?.checked;
      s.jobSitesOnly = document.getElementById('jobSitesOnly')?.checked;
      s.allowedSites = document.getElementById('allowedSites')?.value?.split(',').map(v => v.trim());
      await chrome.storage.local.set({ settings: s });
      document.getElementById('apiKeyStatus').textContent = '✅ فعال';
      showStatus('✅ ذخیره شد!', 'success');
    });
  });

  // Check updates
  document.getElementById('checkUpdates')?.addEventListener('click', async () => {
    const us = document.getElementById('updateStatus');
    us.textContent = '⏳ بررسی...';
    try {
      const r = await fetch('https://api.github.com/repos/Arefmtl/autofill-pro/releases/latest');
      const d = await r.json();
      const latest = parseFloat((d.tag_name || 'v0').replace('v',''));
      const current = parseFloat(version);
      if (latest > current) {
        us.innerHTML = `<a href="${d.html_url}" target="_blank" style="color:#89b4fa">🆕 آپدیت: ${d.tag_name}</a>`;
      } else {
        us.textContent = '✅ آخرین نسخه';
        us.style.color = '#a6e3a1';
      }
    } catch { us.textContent = '❌ خطا'; us.style.color = '#f38ba8'; }
  });

  // ==================== STATUS ====================
  function showStatus(text, type) {
    const s = document.getElementById('statusText');
    const sb = document.getElementById('statusBar');
    if (s) s.textContent = text;
    if (sb) { sb.className = 'status-bar ' + (type || ''); }
  }

  // ==================== INIT ====================
  (async () => {
    await checkOnboarding();
    await loadProfiles();
    refreshProfileSelect();
    loadProfileToForm();
    checkEmptyState();

    // Load settings into form
    chrome.storage.local.get('settings', r => {
      if (r.settings) {
        document.getElementById('apiKey').value = r.settings.apiKey || '';
        if (r.settings.autoFillEnabled !== undefined) document.getElementById('autoFillEnabled').checked = r.settings.autoFillEnabled;
        if (r.settings.jobSitesOnly !== undefined) document.getElementById('jobSitesOnly').checked = r.settings.jobSitesOnly;
        if (r.settings.allowedSites) document.getElementById('allowedSites').value = (r.settings.allowedSites || []).join(', ');
        document.getElementById('apiKeyStatus').textContent = r.settings.apiKey ? '✅ فعال' : '❌ غیرفعال';
      }
    });
  })();
});