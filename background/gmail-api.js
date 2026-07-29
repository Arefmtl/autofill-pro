// AutoFill Pro — Google Auth + Gmail API
// Uses Chrome Identity API for OAuth2

const GoogleAuth = {
  CLIENT_ID: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
  SCOPES: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/userinfo.email'],

  // Get auth token via Chrome Identity
  async getToken() {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(token);
        }
      });
    });
  },

  // Get user info
  async getUserInfo() {
    const token = await this.getToken();
    const resp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!resp.ok) throw new Error(`getUserInfo failed: ${resp.status}`);
    return resp.json();
  },

  // Revoke token (logout)
  async revokeToken() {
    return new Promise((resolve) => {
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (token) {
          chrome.identity.removeCachedAuthToken({ token }, () => {
            fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`);
            resolve(true);
          });
        } else {
          resolve(false);
        }
      });
    });
  }
};

// Gmail API wrapper
const GmailAPI = {
  // List emails matching query
  async listEmails(query, maxResults = 20) {
    const token = await GoogleAuth.getToken();
    const url = `https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) throw new Error(`listEmails failed: ${resp.status}`);
    const data = await resp.json();
    return data.messages || [];
  },

  // Get email details
  async getMessage(msgId) {
    const token = await GoogleAuth.getToken();
    const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=metadata`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) throw new Error(`getMessage failed: ${resp.status}`);
    return resp.json();
  },

  // Get email headers
  getHeader(headers, name) {
    const h = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return h ? h.value : '';
  },

  // Build job search query
  buildJobQuery(lookbackDays = 30) {
    const since = new Date();
    since.setDate(since.getDate() - lookbackDays);
    const dateStr = since.toISOString().split('T')[0].replace(/-/g, '/');
    
    return `in:inbox newer_than:${lookbackDays}d ({from:greenhouse.io from:lever.co from:myworkdayjobs.com from:ashbyhq.com from:smartrecruiters.com from:icims.com from:bamboohr.com from:indeed.com from:glassdoor.com from:stepstone.de from:xing.com} OR {subject:(interview OR offer OR rejection OR application OR bewerbung)})`;
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.GoogleAuth = GoogleAuth;
  window.GmailAPI = GmailAPI;
}
