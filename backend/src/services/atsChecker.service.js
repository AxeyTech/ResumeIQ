const SEVERITY_PENALTY = { high: 16, medium: 9, low: 4 };
const CANONICAL_SECTIONS = ['contact', 'summary', 'education', 'experience', 'skills', 'projects', 'certifications'];

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;

/**
 * FR-3.1/3.2/3.3/3.4: evaluates a parsed resume for ATS-compatible
 * formatting and structure, returning a 0-100 score and a list of specific,
 * plain-language issues.
 * @param {{ rawText: string, sections: Record<string, string>, parseFormattingFlags: any[] }} resume
 */
function evaluate({ rawText = '', sections, parseFormattingFlags = [] }) {
  const issues = [];
  const text = rawText || '';

  // Carry forward the flags already detected during parsing (FR-1.5),
  // reframed with a title for consistent presentation.
  for (const flag of parseFormattingFlags) {
    issues.push({
      code: flag.code,
      severity: flag.severity,
      title: titleForCode(flag.code),
      message: flag.message,
    });
  }

  // FR-3.2: missing standard sections, individually — more actionable than
  // the aggregate check performed at parse time.
  const foundSections = new Set(Object.keys(sections || {}));
  const missing = CANONICAL_SECTIONS.filter((s) => !foundSections.has(s));
  const missingCritical = missing.filter((s) => ['experience', 'skills', 'education'].includes(s));
  const missingOptional = missing.filter((s) => !missingCritical.includes(s));

  if (missingCritical.length === 0 && missingOptional.length > 0) {
    issues.push({
      code: 'MISSING_OPTIONAL_SECTIONS',
      severity: 'low',
      title: 'Some optional sections were not found',
      message: `No clearly labeled ${missingOptional.join(', ')} section${missingOptional.length > 1 ? 's were' : ' was'} detected. These aren't required, but including them can strengthen keyword coverage.`,
    });
  }

  // FR-3.1: contact discoverability.
  const contactText = sections?.contact || text.slice(0, 500);
  if (!EMAIL_RE.test(contactText)) {
    issues.push({
      code: 'NO_EMAIL_DETECTED',
      severity: 'high',
      title: 'No email address detected',
      message: 'An email address could not be found near the top of the resume. ATS systems and recruiters expect it to be easy to locate.',
    });
  }
  if (!PHONE_RE.test(contactText)) {
    issues.push({
      code: 'NO_PHONE_DETECTED',
      severity: 'medium',
      title: 'No phone number detected',
      message: 'A phone number could not be found near the top of the resume.',
    });
  }

  // FR-3.1: bullet usage — resumes that are mostly prose parse and scan worse.
  const bulletLines = (text.match(/^[\s]*[•\-*▪◦]\s+/gm) || []).length;
  const totalLines = text.split(/\r?\n/).filter((l) => l.trim()).length;
  if (totalLines > 15 && bulletLines / totalLines < 0.15) {
    issues.push({
      code: 'LOW_BULLET_USAGE',
      severity: 'low',
      title: 'Few bullet points detected',
      message: 'Most of this resume appears to be written in paragraph form. Bulleted, single-line achievements are easier for both ATS parsers and recruiters to scan.',
    });
  }

  const score = computeScore(issues);
  return { score, issues: sortBySeverity(issues) };
}

function computeScore(issues) {
  let score = 100;
  for (const issue of issues) {
    score -= SEVERITY_PENALTY[issue.severity] ?? 5;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

function sortBySeverity(issues) {
  const rank = { high: 0, medium: 1, low: 2 };
  return [...issues].sort((a, b) => (rank[a.severity] ?? 3) - (rank[b.severity] ?? 3));
}

function titleForCode(code) {
  const titles = {
    MISSING_SECTIONS: 'Missing critical sections',
    POSSIBLE_MULTI_COLUMN: 'Possible multi-column layout',
    TABLES_DETECTED: 'Tables detected',
    DENSE_TEXT_BLOCKS: 'Long unbroken paragraphs',
    UNUSUAL_ENCODING: 'Unusual characters or embedded graphics',
    EXCESSIVE_LENGTH: 'Resume may be too long',
  };
  return titles[code] || 'Formatting issue';
}

export const atsCheckerService = { evaluate };
