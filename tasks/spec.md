# Spec: AutoFill Pro v8.0 — Smart Job Application Assistant

## Objective

AutoFill Pro v8.0 transforms from a simple autofill tool into an **intelligent job application assistant** that:
- Auto-detects job pages and reads job descriptions
- Calculates match score against your resume
- Reads Gmail and categorizes job-related emails
- Tracks application status automatically
- Works silently in the background on job sites

**Target user:** Job seekers in Germany/Europe (multilingual DE/EN/FA)
**Success:** User visits a job site → extension auto-detects → shows match score → one-click apply → tracks status

## Tech Stack

- Chrome Extension Manifest V3
- Content Scripts (DOM injection)
- Service Worker (background)
- Chrome Storage API (local + sync)
- Chrome Identity API (Google OAuth)
- Gmail API (readonly)
- AI API (OpenAI-compatible endpoint)

## Commands

```bash
# Build
cd ~/autofill-pro && bash build-crx.sh 7.1.1

# Test
node tests/test-core.js && node tests/test-features.js && node tests/test-api.js

# Syntax check
node --check content/sidebar.js && node --check background/service-worker.js
```

## Project Structure

```
autofill-pro/
├── manifest.json           # MV3 manifest with permissions
├── background/
│   ├── service-worker.js   # Message routing + Gmail sync
│   └── ai.js               # AI API calls
├── content/
│   ├── sidebar.js          # Main sidebar UI (injected)
│   ├── content.js          # Job detection + autofill
│   ├── gmail-integration.js # Gmail email detection
│   └── referral-finder.js  # LinkedIn referral finder
├── popup/
│   ├── popup.html          # Extension popup (simple)
│   ├── popup.js            # Popup logic
│   └── popup.css           # Popup styles
├── lib/
│   ├── pdf.min.mjs         # PDF.js
│   ├── pdf.worker.min.mjs  # PDF.js worker
│   └── jszip.min.js        # JSZip
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── tests/
│   ├── test-core.js        # 36 tests
│   ├── test-features.js    # 22 tests
│   └── test-api.js         # 17 tests
├── docs/
│   ├── index.html          # Install page
│   ├── updates.xml         # Auto-update manifest
│   └── autofill-pro.zip    # Extension package
└── build-crx.sh            # Build script
```

## Code Style

```javascript
// Service Worker: message routing
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'detectJob') {
    // Route to content script
    chrome.tabs.sendMessage(sender.tab.id, { action: 'scanPage' });
    sendResponse({ ok: true });
  }
  return true; // Keep message channel open for async
});

// Content Script: job detection
function detectJobPage() {
  const url = window.location.href;
  const hostname = window.location.hostname;
  const body = document.body.innerText;
  
  // Check if this is a job page
  const isJobPage = ATS_DOMAINS.some(d => hostname.includes(d)) ||
    JOB_KEYWORDS.some(k => body.toLowerCase().includes(k));
  
  if (isJobPage) {
    const jd = extractJobDescription();
    const score = calculateMatchScore(jd, resumeData);
    showJobWidget(jd, score);
  }
}
```

## Testing Strategy

- **Framework:** Node.js assert (no dependencies)
- **Location:** `tests/` directory
- **Coverage:** 75 tests (36 core + 22 features + 17 API)
- **Run:** `node tests/test-core.js && node tests/test-features.js && node tests/test-api.js`
- **CI:** GitHub Actions on push/tag

## Boundaries

- **Always:** Run tests before commits, validate syntax before push, auto-create GitHub release after tag
- **Ask first:** Adding new permissions, changing AI endpoint, modifying Gmail sync logic
- **Never:** Commit API keys, remove tests without approval, change storage schema without migration

## Success Criteria

### Job Detection (Phase 1)
- [ ] Auto-detect 20+ ATS platforms (Greenhouse, Lever, Workday, etc.)
- [ ] Extract job title, company, location, requirements, salary
- [ ] Show match score (0-100) based on resume vs JD
- [ ] Show "Apply" button that triggers autofill
- [ ] Works on: LinkedIn, Indeed, StepStone, Glassdoor, Xing

### Match Score (Phase 1)
- [ ] Extract keywords from JD (skills, experience, education)
- [ ] Compare against resume data
- [ ] Calculate percentage match
- [ ] Show matched/missing keywords
- [ ] AI-powered suggestion for improvement

### Gmail Integration (Phase 2)
- [ ] Google OAuth login via Chrome Identity API
- [ ] Read Gmail inbox (readonly scope)
- [ ] Detect job-related emails (interview, rejection, offer)
- [ ] Categorize emails by company and status
- [ ] Update job tracker automatically

### Auto-Tracking (Phase 2)
- [ ] Detect "interview scheduled" emails → update status
- [ ] Detect "rejection" emails → update status
- [ ] Detect "offer" emails → update status
- [ ] Show notification when status changes

### Sidebar UI (Phase 3)
- [ ] Job detection widget (shows when on job page)
- [ ] Match score ring with matched/missing keywords
- [ ] One-click autofill button
- [ ] Job tracker with stats
- [ ] Career chat with AI
- [ ] Settings panel with API key test

## Open Questions

1. **AI Endpoint:** Use `api.opencode.ai` or allow custom endpoint?
   - **Decision:** Allow custom endpoint (user may have their own API key)
2. **Gmail Sync:** Real-time or manual trigger?
   - **Decision:** Manual trigger (user clicks "Sync Gmail")
3. **Match Score:** AI-powered or keyword-based?
   - **Decision:** Hybrid — keyword extraction + AI refinement

## Implementation Plan

### Phase 1: Job Detection + Match Score (Current Sprint)
1. Update content.js to detect job pages
2. Extract job description from DOM
3. Calculate match score against resume
4. Show job widget in sidebar
5. Add tests for job detection

### Phase 2: Gmail Integration
1. Add Chrome Identity API for Google login
2. Add Gmail API readonly scope
3. Build email categorization logic
4. Update job tracker from Gmail
5. Add tests for Gmail sync

### Phase 3: Polish + Release
1. UI/UX improvements
2. Performance optimization
3. Documentation
4. Release v8.0.0
