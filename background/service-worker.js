// AutoFill Pro - Service Worker (Background Script)

// Listen for extension install
chrome.runtime.onInstalled.addListener(() => {
  console.log('AutoFill Pro installed!');

  // Set default settings
  chrome.storage.local.set({
    settings: {
      autoFillEnabled: true,
      jobSitesOnly: false,
      allowedSites: [],
      apiKey: ''
    }
  });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'formsDetected') {
    // Update badge
    chrome.action.setBadgeText({
      text: message.count.toString(),
      tabId: sender.tab.id
    });
    chrome.action.setBadgeBackgroundColor({
      color: '#00d4ff',
      tabId: sender.tab.id
    });
  }

  if (message.action === 'getProfile') {
    chrome.storage.local.get(['profile', 'resumeData', 'settings'], (result) => {
      sendResponse(result);
    });
    return true; // Keep message channel open
  }

  if (message.action === 'saveProfile') {
    chrome.storage.local.set({ profile: message.data }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Context menu for quick fill
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'autofill-pro',
    title: '⚡ AutoFill Pro - پر کردن فرم',
    contexts: ['page']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'autofill-pro') {
    chrome.tabs.sendMessage(tab.id, { action: 'fillForms' });
  }
});

console.log('AutoFill Pro: Service worker loaded ✅');
