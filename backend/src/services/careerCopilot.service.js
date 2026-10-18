import { resumeRepository } from '../repositories/resume.repository.js';
import { analysisRepository } from '../repositories/analysis.repository.js';
import { jobDescriptionRepository } from '../repositories/jobDescription.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { decryptText } from '../utils/encryption.js';
import { geminiClient } from './geminiClient.service.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export const careerCopilotService = {
  /**
   * Main conversational handler for ResumeIQ Career Copilot.
   * @param {object} params
   * @param {string} params.userId
   * @param {string} params.message
   * @param {string} [params.resumeId]
   * @param {Array<{ role: 'user' | 'assistant', content: string }>} [params.conversationHistory]
   * @param {object} [params.context]
   */
  async chat({ userId, message, resumeId, conversationHistory = [], context = {} }) {
    // 1. Gather Candidate & Active Resume Context
    let resumeContext = null;
    let candidateName = 'Candidate';

    try {
      const user = await userRepository.findById(userId);
      // Requirement: Resu says username if set by user, otherwise default name
      if (user?.username && typeof user.username === 'string' && user.username.trim().length > 0) {
        candidateName = user.username.trim();
      } else if (user?.name && typeof user.name === 'string' && user.name.trim().length > 0) {
        candidateName = user.name.trim();
      }
    } catch (err) {
      logger.warn('Failed to fetch user name for copilot context', { error: err.message });
    }

    if (context?.username && typeof context.username === 'string' && context.username.trim().length > 0) {
      candidateName = context.username.trim();
    } else if (candidateName === 'Candidate' && context?.name && typeof context.name === 'string' && context.name.trim().length > 0) {
      candidateName = context.name.trim();
    }

    if (resumeId) {
      try {
        const resume = await resumeRepository.findByIdForUser(resumeId, userId);
        if (resume) {
          let rawText = '';
          if (resume.raw_text_encrypted) {
            try {
              rawText = decryptText(resume.raw_text_encrypted);
            } catch (decErr) {
              logger.warn('Could not decrypt resume text for copilot context', { error: decErr.message });
            }
          }

          // Fetch latest completed analysis
          const latestAnalysis = await analysisRepository.findLatestCompleted(resumeId);

          // Fetch active JD if available
          let jdText = context.jobDescription || '';
          if (!jdText) {
            const jd = await jobDescriptionRepository.findByResumeId(resumeId);
            if (jd?.raw_text) jdText = jd.raw_text;
          }

          resumeContext = {
            displayName: resume.display_name || resume.file_name,
            versionNumber: resume.version_number,
            parsedSections: resume.parsed_sections || {},
            rawTextSample: rawText ? rawText.slice(0, 6000) : '',
            atsScore: latestAnalysis?.ats_compatibility_score ?? null,
            keywordScore: latestAnalysis?.keyword_match_score ?? null,
            missingKeywords: latestAnalysis?.missing_keywords || [],
            matchedKeywords: latestAnalysis?.matched_keywords || [],
            issues: latestAnalysis?.issues || [],
            jobDescriptionSample: jdText ? jdText.slice(0, 4000) : '',
          };
        }
      } catch (err) {
        logger.warn('Failed to load resume context for career copilot', { error: err.message });
      }
    }

    // 2. Dual-Engine Generation: Try Gemini First
    if (geminiClient.isConfigured()) {
      try {
        const prompt = buildGeminiCopilotPrompt({
          candidateName,
          message,
          resumeContext,
          conversationHistory,
          context,
        });

        const reply = await geminiClient.generateText(prompt, {
          temperature: 0.6,
          maxOutputTokens: 2500,
        });

        if (reply && reply.trim().length > 0) {
          const followUps = extractSuggestedFollowUps(reply, message, resumeContext);
          return {
            reply: cleanMarkdownReply(reply),
            suggestedFollowUps: followUps,
            contextApplied: resumeContext
              ? {
                  resumeName: resumeContext.displayName,
                  version: resumeContext.versionNumber,
                  atsScore: resumeContext.atsScore,
                  missingKeywordsCount: resumeContext.missingKeywords.length,
                }
              : null,
            generatedBy: env.GEMINI_MODEL || 'gemini',
          };
        }
      } catch (geminiErr) {
        logger.warn('Gemini copilot generation failed; falling back to heuristic expert engine', {
          error: geminiErr.message,
        });
      }
    }

    // 3. Heuristic Expert Engine Fallback
    const heuristicResult = generateHeuristicCopilotResponse({
      candidateName,
      message,
      resumeContext,
      conversationHistory,
      context,
    });

    return {
      reply: heuristicResult.reply,
      suggestedFollowUps: heuristicResult.suggestedFollowUps,
      contextApplied: resumeContext
        ? {
            resumeName: resumeContext.displayName,
            version: resumeContext.versionNumber,
            atsScore: resumeContext.atsScore,
            missingKeywordsCount: resumeContext.missingKeywords.length,
          }
        : null,
      generatedBy: 'heuristic-expert-engine',
    };
  },
};

/**
 * Builds the comprehensive Gemini prompt incorporating candidate profile and context.
 */
function buildGeminiCopilotPrompt({
  candidateName,
  message,
  resumeContext,
  conversationHistory,
  context,
}) {
  const historySnippet = conversationHistory
    .slice(-6)
    .map((turn) => `${turn.role === 'user' ? 'User' : 'Copilot'}: ${turn.content}`)
    .join('\n\n');

  let contextSnippet = 'No specific resume document attached.';
  if (resumeContext) {
    contextSnippet = `
Target Document: ${resumeContext.displayName} (v${resumeContext.versionNumber}.0)
ATS Format Score: ${resumeContext.atsScore !== null ? `${resumeContext.atsScore}/100` : 'Not yet analyzed'}
Semantic Keyword Match Score: ${resumeContext.keywordScore !== null ? `${resumeContext.keywordScore}%` : 'Not yet analyzed'}
Top Missing Keywords (${resumeContext.missingKeywords.length}): ${resumeContext.missingKeywords.slice(0, 12).join(', ') || 'None identified'}
Top Matched Keywords (${resumeContext.matchedKeywords.length}): ${resumeContext.matchedKeywords.slice(0, 10).join(', ') || 'None'}
ATS Formatting Issues Detected: ${resumeContext.issues.length > 0 ? resumeContext.issues.map((i) => `[${i.severity?.toUpperCase()}] ${i.title}: ${i.message}`).join('; ') : 'Zero critical ATS parsing issues'}
Parsed Skills in Resume: ${Array.isArray(resumeContext.parsedSections?.skills) ? resumeContext.parsedSections.skills.join(', ') : 'Not extracted'}
Resume Excerpt:
"${resumeContext.rawTextSample}"
${resumeContext.jobDescriptionSample ? `Target Job Description Excerpt:\n"${resumeContext.jobDescriptionSample}"` : ''}
`;
  }

  return `You are Resu — the brilliant, warm, and executive AI career companion for ResumeIQ (former FAANG principal talent partner and world-class resume authority).

Candidate Name / Username: ${candidateName}
Candidate's Target Context:
${contextSnippet}

Recent Conversation History:
${historySnippet || 'None (first message in session)'}

Candidate's Prompt:
"${message}"

Instructions:
1. Candidate Personalization: You are Resu ✨. Always address the candidate as "Hi ${candidateName}!" (or "Hey ${candidateName}!") — use their designated name/username "${candidateName}" throughout your advice and greetings.
2. Provide a direct, highly practical, and executive-level response.
3. Use GitHub-flavored Markdown formatting: bold highlights, numbered steps or bullet points, and code blocks for revised resume bullets or scripts.
4. If the candidate asks for resume bullet improvements, apply the STAR / Google X-Y-Z formula: [Strong Action Verb] + [Context/Scale] + [Action/Tools] + [Quantified Impact/Metric].
5. If they ask about ATS scores or keywords, refer specifically to their actual missing keywords or issues listed in the context above.
6. If they ask about interviews, provide realistic questions or exemplary STAR model answers tailored to their skills.
7. Keep the tone encouraging, ultra-professional, and pragmatic. Avoid generic fluff.
8. End your response with 2 to 3 concise suggested follow-up questions or actions on a new line starting with "Follow-ups: " separated by semicolons.`;
}

/**
 * Heuristic Expert Rule-Engine for offline/fallback mode.
 */
function generateHeuristicCopilotResponse({
  candidateName,
  message,
  resumeContext,
}) {
  const lower = message.toLowerCase().trim();

  // Pattern 0: Direct Greetings (hi / hello / hey / resu)
  if (
    lower === 'hi' ||
    lower === 'hello' ||
    lower === 'hey' ||
    lower.startsWith('hi ') ||
    lower.startsWith('hello ') ||
    lower.startsWith('hey ') ||
    lower === 'resu' ||
    lower.startsWith('resu ') ||
    lower.includes('who are you')
  ) {
    const resumeName = resumeContext?.displayName || 'your uploaded resume';
    const atsScore =
      resumeContext?.atsScore !== null && resumeContext?.atsScore !== undefined
        ? `${resumeContext.atsScore}/100`
        : 'ready for scan';

    return {
      reply: `### 👋 Hi ${candidateName}! I'm Resu ✨

I'm your **personal AI career companion and resume advisor** for ResumeIQ! I have real-time visibility into your active document (**${resumeName}**, ATS status: **${atsScore}**).

Here is how I can help you today:
1. **ATS Score Optimization:** Weave missing keywords into your experience naturally without keyword stuffing.
2. **STAR & Google X-Y-Z Bullet Point Rewriting:** Transform plain job duties into high-impact, quantified engineering bullets.
3. **Behavioral & Technical Interview Preparation:** Practice tailored questions with model answers.
4. **Salary & Compensation Tactics:** Tactical scripts to maximize your total compensation.

What would you like to work on right now, ${candidateName}? Ask me anything or select a prompt below!`,
      suggestedFollowUps: [
        'How do I boost my ATS score right now?',
        'Rewrite my experience bullets with the STAR formula',
        'What will recruiters ask in my first interview screen?',
      ],
    };
  }

  // Pattern 1: ATS Score / Missing Keywords / Formatting Gap
  if (
    lower.includes('ats') ||
    lower.includes('score') ||
    lower.includes('format') ||
    lower.includes('warning') ||
    lower.includes('audit')
  ) {
    const score = resumeContext?.atsScore ?? 78;
    const missing = resumeContext?.missingKeywords || ['Docker', 'Kubernetes', 'CI/CD Pipelines', 'System Design'];
    const issues = resumeContext?.issues || [];

    const issueText =
      issues.length > 0
        ? issues.map((iss) => `• **${iss.title}**: ${iss.message}`).join('\n')
        : '• **Layout Cleanliness**: Zero critical layout errors detected. Keep standard 1-inch margins and clear section headers.';

    return {
      reply: `### 📊 ATS Audit & Optimization Strategy for ${candidateName}

Your current document has an **ATS Format Score of ${score}/100**${resumeContext?.keywordScore ? ` with a **${resumeContext.keywordScore}% Keyword Match**` : ''}.

#### 1. Critical Gaps to Address:
${issueText}

#### 2. High-Impact Missing Keywords:
The automated screening filters are specifically looking for these semantic proficiencies:
${missing.slice(0, 8).map((k) => `• \`${k}\``).join('\n')}

> **⚡ Pro Tip:** Do NOT create a keyword stuffing block at the bottom of your resume (modern ATS parsers like Workday and Taleo penalize this). Instead, weave these exact terms into your **Work Experience bullets** where you solved real problems using them.

Would you like me to rewrite your most recent job experience bullets to naturally incorporate these missing keywords?`,
      suggestedFollowUps: [
        'Rewrite my experience bullets with missing keywords',
        'How do ATS parsers scan multi-column resumes?',
        'What is the difference between Taleo and Workday ATS?',
      ],
    };
  }

  // Pattern 2: Bullet Points / STAR Formula / Experience Rewriting
  if (
    lower.includes('bullet') ||
    lower.includes('rewrite') ||
    lower.includes('experience') ||
    lower.includes('star') ||
    lower.includes('work') ||
    lower.includes('xyz')
  ) {
    return {
      reply: `### ✍️ High-Impact STAR Bullet Rewriting Framework

Top-tier tech recruiters and hiring executives use the **Google X-Y-Z formula**:
> *"Accomplished [X] as measured by [Y], by doing [Z]."*

Here are **3 battle-tested, ATS-optimized revisions** modeled for high-caliber impact:

\`\`\`markdown
• Architected and deployed an asynchronous event-driven microservice using Node.js, Redis, and PostgreSQL, slashing API p99 latency from 420ms to 95ms (77% reduction) under 40k req/min peak throughput.
• Spearheaded automated CI/CD deployment pipelines using Docker and GitHub Actions, shortening engineering release cycles from bi-weekly to daily with zero rollbacks over 9 consecutive months.
• Orchestrated database query refactoring and connection pooling across 14 relational tables, cutting AWS RDS compute overhead by 38% and saving $24,000 annually.
\`\`\`

#### Key Pillars Applied:
1. **Power Action Verbs:** *Architected*, *Spearheaded*, *Orchestrated* (eliminates weak verbs like "Responsible for" or "Assisted with").
2. **Quantified Delta:** Real metrics (*77% reduction*, *40k req/min*, *$24k savings*).
3. **Toolchain Integration:** Demonstrates real hands-on technical architecture.

Would you like me to adapt these bullets for a specific project or role you worked on?`,
      suggestedFollowUps: [
        'Adapt these bullets for Full Stack Web Development',
        'Help me quantify impact when I do not have exact metrics',
        'Rewrite my summary section for a Senior role',
      ],
    };
  }

  // Pattern 3: Interview Preparation / Behavioral / Technical
  if (
    lower.includes('interview') ||
    lower.includes('question') ||
    lower.includes('prep') ||
    lower.includes('mock') ||
    lower.includes('behavioral')
  ) {
    return {
      reply: `### 🎙️ Executive Interview Coaching & Expected Questions

Based on your target profile, here are the **top 4 high-probability questions** recruiters and engineering hiring managers will probe:

#### 1. System Scale & Latency (Technical)
> *"Can you walk me through the most complex architectural bottleneck you resolved in production, and how you verified performance under load?"*
• **Recruiter Objective:** Testing whether you understand trade-offs, caching layers (Redis/Memcached), and indexing strategies.

#### 2. Conflict & Technical Consensus (Behavioral - STAR)
> *"Tell me about a time you strongly disagreed with a senior engineer or product manager on architectural direction. How did you handle it?"*
• **Recruiter Objective:** Looking for maturity, data-driven persuasion, and collaborative ownership ("Disagree and commit").

#### 3. Failure & Incident Response
> *"Describe a critical production outage or bug that bypassed testing. What was your immediate mitigation and what systemic safeguards did you introduce?"*
• **Recruiter Objective:** Accountability (*"I"* vs *"They"*), blameless post-mortem discipline.

#### 4. Project Ownership & Ambiguity
> *"Give me an example of an initiative where the requirements were ambiguous or changing rapidly. How did you drive clarity and ship on time?"*

> **💡 Next Step:** You can practice speaking your answers out loud in our **Mock Interview** tab with real-time AI speech pacing and STAR scoring!`,
      suggestedFollowUps: [
        'Give me a model 10/10 STAR answer for question #1',
        'How should I explain a career transition or gap?',
        'What questions should I ask the interviewer at the end?',
      ],
    };
  }

  // Pattern 4: Salary Negotiation / Compensation / Offers
  if (
    lower.includes('salary') ||
    lower.includes('negotiat') ||
    lower.includes('offer') ||
    lower.includes('compensation') ||
    lower.includes('equity')
  ) {
    return {
      reply: `### 💰 Tactical Salary & Compensation Negotiation Blueprint

Recruiters negotiate daily; candidates do it every 2-3 years. Follow these **4 executive negotiation rules**:

#### Rule 1: Never Anchor First in Early Screens
When asked: *"What are your salary expectations?"*
> **Script:** *"I am primarily focused on finding the right technical and cultural fit where I can deliver high leverage. Once we align on the scope and impact of the role, I am confident we can agree on a competitive package aligned with market benchmarks."*

#### Rule 2: Anchor on Total Compensation (TC)
Always break down the offer into:
1. **Base Salary** (Guaranteed cash flow)
2. **Annual Bonus** (Performance / Company target)
3. **Equity / RSUs** (Vesting schedule & upside)
4. **Sign-on Bonus** (One-time liquidity — easiest lever for recruiters to grant)

#### Rule 3: Use the Enthusiastic Counter
When the offer comes in:
> **Script:** *"I am genuinely thrilled about the team and the roadmap. However, based on my specialized expertise in [Core Tech Stack] and competing opportunities in the pipeline, I was anticipating a base in the range of $X to $Y (or a sign-on of $Z). If we can bridge that delta, I am ready to sign immediately."*`,
      suggestedFollowUps: [
        'How do I counter an offer without sounding aggressive?',
        'What should I ask about startup stock options vs public RSUs?',
        'How do I evaluate benefits and 401k match in total comp?',
      ],
    };
  }

  // Pattern 5: FAANG / Big Tech Strategy
  if (
    lower.includes('faang') ||
    lower.includes('google') ||
    lower.includes('meta') ||
    lower.includes('amazon') ||
    lower.includes('netflix') ||
    lower.includes('apple')
  ) {
    return {
      reply: `### 🏛️ FAANG & Tier-1 Tech Screening Playbook

Tier-1 tech companies evaluate candidates across **4 strict screening pillars**:

| Pillar | Weight | What Recruiters Specifically Screen For |
| :--- | :--- | :--- |
| **System Scale & Distributed Systems** | 35% | Handling high concurrency, caching, partition tolerance, and microservices |
| **Quantified Impact (Metrics)** | 30% | Clear dollar savings, latency decreases, or percentage throughput spikes |
| **Algorithmic & Engineering Rigor** | 20% | Clean modular code, test coverage, and computational complexity |
| **Leadership Principles / Ownership** | 15% | Cross-functional initiative, mentoring, and technical vision |

#### 3 Quick Actions for Your Resume Right Now:
1. **Eliminate Vague Bullets:** Change "Worked on backend APIs" to *"Engineered high-throughput RESTful endpoints handling 15,000+ RPS with 99.98% uptime."*
2. **Add Architectural Scope:** Explicitly mention database technology, message queues (Kafka, RabbitMQ, SQS), or cloud infra.
3. **Highlight Scale:** If you don't have millions of users, highlight throughput, query volume, or speed of delivery.`,
      suggestedFollowUps: [
        'What are Amazon 14 Leadership Principles interview questions?',
        'How do I pass Google technical screening?',
        'Review my resume for FAANG fit',
      ],
    };
  }

  // Default: Conversational Career Advisor Greeting & Overview
  const resumeName = resumeContext?.displayName || 'your uploaded resume';
  const atsScore = resumeContext?.atsScore ? `${resumeContext.atsScore}%` : 'ready for analysis';

  return {
    reply: `### 👋 Hi ${candidateName}! I'm Resu ✨

I'm your personal AI career companion for ResumeIQ. I've analyzed your current workspace context (**${resumeName}**, ATS status: **${atsScore}**).

Here is how I can help you land your dream interview:
1. **ATS Score Optimization:** Weave missing keywords into your experience naturally without keyword stuffing.
2. **STAR & Google X-Y-Z Bullet Point Rewriting:** Transform plain job duties into high-impact, quantified engineering bullets.
3. **Mock Interview Preparation:** Tailored behavioral and technical questions with 10/10 model answers.
4. **Offer & Salary Negotiation:** Tactical scripts to maximize your total compensation.
5. **Target Role Alignment:** Match your resume against any job description.

What would you like to work on together today? Ask me anything or select a prompt below!`,
    suggestedFollowUps: [
      'How do I boost my ATS score right now?',
      'Rewrite my top experience bullets with the STAR formula',
      'What questions will recruiters ask based on my resume?',
      'Help me tailor my resume for a Senior Software Engineer role',
    ],
  };
}

/**
 * Cleans potential raw markers from LLM response.
 */
function cleanMarkdownReply(rawText) {
  return rawText
    .replace(/^```markdown/i, '')
    .replace(/```$/, '')
    .trim();
}

/**
 * Extracts suggested follow-up chips from text or fallback.
 */
function extractSuggestedFollowUps(reply, userMessage, resumeContext) {
  const followUpMatch = reply.match(/Follow-ups:\s*(.+)$/im);
  if (followUpMatch && followUpMatch[1]) {
    const items = followUpMatch[1]
      .split(/[;\n]/)
      .map((s) => s.trim().replace(/^[-•*]\s*/, ''))
      .filter((s) => s.length > 5 && s.length < 80);
    if (items.length > 0) return items.slice(0, 3);
  }

  return [
    'Can you give me an example with quantifiable numbers?',
    'How do I tailor this for a Senior role?',
    'What should I practice next?',
  ];
}
