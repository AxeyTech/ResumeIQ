import { query } from '../config/db.js';

export const analysisRepository = {
  async create({ resumeId, jobDescriptionId }) {
    const { rows } = await query(
      `INSERT INTO analyses (resume_id, job_description_id, status)
       VALUES ($1, $2, 'running')
       RETURNING *`,
      [resumeId, jobDescriptionId],
    );
    return rows[0];
  },

  async complete(
    id,
    { keywordMatchScore, atsCompatibilityScore, missingKeywords, matchedKeywords, issues },
  ) {
    const { rows } = await query(
      `UPDATE analyses
       SET status = 'completed',
           keyword_match_score = $2,
           ats_compatibility_score = $3,
           missing_keywords = $4,
           matched_keywords = $5,
           issues = $6,
           analyzed_at = now()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        keywordMatchScore,
        atsCompatibilityScore,
        JSON.stringify(missingKeywords),
        JSON.stringify(matchedKeywords),
        JSON.stringify(issues),
      ],
    );
    return rows[0];
  },

  async fail(id, errorMessage) {
    const { rows } = await query(
      `UPDATE analyses SET status = 'failed', error_message = $2 WHERE id = $1 RETURNING *`,
      [id, errorMessage],
    );
    return rows[0];
  },

  async findById(id) {
    const { rows } = await query('SELECT * FROM analyses WHERE id = $1', [id]);
    return rows[0] || null;
  },

  /** Ownership-scoped lookup via a join back to resumes. */
  async findByIdForUser(id, userId) {
    const { rows } = await query(
      `SELECT a.* FROM analyses a
       JOIN resumes r ON r.id = a.resume_id
       WHERE a.id = $1 AND r.user_id = $2`,
      [id, userId],
    );
    return rows[0] || null;
  },

  async listForResume(resumeId, limit = 20) {
    const { rows } = await query(
      `SELECT * FROM analyses WHERE resume_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [resumeId, limit],
    );
    return rows;
  },

  /** Finds the most recent completed analysis for a resume. */
  async findLatestCompleted(resumeId) {
    const { rows } = await query(
      `SELECT * FROM analyses
       WHERE resume_id = $1 AND status = 'completed'
       ORDER BY created_at DESC
       LIMIT 1`,
      [resumeId],
    );
    return rows[0] || null;
  },

  /** FR-5.2: most recent completed analysis before `beforeCreatedAt`, for score comparison. */
  async findPreviousCompleted(resumeId, beforeCreatedAt) {
    const { rows } = await query(
      `SELECT * FROM analyses
       WHERE resume_id = $1 AND status = 'completed' AND created_at < $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [resumeId, beforeCreatedAt],
    );
    return rows[0] || null;
  },

  /** Latest completed analysis per resume id, for the version-comparison endpoint. */
  async findLatestCompletedForResumeIds(resumeIds) {
    if (resumeIds.length === 0) return [];
    const { rows } = await query(
      `SELECT DISTINCT ON (resume_id) *
       FROM analyses
       WHERE resume_id = ANY($1::uuid[]) AND status = 'completed'
       ORDER BY resume_id, created_at DESC`,
      [resumeIds],
    );
    return rows;
  },
};
