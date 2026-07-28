// AutoFill Pro — Sidebar UI
// Injects a full sidebar into any page
(() => {
  'use strict';

  // Prevent double injection
  if (document.getElementById('afp-sidebar')) return;

  const SIDEBAR_WIDTH = '380px';

  // Create sidebar HTML
  function createSidebar() {
    const sidebar = document.createElement('div');
    sidebar.id = 'afp-sidebar';
    sidebar.innerHTML = `
      <style>
        #afp-sidebar {
          position: fixed; top: 0; right: 0; width: ${SIDEBAR_WIDTH}; height: 100vh;
          background: #0b0b1a; color: #cdd6f4; z-index: 2147483647;
          font-family: 'Segoe UI', Tahoma, sans-serif; direction: ltr;
          box-shadow: -4px 0 24px rgba(0,0,0,0.5); display: flex; flex-direction: column;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-left: 1px solid #313244;
        }
        #afp-sidebar.hidden { transform: translateX(100%); }
        
        /* Toggle button */
        #afp-toggle {
          position: fixed; top: 50%; right: 0; transform: translateY(-50%);
          width: 32px; height: 64px; background: linear-gradient(135deg, #89b4fa, #cba6f7);
          border: none; border-radius: 8px 0 0 8px; cursor: pointer; z-index: 2147483646;
          color: #1e1e2e; font-size: 16px; box-shadow: -2px 0 8px rgba(0,0,0,0.3);
          transition: right 0.3s;
        }
        #afp-toggle.shifted { right: ${SIDEBAR_WIDTH}; }

        /* Header */
        .afp-header { padding: 12px; border-bottom: 1px solid #313244; display: flex; align-items: center; gap: 8px; background: #0b0b1a; }
        .afp-header img { width: 28px; height: 28px; border-radius: 50%; }
        .afp-header h1 { font-size: 13px; color: #89b4fa; font-weight: 700; flex: 1; }
        .afp-header .afp-close { background: none; border: none; color: #585b70; cursor: pointer; font-size: 16px; padding: 4px; }
        .afp-header .afp-close:hover { color: #f38ba8; }

        /* Tabs */
        .afp-tabs { display: flex; overflow-x: auto; border-bottom: 1px solid #313244; background: #0b0b1a; padding: 0 4px; }
        .afp-tabs::-webkit-scrollbar { height: 0; }
        .afp-tab { flex: 0 0 auto; padding: 8px 10px; background: none; border: none; border-bottom: 2px solid transparent; color: #585b70; font-size: 11px; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .afp-tab:hover { color: #a6adc8; }
        .afp-tab.active { color: #89b4fa; border-bottom-color: #89b4fa; }

        /* Content */
        .afp-content { flex: 1; overflow-y: auto; padding: 8px; }
        .afp-content::-webkit-scrollbar { width: 4px; }
        .afp-content::-webkit-scrollbar-thumb { background: #313244; border-radius: 2px; }

        /* Cards */
        .afp-card { background: #181825; border: 1px solid #313244; border-radius: 10px; margin-bottom: 8px; overflow: hidden; }
        .afp-card-header { display: flex; align-items: center; padding: 8px 10px; border-bottom: 1px solid #313244; }
        .afp-card-header .icon { margin-right: 6px; }
        .afp-card-header .title { flex: 1; font-size: 11px; font-weight: 600; }
        .afp-card-body { padding: 8px 10px; font-size: 11px; }

        /* Buttons */
        .afp-btn { border: none; border-radius: 6px; padding: 7px 14px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .afp-btn-primary { background: linear-gradient(135deg, #89b4fa, #cba6f7); color: #1e1e2e; }
        .afp-btn-primary:hover { opacity: 0.9; }
        .afp-btn-secondary { background: #313244; color: #a6adc8; }
        .afp-btn-secondary:hover { background: #45475a; }
        .afp-btn-danger { background: #f38ba8; color: #1e1e2e; }
        .afp-btn-full { width: 100%; display: block; }

        /* Inputs */
        .afp-input { width: 100%; background: #1e1e2e; border: 1px solid #313244; border-radius: 6px; padding: 7px 10px; color: #cdd6f4; font-size: 11px; margin-bottom: 6px; }
        .afp-input:focus { outline: none; border-color: #89b4fa; }
        .afp-textarea { resize: vertical; min-height: 50px; }
        .afp-select { background: #1e1e2e; border: 1px solid #313244; border-radius: 6px; padding: 7px 10px; color: #cdd6f4; font-size: 11px; width: 100%; margin-bottom: 6px; }

        /* ATS Badge */
        .afp-ats { display: inline-flex; align-items: center; gap: 4px; background: rgba(137,180,250,0.1); padding: 3px 8px; border-radius: 4px; font-size: 10px; color: #89b4fa; }

        /* Score Ring */
        .afp-score { display: flex; align-items: center; gap: 10px; }
        .afp-score-ring { width: 50px; height: 50px; border-radius: 50%; border: 4px solid #313244; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; }
        .afp-score-ring.high { border-color: #a6e3a1; color: #a6e3a1; }
        .afp-score-ring.mid { border-color: #f9e2af; color: #f9e2af; }
        .afp-score-ring.low { border-color: #f38ba8; color: #f38ba8; }

        /* Quick Actions */
        .afp-actions { display: flex; gap: 4px; margin-bottom: 8px; }
        .afp-actions .afp-btn { flex: 1; font-size: 10px; padding: 6px; }

        /* Chat */
        .afp-chat-msg { margin-bottom: 4px; display: flex; }
        .afp-chat-msg.user { justify-content: flex-end; }
        .afp-chat-msg.ai { justify-content: flex-start; }
        .afp-chat-bubble { max-width: 85%; padding: 8px 12px; border-radius: 12px; font-size: 11px; line-height: 1.4; }
        .afp-chat-msg.ai .afp-chat-bubble { background: #1e1e2e; border: 1px solid #313244; color: #cdd6f4; }
        .afp-chat-msg.user .afp-chat-bubble { background: #89b4fa; color: #1e1e2e; }
        .afp-chat-quick { background: #313244; border: none; color: #a6adc8; padding: 4px 8px; border-radius: 5px; font-size: 9px; cursor: pointer; }
        .afp-chat-quick:hover { background: #45475a; color: #89b4fa; }

        /* Tracker */
        .afp-tracker-stat { text-align: center; flex: 1; }
        .afp-tracker-stat .num { font-size: 18px; font-weight: 700; color: #89b4fa; }
        .afp-tracker-stat .label { font-size: 9px; color: #585b70; }
        .afp-job-card { background: #1e1e2e; border: 1px solid #313244; border-radius: 6px; padding: 8px; margin-bottom: 6px; }
        .afp-job-card .company { font-size: 11px; font-weight: 600; color: #89b4fa; }
        .afp-job-card .title { font-size: 10px; color: #a6adc8; }
        .afp-job-card .meta { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
        .afp-job-card .date { font-size: 9px; color: #585b70; }
        .afp-status { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; }
        .afp-status.saved { background: rgba(108,112,134,0.2); color: #6c7086; }
        .afp-status.applied { background: rgba(137,180,250,0.2); color: #89b4fa; }
        .afp-status.interview { background: rgba(249,226,175,0.2); color: #f9e2af; }
        .afp-status.offer { background: rgba(166,227,161,0.2); color: #a6e3a1; }
        .afp-status.rejected { background: rgba(243,139,168,0.2); color: #f38ba8; }

        /* Upload zone */
        .afp-dropzone { border: 2px dashed #313244; border-radius: 10px; padding: 20px; text-align: center; cursor: pointer; transition: all 0.2s; }
        .afp-dropzone:hover { border-color: #89b4fa; background: rgba(137,180,250,0.05); }
        .afp-dropzone.dragover { border-color: #89b4fa; background: rgba(137,180,250,0.1); }

        /* Status bar */
        .afp-status-bar { position: absolute; bottom: 0; left: 0; right: 0; padding: 6px 12px; background: #181825; border-top: 1px solid #313244; font-size: 10px; text-align: center; color: #585b70; }

        /* Spinner */
        .afp-spinner { width: 24px; height: 24px; border: 3px solid #313244; border-top-color: #89b4fa; border-radius: 50%; animation: afp-spin 0.8s linear infinite; margin: 12px auto; }
        @keyframes afp-spin { to { transform: rotate(360deg); } }

        /* Highlight */
        .afp-highlight { background: rgba(250,204,21,0.3); border-radius: 2px; padding: 0 2px; border-bottom: 2px solid #facc15; }
      </style>

      <!-- Toggle Button -->
      <button id="afp-toggle">⚡</button>

      <!-- Sidebar -->
      <div class="afp-sidebar-inner">
        <!-- Header -->
        <div class="afp-header">
          <span style="font-size:20px">⚡</span>
          <h1>AutoFill Pro</h1>
          <span style="font-size:9px;color:#585b70" id="afp-version">v7.0</span>
          <button class="afp-close" id="afp-close-btn">✕</button>
        </div>

        <!-- Tabs -->
        <div class="afp-tabs" id="afp-tabs">
          <button class="afp-tab active" data-tab="upload">📄</button>
          <button class="afp-tab" data-tab="jobs">💼</button>
          <button class="afp-tab" data-tab="tracker">📊</button>
          <button class="afp-tab" data-tab="search">🔍</button>
          <button class="afp-tab" data-tab="chat">💬</button>
          <button class="afp-tab" data-tab="settings">⚙️</button>
        </div>

        <!-- Content Area -->
        <div class="afp-content" id="afp-content">
          <!-- Upload Tab -->
          <div class="afp-tab-panel active" data-panel="upload">
            <div class="afp-dropzone" id="afp-dropzone">
              <div style="font-size:28px;margin-bottom:8px">📄</div>
              <p style="font-size:11px;margin-bottom:4px">Drop resume here</p>
              <p style="font-size:9px;color:#585b70;margin-bottom:8px">PDF, DOCX, TXT — AI extracts everything</p>
              <button class="afp-btn afp-btn-primary" id="afp-select-file">Choose File</button>
              <input type="file" id="afp-file-input" accept=".pdf,.docx,.txt" hidden>
            </div>
            <div id="afp-upload-status" style="display:none;text-align:center;padding:12px">
              <div class="afp-spinner"></div>
              <p style="font-size:11px" id="afp-upload-text">AI analyzing resume...</p>
            </div>
            <div id="afp-upload-done" style="display:none;text-align:center;padding:12px">
              <div style="font-size:28px;margin-bottom:8px">✅</div>
              <p style="font-size:11px">Resume analyzed!</p>
              <p style="font-size:9px;color:#585b70" id="afp-upload-summary"></p>
            </div>
          </div>

          <!-- Jobs Tab -->
          <div class="afp-tab-panel" data-panel="jobs" style="display:none">
            <div class="afp-ats" id="afp-ats-badge">
              <span>📍</span>
              <span id="afp-ats-name">Detecting...</span>
            </div>
            <div class="afp-actions" style="margin-top:8px">
              <button class="afp-btn afp-btn-secondary" id="afp-gmail-btn">📧 Gmail</button>
              <button class="afp-btn afp-btn-secondary" id="afp-referral-btn">👥 Referral</button>
              <button class="afp-btn afp-btn-secondary" id="afp-highlight-btn">🎯 Highlight</button>
            </div>
            <div class="afp-card">
              <div class="afp-card-header">
                <span class="icon">📊</span>
                <span class="title">Job Summary</span>
                <button class="afp-btn afp-btn-secondary" style="font-size:9px;padding:3px 8px" id="afp-analyze-btn">Analyze</button>
              </div>
              <div class="afp-card-body" id="afp-jd-summary">
                <p style="color:#585b70">Go to a job page and click "Analyze"</p>
              </div>
            </div>
            <div class="afp-card" id="afp-match-card" style="display:none">
              <div class="afp-card-header">
                <span class="icon">🎯</span>
                <span class="title">Match Score</span>
              </div>
              <div class="afp-card-body">
                <div class="afp-score">
                  <div class="afp-score-ring" id="afp-score-ring">0</div>
                  <div id="afp-score-details" style="font-size:10px"></div>
                </div>
              </div>
            </div>
            <div class="afp-card" id="afp-keywords-card" style="display:none">
              <div class="afp-card-header">
                <span class="icon">🏷️</span>
                <span class="title">Keywords</span>
              </div>
              <div class="afp-card-body" id="afp-keywords-list"></div>
            </div>
            <div class="afp-card" id="afp-cl-card" style="display:none">
              <div class="afp-card-header">
                <span class="icon">✉️</span>
                <span class="title">Cover Letter</span>
                <button class="afp-btn afp-btn-secondary" style="font-size:9px;padding:3px 8px" id="afp-copy-cl">📋</button>
              </div>
              <div class="afp-card-body" id="afp-cover-letter" style="max-height:120px;overflow-y:auto;white-space:pre-wrap"></div>
            </div>
            <button class="afp-btn afp-btn-primary afp-btn-full" id="afp-fill-btn">🚀 Auto-Fill Form</button>
          </div>

          <!-- Tracker Tab -->
          <div class="afp-tab-panel" data-panel="tracker" style="display:none">
            <div style="display:flex;gap:8px;margin-bottom:10px">
              <div class="afp-tracker-stat"><div class="num" id="afp-stat-total">0</div><div class="label">Total</div></div>
              <div class="afp-tracker-stat"><div class="num" id="afp-stat-applied">0</div><div class="label">Applied</div></div>
              <div class="afp-tracker-stat"><div class="num" id="afp-stat-interview">0</div><div class="label">Interview</div></div>
              <div class="afp-tracker-stat"><div class="num" id="afp-stat-offer">0</div><div class="label">Offer</div></div>
            </div>
            <div id="afp-tracker-list"></div>
            <button class="afp-btn afp-btn-secondary afp-btn-full" id="afp-add-job-btn">➕ Add Job</button>
            <div id="afp-add-job-form" style="display:none;margin-top:8px">
              <input class="afp-input" id="afp-job-company" placeholder="Company">
              <input class="afp-input" id="afp-job-title" placeholder="Job Title">
              <input class="afp-input" id="afp-job-url" placeholder="URL (optional)">
              <select class="afp-select" id="afp-job-status">
                <option value="saved">💾 Saved</option>
                <option value="applied">📤 Applied</option>
                <option value="interview">🎤 Interview</option>
                <option value="offer">🎉 Offer</option>
                <option value="rejected">❌ Rejected</option>
              </select>
              <button class="afp-btn afp-btn-primary afp-btn-full" id="afp-save-job-btn">💾 Save</button>
            </div>
          </div>

          <!-- Search Tab -->
          <div class="afp-tab-panel" data-panel="search" style="display:none">
            <input class="afp-input" id="afp-search-query" placeholder="Job title, e.g. Data Scientist">
            <input class="afp-input" id="afp-search-location" placeholder="Location (Germany)">
            <select class="afp-select" id="afp-search-source">
              <option value="linkedin">LinkedIn</option>
              <option value="indeed">Indeed</option>
              <option value="stepstone">StepStone</option>
              <option value="all">All</option>
            </select>
            <button class="afp-btn afp-btn-primary afp-btn-full" id="afp-search-btn">🔍 Search</button>
            <div id="afp-search-results" style="margin-top:8px"></div>
          </div>

          <!-- Chat Tab -->
          <div class="afp-tab-panel" data-panel="chat" style="display:none">
            <div id="afp-chat-messages" style="height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;margin-bottom:8px">
              <div class="afp-chat-msg ai">
                <div class="afp-chat-bubble">Hi! I'm your career coach. 💡<br><br>I can help with:<br>• Analyze current job page<br>• Interview prep<br>• Resume improvement<br>• Common questions<br><br>Type or click a quick action!</div>
              </div>
            </div>
            <div style="display:flex;gap:4px;margin-bottom:6px;flex-wrap:wrap">
              <button class="afp-chat-quick" data-msg="Analyze match for this job">🎯 Match</button>
              <button class="afp-chat-quick" data-msg="Prepare me for interview at this company">🎤 Interview</button>
              <button class="afp-chat-quick" data-msg="How can I improve my resume?">📝 Resume</button>
            </div>
            <div style="display:flex;gap:4px">
              <input class="afp-input" id="afp-chat-input" placeholder="Type your message..." style="margin-bottom:0;flex:1">
              <button class="afp-btn afp-btn-primary" id="afp-chat-send" style="padding:7px 12px">Send</button>
            </div>
          </div>

          <!-- Settings Tab -->
          <div class="afp-tab-panel" data-panel="settings" style="display:none">
            <div class="afp-card">
              <div class="afp-card-header">
                <span class="icon">🤖</span>
                <span class="title">API Key</span>
                <span style="font-size:9px;color:#22c55e" id="afp-api-status">✅ Active</span>
              </div>
              <div class="afp-card-body">
                <input type="password" class="afp-input" id="afp-api-key" placeholder="API Key...">
                <a href="https://opencode.ai" target="_blank" style="font-size:9px;color:#89b4fa;text-decoration:none">🔑 Get free key →</a>
              </div>
            </div>
            <div class="afp-card">
              <div class="afp-card-header">
                <span class="icon">⚙️</span>
                <span class="title">Settings</span>
              </div>
              <div class="afp-card-body">
                <label style="display:flex;justify-content:space-between;align-items:center;font-size:11px;margin-bottom:6px">
                  <span>Auto-fill</span>
                  <input type="checkbox" id="afp-autofill-toggle" checked>
                </label>
              </div>
            </div>
            <button class="afp-btn afp-btn-primary afp-btn-full" id="afp-save-settings">💾 Save</button>
          </div>
        </div>

        <!-- Status Bar -->
        <div class="afp-status-bar" id="afp-status-bar"></div>
      </div>
    `;
    return sidebar;
  }

  // Initialize sidebar
  const sidebar = createSidebar();
  document.body.appendChild(sidebar);
  const toggle = document.getElementById('afp-toggle');
  const sidebarInner = sidebar.querySelector('.afp-sidebar-inner');

  // Toggle sidebar
  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('hidden');
    toggle.classList.toggle('shifted');
  });

  // Close button
  document.getElementById('afp-close-btn').addEventListener('click', () => {
    sidebar.classList.add('hidden');
    toggle.classList.remove('shifted');
  });

  // Tab switching
  document.getElementById('afp-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.afp-tab');
    if (!tab) return;
    document.querySelectorAll('.afp-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.afp-tab-panel').forEach(p => p.style.display = 'none');
    tab.classList.add('active');
    const panel = document.querySelector(`.afp-tab-panel[data-panel="${tab.dataset.tab}"]`);
    if (panel) panel.style.display = 'block';
  });

  // Quick actions
  document.querySelectorAll('.afp-chat-quick').forEach(btn => {
    btn.addEventListener('click', () => sendChatMessage(btn.dataset.msg));
  });

  // Chat
  document.getElementById('afp-chat-send')?.addEventListener('click', () => {
    const input = document.getElementById('afp-chat-input');
    sendChatMessage(input.value);
    input.value = '';
  });
  document.getElementById('afp-chat-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      sendChatMessage(e.target.value);
      e.target.value = '';
    }
  });

  async function sendChatMessage(msg) {
    if (!msg?.trim()) return;
    const messages = document.getElementById('afp-chat-messages');
    messages.innerHTML += `<div class="afp-chat-msg user"><div class="afp-chat-bubble">${msg}</div></div>`;
    messages.innerHTML += `<div class="afp-chat-msg ai" id="afp-typing"><div class="afp-chat-bubble"><div class="afp-spinner" style="margin:4px auto;width:16px;height:16px"></div></div></div>`;
    messages.scrollTop = messages.scrollHeight;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'careerChat', message: msg }, (resp) => {
      document.getElementById('afp-typing')?.remove();
      if (resp?.reply) {
        messages.innerHTML += `<div class="afp-chat-msg ai"><div class="afp-chat-bubble">${resp.reply.replace(/\n/g, '<br>')}</div></div>`;
      } else {
        messages.innerHTML += `<div class="afp-chat-msg ai"><div class="afp-chat-bubble">❌ Error — try again</div></div>`;
      }
      messages.scrollTop = messages.scrollHeight;
    });
  }

  // Load data
  chrome.storage.local.get(['resumeData', 'profile', 'settings', 'jobs'], (r) => {
    // API key
    const key = r.settings?.apiKey || '';
    if (key) {
      document.getElementById('afp-api-key').value = key;
      document.getElementById('afp-api-status').textContent = '✅ Active';
    }

    // Jobs
    const jobs = r.jobs || [];
    renderTracker(jobs);
  });

  function renderTracker(jobs) {
    const counts = { saved: 0, applied: 0, interview: 0, offer: 0, rejected: 0 };
    jobs.forEach(j => { if (counts[j.status] !== undefined) counts[j.status]++; });
    
    document.getElementById('afp-stat-total').textContent = jobs.length;
    document.getElementById('afp-stat-applied').textContent = counts.applied;
    document.getElementById('afp-stat-interview').textContent = counts.interview;
    document.getElementById('afp-stat-offer').textContent = counts.offer;

    const list = document.getElementById('afp-tracker-list');
    if (jobs.length === 0) {
      list.innerHTML = '<p style="text-align:center;color:#585b70;font-size:11px;padding:12px">No jobs yet</p>';
      return;
    }
    list.innerHTML = jobs.slice(0, 20).map(j => `
      <div class="afp-job-card">
        <div style="display:flex;justify-content:space-between;align-items:start">
          <div>
            <div class="company">${j.company}</div>
            <div class="title">${j.title}</div>
          </div>
          <span class="afp-status ${j.status}">${j.status}</span>
        </div>
        <div class="meta">
          <span class="date">${j.date ? new Date(j.date).toLocaleDateString() : ''}</span>
          <div>
            ${j.url ? `<a href="${j.url}" target="_blank" style="font-size:10px;color:#89b4fa;text-decoration:none">🔗</a>` : ''}
            <button class="afp-delete-job" data-id="${j.id}" style="background:none;border:none;cursor:pointer;font-size:10px">🗑️</button>
          </div>
        </div>
      </div>
    `).join('');

    // Delete handlers
    list.querySelectorAll('.afp-delete-job').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const updated = jobs.filter(j => j.id !== id);
        chrome.storage.local.set({ jobs: updated });
        renderTracker(updated);
      });
    });
  }

  // Add job
  document.getElementById('afp-add-job-btn')?.addEventListener('click', () => {
    document.getElementById('afp-add-job-form').style.display =
      document.getElementById('afp-add-job-form').style.display === 'none' ? 'block' : 'none';
  });
  document.getElementById('afp-save-job-btn')?.addEventListener('click', () => {
    const company = document.getElementById('afp-job-company').value.trim();
    const title = document.getElementById('afp-job-title').value.trim();
    const url = document.getElementById('afp-job-url').value.trim();
    const status = document.getElementById('afp-job-status').value;
    if (!company || !title) return;
    chrome.storage.local.get('jobs', (r) => {
      const jobs = r.jobs || [];
      jobs.unshift({ id: Date.now().toString(), company, title, url, status, date: new Date().toISOString() });
      chrome.storage.local.set({ jobs });
      renderTracker(jobs);
      document.getElementById('afp-add-job-form').style.display = 'none';
      document.getElementById('afp-job-company').value = '';
      document.getElementById('afp-job-title').value = '';
      document.getElementById('afp-job-url').value = '';
    });
  });

  // Fill form
  document.getElementById('afp-fill-btn')?.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'fillForms' });
  });

  // Analyze
  document.getElementById('afp-analyze-btn')?.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'extractJD' }, (resp) => {
      if (resp?.jd) {
        document.getElementById('afp-jd-summary').textContent = resp.jd.substring(0, 500) + '...';
      }
    });
  });

  // Highlight
  document.getElementById('afp-highlight-btn')?.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.storage.local.get(['resumeData', 'profile'], (r) => {
      const profile = { ...(r.resumeData || {}), ...(r.profile || {}) };
      const keywords = (profile.skills || '').split(',').map(s => s.trim()).filter(s => s.length > 2);
      chrome.tabs.sendMessage(tab.id, { action: 'highlightKeywords', keywords });
    });
  });

  // Gmail
  document.getElementById('afp-gmail-btn')?.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'injectGmailBadge' });
  });

  // Referral
  document.getElementById('afp-referral-btn')?.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'showReferral' });
  });

  // Search
  document.getElementById('afp-search-btn')?.addEventListener('click', () => {
    const q = document.getElementById('afp-search-query').value.trim();
    const loc = document.getElementById('afp-search-location').value.trim();
    const src = document.getElementById('afp-search-source').value;
    if (!q) return;
    const urls = {
      linkedin: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(loc || 'Germany')}`,
      indeed: `https://de.indeed.com/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(loc || 'Germany')}`,
      stepstone: `https://www.stepstone.de/jobs/${encodeURIComponent(q)}/in-${encodeURIComponent(loc || 'Deutschland')}`,
      all: `https://www.google.com/search?q=${encodeURIComponent(q + ' jobs ' + (loc || 'Germany'))}`
    };
    window.open(urls[src], '_blank');
  });

  // Settings
  document.getElementById('afp-save-settings')?.addEventListener('click', () => {
    const key = document.getElementById('afp-api-key').value.trim();
    const autoFill = document.getElementById('afp-autofill-toggle').checked;
    chrome.storage.local.set({ settings: { apiKey: key, autoFillEnabled: autoFill } });
    document.getElementById('afp-api-status').textContent = key ? '✅ Active' : '❌ No key';
  });

  // File upload
  document.getElementById('afp-select-file')?.addEventListener('click', () => {
    document.getElementById('afp-file-input').click();
  });
  document.getElementById('afp-dropzone')?.addEventListener('click', (e) => {
    if (e.target.id !== 'afp-select-file') document.getElementById('afp-file-input').click();
  });
  document.getElementById('afp-file-input')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById('afp-dropzone').style.display = 'none';
    document.getElementById('afp-upload-status').style.display = 'block';
    document.getElementById('afp-upload-text').textContent = `Analyzing ${file.name}...`;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'getProfile' }, async (profile) => {
      // Send file to AI for parsing
      const reader = new FileReader();
      reader.onload = async () => {
        const text = reader.result;
        document.getElementById('afp-upload-text').textContent = 'AI extracting information...';
        
        // Use AI to parse resume
        const apiKey = profile?.settings?.apiKey || '';
        if (apiKey) {
          try {
            const resp = await fetch('https://api.opencode.ai/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
              body: JSON.stringify({
                model: 'mimo-2.5',
                messages: [{
                  role: 'user',
                  content: `Extract structured data from this resume. Return JSON with: fullName, email, phone, city, country, linkedin, github, website, skills, experience, education, summary, nationality, visaStatus.\n\nResume text:\n${text.substring(0, 4000)}`
                }],
                temperature: 0.1,
                max_tokens: 1000
              })
            });
            if (resp.ok) {
              const d = await resp.json();
              const content = d.choices[0]?.message?.content || '';
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                chrome.storage.local.set({ resumeData: data, profile: data });
                document.getElementById('afp-upload-status').style.display = 'none';
                document.getElementById('afp-upload-done').style.display = 'block';
                document.getElementById('afp-upload-summary').textContent = `${Object.keys(data).length} fields extracted`;
              }
            }
          } catch (err) {
            document.getElementById('afp-upload-text').textContent = 'Error: ' + err.message;
          }
        }
      };
      reader.readAsText(file);
    });
  });

  // Start hidden
  sidebar.classList.add('hidden');
})();
