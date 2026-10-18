import { analysisRepository } from '../repositories/analysis.repository.js';
import { jobDescriptionRepository } from '../repositories/jobDescription.repository.js';
import { reportRepository } from '../repositories/report.repository.js';
import { resumeRepository } from '../repositories/resume.repository.js';
import { keywordMatcherService } from './keywordMatcher.service.js';
import { atsCheckerService } from './atsChecker.service.js';
import { reportGeneratorService } from './reportGenerator.service.js';
import { decryptText } from '../utils/encryption.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../config/logger.js';

/**
 * Facade over the individual scoring services (SDD Section 4.1: Facade
 * Pattern). Controllers call this single entry point rather than knowing
 * about KeywordMatcher / ATSChecker / ReportGenerator individually.
 */
export const analysisOrchestratorService = {
  /**
   * FR-2.3/3.3/4.1: runs keyword matching + ATS compatibility checks for a
   * parsed resume and persists the result.
   * @param {string} resumeId
   * @param {string} userId
   */
  async runAnalysis(resumeId, userId) {
    const resume = await resumeRepository.findByIdForUser(resumeId, userId);
    if (!resume) throw ApiError.notFound('Resume not found.');
    if (resume.status !== 'parsed') {
      throw ApiError.unprocessable(
        `This resume is not ready to analyze yet (status: ${resume.status}). Wait for parsing to finish, or re-upload if it failed.`,
      );
    }

    const jobDescription = await jobDescriptionRepository.findByResumeId(resumeId);
    const analysis = await analysisRepository.create({
      resumeId,
      jobDescriptionId: jobDescription?.id ?? null,
    });

    try {
      const rawText = decryptText(resume.raw_text_encrypted);

      const [keywordResult, atsResult] = await Promise.all([
        keywordMatcherService.match(rawText, jobDescription?.raw_text ?? null),
        Promise.resolve(
          atsCheckerService.evaluate({
            rawText,
            sections: resume.parsed_sections,
            parseFormattingFlags: resume.formatting_flags || [],
          }),
        ),
      ]);

      const completed = await analysisRepository.complete(analysis.id, {
        keywordMatchScore: keywordResult.score,
        atsCompatibilityScore: atsResult.score,
        missingKeywords: keywordResult.missingKeywords,
        matchedKeywords: keywordResult.matchedKeywords,
        issues: atsResult.issues,
      });

      logger.info('Analysis completed', {
        analysisId: analysis.id,
        resumeId,
        keywordScore: keywordResult.score,
        atsScore: atsResult.score,
      });

      return completed;
    } catch (err) {
      await analysisRepository.fail(analysis.id, err.message);
      logger.error('Analysis failed', { analysisId: analysis.id, resumeId, error: err.message });
      throw err instanceof ApiError
        ? err
        : ApiError.internal('Analysis failed unexpectedly. Please try again.');
    }
  },

  /** FR-4.1/4.2/4.3: builds (or returns the cached) improvement report for an analysis. */
  async getOrCreateReport(analysisId, userId) {
    const analysis = await analysisRepository.findByIdForUser(analysisId, userId);
    if (!analysis) throw ApiError.notFound('Analysis not found.');
    if (analysis.status !== 'completed') {
      throw ApiError.unprocessable('This analysis has not completed yet.');
    }

    const existing = await reportRepository.findByAnalysisId(analysisId);
    if (existing) return { analysis, report: existing };

    const generated = await reportGeneratorService.generate({
      keywordMatchScore: Number(analysis.keyword_match_score),
      atsCompatibilityScore: Number(analysis.ats_compatibility_score),
      missingKeywords: analysis.missing_keywords || [],
      issues: analysis.issues || [],
    });

    const report = await reportRepository.upsertForAnalysis(analysisId, {
      summary: generated.summary,
      recommendations: generated.recommendations,
      generatedBy: generated.generatedBy,
    });

    return { analysis, report };
  },

  /** FR-4.4: renders the report (generating it first if necessary) to a PDF buffer. */
  async exportReportPdf(analysisId, userId) {
    const { analysis, report } = await this.getOrCreateReport(analysisId, userId);
    const resume = await resumeRepository.findById(analysis.resume_id);

    const pdfBuffer = await reportGeneratorService.exportPdf({
      resumeName: resume?.display_name || 'Resume',
      keywordMatchScore: Number(analysis.keyword_match_score),
      atsCompatibilityScore: Number(analysis.ats_compatibility_score),
      summary: report.summary,
      recommendations: report.recommendations,
      missingKeywords: analysis.missing_keywords || [],
    });

    return { pdfBuffer, resume };
  },

  /** FR-5.2: compares the latest analysis to the previous one in the same lineage. */
  async compareToPreviousVersion(analysis) {
    const previous = await analysisRepository.findPreviousCompleted(analysis.resume_id, analysis.created_at);
    if (!previous) return null;

    return {
      previousAnalysisId: previous.id,
      keywordMatchDelta: round1(
        Number(analysis.keyword_match_score) - Number(previous.keyword_match_score),
      ),
      atsCompatibilityDelta: round1(
        Number(analysis.ats_compatibility_score) - Number(previous.ats_compatibility_score),
      ),
    };
  },
};

function round1(n) {
  return Math.round(n * 10) / 10;
}
