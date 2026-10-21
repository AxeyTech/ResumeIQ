import { geminiClient } from './geminiClient.service.js';
import { logger } from '../config/logger.js';

/**
 * Weak starters to strip during rule-based transformation
 */
const WEAK_STARTERS = [
  /^(i\s+)?(was\s+)?(worked\s+on|working\s+on)\s+/i,
  /^(i\s+)?(was\s+)?(responsible\s+for|handled|handling)\s+/i,
  /^(i\s+)?(helped\s+with|assisted\s+in|assisted\s+with)\s+/i,
  /^(i\s+)?(did|made|created|built)\s+/i,
  /^(participated\s+in|contributed\s+to)\s+/i,
  /^(involved\s+in|tasked\s+with)\s+/i,
];

function sanitizeCoreStatement(text = '') {
  let cleaned = (text || '').trim();
  // Strip bullet markers if user copied them
  cleaned = cleaned.replace(/^[\s•\-\*]+\s*/, '');
  for (const pattern of WEAK_STARTERS) {
    if (pattern.test(cleaned)) {
      cleaned = cleaned.replace(pattern, '');
      break;
    }
  }
  // Ensure lowercase start for combining with action verbs
  return cleaned ? cleaned.charAt(0).toLowerCase() + cleaned.slice(1) : '';
}

function generateAlgorithmicFallback(bullet, targetKeywords = [], jobTitle = 'Professional') {
  const core = sanitizeCoreStatement(bullet);
  const kwList = Array.isArray(targetKeywords) ? targetKeywords.filter(Boolean) : [];
  const primaryKw = kwList[0] || '';
  const secondaryKw = kwList[1] || '';

  // 1. Metric / Impact Focused
  const kwClause = primaryKw ? ` leveraging ${primaryKw}` : '';
  const metricBullet = `Architected and optimized ${core}${kwClause}, driving a 30% reduction in turnaround time and boosting operational efficiency across the workflow.`;

  // 2. Technical Depth & Architecture
  const techClause = kwList.length > 0 ? ` incorporating ${kwList.slice(0, 3).join(', ')}` : '';
  const techBullet = `Engineered robust, production-grade solutions for ${core}${techClause}, implementing automated testing and CI/CD best practices to achieve 99.9% reliability.`;

  // 3. Ownership & Collaboration
  const collabClause = secondaryKw ? ` with high-standard ${secondaryKw} integration` : '';
  const collabBullet = `Spearheaded end-to-end execution of ${core}${collabClause}, collaborating with cross-functional stakeholders to deliver measurable business impact ahead of schedule.`;

  return {
    originalBullet: bullet,
    variants: [
      {
        type: 'metric',
        label: 'Metric & Impact Focused',
        bullet: metricBullet,
        actionVerb: 'Architected',
        highlightedKeywords: kwList.slice(0, 2),
        improvementTip: 'Adds quantifiable percentage metrics and business ROI that recruiters and ATS filters prioritize.',
      },
      {
        type: 'technical',
        label: 'Technical Depth & Architecture',
        bullet: techBullet,
        actionVerb: 'Engineered',
        highlightedKeywords: kwList.slice(0, 3),
        improvementTip: 'Highlights system design, technical standards, and engineering rigor for hiring managers.',
      },
      {
        type: 'leadership',
        label: 'Ownership & Delivery',
        bullet: collabBullet,
        actionVerb: 'Spearheaded',
        highlightedKeywords: kwList.slice(1, 3),
        improvementTip: 'Demonstrates cross-functional collaboration, ownership, and adherence to production timelines.',
      },
    ],
    atsScoreBoostEstimate: '+15% Match Potential',
    generatedBy: 'heuristic_engine',
  };
}

export const bulletOptimizerService = {
  /**
   * Transforms a raw bullet into 3 high-impact STAR variants.
   * Leverages Gemini 2.0 Flash when configured, or the intelligent heuristic engine as fallback.
   *
   * @param {{ bullet: string, targetKeywords?: string[], jobTitle?: string, tone?: string }} params
   */
  async optimize({ bullet, targetKeywords = [], jobTitle = 'Software Engineer', tone = 'impactful' }) {
    const kwList = Array.isArray(targetKeywords) ? targetKeywords.filter((k) => typeof k === 'string' && k.trim()) : [];

    const prompt = `
You are an executive resume writer and Applicant Tracking System (ATS) engineer.
Transform the following rough resume bullet point into 3 distinct, high-impact STAR-format variants (Situation, Task, Action, Result).

INPUT BULLET: "${bullet}"
TARGET KEYWORDS TO INTEGRATE: ${kwList.length > 0 ? kwList.join(', ') : 'Industry best practices, performance optimization'}
TARGET ROLE CONTEXT: ${jobTitle}
PREFERRED TONE: ${tone}

CRITICAL RULES:
1. Each variant MUST start with a strong, definitive past-tense action verb (e.g. Architected, Engineered, Spearheaded, Accelerated, Orchestrated, Streamlined). Never use weak verbs like "Worked on", "Responsible for", or "Helped with".
2. Naturally integrate target keywords where relevant without keyword stuffing.
3. Quantify impact with realistic metrics (e.g. percentages, latency, scale, time savings).
4. Do NOT hallucinate specific company names or degrees.
5. Provide exactly 3 diverse variants:
   - Variant 1 (type: "metric"): Emphasize measurable business impact, performance gains, and metrics.
   - Variant 2 (type: "technical"): Emphasize architectural rigor, code quality, tools, and technical scalability.
   - Variant 3 (type: "leadership"): Emphasize cross-functional ownership, project velocity, and stakeholder alignment.

Respond with ONLY valid JSON matching this exact structure:
{
  "originalBullet": "${bullet.replace(/"/g, '\\"')}",
  "variants": [
    {
      "type": "metric",
      "label": "Metric & Impact Focused",
      "bullet": "<complete optimized bullet sentence>",
      "actionVerb": "<the action verb used>",
      "highlightedKeywords": ["<keyword1>", "<keyword2>"],
      "improvementTip": "<1 sentence explaining why this variant appeals to recruiters>"
    },
    {
      "type": "technical",
      "label": "Technical Depth & Architecture",
      "bullet": "<complete optimized bullet sentence>",
      "actionVerb": "<the action verb used>",
      "highlightedKeywords": ["<keyword1>", "<keyword2>"],
      "improvementTip": "<1 sentence explaining the technical strength>"
    },
    {
      "type": "leadership",
      "label": "Ownership & Delivery",
      "bullet": "<complete optimized bullet sentence>",
      "actionVerb": "<the action verb used>",
      "highlightedKeywords": ["<keyword1>", "<keyword2>"],
      "improvementTip": "<1 sentence explaining the leadership value>"
    }
  ],
  "atsScoreBoostEstimate": "+15% Match Potential"
}
`;

    if (geminiClient.isConfigured()) {
      try {
        const result = await geminiClient.generateJson(prompt, { temperature: 0.3 });
        if (result && Array.isArray(result.variants) && result.variants.length >= 3) {
          return {
            ...result,
            generatedBy: 'gemini',
          };
        }
      } catch (err) {
        logger.warn('Gemini bullet optimization failed; switching to heuristic fallback', { error: err.message });
      }
    }

    logger.debug('Using heuristic fallback for bullet optimization');
    return generateAlgorithmicFallback(bullet, kwList, jobTitle);
  },

  /**
   * Generates tailored resume bullet points embedding specific target/missing keywords.
   *
   * @param {{ keywords: string[], jobTitle?: string, context?: string }} params
   */
  async injectKeywords({ keywords = [], jobTitle = 'Software Engineer', context = '' }) {
    const kwList = Array.isArray(keywords)
      ? keywords.filter((k) => typeof k === 'string' && k.trim()).map((k) => k.trim())
      : [];
    if (kwList.length === 0) {
      kwList.push('Full-Stack Engineering', 'Performance Optimization');
    }

    const prompt = `
You are an elite Applicant Tracking System (ATS) engineer and technical executive resume writer.
Generate 3 distinct, production-grade resume bullet points for a "${jobTitle}" that NATURALLY and AUTHENTICALLY incorporate the following target/missing keywords:
KEYWORDS: ${kwList.join(', ')}
${context ? `ADDITIONAL CONTEXT: ${context}` : ''}

CRITICAL ATS & QUALITY RULES:
1. Every bullet MUST start with a strong past-tense executive action verb (e.g. Architected, Engineered, Orchestrated, Automated, Spearheaded, Overhauled).
2. Follow the Google X-Y-Z formula: "Accomplished [X] as measured by [Y] by doing [Z]".
3. Include realistic quantifiable metrics (percentages, throughput, latency, time savings, or scale).
4. Integrate the requested keywords naturally in context without awkward keyword-stuffing.
5. Provide 3 diverse categories:
   - Category 1: Technical Depth & Architecture
   - Category 2: Performance, Scale & Metrics
   - Category 3: Automation & Reliability

Respond with ONLY valid JSON matching this exact structure:
{
  "keywords": ${JSON.stringify(kwList)},
  "jobTitle": "${jobTitle.replace(/"/g, '\\"')}",
  "injectedBullets": [
    {
      "category": "Technical Depth & Architecture",
      "bullet": "<complete bullet string>",
      "actionVerb": "<first action verb>",
      "embeddedKeywords": ["<keyword from list>"],
      "impactMetric": "<short phrase summarizing the metric/impact>",
      "whyItWorks": "<1 sentence explanation for why ATS and recruiters favor this>"
    },
    {
      "category": "Performance, Scale & Metrics",
      "bullet": "<complete bullet string>",
      "actionVerb": "<first action verb>",
      "embeddedKeywords": ["<keyword from list>"],
      "impactMetric": "<short phrase summarizing the metric/impact>",
      "whyItWorks": "<1 sentence explanation>"
    },
    {
      "category": "Automation & Reliability",
      "bullet": "<complete bullet string>",
      "actionVerb": "<first action verb>",
      "embeddedKeywords": ["<keyword from list>"],
      "impactMetric": "<short phrase summarizing the metric/impact>",
      "whyItWorks": "<1 sentence explanation>"
    }
  ],
  "atsScoreBoostEstimate": "+20% Keyword Coverage Boost"
}
`;

    if (geminiClient.isConfigured()) {
      try {
        const result = await geminiClient.generateJson(prompt, { temperature: 0.3 });
        if (result && Array.isArray(result.injectedBullets) && result.injectedBullets.length >= 3) {
          return {
            ...result,
            generatedBy: 'gemini',
          };
        }
      } catch (err) {
        logger.warn('Gemini keyword injection failed; switching to heuristic fallback', { error: err.message });
      }
    }

    logger.debug('Using heuristic fallback for keyword injection');
    return generateKeywordInjectionFallback(kwList, jobTitle);
  },
};

function generateKeywordInjectionFallback(keywords = [], jobTitle = 'Software Engineer') {
  const kwList = Array.isArray(keywords) && keywords.length > 0 ? keywords : ['Cloud Architecture', 'CI/CD Pipelines'];
  const p1 = kwList[0] || 'Modern Technologies';
  const p2 = kwList[1] || 'Scalable Services';
  const rest = kwList.slice(0, 3).join(', ');

  return {
    keywords: kwList,
    jobTitle,
    injectedBullets: [
      {
        category: 'Architecture & System Design',
        bullet: `Architected and scaled production-grade infrastructure integrating ${p1}, boosting overall system throughput by 35% and slashing latency across core services.`,
        actionVerb: 'Architected',
        embeddedKeywords: [p1],
        impactMetric: '35% throughput increase',
        whyItWorks: 'Directly validates system design seniority and quantifiable production efficiency.',
      },
      {
        category: 'Engineering & Scalability',
        bullet: `Engineered high-concurrency microservices leveraging ${rest}, ensuring 99.9% fault tolerance and reducing turnaround deployment cycles by 30%.`,
        actionVerb: 'Engineered',
        embeddedKeywords: kwList.slice(0, 2),
        impactMetric: '99.9% fault tolerance',
        whyItWorks: 'Demonstrates deep hands-on expertise with required job stack skills.',
      },
      {
        category: 'Delivery & Reliability',
        bullet: `Spearheaded migration and automated testing for ${p2}, collaborating across engineering teams to deliver robust deliverables 2 weeks ahead of schedule.`,
        actionVerb: 'Spearheaded',
        embeddedKeywords: [p2],
        impactMetric: 'Delivered 2 weeks ahead of target',
        whyItWorks: 'Exemplifies cross-functional ownership and rapid business delivery value.',
      },
    ],
    atsScoreBoostEstimate: '+20% Keyword Coverage Boost',
    generatedBy: 'heuristic_engine',
  };
}
