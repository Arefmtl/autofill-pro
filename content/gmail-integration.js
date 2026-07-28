// AutoFill Pro — Gmail Integration Content Script
// Detects job-related emails in Gmail and extracts application info
(() => {
  'use strict';

  // Gmail selectors
  const GMAIL_SELECTORS = {
    // Email list view
    emailRow: 'tr.zA',
    emailSubject: '.bog',
    emailSender: '.yX.xY .yW',
    emailDate: '.xW.xY',
    // Email detail view
    emailBody: '.a3s.aiL',
    emailFrom: '.go',
    emailSubjectDetail: '.hP',
  };

  // Job-related keywords
  const JOB_KEYWORDS = [
    'application', 'application received', 'application confirmation',
    'thank you for applying', 'your application', 'job application',
    'interview', 'interview invitation', 'interview scheduled',
    'screening', 'phone screen', 'next steps',
    'offer', 'job offer', 'offer letter',
    'rejection', 'regret to inform', 'not selected',
    'follow up', 'following up', 'status update',
    'referral', 'referred by',
    'assessment', 'test', 'coding challenge',
    'onsite', 'on-site', 'final round',
    // German
    'bewerbung', 'bestätigung', 'vorstellungsgespräch',
    'absage', 'zusage', 'einladung',
    // Persian
    'درخواست', 'تایید', 'مصاحبه', 'قبول', 'رد',
  ];

  // Company detection patterns
  const COMPANY_PATTERNS = [
    /from:\s*(.+)/i,
    /@(?:careers?|jobs?|hr|recruiting|hiring)\.(.+\.\w+)/i,
    /(?:at|@)\s+([A-Z][a-zA-Z\s&]+)/,
    /(?:company|employer):\s*(.+)/i,
  ];

  function isGmail() {
    return window.location.hostname === 'mail.google.com';
  }

  function isJobEmail(subject, body) {
    const text = (subject + ' ' + body).toLowerCase();
    return JOB_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
  }

  function extractCompany(text) {
    for (const pattern of COMPANY_PATTERNS) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const company = match[1].trim();
        if (company.length > 2 && company.length < 50) return company;
      }
    }
    return null;
  }

  function extractJobInfo(subject, body) {
    const text = subject + '\n' + body;
    
    let status = 'unknown';
    const lower = text.toLowerCase();
    if (lower.includes('thank you for applying') || lower.includes('application received') || lower.includes('application confirmation') || lower.includes('bewerbung')) {
      status = 'applied';
    } else if (lower.includes('interview') || lower.includes('vorstellungsgespräch') || lower.includes('screening') || lower.includes('next steps')) {
      status = 'interview';
    } else if (lower.includes('offer') || lower.includes('zusage') || lower.includes('offer letter')) {
      status = 'offer';
    } else if (lower.includes('rejection') || lower.includes('regret') || lower.includes('not selected') || lower.includes('absage')) {
      status = 'rejected';
    } else if (lower.includes('assessment') || lower.includes('test') || lower.includes('coding challenge')) {
      status = 'assessment';
    }

    const company = extractCompany(text);
    
    // Extract job title if mentioned
    let title = '';
    const titleMatch = text.match(/(?:position|role|job):\s*(.+)/i) || text.match(/(?:for the)\s+(.+?)\s+(?:position|role)/i);
    if (titleMatch) title = titleMatch[1].trim().substring(0, 100);

    return { status, company, title };
  }

  // Inject job badge on Gmail
  function injectJobBadge() {
    // Only in email detail view
    const subjectEl = document.querySelector(GMAIL_SELECTORS.emailSubjectDetail);
    const bodyEl = document.querySelector(GMAIL_SELECTORS.emailBody);
    if (!subjectEl || !bodyEl) return;

    const subject = subjectEl.textContent || '';
    const body = bodyEl.textContent || '';
    
    if (!isJobEmail(subject, body)) return;
    if (document.querySelector('.afp-gmail-badge')) return; // Already injected

    const info = extractJobInfo(subject, body);
    const statusColors = {
      applied: '#22c55e', interview: '#f59e0b', offer: '#10b981',
      rejected: '#ef4444', assessment: '#8b5cf6', unknown: '#6b7280'
    };
    const statusLabels = {
      applied: '📤 Applied', interview: '🎤 Interview', offer: '🎉 Offer',
      rejected: '❌ Rejected', assessment: '📝 Assessment', unknown: '📧 Job Email'
    };

    const badge = document.createElement('div');
    badge.className = 'afp-gmail-badge';
    badge.style.cssText = `
      position:fixed; top:60px; right:20px; z-index:99999;
      background:#0f172a; border:1px solid ${statusColors[info.status]};
      border-radius:12px; padding:12px 16px; min-width:220px;
      box-shadow:0 8px 32px rgba(0,0,0,.5); font-family:'Segoe UI',sans-serif;
    `;
    badge.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="font-size:16px">⚡</span>
        <span style="font-size:12px;font-weight:700;color:#89b4fa">AutoFill Pro</span>
      </div>
      <div style="font-size:11px;color:${statusColors[info.status]};margin-bottom:6px">
        ${statusLabels[info.status]}
      </div>
      ${info.company ? `<div style="font-size:10px;color:#a6adc8;margin-bottom:4px">🏢 ${info.company}</div>` : ''}
      ${info.title ? `<div style="font-size:10px;color:#a6adc8;margin-bottom:4px">💼 ${info.title}</div>` : ''}
      <div style="display:flex;gap:4px;margin-top:8px">
        <button id="afp-track-btn" style="flex:1;background:#89b4fa;border:none;color:#1e1e2e;padding:6px;border-radius:6px;font-size:10px;font-weight:600;cursor:pointer">
          📊 Add to Tracker
        </button>
        <button id="afp-close-badge" style="background:#313244;border:none;color:#a6adc8;padding:6px 8px;border-radius:6px;font-size:10px;cursor:pointer">
          ✕
        </button>
      </div>
    `;
    document.body.appendChild(badge);

    // Event listeners
    badge.querySelector('#afp-close-badge')?.addEventListener('click', () => badge.remove());
    badge.querySelector('#afp-track-btn')?.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.runtime.sendMessage({
        action: 'addJobFromGmail',
        job: {
          company: info.company || 'Unknown',
          title: info.title || subject.substring(0, 100),
          url: window.location.href,
          status: info.status === 'unknown' ? 'applied' : info.status,
          notes: `Detected from Gmail: ${subject}`,
          date: new Date().toISOString()
        }
      });
      badge.innerHTML = '<div style="text-align:center;color:#22c55e;font-size:11px">✅ Added to Tracker!</div>';
      setTimeout(() => badge.remove(), 1500);
    });
  }

  // Observer for Gmail SPA navigation
  if (isGmail()) {
    let lastUrl = '';
    const observer = new MutationObserver(() => {
      const url = window.location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        setTimeout(injectJobBadge, 1500); // Wait for Gmail to render
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Also check on initial load
    setTimeout(injectJobBadge, 3000);
  }
})();
