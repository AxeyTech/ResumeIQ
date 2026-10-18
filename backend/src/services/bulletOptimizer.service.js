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
};
