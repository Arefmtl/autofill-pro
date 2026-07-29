// AutoFill Pro — Interview Prep Module
// STAR tag-based retrieval + stage-specific questions

const InterviewPrep = {
  // STAR examples from profile
  starExamples: [
    { id: 'star-1', situation: '', task: '', action: '', result: '', tags: [] },
  ],

  // Stage-specific question templates
  stageQuestions: {
    phone: [
      { q: 'Tell me about yourself', category: 'motivation', tags: ['intro', 'career'] },
      { q: 'Why this role?', category: 'motivation', tags: ['company', 'role'] },
      { q: 'What are your salary expectations?', category: 'logistics', tags: ['salary'] },
      { q: 'When can you start?', category: 'logistics', tags: ['timeline'] },
    ],
    technical: [
      { q: 'Describe a challenging technical problem you solved', category: 'technical', tags: ['problem-solving', 'coding'] },
      { q: 'How do you approach code review?', category: 'process', tags: ['quality', 'teamwork'] },
      { q: 'Explain a complex project you worked on', category: 'experience', tags: ['project', 'leadership'] },
      { q: 'What is your experience with [tech stack]?', category: 'skills', tags: ['technical', 'tools'] },
    ],
    behavioral: [
      { q: 'Tell me about a time you failed', category: 'behavioral', tags: ['failure', 'learning'] },
      { q: 'Describe a conflict with a teammate', category: 'behavioral', tags: ['conflict', 'teamwork'] },
      { q: 'How do you handle pressure?', category: 'behavioral', tags: ['stress', 'adaptability'] },
      { q: 'Give an example of leadership', category: 'behavioral', tags: ['leadership', 'initiative'] },
    ],
    final: [
      { q: 'Where do you see yourself in 5 years?', category: 'growth', tags: ['career', 'ambition'] },
      { q: 'What questions do you have for us?', category: 'engagement', tags: ['research', 'interest'] },
      { q: 'What would your first 90 days look like?', category: 'planning', tags: ['onboarding', 'strategy'] },
    ],
  },

  // Match STAR examples to questions by tag overlap
  matchSTAR(question) {
    const qTags = question.tags || [];
    let bestMatch = null;
    let bestScore = 0;

    for (const star of this.starExamples) {
      const starTags = star.tags || [];
      const overlap = qTags.filter(t => starTags.includes(t)).length;
      const score = overlap / Math.max(qTags.length, 1);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = star;
      }
    }

    return { star: bestMatch, score: bestScore };
  },

  // Generate prep pack for a specific stage
  generatePrepPack(stage, company, role) {
    const questions = this.stageQuestions[stage] || this.stageQuestions.phone;
    const pack = {
      company,
      role,
      stage,
      questions: [],
    };

    for (const q of questions) {
      const { star, score } = this.matchSTAR(q);
      pack.questions.push({
        question: q.q,
        category: q.category,
        suggestedSTAR: star,
        matchScore: score,
        tips: this.getTips(q.category),
      });
    }

    return pack;
  },

  // Category-specific tips
  getTips(category) {
    const tips = {
      motivation: ['Be specific about the company', 'Connect your goals to the role'],
      logistics: ['Research market rates', 'Be flexible but confident'],
      technical: ['Use STAR format', 'Be specific about technologies'],
      skills: ['Match your skills to their stack', 'Be honest about gaps'],
      behavioral: ['Use concrete examples', 'Show self-awareness'],
      growth: ['Show ambition but be realistic', 'Connect to company trajectory'],
      engagement: ['Ask about team structure', 'Ask about growth opportunities'],
      planning: ['Show you understand the role', 'Be realistic about timelines'],
      process: ['Show you value quality', 'Mention specific practices'],
      experience: ['Quantify your impact', 'Show technical depth'],
      conflict: ['Focus on resolution', 'Show emotional intelligence'],
      stress: ['Give concrete examples', 'Show coping strategies'],
      leadership: ['Show initiative', 'Demonstrate impact'],
      failure: ['Show learning', 'Demonstrate growth'],
      learning: ['Show self-improvement', 'Be humble'],
      initiative: ['Show proactiveness', 'Demonstrate impact'],
      teamwork: ['Show collaboration', 'Demonstrate communication'],
      quality: ['Show attention to detail', 'Mention specific tools'],
      coding: ['Show problem-solving', 'Mention specific languages'],
      tools: ['Match their stack', 'Show willingness to learn'],
      project: ['Show technical depth', 'Demonstrate impact'],
      ambition: ['Show long-term thinking', 'Connect to company'],
      research: ['Show you did homework', 'Ask thoughtful questions'],
      interest: ['Show genuine enthusiasm', 'Be specific'],
      onboarding: ['Show realistic expectations', 'Demonstrate planning'],
      strategy: ['Show business understanding', 'Be practical'],
      timeline: ['Be flexible', 'Show enthusiasm'],
      salary: ['Research market rates', 'Be confident but reasonable'],
    };

    return tips[category] || ['Use STAR format', 'Be specific'];
  },

  // Generate consistency brief (claims in CV/CL vs interview)
  generateConsistencyBrief(cvText, coverLetterText) {
    const claims = [];

    // Extract dates, titles, metrics from CV
    const datePattern = /\b(20\d{2})\b/g;
    const metricPattern = /\b(\d+%|\d+\+? (?:years?|months?|projects?|clients?))\b/gi;

    let match;
    while ((match = datePattern.exec(cvText)) !== null) {
      claims.push({ type: 'date', value: match[1], source: 'cv' });
    }

    while ((match = metricPattern.exec(cvText)) !== null) {
      claims.push({ type: 'metric', value: match[0], source: 'cv' });
    }

    return {
      claims,
      rule: 'No claim in the room that isn\'t on the paper, every claim defensible in depth',
    };
  },
};

// Export for testing
if (typeof module !== 'undefined') {
  module.exports = { InterviewPrep };
}
