import { geminiClient } from './geminiClient.service.js';
import { logger } from '../config/logger.js';

// FR-2.5: generic fallback benchmark used when no job description is supplied.
// A broad mix of soft skills and common technical/professional terms, since
// the target role is unknown.
const GENERIC_BENCHMARK_KEYWORDS = [
  'communication', 'leadership', 'problem solving', 'teamwork', 'collaboration',
  'project management', 'data analysis', 'time management', 'presentation',
  'stakeholder management', 'research', 'documentation', 'testing', 'debugging',
  'agile', 'customer service', 'attention to detail', 'critical thinking',
  'python', 'javascript', 'sql', 'git', 'microsoft office', 'reporting',
];

const STOPWORDS = new Set(
  ('a an the and or but if then else for of to in on at by with from as is are was were be been ' +
    'being this that these those it its into over under about above below than so such not no nor ' +
    'we you they he she i our your their his her will would can could should must shall may might ' +
    'up down out off again further once here there when where why how all any both each few more ' +
    'most other some only own same too very just')
    .split(' '),
);

function tokenize(text) {
  return (text.toLowerCase().match(/[a-z][a-z0-9+.#-]{1,}/g) || []).filter((w) => !STOPWORDS.has(w));
}

/** Rule-based keyword extraction: frequency-ranked, multi-word phrases favored. */
function extractKeywordsRuleBased(jdText, limit = 25) {
  const lines = jdText.split(/\r?\n/);
  const freq = new Map();

  // Single tokens.
  for (const token of tokenize(jdText)) {
    if (token.length < 3) continue;
    freq.set(token, (freq.get(token) || 0) + 1);
  }

  // Bigrams tend to capture real skills better than single words ("machine learning").
  for (const line of lines) {
    const words = tokenize(line);
    for (let i = 0; i < words.length - 1; i += 1) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      if (bigram.length < 6) continue;
      freq.set(bigram, (freq.get(bigram) || 0) + 1.5); // slight boost for phrases
    }
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([keyword]) => keyword);
}

function textContainsKeyword(text, keyword) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(^|\\W)${escaped}(\\W|$)`, 'i');
  return pattern.test(text);
}

function matchRuleBased(resumeText, keywords) {
  const matched = [];
  const missing = [];
  for (const kw of keywords) {
    if (textContainsKeyword(resumeText, kw)) matched.push(kw);
    else missing.push(kw);
  }
  const score = keywords.length === 0 ? 100 : Math.round((matched.length / keywords.length) * 100);
  return { score, matched, missing };
}

const GEMINI_PROMPT = (resumeText, jdText, isBenchmark) => `
You are an expert ATS (Applicant Tracking System) keyword-matching engine.
Compare the RESUME against the ${isBenchmark ? 'GENERAL INDUSTRY BENCHMARK SKILL LIST' : 'JOB DESCRIPTION'} below.

Identify the most important skills, tools, and qualifications required, then determine
which ones are genuinely present in the resume (accept close paraphrases and synonyms,
not just exact string matches) and which are missing.

Respond with ONLY a JSON object of this exact shape, no prose:
{
  "score": <integer 0-100, overall keyword/skill match strength>,
  "matchedKeywords": [<strings, keywords found in the resume, ranked by importance>],
  "missingKeywords": [<strings, important keywords NOT found in the resume, ranked by importance>]
}

RESUME:
"""
${resumeText.slice(0, 8000)}
"""

${isBenchmark ? 'BENCHMARK SKILL LIST' : 'JOB DESCRIPTION'}:
"""
${jdText.slice(0, 4000)}
"""
`;

export const keywordMatcherService = {
  /** FR-2.2: extract key terms from a job description. */
  async extractKeywords(jdText) {
    const gemini = await geminiClient.generateJson(
      `Extract the 20-25 most important skills, tools, and qualifications from this job description. ` +
        `Respond with ONLY a JSON object: {"keywords": [<strings, ranked by importance>]}.\n\nJOB DESCRIPTION:\n"""${jdText.slice(0, 4000)}"""`,
    );
    if (gemini?.keywords?.length) return gemini.keywords;

    logger.debug('Falling back to rule-based keyword extraction.');
    return extractKeywordsRuleBased(jdText);
  },

  /**
   * FR-2.3/2.4/2.5: computes the keyword match score and matched/missing
   * lists. If `jdText` is omitted, falls back to the generic benchmark.
   * @param {string} resumeText
   * @param {string | null} jdText
   */
  async match(resumeText, jdText) {
    const isBenchmark = !jdText || jdText.trim().length === 0;
    const comparisonText = isBenchmark ? GENERIC_BENCHMARK_KEYWORDS.join(', ') : jdText;

    const gemini = await geminiClient.generateJson(GEMINI_PROMPT(resumeText, comparisonText, isBenchmark));
    if (gemini && typeof gemini.score === 'number') {
      return {
        score: clampScore(gemini.score),
        matchedKeywords: gemini.matchedKeywords || [],
        missingKeywords: gemini.missingKeywords || [],
        source: 'gemini',
        usedBenchmark: isBenchmark,
      };
    }

    logger.debug('Falling back to rule-based keyword matching.');
    const keywords = isBenchmark ? GENERIC_BENCHMARK_KEYWORDS : extractKeywordsRuleBased(jdText);
    const { score, matched, missing } = matchRuleBased(resumeText, keywords);
    return {
      score: clampScore(score),
      matchedKeywords: matched,
      missingKeywords: missing,
      source: 'rule_based',
      usedBenchmark: isBenchmark,
    };
  },
};

function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}
