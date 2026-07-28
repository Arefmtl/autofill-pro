# Tasks: AutoFill Pro v8.0

## Phase 1: Job Detection + Match Score

- [ ] 1.1: Update manifest.json — add `identity`, `gmail.readonly` permissions
  - Acceptance: manifest.json has new permissions, syntax valid
  - Verify: `node --check manifest.json` (via JSON parse)
  - Files: manifest.json

- [ ] 1.2: Create content/job-detector.js — detect job pages
  - Acceptance: detects 20+ ATS platforms, extracts JD fields
  - Verify: `node --check content/job-detector.js`
  - Files: content/job-detector.js

- [ ] 1.3: Create content/match-score.js — calculate match score
  - Acceptance: compares resume vs JD, returns 0-100 score
  - Verify: `node tests/test-match.js`
  - Files: content/match-score.js, tests/test-match.js

- [ ] 1.4: Update content/sidebar.js — add job detection widget
  - Acceptance: shows when on job page, displays JD + match score
  - Verify: manual test on LinkedIn/Indeed
  - Files: content/sidebar.js

- [ ] 1.5: Update background/service-worker.js — route job detection messages
  - Acceptance: messages routed correctly between content scripts
  - Verify: `node --check background/service-worker.js`
  - Files: background/service-worker.js

## Phase 2: Gmail Integration

- [ ] 2.1: Add Google OAuth — Chrome Identity API
  - Acceptance: user can login with Google account
  - Verify: manual test — login button works
  - Files: background/auth.js, content/sidebar.js

- [ ] 2.2: Add Gmail API — read inbox
  - Acceptance: can fetch emails with readonly scope
  - Verify: manual test — shows recent job emails
  - Files: background/gmail.js

- [ ] 2.3: Build email categorization — classify job emails
  - Acceptance: categorizes interview/rejection/offer emails
  - Verify: `node tests/test-gmail.js`
  - Files: background/gmail.js, tests/test-gmail.js

- [ ] 2.4: Update job tracker from Gmail
  - Acceptance: status auto-updates when email detected
  - Verify: manual test — sync Gmail → tracker updates
  - Files: background/service-worker.js, content/sidebar.js

- [ ] 2.5: Add Gmail sync button to sidebar
  - Acceptance: button triggers Gmail scan, shows results
  - Verify: manual test — click sync → see categorized emails
  - Files: content/sidebar.js

## Phase 3: Polish + Release

- [ ] 3.1: UI/UX improvements
  - Acceptance: smooth animations, proper hover states
  - Verify: visual inspection
  - Files: content/sidebar.js

- [ ] 3.2: Performance optimization
  - Acceptance: job detection < 100ms, match score < 500ms
  - Verify: console.time measurements
  - Files: content/job-detector.js, content/match-score.js

- [ ] 3.3: Documentation
  - Acceptance: README updated with new features
  - Verify: README.md has v8.0 section
  - Files: README.md

- [ ] 3.4: Release v8.0.0
  - Acceptance: GitHub release created, ZIP built
  - Verify: `gh release list | grep v8.0`
  - Files: docs/autofill-pro.zip, docs/updates.xml
