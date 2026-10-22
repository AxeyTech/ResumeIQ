import { geminiClient } from './geminiClient.service.js';
import { resumeRepository } from '../repositories/resume.repository.js';
import { resumeDefenseRepository } from '../repositories/resumeDefense.repository.js';
import { decryptText } from '../utils/encryption.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../config/logger.js';

// Common weak / cliché starters and filler phrases
const FLUFF_PATTERNS = [
  /\bresponsible for\b/i,
  /\bworked on\b/i,
  /\bhelped with\b/i,
  /\bassisted in\b/i,
  /\bteam player\b/i,
  /\bgo[- ]getter\b/i,
  /\bhard[- ]working\b/i,
  /\bdetail[- ]oriented\b/i,
  /\btasked with\b/i,
  /\bhandled daily\b/i,
  /\bspearheaded cross[- ]functional synergies\b/i,
  /\bthought leadership\b/i,
];

// Metrics extraction regexes
const METRIC_REGEX = /(?:\b\d+(?:\.\d+)?%\b|\b\d+\+?\s*(?:ms|milliseconds|seconds|s|hours|hrs|days)\b|\b\d+(?:k|m|b|x)\b|\$\s*\d+[\d,]*(?:\.\d+)?(?:\s*(?:k|m|b|million|billion|thousand))?|\b\d+[\d,]*\+?\s*(?:users|qps|tps|requests|customers|clients|nodes|services|transactions|endpoints|engineers|members)\b|\b(?:reduced|improved|increased|decreased|accelerated|boosted|saved|scaled)\s+(?:by\s+)?\d+)/i;

const STRONG_VERBS = [
  'architected', 'engineered', 'spearheaded', 'orchestrated', 'optimized',
  'accelerated', 'automated', 'streamlined', 'refactored', 'designed',
  'developed', 'implemented', 'scaled', 'migrated', 'deployed',
  'consolidated', 'reduced', 'increased', 'boosted', 'built',
];

/**
 * Extracts and sanitizes individual bullet points from raw text and parsed sections.
 */
function extractBullets(rawText = '', sections = {}) {
  const bulletLines = [];
  const processedSet = new Set();

  const parseSectionText = (text, defaultSection = 'experience') => {
    if (!text || typeof text !== 'string') return;
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    let currentRole = '';
    for (const line of lines) {
      // Role / Project header detection (e.g. "Senior Software Engineer — Google" or "Project: E-Commerce Platform")
      if (line.length < 75 && (line.includes('—') || line.includes('|') || line.includes('@') || /^(?:project|company|role|title):/i.test(line))) {
        currentRole = line.replace(/^[#*\-•\s]+/, '').trim();
        continue;
      }

      // Check if line looks like a bullet item
      const isBulletChar = /^[\s•\-\*–—▪◦▸►•]\s*/.test(line) || /^\d+[\.\)]\s+/.test(line);
      const startsWithVerb = STRONG_VERBS.some((v) => line.toLowerCase().startsWith(v));
      const hasLength = line.length >= 25 && line.length <= 320;

      if ((isBulletChar || startsWithVerb) && hasLength) {
        const clean = line.replace(/^[\s•\-\*–—▪◦▸►•\d\.\)]+\s*/, '').trim();
        if (clean.length > 20 && !processedSet.has(clean.toLowerCase())) {
          processedSet.add(clean.toLowerCase());
          bulletLines.push({
            originalBullet: clean,
            section: defaultSection,
            roleOrProject: currentRole || (defaultSection === 'projects' ? 'Key Project' : 'Professional Experience'),
          });
        }
      }
    }
  };

  // 1. Process experience section
  if (sections.experience) parseSectionText(sections.experience, 'experience');
  // 2. Process projects section
  if (sections.projects) parseSectionText(sections.projects, 'projects');

  // 3. Fallback: If sections were sparse, scan rawText
  if (bulletLines.length < 3 && rawText) {
    parseSectionText(rawText, 'experience');
  }

  // Cap at top 15 most substantive bullets for optimal performance
  return bulletLines.slice(0, 15);
}

/**
 * Deterministic rule-based evaluation for a single bullet point (Failsafe & Algorithmic Baseline).
 */
function evaluateBulletHeuristic(item, index) {
  const bullet = item.originalBullet;
  const lower = bullet.toLowerCase();

  // Detect Action Verb
  let actionVerb = null;
  const firstWordMatch = bullet.match(/^[a-zA-Z]+/);
  if (firstWordMatch) {
    const word = firstWordMatch[0].toLowerCase();
    if (STRONG_VERBS.includes(word)) {
      actionVerb = firstWordMatch[0];
    }
  }

  // Detect Metric
  const metricMatch = bullet.match(METRIC_REGEX);
  const metric = metricMatch ? metricMatch[0] : null;

  // Detect Context / Tooling
  const techKeywords = [
    'react', 'node', 'express', 'docker', 'kubernetes', 'aws', 'gcp', 'azure',
    'postgresql', 'postgres', 'mongodb', 'redis', 'kafka', 'graphql', 'rest',
    'python', 'typescript', 'javascript', 'ci/cd', 'microservices', 'git',
  ];
  const matchedTech = techKeywords.filter((t) => lower.includes(t));
  const context = matchedTech.length > 0 ? matchedTech.slice(0, 3).join(', ') : null;

  // Detect Fluff Words
  const fluffWordsDetected = [];
  for (const pattern of FLUFF_PATTERNS) {
    const m = bullet.match(pattern);
    if (m && !fluffWordsDetected.includes(m[0].toLowerCase())) {
      fluffWordsDetected.push(m[0].toLowerCase());
    }
  }

  // Google XYZ Score Calculation
  let xyzScore = 30; // base score for a descriptive line
  if (actionVerb) xyzScore += 25;
  if (metric) xyzScore += 30;
  if (context) xyzScore += 15;
  if (fluffWordsDetected.length > 0) xyzScore = Math.max(15, xyzScore - 15 * fluffWordsDetected.length);
  xyzScore = Math.min(100, Math.max(10, xyzScore));

  // Risk Assessment
  let riskLevel = 'LOW';
  let riskReason = 'Claim is concrete with identifiable tooling and scope.';

  if (!metric && !context) {
    riskLevel = 'HIGH';
    riskReason = 'Vague generalized claim with no measurable metric or architectural context. Interviewers will easily probe this for exaggeration.';
  } else if (!metric || fluffWordsDetected.length > 0) {
    riskLevel = 'MEDIUM';
    riskReason = 'Lacks quantified business or system impact. An interviewer will ask for exact before-and-after numbers.';
  } else if (lower.includes('scaled') || lower.includes('million') || lower.includes('architected')) {
    riskLevel = 'HIGH';
    riskReason = 'High-stakes architectural claim. Senior interviewers will drill into concurrency limits, failure modes, and trade-offs.';
  }

  // Google XYZ Rewrite
  const targetVerb = actionVerb || 'Architected and deployed';
  const targetMetric = metric || 'achieving a 35% reduction in latency and 99.9% uptime';
  const targetContext = context ? `utilizing ${context}` : 'implementing automated CI/CD pipelines and modular service architecture';
  const googleXyzRewrite = `Accomplished enhanced reliability as measured by ${targetMetric}, by ${targetVerb.toLowerCase()} ${bullet.replace(/^[a-zA-Z]+\s+/, '')} ${targetContext}.`;

  // Grilling Questions
  const grillingQuestions = [
    {
      question: `In this project, what was the primary performance bottleneck before your work, and how did you mathematically quantify the improvement?`,
      interviewerRole: 'Staff Software Architect',
      focusArea: 'Scale & Latency',
      keyPreparationPointers: [
        'State the baseline metric (e.g. p95 latency was 850ms).',
        'Explain the exact profiling tool used (e.g. Datadog, Prometheus, clinic.js).',
        'Cite the post-deployment verification number.',
      ],
    },
    {
      question: `What critical failure mode or edge case did you encounter in production with this implementation, and what trade-off did you accept?`,
      interviewerRole: 'Engineering Manager',
      focusArea: 'Failure Modes & Edge Cases',
      keyPreparationPointers: [
        'Acknowledge a realistic challenge (e.g. database connection exhaustion or cache invalidation race conditions).',
        'Discuss why you chose your specific mitigation over alternative approaches.',
      ],
    },
  ];

  return {
    id: `bullet-${index + 1}`,
    section: item.section,
    roleOrProject: item.roleOrProject,
    originalBullet: bullet,
    xyzEvaluation: {
      score: xyzScore,
      actionVerb,
      metric,
      context,
      hasAction: Boolean(actionVerb),
      hasMetric: Boolean(metric),
      hasContext: Boolean(context),
      fluffWordsDetected,
      googleXyzRewrite,
      rewriteExplanation: 'Restructured strictly into the Google XYZ formula: Accomplished [X] as measured by [Y], by doing [Z].',
    },
    interviewDefense: {
      riskLevel,
      riskReason,
      grillingQuestions,
    },
  };
}

export const interviewDefenseService = {
  /**
   * Retrieves existing defense report or performs complete analysis if not yet generated.
   *
   * @param {string} resumeId
   * @param {string} userId
   * @param {boolean} [forceRefresh=false]
   */
  async getOrAnalyze(resumeId, userId, forceRefresh = false) {
    const resume = await resumeRepository.findByIdForUser(resumeId, userId);
    if (!resume) throw ApiError.notFound('Resume not found.');

    if (!forceRefresh) {
      const cached = await resumeDefenseRepository.findByResumeId(resumeId, userId);
      if (cached) {
        return this.formatResponse(cached, resume);
      }
    }

    return this.runDefenseAnalysis(resume, userId);
  },

  /**
   * Formats database record into clean public API response.
   */
  formatResponse(record, resume) {
    return {
      id: record.id,
      resumeId: record.resume_id,
      displayName: resume.display_name || resume.file_name,
      overallDefensibilityScore: Number(record.overall_defensibility_score),
      xyzComplianceRate: Number(record.xyz_compliance_rate),
      riskDistribution: record.risk_distribution,
      keyStrengths: record.key_strengths || [],
      topVulnerabilities: record.top_vulnerabilities || [],
      bullets: record.bullets || [],
      analyzedAt: record.analyzed_at,
    };
  },

  /**
   * Runs the complete Defense & Google XYZ intelligence analysis.
   */
  async runDefenseAnalysis(resume, userId) {
    let rawText = '';
    try {
      rawText = resume.raw_text_encrypted ? decryptText(resume.raw_text_encrypted) : '';
    } catch (err) {
      logger.warn('Failed to decrypt raw text for defense analysis', { error: err.message });
    }

    const sections = resume.parsed_sections || {};
    const extractedBullets = extractBullets(rawText, sections);

    if (extractedBullets.length === 0) {
      throw ApiError.unprocessable(
        'Could not extract sufficient bullet points from this resume. Ensure your resume contains experience or project bullets.',
      );
    }

    let analyzedBullets = [];

    // Attempt Gemini 2.5 Flash intelligence analysis
    if (geminiClient.isConfigured()) {
      try {
        analyzedBullets = await this.analyzeWithGemini(extractedBullets);
      } catch (err) {
        logger.warn('Gemini defense analysis failed, falling back to algorithmic analyzer', { error: err.message });
      }
    }

    // Fallback to rule-based engine if Gemini unavailable or failed
    if (!analyzedBullets || analyzedBullets.length === 0) {
      analyzedBullets = extractedBullets.map((item, idx) => evaluateBulletHeuristic(item, idx));
    }

    // Compute aggregates
    const total = analyzedBullets.length;
    const highRiskCount = analyzedBullets.filter((b) => b.interviewDefense?.riskLevel === 'HIGH').length;
    const mediumRiskCount = analyzedBullets.filter((b) => b.interviewDefense?.riskLevel === 'MEDIUM').length;
    const lowRiskCount = analyzedBullets.filter((b) => b.interviewDefense?.riskLevel === 'LOW').length;

    const compliantCount = analyzedBullets.filter((b) => (b.xyzEvaluation?.score || 0) >= 70).length;
    const xyzComplianceRate = total > 0 ? Math.round((compliantCount / total) * 100) : 0;

    const avgScore =
      total > 0
        ? Math.round(
            analyzedBullets.reduce((acc, b) => acc + (b.xyzEvaluation?.score || 0), 0) / total,
          )
        : 50;

    // Defensibility penalty based on high-risk unverifiable claims
    const overallDefensibilityScore = Math.max(10, Math.min(100, Math.round(avgScore * 0.7 + (lowRiskCount / (total || 1)) * 30)));

    // Extract top strengths and vulnerabilities
    const keyStrengths = [];
    const topVulnerabilities = [];

    if (xyzComplianceRate >= 70) {
      keyStrengths.push('High proportion of quantified achievements with concrete metrics.');
    } else {
      topVulnerabilities.push('Over 30% of bullet points lack quantifiable business or system metrics.');
    }

    if (highRiskCount > 0) {
      topVulnerabilities.push(`${highRiskCount} claim(s) contain high-stakes architectural statements without technical justification, creating severe interview risk.`);
    } else {
      keyStrengths.push('Claims are grounded and defensible against deep technical grilling.');
    }

    const fluffCount = analyzedBullets.reduce((acc, b) => acc + (b.xyzEvaluation?.fluffWordsDetected?.length || 0), 0);
    if (fluffCount > 0) {
      topVulnerabilities.push(`Detected ${fluffCount} generic filler/fluff phrase(s) that dilute engineering authority.`);
    } else {
      keyStrengths.push('Clear, active engineering terminology without corporate cliché fillers.');
    }

    const riskDistribution = {
      high: highRiskCount,
      medium: mediumRiskCount,
      low: lowRiskCount,
      totalBullets: total,
    };

    // Upsert into database
    const saved = await resumeDefenseRepository.upsert({
      resumeId: resume.id,
      userId,
      overallDefensibilityScore,
      xyzComplianceRate,
      riskDistribution,
      keyStrengths,
      topVulnerabilities,
      bullets: analyzedBullets,
    });

    return this.formatResponse(saved, resume);
  },

  /**
   * Leverages Gemini 2.5 Flash for deep architectural grilling and Google XYZ transformation.
   */
  async analyzeWithGemini(extractedBullets) {
    const bulletsPayload = extractedBullets.map((b, i) => ({
      index: i + 1,
      section: b.section,
      roleOrProject: b.roleOrProject,
      bullet: b.originalBullet,
    }));

    const prompt = `
You are a Principal Staff Software Architect and Executive Hiring Bar Raiser at Google and Stripe.
Evaluate each resume bullet point using:
1. Google's XYZ Formula: "Accomplished [X] as measured by [Y], by doing [Z]"
2. Reverse Interview Defense Matrix: Identify why an interviewer will grill this point and formulate tough technical questions.

INPUT BULLETS:
${JSON.stringify(bulletsPayload, null, 2)}

Return a JSON object strictly matching this schema:
{
  "bullets": [
    {
      "index": 1,
      "xyzEvaluation": {
        "score": 85, // 0-100 score
        "actionVerb": "Architected",
        "metric": "45% latency drop", // null if missing
        "context": "Redis & Kafka", // null if missing
        "hasAction": true,
        "hasMetric": true,
        "hasContext": true,
        "fluffWordsDetected": ["responsible for"], // empty array if none
        "googleXyzRewrite": "Accomplished 45% reduction in API response latency as measured by p99 metrics, by architecting an asynchronous caching pipeline using Redis and Kafka.",
        "rewriteExplanation": "Structured strictly into Accomplished [X] as measured by [Y], by doing [Z] with zero fluff."
      },
      "interviewDefense": {
        "riskLevel": "HIGH", // "HIGH" | "MEDIUM" | "LOW"
        "riskReason": "Claiming huge scale without stating cache invalidation or throughput limits will invite aggressive cross-examination.",
        "grillingQuestions": [
          {
            "question": "How did you guarantee cache consistency between Redis and the primary database during network partitions?",
            "interviewerRole": "Principal Architect",
            "focusArea": "Scale & Latency",
            "keyPreparationPointers": [
              "Cite write-through vs cache-aside strategy.",
              "Discuss TTL and distributed lock trade-offs."
            ]
          },
          {
            "question": "What happened to downstream services when Redis cluster memory filled up?",
            "interviewerRole": "Site Reliability Lead",
            "focusArea": "Failure Modes & Edge Cases",
            "keyPreparationPointers": [
              "Mention maxmemory-policy (volatile-lru or allkeys-lru).",
              "Discuss circuit breaking with resilience patterns."
            ]
          }
        ]
      }
    }
  ]
}

CRITICAL RULES:
- Evaluate objectively. Do NOT give 100s to vague claims like "worked on UI" or "assisted with backend".
- Grilling questions must be deeply technical, realistic, and sharp.
- Return ONLY valid JSON.
`;

    const parsed = await geminiClient.generateJson(prompt, { temperature: 0.15, maxOutputTokens: 6000 });
    if (!parsed || !Array.isArray(parsed.bullets)) {
      throw new Error('Gemini response did not contain expected bullets array');
    }

    // Merge Gemini output with original bullet context
    return extractedBullets.map((item, idx) => {
      const gBullet = parsed.bullets.find((b) => b.index === idx + 1) || parsed.bullets[idx];
      if (!gBullet) {
        return evaluateBulletHeuristic(item, idx);
      }

      return {
        id: `bullet-${idx + 1}`,
        section: item.section,
        roleOrProject: item.roleOrProject,
        originalBullet: item.originalBullet,
        xyzEvaluation: {
          score: Math.min(100, Math.max(0, Number(gBullet.xyzEvaluation?.score) || 50)),
          actionVerb: gBullet.xyzEvaluation?.actionVerb || null,
          metric: gBullet.xyzEvaluation?.metric || null,
          context: gBullet.xyzEvaluation?.context || null,
          hasAction: Boolean(gBullet.xyzEvaluation?.hasAction),
          hasMetric: Boolean(gBullet.xyzEvaluation?.hasMetric),
          hasContext: Boolean(gBullet.xyzEvaluation?.hasContext),
          fluffWordsDetected: Array.isArray(gBullet.xyzEvaluation?.fluffWordsDetected)
            ? gBullet.xyzEvaluation.fluffWordsDetected
            : [],
          googleXyzRewrite: gBullet.xyzEvaluation?.googleXyzRewrite || item.originalBullet,
          rewriteExplanation: gBullet.xyzEvaluation?.rewriteExplanation || 'Optimized into Google XYZ formula.',
        },
        interviewDefense: {
          riskLevel: ['HIGH', 'MEDIUM', 'LOW'].includes(gBullet.interviewDefense?.riskLevel)
            ? gBullet.interviewDefense.riskLevel
            : 'MEDIUM',
          riskReason: gBullet.interviewDefense?.riskReason || 'Interviewers will test the technical validity of this claim.',
          grillingQuestions: Array.isArray(gBullet.interviewDefense?.grillingQuestions)
            ? gBullet.interviewDefense.grillingQuestions
            : [],
        },
      };
    });
  },
};
