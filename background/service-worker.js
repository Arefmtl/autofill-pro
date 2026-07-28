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
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'afp-fill') chrome.tabs.sendMessage(tab.id, { action: 'fillForms' });
  if (info.menuItemId === 'afp-hl') chrome.tabs.sendMessage(tab.id, { action: 'highlightKeywords', keywords: [info.selectionText] });
  if (info.menuItemId === 'afp-ref') chrome.tabs.sendMessage(tab.id, { action: 'showReferral' });
});
