import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { ApiError } from '../utils/apiError.js';

// FR-1.4: standard resume sections we try to detect.
const SECTION_DEFS = [
  { key: 'contact', headings: ['contact', 'contact information', 'personal details'] },
  { key: 'summary', headings: ['summary', 'objective', 'profile', 'about me', 'professional summary'] },
  { key: 'education', headings: ['education', 'academic background', 'academics'] },
  { key: 'experience', headings: ['experience', 'work experience', 'employment history', 'professional experience'] },
  { key: 'skills', headings: ['skills', 'technical skills', 'core competencies'] },
  { key: 'projects', headings: ['projects', 'personal projects', 'academic projects'] },
  { key: 'certifications', headings: ['certifications', 'certificates', 'licenses'] },
];

/**
 * FR-1.3/1.4: splits raw resume text into named sections by scanning for
 * heading-like lines (short, mostly-uppercase-or-titlecase lines that match
 * one of the known section names).
 * @param {string} text
 */
function detectSections(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const sections = {};
  let currentKey = null;
  let buffer = [];

  const flush = () => {
    if (currentKey && buffer.length) {
      sections[currentKey] = (sections[currentKey] ? sections[currentKey] + '\n' : '') + buffer.join('\n').trim();
    }
    buffer = [];
  };

  for (const line of lines) {
    const matchedKey = matchHeading(line);
    if (matchedKey) {
      flush();
      currentKey = matchedKey;
      continue;
    }
    if (currentKey) buffer.push(line);
  }
  flush();

  return sections;
}

function matchHeading(line) {
  if (!line || line.length > 40) return null; // headings are short
  const normalized = line.toLowerCase().replace(/[^a-z\s]/g, '').trim();
  if (!normalized) return null;

  for (const def of SECTION_DEFS) {
    if (def.headings.some((h) => normalized === h || normalized.startsWith(h))) {
      return def.key;
    }
  }
  return null;
}

/**
 * FR-1.5: flags resume characteristics known to impair ATS parsing. These
 * are heuristics over the extracted plain text — a real layout analysis
 * would need access to the document's visual structure, which text
 * extraction alone does not preserve.
 * @param {string} text
 * @param {Record<string, string>} sections
 * @param {{ hasTables?: boolean }} [docStructureHints]
 */
function detectFormattingFlags(text, sections, docStructureHints = {}) {
  const flags = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

  const missingCore = ['experience', 'skills', 'education'].filter((k) => !sections[k]);
  if (missingCore.length > 0) {
    flags.push({
      code: 'MISSING_SECTIONS',
      severity: 'high',
      message: `Could not find a clearly labeled ${missingCore.join(', ')} section. ATS systems often rely on exact section headings to categorize content.`,
    });
  }

  const shortLineRatio =
    lines.filter((l) => l.trim().length > 0 && l.trim().length <= 18).length / Math.max(lines.length, 1);
  if (shortLineRatio > 0.55 && lines.length > 20) {
    flags.push({
      code: 'POSSIBLE_MULTI_COLUMN',
      severity: 'medium',
      message:
        'A large proportion of very short lines was detected, which often happens when a multi-column layout is flattened into plain text out of order. Consider a single-column layout.',
    });
  }

  if (docStructureHints.hasTables) {
    flags.push({
      code: 'TABLES_DETECTED',
      severity: 'medium',
      message: 'Table elements were detected. Many ATS parsers read table cells out of order or skip them entirely.',
    });
  }

  if (text.length > 0 && lines.length > 0 && text.length / lines.length > 400) {
    flags.push({
      code: 'DENSE_TEXT_BLOCKS',
      severity: 'low',
      message: 'Some sections contain very long unbroken paragraphs. Short, bulleted lines parse more reliably.',
    });
  }

  const controlCharRatio = (text.match(/[^\x09\x0A\x0D\x20-\x7E]/g) || []).length / Math.max(text.length, 1);
  if (controlCharRatio > 0.02) {
    flags.push({
      code: 'UNUSUAL_ENCODING',
      severity: 'medium',
      message:
        'Unusual characters were detected in the extracted text, which can indicate embedded graphics, icons, or non-standard fonts that ATS parsers may not read correctly.',
    });
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount > 1200) {
    flags.push({
      code: 'EXCESSIVE_LENGTH',
      severity: 'low',
      message: 'This resume is quite long. Most ATS-friendly resumes fit within one to two pages.',
    });
  }

  return flags;
}

async function extractFromPdf(buffer) {
  const result = await pdfParse(buffer);
  return { text: result.text, hasTables: false, pageCount: result.numpages };
}

async function extractFromDocx(buffer) {
  const [textResult, htmlResult] = await Promise.all([
    mammoth.extractRawText({ buffer }),
    mammoth.convertToHtml({ buffer }),
  ]);
  const hasTables = /<table/i.test(htmlResult.value);
  return { text: textResult.value, hasTables, pageCount: null };
}

export const resumeParserService = {
  /**
   * FR-1.3/1.4/1.5: parses a resume file into raw text, structured sections,
   * and a list of ATS formatting concerns.
   * @param {Buffer} buffer
   * @param {'pdf' | 'docx'} fileType
   */
  async parse(buffer, fileType) {
    let extraction;
    try {
      if (fileType === 'pdf') extraction = await extractFromPdf(buffer);
      else if (fileType === 'docx') extraction = await extractFromDocx(buffer);
      else throw ApiError.badRequest('Unsupported file type for parsing.');
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw ApiError.unprocessable(
        'We could not read this file. It may be corrupted, password-protected, or not a valid ' +
          `${fileType.toUpperCase()} file.`,
        { code: 'PARSE_FAILURE', details: { originalError: err.message } },
      );
    }

    const text = normalizeWhitespace(extraction.text || '');
    if (text.trim().length < 40) {
      throw ApiError.unprocessable(
        'This file did not contain enough readable text to analyze. If it is a scanned image of a resume, text extraction is not yet supported.',
        { code: 'INSUFFICIENT_TEXT' },
      );
    }

    const sections = detectSections(text);
    const formattingFlags = detectFormattingFlags(text, sections, { hasTables: extraction.hasTables });

    return {
      rawText: text,
      sections,
      formattingFlags,
      pageCount: extraction.pageCount,
    };
  },
};

function normalizeWhitespace(text) {
  return text
    .replace(/\u0000/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
