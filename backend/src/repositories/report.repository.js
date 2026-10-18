import { query } from '../config/db.js';

export const reportRepository = {
  async upsertForAnalysis(analysisId, { summary, recommendations, generatedBy }) {
    const { rows } = await query(
      `INSERT INTO reports (analysis_id, summary, recommendations, generated_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (analysis_id)
       DO UPDATE SET summary = $2, recommendations = $3, generated_by = $4, updated_at = now()
       RETURNING *`,
      [analysisId, summary, JSON.stringify(recommendations), generatedBy],
    );
    return rows[0];
  },

  async findByAnalysisId(analysisId) {
    const { rows } = await query('SELECT * FROM reports WHERE analysis_id = $1', [analysisId]);
    return rows[0] || null;
  },
};
