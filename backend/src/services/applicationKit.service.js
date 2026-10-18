import { resumeRepository } from '../repositories/resume.repository.js';
import { jobDescriptionRepository } from '../repositories/jobDescription.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { decryptText } from '../utils/encryption.js';
import { geminiClient } from './geminiClient.service.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../config/logger.js';

const STANDARD_TECH_SKILLS = [
  'JavaScript', 'TypeScript', 'React.js', 'Next.js', 'Node.js', 'Express.js',
  'Python', 'FastAPI', 'Django', 'PostgreSQL', 'MongoDB', 'Redis',
  'RESTful APIs', 'GraphQL', 'Docker', 'Kubernetes', 'AWS', 'Google Cloud Platform (GCP)',
  'CI/CD Pipelines', 'Git', 'GitHub Actions', 'Microservices Architecture', 'System Design',
  'Tailwind CSS', 'HTML5', 'CSS3', 'Redux Toolkit', 'Jest', 'Mocha', 'Cypress',
  'SQL', 'Database Optimization', 'Kafka', 'RabbitMQ', 'Agile / Scrum', 'Jira',
  'Performance Optimization', 'High Availability', 'Distributed Systems', 'WebSockets',
  'Linux', 'OAuth 2.0', 'JWT Authentication', 'Terraform', 'Serverless Architecture',
  'Cross-Functional Leadership', 'Code Review', 'Technical Documentation', 'Unit Testing'
];

function extractCandidateHighlights(rawText = '', parsedSections) {
  const highlights = [];
  const text = rawText || '';

  // Extract skills from parsed sections
  if (parsedSections?.skills) {
    if (Array.isArray(parsedSections.skills)) {
      highlights.push(...parsedSections.skills.filter(s => typeof s === 'string' && s.trim()));
    } else if (typeof parsedSections.skills === 'string') {
      const split = parsedSections.skills.split(/[,•|\n]+/).map(s => s.trim()).filter(Boolean);
      highlights.push(...split);
    }
  }

  // Look for strong metrics in raw text
  const metricMatches = text.match(/(\d+%\s+[\w\s]{5,30}|\$[\d,]+[kKmMbB]?\s+[\w\s]{5,30}|\d+x\s+[\w\s]{5,30})/g);
  if (metricMatches && metricMatches.length > 0) {
    highlights.push(...metricMatches.slice(0, 3).map(m => m.trim()));
  }

  return highlights;
}

function buildLinkedInSkills(highlights) {
  const verifiedSet = new Set();
  const result = [];

  // 1. Add detected candidate highlights first
  for (const h of highlights) {
    const clean = h.trim();
    if (clean.length >= 2 && clean.length <= 40 && !clean.includes('\n')) {
      const lower = clean.toLowerCase();
      if (!verifiedSet.has(lower)) {
        verifiedSet.add(lower);
        result.push(clean);
      }
    }
  }

  // 2. Fill up to 50 skills using industry standard tech skills
  for (const skill of STANDARD_TECH_SKILLS) {
    const lower = skill.toLowerCase();
    if (!verifiedSet.has(lower)) {
      verifiedSet.add(lower);
      result.push(skill);
    }
    if (result.length >= 50) break;
  }

  return result.slice(0, 50);
}

function generateHeuristicKit({
  candidateName,
  candidateEmail,
  companyName,
  jobTitle,
  tone,
  highlights,
  hasJd
}) {
  const comp = companyName && companyName !== 'Hiring Team' ? companyName : 'your team';
  const role = jobTitle && jobTitle !== 'Target Role' ? jobTitle : 'this role';
  const skillsList = highlights.slice(0, 4).join(', ') || 'modern full-stack engineering and scalable architecture';
  const topMetric = highlights.find(h => /[\d$%]/.test(h)) || 'delivering high-impact, scalable solutions';
  const top2Skills = highlights.slice(0, 2).join(' & ') || 'modern software engineering';

  // 1. Cover Letter
  let opening = '';
  let bodyParagraph = '';
  let closing = '';

  if (tone === 'executive') {
    opening = `Dear Hiring Leader at ${comp},\n\nI am writing to express my strategic interest in the ${role} position. Throughout my career, I have focused on driving measurable outcomes, scaling high-impact technical initiatives, and translating complex architectural challenges into sustainable business growth.`;
    bodyParagraph = `My background spans hands-on engineering with core competencies in ${skillsList}. In prior roles, I have spearheaded cross-functional delivery, optimized critical systems, and established operational standards that consistently exceeded velocity and reliability benchmarks. What draws me specifically to ${comp} is your commitment to high-standard execution and market impact.`;
    closing = `I welcome the opportunity to discuss how my technical acumen and operational vision can accelerate ${comp}'s core roadmaps this coming year.\n\nSincerely,\n${candidateName}`;
  } else if (tone === 'professional') {
    opening = `Dear Hiring Manager at ${comp},\n\nI am writing to submit my application for the ${role} opening. With proven experience delivering production-grade solutions and a strong foundation in ${skillsList}, I am eager to contribute immediately to ${comp}'s engineering objectives.`;
    bodyParagraph = `In reviewing your position requirements, I noted a strong emphasis on scalable execution and engineering rigor. In my previous work, I successfully engineered robust features, collaborated closely with cross-functional partners, and prioritized code quality and performance optimization. My experience aligns closely with the technical and collaborative challenges your team tackles daily.`;
    closing = `Thank you for your time and consideration. I would welcome the chance to interview and discuss how my skills and work ethic can support ${comp}.\n\nWarm regards,\n${candidateName}`;
  } else {
    // confident & modern (default)
    opening = `Hi ${companyName !== 'Hiring Team' ? companyName + ' Team' : 'Hiring Team'},\n\nI’m reaching out because the ${role} opportunity caught my attention. With hands-on expertise across ${skillsList}, I build reliable, high-performance systems and love solving non-trivial product challenges.`;
    bodyParagraph = `What excites me about ${comp} is the opportunity to solve high-leverage problems. In my previous work, I took end-to-end ownership of product milestones, optimized system bottlenecks, and shipped features that directly moved business metrics. I thrive in collaborative, fast-paced environments where engineering excellence directly translates to customer satisfaction.`;
    closing = `I’d love to connect for 10-15 minutes to share how my background can help ${comp} ship faster and scale seamlessly.\n\nBest regards,\n${candidateName}`;
  }

  // 2. Targeted Outreach Variations
  // Recruiter InMail
  const recruiterInMail = `Hi [Recruiter Name] — Hope your week is going great!\n\nI noticed the ${role} opening at ${comp} and wanted to reach out directly. With deep hands-on experience in ${skillsList}, I’ve spent the past few years building scalable solutions and delivering measurable business outcomes (${topMetric}).\n\nI’d love to learn more about the team's top priorities for this quarter. Would you be open to a brief 10-minute introductory chat sometime this week?\n\nBest,\n${candidateName}\n[Portfolio / LinkedIn Link]`;

  // Hiring Manager Direct Cold Pitch (High Conversion)
  const hiringManagerPitch = `Hi [Hiring Manager Name] — Hope you're having a productive week!\n\nI came across the ${role} position on your team at ${comp} and wanted to send a quick note. My background centers around ${skillsList}, with an emphasis on ${topMetric}.\n\nI respect your time, so I’ll keep this brief: would you be open to a 5-minute chat this Thursday or Friday to discuss how my experience shipping scalable features can immediately support your current roadmap?\n\nBest regards,\n${candidateName}\n[LinkedIn / GitHub Link]`;

  // Alumni / Peer Referral Request
  const alumniReferralNote = `Hi [Alumni Name] — Hope all is well!\n\nI noticed you're currently working as a [Their Role] at ${comp}. As a fellow tech community member, I’ve been following ${comp}'s work with great admiration.\n\nI’m preparing to apply for the ${role} role and would love to ask you 1-2 quick questions about the engineering culture and day-to-day workflow. If you feel comfortable after our brief chat, I’d also be deeply grateful for an internal referral.\n\nNo worries at all if you're swamped, but I'd really value your perspective!\n\nWarmly,\n${candidateName}`;

  // Post-Application Follow-Up Note (Day 5)
  const followUpNote = `Hi [Recruiter / Hiring Lead],\n\nI hope your week is off to a great start! I recently submitted my application for the ${role} opening at ${comp} (Application Ref: Online Portal).\n\nGiven my experience with ${skillsList} and proven track record of ${topMetric}, I am extremely excited about the chance to contribute to ${comp}.\n\nI wanted to reiterate my enthusiastic interest and check if there are any additional materials I can share to assist your review.\n\nThank you for your time!\n\nBest,\n${candidateName}`;

  // LinkedIn Connection Note (Strictly <= 300 characters for LinkedIn connection requests)
  let linkedInConnectionNote = `Hi [Name] — I noticed your work leading engineering at ${comp}. As a ${role} with focus in ${top2Skills}, I'd love to connect and follow your team's journey! Best, ${candidateName}`;
  if (linkedInConnectionNote.length > 295) {
    linkedInConnectionNote = `Hi [Name] — I noticed your work at ${comp}. As a ${role} with expertise in ${top2Skills}, I'd love to connect! Best, ${candidateName}`.slice(0, 295);
  }

  // 3. LinkedIn Profile Synchronizer
  const linkedInHeadlines = [
    `${role} | ${skillsList.split(', ').slice(0, 3).join(' • ')} | Building High-Impact Scalable Systems`,
    `${role} @ Scale | ${top2Skills} | Performance, Cloud & Modern Web Architecture`,
    `${role} | Full-Stack Problem Solver | Passionate About Scalability, Clean Code & Product Velocity`
  ];

  const linkedInAbout = `Hi there! 👋 I am a ${role} dedicated to building high-performance, resilient, and user-centric software systems.

Over the past several years, I have engineered production solutions, optimized architectural bottlenecks, and collaborated across cross-functional teams to deliver measurable business outcomes.

⚡ Core Competencies:
• Languages & Frameworks: ${highlights.slice(0, 4).join(', ') || 'JavaScript, TypeScript, React, Node.js'}
• Cloud & Architecture: Microservices, REST APIs, Scalable Databases, CI/CD
• Engineering Rigor: Unit Testing, Clean Code, Agile Execution, Performance Tuning

🚀 Highlight Impact:
• ${topMetric}
• Passionate about turning complex business requirements into intuitive, elegant software products.

📫 Always open to connecting with fellow engineers, founders, and innovators. Feel free to reach out directly: ${candidateEmail || '[Your Email Here]'}`;

  const linkedInSkills = buildLinkedInSkills(highlights);

  // 4. Subject Lines
  const subjectLines = [
    `Application: ${role} — ${candidateName}`,
    `${role} opening @ ${comp} — Experienced in ${highlights[0] || 'Engineering'}`,
    `Quick note regarding the ${role} role at ${comp}`
  ];

  return {
    companyName,
    jobTitle,
    tone,
    coverLetter: `${opening}\n\n${bodyParagraph}\n\n${closing}`,
    recruiterInMail,
    hiringManagerPitch,
    alumniReferralNote,
    followUpNote,
    linkedInConnectionNote,
    linkedInHeadlines,
    linkedInAbout,
    linkedInSkills,
    subjectLines,
    keyHighlightPoints: [
      `Direct technical alignment with ${skillsList}`,
      `Demonstrated ownership from requirement gathering to production deployment`,
      `Track record of measurable efficiency improvements (${topMetric})`
    ],
    generatedBy: 'heuristic-engine'
  };
}

export const applicationKitService = {
  /**
   * Generates a tailored Cover Letter + Multi-Persona Outreach + LinkedIn Profile Sync Kit
   * @param {object} params
   * @param {string} params.resumeId
   * @param {string} params.userId
   * @param {string} [params.jobDescriptionText]
   * @param {string} [params.companyName]
   * @param {string} [params.jobTitle]
   * @param {'confident'|'professional'|'executive'} [params.tone]
   */
  async generateKit({
    resumeId,
    userId,
    jobDescriptionText = '',
    companyName = 'Hiring Team',
    jobTitle = 'Target Role',
    tone = 'confident'
  }) {
    // 1. Verify and fetch resume
    const resume = await resumeRepository.findByIdForUser(resumeId, userId);
    if (!resume) throw ApiError.notFound('Resume not found.');

    const user = await userRepository.findById(userId);
    const candidateName = user?.name || resume.display_name?.replace(/\.[^/.]+$/, '') || 'Candidate';
    const candidateEmail = user?.email || '';

    let rawText = '';
    try {
      rawText = decryptText(resume.raw_text_encrypted) || '';
    } catch (e) {
      logger.warn('Could not decrypt resume text for application kit', { error: e.message });
    }

    // 2. Determine target Job Description
    let targetJd = jobDescriptionText.trim();
    if (!targetJd) {
      const attachedJd = await jobDescriptionRepository.findByResumeId(resumeId);
      if (attachedJd?.raw_text) {
        targetJd = attachedJd.raw_text;
      }
    }

    const highlights = extractCandidateHighlights(rawText, resume.parsed_sections);

    // 3. Try Gemini 2.0 Flash if configured
    if (geminiClient.isConfigured()) {
      const prompt = `You are an elite executive career coach and technical hiring expert at ResumeIQ.
Generate a comprehensive, high-converting Job Application & Outreach Suite consisting of:
1. Tailored Cover Letter (3 paragraphs, strictly no generic filler, citing candidate's real background and connecting to the target job).
2. Recruiter InMail message (100-140 words, punchy, polite, clear low-friction call to action).
3. Hiring Manager Direct Cold Pitch (80-120 words, metric-driven, asking for a brief 5-min coffee chat).
4. Alumni / Peer Referral Request (warm, collegial, asking about culture and requesting an internal referral).
5. Post-Application Follow-Up Note (Day 5 follow-up checking in on the submitted application).
6. LinkedIn Connection Request Note (STRICTLY UNDER 300 CHARACTERS including spaces, engaging, mentioning role and shared domain).
7. 3 Optimized LinkedIn Headlines (varying between role-focused, scale/metric-focused, and value-focused).
8. LinkedIn "About" Summary (engaging 1st person narrative with bullet emojis for competencies and metrics).
9. 3 high-open-rate Email / InMail Subject Lines.
10. 3 Key Value Highlights connecting the candidate's experience to the target role.

Target Role Details:
- Job Title: ${jobTitle}
- Target Company: ${companyName}
- Selected Tone: ${tone} (Options: confident = modern/impactful, professional = structured/corporate, executive = strategic/leadership)
- Candidate Name: ${candidateName}

Target Job Description:
"""
${targetJd.slice(0, 4500) || 'General requirements for ' + jobTitle + ' role requiring technical excellence, ownership, and measurable impact.'}
"""

Candidate Resume Background & Snippets:
"""
${rawText.slice(0, 6000) || highlights.join(', ')}
"""

Return ONLY a valid JSON object matching this schema:
{
  "companyName": "${companyName}",
  "jobTitle": "${jobTitle}",
  "tone": "${tone}",
  "coverLetter": "Full tailored cover letter string with double line breaks between paragraphs",
  "recruiterInMail": "100-140 word LinkedIn recruiter outreach string",
  "hiringManagerPitch": "80-120 word hiring manager direct pitch string",
  "alumniReferralNote": "70-100 word warm alumni referral request string",
  "followUpNote": "60-90 word post-application follow-up note string",
  "linkedInConnectionNote": "Under 300 characters connection message string",
  "linkedInHeadlines": ["Headline option 1", "Headline option 2", "Headline option 3"],
  "linkedInAbout": "Complete 1st-person LinkedIn About story string",
  "subjectLines": ["Subject line 1", "Subject line 2", "Subject line 3"],
  "keyHighlightPoints": ["Key point 1", "Key point 2", "Key point 3"]
}`;

      try {
        const aiResult = await geminiClient.generateJson(prompt, { temperature: 0.25, maxOutputTokens: 3500 });
        if (
          aiResult &&
          aiResult.coverLetter &&
          aiResult.recruiterInMail &&
          Array.isArray(aiResult.subjectLines)
        ) {
          // Ensure linkedInConnectionNote stays under 300 characters
          let connNote = aiResult.linkedInConnectionNote || `Hi [Name] — I noticed your work leading engineering at ${companyName}. As a ${jobTitle}, I'd love to connect! Best, ${candidateName}`;
          if (connNote.length > 295) connNote = connNote.slice(0, 295);

          return {
            ...aiResult,
            linkedInConnectionNote: connNote,
            linkedInSkills: buildLinkedInSkills(highlights),
            generatedBy: env.GEMINI_MODEL || 'gemini'
          };
        }
      } catch (err) {
        logger.warn('Gemini application kit generation failed, falling back to heuristic engine', { error: err.message });
      }
    }

    // 4. Fallback to algorithmic generator
    return generateHeuristicKit({
      candidateName,
      candidateEmail,
      companyName,
      jobTitle,
      tone,
      highlights,
      hasJd: Boolean(targetJd)
    });
  }
};
