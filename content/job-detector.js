// AutoFill Pro — Job Detector
// Auto-detects job pages and extracts job description
(() => {
  'use strict';
  if (window.__afp_detector) return;
  window.__afp_detector = true;

  // ==================== ATS DOMAINS ====================
  const ATS_DOMAINS = {
    greenhouse: { domain: ['greenhouse.io', 'grnh.se'], selectors: { title: '.app-title', company: '.company-name', location: '.location', description: '.content, .section-wrapper' } },
    lever: { domain: ['lever.co'], selectors: { title: '.posting-headline h2', company: '.posting-headline .company-name', location: '.posting-headline .location', description: '.posting-page .content' } },
    workday: { domain: ['myworkdayjobs.com', 'workday.com'], selectors: { title: '[data-automation-id="jobPostingTitle"]', company: '[data-automation-id="companyName"]', location: '[data-automation-id="locations"]', description: '[data-automation-id="jobPostingDescription"]' } },
    ashby: { domain: ['ashbyhq.com', 'jobs.ashbyhq.com'], selectors: { title: 'h1.posting-headline', company: '.posting-headline .company-name', location: '.posting-headline .location', description: '.posting-page .content' } },
    linkedin: { domain: ['linkedin.com'], selectors: { title: '.job-details-jobs-unified-top-card__job-title', company: '.job-details-jobs-unified-top-card__company-name', location: '.job-details-jobs-unified-top-card__bullet', description: '.jobs-description__content' } },
    smartrecruiters: { domain: ['smartrecruiters.com'], selectors: { title: '.job-title', company: '.company-name', location: '.job-location', description: '.job-sections' } },
    bamboohr: { domain: ['bamboohr.com'], selectors: { title: '.BambooHR-ATS-board__JobDetailHeader h1', company: '.BambooHR-ATS-board__JobDetailHeader h2', location: '.BambooHR-ATS-board__JobDetailLocation', description: '.BambooHR-ATS-board__JobDetailJobDescription' } },
    icims: { domain: ['icims.com'], selectors: { title: '.iCIMS_JobsTable .header h1', company: '.iCIMS_JobInfo .company', location: '.iCIMS_JobInfo .location', description: '.iCIMS_JobInfo .description' } },
    taleo: { domain: ['taleo.net', 'oracle.com/taleo'], selectors: { title: '.jobTitle', company: '.companyName', location: '.jobLocation', description: '.jobDescription' } },
    workable: { domain: ['workable.com'], selectors: { title: '.job-title', company: '.company-name', location: '.job-location', description: '.job-description' } },
    indeed: { domain: ['indeed.com'], selectors: { title: '.jobsearch-JobInfoHeader-title', company: '.jobsearch-InlineCompanyRating', location: '.jobsearch-JobInfoHeader-subtitle', description: '#jobDescriptionText' } },
    glassdoor: { domain: ['glassdoor.com'], selectors: { title: '.JobDetails_jobTitle__GLyJ1', company: '.JobDetails_employerName__LSu2q', location: '.JobDetails_location__rCz3x', description: '.JobDetails_description__2Vdx_' } },
    stepstone: { domain: ['stepstone.de', 'stepstone.at', 'stepstone.be'], selectors: { title: '[data-testid="job-title"]', company: '[data-testid="company-name"]', location: '[data-testid="job-location"]', description: '[data-testid="job-description"]' } },
    xing: { domain: ['xing.com'], selectors: { title: '.job-title', company: '.company-name', location: '.job-location', description: '.job-description' } },
    monster: { domain: ['monster.de', 'monster.com'], selectors: { title: '.job-title', company: '.company-name', location: '.job-location', description: '.job-description' } },
    arbeitsagentur: { domain: ['arbeitsagentur.de'], selectors: { title: '.angebotstitel', company: '.unternehmensname', location: '.arbeitsort', description: '.angebotsbeschreibung' } },
    personio: { domain: ['personio.de', 'personio.com'], selectors: { title: '.position-headline', company: '.company-name', location: '.job-location', description: '.job-description' } },
    recruitee: { domain: ['recruitee.com'], selectors: { title: '.job-title', company: '.company-name', location: '.job-location', description: '.job-description' } },
    teamtailor: { domain: ['teamtailor.com'], selectors: { title: '.job-listing__title', company: '.job-listing__company', location: '.job-listing__location', description: '.job-listing__description' } },
    jobvite: { domain: ['jobvite.com'], selectors: { title: '.jv-job-title', company: '.jv-company-name', location: '.jv-job-location', description: '.jv-job-description' } },
    successfactors: { domain: ['successfactors.com', 'sf-cf.com'], selectors: { title: '.jobTitle', company: '.companyName', location: '.jobLocation', description: '.jobDescription' } }
  };

  // Generic fallback selectors
  const GENERIC_SELECTORS = {
    title: 'h1, [class*="title"], [class*="job-title"], [class*="position"]',
    company: '[class*="company"], [class*="employer"], [class*="organization"]',
    location: '[class*="location"], [class*="city"], [class*="address"]',
    description: '[class*="description"], [class*="content"], [class*="details"], article, main'
  };

  // Job-related keywords
  const JOB_KEYWORDS = [
    'requirements', 'qualifications', 'responsibilities', 'about the role',
    'what you.ll do', 'we.re looking for', 'join our team', 'apply now',
    'uber uns', 'anforderungen', 'stellenbeschreibung', 'aufgaben',
    'was wir bieten', 'was du mitbringst', 'bewerben'
  ];

  // ==================== DETECT ATS ====================
  function detectATS() {
    const hostname = window.location.hostname.toLowerCase();
    for (const [name, cfg] of Object.entries(ATS_DOMAINS)) {
      if (cfg.domain.some(d => hostname.includes(d))) {
        return { id: name, ...cfg };
      }
    }
    return null;
  }

  // ==================== EXTRACT JOB DATA ====================
  function extractJobData(ats) {
    const selectors = ats?.selectors || GENERIC_SELECTORS;
    
    const title = extractField(selectors.title);
    const company = extractField(selectors.company);
    const location = extractField(selectors.location);
    const description = extractField(selectors.description);
    
    return {
      title: title || document.title.split(' - ')[0].split(' | ')[0].trim(),
      company: company || guessCompany(),
      location: location || 'Not specified',
      description: description || extractFullText(),
      url: window.location.href,
      detectedAt: new Date().toISOString(),
      ats: ats?.id || 'unknown'
    };
  }

  function extractField(selector) {
    try {
      const el = document.querySelector(selector);
      return el?.textContent?.trim() || null;
    } catch {
      return null;
    }
  }

  function extractFullText() {
    const main = document.querySelector('main, article, .content, #content, .job-description, [class*="description"]');
    if (main) return main.textContent.trim().substring(0, 5000);
    return document.body.innerText.substring(0, 5000);
  }

  function guessCompany() {
    const meta = document.querySelector('meta[property="og:site_name"]');
    if (meta) return meta.content;
    return window.location.hostname.split('.').slice(-2, -1)[0] || 'Unknown';
  }

  // ==================== EXTRACT KEYWORDS ====================
  function extractKeywords(text) {
    if (!text) return { skills: [], experience: [], education: [], soft: [] };
    
    const lower = text.toLowerCase();
    
    // Skills
    const skills = [];
    const skillPatterns = [
      /\b(python|javascript|typescript|java|c\+\+|sql|r|scala|go|rust|ruby|php)\b/gi,
      /\b(machine learning|deep learning|data science|nlp|natural language processing|computer vision)\b/gi,
      /\b(react|angular|vue|node\.?js|express|django|flask|fastapi|spring|\.net)\b/gi,
      /\b(aws|azure|gcp|docker|kubernetes|terraform|jenkins|git|linux)\b/gi,
      /\b(tableau|power\s?bi|spark|hadoop|kafka|airflow|dbt)\b/gi,
      /\b(excel|sql|nosql|mongodb|postgresql|mysql|redis|elasticsearch)\b/gi
    ];
    skillPatterns.forEach(p => {
      const matches = text.match(p);
      if (matches) skills.push(...matches.map(m => m.toLowerCase()));
    });

    // Experience
    const expMatch = text.match(/(\d+)[\s+]?(years?|jahre|jahre?)\s+(experience|erfahrung|of experience)/gi);
    const experience = expMatch ? [expMatch[0]] : [];

    // Education
    const eduKeywords = ['bachelor', 'master', 'phd', 'degree', 'university', 'universität', 'studium', 'abschluss'];
    const education = eduKeywords.filter(k => lower.includes(k));

    // Soft skills
    const softKeywords = ['communication', 'teamwork', 'leadership', 'problem solving', 'analytical', 'kommunikation', 'teamfähigkeit', 'führung'];
    const soft = softKeywords.filter(k => lower.includes(k));

    return { skills: [...new Set(skills)], experience, education, soft };
  }

  // ==================== CALCULATE MATCH SCORE ====================
  function calculateMatchScore(jobData, resumeData) {
    if (!resumeData || !jobData.description) return { score: 0, matched: [], missing: [] };
    
    const jobKeywords = extractKeywords(jobData.description);
    const resumeText = [
      resumeData.skills || '',
      resumeData.experience || '',
      resumeData.education || '',
      resumeData.summary || ''
    ].join(' ').toLowerCase();

    const matched = [];
    const missing = [];

    // Check skills
    jobKeywords.skills.forEach(skill => {
      if (resumeText.includes(skill.toLowerCase())) {
        matched.push(skill);
      } else {
        missing.push(skill);
      }
    });

    // Check experience
    jobKeywords.experience.forEach(exp => {
      const years = parseInt(exp);
      const resumeYears = parseInt(resumeText.match(/(\d+)\s*years/i)?.[1] || '0');
      if (resumeYears >= years) {
        matched.push(exp);
      } else {
        missing.push(exp);
      }
    });

    // Check education
    jobKeywords.education.forEach(edu => {
      if (resumeText.includes(edu.toLowerCase())) {
        matched.push(edu);
      } else {
        missing.push(edu);
      }
    });

    // Calculate score
    const total = matched.length + missing.length;
    const score = total > 0 ? Math.round((matched.length / total) * 100) : 50;

    return { score, matched, missing, jobKeywords };
  }

  // ==================== SHOW JOB WIDGET ====================
  function showJobWidget(jobData, matchResult) {
    // Remove existing widget
    const existing = document.getElementById('afp-job-widget');
    if (existing) existing.remove();

    const widget = document.createElement('div');
    widget.id = 'afp-job-widget';
    widget.innerHTML = `
      <style>
        #afp-job-widget{
          position:fixed;top:80px;right:20px;width:360px;
          background:#0b0b1a;color:#cdd6f4;border:1px solid #313244;
          border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.4);
          z-index:2147483646;font-family:'Inter','Segoe UI',sans-serif;
          font-size:12px;overflow:hidden;
          animation:afpSlideIn .3s cubic-bezier(.2,0,0,1);
        }
        @keyframes afpSlideIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        #afp-job-widget .wj-h{padding:12px 14px;border-bottom:1px solid #313244;display:flex;align-items:center;gap:8px}
        #afp-job-widget .wj-h h3{flex:1;font-size:13px;color:#89b4fa;font-weight:600}
        #afp-job-widget .wj-h button{background:none;border:none;color:#585b70;cursor:pointer;font-size:16px;padding:4px;border-radius:6px}
        #afp-job-widget .wj-h button:hover{color:#cdd6f4;background:rgba(137,180,250,.1)}
        #afp-job-widget .wj-b{padding:12px 14px}
        #afp-job-widget .wj-row{display:flex;justify-content:space-between;margin-bottom:8px}
        #afp-job-widget .wj-label{color:#585b70;font-size:10px}
        #afp-job-widget .wj-val{color:#cdd6f4;font-size:11px;font-weight:500}
        #afp-job-widget .wj-score{display:flex;align-items:center;gap:12px;margin:12px 0;padding:10px;background:#181825;border-radius:8px}
        #afp-job-widget .wj-ring{width:48px;height:48px;border-radius:50%;border:3px solid;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;font-variant-numeric:tabular-nums}
        #afp-job-widget .wj-ring.hi{border-color:#a6e3a1;color:#a6e3a1}
        #afp-job-widget .wj-ring.md{border-color:#f9e2af;color:#f9e2af}
        #afp-job-widget .wj-ring.lo{border-color:#f38ba8;color:#f38ba8}
        #afp-job-widget .wj-kw{display:flex;flex-wrap:wrap;gap:4px;margin:8px 0}
        #afp-job-widget .wj-kw span{padding:2px 6px;border-radius:4px;font-size:9px}
        #afp-job-widget .wj-kw .matched{background:rgba(166,227,161,.15);color:#a6e3a1}
        #afp-job-widget .wj-kw .missing{background:rgba(243,139,168,.15);color:#f38ba8}
        #afp-job-widget .wj-acts{display:flex;gap:6px;margin-top:12px}
        #afp-job-widget .wj-btn{flex:1;padding:8px;border:none;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;transition:transform .1s,opacity .15s}
        #afp-job-widget .wj-btn:active{transform:scale(.96)}
        #afp-job-widget .wj-primary{background:linear-gradient(135deg,#89b4fa,#cba6f7);color:#1e1e2e}
        #afp-job-widget .wj-secondary{background:#313244;color:#a6adc8}
      </style>
      <div class="wj-h">
        <span style="font-size:16px">⚡</span>
        <h3>Job Detected</h3>
        <button id="wj-close">✕</button>
      </div>
      <div class="wj-b">
        <div class="wj-row"><span class="wj-label">Company</span><span class="wj-val">${jobData.company}</span></div>
        <div class="wj-row"><span class="wj-label">Position</span><span class="wj-val">${jobData.title}</span></div>
        <div class="wj-row"><span class="wj-label">Location</span><span class="wj-val">${jobData.location}</span></div>
        <div class="wj-row"><span class="wj-label">ATS</span><span class="wj-val">${jobData.ats}</span></div>
        
        <div class="wj-score">
          <div class="wj-ring ${matchResult.score >= 70 ? 'hi' : matchResult.score >= 40 ? 'md' : 'lo'}">${matchResult.score}</div>
          <div>
            <div style="font-size:12px;font-weight:600">Match Score</div>
            <div style="font-size:10px;color:#585b70">${matchResult.matched.length} matched, ${matchResult.missing.length} missing</div>
          </div>
        </div>

        ${matchResult.matched.length > 0 ? `
          <div style="font-size:10px;color:#a6e3a1;margin-bottom:4px">✅ Matched:</div>
          <div class="wj-kw">${matchResult.matched.map(k => `<span class="matched">${k}</span>`).join('')}</div>
        ` : ''}

        ${matchResult.missing.length > 0 ? `
          <div style="font-size:10px;color:#f38ba8;margin-bottom:4px">❌ Missing:</div>
          <div class="wj-kw">${matchResult.missing.map(k => `<span class="missing">${k}</span>`).join('')}</div>
        ` : ''}

        <div class="wj-acts">
          <button class="wj-btn wj-primary" id="wj-fill">🚀 Auto-fill</button>
          <button class="wj-btn wj-secondary" id="wj-save">💾 Save</button>
          <button class="wj-btn wj-secondary" id="wj-chat">💬</button>
        </div>
      </div>
    `;

    document.body.appendChild(widget);

    // Event listeners
    document.getElementById('wj-close')?.addEventListener('click', () => widget.remove());
    document.getElementById('wj-fill')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'autofill', jobData });
    });
    document.getElementById('wj-save')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'saveJob', jobData, matchResult });
    });
    document.getElementById('wj-chat')?.addEventListener('click', () => {
      // Open sidebar chat tab
      const sidebar = document.getElementById('afp-sidebar');
      if (sidebar) {
        sidebar.classList.add('open');
        document.getElementById('afp-toggle')?.classList.add('shifted');
      }
    });
  }

  // ==================== MAIN DETECTION ====================
  function detectAndShow() {
    const ats = detectATS();
    const isJobPage = ats || JOB_KEYWORDS.some(k => document.body.innerText.toLowerCase().includes(k));
    
    if (!isJobPage) return;

    const jobData = extractJobData(ats);
    
    // Get resume data for match score
    chrome.storage.local.get(['resumeData', 'profile'], (r) => {
      const resumeData = r.resumeData || r.profile || {};
      const matchResult = calculateMatchScore(jobData, resumeData);
      showJobWidget(jobData, matchResult);
    });
  }

  // ==================== MESSAGE HANDLER ====================
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'detectJob') {
      const ats = detectATS();
      const jobData = extractJobData(ats);
      sendResponse({ jobData, isJob: true });
    }
    if (msg.action === 'scanPage') {
      detectAndShow();
      sendResponse({ ok: true });
    }
  });

  // ==================== AUTO-DETECT ON LOAD ====================
  // Wait for page to load, then detect
  if (document.readyState === 'complete') {
    setTimeout(detectAndShow, 1000);
  } else {
    window.addEventListener('load', () => setTimeout(detectAndShow, 1000));
  }

  // Also detect on URL change (SPA navigation)
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(detectAndShow, 1500);
    }
  }).observe(document.body, { childList: true, subtree: true });

})();
