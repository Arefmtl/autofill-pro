// AutoFill Pro v7.1 — Service Worker (handles sidebar + content scripts)

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    settings: { autoFillEnabled: true, jobSitesOnly: false, allowedSites: [] },
    jobs: [],
    jobTracker: { columns: ['saved', 'applied', 'interview', 'offer', 'rejected'] }
  });
  chrome.contextMenus.create({ id: 'afp-fill', title: '⚡ AutoFill', contexts: ['page'] });
  chrome.contextMenus.create({ id: 'afp-hl', title: '🎯 Highlight', contexts: ['selection'] });
  chrome.contextMenus.create({ id: 'afp-ref', title: '👥 Referral', contexts: ['page'] });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Forward to active tab's content script
  if (['fillForms', 'detectATS', 'extractJD', 'highlightKeywords', 'removeHighlights',
       'careerChat', 'showReferral', 'injectGmailBadge'].includes(msg.action)) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, msg, resp => {
          sendResponse(resp || {});
        });
      } else {
        sendResponse({ error: 'No active tab' });
      }
    });
    return true;
  }

  // Test API key
  if (msg.action === 'testApiKey') {
    fetch('https://api.opencode.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${msg.key}`
      },
      body: JSON.stringify({
        model: 'mimo-2.5',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5
      })
    }).then(r => sendResponse({ valid: r.ok }))
      .catch(() => sendResponse({ valid: false }));
    return true;
  }

  // Storage operations (from sidebar)
  if (msg.action === 'getProfile') {
    chrome.storage.local.get(['profile', 'resumeData', 'settings'], r => sendResponse(r));
    return true;
  }
  if (msg.action === 'saveProfile') {
    chrome.storage.local.set({ profile: msg.data }, () => sendResponse({ success: true }));
    return true;
  }
  if (msg.action === 'saveJob') {
    chrome.storage.local.get('jobs', r => {
      const jobs = r.jobs || [];
      const idx = jobs.findIndex(j => j.id === msg.job.id);
      if (idx >= 0) jobs[idx] = { ...jobs[idx], ...msg.job };
      else jobs.unshift(msg.job);
      chrome.storage.local.set({ jobs }, () => sendResponse({ success: true, count: jobs.length }));
    });
    return true;
  }
  if (msg.action === 'addJobFromGmail') {
    chrome.storage.local.get('jobs', r => {
      const jobs = r.jobs || [];
      const exists = jobs.some(j => j.company === msg.job.company && j.title === msg.job.title);
      if (!exists) {
        jobs.unshift(msg.job);
        chrome.storage.local.set({ jobs }, () => sendResponse({ success: true }));
      } else {
        sendResponse({ success: false, reason: 'duplicate' });
      }
    });
    return true;
  }
  if (msg.action === 'retouchResume') {
    const AI_ENDPOINT = 'https://api.opencode.ai/v1/chat/completions';
    const AI_MODEL = 'mimo-2.5';
    chrome.storage.local.get('settings', async (r) => {
      const apiKey = r.settings?.apiKey || '';
      if (!apiKey) { sendResponse({ error: 'No API key' }); return; }
      const resume = msg.resume || {};
      const mode = msg.mode || 'analyze';
      const section = msg.section || 'all';
      let prompt;
      if (mode === 'analyze') {
        prompt = `Analyze this resume for ATS compatibility. Return JSON: {"score":0-100,"suggestions":[{"type":"improve"|"add"|"remove","text":"suggestion"}]}\n\nResume:\n${JSON.stringify(resume)}`;
      } else {
        prompt = `Improve the "${section}" section of this resume. Return ONLY improved text.\n\n${JSON.stringify(resume)}`;
      }
      try {
        const resp = await fetch(AI_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ model: AI_MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0.5, max_tokens: mode === 'analyze' ? 1000 : 800 })
        });
        if (!resp.ok) { sendResponse({ error: 'API error' }); return; }
        const d = await resp.json();
        const content = d.choices[0]?.message?.content || '';
        if (mode === 'analyze') {
          try {
            const json = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || '{}');
            sendResponse(json);
          } catch {
            sendResponse({ score: 0, suggestions: [{ type: 'improve', text: content }] });
          }
        } else {
          sendResponse({ improved: content });
        }
      } catch (e) { sendResponse({ error: e.message }); }
    });
    return true;
  }

  // Gmail Auth
  if (msg.action === 'gmailLogin') {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        chrome.storage.local.set({ gmailToken: token });
        sendResponse({ success: true, token });
      }
    });
    return true;
  }
  if (msg.action === 'gmailLogout') {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (token) {
        chrome.identity.removeCachedAuthToken({ token }, () => {
          fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`);
          chrome.storage.local.remove('gmailToken');
          sendResponse({ success: true });
        });
      } else {
        sendResponse({ success: true });
      }
    });
    return true;
  }
  if (msg.action === 'gmailStatus') {
    chrome.storage.local.get('gmailToken', (r) => {
      sendResponse({ loggedIn: !!r.gmailToken });
    });
    return true;
  }
  if (msg.action === 'gmailUserInfo') {
    chrome.storage.local.get('gmailToken', async (r) => {
      const token = r.gmailToken;
      if (!token) { sendResponse({ error: 'Not logged in' }); return; }
      try {
        const resp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!resp.ok) { sendResponse({ error: 'Failed to get user info' }); return; }
        const data = await resp.json();
        sendResponse({ email: data.email, name: data.name });
      } catch (e) { sendResponse({ error: e.message }); }
    });
    return true;
  }

  // Gmail Sync — scan inbox for job emails
  if (msg.action === 'gmailSync') {
    chrome.storage.local.get('gmailToken', async (r) => {
      const token = r.gmailToken;
      if (!token) { sendResponse({ error: 'Not logged in' }); return; }
      try {
        const lookback = msg.days || 30;
        const query = `in:inbox newer_than:${lookback}d ({from:greenhouse.io from:lever.co from:myworkdayjobs.com from:ashbyhq.com from:smartrecruiters.com from:icims.com from:bamboohr.com from:indeed.com from:glassdoor.com from:stepstone.de from:xing.com} OR {subject:(interview OR offer OR rejection OR application OR bewerbung OR absage)})`;
        const listResp = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!listResp.ok) { sendResponse({ error: `Gmail API ${listResp.status}` }); return; }
        const listData = await listResp.json();
        const messages = listData.messages || [];
        const results = [];
        for (const msg of messages.slice(0, 20)) {
          try {
            const detResp = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (!detResp.ok) continue;
            const det = await detResp.json();
            const hdrs = det.payload?.headers || [];
            const get = (n) => hdrs.find(h => h.name.toLowerCase() === n.toLowerCase())?.value || '';
            const subject = get('Subject');
            const from = get('From');
            const date = get('Date');
            const body = det.snippet || '';
            const text = `${subject} ${body}`.toLowerCase();
            let status = 'unknown';
            if (/interview|vorstellungsgespräch|gespräch/i.test(text)) status = 'interview';
            else if (/rejection|unfortunately|abgelehnt|leider|nicht ausgewählt/i.test(text)) status = 'rejection';
            else if (/offer|congratulations|angebot|herzlichen|willkommen/i.test(text)) status = 'offer';
            else if (/assessment|test assignment|coding challenge|aufgabe/i.test(text)) status = 'assessment';
            else if (/application received|thank you|bewerbung erhalten|vielen dank/i.test(text)) status = 'application';
            const fromDomain = (from.match(/@([^.]+)/) || [])[1] || '';
            results.push({ id: msg.id, subject, from, date, snippet: body.substring(0, 200), status, fromDomain });
          } catch (e) { /* skip failed messages */ }
        }
        // Group by status
        const grouped = { interview: [], rejection: [], offer: [], assessment: [], application: [], unknown: [] };
        results.forEach(r => { (grouped[r.status] || grouped.unknown).push(r); });
        sendResponse({ success: true, total: results.length, grouped, results });
      } catch (e) { sendResponse({ error: e.message }); }
    });
    return true;
  }

  // Job detection routing (from sidebar)
  if (msg.action === 'detectJob' || msg.action === 'scanPage') {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, msg, resp => {
          sendResponse(resp || {});
        });
      } else {
        sendResponse({ error: 'No active tab' });
      }
    });
    return true;
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'afp-fill') chrome.tabs.sendMessage(tab.id, { action: 'fillForms' });
  if (info.menuItemId === 'afp-hl') chrome.tabs.sendMessage(tab.id, { action: 'highlightKeywords', keywords: [info.selectionText] });
  if (info.menuItemId === 'afp-ref') chrome.tabs.sendMessage(tab.id, { action: 'showReferral' });
});
