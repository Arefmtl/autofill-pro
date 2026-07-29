// AutoFill Pro — Skill Gap Analysis Module
// Two-pass detection: hard skill diff + LLM synthesis

const SkillGapAnalysis = {
  // Candidate profile skills
  profileSkills: [],

  // Tracked jobs with fit ratings
  trackedJobs: [],

  // PASS 1: Hard skill diff from job postings
  extractSkillsFromJob(job) {
    const skills = [];
    const text = (job.description || '').toLowerCase();

    // Common skill patterns
    const patterns = [
      /\b(python|javascript|typescript|java|c\+\+|sql|r|scala|go|rust)\b/gi,
      /\b(react|vue|angular|node\.?js|django|flask|fastapi|spring)\b/gi,
      /\b(aws|azure|gcp|docker|kubernetes|terraform|ansible)\b/gi,
      /\b(machine learning|deep learning|nlp|computer vision|data science)\b/gi,
      /\b(postgresql|mysql|mongodb|redis|elasticsearch)\b/gi,
      /\b(git|ci\/cd|jira|confluence|slack)\b/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        skills.push(match[1].toLowerCase());
      }
    }

    return [...new Set(skills)];
  },

  // Calculate gap score based on fit rating
  calculateGapScore(job) {
    const fitRating = job.fitRating || 50; // 0-100
    return (100 - fitRating) / 100; // Lower fit = more gap signal
  },

  // PASS 1: Hard skill diff
  pass1HardSkillDiff() {
    const skillScores = {};

    for (const job of this.trackedJobs) {
      const skills = this.extractSkillsFromJob(job);
      const weight = this.calculateGapScore(job);

      for (const skill of skills) {
        if (!skillScores[skill]) {
          skillScores[skill] = { count: 0, totalWeight: 0 };
        }
        skillScores[skill].count++;
        skillScores[skill].totalWeight += weight;
      }
    }

    // Remove skills already in profile
    const profileSet = new Set(this.profileSkills.map(s => s.toLowerCase()));
    const gaps = {};

    for (const [skill, data] of Object.entries(skillScores)) {
      if (!profileSet.has(skill)) {
        gaps[skill] = {
          count: data.count,
          score: data.totalWeight / data.count,
          priority: this.getPriority(data.totalWeight / data.count, data.count),
        };
      }
    }

    return gaps;
  },

  // PASS 2: LLM synthesis (simulated)
  pass2LLMSynthesis(hardGaps) {
    // In real implementation, this would call LLM
    // For now, return synthetic gaps
    const syntheticGaps = [
      { skill: 'cloud architecture', type: 'domain', priority: 'medium' },
      { skill: 'system design', type: 'soft', priority: 'high' },
      { skill: 'agile methodology', type: 'tooling', priority: 'medium' },
    ];

    // Only add what Pass 1 missed
    const hardGapSet = new Set(Object.keys(hardGaps));
    const newGaps = syntheticGaps.filter(g => !hardGapSet.has(g.skill));

    return newGaps;
  },

  // Get priority level
  getPriority(score, count) {
    if (score > 0.7 || count > 5) return 'critical';
    if (score > 0.5 || count > 3) return 'high';
    if (score > 0.3 || count > 1) return 'medium';
    return 'low';
  },

  // Generate learning plan
  generateLearningPlan(gaps) {
    const plan = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };

    for (const [skill, data] of Object.entries(gaps)) {
      plan[data.priority].push({
        skill,
        count: data.count,
        resources: this.suggestResources(skill),
        timeEstimate: this.estimateTime(data.priority),
      });
    }

    return plan;
  },

  // Suggest learning resources
  suggestResources(skill) {
    // In real implementation, this would search the web
    return [
      { type: 'docs', title: `Official ${skill} documentation` },
      { type: 'course', title: `${skill} for professionals` },
      { type: 'practice', title: `${skill} projects on GitHub` },
    ];
  },

  // Estimate learning time
  estimateTime(priority) {
    const times = {
      critical: '2-4 weeks',
      high: '1-2 weeks',
      medium: '3-5 days',
      low: '1-2 days',
    };
    return times[priority] || '1 week';
  },

  // Generate gap heatmap
  generateHeatmap(gaps) {
    const heatmap = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };

    for (const [skill, data] of Object.entries(gaps)) {
      heatmap[data.priority].push({
        skill,
        score: data.score,
        count: data.count,
      });
    }

    return heatmap;
  },

  // Full analysis pipeline
  analyze(profileSkills, trackedJobs) {
    this.profileSkills = profileSkills;
    this.trackedJobs = trackedJobs;

    const hardGaps = this.pass1HardSkillDiff();
    const syntheticGaps = this.pass2LLMSynthesis(hardGaps);

    // Merge gaps
    const allGaps = { ...hardGaps };
    for (const gap of syntheticGaps) {
      allGaps[gap.skill] = {
        count: 1,
        score: 0.5,
        priority: gap.priority,
      };
    }

    const learningPlan = this.generateLearningPlan(allGaps);
    const heatmap = this.generateHeatmap(allGaps);

    return {
      gaps: allGaps,
      learningPlan,
      heatmap,
      summary: {
        total: Object.keys(allGaps).length,
        critical: learningPlan.critical.length,
        high: learningPlan.high.length,
        medium: learningPlan.medium.length,
        low: learningPlan.low.length,
      },
    };
  },
};

// Export for testing
if (typeof module !== 'undefined') {
  module.exports = { SkillGapAnalysis };
}
