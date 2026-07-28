// AutoFill Pro — Referral Finder
// Finds contacts at target companies via LinkedIn public profiles
(() => {
  'use strict';

  const AI_ENDPOINT = 'https://api.opencode.ai/v1/chat/completions';
  const AI_MODEL = 'mimo-2.5';

  async function getApiKey() {
    return new Promise(resolve => {
      chrome.storage.local.get('settings', r => resolve(r.settings?.apiKey || ''));
    });
  }

  async function getProfile() {
    return new Promise(resolve => {
      chrome.storage.local.get(['resumeData', 'profile'], r => {
        resolve({ ...(r.resumeData || {}), ...(r.profile || {}) });
      });
    });
  }

  // Extract company name from current page
  function detectCompany() {
    const host = window.location.hostname.toLowerCase();
    
    // LinkedIn job page
    if (host.includes('linkedin.com')) {
      const companyEl = document.querySelector('.topcard__flavor--company-name, .job-details-jobs-unified-top-card__company-name, [data-tracking-control-name="public_jobs_jserp-result_lob-company"] a');
      if (companyEl) return companyEl.textContent.trim();
    }
    
    // Greenhouse
    if (host.includes('greenhouse.io')) {
      const el = document.querySelector('.company-name, #header .company');
      if (el) return el.textContent.trim();
    }
    
    // Lever
    if (host.includes('lever.co')) {
      const el = document.querySelector('.posting-company, .company-name');
      if (el) return el.textContent.trim();
    }
    
    // Generic: try page title or URL
    const title = document.title;
    const match = title.match(/(?:at|@|–|-)\s+(.+?)(?:\s+(?:jobs?|careers?|hiring)|$)/i);
    if (match) return match[1].trim();
    
    return null;
  }

  // Generate referral outreach message
  async function generateOutreach(company, role, profile) {
    const apiKey = await getApiKey();
    if (!apiKey) return null;

    const prompt = `Generate a concise LinkedIn referral request message.

CANDIDATE: ${profile.firstName || ''} ${profile.lastName || ''}
SKILLS: ${profile.skills || 'N/A'}
EXPERIENCE: ${profile.experience || 'N/A'}

TARGET: ${role} at ${company}

Write a short, professional message (3-4 sentences max):
- Introduction (who you are)
- Why you're interested in ${company}
- Ask for a referral or internal insight
- Thank them

Keep it under 150 words. Professional but friendly tone.`;

    try {
      const resp = await fetch(AI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: AI_MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 300 })
      });
      if (!resp.ok) return null;
      const d = await resp.json();
      return d.choices[0]?.message?.content || null;
    } catch { return null; }
  }

  // Build referral search URLs
  function buildSearchUrls(company) {
    const encoded = encodeURIComponent(company);
    return {
      linkedin: `https://www.linkedin.com/search/results/people/?keywords=${encoded}&origin=GLOBAL_SEARCH_HEADER`,
      google: `https://www.google.com/search?q=${encoded}+employees+linkedin`,
      twitter: `https://twitter.com/search?q=${encoded}&f=live`,
    };
  }

  // Inject referral panel on job pages
  function injectReferralPanel() {
    if (document.querySelector('.afp-referral-panel')) return;
    
    const company = detectCompany();
    if (!company) return;

    const urls = buildSearchUrls(company);
    
    const panel = document.createElement('div');
    panel.className = 'afp-referral-panel';
    panel.style.cssText = `
      position:fixed; bottom:80px; right:20px; z-index:99998;
      background:#0f172a; border:1px solid #313244;
      border-radius:12px; padding:14px; width:240px;
      box-shadow:0 8px 32px rgba(0,0,0,.5); font-family:'Segoe UI',sans-serif;
    `;
    panel.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:14px">👥</span>
          <span style="font-size:11px;font-weight:700;color:#89b4fa">Referral Finder</span>
        </div>
        <button id="afp-close-referral" style="background:none;border:none;color:#585b70;cursor:pointer;font-size:12px">✕</button>
      </div>
      <div style="font-size:10px;color:#a6adc8;margin-bottom:8px">
        🏢 <strong>${company}</strong>
      </div>
      <div style="font-size:10px;color:#585b70;margin-bottom:8px">
        پیدا کردن افراد داخل شرکت برای referral:
      </div>
      <div style="display:flex;flex-direction:column;gap:4px">
        <a href="${urls.linkedin}" target="_blank" style="display:flex;align-items:center;gap:6px;padding:6px 8px;background:#1e1e2e;border:1px solid #313244;border-radius:6px;text-decoration:none;color:#cdd6f4;font-size:10px;transition:.15s" onmouseover="this.style.borderColor='#89b4fa'" onmouseout="this.style.borderColor='#313244'">
          🔍 LinkedIn — پیدا کردن کارمندان
        </a>
        <a href="${urls.google}" target="_blank" style="display:flex;align-items:center;gap:6px;padding:6px 8px;background:#1e1e2e;border:1px solid #313244;border-radius:6px;text-decoration:none;color:#cdd6f4;font-size:10px;transition:.15s" onmouseover="this.style.borderColor='#89b4fa'" onmouseout="this.style.borderColor='#313244'">
          🌐 Google — جستجوی افراد
        </a>
        <a href="${urls.twitter}" target="_blank" style="display:flex;align-items:center;gap:6px;padding:6px 8px;background:#1e1e2e;border:1px solid #313244;border-radius:6px;text-decoration:none;color:#cdd6f4;font-size:10px;transition:.15s" onmouseover="this.style.borderColor='#89b4fa'" onmouseout="this.style.borderColor='#313244'">
          🐦 Twitter — پیدا کردن افراد
        </a>
      </div>
      <button id="afp-gen-outreach" style="width:100%;margin-top:8px;background:linear-gradient(135deg,#89b4fa,#cba6f7);border:none;color:#1e1e2e;padding:8px;border-radius:6px;font-size:10px;font-weight:600;cursor:pointer;transition:.15s" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
        ✉️ تولید پیام referral
      </button>
      <div id="afp-outreach-msg" style="display:none;margin-top:8px;background:#1e1e2e;border:1px solid #313244;border-radius:6px;padding:8px;font-size:10px;color:#cdd6f4;line-height:1.4;max-height:120px;overflow-y:auto"></div>
    `;
    document.body.appendChild(panel);

    // Event listeners
    panel.querySelector('#afp-close-referral')?.addEventListener('click', () => panel.remove());
    panel.querySelector('#afp-gen-outreach')?.addEventListener('click', async () => {
      const btn = panel.querySelector('#afp-gen-outreach');
      const msgDiv = panel.querySelector('#afp-outreach-msg');
      btn.textContent = '⏳ در حال تولید...';
      btn.disabled = true;
      
      const profile = await getProfile();
      const jobTitle = document.title.match(/^(.+?)(?:\s+(?:at|@|–|-))/)?.[1] || 'this position';
      const msg = await generateOutreach(company, jobTitle, profile);
      
      if (msg) {
        msgDiv.textContent = msg;
        msgDiv.style.display = 'block';
        msgDiv.onclick = () => {
          navigator.clipboard.writeText(msg);
          btn.textContent = '✅ کپی شد!';
          setTimeout(() => { btn.textContent = '✉️ تولید پیام referral'; btn.disabled = false; }, 1500);
        };
      } else {
        msgDiv.textContent = '❌ خطا — API Key چک کن';
        msgDiv.style.display = 'block';
      }
      btn.textContent = '✉️ تولید پیام referral';
      btn.disabled = false;
    });
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'showReferral') {
      injectReferralPanel();
      sendResponse({ ok: true });
    }
  });
})();
