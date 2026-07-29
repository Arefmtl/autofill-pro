// AutoFill Pro — Drafter-Reviewer Module
// Two-agent pipeline with grounding audit

const DrafterReviewer = {
  // Drafting agent
  drafter: {
    // Parse job posting
    parseJobPosting(text) {
      const companyMatch = text.match(/(?:at|@|company:?)\s+([A-Z][a-zA-Z0-9\s&]+)/i);
      const roleMatch = text.match(/(?:role|position|title:?)\s+([A-Z][a-zA-Z\s]+)/i);
      const locationMatch = text.match(/(?:location:?)\s+([A-Z][a-zA-Z\s,]+)/i);

      return {
        company: companyMatch ? companyMatch[1].trim() : 'Unknown',
        role: roleMatch ? roleMatch[1].trim() : 'Unknown',
        location: locationMatch ? locationMatch[1].trim() : 'Unknown',
        requirements: this.extractRequirements(text),
        keywords: this.extractKeywords(text),
      };
    },

    // Extract requirements
    extractRequirements(text) {
      const requirements = [];
      const patterns = [
        /(?:required|must have|essential)[\s:]+([^.]+)/gi,
        /(?:experience with|proficient in|knowledge of)[\s:]+([^.]+)/gi,
      ];

      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          requirements.push(match[1].trim());
        }
      }

      return requirements;
    },

    // Extract keywords
    extractKeywords(text) {
      const keywords = [];
      const pattern = /\b(python|javascript|typescript|java|c\+\+|sql|react|vue|angular|aws|azure|gcp|docker|kubernetes|git|ci\/cd|agile|scrum|machine learning|data science)\b/gi;

      let match;
      while ((match = pattern.exec(text)) !== null) {
        keywords.push(match[1].toLowerCase());
      }

      return [...new Set(keywords)];
    },

    // Draft CV section
    draftCV(profile, job) {
      // In real implementation, this would generate LaTeX
      return {
        type: 'cv',
        sections: this.generateCVSections(profile, job),
        keywords: job.keywords,
      };
    },

    // Generate CV sections
    generateCVSections(profile, job) {
      return [
        { title: 'Experience', content: this.tailorExperience(profile.experience, job) },
        { title: 'Skills', content: this.tailorSkills(profile.skills, job.keywords) },
        { title: 'Education', content: profile.education || [] },
      ];
    },

    // Tailor experience to job
    tailorExperience(experience, job) {
      if (!experience) return [];

      return experience.map(exp => ({
        ...exp,
        highlights: exp.highlights?.filter(h =>
          job.keywords.some(kw => h.toLowerCase().includes(kw))
        ) || exp.highlights,
      }));
    },

    // Tailor skills to job keywords
    tailorSkills(skills, jobKeywords) {
      if (!skills) return [];

      // Sort by relevance to job keywords
      return skills.sort((a, b) => {
        const aMatch = jobKeywords.some(kw => a.toLowerCase().includes(kw)) ? 1 : 0;
        const bMatch = jobKeywords.some(kw => b.toLowerCase().includes(kw)) ? 1 : 0;
        return bMatch - aMatch;
      });
    },

    // Draft cover letter
    draftCoverLetter(profile, job) {
      return {
        type: 'cover_letter',
        paragraphs: [
          this.generateOpening(profile, job),
          this.generateBody(profile, job),
          this.generateClosing(profile, job),
        ],
      };
    },

    // Generate opening
    generateOpening(profile, job) {
      return `I am writing to express my interest in the ${job.role} position at ${job.company}. With my background in ${profile.field || 'the field'}, I believe I would be a strong fit for this role.`;
    },

    // Generate body
    generateBody(profile, job) {
      const relevantExperience = (profile.experience || [])
        .filter(exp => job.keywords.some(kw =>
          exp.highlights?.some(h => h.toLowerCase().includes(kw))
        ))
        .slice(0, 2);

      let body = 'In my previous roles, I have gained valuable experience in ';
      body += relevantExperience.map(exp => exp.highlights?.[0]).filter(Boolean).join(' and ');
      body += '.';

      return body;
    },

    // Generate closing
    generateClosing(profile, job) {
      return `I am excited about the opportunity to contribute to ${job.company} and would welcome the chance to discuss how my skills align with your team's needs. Thank you for considering my application.`;
    },
  },

  // Reviewing agent
  reviewer: {
    // Research company
    async researchCompany(company) {
      // In real implementation, this would use WebSearch
      return {
        company,
        recentNews: [],
        culture: '',
        competitors: [],
      };
    },

    // Grounding audit
    groundingAudit(draft, profile, cvText, coverLetterText) {
      const issues = [];

      // Extract claims from draft
      const claims = this.extractClaims(draft);

      // Check against sources
      for (const claim of claims) {
        const inProfile = profile && JSON.stringify(profile).toLowerCase().includes(claim.text.toLowerCase());
        const inCV = cvText && cvText.toLowerCase().includes(claim.text.toLowerCase());
        const inCL = coverLetterText && coverLetterText.toLowerCase().includes(claim.text.toLowerCase());

        if (!inProfile && !inCV && !inCL) {
          issues.push({
            type: 'grounding',
            claim: claim.text,
            message: 'Claim not found in any source document',
          });
        }
      }

      return issues;
    },

    // Extract claims from text
    extractClaims(draft) {
      const claims = [];
      const text = typeof draft === 'string' ? draft : JSON.stringify(draft);

      // Date claims
      const datePattern = /\b(20\d{2})\b/g;
      let match;
      while ((match = datePattern.exec(text)) !== null) {
        claims.push({ type: 'date', text: match[1] });
      }

      // Metric claims
      const metricPattern = /\b(\d+%|\d+\+? (?:years?|months?|projects?|clients?))\b/gi;
      while ((match = metricPattern.exec(text)) !== null) {
        claims.push({ type: 'metric', text: match[0] });
      }

      return claims;
    },

    // Generate feedback
    generateFeedback(draft, auditResults, companyResearch) {
      const feedback = {
        edits: [],
        suggestions: [],
      };

      // Part A: Structured edits
      for (const issue of auditResults) {
        feedback.edits.push({
          file: 'cv',
          old_string: issue.claim,
          new_string: '',
          reason: 'grounding',
          message: issue.message,
        });
      }

      // Part B: Narrative suggestions
      if (companyResearch.recentNews.length > 0) {
        feedback.suggestions.push({
          category: 'company angle',
          message: `Consider mentioning recent company news: ${companyResearch.recentNews[0]}`,
        });
      }

      return feedback;
    },
  },

  // Full pipeline
  async process(profile, jobPostingText, cvText, coverLetterText) {
    // Step 1: Drafter parses and drafts
    const job = this.drafter.parseJobPosting(jobPostingText);
    const cvDraft = this.drafter.draftCV(profile, job);
    const clDraft = this.drafter.draftCoverLetter(profile, job);

    // Step 2: Reviewer researches company
    const companyResearch = await this.reviewer.researchCompany(job.company);

    // Step 3: Grounding audit
    const auditResults = this.reviewer.groundingAudit(
      { cv: cvDraft, cl: clDraft },
      profile,
      cvText,
      coverLetterText
    );

    // Step 4: Generate feedback
    const feedback = this.reviewer.generateFeedback(
      { cv: cvDraft, cl: clDraft },
      auditResults,
      companyResearch
    );

    return {
      job,
      cvDraft,
      clDraft,
      companyResearch,
      auditResults,
      feedback,
      grounded: auditResults.length === 0,
    };
  },
};

// Export for testing
if (typeof module !== 'undefined') {
  module.exports = { DrafterReviewer };
}
