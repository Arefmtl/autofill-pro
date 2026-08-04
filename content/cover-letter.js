/**
 * Cover Letter AI — AutoFill Pro v9.0
 * Generates personalized cover letters using AI
 * Supports: EN, DE, FA
 */

const CoverLetterAI = (() => {
  // === Templates ===
  const TEMPLATES = {
    en: {
      formal: {
        greeting: "Dear Hiring Manager,",
        opening: "I am writing to express my strong interest in the {position} position at {company}.",
        body: "With my background in {skills} and {experience} years of experience, I believe I am well-positioned to contribute to your team.",
        closing: "I would welcome the opportunity to discuss how my skills and experience align with your needs.",
        signoff: "Sincerely,"
      },
      casual: {
        greeting: "Hi there,",
        opening: "I was excited to see the {position} opening at {company} — it seems like a perfect match for my background.",
        body: "My experience with {skills} has prepared me well for this role, and I'm particularly drawn to {company}'s mission.",
        closing: "I'd love to chat more about how I can contribute to your team.",
        signoff: "Best regards,"
      },
      creative: {
        greeting: "Hello {company} team,",
        opening: "When I saw the {position} role at {company}, I knew I had to reach out.",
        body: "My journey in {skills} has been driven by curiosity and a passion for solving complex problems. I believe my unique perspective would add value to your team.",
        closing: "Let's connect and explore how we can create something amazing together.",
        signoff: "Cheers,"
      }
    },
    de: {
      formal: {
        greeting: "Sehr geehrte Damen und Herren,",
        opening: "Mit großem Interesse habe ich Ihre Stellenausschreibung für die Position als {position} bei {company} gelesen.",
        body: "Mit meinem Hintergrund in {skills} und {experience} Jahren Erfahrung bin ich überzeugt, dass ich einen wertvollen Beitrag zu Ihrem Team leisten kann.",
        closing: "Ich freue mich auf die Möglichkeit, meine Fähigkeiten und Erfahrungen in einem persönlichen Gespräch vorzustellen.",
        signoff: "Mit freundlichen Grüßen,"
      },
      casual: {
        greeting: "Hallo Team,",
        opening: "Ich habe die Stelle als {position} bei {company} gesehen und war sofort begeistert.",
        body: "Meine Erfahrung mit {skills} passt perfekt zu den Anforderungen, und ich finde {company}'s Mission sehr inspirierend.",
        closing: "Ich würde mich freuen, mehr darüber zu sprechen, wie ich Ihrem Team beitragen kann.",
        signoff: "Herzliche Grüße,"
      },
      creative: {
        greeting: "Hallo {company} Team,",
        opening: "Als ich die Position als {position} bei {company} gesehen habe, wusste ich: Das ist genau das Richtige für mich.",
        body: "Meine Reise in {skills} wurde von Neugier und Leidenschaft für komplexe Probleme angetrieben. Ich bin überzeugt, dass meine einzigartige Perspektive Ihrem Team neuen Schwung verleihen wird.",
        closing: "Lassen Sie uns gemeinsam herausfinden, wie wir Großartiges schaffen können.",
        signoff: "Liebe Grüße,"
      }
    },
    fa: {
      formal: {
        greeting: "با احترام،",
        opening: "با علاقه زیاد آگهی استخدام برای موقعیت {position} در {company} را مشاهده کردم.",
        background: "با توجه به سابقه من در {skills} و {experience} سال تجربه، معتقدم که می‌توانم مشارکت ارزشمندی در تیم شما داشته باشم.",
        closing: "امیدوارم فرصتی برای بحث در مورد نحوه همکاری داشته باشیم.",
        signoff: "با احترام,"
      },
      casual: {
        greeting: "سلام،",
        opening: "موقعیت {position} در {company} را دیدم و عاشقش شدم!",
        body: "تجربه من در {skills} عالیه و مأموریت {company} واقعاً الهام‌بخشه.",
        closing: "بیا بیشتر صحبت کنیم!",
        signoff: "با احترام,"
      },
      creative: {
        greeting: "سلام تیم {company}،",
        opening: "وقتی موقعیت {position} در {company} را دیدم، فهمیدم که این دقیقاً همان چیزی است که دنبالش بودم.",
        body: "سفر من در {skills} از کنجکاوی و علاقه به حل مسائل پیچیده شروع شده. معتقدم دیدگاه من می‌تواند ارزش افزوده‌ای برای تیم شما داشته باشد.",
        closing: "بیا با هم کشف کنیم چطور می‌تونیم چیز فوق‌العاده‌ای بسازیم.",
        signoff: "با عشق,"
      }
    }
  };

  // === Extract job info from page ===
  function extractJobInfo() {
    const url = window.location.href;
    const title = document.title || '';
    
    // Try to find job title
    const titleSelectors = [
      'h1[class*="title"]', 'h1[class*="job"]', 'h1[class*="position"]',
      '[data-testid*="title"]', '.job-title', '.position-title',
      'h1', 'h2'
    ];
    
    let jobTitle = '';
    for (const sel of titleSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim().length > 5) {
        jobTitle = el.textContent.trim();
        break;
      }
    }
    
    // Try to find company name
    const companySelectors = [
      '[class*="company"]', '[data-testid*="company"]',
      '.company-name', '.employer'
    ];
    
    let company = '';
    for (const sel of companySelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim().length > 2) {
        company = el.textContent.trim();
        break;
      }
    }
    
    // Try to find job description
    const descSelectors = [
      '[class*="description"]', '[class*="about"]',
      '.job-description', '.job-about', 'article'
    ];
    
    let description = '';
    for (const sel of descSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim().length > 50) {
        description = el.textContent.trim().substring(0, 2000);
        break;
      }
    }
    
    // Extract skills from description
    const skillKeywords = [
      'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL',
      'Machine Learning', 'Data Science', 'TensorFlow', 'PyTorch',
      'AWS', 'Docker', 'Kubernetes', 'Git', 'CI/CD',
      'REST API', 'GraphQL', 'MongoDB', 'PostgreSQL',
      'Agile', 'Scrum', 'JIRA', 'Confluence'
    ];
    
    const foundSkills = skillKeywords.filter(skill => 
      description.toLowerCase().includes(skill.toLowerCase())
    );
    
    return {
      title: jobTitle || title,
      company: company || 'the company',
      description,
      skills: foundSkills,
      url
    };
  }

  // === Generate cover letter ===
  function generate(options = {}) {
    const {
      jobInfo = null,
      template = 'formal',
      language = 'en',
      userProfile = null,
      tone = 'professional'
    } = options;
    
    const job = jobInfo || extractJobInfo();
    const lang = TEMPLATES[language] || TEMPLATES.en;
    const tmpl = lang[template] || lang.formal;
    
    // Build cover letter
    let letter = '';
    
    // Greeting (replace {company} if present)
    letter += (tmpl.greeting || '').replace('{company}', job.company) + '\n\n';
    
    // Opening
    letter += (tmpl.opening || '')
      .replace('{position}', job.title)
      .replace('{company}', job.company) + '\n\n';
    
    // Body
    const skills = job.skills.length > 0 
      ? job.skills.slice(0, 5).join(', ')
      : 'relevant technical skills';
    
    const experience = userProfile?.experience || '3+';
    
    // Use body or background (Farsi uses background)
    const bodyText = tmpl.body || tmpl.background || '';
    letter += bodyText
      .replace('{skills}', skills)
      .replace('{experience}', experience)
      .replace('{position}', job.title)
      .replace('{company}', job.company) + '\n\n';
    
    // Add personalized paragraph if we have description
    if (job.description) {
      const keyRequirements = extractKeyRequirements(job.description);
      if (keyRequirements.length > 0) {
        letter += `I am particularly excited about how my experience with ${keyRequirements.slice(0, 3).join(' and ')} aligns with your requirements.\n\n`;
      }
    }
    
    // Closing
    letter += (tmpl.closing || '') + '\n\n';
    
    // Signoff
    letter += (tmpl.signoff || '') + '\n';
    letter += userProfile?.name || '[Your Name]';
    
    return {
      letter,
      job,
      template,
      language,
      wordCount: letter.split(/\s+/).length
    };
  }

  // === Extract key requirements from JD ===
  function extractKeyRequirements(description) {
    const requirements = [];
    
    // Common requirement patterns
    const patterns = [
      /experience\s+(?:with|in)\s+([^,.]+)/gi,
      /proficient\s+in\s+([^,.]+)/gi,
      /knowledge\s+of\s+([^,.]+)/gi,
      /familiarity\s+with\s+([^,.]+)/gi
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(description)) !== null) {
        if (match[1] && match[1].length > 2 && match[1].length < 50) {
          requirements.push(match[1].trim());
        }
      }
    }
    
    return [...new Set(requirements)].slice(0, 5);
  }

  // === Create UI ===
  function createUI(container) {
    const ui = document.createElement('div');
    ui.className = 'cover-letter-ui';
    ui.innerHTML = `
      <div class="cl-header">
        <h3>📝 Cover Letter Generator</h3>
        <span class="cl-badge">AI-Powered</span>
      </div>
      
      <div class="cl-options">
        <div class="cl-row">
          <label>Template:</label>
          <select id="cl-template">
            <option value="formal">Formal</option>
            <option value="casual">Casual</option>
            <option value="creative">Creative</option>
          </select>
        </div>
        
        <div class="cl-row">
          <label>Language:</label>
          <select id="cl-language">
            <option value="en">English</option>
            <option value="de">Deutsch</option>
            <option value="fa">فارسی</option>
          </select>
        </div>
        
        <div class="cl-row">
          <label>Your Name:</label>
          <input type="text" id="cl-name" placeholder="Ali Kazemi">
        </div>
        
        <div class="cl-row">
          <label>Experience (years):</label>
          <input type="number" id="cl-experience" value="3" min="0" max="30">
        </div>
      </div>
      
      <button id="cl-generate" class="cl-btn">
        <span>✨ Generate Cover Letter</span>
      </button>
      
      <div id="cl-output" class="cl-output" style="display:none;">
        <div class="cl-output-header">
          <span>Generated Cover Letter</span>
          <div class="cl-actions">
            <button id="cl-copy" class="cl-action-btn" title="Copy">📋</button>
            <button id="cl-download" class="cl-action-btn" title="Download">💾</button>
          </div>
        </div>
        <textarea id="cl-text" rows="12"></textarea>
        <div class="cl-stats">
          <span id="cl-words">0 words</span>
          <span id="cl-job-info"></span>
        </div>
      </div>
    `;
    
    container.appendChild(ui);
    
    // Event listeners
    document.getElementById('cl-generate')?.addEventListener('click', () => {
      const options = {
        template: document.getElementById('cl-template')?.value || 'formal',
        language: document.getElementById('cl-language')?.value || 'en',
        userProfile: {
          name: document.getElementById('cl-name')?.value || '[Your Name]',
          experience: document.getElementById('cl-experience')?.value || '3'
        }
      };
      
      const result = generate(options);
      
      document.getElementById('cl-text').value = result.letter;
      document.getElementById('cl-words').textContent = `${result.wordCount} words`;
      document.getElementById('cl-job-info').textContent = `${result.job.title} at ${result.job.company}`;
      document.getElementById('cl-output').style.display = 'block';
    });
    
    document.getElementById('cl-copy')?.addEventListener('click', () => {
      const text = document.getElementById('cl-text')?.value;
      navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!');
    });
    
    document.getElementById('cl-download')?.addEventListener('click', () => {
      const text = document.getElementById('cl-text')?.value;
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cover-letter.txt';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Downloaded!');
    });
  }

  // === Toast notification ===
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'cl-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  // === Public API ===
  return {
    generate,
    extractJobInfo,
    createUI,
    TEMPLATES
  };
})();

// Export for use
if (typeof module !== 'undefined') {
  module.exports = CoverLetterAI;
}
