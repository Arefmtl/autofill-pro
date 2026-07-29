// AutoFill Pro — Salary Benchmark Module
// Fuzzy company name matching with score-based ranking

const SalaryBenchmark = {
  // Strip patterns for company name normalization
  stripPatterns: [
    /\ba\/s\b/gi, /\baps\b/gi, /\bi\/s\b/gi, /\bp\/s\b/gi, /\bk\/s\b/gi,
    /\bivs\b/gi, /\bamba\b/gi, /\ba\.m\.b\.a\.\b/gi,
    /\(vg\)/gi, /\(.*?\)/g,
    /\bdanmark\b/gi, /\bdenmark\b/gi, /\bscandinavia\b/gi, /\bnordic\b/gi,
    /\bgroup\b/gi, /\bholding\b/gi,
    /,\s*.*$/g,
  ],

  // Danish → English character mapping
  anglicizeMap: { 'ø': 'o', 'æ': 'ae', 'å': 'aa' },

  // Normalize company name
  normalize(name) {
    let result = name.toLowerCase().trim();

    // Apply strip patterns
    for (const pattern of this.stripPatterns) {
      result = result.replace(pattern, '');
    }

    // Anglicize
    for (const [danish, english] of Object.entries(this.anglicizeMap)) {
      result = result.replace(new RegExp(danish, 'g'), english);
    }

    return result.replace(/\s+/g, ' ').trim();
  },

  // Extract core words
  extractCoreWords(name) {
    return this.normalize(name)
      .split(/\s+/)
      .filter(w => w.length > 1);
  },

  // Calculate match score between query and company name
  matchScore(query, entry) {
    const normQuery = this.normalize(query);
    const normEntry = this.normalize(entry);

    // Exact match
    if (normQuery === normEntry) return 100;

    // Query contained in entry
    if (normEntry.includes(normQuery)) {
      const ratio = normQuery.length / normEntry.length;
      return 80 + (ratio * 10);
    }

    // Entry contained in query
    if (normQuery.includes(normEntry)) {
      const ratio = normEntry.length / normQuery.length;
      return 80 + (ratio * 10);
    }

    // Anglicized exact match
    const angQuery = this.normalize(query);
    const angEntry = this.normalize(entry);
    if (angQuery === angEntry) return 85;

    // Anglicized containment
    if (angEntry.includes(angQuery)) return 75;

    // Word overlap
    const queryWords = this.extractCoreWords(query);
    const entryWords = this.extractCoreWords(entry);
    const overlap = queryWords.filter(w => entryWords.includes(w));

    if (overlap.length === 1) return 70;
    if (overlap.length > 1) {
      const coverageRatio = overlap.length / Math.max(queryWords.length, entryWords.length);
      return 30 + (coverageRatio * 40);
    }

    return 0;
  },

  // Look up salary data
  lookup(companyName, city, salaryData) {
    if (!salaryData || !salaryData.companies) {
      return { error: 'No salary data available' };
    }

    const results = [];

    for (const company of salaryData.companies) {
      // City filter
      if (city && company.city) {
        const normCity = city.toLowerCase();
        const normCompanyCity = company.city.toLowerCase();
        if (normCity !== normCompanyCity && !normCompanyCity.includes(normCity)) {
          continue;
        }
      }

      const score = this.matchScore(companyName, company.company);

      if (score >= 30) {
        results.push({
          company: company.company,
          city: company.city,
          score,
          categories: company.categories,
        });
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    return {
      query: companyName,
      city: city || 'Any',
      results: results.slice(0, 5),
      total: results.length,
    };
  },

  // Format results for display
  formatResults(data) {
    if (data.error) return data.error;
    if (data.results.length === 0) return 'No matching companies found';

    let output = `Salary data for "${data.query}" (${data.city}):\n\n`;

    for (const result of data.results) {
      output += `${result.company} (${result.city}) — Score: ${result.score}\n`;

      if (result.categories) {
        for (const [category, info] of Object.entries(result.categories)) {
          const index = info.index || 0;
          const baseline = salaryData.metadata?.baseline_description || 'baseline';
          output += `  ${category}: Index ${index} (${index > 100 ? 'above' : 'below'} ${baseline})\n`;
        }
      }

      output += '\n';
    }

    return output;
  },
};

// Export for testing
if (typeof module !== 'undefined') {
  module.exports = { SalaryBenchmark };
}
