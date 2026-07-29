// AutoFill Pro — Email Categorization
// Classifies job-related emails by status

const EmailCategorizer = {
  // Status patterns (EN + DE)
  PATTERNS: {
    interview: {
      en: [/interview/i, /phone screen/i, /technical interview/i, /onsite/i, /meeting/i, /call scheduled/i, /gespräch/i, /vorstellungsgespräch/i],
      keywords: ['interview', 'screen', 'meeting', 'call', 'gespräch', 'vorstellung']
    },
    rejection: {
      en: [/rejection/i, /not selected/i, /unfortunately/i, /decided not to/i, /we regret/i, /abgelehnt/i, /leider/i, /nicht ausgewählt/i],
      keywords: ['rejection', 'unfortunately', 'regret', 'abgelehnt', 'leider']
    },
    offer: {
      en: [/offer/i, /congratulations/i, /we are pleased/i, /welcome to/i, /job offer/i, /angebot/i, /herzlichen/i, /willkommen/i],
      keywords: ['offer', 'congratulations', 'pleased', 'angebot', 'herzlichen']
    },
    assessment: {
      en: [/assessment/i, /test assignment/i, /coding challenge/i, /take.home/i, /aufgabe/i, /test/i],
      keywords: ['assessment', 'challenge', 'assignment', 'aufgabe']
    },
    application: {
      en: [/application received/i, /thank you for applying/i, /bewerbung erhalten/i, /vielen dank/i],
      keywords: ['application', 'received', 'applying', 'bewerbung']
    },
    status_update: {
      en: [/update/i, /status/i, /progress/i, /fortschritt/i, /update/i],
      keywords: ['update', 'status', 'progress', 'fortschritt']
    }
  },

  // Categorize a single email
  categorize(subject, body = '') {
    const text = `${subject} ${body}`.toLowerCase();
    
    for (const [status, patterns] of Object.entries(this.PATTERNS)) {
      // Check regex patterns
      for (const pattern of patterns.en) {
        if (pattern.test(text)) {
          return { status, confidence: 'high', matched: pattern.source };
        }
      }
      
      // Check keywords
      for (const keyword of patterns.keywords) {
        if (text.includes(keyword)) {
          return { status, confidence: 'medium', matched: keyword };
        }
      }
    }
    
    return { status: 'unknown', confidence: 'none', matched: null };
  },

  // Extract company from email
  extractCompany(from, subject) {
    // Try to extract from "from" field
    const fromMatch = from.match(/@([^.]+)/);
    if (fromMatch) {
      const domain = fromMatch[1].toLowerCase();
      // Known ATS domains
      const atsDomains = {
        'greenhouse': 'Greenhouse',
        'lever': 'Lever',
        'workday': 'Workday',
        'ashbyhq': 'Ashby',
        'smartrecruiters': 'SmartRecruiters',
        'icims': 'iCIMS',
        'bamboohr': 'BambooHR',
        'indeed': 'Indeed',
        'glassdoor': 'Glassdoor',
        'stepstone': 'StepStone',
        'xing': 'Xing'
      };
      
      for (const [key, name] of Object.entries(atsDomains)) {
        if (domain.includes(key)) return name;
      }
      
      // Use domain as company name
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    }
    
    // Try to extract from subject
    const subjectMatch = subject.match(/(?:at|bei|@)\s+([A-Z][a-zA-Z\s&]+)/);
    if (subjectMatch) return subjectMatch[1].trim();
    
    return 'Unknown Company';
  },

  // Process multiple emails and return categorized results
  async categorizeEmails(messages, gmailAPI) {
    const results = [];
    
    for (const msg of messages) {
      try {
        const detail = await gmailAPI.getMessage(msg.id);
        const headers = detail.payload?.headers || [];
        const subject = gmailAPI.getHeader(headers, 'Subject');
        const from = gmailAPI.getHeader(headers, 'From');
        const date = gmailAPI.getHeader(headers, 'Date');
        const body = detail.snippet || '';
        
        const category = this.categorize(subject, body);
        const company = this.extractCompany(from, subject);
        
        results.push({
          id: msg.id,
          subject,
          from,
          date,
          company,
          category: category.status,
          confidence: category.confidence,
          matched: category.matched,
          snippet: body.substring(0, 200)
        });
      } catch (e) {
        console.error('Failed to process email:', msg.id, e);
      }
    }
    
    return results;
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.EmailCategorizer = EmailCategorizer;
}
