import { resumeRepository } from '../repositories/resume.repository.js';
import { jobDescriptionRepository } from '../repositories/jobDescription.repository.js';
import { decryptText } from '../utils/encryption.js';
import { geminiClient } from './geminiClient.service.js';
import { logger } from '../config/logger.js';

// Common filler words to monitor
const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'literally', 'sort of', 'kind of', 'actually', 'right?'];

// High-impact engineering action verbs
const ACTION_VERBS = [
  'architected', 'spearheaded', 'engineered', 'implemented', 'refactored',
  'optimized', 'delivered', 'built', 'designed', 'orchestrated',
  'scaled', 'resolved', 'streamlined', 'automated', 'migrated', 'led'
];

/**
 * Curated high-yield question banks used as immediate fallback or baseline
 */
const QUESTION_BANKS = {
  behavioral: [
    {
      id: 'b1',
      category: 'Ownership & Ambiguity',
      question: 'Tell me about a time you took ownership of a critical technical initiative where requirements were ambiguous or rapidly shifting. How did you break down the problem and align stakeholders?',
      contextWhyAsked: 'Evaluates extreme ownership, autonomy, and cross-functional leadership under uncertainty.',
      keyEvaluationCriteria: ['Self-directed prioritization', 'Proactive stakeholder alignment', 'Measurable delivery'],
      suggestedTimeLimitSeconds: 180,
    },
    {
      id: 'b2',
      category: 'Production Triage & Resilience',
      question: 'Walk me through a high-severity production outage or system degradation you investigated. What was your triage methodology, how did you identify the root cause, and what permanent guardrails did you put in place?',
      contextWhyAsked: 'Tests composure under fire, systematic debugging discipline, and blameless post-mortem execution.',
      keyEvaluationCriteria: ['Rapid containment', 'Deep root-cause analysis (5 Whys)', 'Long-term automated mitigation'],
      suggestedTimeLimitSeconds: 180,
    },
    {
      id: 'b3',
      category: 'Technical Conflict Resolution',
      question: 'Describe a situation where you had a significant disagreement with a teammate or senior technical leader regarding an architectural trade-off. How did you navigate the conversation to reach the optimal engineering decision?',
      contextWhyAsked: 'Evaluates technical humility, data-driven argumentation, and ability to disagree and commit.',
      keyEvaluationCriteria: ['Objectivity over ego', 'Benchmark/prototype testing', 'Team alignment'],
      suggestedTimeLimitSeconds: 180,
    },
    {
      id: 'b4',
      category: 'Execution Under Constraints',
      question: 'Tell me about a high-priority project with an aggressive deadline. What deliberate trade-offs did you make between velocity, code quality, and technical debt, and what was the ultimate business result?',
      contextWhyAsked: 'Assesses pragmatic engineering judgment and business impact prioritization.',
      keyEvaluationCriteria: ['Strategic trade-offs', 'Tech debt management', 'Quantified business outcome'],
      suggestedTimeLimitSeconds: 180,
    },
  ],
  technical: [
    {
      id: 't1',
      category: 'Data Layer & Concurrency',
      question: 'How do you approach database schema migrations and indexing strategies in high-throughput transactional systems without taking downtime or blocking reads/writes?',
      contextWhyAsked: 'Assesses deep production database expertise, table locking awareness, and zero-downtime deployment patterns.',
      keyEvaluationCriteria: ['Dual-write / multi-phase rollout', 'Lock minimization', 'Index trade-off awareness'],
      suggestedTimeLimitSeconds: 180,
    },
    {
      id: 't2',
      category: 'Distributed Systems & Resilience',
      question: 'When building asynchronous background services, how do you handle idempotency, backpressure, retries, and dead-letter queues to prevent duplicate processing during downstream outages?',
      contextWhyAsked: 'Evaluates real-world distributed messaging discipline (Kafka/RabbitMQ/SQS) and at-least-once delivery handling.',
      keyEvaluationCriteria: ['Idempotency keys', 'Exponential backoff with jitter', 'Circuit breaking'],
      suggestedTimeLimitSeconds: 180,
    },
    {
      id: 't3',
      category: 'Performance Optimization',
      question: 'Walk me through your systematic methodology for diagnosing and resolving a high P99 latency spike or memory leak in a production service.',
      contextWhyAsked: 'Tests profiling skills, memory allocation understanding, and CPU/IO bottleneck isolation.',
      keyEvaluationCriteria: ['Profiling & APM telemetry', 'Garbage collection / leak diagnosis', 'Concrete verification metrics'],
      suggestedTimeLimitSeconds: 180,
    },
    {
      id: 't4',
      category: 'API & Contract Design',
      question: 'How do you design scalable REST or gRPC APIs that support backward compatibility, strict typing, granular rate limiting, and multi-tenant security?',
      contextWhyAsked: 'Evaluates API craft, contract evolution, token bucket algorithms, and defense-in-depth security.',
      keyEvaluationCriteria: ['Versioning semantics', 'Rate limiting algorithms', 'Defense against abuse'],
      suggestedTimeLimitSeconds: 180,
    },
  ],
  system_design: [
    {
      id: 's1',
      category: 'High-Scale Architecture',
      question: 'Design a distributed rate-limiting and quota management service capable of evaluating 100,000 requests per second across multiple global regions with sub-5ms latency.',
      contextWhyAsked: 'Tests distributed state management, token bucket vs sliding window trade-offs, and Redis/cache sync.',
      keyEvaluationCriteria: ['Low latency data store', 'Region synchronization trade-offs', 'Failure fallback behavior'],
      suggestedTimeLimitSeconds: 240,
    },
    {
      id: 's2',
      category: 'Event-Driven Ingestion',
      question: 'How would you architect an end-to-end telemetry and event ingestion platform processing 500 million daily events with real-time anomaly alerting and cost-effective long-term storage?',
      contextWhyAsked: 'Evaluates stream processing (Kafka/Flink), time-series stores, and hot/cold tiering.',
      keyEvaluationCriteria: ['Partitioning & horizontal scaling', 'Stream aggregation', 'Cold archival cost optimization'],
      suggestedTimeLimitSeconds: 240,
    },
    {
      id: 's3',
      category: 'Caching & Consistency',
      question: 'Walk me through designing a multi-tier caching architecture that prevents cache stampedes (thundering herd), handles cache invalidation gracefully, and guarantees eventual consistency with the primary relational datastore.',
      contextWhyAsked: 'Examines cache-aside vs write-through patterns, mutex locking, probabilistic early expiration, and CDC (Debezium).',
      keyEvaluationCriteria: ['Thundering herd prevention', 'Invalidation strategies', 'Consistency guarantees'],
      suggestedTimeLimitSeconds: 240,
    },
    {
      id: 's4',
      category: 'Global Availability & Sharding',
      question: 'Design a scalable multi-tenant document storage and search engine that supports tenant isolation, cross-region replication, and predictable p99 query latency as data scales into hundreds of terabytes.',
      contextWhyAsked: 'Tests sharding keys, indexing architectures (Elasticsearch/OpenSearch), and split-brain resolution.',
      keyEvaluationCriteria: ['Sharding key selection', 'Tenant isolation & noisy neighbor prevention', 'Read/write replication model'],
      suggestedTimeLimitSeconds: 240,
    },
  ],
};

export const mockInterviewService = {
  /**
   * Generates 4 tailored interview questions based on candidate resume and target role.
   */
  async generateQuestions({
    resumeId,
    userId,
    interviewType = 'behavioral',
    difficulty = 'senior',
    jobTitle = 'Software Engineer',
    jobDescriptionText = '',
  }) {
    let candidateSnippet = '';

    if (resumeId && userId) {
      try {
        const resume = await resumeRepository.findByIdForUser(resumeId, userId);
        if (resume && resume.raw_text_encrypted) {
          const raw = decryptText(resume.raw_text_encrypted);
          candidateSnippet = raw.slice(0, 5000);
        }
      } catch (err) {
        logger.debug('Could not read resume text for interview question customization', { error: err.message });
      }
    }

    // Attempt Gemini dynamic generation
    if (geminiClient.isConfigured()) {
      try {
        const prompt = `You are a Staff Hiring Manager at a top-tier tech company.
Generate 4 hyper-tailored, realistic interview questions for a ${difficulty} level candidate interviewing for a ${jobTitle} position.
INTERVIEW TYPE: ${interviewType} (behavioral, technical, or system_design).

CANDIDATE EXPERIENCE BACKGROUND:
${candidateSnippet || 'Experienced software engineer skilled in full-stack web, cloud, and distributed systems.'}

TARGET JOB DESCRIPTION / CONTEXT:
${jobDescriptionText ? jobDescriptionText.slice(0, 3500) : 'Standard modern engineering benchmarks.'}

Return ONLY a valid JSON array of 4 objects matching this exact structure:
[
  {
    "id": "q1",
    "category": "<Concise Category>",
    "question": "<The exact interview question asked directly to the candidate>",
    "contextWhyAsked": "<1 sentence on what recruiters specifically evaluate>",
    "keyEvaluationCriteria": ["<criterion 1>", "<criterion 2>", "<criterion 3>"],
    "suggestedTimeLimitSeconds": 180
  }
]`;

        const geminiResult = await geminiClient.generateJson(prompt, { temperature: 0.25, maxOutputTokens: 2048 });
        if (Array.isArray(geminiResult) && geminiResult.length >= 3) {
          return {
            interviewType,
            difficulty,
            jobTitle,
            questions: geminiResult.slice(0, 4),
            generatedBy: 'gemini',
          };
        }
      } catch (err) {
        logger.warn('Gemini interview question generation failed, falling back to curated bank', { error: err.message });
      }
    }

    // Curated Fallback Bank
    const bank = QUESTION_BANKS[interviewType] || QUESTION_BANKS.behavioral;
    return {
      interviewType,
      difficulty,
      jobTitle,
      questions: bank,
      generatedBy: 'curated_bank',
    };
  },

  /**
   * Evaluates a candidate's answer using the STAR method (Situation, Task, Action, Result).
   */
  async evaluateAnswer({
    question,
    category = 'Behavioral',
    userAnswer,
    interviewType = 'behavioral',
    difficulty = 'senior',
  }) {
    const text = (userAnswer || '').trim();
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Detect filler words
    const lowerText = text.toLowerCase();
    const detectedFillerWords = [];
    let fillerCount = 0;
    for (const fw of FILLER_WORDS) {
      const regex = new RegExp(`\\b${fw}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        fillerCount += matches.length;
        detectedFillerWords.push(`${fw} (${matches.length}x)`);
      }
    }

    // Detect action verbs
    const detectedActionVerbs = ACTION_VERBS.filter((verb) =>
      new RegExp(`\\b${verb}\\b`, 'i').test(lowerText)
    );

    // Detect metrics / numbers
    const metricMatches = text.match(/(\d+%\s*|\$\d+[\d,.]*[kKmMbB]?|\b\d+x\b|\b\d+\s+(ms|seconds|minutes|hours|days|engineers|users|requests|qps|dau|transactions)\b)/gi) || [];

    // Check first person ownership ("I" vs "We")
    const iMatches = lowerText.match(/\b(i|my|mine|i've|i'd|i'm)\b/g) || [];
    const weMatches = lowerText.match(/\b(we|our|us|team)\b/g) || [];

    // Try Gemini evaluation first
    if (geminiClient.isConfigured() && wordCount >= 10) {
      try {
        const prompt = `You are a Principal Engineering Interview Coach at a top tech company.
Evaluate the candidate's spoken or written answer to the interview question below using the STAR method (Situation, Task, Action, Result).

QUESTION: "${question}"
CATEGORY: "${category}"
INTERVIEW TYPE: ${interviewType}
DIFFICULTY LEVEL: ${difficulty}

CANDIDATE'S ANSWER:
"${text}"

METRICS DETECTED: ${metricMatches.join(', ') || 'none'}
ACTION VERBS DETECTED: ${detectedActionVerbs.join(', ') || 'none'}
"I" count: ${iMatches.length}, "We" count: ${weMatches.length}

Return ONLY a valid JSON object matching this schema:
{
  "overallScore": <integer 0-100>,
  "starBreakdown": {
    "situationScore": <integer 0-100>,
    "actionScore": <integer 0-100>,
    "resultScore": <integer 0-100>,
    "deliveryScore": <integer 0-100>
  },
  "strengths": ["<concrete positive 1>", "<concrete positive 2>"],
  "improvements": ["<actionable improvement 1>", "<actionable improvement 2>"],
  "modelAnswer": "<An exemplary 120-200 word STAR-structured response that illustrates how a top 1% engineer answers this exact question with metrics and crisp ownership>",
  "detectedPillars": {
    "hasContext": <boolean>,
    "hasClearAction": <boolean>,
    "hasMetrics": <boolean>
  }
}`;

        const evaluation = await geminiClient.generateJson(prompt, { temperature: 0.15, maxOutputTokens: 2048 });
        if (evaluation && evaluation.overallScore !== undefined) {
          return {
            ...evaluation,
            wordCount,
            fillerCount,
            detectedFillerWords,
            detectedActionVerbs,
            metricMatches,
            generatedBy: 'gemini',
          };
        }
      } catch (err) {
        logger.warn('Gemini interview evaluation failed, running heuristic engine', { error: err.message });
      }
    }

    // Heuristic Evaluation Algorithm
    let situationScore = 65;
    let actionScore = 60;
    let resultScore = 55;
    let deliveryScore = 75;

    // Word count scaling
    if (wordCount < 25) {
      situationScore = 40;
      actionScore = 35;
      resultScore = 30;
      deliveryScore = 45;
    } else if (wordCount < 60) {
      situationScore = 60;
      actionScore = 55;
      resultScore = 50;
      deliveryScore = 65;
    } else if (wordCount >= 100) {
      situationScore += 15;
      actionScore += 15;
      deliveryScore += 10;
    }

    // Action verbs boost
    if (detectedActionVerbs.length >= 2) actionScore += 15;
    if (detectedActionVerbs.length >= 4) actionScore += 10;

    // Ownership boost
    if (iMatches.length >= 3 && iMatches.length >= weMatches.length) {
      actionScore += 10;
    }

    // Metrics & result boost
    if (metricMatches.length >= 1) resultScore += 20;
    if (metricMatches.length >= 3) resultScore += 15;

    // Delivery deductions
    if (fillerCount > 4) deliveryScore -= 15;
    if (wordCount > 350) deliveryScore -= 10; // Overly verbose

    // Clamp scores
    situationScore = Math.max(30, Math.min(98, situationScore));
    actionScore = Math.max(30, Math.min(98, actionScore));
    resultScore = Math.max(25, Math.min(98, resultScore));
    deliveryScore = Math.max(30, Math.min(98, deliveryScore));

    const overallScore = Math.round(
      situationScore * 0.25 + actionScore * 0.35 + resultScore * 0.25 + deliveryScore * 0.15
    );

    const strengths = [];
    if (detectedActionVerbs.length > 0) {
      strengths.push(`Strong ownership signals with direct action verbs (${detectedActionVerbs.slice(0, 3).join(', ')}).`);
    } else {
      strengths.push('Addressed the core intent of the question.');
    }
    if (metricMatches.length > 0) {
      strengths.push(`Quantified impact effectively with measurable outcomes (${metricMatches.slice(0, 2).join(', ')}).`);
    } else if (wordCount >= 70) {
      strengths.push('Provided solid narrative pacing with sufficient technical context.');
    }

    const improvements = [];
    if (metricMatches.length === 0) {
      improvements.push('Incorporate concrete metrics (e.g. latency reduced by X%, throughput scaled to Y requests/sec, or team hours saved).');
    }
    if (detectedActionVerbs.length < 2) {
      improvements.push('Emphasize what YOU personally engineered using strong action verbs (e.g. "I architected", "I benchmarked") rather than passive team summaries.');
    }
    if (fillerCount > 2) {
      improvements.push(`Minimize conversational filler words (${detectedFillerWords.slice(0, 2).join(', ')}). Pause quietly instead.`);
    }
    if (improvements.length === 0) {
      improvements.push('Practice condensing your situation setup to 30 seconds to allow maximum time on technical trade-offs.');
    }

    // Model answer
    const modelAnswer = `Situation: In my previous role, our primary order ingestion pipeline experienced intermittent p99 latency spikes of over 850ms during peak daily traffic.
Task: I was tasked with leading the investigation, isolating the bottleneck, and stabilizing throughput without requiring costly hardware scale-ups.
Action: I profiled the service using distributed tracing, pinpointing unindexed queries and redundant connection handshakes. I implemented a Redis caching layer with probabilistic early expiration and refactored the database connection pool using asynchronous non-blocking workers.
Result: This reduced p99 latency by 68% down to 270ms, eliminated downtime, and saved an estimated $42,000 in monthly compute over-provisioning costs.`;

    return {
      overallScore,
      starBreakdown: {
        situationScore,
        actionScore,
        resultScore,
        deliveryScore,
      },
      strengths,
      improvements,
      modelAnswer,
      detectedPillars: {
        hasContext: situationScore >= 70,
        hasClearAction: actionScore >= 70,
        hasMetrics: metricMatches.length > 0,
      },
      wordCount,
      fillerCount,
      detectedFillerWords,
      detectedActionVerbs,
      metricMatches,
      generatedBy: 'heuristic_engine',
    };
  },
};
