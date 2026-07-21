// AutoFill Pro v1.4 - AI Enhanced Parser
(() => {
  'use strict';

  // ==================== CONFIG ====================
  const AI_CONFIG = {
    provider: 'openai', // 'openai' or 'anthropic'
    model: 'gpt-4o-mini',
    endpoint: 'https://api.openai.com/v1/chat/completions',
  };

  // ==================== AI PARSER ====================
  async function parseWithAI(text, apiKey) {
    if (!apiKey) return null;

    const prompt = `Extract structured data from this resume/CV text. Return ONLY a JSON object with these fields (empty string if not found):

{
  "fullName": "string",
  "email": "string",
  "phone": "string (international format)",
  "address": "string (city, country)",
  "linkedin": "string (full URL)",
  "github": "string (full URL)",
  "website": "string (full URL)",
  "summary": "string (2-3 sentence professional summary)",
  "skills": "string (comma-separated list)",
  "experience": "string (most recent job title + company + 1 line description)",
  "education": "string (degree + university + year)",
  "dateOfBirth": "string (if found)",
  "nationality": "string (if found)",
  "visaStatus": "string (if found)"
}

Resume text:
---
${text.substring(0, 4000)}
---

Return ONLY the JSON object, no explanation.`;

    try {
      const response = await fetch(AI_CONFIG.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: AI_CONFIG.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        console.error('AI API error:', response.status);
        return null;
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      console.error('AI parsing failed:', err);
    }
    return null;
  }

  // ==================== AI FORM FILLER ====================
  async function matchFieldsWithAI(formHTML, profileData, apiKey) {
    if (!apiKey) return null;

    const prompt = `You are a form-filling assistant. Given a web form's HTML structure and a user's profile data, determine which profile field maps to which form input.

Form HTML (simplified):
${formHTML.substring(0, 3000)}

User Profile:
${JSON.stringify(profileData, null, 2)}

Return a JSON object mapping form field identifiers to profile data values:
{
  "field_id_or_name_or_placeholder": "value to fill"
}

Only include fields that have a clear match. Return ONLY the JSON object.`;

    try {
      const response = await fetch(AI_CONFIG.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: AI_CONFIG.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 1500
        })
      });

      if (!response.ok) return null;

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error('AI form matching failed:', err);
    }
    return null;
  }

  // ==================== AI COVER LETTER ====================
  async function generateCoverLetter(profileData, jobDescription, apiKey) {
    if (!apiKey) return null;

    const prompt = `Write a professional cover letter in the same language as the job description.

Applicant Profile:
${JSON.stringify(profileData, null, 2)}

Job Description:
${jobDescription.substring(0, 2000)}

Write a concise, professional cover letter (3-4 paragraphs). Be specific about matching skills to job requirements.`;

    try {
      const response = await fetch(AI_CONFIG.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: AI_CONFIG.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 1500
        })
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.choices[0]?.message?.content || null;
    } catch (err) {
      console.error('AI cover letter failed:', err);
    }
    return null;
  }

  // Export for use in popup
  window.AutoFillAI = {
    parseWithAI,
    matchFieldsWithAI,
    generateCoverLetter,
    AI_CONFIG
  };

  console.log('AutoFill Pro v1.4: AI module loaded ✅');
})();
