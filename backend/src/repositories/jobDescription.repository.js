import { query } from '../config/db.js';

export const jobDescriptionRepository = {
  /**
   * BR-2: only one active JD per resume version — upsert on the unique
   * resume_id index rather than allowing duplicates to accumulate.
   */
  async upsertForResume(resumeId, { rawText, extractedKeywords, source }) {
    const { rows } = await query(
      `INSERT INTO job_descriptions (resume_id, raw_text, extracted_keywords, source)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (resume_id)
       DO UPDATE SET raw_text = $2, extracted_keywords = $3, source = $4, updated_at = now()
       RETURNING *`,
      [resumeId, rawText, JSON.stringify(extractedKeywords), source],
    );
    return rows[0];
  },

  async findByResumeId(resumeId) {
    const { rows } = await query('SELECT * FROM job_descriptions WHERE resume_id = $1', [resumeId]);
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await query('SELECT * FROM job_descriptions WHERE id = $1', [id]);
    return rows[0] || null;
  },
};
