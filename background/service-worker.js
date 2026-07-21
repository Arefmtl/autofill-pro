// AutoFill Pro v1.6 - Service Worker

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    settings: { autoFillEnabled: true, jobSitesOnly: false, allowedSites: [] }
  });
  chrome.contextMenus.create({
    id: 'autofill-pro',
    title: '⚡ AutoFill Pro - پر کردن فرم',
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
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'autofill-pro') {
    chrome.tabs.sendMessage(tab.id, { action: 'fillForms' });
  }
});