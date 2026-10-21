import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { resumeRepository } from '../repositories/resume.repository.js';
import { jobDescriptionRepository } from '../repositories/jobDescription.repository.js';
import { resumeParserService } from '../services/resumeParser.service.js';
import { keywordMatcherService } from '../services/keywordMatcher.service.js';
import { cleanResumeExportService } from '../services/cleanResumeExport.service.js';
import { analysisOrchestratorService } from '../services/analysisOrchestrator.service.js';
import { encryptText, decryptText } from '../utils/encryption.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { parseOrThrow, jobDescriptionSchema, renameResumeSchema, builderSaveVersionSchema } from '../utils/validators.js';
import { logger } from '../config/logger.js';

const MAX_VERSIONS = 10; // FR-5.3


function toPublicResume(resume) {
  return {
    id: resume.id,
    parentResumeId: resume.parent_resume_id,
    rootResumeId: resume.root_resume_id,
    versionNumber: resume.version_number,
    displayName: resume.display_name,
    fileName: resume.file_name,
    fileType: resume.file_type,
    fileSizeBytes: resume.file_size_bytes,
    status: resume.status,
    parseError: resume.parse_error,
    sections: resume.parsed_sections,
    formattingFlags: resume.formatting_flags,
    createdAt: resume.created_at,
    updatedAt: resume.updated_at,
  };
}

export const resumesController = {
  /**
   * POST /api/v1/resumes
   * FR-1.1-1.6: upload, validate, and parse a resume. If `parentResumeId`
   * is supplied (multipart field), this becomes the next version in that
   * lineage (SF-5) instead of a new one.
   */
  upload: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { buffer, fileType, filename, originalname, size } = req.file;
    const parentResumeId = req.body.parentResumeId || null;

    let rootResumeId = null;
    let versionNumber = 1;

    if (parentResumeId) {
      const parent = await resumeRepository.findByIdForUser(parentResumeId, userId);
      if (!parent) {
        await safeUnlink(req.file.path);
        throw ApiError.notFound('The resume you are revising could not be found.');
      }
      rootResumeId = parent.root_resume_id || parent.id;
      versionNumber = (await resumeRepository.countVersions(rootResumeId, userId)) + 1;
    }

    const resume = await resumeRepository.create({
      userId,
      parentResumeId,
      rootResumeId, // null for a brand-new lineage; fixed up below
      versionNumber,
      displayName: req.body.displayName || originalname,
      fileName: originalname,
      fileType,
      fileSizeBytes: size,
      storagePath: filename,
    });

    if (!rootResumeId) {
      await resumeRepository.setRootResumeId(resume.id, resume.id);
      resume.root_resume_id = resume.id;
    }

    // FR-5.3: enforce the 10-version cap for this lineage.
    if (versionNumber > MAX_VERSIONS && rootResumeId) {
      const stale = await resumeRepository.findVersionsBeyondLimit(rootResumeId, userId, MAX_VERSIONS);
      if (stale.length > 0) {
        await resumeRepository.deleteByIds(stale.map((r) => r.id));
      }
    }

    // Parse synchronously — SRS targets <=15s for resumes up to 5 pages, well
    // within a single request/response cycle.
    try {
      const parsed = await resumeParserService.parse(buffer, fileType);
      const updated = await resumeRepository.updateParsedContent(resume.id, {
        rawTextEncrypted: encryptText(parsed.rawText),
        parsedSections: parsed.sections,
        formattingFlags: parsed.formattingFlags,
        status: 'parsed',
      });
      logger.info('Resume uploaded and parsed', { resumeId: resume.id, userId });
      res.status(201).json({ resume: toPublicResume({ ...updated, root_resume_id: resume.root_resume_id }) });
    } catch (err) {
      // NFR-S2: preserve the original upload for retry; never silently discard it.
      await resumeRepository.markFailed(resume.id, err.message);
      logger.warn('Resume parsing failed', { resumeId: resume.id, error: err.message });
      throw err;
    }
  }),

  /** GET /api/v1/resumes — FR-6.2 */
  list: asyncHandler(async (req, res) => {
    const resumes = await resumeRepository.listForUser(req.user.id);
    res.status(200).json({ resumes: resumes.map(toPublicResume) });
  }),

  /** GET /api/v1/resumes/:id */
  getOne: asyncHandler(async (req, res) => {
    const resume = await resumeRepository.findByIdForUser(req.params.id, req.user.id);
    if (!resume) throw ApiError.notFound('Resume not found.');
    res.status(200).json({ resume: toPublicResume(resume) });
  }),

  /** PATCH /api/v1/resumes/:id — FR-6.2 rename */
  rename: asyncHandler(async (req, res) => {
    const { displayName } = parseOrThrow(renameResumeSchema, req.body);
    const updated = await resumeRepository.rename(req.params.id, req.user.id, displayName);
    if (!updated) throw ApiError.notFound('Resume not found.');
    res.status(200).json({ resume: toPublicResume(updated) });
  }),

  /** DELETE /api/v1/resumes/:id — FR-6.2 */
  remove: asyncHandler(async (req, res) => {
    const resume = await resumeRepository.findByIdForUser(req.params.id, req.user.id);
    if (!resume) throw ApiError.notFound('Resume not found.');

    await resumeRepository.deleteByIdForUser(req.params.id, req.user.id);
    await safeUnlink(resumeStoragePathFor(resume.storage_path));
    res.status(204).send();
  }),

  /**
   * GET /api/v1/resumes/:id/versions — FR-5.2/5.3
   * Returns up to the 10 most recent versions in this resume's lineage.
   */
  versions: asyncHandler(async (req, res) => {
    const resume = await resumeRepository.findByIdForUser(req.params.id, req.user.id);
    if (!resume) throw ApiError.notFound('Resume not found.');

    const rootId = resume.root_resume_id || resume.id;
    const versions = await resumeRepository.listVersions(rootId, req.user.id, MAX_VERSIONS);
    res.status(200).json({ versions: versions.map(toPublicResume) });
  }),

  /**
   * GET /api/v1/resumes/:id/xray
   * ATS X-Ray Robot Parser Simulator: Returns decrypted raw extracted text,
   * detected entities (candidate name, email, phone, links), parsed section boundaries,
   * structural health diagnostics, and an overall ATS parsability index.
   */
  getXRay: asyncHandler(async (req, res) => {
    const resume = await resumeRepository.findByIdForUser(req.params.id, req.user.id);
    if (!resume) throw ApiError.notFound('Resume not found.');

    let rawText = '';
    if (resume.raw_text_encrypted) {
      try {
        rawText = decryptText(resume.raw_text_encrypted) || '';
      } catch (err) {
        logger.warn('Failed to decrypt resume text for X-Ray', { error: err.message, resumeId: resume.id });
      }
    }

    // Entity extraction (Regex-based, safe and fast)
    const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const linkedinMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
    const githubMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);

    // Extract probable candidate name from top lines (skipping URLs, emails, phone numbers)
    let candidateName = null;
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines.slice(0, 5)) {
      if (
        !line.includes('@') &&
        !line.toLowerCase().includes('http') &&
        !line.toLowerCase().includes('linkedin') &&
        !line.toLowerCase().includes('github') &&
        !/\d{5,}/.test(line) &&
        line.length >= 3 &&
        line.length <= 40
      ) {
        candidateName = line;
        break;
      }
    }

    // Section presence breakdown
    const parsedSections = resume.parsed_sections || {};
    const standardSections = [
      { key: 'contact', title: 'Contact Information', description: 'Name, email, phone, location' },
      { key: 'summary', title: 'Professional Summary', description: 'Executive brief or career objective' },
      { key: 'experience', title: 'Work Experience', description: 'Roles, companies, dates, STAR bullet points' },
      { key: 'skills', title: 'Technical Skills', description: 'Languages, frameworks, tools, competencies' },
      { key: 'education', title: 'Education', description: 'Degree, university, graduation year' },
      { key: 'projects', title: 'Projects', description: 'Technical projects, portfolio highlights' },
      { key: 'certifications', title: 'Certifications', description: 'Licenses, credentials, courses' },
    ];

    const sectionBreakdown = standardSections.map((sec) => {
      const content = parsedSections[sec.key] || '';
      return {
        key: sec.key,
        title: sec.title,
        description: sec.description,
        detected: Boolean(content && content.trim().length > 0),
        charCount: content.length,
        preview: content ? content.trim().slice(0, 160) + (content.length > 160 ? '...' : '') : null,
      };
    });

    // Formatting Flags & Risk Diagnostics
    const formattingFlags = Array.isArray(resume.formatting_flags) ? resume.formatting_flags : [];

    // Compute ATS Parsability Index (0-100)
    let parsabilityScore = 100;
    if (!emailMatch) parsabilityScore -= 20;
    if (!phoneMatch) parsabilityScore -= 10;
    if (!parsedSections.experience) parsabilityScore -= 25;
    if (!parsedSections.skills) parsabilityScore -= 15;
    if (!parsedSections.education) parsabilityScore -= 10;
    if (formattingFlags.some((f) => f.code === 'SHORT_LINES_LAYOUT')) parsabilityScore -= 15;
    if (formattingFlags.some((f) => f.code === 'UNUSUAL_ENCODING')) parsabilityScore -= 10;
    parsabilityScore = Math.max(20, Math.min(100, parsabilityScore));

    const wordCount = rawText.split(/\s+/).filter(Boolean).length;
    const lineCount = lines.length;

    res.status(200).json({
      resumeId: resume.id,
      fileName: resume.file_name,
      displayName: resume.display_name,
      fileType: resume.file_type,
      fileSizeBytes: resume.file_size_bytes,
      status: resume.status,
      parsabilityScore,
      stats: {
        wordCount,
        lineCount,
        charCount: rawText.length,
        detectedSectionsCount: sectionBreakdown.filter((s) => s.detected).length,
        totalSectionsCount: sectionBreakdown.length,
      },
      extractedEntities: {
        name: candidateName,
        email: emailMatch ? emailMatch[0] : null,
        phone: phoneMatch ? phoneMatch[0] : null,
        linkedin: linkedinMatch ? linkedinMatch[0] : null,
        github: githubMatch ? githubMatch[0] : null,
      },
      sectionBreakdown,
      formattingFlags,
      rawText,
    });
  }),

  /**
   * POST /api/v1/resumes/:id/job-description
   * FR-2.1: attach/replace the target job description for a resume version.
   * BR-2: enforced at the DB layer via a unique index + upsert.
   */
  attachJobDescription: asyncHandler(async (req, res) => {
    const resume = await resumeRepository.findByIdForUser(req.params.id, req.user.id);
    if (!resume) throw ApiError.notFound('Resume not found.');

    const { text } = parseOrThrow(jobDescriptionSchema, req.body);
    const keywords = await keywordMatcherService.extractKeywords(text);

    const jd = await jobDescriptionRepository.upsertForResume(resume.id, {
      rawText: text,
      extractedKeywords: keywords,
      source: 'user_provided',
    });

    res.status(200).json({
      jobDescription: {
        id: jd.id,
        resumeId: jd.resume_id,
        extractedKeywords: jd.extracted_keywords,
        source: jd.source,
        createdAt: jd.created_at,
      },
    });
  }),

  /** GET /api/v1/resumes/:id/job-description */
  getJobDescription: asyncHandler(async (req, res) => {
    const resume = await resumeRepository.findByIdForUser(req.params.id, req.user.id);
    if (!resume) throw ApiError.notFound('Resume not found.');

    const jd = await jobDescriptionRepository.findByResumeId(resume.id);
    if (!jd) return res.status(200).json({ jobDescription: null });

    res.status(200).json({
      jobDescription: {
        id: jd.id,
        resumeId: jd.resume_id,
        rawText: jd.raw_text,
        extractedKeywords: jd.extracted_keywords,
        source: jd.source,
        createdAt: jd.created_at,
      },
    });
  }),

  /**
   * POST /api/v1/resumes/:id/export-clean-pdf
   * Generates and streams a pristine ATS PDF from either supplied builder JSON
   * or parsed resume sections.
   */
  exportCleanPdf: asyncHandler(async (req, res) => {
    const resume = await resumeRepository.findByIdForUser(req.params.id, req.user.id);
    if (!resume) throw ApiError.notFound('Resume not found.');

    let builderData = req.body?.resumeData;
    if (!builderData || !builderData.personalInfo) {
      const sections = resume.parsed_sections || {};
      builderData = {
        personalInfo: {
          fullName: resume.display_name?.replace(/\.[^/.]+$/, '') || 'Candidate',
          title: '',
          email: '',
          phone: '',
          location: '',
        },
        summary: sections.summary || '',
        skills: sections.skills ? sections.skills.split('\n').filter(Boolean) : [],
        experience: sections.experience ? [{ role: 'Experience', company: '', bullets: [sections.experience] }] : [],
        projects: sections.projects ? [{ title: 'Projects', bullets: [sections.projects] }] : [],
        education: sections.education ? [{ school: sections.education, degree: '', field: '' }] : [],
      };
    }

    const pdfBuffer = await cleanResumeExportService.exportPdf(builderData);
    const safeName = (builderData.personalInfo?.fullName || 'ATS_Resume').replace(/[^a-zA-Z0-9_-]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}_ATS_Resume.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  }),

  /**
   * POST /api/v1/resumes/:id/builder-save-version
   * Creates a new version (v+1) from builder edits, saves generated clean ATS PDF,
   * updates parsed sections, and optionally runs instant re-analysis.
   */
  saveBuilderVersion: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const parentResumeId = req.params.id;
    const { displayName, resumeData, reAnalyze } = parseOrThrow(builderSaveVersionSchema, req.body);

    const parent = await resumeRepository.findByIdForUser(parentResumeId, userId);
    if (!parent) throw ApiError.notFound('Parent resume not found.');

    const rootResumeId = parent.root_resume_id || parent.id;
    const versionNumber = (await resumeRepository.countVersions(rootResumeId, userId)) + 1;

    // 1. Generate clean vector ATS PDF buffer
    const pdfBuffer = await cleanResumeExportService.exportPdf(resumeData);

    // 2. Persist PDF to storage directory
    const fileName = `${(resumeData.personalInfo?.fullName || 'Resume').replace(/[^a-zA-Z0-9_-]/g, '_')}_v${versionNumber}.pdf`;
    const storageFileName = `${Date.now()}-${crypto.randomUUID()}.pdf`;
    const fullStoragePath = resumeStoragePathFor(storageFileName);
    await fs.writeFile(fullStoragePath, pdfBuffer);

    // 3. Create resume record in database
    const newResume = await resumeRepository.create({
      userId,
      parentResumeId,
      rootResumeId,
      versionNumber,
      displayName: displayName || `${parent.display_name.replace(/\.[^/.]+$/, '')} (v${versionNumber})`,
      fileName,
      fileType: 'pdf',
      fileSizeBytes: pdfBuffer.length,
      storagePath: storageFileName,
    });

    // 4. Clean plain text & parsed sections
    const rawText = cleanResumeExportService.serializeToCleanPlainText(resumeData);
    const parsedSections = cleanResumeExportService.toParsedSections(resumeData);

    const updated = await resumeRepository.updateParsedContent(newResume.id, {
      rawTextEncrypted: encryptText(rawText),
      parsedSections,
      formattingFlags: [], // 0 ATS formatting errors guaranteed!
      status: 'parsed',
    });

    // 5. Enforce 10-version cap
    if (versionNumber > MAX_VERSIONS && rootResumeId) {
      const stale = await resumeRepository.findVersionsBeyondLimit(rootResumeId, userId, MAX_VERSIONS);
      if (stale.length > 0) {
        await resumeRepository.deleteByIds(stale.map((r) => r.id));
      }
    }

    // 6. Copy target JD from parent if it exists
    const parentJd = await jobDescriptionRepository.findByResumeId(parent.id);
    if (parentJd) {
      await jobDescriptionRepository.upsertForResume(newResume.id, {
        rawText: parentJd.raw_text,
        extractedKeywords: parentJd.extracted_keywords,
        source: parentJd.source,
      });
    }

    // 7. Optional instant re-analysis
    let publicAnalysis = null;
    if (reAnalyze) {
      try {
        const analysis = await analysisOrchestratorService.runAnalysis(newResume.id, userId);
        publicAnalysis = {
          id: analysis.id,
          resumeId: analysis.resume_id,
          jobDescriptionId: analysis.job_description_id,
          keywordMatchScore: Number(analysis.keyword_match_score),
          atsCompatibilityScore: Number(analysis.ats_compatibility_score),
          missingKeywords: analysis.missing_keywords || [],
          matchedKeywords: analysis.matched_keywords || [],
          issues: analysis.issues || [],
          status: analysis.status,
          analyzedAt: analysis.analyzed_at,
          createdAt: analysis.created_at,
        };
      } catch (err) {
        logger.warn('Auto re-analysis after builder save failed', { error: err.message });
      }
    }

    res.status(201).json({
      resume: toPublicResume({ ...updated, root_resume_id: rootResumeId }),
      analysis: publicAnalysis,
      message: `Version ${versionNumber} created and optimized successfully!`,
    });
  }),
};

function resumeStoragePathFor(storedFileName) {
  return `${process.env.UPLOAD_DIR || 'uploads'}/${storedFileName}`;
}

async function safeUnlink(filePath) {
  try {
    await fs.unlink(filePath);
  } catch {
    // File may already be gone — not a failure condition worth surfacing.
  }
}

// Exposed for tests / potential reuse (e.g. an admin "view decrypted text" tool).
export function decryptResumeText(resume) {
  return decryptText(resume.raw_text_encrypted);
}
