import { analysisRepository } from '../repositories/analysis.repository.js';
import { resumeRepository } from '../repositories/resume.repository.js';
import { decryptText } from '../utils/encryption.js';
import { geminiClient } from './geminiClient.service.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../config/logger.js';

function countPatternMatches(text, regex) {
  if (!text || typeof text !== 'string') return 0;
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function clamp(val, min = 15, max = 98) {
  return Math.max(min, Math.min(max, Math.round(val)));
}

function getBadgeForScore(score) {
  if (score >= 82) return { text: 'Top 5% Candidate Bracket', color: 'emerald' };
  if (score >= 68) return { text: 'Competitive Match', color: 'blue' };
  if (score >= 50) return { text: 'Minor Gaps for This Tier', color: 'amber' };
  return { text: 'High Automated Screening Risk', color: 'red' };
}

export const personaSimulatorService = {
  /**
   * Evaluates an analysis across 3 distinct hiring tiers
   * @param {string} analysisId
   * @param {string} userId
   */
  async simulatePersonas(analysisId, userId) {
    const analysis = await analysisRepository.findByIdForUser(analysisId, userId);
    if (!analysis) throw ApiError.notFound('Analysis not found.');

    const resume = await resumeRepository.findByIdForUser(analysis.resume_id, userId);
    if (!resume) throw ApiError.notFound('Resume not found.');

    let rawText = '';
    try {
      rawText = decryptText(resume.raw_text_encrypted) || '';
    } catch (e) {
      logger.warn('Could not decrypt resume for persona simulation', { error: e.message });
    }

    const kwScore = Number(analysis.keyword_match_score) || 60;
    const atsScore = Number(analysis.ats_compatibility_score) || 70;
    const matchedKws = analysis.matched_keywords || [];
    const missingKws = analysis.missing_keywords || [];
    const highIssueCount = (analysis.issues || []).filter(i => i.severity === 'high').length;

    // 1. FAANG / Product Giants Heuristics
    const scaleMatches = countPatternMatches(rawText, /(users|qps|latency|tps|million|billion|scale|distributed|throughput|concurrent|petabytes|terabytes|\d+%\s+reduction|\d+%\s+increase)/gi);
    const faangVerbs = countPatternMatches(rawText, /\b(architected|spearheaded|engineered|pioneered|scaled|optimized|orchestrated|redesigned)\b/gi);
    const systemKeywords = countPatternMatches(rawText, /\b(system design|microservices|distributed|cloud|distributed systems|ci\/cd|load balancing|caching|redis|kafka|docker|kubernetes)\b/gi);
    const metricMatches = countPatternMatches(rawText, /(\d+%\s+|\$\d+|\d+x\s+|\d+\s*ms|\d+\s*sec)/g);

    const faangScale = clamp(35 + scaleMatches * 8 + metricMatches * 5);
    const faangRigor = clamp(40 + systemKeywords * 7 + (matchedKws.length > 5 ? 15 : 5));
    const faangMetrics = clamp(30 + metricMatches * 10);
    const faangLeadership = clamp(35 + faangVerbs * 8);

    const faangScore = clamp(
      faangScale * 0.35 + faangRigor * 0.25 + faangMetrics * 0.25 + faangLeadership * 0.15 - highIssueCount * 5
    );
    const faangBadge = getBadgeForScore(faangScore);

    // 2. High-Growth Startup Heuristics
    const startupTechMatches = countPatternMatches(rawText, /\b(typescript|react|next\.?js|node\.?js|tailwind|docker|graphql|python|ai|postgres|postgresql|fastapi|redis|prisma|supabase|aws|gcp|rest api)\b/gi);
    const startupVerbs = countPatternMatches(rawText, /\b(built|shipped|launched|deployed|integrated|created|implemented|delivered|prototyped|automated)\b/gi);
    const hasFrontend = countPatternMatches(rawText, /\b(react|vue|frontend|css|html|tailwind|ui|next)\b/gi) > 0;
    const hasBackend = countPatternMatches(rawText, /\b(node|python|backend|sql|postgres|database|api|docker)\b/gi) > 0;
    const versatilityScore = (hasFrontend && hasBackend) ? 90 : 65;

    const startupStack = clamp(40 + startupTechMatches * 6);
    const startupVelocity = clamp(35 + startupVerbs * 7);
    const startupExecution = clamp(45 + (matchedKws.length > 4 ? 25 : 10));

    const startupScore = clamp(
      startupStack * 0.35 + startupVelocity * 0.25 + versatilityScore * 0.25 + startupExecution * 0.15 - highIssueCount * 4
    );
    const startupBadge = getBadgeForScore(startupScore);

    // 3. Global Enterprise & IT Consulting Heuristics
    const enterpriseMatches = countPatternMatches(rawText, /\b(agile|scrum|jira|compliance|governance|documentation|unit testing|integration testing|sdlc|waterfall|stakeholder|certifi(ed|cation)|standard|audit)\b/gi);
    const sectionsCount = resume.parsed_sections ? Object.keys(resume.parsed_sections).length : 4;
    const sectionComplianceScore = sectionsCount >= 4 ? 92 : 65;

    const enterpriseKeywords = clamp(kwScore * 0.95);
    const enterpriseAts = clamp(atsScore);
    const enterpriseProcess = clamp(35 + enterpriseMatches * 8);

    const enterpriseScore = clamp(
      enterpriseKeywords * 0.40 + enterpriseAts * 0.30 + enterpriseProcess * 0.20 + sectionComplianceScore * 0.10 - highIssueCount * 8
    );
    const enterpriseBadge = getBadgeForScore(enterpriseScore);

    // Baseline response structure
    const simulations = {
      analysisId,
      personas: {
        faang: {
          id: 'faang',
          title: 'Tier-1 & Product Giants',
          subtitle: 'Google, Meta, Amazon, Microsoft, Apple, Netflix, Uber',
          score: faangScore,
          badge: faangBadge.text,
          badgeColor: faangBadge.color,
          criteria: [
            { label: 'System Scale & User Impact', score: faangScale },
            { label: 'Architectural Rigor & Complexity', score: faangRigor },
            { label: 'Quantified Metric Outcomes', score: faangMetrics },
            { label: 'Technical Ownership & Initiative', score: faangLeadership }
          ],
          verdict: faangScore >= 75
            ? 'Strong technical profile with verifiable metrics that will pass FAANG engineering recruiter screens.'
            : 'FAANG screeners will look for deeper architectural scale (e.g. latency, throughput, scale numbers) and stronger action verbs.',
          strengths: [
            faangScale >= 70 ? 'Verifiable scale or efficiency indicators present' : 'Solid technical foundation in core domain',
            faangRigor >= 70 ? 'System architecture and engineering keywords detected' : 'Demonstrated problem-solving capabilities'
          ],
          redFlags: [
            faangMetrics < 70 ? 'Bullets lack hard numbers (e.g. % speedup, $ savings, user volume)' : 'Ensure all bullet points follow Google XYZ formula',
            highIssueCount > 0 ? `${highIssueCount} formatting warnings could trigger automated parser drops` : 'Ensure single-column standard layout'
          ],
          tacticalRecommendations: [
            'Rewrite non-metric bullets using the Google STAR format: [Action Verb] + [System/Architecture] + resulting in [Quantified % or Scale Metric].',
            'Explicitly state system dimensions (e.g. "handling 500k daily requests", "reducing database query latency by 35%").',
            'Upgrade passive phrases ("worked on", "assisted") to top-tier engineering verbs ("Architected", "Engineered", "Orchestrated").'
          ]
        },
        startup: {
          id: 'startup',
          title: 'High-Growth Tech Startups',
          subtitle: 'Stripe, Vercel, Supabase, OpenAI ecosystem, YC Series A-C',
          score: startupScore,
          badge: startupBadge.text,
          badgeColor: startupBadge.color,
          criteria: [
            { label: 'Modern Tech Stack Alignment', score: startupStack },
            { label: '0-to-1 Shipping Velocity', score: startupVelocity },
            { label: 'Full-Stack & Multi-Disciplinary Breadth', score: versatilityScore },
            { label: 'Pragmatic Product Delivery', score: startupExecution }
          ],
          verdict: startupScore >= 75
            ? 'High-velocity builder profile! Startup founders and CTOs will appreciate the modern tech versatility and direct shipping outcomes.'
            : 'Startup recruiters want to see proof of shipping complete features fast, full-stack breadth, and modern tooling experience.',
          strengths: [
            startupStack >= 70 ? 'High concentration of in-demand modern web/cloud technologies' : 'Relevant engineering skills present',
            versatilityScore >= 80 ? 'Well-rounded full-stack capabilities across frontend & backend' : 'Clear technical focus'
          ],
          redFlags: [
            startupVelocity < 65 ? 'Too many passive maintenance bullets instead of active feature launches' : 'Highlight self-directed projects or 0-to-1 work',
            missingKws.length > 3 ? `Missing modern requirements: ${missingKws.slice(0, 3).join(', ')}` : 'Ensure modern toolchain is front and center'
          ],
          tacticalRecommendations: [
            'Highlight end-to-end features you shipped from concept to production in fast iteration cycles.',
            'Group modern tools (TypeScript, Next.js, Docker, PostgreSQL, AI APIs) prominently at the top of your Skills section.',
            'Emphasize autonomy and decision-making (e.g. "Took full ownership of...", "Bootstrapped MVP in 3 weeks").'
          ]
        },
        enterprise: {
          id: 'enterprise',
          title: 'Global Enterprise & IT Consulting',
          subtitle: 'TCS, Infosys, Accenture, Deloitte, IBM, Fortune 500 Banks',
          score: enterpriseScore,
          badge: enterpriseBadge.text,
          badgeColor: enterpriseBadge.color,
          criteria: [
            { label: 'Exact Keyword Taxonomy & Acronyms', score: enterpriseKeywords },
            { label: 'Standard ATS Layout & Clearance', score: enterpriseAts },
            { label: 'Process, Agile & SDLC Rigor', score: enterpriseProcess },
            { label: 'Section & Certifications Compliance', score: sectionComplianceScore }
          ],
          verdict: enterpriseScore >= 75
            ? 'High-probability clearance! Standard automated enterprise ATS parsers (Taleo, Workday, iCIMS) will rank this resume favorably.'
            : 'Enterprise automated filters may screen this out due to missing exact keywords or non-standard heading taxonomy.',
          strengths: [
            enterpriseAts >= 75 ? 'Clean single-column parsing clearance with zero layout ambiguities' : 'Standard document structure',
            matchedKws.length > 5 ? `${matchedKws.length} exact keyword matches verified against enterprise taxonomy` : 'Core industry terms present'
          ],
          redFlags: [
            missingKws.length > 0 ? `Enterprise filter will flag missing exact keywords: ${missingKws.slice(0, 4).join(', ')}` : 'Ensure all acronyms are spelled out alongside shorthand',
            enterpriseProcess < 65 ? 'Lack of explicit Agile/Scrum, testing, or governance mentions' : 'Confirm standard Work Experience/Education layout'
          ],
          tacticalRecommendations: [
            'Add exact industry acronyms alongside spelled-out terms (e.g. "CI/CD (Continuous Integration/Continuous Delivery)", "RESTful APIs").',
            'Include an explicit "Methodologies & Tools" subsection with Agile, Scrum, Jira, and automated testing frameworks.',
            'Keep layout strictly single-column with standard headings: Summary, Technical Skills, Professional Experience, Education.'
          ]
        }
      }
    };

    return simulations;
  }
};
