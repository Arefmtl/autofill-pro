// AutoFill Pro — ATS Verification Module
// Text layer extraction + keyword coverage analysis

const ATSVerification = {
  // Extract text from PDF (simulated - in real use, would use PDF.js)
  extractText(pdfText) {
    // In real implementation, this would use PDF.js to extract text
    return pdfText || '';
  },

  // Check parseability
  checkParseability(text) {
    const issues = [];

    // Check for CID markers (garbage)
    if (/\(cid:\d+\)/g.test(text)) {
      issues.push({ type: 'garbage', message: 'CID markers found — font encoding issue' });
    }

    // Check for replacement characters
    if (/\uFFFD/g.test(text)) {
      issues.push({ type: 'garbage', message: 'Replacement characters found' });
    }

    // Check email presence
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailPattern);
    if (!emails || emails.length === 0) {
      issues.push({ type: 'missing', message: 'Email not found in text layer' });
    }

    // Check phone presence
    const phonePattern = /[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}/g;
    const phones = text.match(phonePattern);
    if (!phones || phones.length === 0) {
      issues.push({ type: 'warning', message: 'Phone number not found in text layer' });
    }

    // Check date presence
    const datePattern = /\b(20\d{2})\b/g;
    const dates = text.match(datePattern);
    if (!dates || dates.length === 0) {
      issues.push({ type: 'warning', message: 'No dates found in text layer' });
    }

    return {
      parseable: issues.filter(i => i.type === 'garbage').length === 0,
      issues,
    };
  },

  // Extract keywords from job posting
  extractKeywords(jobDescription) {
    const keywords = [];
    const text = jobDescription.toLowerCase();

    // Required skills
    const requiredPattern = /(?:required|must have|essential|required skills)[\s:]+([^.]+)/gi;
    let match;
    while ((match = requiredPattern.exec(text)) !== null) {
      const skills = match[1].split(/[,;]|and/).map(s => s.trim()).filter(s => s.length > 2);
      keywords.push(...skills.map(s => ({ keyword: s, priority: 'required' })));
    }

    // Preferred skills
    const preferredPattern = /(?:preferred|nice to have|bonus|desirable)[\s:]+([^.]+)/gi;
    while ((match = preferredPattern.exec(text)) !== null) {
      const skills = match[1].split(/[,;]|and/).map(s => s.trim()).filter(s => s.length > 2);
      keywords.push(...skills.map(s => ({ keyword: s, priority: 'preferred' })));
    }

    // Common technical skills
    const techPattern = /\b(python|javascript|typescript|java|c\+\+|sql|react|vue|angular|aws|azure|gcp|docker|kubernetes|git|ci\/cd|agile|scrum)\b/gi;
    while ((match = techPattern.exec(text)) !== null) {
      const keyword = match[1].toLowerCase();
      if (!keywords.find(k => k.keyword === keyword)) {
        keywords.push({ keyword, priority: 'required' });
      }
    }

    return keywords;
  },

  // Analyze keyword coverage
  analyzeCoverage(keywords, resumeText) {
    const results = [];
    const resumeLower = resumeText.toLowerCase();

    for (const { keyword, priority } of keywords) {
      const kwLower = keyword.toLowerCase();
      let status;

      // Check exact match
      if (resumeLower.includes(kwLower)) {
        status = 'covered';
      }
      // Check common synonyms
      else if (this.hasSynonym(kwLower, resumeLower)) {
        status = 'synonym-only';
      }
      // Check if skill exists but not on resume
      else if (this.skillExistsInProfile(keyword)) {
        status = 'missing (have it)';
      }
      // Genuine gap
      else {
        status = 'missing (gap)';
      }

      results.push({
        keyword,
        priority,
        status,
        note: this.getNote(status, keyword),
      });
    }

    return results;
  },

  // Check for synonyms
  hasSynonym(keyword, text) {
    const synonyms = {
      'python': ['py', 'cpython'],
      'javascript': ['js', 'es6', 'ecmascript'],
      'typescript': ['ts'],
      'react': ['reactjs', 'react.js'],
      'vue': ['vuejs', 'vue.js'],
      'angular': ['angularjs'],
      'aws': ['amazon web services'],
      'azure': ['microsoft azure'],
      'gcp': ['google cloud', 'google cloud platform'],
      'docker': ['containerization', 'containers'],
      'kubernetes': ['k8s'],
      'git': ['version control', 'github', 'gitlab'],
      'ci/cd': ['continuous integration', 'continuous deployment', 'pipeline'],
      'agile': ['scrum', 'kanban'],
      'machine learning': ['ml', 'deep learning', 'dl'],
      'data science': ['ds', 'data analysis'],
    };

    const syns = synonyms[keyword] || [];
    return syns.some(syn => text.includes(syn));
  },

  // Check if skill exists in profile (simulated)
  skillExistsInProfile(keyword) {
    // In real implementation, this would check the user's profile
    return false;
  },

  // Get note for status
  getNote(status, keyword) {
    switch (status) {
      case 'covered':
        return `Found in resume`;
      case 'synonym-only':
        return `Concept present, consider using exact term "${keyword}"`;
      case 'missing (have it)':
        return `Skill exists but not on resume — add where natural`;
      case 'missing (gap)':
        return `Genuine gap — do NOT stuff keywords`;
      default:
        return '';
    }
  },

  // Generate coverage report
  generateReport(jobDescription, resumeText) {
    const keywords = this.extractKeywords(jobDescription);
    const coverage = this.analyzeCoverage(keywords, resumeText);

    const stats = {
      total: coverage.length,
      covered: coverage.filter(c => c.status === 'covered').length,
      synonymOnly: coverage.filter(c => c.status === 'synonym-only').length,
      missingHaveIt: coverage.filter(c => c.status === 'missing (have it)').length,
      missingGap: coverage.filter(c => c.status === 'missing (gap)').length,
    };

    return {
      keywords: coverage,
      stats,
      summary: `Coverage: ${stats.covered}/${stats.total} exact, ${stats.synonymOnly} synonyms, ${stats.missingHaveIt} fixable, ${stats.missingGap} gaps`,
    };
  },
};

// Export for testing
if (typeof module !== 'undefined') {
  module.exports = { ATSVerification };
}
