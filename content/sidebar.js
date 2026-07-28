// AutoFill Pro v7.1 — Sidebar UI (Fixed)
(() => {
  'use strict';
  if (document.getElementById('afp-sidebar')) return;

  const W = '380px';

  // Create sidebar
  const el = document.createElement('div');
  el.id = 'afp-sidebar';
  el.innerHTML = `
    <style>
      #afp-sidebar{position:fixed;top:0;right:0;width:${W};height:100vh;background:#0b0b1a;color:#cdd6f4;z-index:2147483647;font-family:'Segoe UI',Tahoma,sans-serif;box-shadow:-4px 0 24px rgba(0,0,0,.5);display:flex;flex-direction:column;border-left:1px solid #313244;transform:translateX(100%);transition:transform .3s cubic-bezier(.4,0,.2,1)}
      #afp-sidebar.open{transform:translateX(0)}
      #afp-toggle{position:fixed;top:50%;right:0;transform:translateY(-50%);width:32px;height:64px;background:linear-gradient(135deg,#89b4fa,#cba6f7);border:none;border-radius:8px 0 0 8px;cursor:pointer;z-index:2147483646;color:#1e1e2e;font-size:16px;box-shadow:-2px 0 8px rgba(0,0,0,.3);transition:right .3s}
      #afp-toggle.shifted{right:${W}}
      .h{padding:12px;border-bottom:1px solid #313244;display:flex;align-items:center;gap:8px}
      .h h1{font-size:13px;color:#89b4fa;font-weight:700;flex:1}
      .h button{background:none;border:none;color:#585b70;cursor:pointer;font-size:16px;padding:4px}
      .tabs{display:flex;border-bottom:1px solid #313244;padding:0 4px}
      .tab{flex:0 0 auto;padding:8px 10px;background:none;border:none;border-bottom:2px solid transparent;color:#585b70;font-size:11px;cursor:pointer;transition:all .15s}
      .tab.on{color:#89b4fa;border-bottom-color:#89b4fa}
      .tab:hover{color:#a6adc8}
      .ct{flex:1;overflow-y:auto;padding:8px}
      .ct::-webkit-scrollbar{width:4px}
      .ct::-webkit-scrollbar-thumb{background:#313244;border-radius:2px}
      .card{background:#181825;border:1px solid #313244;border-radius:10px;margin-bottom:8px;overflow:hidden}
      .ch{display:flex;align-items:center;padding:8px 10px;border-bottom:1px solid #313244}
      .ch .t{flex:1;font-size:11px;font-weight:600}
      .cb{padding:8px 10px;font-size:11px}
      .btn{border:none;border-radius:6px;padding:7px 14px;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s}
      .bp{background:linear-gradient(135deg,#89b4fa,#cba6f7);color:#1e1e2e}
      .bp:hover{opacity:.9}
      .bs{background:#313244;color:#a6adc8}
      .bs:hover{background:#45475a}
      .bf{width:100%;display:block}
      .inp{width:100%;background:#1e1e2e;border:1px solid #313244;border-radius:6px;padding:7px 10px;color:#cdd6f4;font-size:11px;margin-bottom:6px}
      .inp:focus{outline:none;border-color:#89b4fa}
      .sel{background:#1e1e2e;border:1px solid #313244;border-radius:6px;padding:7px 10px;color:#cdd6f4;font-size:11px;width:100%;margin-bottom:6px}
      .ats{display:inline-flex;align-items:center;gap:4px;background:rgba(137,180,250,.1);padding:3px 8px;border-radius:4px;font-size:10px;color:#89b4fa}
      .sr{display:flex;align-items:center;gap:10px}
      .ring{width:50px;height:50px;border-radius:50%;border:4px solid #313244;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700}
      .ring.hi{border-color:#a6e3a1;color:#a6e3a1}
      .ring.md{border-color:#f9e2af;color:#f9e2af}
      .ring.lo{border-color:#f38ba8;color:#f38ba8}
      .acts{display:flex;gap:4px;margin-bottom:8px}
      .acts .btn{flex:1;font-size:10px;padding:6px}
      .cm{margin-bottom:4px;display:flex}
      .cm.user{justify-content:flex-end}
      .cm.ai{justify-content:flex-start}
      .cb2{max-width:85%;padding:8px 12px;border-radius:12px;font-size:11px;line-height:1.4}
      .cm.ai .cb2{background:#1e1e2e;border:1px solid #313244;color:#cdd6f4}
      .cm.user .cb2{background:#89b4fa;color:#1e1e2e}
      .cq{background:#313244;border:none;color:#a6adc8;padding:4px 8px;border-radius:5px;font-size:9px;cursor:pointer}
      .cq:hover{background:#45475a;color:#89b4fa}
      .ts{text-align:center;flex:1}
      .ts .n{font-size:18px;font-weight:700;color:#89b4fa}
      .ts .l{font-size:9px;color:#585b70}
      .jc{background:#1e1e2e;border:1px solid #313244;border-radius:6px;padding:8px;margin-bottom:6px}
      .jc .co{font-size:11px;font-weight:600;color:#89b4fa}
      .jc .ti{font-size:10px;color:#a6adc8}
      .jc .mt{display:flex;justify-content:space-between;align-items:center;margin-top:4px}
      .jc .dt{font-size:9px;color:#585b70}
      .st{display:inline-block;padding:2px 6px;border-radius:4px;font-size:9px;font-weight:600}
      .st.saved{background:rgba(108,112,134,.2);color:#6c7086}
      .st.applied{background:rgba(137,180,250,.2);color:#89b4fa}
      .st.interview{background:rgba(249,226,175,.2);color:#f9e2af}
      .st.offer{background:rgba(166,227,161,.2);color:#a6e3a1}
      .st.rejected{background:rgba(243,139,168,.2);color:#f38ba8}
      .dz{border:2px dashed #313244;border-radius:10px;padding:20px;text-align:center;cursor:pointer;transition:all .2s}
      .dz:hover{border-color:#89b4fa;background:rgba(137,180,250,.05)}
      .sp{width:24px;height:24px;border:3px solid #313244;border-top-color:#89b4fa;border-radius:50%;animation:sp .8s linear infinite;margin:12px auto}
      @keyframes sp{to{transform:rotate(360deg)}}
      .hl{background:rgba(250,204,21,.3);border-radius:2px;padding:0 2px;border-bottom:2px solid #facc15}
      .sb{position:absolute;bottom:0;left:0;right:0;padding:6px 12px;background:#181825;border-top:1px solid #313244;font-size:10px;text-align:center;color:#585b70}
    </style>
    <button id="afp-toggle">⚡</button>
    <div id="afp-hdr" class="h"><span style="font-size:20px">⚡</span><h1>AutoFill Pro</h1><span style="font-size:9px;color:#585b70">v7.1</span><button id="afp-x">✕</button></div>
    <div class="tabs" id="afp-tabs">
      <button class="tab on" data-t="upload">📄</button>
      <button class="tab" data-t="jobs">💼</button>
      <button class="tab" data-t="tracker">📊</button>
      <button class="tab" data-t="search">🔍</button>
      <button class="tab" data-t="chat">💬</button>
      <button class="tab" data-t="settings">⚙️</button>
    </div>
    <div class="ct" id="afp-ct">
      <!-- Upload -->
      <div class="pnl" data-p="upload">
        <div class="dz" id="afp-dz"><div style="font-size:28px;margin-bottom:8px">📄</div><p style="font-size:11px;margin-bottom:4px">Drop resume here</p><p style="font-size:9px;color:#585b70;margin-bottom:8px">PDF, DOCX, TXT</p><button class="btn bp" id="afp-sf">Choose File</button><input type="file" id="afp-fi" accept=".pdf,.docx,.txt" hidden></div>
        <div id="afp-up" style="display:none;text-align:center;padding:12px"><div class="sp"></div><p style="font-size:11px" id="afp-ut">Analyzing...</p></div>
        <div id="afp-ud" style="display:none;text-align:center;padding:12px"><div style="font-size:28px;margin-bottom:8px">✅</div><p style="font-size:11px">Resume analyzed!</p><p style="font-size:9px;color:#585b70" id="afp-us"></p></div>
      </div>
      <!-- Jobs -->
      <div class="pnl" data-p="jobs" style="display:none">
        <div class="ats" id="afp-at"><span>📍</span><span id="afp-an">Detecting...</span></div>
        <div class="acts" style="margin-top:8px"><button class="btn bs" id="afp-gm">📧 Gmail</button><button class="btn bs" id="afp-rf">👥 Referral</button><button class="btn bs" id="afp-hl">🎯 Highlight</button></div>
        <div class="card"><div class="ch"><span>📊</span><span class="t">Job Summary</span><button class="btn bs" style="font-size:9px;padding:3px 8px" id="afp-ab">Analyze</button></div><div class="cb" id="afp-js"><p style="color:#585b70">Go to job page and click Analyze</p></div></div>
        <div class="card" id="afp-mc" style="display:none"><div class="ch"><span>🎯</span><span class="t">Match Score</span></div><div class="cb"><div class="sr"><div class="ring" id="afp-sr">0</div><div id="afp-sd" style="font-size:10px"></div></div></div></div>
        <div class="card" id="afp-kc" style="display:none"><div class="ch"><span>🏷️</span><span class="t">Keywords</span></div><div class="cb" id="afp-kl"></div></div>
        <div class="card" id="afp-clc" style="display:none"><div class="ch"><span>✉️</span><span class="t">Cover Letter</span><button class="btn bs" style="font-size:9px;padding:3px 8px" id="afp-ccl">📋</button></div><div class="cb" id="afp-cl" style="max-height:120px;overflow-y:auto;white-space:pre-wrap"></div></div>
        <button class="btn bp bf" id="afp-fb">🚀 Auto-Fill Form</button>
      </div>
      <!-- Tracker -->
      <div class="pnl" data-p="tracker" style="display:none">
        <div style="display:flex;gap:8px;margin-bottom:10px"><div class="ts"><div class="n" id="afp-st0">0</div><div class="l">Total</div></div><div class="ts"><div class="n" id="afp-st1">0</div><div class="l">Applied</div></div><div class="ts"><div class="n" id="afp-st2">0</div><div class="l">Interview</div></div><div class="ts"><div class="n" id="afp-st3">0</div><div class="l">Offer</div></div></div>
        <div id="afp-tl"></div>
        <button class="btn bs bf" id="afp-ajb">➕ Add Job</button>
        <div id="afp-ajf" style="display:none;margin-top:8px"><input class="inp" id="afp-jc" placeholder="Company"><input class="inp" id="afp-jt" placeholder="Job Title"><input class="inp" id="afp-ju" placeholder="URL (optional)"><select class="sel" id="afp-js2"><option value="saved">💾 Saved</option><option value="applied">📤 Applied</option><option value="interview">🎤 Interview</option><option value="offer">🎉 Offer</option><option value="rejected">❌ Rejected</option></select><button class="btn bp bf" id="afp-sjb">💾 Save</button></div>
      </div>
      <!-- Search -->
      <div class="pnl" data-p="search" style="display:none">
        <input class="inp" id="afp-sq" placeholder="Job title, e.g. Data Scientist">
        <input class="inp" id="afp-sl" placeholder="Location (Germany)">
        <select class="sel" id="afp-ss"><option value="linkedin">LinkedIn</option><option value="indeed">Indeed</option><option value="stepstone">StepStone</option><option value="all">All</option></select>
        <button class="btn bp bf" id="afp-sb">🔍 Search</button>
        <div id="afp-sr2" style="margin-top:8px"></div>
      </div>
      <!-- Chat -->
      <div class="pnl" data-p="chat" style="display:none">
        <div id="afp-cm" style="height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;margin-bottom:8px"><div class="cm ai"><div class="cb2">Hi! I'm your career coach. 💡<br><br>I can help with:<br>• Analyze current job<br>• Interview prep<br>• Resume tips<br><br>Type or click a button!</div></div></div>
        <div style="display:flex;gap:4px;margin-bottom:6px;flex-wrap:wrap"><button class="cq" data-m="Analyze match for this job">🎯 Match</button><button class="cq" data-m="Prepare me for interview">🎤 Interview</button><button class="cq" data-m="How to improve resume?">📝 Resume</button></div>
        <div style="display:flex;gap:4px"><input class="inp" id="afp-ci" placeholder="Type message..." style="margin-bottom:0;flex:1"><button class="btn bp" id="afp-cs" style="padding:7px 12px">Send</button></div>
      </div>
      <!-- Settings -->
      <div class="pnl" data-p="settings" style="display:none">
        <div class="card"><div class="ch"><span>🤖</span><span class="t">API Key</span><span style="font-size:9px;color:#22c55e" id="afp-as">✅ Active</span></div><div class="cb"><input type="password" class="inp" id="afp-ak" placeholder="API Key..."><a href="https://opencode.ai" target="_blank" style="font-size:9px;color:#89b4fa;text-decoration:none">🔑 Get free key →</a></div></div>
        <div class="card"><div class="ch"><span>⚙️</span><span class="t">Settings</span></div><div class="cb"><label style="display:flex;justify-content:space-between;align-items:center;font-size:11px"><span>Auto-fill</span><input type="checkbox" id="afp-at2" checked></label></div></div>
        <button class="btn bp bf" id="afp-ss2">💾 Save</button>
      </div>
    </div>
    <div class="sb" id="afp-sb2"></div>
  `;
  document.body.appendChild(el);
  document.getElementById('afp-sf')?.addEventListener('click', () => document.getElementById('afp-fi')?.click());

  // Toggle
  const tog = document.getElementById('afp-toggle');
  tog.addEventListener('click', () => {
    el.classList.toggle('open');
    tog.classList.toggle('shifted');
  });
  document.getElementById('afp-x').addEventListener('click', () => {
    el.classList.remove('open');
    tog.classList.remove('shifted');
  });

  // Tabs
  document.getElementById('afp-tabs').addEventListener('click', e => {
    const t = e.target.closest('.tab');
    if (!t) return;
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('on'));
    document.querySelectorAll('.pnl').forEach(x => x.style.display = 'none');
    t.classList.add('on');
    const p = document.querySelector(`.pnl[data-p="${t.dataset.t}"]`);
    if (p) p.style.display = 'block';
  });

  // Helper: send message to background
  function bgMsg(msg) {
    return new Promise(resolve => {
      chrome.runtime.sendMessage(msg, resp => resolve(resp));
    });
  }

  // Chat
  document.querySelectorAll('.cq').forEach(b => b.addEventListener('click', () => doChat(b.dataset.m)));
  document.getElementById('afp-cs')?.addEventListener('click', () => { const i = document.getElementById('afp-ci'); doChat(i.value); i.value = ''; });
  document.getElementById('afp-ci')?.addEventListener('keydown', e => { if (e.key === 'Enter') { doChat(e.target.value); e.target.value = ''; } });

  async function doChat(msg) {
    if (!msg?.trim()) return;
    const cm = document.getElementById('afp-cm');
    cm.innerHTML += `<div class="cm user"><div class="cb2">${esc(msg)}</div></div>`;
    cm.innerHTML += `<div class="cm ai" id="afp-tp"><div class="cb2"><div class="sp" style="margin:4px auto;width:16px;height:16px"></div></div></div>`;
    cm.scrollTop = cm.scrollHeight;
    const r = await bgMsg({ action: 'careerChat', message: msg });
    document.getElementById('afp-tp')?.remove();
    cm.innerHTML += `<div class="cm ai"><div class="cb2">${(r?.reply || '❌ Error').replace(/\n/g, '<br>')}</div></div>`;
    cm.scrollTop = cm.scrollHeight;
  }

  // Load settings
  chrome.storage.local.get(['resumeData', 'profile', 'settings', 'jobs'], r => {
    const k = r.settings?.apiKey || '';
    if (k) { document.getElementById('afp-ak').value = k; document.getElementById('afp-as').textContent = '✅ Active'; }
    renderJobs(r.jobs || []);
  });

  function renderJobs(jobs) {
    const c = { saved: 0, applied: 0, interview: 0, offer: 0 };
    jobs.forEach(j => { if (c[j.status] !== undefined) c[j.status]++; });
    document.getElementById('afp-st0').textContent = jobs.length;
    document.getElementById('afp-st1').textContent = c.applied;
    document.getElementById('afp-st2').textContent = c.interview;
    document.getElementById('afp-st3').textContent = c.offer;
    const tl = document.getElementById('afp-tl');
    if (!jobs.length) { tl.innerHTML = '<p style="text-align:center;color:#585b70;font-size:11px;padding:12px">No jobs yet</p>'; return; }
    tl.innerHTML = jobs.slice(0, 20).map(j => `<div class="jc"><div style="display:flex;justify-content:space-between;align-items:start"><div><div class="co">${esc(j.company)}</div><div class="ti">${esc(j.title)}</div></div><span class="st ${j.status}">${j.status}</span></div><div class="mt"><span class="dt">${j.date ? new Date(j.date).toLocaleDateString() : ''}</span><div>${j.url ? `<a href="${j.url}" target="_blank" style="font-size:10px;color:#89b4fa;text-decoration:none">🔗</a>` : ''} <button class="djb" data-id="${j.id}" style="background:none;border:none;cursor:pointer;font-size:10px">🗑️</button></div></div></div>`).join('');
    tl.querySelectorAll('.djb').forEach(b => b.addEventListener('click', () => {
      const u = jobs.filter(j => j.id !== b.dataset.id);
      chrome.storage.local.set({ jobs: u });
      renderJobs(u);
    }));
  }

  // Add job
  document.getElementById('afp-ajb')?.addEventListener('click', () => {
    const f = document.getElementById('afp-ajf');
    f.style.display = f.style.display === 'none' ? 'block' : 'none';
  });
  document.getElementById('afp-sjb')?.addEventListener('click', async () => {
    const co = document.getElementById('afp-jc').value.trim();
    const ti = document.getElementById('afp-jt').value.trim();
    const ur = document.getElementById('afp-ju').value.trim();
    const st = document.getElementById('afp-js2').value;
    if (!co || !ti) return;
    const r = await bgMsg({ action: 'saveJob', job: { id: Date.now().toString(), company: co, title: ti, url: ur, status: st, date: new Date().toISOString() } });
    chrome.storage.local.get('jobs', rr => renderJobs(rr.jobs || []));
    document.getElementById('afp-ajf').style.display = 'none';
    document.getElementById('afp-jc').value = '';
    document.getElementById('afp-jt').value = '';
    document.getElementById('afp-ju').value = '';
  });

  // Fill form
  document.getElementById('afp-fb')?.addEventListener('click', () => bgMsg({ action: 'fillForms' }));

  // Analyze
  document.getElementById('afp-ab')?.addEventListener('click', async () => {
    const r = await bgMsg({ action: 'extractJD' });
    if (r?.jd) document.getElementById('afp-js').textContent = r.jd.substring(0, 500) + '...';
  });

  // Highlight
  document.getElementById('afp-hl')?.addEventListener('click', async () => {
    const r = await bgMsg({ action: 'getProfile' });
    const p = r?.profile || r?.resumeData || {};
    const kw = (p.skills || '').split(',').map(s => s.trim()).filter(s => s.length > 2);
    bgMsg({ action: 'highlightKeywords', keywords: kw });
  });

  // Gmail
  document.getElementById('afp-gm')?.addEventListener('click', () => bgMsg({ action: 'injectGmailBadge' }));

  // Referral
  document.getElementById('afp-rf')?.addEventListener('click', () => bgMsg({ action: 'showReferral' }));

  // Search
  document.getElementById('afp-sb')?.addEventListener('click', () => {
    const q = document.getElementById('afp-sq').value.trim();
    const l = document.getElementById('afp-sl').value.trim();
    const s = document.getElementById('afp-ss').value;
    if (!q) return;
    const u = { linkedin: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(l || 'Germany')}`, indeed: `https://de.indeed.com/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l || 'Germany')}`, stepstone: `https://www.stepstone.de/jobs/${encodeURIComponent(q)}/in-${encodeURIComponent(l || 'Deutschland')}`, all: `https://www.google.com/search?q=${encodeURIComponent(q + ' jobs ' + (l || 'Germany'))}` };
    window.open(u[s], '_blank');
  });

  // Settings
  document.getElementById('afp-ss2')?.addEventListener('click', () => {
    const k = document.getElementById('afp-ak').value.trim();
    const af = document.getElementById('afp-at2').checked;
    chrome.storage.local.set({ settings: { apiKey: k, autoFillEnabled: af } });
    document.getElementById('afp-as').textContent = k ? '✅ Active' : '❌ No key';
  });

  // File upload
  document.getElementById('afp-dz')?.addEventListener('click', e => { if (e.target.id !== 'afp-sf') document.getElementById('afp-fi')?.click(); });
  document.getElementById('afp-fi')?.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById('afp-dz').style.display = 'none';
    document.getElementById('afp-up').style.display = 'block';
    document.getElementById('afp-ut').textContent = `Analyzing ${file.name}...`;
    const reader = new FileReader();
    reader.onload = async () => {
      const text = reader.result;
      document.getElementById('afp-ut').textContent = 'AI extracting...';
      const r = await bgMsg({ action: 'getProfile' });
      const key = r?.settings?.apiKey || '';
      if (!key) { document.getElementById('afp-ut').textContent = '❌ No API key'; return; }
      try {
        const resp = await fetch('https://api.opencode.ai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
          body: JSON.stringify({ model: 'mimo-2.5', messages: [{ role: 'user', content: `Extract from resume: fullName, email, phone, city, country, linkedin, github, website, skills, experience, education, summary, nationality, visaStatus. Return JSON.\n\n${text.substring(0, 4000)}` }], temperature: 0.1, max_tokens: 1000 })
        });
        if (resp.ok) {
          const d = await resp.json();
          const c = d.choices[0]?.message?.content || '';
          const m = c.match(/\{[\s\S]*\}/);
          if (m) {
            const data = JSON.parse(m[0]);
            chrome.storage.local.set({ resumeData: data, profile: data });
            document.getElementById('afp-up').style.display = 'none';
            document.getElementById('afp-ud').style.display = 'block';
            document.getElementById('afp-us').textContent = `${Object.keys(data).length} fields extracted`;
          }
        }
      } catch (err) { document.getElementById('afp-ut').textContent = '❌ ' + err.message; }
    };
    reader.readAsText(file);
  });

  // Detect ATS
  bgMsg({ action: 'detectATS' }).then(r => {
    if (r?.ats) document.getElementById('afp-an').textContent = r.ats.name || r.ats;
  });

  function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
})();
