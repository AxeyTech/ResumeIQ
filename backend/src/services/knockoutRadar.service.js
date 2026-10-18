import { analysisRepository } from '../repositories/analysis.repository.js';
import { resumeRepository } from '../repositories/resume.repository.js';
import { jobDescriptionRepository } from '../repositories/jobDescription.repository.js';
import { decryptText } from '../utils/encryption.js';
import { geminiClient } from './geminiClient.service.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../config/logger.js';

/**
 * Calculates candidate's total years of experience from dated history
 * Matches patterns like '2019 - Present', '2020 - 2024', 'Jan 2021 - Present'
 */
function estimateCandidateExperienceYears(text) {
  if (!text || typeof text !== 'string') return 0;

  // Direct mention check first (e.g. "5+ years of experience")
  const directMatches = text.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)/i);
  if (directMatches && directMatches[1]) {
    const yrs = parseInt(directMatches[1], 10);
    if (yrs > 0 && yrs < 45) return yrs;
  }

  // Parse date ranges
  const yearRegex = /\b(20[0-2][0-9]|19[89][0-9])\b/g;
  const yearsFound = [];
  let m;
  while ((m = yearRegex.exec(text)) !== null) {
    yearsFound.push(parseInt(m[1], 10));
  }

  if (yearsFound.length >= 2) {
    const currentYear = new Date().getFullYear();
    const minYear = Math.min(...yearsFound);
    const hasPresent = /\b(present|current|now|ongoing)\b/i.test(text);
    const maxYear = hasPresent ? currentYear : Math.min(currentYear, Math.max(...yearsFound));
    const span = maxYear - minYear;
    if (span >= 1 && span <= 40) {
      return span;
    }
  }

  return 2; // Default conservative estimate
}

/**
 * Extracts required years of experience from job description
 */
function extractRequiredYearsFromJd(jdText) {
  if (!jdText || typeof jdText !== 'string') return null;

  const patterns = [
    /(\d+)\+?\s*(?:to\s*\d+)?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:professional|relevant|industry|hands-on|software|engineering|work)?\s*experience/i,
    /minimum\s*(?:of)?\s*(\d+)\+?\s*(?:years?|yrs?)/i,
    /at\s*least\s*(\d+)\+?\s*(?:years?|yrs?)/i,
    /(\d+)\+?\s*(?:years?|yrs?)\s*(?:in|with)/i,
  ];

  for (const regex of patterns) {
    const match = jdText.match(regex);
    if (match && match[1]) {
      const yrs = parseInt(match[1], 10);
      if (yrs > 0 && yrs <= 30) return yrs;
    }
  }

  return null;
}

/**
 * Checks for required degree in JD vs resume
 */
function evaluateDegreeRequirement(jdText, resumeText) {
  const normJd = (jdText || '').toLowerCase();
  const normResume = (resumeText || '').toLowerCase();

  const jdHasMasters = /\b(master'?s?|m\.?s\.?|m\.?tech|post\s*graduate)\b/i.test(normJd);
  const jdHasBachelors = /\b(bachelor'?s?|b\.?s\.?|b\.?tech|b\.?e\.?|undergraduate|degree\s*in)\b/i.test(normJd);
  const jdRequiresDegree = jdHasMasters || jdHasBachelors || /\b(degree\s*required|must\s*have\s*(?:a\s*)?degree)\b/i.test(normJd);

  const resumeHasMasters = /\b(master'?s?|m\.?s\.?|m\.?tech|mba|post\s*graduate)\b/i.test(normResume);
  const resumeHasBachelors = /\b(bachelor'?s?|b\.?s\.?|b\.?tech|b\.?e\.?|undergraduate|bba|bca)\b/i.test(normResume);
  const resumeHasAnyDegree = resumeHasMasters || resumeHasBachelors || /\b(university|college|institute of technology|b\.s|m\.s)\b/i.test(normResume);

  if (!jdRequiresDegree) {
    return {
      id: 'deg_check',
      category: 'education',
      title: 'Academic Degree & Credentials',
      requirement: 'No strict degree hard requirement specified in Job Description',
      candidateStatus: resumeHasAnyDegree ? 'Academic degree detected on resume' : 'Practical skills & portfolio focused',
      status: 'PASSED',
      severity: 'low',
      recommendation: 'Highlight practical production achievements and portfolio links.',
    };
  }

  if (jdHasMasters) {
    if (resumeHasMasters) {
      return {
        id: 'deg_check',
        category: 'education',
        title: 'Master\'s Degree Requirement',
        requirement: 'Advanced Master\'s or equivalent graduate degree preferred/required',
        candidateStatus: 'Master\'s / Graduate degree detected',
        status: 'PASSED',
        severity: 'low',
        recommendation: 'Verify graduation year, thesis/capstone, and major are explicitly visible in the Education header.',
      };
    } else if (resumeHasBachelors) {
      return {
        id: 'deg_check',
        category: 'education',
        title: 'Master\'s Degree Requirement',
        requirement: 'Job description mentions Master\'s degree',
        candidateStatus: 'Bachelor\'s degree detected',
        status: 'FRICTION',
        severity: 'medium',
        recommendation: 'Emphasize equivalent years of practical senior experience and research or certifications to offset graduate requirement.',
      };
    }
  }

  if (jdHasBachelors) {
    if (resumeHasAnyDegree) {
      return {
        id: 'deg_check',
        category: 'education',
        title: 'Bachelor\'s Degree Clearance',
        requirement: 'Bachelor\'s degree in CS, Engineering, or related technical field',
        candidateStatus: 'Degree credentials verified',
        status: 'PASSED',
        severity: 'low',
        recommendation: 'Keep GPA off unless requested; ensure degree name and institution are formatted in single-column text.',
      };
    } else {
      return {
        id: 'deg_check',
        category: 'education',
        title: 'Bachelor\'s Degree Clearance',
        requirement: 'Bachelor\'s degree mandatory or strictly preferred',
        candidateStatus: 'No formal degree heading detected in parsed sections',
        status: 'DISQUALIFIER',
        severity: 'high',
        recommendation: 'If you have a degree or coursework, add an explicit "Education" heading. If self-taught, explicitly add "B.S. equivalent experience" in summary to prevent automated ATS drop.',
      };
    }
  }

  return {
    id: 'deg_check',
    category: 'education',
    title: 'Degree & Educational Alignment',
    requirement: 'Standard technical education threshold',
    candidateStatus: resumeHasAnyDegree ? 'Verified degree present' : 'Alternative credential path',
    status: resumeHasAnyDegree ? 'PASSED' : 'FRICTION',
    severity: resumeHasAnyDegree ? 'low' : 'medium',
    recommendation: 'Confirm university, major, and graduation year are clean and free of table formatting.',
  };
}

/**
 * Checks work authorization & security clearance disqualifiers
 */
function evaluateWorkAuthorization(jdText, resumeText) {
  const normJd = (jdText || '').toLowerCase();
  const normResume = (resumeText || '').toLowerCase();

  const jdNoSponsorship = /\b(no\s+sponsorship|unable\s+to\s+sponsor|cannot\s+sponsor|not\s+offering\s+sponsorship|authorized\s+to\s+work\s+without\s+sponsorship|us\s+citizen\s+or\s+permanent\s+resident)\b/i.test(normJd);
  const jdRequiresClearance = /\b(security\s+clearance|secret\s+clearance|top\s+secret|ts\/sci|public\s+trust|active\s+clearance)\b/i.test(normJd);
  const jdRequiresCitizen = /\b(us\s+citizen(?:ship)?|united\s+states\s+citizen|u\.s\.\s+citizenship\s+required)\b/i.test(normJd);

  const resumeHasClearance = /\b(clearance|secret|ts\/sci|public trust)\b/i.test(normResume);
  const resumeHasAuth = /\b(authorized to work|us citizen|permanent resident|green card|no sponsorship required)\b/i.test(normResume);

  if (jdRequiresClearance) {
    if (resumeHasClearance) {
      return {
        id: 'auth_check',
        category: 'authorization',
        title: 'Security Clearance Mandate',
        requirement: 'Active government/defense security clearance required',
        candidateStatus: 'Clearance terminology detected in resume',
        status: 'PASSED',
        severity: 'low',
        recommendation: 'Highlight your exact clearance level (e.g. Secret / TS-SCI) in your top contact header.',
      };
    } else {
      return {
        id: 'auth_check',
        category: 'authorization',
        title: 'Security Clearance Mandate',
        requirement: 'Position mandates active government or defense security clearance',
        candidateStatus: 'No active clearance detected on resume',
        status: 'DISQUALIFIER',
        severity: 'high',
        recommendation: 'ATS knockout question: "Do you possess an active clearance?" will automatically reject. If you hold one, prominently feature it right under your name.',
      };
    }
  }

  if (jdNoSponsorship || jdRequiresCitizen) {
    if (resumeHasAuth) {
      return {
        id: 'auth_check',
        category: 'authorization',
        title: 'Work Authorization & Sponsorship Policy',
        requirement: 'Position specifies no visa sponsorship or US citizenship requirement',
        candidateStatus: 'Work authorization indicator stated on resume',
        status: 'PASSED',
        severity: 'low',
        recommendation: 'Keep work authorization phrase explicit in header for Workday / Greenhouse auto-check.',
      };
    } else {
      return {
        id: 'auth_check',
        category: 'authorization',
        title: 'Work Authorization & Sponsorship Policy',
        requirement: 'Company states no visa sponsorship available for this opening',
        candidateStatus: 'Status not explicitly declared in contact header',
        status: 'FRICTION',
        severity: 'medium',
        recommendation: 'If you are a citizen or permanent resident, add "Work Authorization: US Citizen / Permanent Resident" in header to immediately clear automated filters.',
      };
    }
  }

  return {
    id: 'auth_check',
    category: 'authorization',
    title: 'Work Authorization Screening',
    requirement: 'Standard legal right to work check',
    candidateStatus: 'No restrictive sponsorship exclusions flagged in job posting',
    status: 'PASSED',
    severity: 'low',
    recommendation: 'Be prepared for standard Workday right-to-work checkbox questions.',
  };
}

/**
 * Checks mandatory tech stack & critical missing skills
 */
function evaluateMandatoryStack(missingKws, matchedKws, jdText) {
  const normJd = (jdText || '').toLowerCase();
  const criticalMissing = (missingKws || []).slice(0, 5);

  // Check if JD has explicit "must have" or "required qualifications"
  const hasStrictRequired = /\b(must\s+have|required\s+skills|minimum\s+qualifications|strictly\s+required)\b/i.test(normJd);

  if (criticalMissing.length >= 3 && hasStrictRequired) {
    return {
      id: 'stack_check',
      category: 'skill',
      title: 'Mandatory Technical Stack Match',
      requirement: `Critical required tools/frameworks missing: ${criticalMissing.slice(0, 3).join(', ')}`,
      candidateStatus: `${criticalMissing.length} required keywords absent from parsed resume text`,
      status: 'DISQUALIFIER',
      severity: 'high',
      recommendation: `Add verifiable experience with [${criticalMissing.slice(0, 3).join(', ')}] into your Skills and Experience bullets before applying.`,
    };
  } else if (criticalMissing.length > 0) {
    return {
      id: 'stack_check',
      category: 'skill',
      title: 'Core Technical Keyword Coverage',
      requirement: `Key skills sought by recruiter: ${criticalMissing.slice(0, 3).join(', ')}`,
      candidateStatus: `${matchedKws.length} skills matched; ${criticalMissing.length} target keywords pending`,
      status: 'FRICTION',
      severity: 'medium',
      recommendation: `Incorporate '${criticalMissing[0]}' and '${criticalMissing[1] || ''}' into your top project or summary bullet to satisfy automated keyword filters.`,
    };
  }

  return {
    id: 'stack_check',
    category: 'skill',
    title: 'Core Technical Stack Clearance',
    requirement: 'Strong match across required programming languages, tools, and platforms',
    candidateStatus: `Excellent coverage with ${matchedKws.length} verified technical keywords`,
    status: 'PASSED',
    severity: 'low',
    recommendation: 'Core technical stack matches ATS filter criteria perfectly.',
  };
}

/**
 * Checks location and on-site / relocation constraints
 */
function evaluateLocationConstraints(jdText, resumeText) {
  const normJd = (jdText || '').toLowerCase();

  const isOnsiteStrict = /\b(on-site\s+5\s+days|100%\s+on-site|must\s+be\s+on-site|no\s+remote|strictly\s+in-office)\b/i.test(normJd);
  const isHybrid = /\b(hybrid|in-office\s+\d+\s+days|relocation\s+required)\b/i.test(normJd);

  if (isOnsiteStrict) {
    return {
      id: 'loc_check',
      category: 'location',
      title: 'On-Site Office Attendance Mandate',
      requirement: 'Role requires 100% on-site presence (strictly non-remote)',
      candidateStatus: 'Strict location constraint detected in job posting',
      status: 'FRICTION',
      severity: 'medium',
      recommendation: 'Ensure your current city or "Willing to relocate / Local Candidate" is prominently displayed on line 2 of your header.',
    };
  }

  if (isHybrid) {
    return {
      id: 'loc_check',
      category: 'location',
      title: 'Hybrid Workspace Requirement',
      requirement: 'Hybrid work model specified (commutable distance required)',
      candidateStatus: 'Standard hybrid requirement detected',
      status: 'PASSED',
      severity: 'low',
      recommendation: 'Confirm target city or commuting radius aligns with the office location.',
    };
  }

  return {
    id: 'loc_check',
    category: 'location',
    title: 'Location & Work Flexibility Clearance',
    requirement: 'Remote friendly or flexible arrangement',
    candidateStatus: 'No strict geographic knockout clauses identified',
    status: 'PASSED',
    severity: 'low',
    recommendation: 'Standard location guidelines apply.',
  };
}

/**
 * Universal ATS parser drop checks (format, contact info, metrics)
 */
function evaluateAtsStructuralDroppers(resume, analysis) {
  const items = [];
  const issues = analysis.issues || [];
  const highIssues = issues.filter(i => i.severity === 'high');

  // Contact Info Check
  const noEmail = issues.some(i => i.code === 'NO_EMAIL_DETECTED');
  const noPhone = issues.some(i => i.code === 'NO_PHONE_DETECTED');

  if (noEmail) {
    items.push({
      id: 'contact_check',
      category: 'formatting',
      title: 'Missing Recruiter Contact Info',
      requirement: 'Clear, easily readable email address at the top of the document',
      candidateStatus: 'Email address missing or placed in an unparseable header/table',
      status: 'DISQUALIFIER',
      severity: 'high',
      recommendation: 'Immediate knockout risk: ATS parsers cannot create candidate records without a primary email address. Put email in plain text on line 2.',
    });
  } else if (noPhone) {
    items.push({
      id: 'contact_check',
      category: 'formatting',
      title: 'Telephone Contact Discoverability',
      requirement: 'Phone number in standard format',
      candidateStatus: 'Phone number could not be reliably extracted from header',
      status: 'FRICTION',
      severity: 'medium',
      recommendation: 'Add standard phone format (e.g. +1 555-123-4567) alongside your email.',
    });
  } else {
    items.push({
      id: 'contact_check',
      category: 'formatting',
      title: 'Contact Header Parser Extraction',
      requirement: 'Parseable email, phone, and professional links',
      candidateStatus: 'Contact details successfully parsed by ATS indexer',
      status: 'PASSED',
      severity: 'low',
      recommendation: 'Contact information meets Taleo and Workday ingestion standards.',
    });
  }

  // Formatting & Parse Quality Check
  if (highIssues.length > 0) {
    items.push({
      id: 'format_drop_check',
      category: 'formatting',
      title: 'ATS Parser Structural Integrity',
      requirement: 'Single-column text, standard UTF-8 bullets, no tables or graphical text boxes',
      candidateStatus: `${highIssues.length} severe layout/parsing warnings detected`,
      status: 'DISQUALIFIER',
      severity: 'high',
      recommendation: 'Severe formatting issues cause commercial ATS scanners to scramble work history into unreadable gibberish. Use ResumeIQ 1-Click Builder to export clean single-column PDF.',
    });
  } else {
    items.push({
      id: 'format_drop_check',
      category: 'formatting',
      title: 'ATS Parser Structural Integrity',
      requirement: 'Clean single-column parsing clearance with standard header taxonomy',
      candidateStatus: '0 severe parser structural errors detected',
      status: 'PASSED',
      severity: 'low',
      recommendation: 'Layout is 100% compliant with commercial ATS parsing engines.',
    });
  }

  return items;
}

export const knockoutRadarService = {
  /**
   * Evaluates all knockout criteria & hard disqualifiers
   * @param {string} analysisId
   * @param {string} userId
   */
  async scanKnockoutRadar(analysisId, userId) {
    const analysis = await analysisRepository.findByIdForUser(analysisId, userId);
    if (!analysis) throw ApiError.notFound('Analysis not found.');

    const resume = await resumeRepository.findByIdForUser(analysis.resume_id, userId);
    if (!resume) throw ApiError.notFound('Resume not found.');

    let rawResumeText = '';
    try {
      rawResumeText = decryptText(resume.raw_text_encrypted) || '';
    } catch (e) {
      logger.warn('Could not decrypt resume for knockout scan', { error: e.message });
    }

    let jdText = '';
    if (analysis.job_description_id) {
      const jd = await jobDescriptionRepository.findById(analysis.job_description_id);
      if (jd) jdText = jd.raw_text || '';
    } else {
      const jd = await jobDescriptionRepository.findByResumeId(resume.id);
      if (jd) jdText = jd.raw_text || '';
    }

    const matchedKws = analysis.matched_keywords || [];
    const missingKws = analysis.missing_keywords || [];

    // 1. Evaluate Experience Threshold
    const requiredYears = extractRequiredYearsFromJd(jdText);
    const candidateYears = estimateCandidateExperienceYears(rawResumeText);

    let expItem;
    if (requiredYears !== null) {
      if (candidateYears >= requiredYears) {
        expItem = {
          id: 'exp_check',
          category: 'experience',
          title: 'Minimum Experience Threshold',
          requirement: `Requires minimum ${requiredYears}+ years of professional experience`,
          candidateStatus: `Detected ${candidateYears} years of cumulative experience in resume history`,
          status: 'PASSED',
          severity: 'low',
          recommendation: `Total years satisfy the ${requiredYears}+ year minimum requirement.`,
        };
      } else if (candidateYears >= requiredYears - 1) {
        expItem = {
          id: 'exp_check',
          category: 'experience',
          title: 'Minimum Experience Threshold',
          requirement: `Requires minimum ${requiredYears}+ years of professional experience`,
          candidateStatus: `Detected ~${candidateYears} years of dated history (close to threshold)`,
          status: 'FRICTION',
          severity: 'medium',
          recommendation: `Workday / Greenhouse screening questions may ask: "Do you have at least ${requiredYears} years of experience?". Include freelance, internship, or graduate project years in your Executive Summary to bridge the gap.`,
        };
      } else {
        expItem = {
          id: 'exp_check',
          category: 'experience',
          title: 'Minimum Experience Threshold',
          requirement: `Requires minimum ${requiredYears}+ years of professional experience`,
          candidateStatus: `Detected ~${candidateYears} years (${requiredYears - candidateYears} years below strict threshold)`,
          status: 'DISQUALIFIER',
          severity: 'high',
          recommendation: `High knockout probability: Automated applicant screening filters will instantly reject submissions below ${requiredYears} years. Group all related contract/consulting/open-source work to reach the required number or apply via referral.`,
        };
      }
    } else {
      expItem = {
        id: 'exp_check',
        category: 'experience',
        title: 'Career Tenure & Seniority Level',
        requirement: 'General market standard for targeted engineering role',
        candidateStatus: `Detected ~${candidateYears} years of professional engineering tenure`,
        status: candidateYears >= 2 ? 'PASSED' : 'FRICTION',
        severity: candidateYears >= 2 ? 'low' : 'medium',
        recommendation: candidateYears >= 2
          ? 'Experience depth is solid for mid/senior level indexing.'
          : 'For senior roles, explicitly highlight cumulative years across all projects in your summary.',
      };
    }

    // 2. Evaluate Degree & Academic Credentials
    const degreeItem = evaluateDegreeRequirement(jdText, rawResumeText);

    // 3. Evaluate Core Tech Stack & Mandatory Tools
    const stackItem = evaluateMandatoryStack(missingKws, matchedKws, jdText);

    // 4. Evaluate Work Authorization & Sponsorship Policy
    const authItem = evaluateWorkAuthorization(jdText, rawResumeText);

    // 5. Evaluate Location Constraints
    const locItem = evaluateLocationConstraints(jdText, rawResumeText);

    // 6. Evaluate Universal ATS Structural Parser Droppers
    const formatItems = evaluateAtsStructuralDroppers(resume, analysis);

    // Combine all radar items
    let allItems = [expItem, degreeItem, stackItem, authItem, locItem, ...formatItems];

    // AI verification and deep screening simulation via Gemini
    if (geminiClient.isConfigured() && rawResumeText.length > 50) {
      try {
        const prompt = `You are a Principal ATS Architect and Enterprise Hiring Operations Specialist.
Analyze this Resume and Target Job Context for automated knockout criteria (Workday, Greenhouse, Taleo, iCIMS).
Identify if any hard disqualifiers exist (e.g. strict years of experience, mandatory degree, clearance, sponsorship exclusions, or non-negotiable tech stack).

Job Description / Target Context:
"""
${jdText ? jdText.slice(0, 4000) : 'General high-growth technology engineering and modern tech standards for candidate\'s target seniority.'}
"""

Full Resume:
"""
${rawResumeText.slice(0, 6000)}
"""

Return a JSON object in this exact schema:
{
  "simulatedAtsQuestions": [
    {
      "question": "string (e.g. 'Do you possess at least 5 years of commercial Python experience?')",
      "applicantAnswer": "Yes" | "No" | "Needs Clarification",
      "riskLevel": "high" | "medium" | "low",
      "guidance": "string"
    }
  ],
  "expertTake": "string (1-2 sentences on auto-rejection risk)"
}
`;
        const aiResult = await geminiClient.generateJson(prompt, { temperature: 0.1, maxOutputTokens: 2048 });
        if (aiResult && Array.isArray(aiResult.simulatedAtsQuestions) && aiResult.simulatedAtsQuestions.length > 0) {
          analysis._aiKnockout = aiResult;
        }
      } catch (e) {
        logger.debug('Gemini knockout enrichment skipped or failed', { error: e.message });
      }
    }

    // Compute aggregate risk metrics
    const disqualifiers = allItems.filter(i => i.status === 'DISQUALIFIER');
    const frictions = allItems.filter(i => i.status === 'FRICTION');
    const passed = allItems.filter(i => i.status === 'PASSED');

    let overallStatus = 'CLEARED';
    let riskScore = 12; // Base safe baseline

    if (disqualifiers.length > 0) {
      overallStatus = 'HIGH_RISK';
      riskScore = Math.min(96, 65 + disqualifiers.length * 15 + frictions.length * 5);
    } else if (frictions.length >= 2) {
      overallStatus = 'CAUTION';
      riskScore = Math.min(58, 30 + frictions.length * 10);
    } else if (frictions.length === 1) {
      overallStatus = 'CAUTION';
      riskScore = 28;
    }

    const summary = overallStatus === 'CLEARED'
      ? 'All automated knockout thresholds passed. Zero strict disqualifiers detected across experience, education, authorization, and ATS parsing standards.'
      : overallStatus === 'CAUTION'
      ? `${frictions.length} potential friction point${frictions.length > 1 ? 's' : ''} detected. Recruiter screening questions may require verbal clarification or phrasing adjustments.`
      : `High automated rejection risk: ${disqualifiers.length} hard knockout disqualifier${disqualifiers.length > 1 ? 's' : ''} detected. Workday or Taleo automated filters will likely screen this application out before human recruiter review.`;

    return {
      analysisId,
      overallStatus,
      riskScore,
      summary,
      totalChecked: allItems.length,
      clearedCount: passed.length,
      warningCount: frictions.length,
      knockoutCount: disqualifiers.length,
      items: allItems,
      simulatedAtsQuestions: analysis._aiKnockout?.simulatedAtsQuestions || [
        {
          question: requiredYears ? `Do you have at least ${requiredYears} years of professional engineering experience?` : 'Do you meet the core experience requirements for this role?',
          applicantAnswer: (requiredYears && candidateYears < requiredYears) ? 'Needs Clarification' : 'Yes',
          riskLevel: (requiredYears && candidateYears < requiredYears) ? 'high' : 'low',
          guidance: 'Ensure your executive summary explicitly mentions total cumulative years across all projects.'
        },
        {
          question: 'Are you legally authorized to work in the country of employment without requiring visa sponsorship?',
          applicantAnswer: 'Yes',
          riskLevel: 'low',
          guidance: 'Commercial ATS platforms index this as a non-negotiable boolean checkbox.'
        },
        {
          question: 'Do you have verifiable production experience with the required primary technical stack?',
          applicantAnswer: missingKws.length > 3 ? 'Needs Clarification' : 'Yes',
          riskLevel: missingKws.length > 3 ? 'medium' : 'low',
          guidance: missingKws.length > 0 ? `Target missing keywords: ${missingKws.slice(0, 3).join(', ')}.` : 'Stack alignment satisfies primary automated filter.'
        }
      ],
      expertTake: analysis._aiKnockout?.expertTake || (
        overallStatus === 'CLEARED'
          ? 'Resume clears automated screening filters cleanly. Ready for immediate job application submission.'
          : 'Address the highlighted knockout items above to protect your application from automated Workday/Taleo filter drops.'
      )
    };
  }
};
