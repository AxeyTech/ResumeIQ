import { resumeRepository } from '../repositories/resume.repository.js';
import { analysisRepository } from '../repositories/analysis.repository.js';
import { decryptText } from '../utils/encryption.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../config/logger.js';

function countMatches(text, regex) {
  if (!text || typeof text !== 'string') return 0;
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function clamp(val, min = 20, max = 99) {
  return Math.max(min, Math.min(max, Math.round(val)));
}

export const multiAtsSimulatorService = {
  /**
   * Simulates parser quirks, scoring heuristics, and entity extraction across
   * Workday, Oracle Taleo, Greenhouse, and Lever.
   *
   * @param {string} resumeId
   * @param {string} userId
   */
  async simulateMultiAts(resumeId, userId) {
    const resume = await resumeRepository.findByIdForUser(resumeId, userId);
    if (!resume) throw ApiError.notFound('Resume not found.');

    const analysis = await analysisRepository.findLatestCompleted(resumeId);

    let rawText = '';
    try {
      rawText = resume.raw_text_encrypted ? decryptText(resume.raw_text_encrypted) : '';
    } catch (e) {
      logger.warn('Could not decrypt resume text for multi-ATS simulation', { error: e.message });
    }

    const sections = resume.parsed_sections || {};
    const flags = resume.formatting_flags || [];

    const kwScore = analysis ? Number(analysis.keyword_match_score) || 65 : 65;
    const atsScore = analysis ? Number(analysis.ats_compatibility_score) || 75 : 75;
    const matchedKws = analysis?.matched_keywords || [];
    const missingKws = analysis?.missing_keywords || [];

    // Diagnostic flags check
    const hasTableFlag = flags.some((f) => f.code === 'TABLES_DETECTED');
    const hasMultiColumnFlag = flags.some((f) => f.code === 'POSSIBLE_MULTI_COLUMN');
    const hasMissingSectionFlag = flags.some((f) => f.code === 'MISSING_SECTIONS');

    // Email and contact info position check
    const emailMatch = rawText.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    const phoneMatch = rawText.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
    const githubMatch = rawText.match(/github\.com\/[a-zA-Z0-9_-]+/i);
    const linkedinMatch = rawText.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);

    // Standard date pattern check (e.g. "Jan 2022", "01/2022", "January 2022 - Present")
    const standardDateMatches = countMatches(
      rawText,
      /(?:(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{4}|\b\d{1,2}\/\d{4}\b)/gi,
    );

    // -------------------------------------------------------------
    // 1. WORKDAY ATS (Used by Google, Amazon, Walmart, Target, Salesforce)
    // -------------------------------------------------------------
    // Workday is notorious for table-flattening bugs and stripping headers/footers
    let workdayPenalties = 0;
    const workdayQuirks = [];

    if (hasTableFlag) {
      workdayPenalties += 22;
      workdayQuirks.push({
        name: 'Table Flattening Hazard',
        status: 'FAIL',
        severity: 'high',
        detail: 'Workday reads table cells horizontally across columns, scrambling dates and company names into one line.',
      });
    } else {
      workdayQuirks.push({
        name: 'Single-Column Flow',
        status: 'PASS',
        severity: 'low',
        detail: 'No complex tables detected. Workday will parse text sequentially without column transposition.',
      });
    }

    if (hasMultiColumnFlag) {
      workdayPenalties += 18;
      workdayQuirks.push({
        name: 'Multi-Column Parsing Disruption',
        status: 'FAIL',
        severity: 'high',
        detail: 'Workday parser splits multi-column layouts into fragmented text strings, causing job roles to merge.',
      });
    }

    const hasCoreHeadings = sections.experience && sections.education && sections.skills;
    if (!hasCoreHeadings) {
      workdayPenalties += 15;
      workdayQuirks.push({
        name: 'Section Boundary Recognition',
        status: 'WARNING',
        severity: 'medium',
        detail: 'Workday requires strict section headings ("Experience", "Education", "Skills") to populate applicant profile tabs.',
      });
    } else {
      workdayQuirks.push({
        name: 'Section Boundary Recognition',
        status: 'PASS',
        severity: 'low',
        detail: 'Core headings cleanly detected. Workday will auto-populate Experience and Education profile tabs.',
      });
    }

    const workdayScore = clamp(atsScore * 0.5 + kwScore * 0.5 - workdayPenalties);
    const workdayStatus = workdayScore >= 80 ? 'PASSED' : workdayScore >= 60 ? 'CAUTION' : 'CRITICAL_FAIL';

    // -------------------------------------------------------------
    // 2. ORACLE TALEO (Used by Boeing, Lockheed, Oracle, Fortune 100 Banks)
    // -------------------------------------------------------------
    // Taleo requires strict date hierarchy for tenure calculation and strips all graphics
    let taleoPenalties = 0;
    const taleoQuirks = [];

    if (standardDateMatches < 2) {
      taleoPenalties += 25;
      taleoQuirks.push({
        name: 'Date Parsing & Tenure Calculation',
        status: 'FAIL',
        severity: 'high',
        detail: 'Taleo requires explicit "Month YYYY" or "MM/YYYY" date formats. Missing months cause Taleo to calculate 0 months tenure.',
      });
    } else {
      taleoQuirks.push({
        name: 'Date Format & Tenure Extraction',
        status: 'PASS',
        severity: 'low',
        detail: `Detected ${standardDateMatches} standard date tokens. Taleo will accurately calculate cumulative years of experience.`,
      });
    }

    if (missingKws.length > 5) {
      taleoPenalties += 15;
      taleoQuirks.push({
        name: 'Exact Stem Keyword Threshold',
        status: 'WARNING',
        severity: 'medium',
        detail: `Taleo uses strict root-word stem matching. ${missingKws.length} target job description keywords were not found.`,
      });
    } else {
      taleoQuirks.push({
        name: 'Keyword Stem Density',
        status: 'PASS',
        severity: 'low',
        detail: 'High density of matching core skills recognized by Taleo requisition filter.',
      });
    }

    const taleoScore = clamp(kwScore * 0.6 + atsScore * 0.4 - taleoPenalties);
    const taleoStatus = taleoScore >= 78 ? 'PASSED' : taleoScore >= 58 ? 'CAUTION' : 'CRITICAL_FAIL';

    // -------------------------------------------------------------
    // 3. GREENHOUSE ATS (Used by Airbnb, Stripe, DoorDash, Figma, Tech Leaders)
    // -------------------------------------------------------------
    // Greenhouse uses modern semantic parsers and compiles a Recruiter Review Digest
    let greenhouseBonus = 0;
    const greenhouseQuirks = [];

    const metricCount = countMatches(rawText, /(?:\d+%\s+|\$\d+|\d+x\s+|\d+\s*ms|\d+\s*users|\d+\s*qps)/gi);
    if (metricCount >= 4) {
      greenhouseBonus += 10;
      greenhouseQuirks.push({
        name: 'Recruiter Scorecard Metric Density',
        status: 'PASS',
        severity: 'low',
        detail: `Found ${metricCount} quantified metrics. Greenhouse scorecard highlights measurable business impact to hiring managers.`,
      });
    } else {
      greenhouseQuirks.push({
        name: 'Quantified Impact Density',
        status: 'WARNING',
        severity: 'medium',
        detail: 'Fewer than 4 quantified metrics found. Hiring managers scanning Greenhouse summaries prioritize numbers and ROI.',
      });
    }

    if (emailMatch && phoneMatch) {
      greenhouseQuirks.push({
        name: 'Candidate Entity Extraction',
        status: 'PASS',
        severity: 'low',
        detail: 'Name, email, and phone cleanly mapped into Greenhouse candidate profile card.',
      });
    } else {
      greenhouseQuirks.push({
        name: 'Candidate Entity Extraction',
        status: 'WARNING',
        severity: 'medium',
        detail: 'Contact details were ambiguous or partially parsed.',
      });
    }

    const greenhouseScore = clamp(kwScore * 0.55 + atsScore * 0.45 + greenhouseBonus);
    const greenhouseStatus = greenhouseScore >= 80 ? 'PASSED' : greenhouseScore >= 62 ? 'CAUTION' : 'CRITICAL_FAIL';

    // -------------------------------------------------------------
    // 4. LEVER ATS (Used by Netflix, Spotify, Shopify, Atlassian)
    // -------------------------------------------------------------
    // Lever automatically creates Skill Tags and checks GitHub/LinkedIn portfolios
    let leverBonus = 0;
    const leverQuirks = [];

    const discoveredSocials = [];
    if (githubMatch) discoveredSocials.push('GitHub');
    if (linkedinMatch) discoveredSocials.push('LinkedIn');

    if (discoveredSocials.length > 0) {
      leverBonus += 8;
      leverQuirks.push({
        name: 'Portfolio & Profile Deep-Link Indexing',
        status: 'PASS',
        severity: 'low',
        detail: `Lever successfully indexed candidate links (${discoveredSocials.join(', ')}). Recruiter one-click portfolio inspection enabled.`,
      });
    } else {
      leverQuirks.push({
        name: 'Social Profile Detection',
        status: 'WARNING',
        severity: 'medium',
        detail: 'No clear GitHub or LinkedIn profile URL detected in header. Lever auto-enrichment will be skipped.',
      });
    }

    const generatedSkillTags = matchedKws.slice(0, 8);
    leverQuirks.push({
      name: 'Automated Candidate Tagging',
      status: generatedSkillTags.length >= 4 ? 'PASS' : 'WARNING',
      severity: generatedSkillTags.length >= 4 ? 'low' : 'medium',
      detail: `Lever will auto-tag candidate with: ${generatedSkillTags.join(', ') || 'General Engineering'}.`,
    });

    const leverScore = clamp(kwScore * 0.5 + atsScore * 0.45 + leverBonus);
    const leverStatus = leverScore >= 80 ? 'PASSED' : leverScore >= 62 ? 'CAUTION' : 'CRITICAL_FAIL';

    // Aggregate Systems List
    const systems = [
      {
        id: 'workday',
        name: 'Workday ATS',
        vendor: 'Workday, Inc.',
        marketShare: '32% of Fortune 500',
        topEmployers: ['Google', 'Amazon', 'Walmart', 'Target', 'Bank of America', 'Salesforce'],
        score: workdayScore,
        status: workdayStatus,
        primaryHazard: hasTableFlag ? 'Table Flattening Risk' : hasMultiColumnFlag ? 'Multi-Column Disruption' : 'Strict Section Boundaries',
        quirks: workdayQuirks,
        emulatedParserView: `WORKDAY_PARSER_EXTRACTOR v2026.3:\n================================\nCANDIDATE_NAME: ${resume.display_name?.replace(/\.[^/.]+$/, '') || 'Candidate'}\nCONTACT_PARSED: ${emailMatch ? emailMatch[0] : 'NOT FOUND'} | ${phoneMatch ? phoneMatch[0] : 'NOT FOUND'}\nSECTION_EXPERIENCE: ${sections.experience ? 'IDENTIFIED (OK)' : 'UNIDENTIFIED'}\nSECTION_EDUCATION: ${sections.education ? 'IDENTIFIED (OK)' : 'UNIDENTIFIED'}\nLAYOUT_INTEGRITY: ${hasTableFlag ? 'POTENTIAL CORRUPTION (TABLE DETECTED)' : 'CLEAN SEQUENTIAL STREAM'}\nSTATUS: ${workdayStatus}`,
        actionableFix: hasTableFlag
          ? 'Convert multi-column tables into a clean, single-column bullet list to prevent Workday from scrambling line order.'
          : 'Ensure contact details are in the top body text, not inside Word header/footer zones.',
      },
      {
        id: 'taleo',
        name: 'Oracle Taleo Enterprise',
        vendor: 'Oracle Corporation',
        marketShare: '24% of Global Enterprises',
        topEmployers: ['Boeing', 'Lockheed Martin', 'Oracle', 'JPMorgan Chase', 'General Electric'],
        score: taleoScore,
        status: taleoStatus,
        primaryHazard: standardDateMatches < 2 ? 'Date Hierarchy Disruption' : 'Plain-Text Graphic Stripping',
        quirks: taleoQuirks,
        emulatedParserView: `ORACLE_TALEO_INGESTION_ENGINE:\n==============================\nAPPLICANT_ID: #TL-${resume.id.slice(0, 8).toUpperCase()}\nTENURE_RECOGNITION: ${standardDateMatches >= 2 ? 'ACTIVE (' + standardDateMatches + ' DATES IDENTIFIED)' : 'FAILED (NON-STANDARD DATES)'}\nSTRIPPED_GRAPHICS: 0 RETAINED (PURE TEXT STREAM)\nREQUISITION_KEYWORD_MATCH: ${kwScore}%\nSTATUS: ${taleoStatus}`,
        actionableFix: standardDateMatches < 2
          ? 'Use strict "Month YYYY - Month YYYY" format for every role so Taleo can calculate total years of experience.'
          : 'Avoid any text boxes or floating graphics, as Taleo discards them completely.',
      },
      {
        id: 'greenhouse',
        name: 'Greenhouse Talent ATS',
        vendor: 'Greenhouse Software',
        marketShare: 'Dominant in Top Tech & Scaleups',
        topEmployers: ['Airbnb', 'Stripe', 'DoorDash', 'Figma', 'GitHub', 'Databricks'],
        score: greenhouseScore,
        status: greenhouseStatus,
        primaryHazard: metricCount < 4 ? 'Low Quantified Metric Density' : 'Scorecard Skill Gaps',
        quirks: greenhouseQuirks,
        emulatedParserView: `GREENHOUSE_HARVEST_DIGEST:\n===========================\nCANDIDATE_RUBRIC: ${greenhouseScore}% MATCH\nRECRUITER_SCREEN_READY: ${greenhouseScore >= 75 ? 'YES' : 'MARGINAL'}\nMETRIC_SIGNALS_DETECTED: ${metricCount} QUANTIFIABLE IMPACT STATEMENTS\nSTATUS: ${greenhouseStatus}`,
        actionableFix: 'Add at least 3-4 numerical metrics (percentages, latency, throughput, scale) to maximize Greenhouse scorecard ranking.',
      },
      {
        id: 'lever',
        name: 'Lever Talent Suite',
        vendor: 'Lever / Employ Inc.',
        marketShare: 'Top Tier High-Velocity Tech',
        topEmployers: ['Netflix', 'Spotify', 'Shopify', 'Atlassian', 'Twilio'],
        score: leverScore,
        status: leverStatus,
        primaryHazard: discoveredSocials.length === 0 ? 'Missing Social Portfolio Profile' : 'Pipeline Tagging Gaps',
        quirks: leverQuirks,
        emulatedParserView: `LEVER_TALENT_OPPORTUNITY_RECORD:\n=================================\nORIGIN: ONLINE_APPLICATION\nAUTO_TAGS: [${generatedSkillTags.join(', ') || 'ENGINEERING'}]\nPORTFOLIO_LINKS: [${discoveredSocials.join(', ') || 'NONE_DETECTED'}]\nSCORE: ${leverScore}%\nSTATUS: ${leverStatus}`,
        actionableFix: 'Include direct GitHub and LinkedIn URLs in your header so Lever can automatically enrich and tag your profile.',
      },
    ];

    // Safest vs most vulnerable platform
    const sorted = [...systems].sort((a, b) => b.score - a.score);
    const safestAts = sorted[0];
    const mostVulnerableAts = sorted[sorted.length - 1];

    return {
      resumeId: resume.id,
      displayName: resume.display_name || resume.file_name,
      overallMultiAtsScore: Math.round(
        (workdayScore + taleoScore + greenhouseScore + leverScore) / 4,
      ),
      safestAts: {
        id: safestAts.id,
        name: safestAts.name,
        score: safestAts.score,
      },
      mostVulnerableAts: {
        id: mostVulnerableAts.id,
        name: mostVulnerableAts.name,
        score: mostVulnerableAts.score,
        primaryHazard: mostVulnerableAts.primaryHazard,
      },
      systems,
    };
  },
};
