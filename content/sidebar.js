// AutoFill Pro v8.2 — Sidebar UI (UX Overhaul)
(() => {
  'use strict';
  if (document.getElementById('afp-sidebar')) return;

  const W = '380px';

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
      /* === ROOT === */
      #afp-sidebar{
        -webkit-font-smoothing:antialiased;
        -moz-osx-font-smoothing:grayscale;
        position:fixed;top:0;right:0;width:${W};height:100vh;
        background:#0b0b1a;color:#cdd6f4;
        z-index:2147483647;
        font-family:'Inter','Segoe UI',Tahoma,sans-serif;
        box-shadow:-4px 0 32px rgba(0,0,0,.6);
        display:flex;flex-direction:column;
        border-left:1px solid #313244;
        transform:translateX(100%);
        transition:transform .3s cubic-bezier(.2,0,0,1);
        overflow:hidden;
      }
      #afp-sidebar.open{transform:translateX(0)}

      /* === TOGGLE BUTTON === */
      #afp-toggle{
        position:fixed;top:50%;right:0;transform:translateY(-50%);
        width:40px;height:80px;
        background:linear-gradient(135deg,#89b4fa,#cba6f7);
        border:none;border-radius:12px 0 0 12px;
        cursor:pointer;z-index:2147483646;
        color:#1e1e2e;font-size:20px;
        box-shadow:-2px 0 16px rgba(137,180,250,.3);
        transition:all .2s cubic-bezier(.2,0,0,1);
        display:flex;align-items:center;justify-content:center;
        writing-mode:vertical-rl;text-orientation:mixed;
      }
      #afp-toggle:hover{transform:translateY(-50%) scale(1.05);right:4px}
      #afp-toggle:active{transform:translateY(-50%) scale(.95)}
      #afp-toggle.shifted{right:${W}}

      /* === HEADER === */
      .h{
        padding:16px;border-bottom:1px solid #313244;
        display:flex;align-items:center;gap:12px;
        background:linear-gradient(180deg,#181825 0%,#0b0b1a 100%);
      }
      .h-logo{font-size:24px}
      .h-info{flex:1}
      .h-info h1{font-size:16px;color:#89b4fa;font-weight:700;margin:0}
      .h-info p{font-size:10px;color:#585b70;margin:2px 0 0}
      .h-close{
        background:none;border:none;color:#585b70;cursor:pointer;
        font-size:20px;padding:8px;border-radius:8px;
        transition:all .15s;display:flex;align-items:center;justify-content:center;
        min-width:36px;min-height:36px;
      }
      .h-close:hover{color:#cdd6f4;background:rgba(137,180,250,.1)}

      /* === BOTTOM NAV === */
      .nav{
        position:absolute;bottom:0;left:0;right:0;
        display:flex;background:#181825;
        border-top:1px solid #313244;
        padding:8px 0;
        padding-bottom:max(8px, env(safe-area-inset-bottom));
      }
      .nav-item{
        flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;
        background:none;border:none;color:#585b70;
        font-size:10px;cursor:pointer;padding:8px 4px;
        transition:color .15s;min-height:48px;
        justify-content:center;
      }
      .nav-item.active{color:#89b4fa}
      .nav-item:hover{color:#a6adc8}
      .nav-item:active{transform:scale(.95)}
      .nav-icon{font-size:18px;line-height:1}
      .nav-label{font-weight:500}

      /* === CONTENT === */
      .ct{
        flex:1;overflow-y:auto;padding:12px;
        scroll-behavior:smooth;
        padding-bottom:70px;
      }
      .ct::-webkit-scrollbar{width:4px}
      .ct::-webkit-scrollbar-track{background:transparent}
      .ct::-webkit-scrollbar-thumb{background:#313244;border-radius:2px}

      /* === PANELS === */
      .pnl{display:none}
      .pnl.active{display:block;animation:fadeIn .2s ease}

      /* === CARDS === */
      .card{
        background:#181825;border:1px solid #313244;
        border-radius:12px;margin-bottom:12px;
        transition:all .15s;
      }
      .card:hover{border-color:#45475a}
      .card-header{
        padding:12px 14px;border-bottom:1px solid #313244;
        display:flex;align-items:center;gap:10px;
      }
      .card-header .icon{font-size:16px}
      .card-header .title{flex:1;font-size:13px;font-weight:600}
      .card-header .badge{
        font-size:10px;padding:2px 8px;border-radius:6px;
        background:rgba(137,180,250,.1);color:#89b4fa;
      }
      .card-body{padding:12px 14px;font-size:12px;line-height:1.6}

      /* === BUTTONS === */
      .btn{
        border:none;border-radius:8px;padding:10px 16px;
        font-size:12px;font-weight:600;cursor:pointer;
        transition:all .15s;min-height:44px;
        display:inline-flex;align-items:center;justify-content:center;gap:6px;
      }
      .btn:active{transform:scale(.96)}
      .btn-primary{
        background:linear-gradient(135deg,#89b4fa,#cba6f7);
        color:#1e1e2e;
        box-shadow:0 2px 8px rgba(137,180,250,.2);
      }
      .btn-primary:hover{opacity:.9;box-shadow:0 4px 12px rgba(137,180,250,.3)}
      .btn-secondary{background:#313244;color:#a6adc8}
      .btn-secondary:hover{background:#45475a}
      .btn-full{width:100%}
      .btn-sm{padding:6px 10px;font-size:10px;min-height:32px}
      .btn-danger{background:rgba(243,139,168,.1);color:#f38ba8}
      .btn-danger:hover{background:rgba(243,139,168,.2)}

      /* === INPUTS === */
      .input{
        width:100%;background:#1e1e2e;border:1px solid #313244;
        border-radius:8px;padding:10px 12px;color:#cdd6f4;
        font-size:12px;margin-bottom:8px;
        transition:all .15s;min-height:44px;
      }
      .input:focus{outline:none;border-color:#89b4fa;box-shadow:0 0 0 3px rgba(137,180,250,.15)}
      .input::placeholder{color:#585b70}
      .select{
        background:#1e1e2e;border:1px solid #313244;
        border-radius:8px;padding:10px 12px;color:#cdd6f4;
        font-size:12px;width:100%;margin-bottom:8px;
        transition:all .15s;min-height:44px;
        appearance:none;
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23585b70'%3E%3Cpath d='M6 8L1 3h10z'/%3E%3C/svg%3E");
        background-repeat:no-repeat;background-position:right 12px center;
      }
      .select:focus{outline:none;border-color:#89b4fa}

      /* === SCORE RING === */
      .score-ring{
        width:64px;height:64px;border-radius:50%;
        border:4px solid #313244;
        display:flex;align-items:center;justify-content:center;
        font-size:20px;font-weight:700;
        font-variant-numeric:tabular-nums;
        transition:all .3s;
      }
      .score-ring.high{border-color:#a6e3a1;color:#a6e3a1}
      .score-ring.medium{border-color:#f9e2af;color:#f9e2af}
      .score-ring.low{border-color:#f38ba8;color:#f38ba8}

      /* === STAT CARDS === */
      .stats{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px}
      .stat{
        background:#181825;border:1px solid #313244;
        border-radius:10px;padding:12px;text-align:center;
      }
      .stat-value{font-size:24px;font-weight:700;color:#89b4fa;font-variant-numeric:tabular-nums}
      .stat-label{font-size:10px;color:#585b70;margin-top:4px}

      /* === QUICK ACTIONS === */
      .quick-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px}
      .quick-action{
        background:#181825;border:1px solid #313244;
        border-radius:10px;padding:14px;
        cursor:pointer;transition:all .15s;
        display:flex;flex-direction:column;align-items:center;gap:8px;
        min-height:80px;
      }
      .quick-action:hover{border-color:#89b4fa;background:rgba(137,180,250,.05)}
      .quick-action:active{transform:scale(.96)}
      .quick-action .icon{font-size:24px}
      .quick-action .label{font-size:11px;font-weight:500;color:#a6adc8}

      /* === JOB CARD === */
      .job-card{
        background:#1e1e2e;border:1px solid #313244;
        border-radius:10px;padding:12px;
        margin-bottom:8px;transition:all .15s;
        cursor:pointer;
      }
      .job-card:hover{border-color:#45475a;transform:translateY(-1px)}
      .job-card:active{transform:scale(.98)}
      .job-card .company{font-size:13px;font-weight:600;color:#89b4fa}
      .job-card .role{font-size:11px;color:#a6adc8;margin-top:2px}
      .job-card .meta{display:flex;justify-content:space-between;align-items:center;margin-top:8px}
      .job-card .date{font-size:9px;color:#585b70}

      /* === STATUS BADGES === */
      .badge{display:inline-block;padding:3px 8px;border-radius:6px;font-size:9px;font-weight:600}
      .badge-saved{background:rgba(108,112,134,.2);color:#6c7086}
      .badge-applied{background:rgba(137,180,250,.2);color:#89b4fa}
      .badge-interview{background:rgba(249,226,175,.2);color:#f9e2af}
      .badge-offer{background:rgba(166,227,161,.2);color:#a6e3a1}
      .badge-rejected{background:rgba(243,139,168,.2);color:#f38ba8}

      /* === TOAST === */
      .toast{
        position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
        background:#1e1e2e;border:1px solid #313244;
        border-radius:10px;padding:12px 20px;
        font-size:12px;color:#cdd6f4;
        box-shadow:0 4px 16px rgba(0,0,0,.4);
        z-index:2147483648;
        animation:slideUp .3s ease,fadeOut .3s ease 2.7s;
        display:flex;align-items:center;gap:8px;
      }
      @keyframes slideUp{from{transform:translateX(-50%) translateY(20px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}
      @keyframes fadeOut{to{opacity:0}}

      /* === WIZARD === */
      .wizard{padding:20px;text-align:center}
      .wizard-logo{font-size:48px;margin-bottom:16px}
      .wizard-title{font-size:18px;font-weight:700;color:#89b4fa;margin-bottom:8px}
      .wizard-sub{font-size:12px;color:#585b70;margin-bottom:24px}
      .wizard-steps{display:flex;justify-content:center;gap:8px;margin-bottom:24px}
      .wizard-step{
        width:8px;height:8px;border-radius:50%;
        background:#313244;transition:all .3s;
      }
      .wizard-step.active{background:#89b4fa;width:24px;border-radius:4px}
      .wizard-step.done{background:#a6e3a1}

      /* === SPINNER === */
      .spinner{
        width:24px;height:24px;
        border:3px solid #313244;border-top-color:#89b4fa;
        border-radius:50%;animation:spin .8s linear infinite;
        margin:12px auto;
      }
      @keyframes spin{to{transform:rotate(360deg)}}

      /* === PROGRESS === */
      .progress{height:4px;background:#313244;border-radius:2px;overflow:hidden;margin:8px 0}
      .progress-bar{height:100%;background:linear-gradient(90deg,#89b4fa,#cba6f7);transition:width .3s;border-radius:2px}

      /* === ANIMATION === */
      @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

      /* === EMPTY STATE === */
      .empty{text-align:center;padding:32px 16px;color:#585b70}
      .empty-icon{font-size:48px;margin-bottom:12px}
      .empty-title{font-size:14px;font-weight:600;margin-bottom:8px}
      .empty-desc{font-size:11px;line-height:1.5}
    </style>

    <!-- Toggle Button -->
    <button id="afp-toggle">⚡</button>

    <!-- Sidebar -->
    <div id="afp-hdr" class="h">
      <span class="h-logo">⚡</span>
      <div class="h-info">
        <h1>AutoFill Pro</h1>
        <p>v8.2 • اپلای هوشمند</p>
      </div>
      <button class="h-close" id="afp-x">✕</button>
    </div>

    <!-- Content -->
    <div class="ct" id="afp-ct">
      <!-- Home Panel -->
      <div class="pnl active" data-p="home">
        <!-- Welcome Card (first time) -->
        <div id="afp-welcome" class="card" style="display:none">
          <div class="card-body" style="text-align:center;padding:20px">
            <div style="font-size:48px;margin-bottom:12px">👋</div>
            <h3 style="font-size:16px;margin-bottom:8px">خوش اومدی!</h3>
            <p style="font-size:11px;color:#585b70;margin-bottom:16px">برای شروع، رزومه‌ات رو آپلود کن</p>
            <button class="btn btn-primary" id="afp-start-upload">📄 آپلود رزومه</button>
          </div>
        </div>

        <!-- Stats -->
        <div class="stats">
          <div class="stat">
            <div class="stat-value" id="afp-total-jobs">0</div>
            <div class="stat-label">Jobs</div>
          </div>
          <div class="stat">
            <div class="stat-value" id="afp-applied">0</div>
            <div class="stat-label">Applied</div>
          </div>
          <div class="stat">
            <div class="stat-value" id="afp-interviews">0</div>
            <div class="stat-label">Interviews</div>
          </div>
          <div class="stat">
            <div class="stat-value" id="afp-matches">0</div>
            <div class="stat-label">Matches</div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <div class="quick-action" id="afp-qa-search">
            <span class="icon">🔍</span>
            <span class="label">Search Jobs</span>
          </div>
          <div class="quick-action" id="afp-qa-apply">
            <span class="icon">🚀</span>
            <span class="label">Auto-Fill</span>
          </div>
          <div class="quick-action" id="afp-qa-match">
            <span class="icon">🎯</span>
            <span class="label">Match Score</span>
          </div>
          <div class="quick-action" id="afp-qa-interview">
            <span class="icon">🎤</span>
            <span class="label">Interview Prep</span>
          </div>
        </div>

        <!-- Recent Jobs -->
        <div class="card">
          <div class="card-header">
            <span class="icon">💼</span>
            <span class="title">Recent Jobs</span>
            <button class="btn btn-sm btn-secondary" id="afp-view-all-jobs">View All</button>
          </div>
          <div class="card-body" id="afp-recent-jobs">
            <div class="empty">
              <div class="empty-icon">💼</div>
              <div class="empty-title">No jobs yet</div>
              <div class="empty-desc">Search for jobs to get started</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Jobs Panel -->
      <div class="pnl" data-p="jobs">
        <!-- Search -->
        <div class="card">
          <div class="card-header">
            <span class="icon">🔍</span>
            <span class="title">Search Jobs</span>
          </div>
          <div class="card-body">
            <input class="input" id="afp-search-query" placeholder="Job title (e.g. Data Scientist)">
            <input class="input" id="afp-search-location" placeholder="Location (e.g. Berlin)">
            <select class="select" id="afp-search-source">
              <option value="linkedin">LinkedIn</option>
              <option value="indeed">Indeed</option>
              <option value="stepstone">StepStone</option>
              <option value="all">All Sources</option>
            </select>
            <button class="btn btn-primary btn-full" id="afp-search-btn">🔍 Search</button>
          </div>
        </div>

        <!-- Search Results -->
        <div id="afp-search-results"></div>

        <!-- Current Job -->
        <div class="card" id="afp-current-job" style="display:none">
          <div class="card-header">
            <span class="icon">📋</span>
            <span class="title">Current Job</span>
            <span class="badge" id="afp-job-source">LinkedIn</span>
          </div>
          <div class="card-body">
            <div id="afp-job-details"></div>
            <div style="margin-top:12px">
              <button class="btn btn-primary btn-full" id="afp-auto-fill">🚀 Auto-Fill Form</button>
            </div>
          </div>
        </div>

        <!-- Match Score -->
        <div class="card" id="afp-match-card" style="display:none">
          <div class="card-header">
            <span class="icon">🎯</span>
            <span class="title">Match Score</span>
          </div>
          <div class="card-body" style="display:flex;align-items:center;gap:16px">
            <div class="score-ring" id="afp-score-ring">0</div>
            <div id="afp-score-details" style="flex:1;font-size:11px"></div>
          </div>
        </div>

        <!-- ATS Keywords -->
        <div class="card" id="afp-ats-card" style="display:none">
          <div class="card-header">
            <span class="icon">🏷️</span>
            <span class="title">ATS Keywords</span>
          </div>
          <div class="card-body" id="afp-ats-keywords"></div>
        </div>
      </div>

      <!-- Tracker Panel -->
      <div class="pnl" data-p="tracker">
        <!-- Stats -->
        <div class="stats">
          <div class="stat">
            <div class="stat-value" id="afp-tr-total">0</div>
            <div class="stat-label">Total</div>
          </div>
          <div class="stat">
            <div class="stat-value" id="afp-tr-active">0</div>
            <div class="stat-label">Active</div>
          </div>
          <div class="stat">
            <div class="stat-value" id="afp-tr-interview">0</div>
            <div class="stat-label">Interview</div>
          </div>
          <div class="stat">
            <div class="stat-value" id="afp-tr-offer">0</div>
            <div class="stat-label">Offer</div>
          </div>
        </div>

        <!-- Add Job -->
        <div class="card">
          <div class="card-header">
            <span class="icon">➕</span>
            <span class="title">Add Job</span>
          </div>
          <div class="card-body">
            <input class="input" id="afp-add-company" placeholder="Company">
            <input class="input" id="afp-add-role" placeholder="Job Title">
            <input class="input" id="afp-add-url" placeholder="URL (optional)">
            <select class="select" id="afp-add-status">
              <option value="saved">💾 Saved</option>
              <option value="applied">📤 Applied</option>
              <option value="interview">🎤 Interview</option>
              <option value="offer">🎉 Offer</option>
              <option value="rejected">❌ Rejected</option>
            </select>
            <button class="btn btn-primary btn-full" id="afp-add-job-btn">💾 Save Job</button>
          </div>
        </div>

        <!-- Job List -->
        <div id="afp-job-list"></div>
      </div>

      <!-- Settings Panel -->
      <div class="pnl" data-p="settings">
        <!-- API Key -->
        <div class="card">
          <div class="card-header">
            <span class="icon">🤖</span>
            <span class="title">API Key</span>
            <span class="badge" id="afp-api-status">⚠️ Not set</span>
          </div>
          <div class="card-body">
            <input type="password" class="input" id="afp-api-key" placeholder="Enter API key...">
            <div style="display:flex;gap:8px">
              <button class="btn btn-primary" style="flex:1" id="afp-test-key">🧪 Test</button>
              <button class="btn btn-secondary" id="afp-show-key">👁️</button>
            </div>
            <div id="afp-key-result" style="display:none;margin-top:8px;padding:8px;border-radius:8px;font-size:11px"></div>
            <a href="https://opencode.ai" target="_blank" style="font-size:10px;color:#89b4fa;text-decoration:none;display:block;margin-top:8px">🔑 Get free key →</a>
          </div>
        </div>

        <!-- Google Account -->
        <div class="card">
          <div class="card-header">
            <span class="icon">🔐</span>
            <span class="title">Google Account</span>
            <span class="badge" id="afp-google-status">❌ Not connected</span>
          </div>
          <div class="card-body">
            <div id="afp-google-info" style="display:none;margin-bottom:8px">
              <div style="font-size:11px;color:#cdd6f4" id="afp-google-email"></div>
              <div style="font-size:9px;color:#585b70">Gmail sync • Auto tracking</div>
            </div>
            <button class="btn btn-primary btn-full" id="afp-google-login">🔑 Sign in with Google</button>
            <button class="btn btn-secondary btn-full" id="afp-gmail-sync" style="display:none;margin-top:8px">📧 Sync Gmail</button>
          </div>
        </div>

        <!-- AI Model -->
        <div class="card">
          <div class="card-header">
            <span class="icon">🧠</span>
            <span class="title">AI Model</span>
          </div>
          <div class="card-body">
            <select class="select" id="afp-ai-model">
              <option value="mimo-2.5">Mimo 2.5 (Default)</option>
              <option value="groq/llama-3.3-70b-versatile">Groq Llama 3.3 70B</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="claude-3-haiku">Claude 3 Haiku</option>
            </select>
            <p style="font-size:10px;color:#585b70">AI for cover letters, analysis, chat</p>
          </div>
        </div>

        <!-- Language -->
        <div class="card">
          <div class="card-header">
            <span class="icon">🌐</span>
            <span class="title">Language</span>
          </div>
          <div class="card-body">
            <select class="select" id="afp-language">
              <option value="auto">Auto-detect</option>
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="fa">فارسی</option>
            </select>
          </div>
        </div>

        <!-- Auto-fill -->
        <div class="card">
          <div class="card-header">
            <span class="icon">⚙️</span>
            <span class="title">Auto-fill</span>
          </div>
          <div class="card-body">
            <label style="display:flex;justify-content:space-between;align-items:center;font-size:12px;margin-bottom:12px">
              <span>Enable auto-fill</span>
              <input type="checkbox" id="afp-auto-fill-toggle" checked>
            </label>
            <label style="display:flex;justify-content:space-between;align-items:center;font-size:12px;margin-bottom:12px">
              <span>Skip filled fields</span>
              <input type="checkbox" id="afp-skip-filled" checked>
            </label>
            <label style="display:flex;justify-content:space-between;align-items:center;font-size:12px">
              <span>Highlight fields</span>
              <input type="checkbox" id="afp-highlight" checked>
            </label>
          </div>
        </div>

        <!-- Save -->
        <button class="btn btn-primary btn-full" id="afp-save-settings">💾 Save Settings</button>

        <!-- About -->
        <div class="card" style="margin-top:12px">
          <div class="card-body" style="text-align:center;font-size:10px;color:#585b70">
            <p>AutoFill Pro v8.2</p>
            <p>Free & Open Source • GitHub: Arefmtl</p>
            <a href="https://github.com/Arefmtl/autofill-pro" target="_blank" style="color:#89b4fa;text-decoration:none">📦 View on GitHub</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Nav -->
    <div class="nav">
      <button class="nav-item active" data-p="home">
        <span class="nav-icon">🏠</span>
        <span class="nav-label">Home</span>
      </button>
      <button class="nav-item" data-p="jobs">
        <span class="nav-icon">💼</span>
        <span class="nav-label">Jobs</span>
      </button>
      <button class="nav-item" data-p="tracker">
        <span class="nav-icon">📊</span>
        <span class="nav-label">Tracker</span>
      </button>
      <button class="nav-item" data-p="settings">
        <span class="nav-icon">⚙️</span>
        <span class="nav-label">Settings</span>
      </button>
    </div>
  `;
  document.body.appendChild(el);

  // ============== TOAST ==============
  function showToast(msg, icon = '✅') {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  // ============== TOGGLE ==============
  const tog = document.getElementById('afp-toggle');
  tog.addEventListener('click', () => {
    el.classList.toggle('open');
    tog.classList.toggle('shifted');
  });
  document.getElementById('afp-x').addEventListener('click', () => {
    el.classList.remove('open');
    tog.classList.remove('shifted');
  });

  // ============== NAV ==============
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.dataset.p;
      currentTab = panel;

      // Update nav
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update panels
      document.querySelectorAll('.pnl').forEach(p => p.classList.remove('active'));
      document.querySelector(`.pnl[data-p="${panel}"]`)?.classList.add('active');
    });
  });

  // ============== HELPERS ==============
  function bgMsg(msg) {
    return new Promise(resolve => {
      chrome.runtime.sendMessage(msg, resp => resolve(resp));
    });
  }

  function esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ============== LOAD DATA ==============
  chrome.storage.local.get(['resumeData', 'profile', 'settings', 'jobs'], r => {
    resumeData = r.resumeData || r.profile || null;
    jobs = r.jobs || [];
    settings = r.settings || {};

    // Update API status
    if (settings.apiKey) {
      document.getElementById('afp-api-status').textContent = '✅ Active';
      document.getElementById('afp-api-key').value = settings.apiKey;
    }

    // Update stats
    updateStats();

    // Render recent jobs
    renderRecentJobs();

    // Render job list
    renderJobList();

    // Show welcome if no resume
    if (!resumeData) {
      document.getElementById('afp-welcome').style.display = 'block';
    }
  });

  function updateStats() {
    const counts = { saved: 0, applied: 0, interview: 0, offer: 0, rejected: 0 };
    jobs.forEach(j => { if (counts[j.status] !== undefined) counts[j.status]++; });

    document.getElementById('afp-total-jobs').textContent = jobs.length;
    document.getElementById('afp-applied').textContent = counts.applied + counts.interview + counts.offer;
    document.getElementById('afp-interviews').textContent = counts.interview;
    document.getElementById('afp-matches').textContent = counts.offer;

    // Tracker stats
    document.getElementById('afp-tr-total').textContent = jobs.length;
    document.getElementById('afp-tr-active').textContent = counts.applied;
    document.getElementById('afp-tr-interview').textContent = counts.interview;
    document.getElementById('afp-tr-offer').textContent = counts.offer;
  }

  function renderRecentJobs() {
    const container = document.getElementById('afp-recent-jobs');
    if (!jobs.length) {
      container.innerHTML = `
        <div class="empty">
          <div class="empty-icon">💼</div>
          <div class="empty-title">No jobs yet</div>
          <div class="empty-desc">Search for jobs to get started</div>
        </div>
      `;
      return;
    }

    container.innerHTML = jobs.slice(0, 5).map(j => `
      <div class="job-card">
        <div class="company">${esc(j.company)}</div>
        <div class="role">${esc(j.title)}</div>
        <div class="meta">
          <span class="badge badge-${j.status}">${j.status}</span>
          <span class="date">${j.date ? new Date(j.date).toLocaleDateString() : ''}</span>
        </div>
      </div>
    `).join('');
  }

  function renderJobList() {
    const container = document.getElementById('afp-job-list');
    if (!jobs.length) {
      container.innerHTML = `
        <div class="empty">
          <div class="empty-icon">📊</div>
          <div class="empty-title">No jobs tracked</div>
          <div class="empty-desc">Add jobs to track your application progress</div>
        </div>
      `;
      return;
    }

    container.innerHTML = jobs.map(j => `
      <div class="job-card" data-id="${j.id}">
        <div style="display:flex;justify-content:space-between;align-items:start">
          <div>
            <div class="company">${esc(j.company)}</div>
            <div class="role">${esc(j.title)}</div>
          </div>
          <span class="badge badge-${j.status}">${j.status}</span>
        </div>
        <div class="meta">
          <span class="date">${j.date ? new Date(j.date).toLocaleDateString() : ''}</span>
          <div>
            ${j.url ? `<a href="${j.url}" target="_blank" style="font-size:10px;color:#89b4fa;text-decoration:none">🔗</a>` : ''}
            <button class="btn btn-sm btn-danger delete-job" data-id="${j.id}">🗑️</button>
          </div>
        </div>
      </div>
    `).join('');

    // Delete handlers
    container.querySelectorAll('.delete-job').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        jobs = jobs.filter(j => j.id !== id);
        chrome.storage.local.set({ jobs });
        updateStats();
        renderJobList();
        renderRecentJobs();
        showToast('Job deleted', '🗑️');
      });
    });
  }

  // ============== QUICK ACTIONS ==============
  document.getElementById('afp-qa-search')?.addEventListener('click', () => {
    document.querySelector('.nav-item[data-p="jobs"]').click();
  });

  document.getElementById('afp-qa-apply')?.addEventListener('click', () => {
    bgMsg({ action: 'fillForms' });
    showToast('Auto-filling form...', '🚀');
  });

  document.getElementById('afp-qa-match')?.addEventListener('click', async () => {
    const r = await bgMsg({ action: 'extractJD' });
    if (r?.jd) {
      showToast('Job description extracted', '✅');
    }
  });

  document.getElementById('afp-qa-interview')?.addEventListener('click', () => {
    showToast('Interview prep coming soon!', '🎤');
  });

  // ============== SEARCH ==============
  document.getElementById('afp-search-btn')?.addEventListener('click', async () => {
    const q = document.getElementById('afp-search-query').value.trim();
    const l = document.getElementById('afp-search-location').value.trim();
    const s = document.getElementById('afp-search-source').value;

    if (!q) return;

    const container = document.getElementById('afp-search-results');
    container.innerHTML = '<div class="spinner"></div>';

    const urls = {
      linkedin: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(l)}`,
      indeed: `https://de.indeed.com/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}`,
      stepstone: `https://www.stepstone.de/jobs/${encodeURIComponent(q)}/in-${encodeURIComponent(l)}`,
    };

    if (s === 'all') {
      container.innerHTML = Object.entries(urls).map(([name, url]) => `
        <div class="job-card" onclick="window.open('${url}','_blank')">
          <div class="company">${name.charAt(0).toUpperCase() + name.slice(1)}</div>
          <div class="role">${esc(q)} • ${esc(l)}</div>
          <div class="meta">
            <span class="badge badge-saved">External</span>
            <span style="font-size:10px;color:#89b4fa">🔗 Open</span>
          </div>
        </div>
      `).join('');
    } else {
      window.open(urls[s], '_blank');
      container.innerHTML = `
        <div class="job-card">
          <div class="company">${s.charAt(0).toUpperCase() + s.slice(1)}</div>
          <div class="role">${esc(q)} • ${esc(l)}</div>
          <div class="meta">
            <span class="badge badge-saved">External</span>
            <span style="font-size:10px;color:#89b4fa">🔗 Opened in new tab</span>
          </div>
        </div>
      `;
    }
  });

  // ============== ADD JOB ==============
  document.getElementById('afp-add-job-btn')?.addEventListener('click', async () => {
    const company = document.getElementById('afp-add-company').value.trim();
    const title = document.getElementById('afp-add-role').value.trim();
    const url = document.getElementById('afp-add-url').value.trim();
    const status = document.getElementById('afp-add-status').value;

    if (!company || !title) {
      showToast('Please fill company and title', '⚠️');
      return;
    }

    const job = {
      id: Date.now().toString(),
      company,
      title,
      url,
      status,
      date: new Date().toISOString(),
    };

    jobs.push(job);
    chrome.storage.local.set({ jobs });

    // Clear form
    document.getElementById('afp-add-company').value = '';
    document.getElementById('afp-add-role').value = '';
    document.getElementById('afp-add-url').value = '';

    updateStats();
    renderJobList();
    renderRecentJobs();
    showToast('Job added!', '✅');
  });

  // ============== SETTINGS ==============
  document.getElementById('afp-save-settings')?.addEventListener('click', () => {
    settings.apiKey = document.getElementById('afp-api-key').value.trim();
    settings.model = document.getElementById('afp-ai-model').value;
    settings.lang = document.getElementById('afp-language').value;
    settings.autoFillEnabled = document.getElementById('afp-auto-fill-toggle').checked;
    settings.skipFilled = document.getElementById('afp-skip-filled').checked;
    settings.highlightFilled = document.getElementById('afp-highlight').checked;

    chrome.storage.local.set({ settings });

    if (settings.apiKey) {
      document.getElementById('afp-api-status').textContent = '✅ Active';
      document.getElementById('afp-api-status').style.color = '#a6e3a1';
    }

    showToast('Settings saved!', '✅');
  });

  // ============== API TEST ==============
  document.getElementById('afp-test-key')?.addEventListener('click', async () => {
    const key = document.getElementById('afp-api-key').value.trim();
    if (!key) {
      showToast('Enter an API key first', '⚠️');
      return;
    }

    const result = document.getElementById('afp-key-result');
    result.style.display = 'block';
    result.style.background = 'rgba(137,180,250,.1)';
    result.style.color = '#89b4fa';
    result.textContent = '🧪 Testing...';

    try {
      const r = await bgMsg({ action: 'testApiKey', key });
      if (r?.valid) {
        result.style.background = 'rgba(166,227,161,.1)';
        result.style.color = '#a6e3a1';
        result.textContent = '✅ API key is valid!';
      } else {
        result.style.background = 'rgba(243,139,168,.1)';
        result.style.color = '#f38ba8';
        result.textContent = '❌ Invalid API key';
      }
    } catch (e) {
      result.style.background = 'rgba(243,139,168,.1)';
      result.style.color = '#f38ba8';
      result.textContent = '❌ Error testing key';
    }
  });

  // ============== SHOW/HIDE KEY ==============
  document.getElementById('afp-show-key')?.addEventListener('click', () => {
    const input = document.getElementById('afp-api-key');
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  // ============== WELCOME ==============
  document.getElementById('afp-start-upload')?.addEventListener('click', () => {
    document.getElementById('afp-welcome').style.display = 'none';
    // Trigger file upload
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.docx,.txt';
    fileInput.click();
  });

})();
