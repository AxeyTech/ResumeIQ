import { analysisOrchestratorService } from '../services/analysisOrchestrator.service.js';
import { personaSimulatorService } from '../services/personaSimulator.service.js';
import { knockoutRadarService } from '../services/knockoutRadar.service.js';
import { analysisRepository } from '../repositories/analysis.repository.js';
import { reportRepository } from '../repositories/report.repository.js';
import { resumeRepository } from '../repositories/resume.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

const FREE_TIER_MONTHLY_LIMIT = 5; // BR-1

function toPublicAnalysis(analysis) {
  return {
    id: analysis.id,
    resumeId: analysis.resume_id,
    jobDescriptionId: analysis.job_description_id,
    keywordMatchScore: numOrNull(analysis.keyword_match_score),
    atsCompatibilityScore: numOrNull(analysis.ats_compatibility_score),
    missingKeywords: analysis.missing_keywords,
    matchedKeywords: analysis.matched_keywords,
    issues: analysis.issues,
    status: analysis.status,
    errorMessage: analysis.error_message,
    analyzedAt: analysis.analyzed_at,
    createdAt: analysis.created_at,
  };
}

function numOrNull(v) {
  return v === null || v === undefined ? null : Number(v);
}

export const analysesController = {
  /**
   * POST /api/v1/resumes/:id/analyze
   * SF-2 + SF-3: runs keyword matching and ATS compatibility checks.
   * BR-1: enforces the free-tier monthly analysis limit.
   */
  analyze: asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const count = await userRepository.getAndResetMonthlyCount(userId);
    if (req.user.role !== 'admin' && count >= FREE_TIER_MONTHLY_LIMIT) {
      throw ApiError.forbidden(
        `You've used all ${FREE_TIER_MONTHLY_LIMIT} free analyses this month. It resets at the start of next month.`,
        { code: 'MONTHLY_LIMIT_REACHED' },
      );
    }

    const analysis = await analysisOrchestratorService.runAnalysis(req.params.id, userId);
    await userRepository.incrementMonthlyCount(userId);

    res.status(201).json({ analysis: toPublicAnalysis(analysis) });
  }),

  /** GET /api/v1/analyses/:id */
  getOne: asyncHandler(async (req, res) => {
    const analysis = await analysisRepository.findByIdForUser(req.params.id, req.user.id);
    if (!analysis) throw ApiError.notFound('Analysis not found.');

    const comparison = await analysisOrchestratorService.compareToPreviousVersion(analysis);
    res.status(200).json({ analysis: toPublicAnalysis(analysis), comparisonToPreviousVersion: comparison });
  }),

  /** GET /api/v1/analyses/:id/report — FR-4.1 */
  getReport: asyncHandler(async (req, res) => {
    const { analysis, report } = await analysisOrchestratorService.getOrCreateReport(
      req.params.id,
      req.user.id,
    );
    res.status(200).json({
      analysis: toPublicAnalysis(analysis),
      report: {
        id: report.id,
        summary: report.summary,
        recommendations: report.recommendations,
        generatedBy: report.generated_by,
        createdAt: report.created_at,
      },
    });
  }),

  /** GET /api/v1/analyses/:id/report.pdf — FR-4.4 */
  downloadReportPdf: asyncHandler(async (req, res) => {
    const { pdfBuffer, resume } = await analysisOrchestratorService.exportReportPdf(
      req.params.id,
      req.user.id,
    );

    const safeName = (resume?.display_name || 'resume').replace(/[^a-z0-9-_]+/gi, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ResumeIQ-Report-${safeName}.pdf"`);
    res.status(200).send(pdfBuffer);
  }),

  /**
   * GET /api/v1/resumes/:id/versions/compare
   * FR-5.2: score progression across every completed analysis in this
   * resume's lineage, most recent first.
   */
  compareVersions: asyncHandler(async (req, res) => {
    const resume = await resumeRepository.findByIdForUser(req.params.id, req.user.id);
    if (!resume) throw ApiError.notFound('Resume not found.');

    const rootId = resume.root_resume_id || resume.id;
    const versions = await resumeRepository.listVersions(rootId, req.user.id, 10);

    const analyses = await analysisRepository.findLatestCompletedForResumeIds(versions.map((v) => v.id));
    const byResumeId = new Map(analyses.map((a) => [a.resume_id, a]));

    const timeline = versions
      .map((v) => {
        const a = byResumeId.get(v.id);
        return a
          ? {
              resumeId: v.id,
              versionNumber: v.version_number,
              displayName: v.display_name,
              keywordMatchScore: numOrNull(a.keyword_match_score),
              atsCompatibilityScore: numOrNull(a.ats_compatibility_score),
              missingKeywords: a.missing_keywords || [],
              matchedKeywords: a.matched_keywords || [],
              issues: a.issues || [],
              analyzedAt: a.analyzed_at,
            }
          : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.versionNumber - b.versionNumber);

    // Calculate deltas between consecutive versions
    const deltas = [];
    for (let i = 1; i < timeline.length; i++) {
      const prev = timeline[i - 1];
      const curr = timeline[i];
      deltas.push({
        fromVersion: prev.versionNumber,
        toVersion: curr.versionNumber,
        keywordMatchDelta: (curr.keywordMatchScore ?? 0) - (prev.keywordMatchScore ?? 0),
        atsCompatibilityDelta: (curr.atsCompatibilityScore ?? 0) - (prev.atsCompatibilityScore ?? 0),
        newlyMatchedKeywords: (curr.matchedKeywords || []).filter(k => !(prev.matchedKeywords || []).includes(k)),
        resolvedKeywords: (prev.missingKeywords || []).filter(k => (curr.matchedKeywords || []).includes(k)),
        newMissingKeywords: (curr.missingKeywords || []).filter(k => !(prev.missingKeywords || []).includes(k)),
        issueCountDelta: (curr.issues?.length || 0) - (prev.issues?.length || 0),
      });
    }

    res.status(200).json({ timeline, deltas });
  }),

  /** GET /api/v1/analyses/:id/persona-simulations */
  getPersonaSimulations: asyncHandler(async (req, res) => {
    const data = await personaSimulatorService.simulatePersonas(req.params.id, req.user.id);
    res.status(200).json(data);
  }),

  /** GET /api/v1/analyses/:id/knockout-radar */
  getKnockoutRadar: asyncHandler(async (req, res) => {
    const data = await knockoutRadarService.scanKnockoutRadar(req.params.id, req.user.id);
    res.status(200).json(data);
  }),

  /** GET /api/v1/resumes/:id/latest-analysis */
  getLatestForResume: asyncHandler(async (req, res) => {
    const analysis = await analysisRepository.findLatestCompleted(req.params.id);
    if (!analysis) return res.status(200).json({ analysis: null, report: null });
    const report = await reportRepository.findByAnalysisId(analysis.id);
    res.status(200).json({
      analysis: toPublicAnalysis(analysis),
      report: report
        ? {
            id: report.id,
            summary: report.summary,
            recommendations: report.recommendations,
            generatedBy: report.generated_by,
            createdAt: report.created_at,
          }
        : null,
    });
  }),
};
