// AutoFill Pro v7.0 - Service Worker

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    settings: { autoFillEnabled: true, jobSitesOnly: false, allowedSites: [] },
    jobs: [],
    jobTracker: { columns: ['saved', 'applied', 'interview', 'offer', 'rejected'] }
  });
  chrome.contextMenus.create({
    id: 'autofill-pro',
    title: '⚡ AutoFill Pro - پر کردن فرم',
    contexts: ['page']
  });
  chrome.contextMenus.create({
    id: 'afp-highlight',
    title: '🎯 Highlight Keywords',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: 'afp-referral',
    title: '👥 Find Referrals',
    contexts: ['page']
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'formsDetected') {
    chrome.action.setBadgeText({ text: message.count.toString(), tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({ color: '#00d4ff', tabId: sender.tab.id });
  }
  if (message.action === 'getProfile') {
    chrome.storage.local.get(['profile', 'resumeData', 'settings'], (result) => {
      sendResponse(result);
    });
    return true;
  }
  if (message.action === 'saveProfile') {
    chrome.storage.local.set({ profile: message.data }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  // Resume Retouch AI
  if (message.action === 'retouchResume') {
    const AI_ENDPOINT = 'https://api.opencode.ai/v1/chat/completions';
    const AI_MODEL = 'mimo-2.5';
    
    chrome.storage.local.get('settings', async (r) => {
      const apiKey = r.settings?.apiKey || '';
      if (!apiKey) { sendResponse({ error: 'No API key' }); return; }
      
      const resume = message.resume || {};
      const mode = message.mode || 'analyze';
      const section = message.section || 'all';
      
      let prompt;
      if (mode === 'analyze') {
        prompt = `Analyze this resume for ATS (Applicant Tracking System) compatibility and give improvement suggestions.

RESUME:
Name: ${resume.fullName || ''}
Email: ${resume.email || ''}
Phone: ${resume.phone || ''}
Skills: ${resume.skills || ''}
Experience: ${resume.experience || ''}
Education: ${resume.education || ''}

Return JSON:
{
  "score": <number 0-100>,
  "suggestions": [
    { "type": "improve"|"add"|"remove", "text": "<suggestion>" }
  ]
}

Score criteria:
- Clear contact info (+10)
- Relevant skills keywords (+15)
- Quantified achievements (+15)
- Clean formatting (+10)
- Professional summary (+10)
- Education section (+10)
- Work experience with details (+15)
- No spelling/grammar errors (+5)
- ATS-friendly format (+10)

Give 3-5 specific, actionable suggestions.`;
      } else {
        prompt = `Improve the "${section}" section of this resume.

RESUME:
${JSON.stringify(resume, null, 2)}

Rules:
- Keep it concise and impactful
- Use action verbs (Led, Developed, Implemented, Optimized)
- Add metrics where possible
- ATS-friendly keywords
- Return ONLY the improved text, no explanations`;

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
      } catch (e) {
        sendResponse({ error: e.message });
      }
    });
    return true;
  }
  // Gmail Integration: Add job from email
  if (message.action === 'addJobFromGmail') {
    chrome.storage.local.get('jobs', (r) => {
      const jobs = r.jobs || [];
      const exists = jobs.some(j => j.company === message.job.company && j.title === message.job.title);
      if (!exists) {
        jobs.unshift(message.job);
        chrome.storage.local.set({ jobs }, () => {
          sendResponse({ success: true, count: jobs.length });
        });
      } else {
        sendResponse({ success: false, reason: 'duplicate' });
      }
    });
    return true;
  }
  // Save job to tracker
  if (message.action === 'saveJob') {
    chrome.storage.local.get('jobs', (r) => {
      const jobs = r.jobs || [];
      const idx = jobs.findIndex(j => j.id === message.job.id);
      if (idx >= 0) {
        jobs[idx] = { ...jobs[idx], ...message.job };
      } else {
        jobs.unshift(message.job);
      }
      chrome.storage.local.set({ jobs }, () => {
        sendResponse({ success: true, count: jobs.length });
      });
    });
    return true;
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'autofill-pro') {
    chrome.tabs.sendMessage(tab.id, { action: 'fillForms' });
  }
  if (info.menuItemId === 'afp-highlight') {
    chrome.tabs.sendMessage(tab.id, { action: 'highlightKeywords', keywords: [info.selectionText] });
  }
  if (info.menuItemId === 'afp-referral') {
    chrome.tabs.sendMessage(tab.id, { action: 'showReferral' });
  }
});
