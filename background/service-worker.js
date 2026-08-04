// AutoFill Pro v9.0 — Service Worker (Backend Rebrand)
(() => {
  'use strict';

  // ═══════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════
  const CONFIG = {
    VERSION: '9.0.0',
    AI_ENDPOINT: 'https://api.opencode.ai/v1/chat/completions',
    AI_MODEL: 'mimo-2.5',
    RATE_LIMIT_MS: 3000,
    MAX_RETRY: 3,
    RETRY_DELAY_MS: 1000
  };

  // ═══════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════
  const state = {
    jobs: [],
    settings: {
      autoFillEnabled: true,
      jobSitesOnly: false,
      allowedSites: [],
      language: 'auto',
      aiModel: 'mimo'
    },
    profile: null,
    resumeData: null
  };

  // ═══════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════
  chrome.runtime.onInstalled.addListener(async (details) => {
    console.log(`🚀 AutoFill Pro v${CONFIG.VERSION} installed`);
    
    // Set default storage
    await chrome.storage.local.set({
      settings: state.settings,
      jobs: [],
      jobTracker: {
        columns: ['saved', 'applied', 'interview', 'offer', 'rejected']
      },
      profile: null,
      resumeData: null,
      version: CONFIG.VERSION
    });

    // Context menus
    chrome.contextMenus.create({
      id: 'afp-fill',
      title: '⚡ AutoFill',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'afp-hl',
      title: '🎯 Highlight Keywords',
      contexts: ['selection']
    });
    chrome.contextMenus.create({
      id: 'afp-cover',
      title: '📝 Generate Cover Letter',
      contexts: ['page']
    });

    // Badge
    chrome.action?.setBadgeText({ text: 'v9' });
    chrome.action?.setBadgeBackgroundColor({ color: '#10B981' });
  });

  // ═══════════════════════════════════════════════════
  // MESSAGE HANDLER
  // ═══════════════════════════════════════════════════
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    const { action } = msg;

    // Route to appropriate handler
    const handlers = {
      // Content script messages
      fillForms: () => forwardToTab(msg, sender, sendResponse),
      detectATS: () => forwardToTab(msg, sender, sendResponse),
      extractJD: () => forwardToTab(msg, sender, sendResponse),
      highlightKeywords: () => forwardToTab(msg, sender, sendResponse),
      removeHighlights: () => forwardToTab(msg, sender, sendResponse),
      careerChat: () => forwardToTab(msg, sender, sendResponse),
      generateCoverLetter: () => forwardToTab(msg, sender, sendResponse),

      // Storage operations
      getProfile: () => handleGetProfile(sendResponse),
      saveProfile: () => handleSaveProfile(msg, sendResponse),
      getJobs: () => handleGetJobs(sendResponse),
      saveJob: () => handleSaveJob(msg, sendResponse),
      updateJob: () => handleUpdateJob(msg, sendResponse),
      deleteJob: () => handleDeleteJob(msg, sendResponse),
      getSettings: () => handleGetSettings(sendResponse),
      saveSettings: () => handleSaveSettings(msg, sendResponse),

      // API operations
      testApiKey: () => handleTestApiKey(msg, sendResponse),
      aiParseResume: () => handleAIParseResume(msg, sendResponse),
      aiMatchFields: () => handleAIMatchFields(msg, sendResponse),
      aiGenerateCover: () => handleAIGenerateCover(msg, sendResponse),

      // Utility
      getVersion: () => sendResponse({ version: CONFIG.VERSION })
    };

    if (handlers[action]) {
      handlers[action]();
      return true; // Keep channel open for async response
    }
  });

  // ═══════════════════════════════════════════════════
  // CONTEXT MENU HANDLER
  // ═══════════════════════════════════════════════════
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    const actions = {
      'afp-fill': { action: 'fillForms' },
      'afp-hl': { action: 'highlightKeywords', text: info.selectionText },
      'afp-cover': { action: 'generateCoverLetter' }
    };

    if (actions[info.menuItemId]) {
      chrome.tabs.sendMessage(tab.id, actions[info.menuItemId]);
    }
  });

  // ═══════════════════════════════════════════════════
  // FORWARD TO CONTENT SCRIPT
  // ═══════════════════════════════════════════════════
  function forwardToTab(msg, sender, sendResponse) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, msg, (resp) => {
          sendResponse(resp || { error: 'No response' });
        });
      } else {
        sendResponse({ error: 'No active tab' });
      }
    });
  }

  // ═══════════════════════════════════════════════════
  // STORAGE HANDLERS
  // ═══════════════════════════════════════════════════
  async function handleGetProfile(sendResponse) {
    const data = await chrome.storage.local.get(['profile', 'resumeData']);
    sendResponse(data);
  }

  async function handleSaveProfile(msg, sendResponse) {
    const { profile, resumeData } = msg;
    await chrome.storage.local.set({ profile, resumeData });
    sendResponse({ success: true });
  }

  async function handleGetJobs(sendResponse) {
    const data = await chrome.storage.local.get(['jobs']);
    sendResponse(data.jobs || []);
  }

  async function handleSaveJob(msg, sendResponse) {
    const { job } = msg;
    const data = await chrome.storage.local.get(['jobs']);
    const jobs = data.jobs || [];
    jobs.push({
      ...job,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'saved'
    });
    await chrome.storage.local.set({ jobs });
    sendResponse({ success: true, jobs });
  }

  async function handleUpdateJob(msg, sendResponse) {
    const { jobId, updates } = msg;
    const data = await chrome.storage.local.get(['jobs']);
    const jobs = (data.jobs || []).map(j => 
      j.id === jobId ? { ...j, ...updates, updatedAt: new Date().toISOString() } : j
    );
    await chrome.storage.local.set({ jobs });
    sendResponse({ success: true, jobs });
  }

  async function handleDeleteJob(msg, sendResponse) {
    const { jobId } = msg;
    const data = await chrome.storage.local.get(['jobs']);
    const jobs = (data.jobs || []).filter(j => j.id !== jobId);
    await chrome.storage.local.set({ jobs });
    sendResponse({ success: true, jobs });
  }

  async function handleGetSettings(sendResponse) {
    const data = await chrome.storage.local.get(['settings']);
    sendResponse(data.settings || state.settings);
  }

  async function handleSaveSettings(msg, sendResponse) {
    const { settings } = msg;
    await chrome.storage.local.set({ settings });
    state.settings = { ...state.settings, ...settings };
    sendResponse({ success: true });
  }

  // ═══════════════════════════════════════════════════
  // AI HANDLERS
  // ═══════════════════════════════════════════════════
  let lastAiCall = 0;

  function rateLimit() {
    const now = Date.now();
    if (now - lastAiCall < CONFIG.RATE_LIMIT_MS) return false;
    lastAiCall = now;
    return true;
  }

  async function callAI(prompt, apiKey, options = {}) {
    if (!apiKey) throw new Error('No API key');
    if (!rateLimit()) throw new Error('Rate limited');

    for (let attempt = 1; attempt <= CONFIG.MAX_RETRY; attempt++) {
      try {
        const response = await fetch(CONFIG.AI_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: options.model || CONFIG.AI_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: options.temperature || 0.1,
            max_tokens: options.maxTokens || 1000
          })
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);
        
        const data = await response.json();
        return data.choices[0]?.message?.content || '';
      } catch (err) {
        if (attempt === CONFIG.MAX_RETRY) throw err;
        await new Promise(r => setTimeout(r, CONFIG.RETRY_DELAY_MS * attempt));
      }
    }
  }

  async function handleTestApiKey(msg, sendResponse) {
    try {
      const result = await callAI('Say "ok"', msg.key, { maxTokens: 5 });
      sendResponse({ valid: true });
    } catch {
      sendResponse({ valid: false });
    }
  }

  async function handleAIParseResume(msg, sendResponse) {
    try {
      const { text, apiKey } = msg;
      const prompt = `Extract structured data from this resume. Return ONLY JSON:
{
  "fullName": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "linkedin": "string",
  "github": "string",
  "website": "string",
  "summary": "string",
  "skills": "string (comma-separated)",
  "experience": "string",
  "education": "string"
}
Resume text:
---
${text.substring(0, 4000)}
---`;

      const result = await callAI(prompt, apiKey);
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        sendResponse({ success: true, data: JSON.parse(jsonMatch[0]) });
      } else {
        sendResponse({ success: false, error: 'No JSON in response' });
      }
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  }

  async function handleAIMatchFields(msg, sendResponse) {
    try {
      const { formHTML, profileData, apiKey } = msg;
      const prompt = `Map form fields to profile data. Return ONLY JSON:
{
  "field_id": "value"
}
Form HTML:
${formHTML.substring(0, 3000)}

Profile:
${JSON.stringify(profileData, null, 2)}`;

      const result = await callAI(prompt, apiKey);
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        sendResponse({ success: true, mappings: JSON.parse(jsonMatch[0]) });
      } else {
        sendResponse({ success: false, error: 'No JSON in response' });
      }
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  }

  async function handleAIGenerateCover(msg, sendResponse) {
    try {
      const { jobInfo, template, language, apiKey } = msg;
      const langPrompts = {
        en: 'Write in English',
        de: 'Schreiben Sie auf Deutsch',
        fa: 'به فارسی بنویسید'
      };
      const prompt = `Generate a ${template} cover letter for:
Position: ${jobInfo.title}
Company: ${jobInfo.company}
Skills: ${jobInfo.skills?.join(', ')}

${langPrompts[language] || langPrompts.en}

Include greeting, 2-3 paragraphs, and signoff.`;

      const result = await callAI(prompt, apiKey, { maxTokens: 800 });
      sendResponse({ success: true, letter: result });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  }

  // ═══════════════════════════════════════════════════
  // ALARMS (for periodic tasks)
  // ═══════════════════════════════════════════════════
  chrome.alarms?.create('checkJobs', { periodInMinutes: 60 });

  chrome.alarms?.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'checkJobs') {
      const data = await chrome.storage.local.get(['jobs', 'settings']);
      const jobs = data.jobs || [];
      const pending = jobs.filter(j => j.status === 'applied' && !j.followUpSent);
      
      if (pending.length > 0) {
        chrome.action?.setBadgeText({ text: `${pending.length}` });
        chrome.action?.setBadgeBackgroundColor({ color: '#F59E0B' });
      }
    }
  });

  console.log(`✅ AutoFill Pro v${CONFIG.VERSION} service worker ready`);
})();
