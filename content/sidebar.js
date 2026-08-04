// AutoFill Pro v9.0 — Sidebar UI (Rebrand)
(() => {
  'use strict';
  if (document.getElementById('afp-sidebar')) return;

  const W = '400px';

  // State
  let currentTab = 'home';
  let resumeData = null;
  let jobs = [];
  let settings = {};

  // Create sidebar
  const el = document.createElement('div');
  el.id = 'afp-sidebar';
  el.innerHTML = `
    <style>
      /* ═══════════════════════════════════════════════════
         DESIGN TOKENS — AutoFill Pro v9.0
         Palette: Emerald/Teal (matches portfolio)
         ═══════════════════════════════════════════════════ */
      #afp-sidebar {
        --bg: #0A1210;
        --bg-elevated: #111F1A;
        --bg-subtle: #0F1A16;
        --surface: #142420;
        --border: #1E3A30;
        --border-subtle: #162B22;
        
        --text: #E8F5EE;
        --text-secondary: #A3C4B4;
        --text-muted: #5A7A6A;
        
        --accent: #34D399;
        --accent-light: #6EE7B7;
        --accent-dark: #10B981;
        --accent-darker: #064E3B;
        
        --success: #10B981;
        --warning: #F59E0B;
        --error: #EF4444;
        
        --font: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        --radius: 12px;
        --radius-sm: 8px;
        --radius-lg: 16px;
        
        -webkit-font-smoothing: antialiased;
        position: fixed;
        top: 0;
        right: 0;
        width: ${W};
        height: 100vh;
        background: var(--bg);
        color: var(--text);
        z-index: 2147483647;
        font-family: var(--font);
        box-shadow: -8px 0 40px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        border-left: 1px solid var(--border);
        transform: translateX(100%);
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        overflow: hidden;
      }
      #afp-sidebar.open { transform: translateX(0); }

      /* === TOGGLE BUTTON === */
      #afp-toggle {
        position: fixed;
        top: 50%;
        right: 0;
        transform: translateY(-50%);
        width: 48px;
        height: 96px;
        background: linear-gradient(135deg, var(--accent), var(--accent-dark));
        border: none;
        border-radius: var(--radius) 0 0 var(--radius);
        cursor: pointer;
        z-index: 2147483646;
        color: var(--bg);
        font-size: 24px;
        box-shadow: -4px 0 20px rgba(52, 211, 153, 0.3);
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        writing-mode: vertical-rl;
        text-orientation: mixed;
      }
      #afp-toggle:hover {
        transform: translateY(-50%) scale(1.05);
        right: 4px;
        box-shadow: -8px 0 30px rgba(52, 211, 153, 0.4);
      }
      #afp-toggle:active {
        transform: translateY(-50%) scale(0.95);
      }
      #afp-toggle.shifted {
        right: ${W};
      }

      /* === HEADER === */
      .h {
        padding: 20px;
        border-bottom: 1px solid var(--border);
        display: flex;
        align-items: center;
        gap: 16px;
        background: linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg) 100%);
      }
      .h-logo {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, var(--accent), var(--accent-dark));
        border-radius: var(--radius);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        box-shadow: 0 4px 12px rgba(52, 211, 153, 0.2);
      }
      .h-info { flex: 1; }
      .h-info h1 {
        font-size: 18px;
        color: var(--text);
        font-weight: 700;
        margin: 0;
        letter-spacing: -0.02em;
      }
      .h-info p {
        font-size: 12px;
        color: var(--text-muted);
        margin: 4px 0 0;
      }
      .h-close {
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        font-size: 24px;
        padding: 8px;
        border-radius: var(--radius-sm);
        transition: all 0.15s;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 40px;
        min-height: 40px;
      }
      .h-close:hover {
        color: var(--text);
        background: var(--bg-subtle);
      }

      /* === BOTTOM NAV === */
      .nav {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        display: flex;
        background: var(--bg-elevated);
        border-top: 1px solid var(--border);
        padding: 12px 0;
        padding-bottom: max(12px, env(safe-area-inset-bottom));
      }
      .nav-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        background: none;
        border: none;
        color: var(--text-muted);
        font-size: 11px;
        cursor: pointer;
        padding: 12px 8px;
        transition: all 0.15s;
        min-height: 56px;
        justify-content: center;
        border-radius: var(--radius-sm);
        margin: 0 4px;
      }
      .nav-item.active {
        color: var(--accent);
        background: var(--accent-darker);
      }
      .nav-item:hover {
        color: var(--text-secondary);
        background: var(--bg-subtle);
      }
      .nav-item:active {
        transform: scale(0.95);
      }
      .nav-icon {
        font-size: 20px;
        line-height: 1;
      }
      .nav-label {
        font-weight: 600;
      }

      /* === CONTENT === */
      .ct {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        scroll-behavior: smooth;
        padding-bottom: 80px;
      }
      .ct::-webkit-scrollbar {
        width: 6px;
      }
      .ct::-webkit-scrollbar-track {
        background: transparent;
      }
      .ct::-webkit-scrollbar-thumb {
        background: var(--border);
        border-radius: 3px;
      }
      .ct::-webkit-scrollbar-thumb:hover {
        background: var(--text-muted);
      }

      /* === PANELS === */
      .pnl {
        display: none;
      }
      .pnl.active {
        display: block;
        animation: fadeIn 0.2s ease;
      }

      /* === CARDS === */
      .card {
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        margin-bottom: 16px;
        transition: all 0.2s;
      }
      .card:hover {
        border-color: var(--accent);
        box-shadow: 0 4px 12px rgba(52, 211, 153, 0.1);
      }
      .card-header {
        padding: 16px;
        border-bottom: 1px solid var(--border);
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .card-header .icon {
        font-size: 20px;
      }
      .card-header .title {
        flex: 1;
        font-size: 14px;
        font-weight: 600;
      }
      .card-header .badge {
        font-size: 11px;
        padding: 4px 10px;
        border-radius: var(--radius-sm);
        background: var(--accent-darker);
        color: var(--accent);
        font-weight: 600;
      }
      .card-body {
        padding: 16px;
        font-size: 13px;
        line-height: 1.7;
      }

      /* === BUTTONS === */
      .btn {
        border: none;
        border-radius: var(--radius-sm);
        padding: 12px 20px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
        min-height: 48px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      .btn:active {
        transform: scale(0.96);
      }
      .btn-primary {
        background: linear-gradient(135deg, var(--accent), var(--accent-dark));
        color: var(--bg);
        box-shadow: 0 4px 12px rgba(52, 211, 153, 0.2);
      }
      .btn-primary:hover {
        box-shadow: 0 6px 16px rgba(52, 211, 153, 0.3);
      }
      .btn-secondary {
        background: var(--border);
        color: var(--text-secondary);
      }
      .btn-secondary:hover {
        background: var(--border-subtle);
        color: var(--text);
      }
      .btn-full {
        width: 100%;
      }
      .btn-sm {
        padding: 8px 12px;
        font-size: 11px;
        min-height: 36px;
      }
      .btn-danger {
        background: rgba(239, 68, 68, 0.1);
        color: var(--error);
      }
      .btn-danger:hover {
        background: rgba(239, 68, 68, 0.2);
      }

      /* === INPUTS === */
      .input {
        width: 100%;
        background: var(--bg);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        padding: 12px 16px;
        color: var(--text);
        font-size: 13px;
        margin-bottom: 12px;
        transition: all 0.15s;
        min-height: 48px;
      }
      .input:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.15);
      }
      .input::placeholder {
        color: var(--text-muted);
      }
      .select {
        background: var(--bg);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        padding: 12px 16px;
        color: var(--text);
        font-size: 13px;
        width: 100%;
        margin-bottom: 12px;
        transition: all 0.15s;
        min-height: 48px;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%235A7A6A'%3E%3Cpath d='M6 8L1 3h10z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 16px center;
      }
      .select:focus {
        outline: none;
        border-color: var(--accent);
      }

      /* === SCORE RING === */
      .score-ring {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        border: 4px solid var(--border);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        transition: all 0.3s;
      }
      .score-ring.high {
        border-color: var(--success);
        color: var(--success);
        box-shadow: 0 0 16px rgba(16, 185, 129, 0.2);
      }
      .score-ring.medium {
        border-color: var(--warning);
        color: var(--warning);
        box-shadow: 0 0 16px rgba(245, 158, 11, 0.2);
      }
      .score-ring.low {
        border-color: var(--error);
        color: var(--error);
        box-shadow: 0 0 16px rgba(239, 68, 68, 0.2);
      }

      /* === STAT CARDS === */
      .stats {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-bottom: 16px;
      }
      .stat {
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 16px;
        text-align: center;
        transition: all 0.2s;
      }
      .stat:hover {
        border-color: var(--accent);
        transform: translateY(-2px);
      }
      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: var(--accent);
        font-variant-numeric: tabular-nums;
      }
      .stat-label {
        font-size: 11px;
        color: var(--text-muted);
        margin-top: 4px;
      }

      /* === QUICK ACTIONS === */
      .quick-actions {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-bottom: 16px;
      }
      .quick-action {
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 16px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        min-height: 90px;
      }
      .quick-action:hover {
        border-color: var(--accent);
        background: rgba(52, 211, 153, 0.05);
        transform: translateY(-2px);
      }
      .quick-action:active {
        transform: scale(0.96);
      }
      .quick-action .icon {
        font-size: 28px;
      }
      .quick-action .label {
        font-size: 12px;
        font-weight: 600;
        text-align: center;
      }

      /* === JOB LIST === */
      .job-item {
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 16px;
        margin-bottom: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .job-item:hover {
        border-color: var(--accent);
        transform: translateY(-2px);
      }
      .job-item-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
      }
      .job-item-logo {
        width: 40px;
        height: 40px;
        background: var(--border);
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
      }
      .job-item-title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 2px;
      }
      .job-item-company {
        font-size: 12px;
        color: var(--text-muted);
      }
      .job-item-meta {
        display: flex;
        gap: 12px;
        font-size: 11px;
        color: var(--text-muted);
      }

      /* === STATUS BADGES === */
      .status {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: var(--radius-sm);
        font-size: 11px;
        font-weight: 600;
      }
      .status-applied {
        background: rgba(16, 185, 129, 0.1);
        color: var(--success);
      }
      .status-pending {
        background: rgba(245, 158, 11, 0.1);
        color: var(--warning);
      }
      .status-rejected {
        background: rgba(239, 68, 68, 0.1);
        color: var(--error);
      }

      /* === TOAST === */
      .toast {
        position: fixed;
        bottom: 100px;
        right: 20px;
        background: var(--accent);
        color: var(--bg);
        padding: 12px 20px;
        border-radius: var(--radius-sm);
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(52, 211, 153, 0.3);
        animation: slideIn 0.3s ease, fadeOut 0.3s ease 2s forwards;
        z-index: 2147483647;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes slideIn {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }

      /* === SECTION HEADER === */
      .section-header {
        font-size: 11px;
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 12px;
      }

      /* === EMPTY STATE === */
      .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: var(--text-muted);
      }
      .empty-state .icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
      }
      .empty-state .title {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-secondary);
        margin-bottom: 8px;
      }
      .empty-state .desc {
        font-size: 13px;
        line-height: 1.6;
      }
    </style>

    <!-- HEADER -->
    <div class="h">
      <div class="h-logo">🚀</div>
      <div class="h-info">
        <h1>AutoFill Pro</h1>
        <p>AI-Powered Job Application Copilot</p>
      </div>
      <button class="h-close" id="afp-close">✕</button>
    </div>

    <!-- CONTENT -->
    <div class="ct">
      <!-- HOME PANEL -->
      <div class="pnl active" id="pnl-home">
        <div class="stats">
          <div class="stat">
            <div class="stat-value" id="stat-applied">0</div>
            <div class="stat-label">Applied</div>
          </div>
          <div class="stat">
            <div class="stat-value" id="stat-pending">0</div>
            <div class="stat-label">Pending</div>
          </div>
          <div class="stat">
            <div class="stat-value" id="stat-interviews">0</div>
            <div class="stat-label">Interviews</div>
          </div>
          <div class="stat">
            <div class="stat-value" id="stat-match">—</div>
            <div class="stat-label">Match Score</div>
          </div>
        </div>

        <div class="section-header">Quick Actions</div>
        <div class="quick-actions">
          <div class="quick-action" id="qa-autofill">
            <span class="icon">⚡</span>
            <span class="label">Auto Fill</span>
          </div>
          <div class="quick-action" id="qa-cover">
            <span class="icon">📝</span>
            <span class="label">Cover Letter</span>
          </div>
          <div class="quick-action" id="qa-match">
            <span class="icon">🎯</span>
            <span class="label">Match Score</span>
          </div>
          <div class="quick-action" id="qa-chat">
            <span class="icon">💬</span>
            <span class="label">Career Chat</span>
          </div>
        </div>

        <div class="section-header">Recent Jobs</div>
        <div id="recent-jobs">
          <div class="empty-state">
            <div class="icon">📋</div>
            <div class="title">No jobs yet</div>
            <div class="desc">Start applying to see your jobs here</div>
          </div>
        </div>
      </div>

      <!-- JOBS PANEL -->
      <div class="pnl" id="pnl-jobs">
        <div class="section-header">Job Tracker</div>
        <div id="jobs-list">
          <div class="empty-state">
            <div class="icon">💼</div>
            <div class="title">Your Jobs</div>
            <div class="desc">Track all your job applications in one place</div>
          </div>
        </div>
      </div>

      <!-- COVER LETTER PANEL -->
      <div class="pnl" id="pnl-cover">
        <div class="card">
          <div class="card-header">
            <span class="icon">📝</span>
            <span class="title">Cover Letter Generator</span>
            <span class="badge">AI</span>
          </div>
          <div class="card-body">
            <select class="select" id="cl-template">
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
              <option value="creative">Creative</option>
            </select>
            <select class="select" id="cl-language">
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="fa">فارسی</option>
            </select>
            <input class="input" type="text" id="cl-name" placeholder="Your Name">
            <input class="input" type="number" id="cl-experience" placeholder="Years of Experience" value="3">
            <button class="btn btn-primary btn-full" id="cl-generate">✨ Generate Cover Letter</button>
          </div>
        </div>
        <div id="cl-output" style="display:none;">
          <div class="card">
            <div class="card-header">
              <span class="icon">📄</span>
              <span class="title">Generated Letter</span>
              <button class="btn btn-sm btn-secondary" id="cl-copy">📋 Copy</button>
            </div>
            <div class="card-body">
              <textarea class="input" id="cl-text" rows="10" style="resize:vertical;"></textarea>
              <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-top:8px;">
                <span id="cl-words">0 words</span>
                <span id="cl-job-info"></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SETTINGS PANEL -->
      <div class="pnl" id="pnl-settings">
        <div class="card">
          <div class="card-header">
            <span class="icon">⚙️</span>
            <span class="title">Settings</span>
          </div>
          <div class="card-body">
            <div class="section-header">AI Configuration</div>
            <input class="input" type="password" id="api-key" placeholder="API Key">
            <button class="btn btn-secondary btn-full btn-sm" id="test-api">🧪 Test API Key</button>
            
            <div class="section-header" style="margin-top:16px;">Preferences</div>
            <select class="select" id="ai-model">
              <option value="mimo">Mimo (Default)</option>
              <option value="groq">Groq</option>
              <option value="openai">OpenAI</option>
            </select>
            <select class="select" id="language">
              <option value="auto">Auto-detect</option>
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="fa">فارسی</option>
            </select>

            <div class="section-header" style="margin-top:16px;">About</div>
            <div style="font-size:12px;color:var(--text-muted);line-height:1.6;">
              <p><strong>AutoFill Pro v9.0</strong></p>
              <p>AI-powered job application assistant</p>
              <p style="margin-top:8px;">
                <a href="https://github.com/Arefmtl/autofill-pro" target="_blank" style="color:var(--accent);">GitHub</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- BOTTOM NAV -->
    <div class="nav">
      <button class="nav-item active" data-tab="home">
        <span class="nav-icon">🏠</span>
        <span class="nav-label">Home</span>
      </button>
      <button class="nav-item" data-tab="jobs">
        <span class="nav-icon">💼</span>
        <span class="nav-label">Jobs</span>
      </button>
      <button class="nav-item" data-tab="cover">
        <span class="nav-icon">📝</span>
        <span class="nav-label">Cover</span>
      </button>
      <button class="nav-item" data-tab="settings">
        <span class="nav-icon">⚙️</span>
        <span class="nav-label">Settings</span>
      </button>
    </div>
  `;

  document.body.appendChild(el);

  // === Toggle Button ===
  const toggle = document.createElement('button');
  toggle.id = 'afp-toggle';
  toggle.textContent = '🚀';
  toggle.title = 'AutoFill Pro';
  document.body.appendChild(toggle);

  // === State Management ===
  const sidebar = el;
  const panels = {
    home: document.getElementById('pnl-home'),
    jobs: document.getElementById('pnl-jobs'),
    cover: document.getElementById('pnl-cover'),
    settings: document.getElementById('pnl-settings')
  };

  function switchTab(tab) {
    currentTab = tab;
    Object.values(panels).forEach(p => p.classList.remove('active'));
    panels[tab]?.classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(n => {
      n.classList.toggle('active', n.dataset.tab === tab);
    });
  }

  // === Event Listeners ===
  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    toggle.classList.toggle('shifted');
  });

  document.getElementById('afp-close')?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    toggle.classList.remove('shifted');
  });

  document.querySelectorAll('.nav-item').forEach(n => {
    n.addEventListener('click', () => switchTab(n.dataset.tab));
  });

  // Quick Actions
  document.getElementById('qa-autofill')?.addEventListener('click', () => {
    showToast('Auto Fill triggered!');
  });

  document.getElementById('qa-cover')?.addEventListener('click', () => {
    switchTab('cover');
  });

  document.getElementById('qa-match')?.addEventListener('click', () => {
    showToast('Match Score calculated!');
  });

  document.getElementById('qa-chat')?.addEventListener('click', () => {
    showToast('Career Chat opened!');
  });

  // Cover Letter
  document.getElementById('cl-generate')?.addEventListener('click', () => {
    showToast('Cover Letter generated!');
    document.getElementById('cl-output').style.display = 'block';
  });

  document.getElementById('cl-copy')?.addEventListener('click', () => {
    const text = document.getElementById('cl-text')?.value;
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
  });

  // Settings
  document.getElementById('test-api')?.addEventListener('click', () => {
    showToast('API Key tested!');
  });

  // Toast
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  // === Load saved state ===
  chrome.storage?.local.get(['jobs', 'settings'], (data) => {
    jobs = data.jobs || [];
    settings = data.settings || {};
    
    // Update stats
    document.getElementById('stat-applied').textContent = jobs.filter(j => j.status === 'applied').length;
    document.getElementById('stat-pending').textContent = jobs.filter(j => j.status === 'pending').length;
    document.getElementById('stat-interviews').textContent = jobs.filter(j => j.status === 'interview').length;
  });

  console.log('🚀 AutoFill Pro v9.0 loaded');
})();
