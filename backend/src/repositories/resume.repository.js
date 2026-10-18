import { query } from '../config/db.js';

export const resumeRepository = {
  /**
   * @param {object} data
   */
  async create(data) {
    const {
      userId,
      parentResumeId = null,
      rootResumeId = null,
      versionNumber = 1,
      displayName,
      fileName,
      fileType,
      fileSizeBytes,
      storagePath,
    } = data;

    const { rows } = await query(
      `INSERT INTO resumes
         (user_id, parent_resume_id, root_resume_id, version_number,
          display_name, file_name, file_type, file_size_bytes, storage_path, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'uploaded')
       RETURNING *`,
      [
        userId,
        parentResumeId,
        rootResumeId,
        versionNumber,
        displayName,
        fileName,
        fileType,
        fileSizeBytes,
        storagePath,
      ],
    );
    return rows[0];
  },

  async findById(id) {
    const { rows } = await query('SELECT * FROM resumes WHERE id = $1', [id]);
    return rows[0] || null;
  },

  /** Sets root_resume_id to the resume's own id, establishing it as version 1 of a new lineage. */
  async setRootResumeId(id, rootResumeId) {
    const { rows } = await query(
      'UPDATE resumes SET root_resume_id = $2 WHERE id = $1 RETURNING *',
      [id, rootResumeId],
    );
    return rows[0];
  },

  async markParsing(id) {
    await query("UPDATE resumes SET status = 'parsing', parse_error = NULL WHERE id = $1", [id]);
  },

  /** Ownership-scoped lookup — always use this in request handlers. */
  async findByIdForUser(id, userId) {
    const { rows } = await query('SELECT * FROM resumes WHERE id = $1 AND user_id = $2', [id, userId]);
    return rows[0] || null;
  },

  async listForUser(userId, { limit = 50, offset = 0 } = {}) {
    const { rows } = await query(
      `SELECT * FROM resumes
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );
    return rows;
  },

  /** FR-5.3: version history, most recent first, capped by the caller (10). */
  async listVersions(rootResumeId, userId, limit = 10) {
    const { rows } = await query(
      `SELECT * FROM resumes
       WHERE root_resume_id = $1 AND user_id = $2
       ORDER BY version_number DESC
       LIMIT $3`,
      [rootResumeId, userId, limit],
    );
    return rows;
  },

  async countVersions(rootResumeId, userId) {
    const { rows } = await query(
      'SELECT COUNT(*)::int AS count FROM resumes WHERE root_resume_id = $1 AND user_id = $2',
      [rootResumeId, userId],
    );
    return rows[0]?.count ?? 0;
  },

  async updateParsedContent(id, { rawTextEncrypted, parsedSections, formattingFlags, status }) {
    const { rows } = await query(
      `UPDATE resumes
       SET raw_text_encrypted = $2,
           parsed_sections = $3,
           formatting_flags = $4,
           status = $5,
           parse_error = NULL
       WHERE id = $1
       RETURNING *`,
      [id, rawTextEncrypted, JSON.stringify(parsedSections), JSON.stringify(formattingFlags), status],
    );
    return rows[0];
  },

  async markFailed(id, errorMessage) {
    const { rows } = await query(
      `UPDATE resumes SET status = 'failed', parse_error = $2 WHERE id = $1 RETURNING *`,
      [id, errorMessage],
    );
    return rows[0];
  },

  async rename(id, userId, displayName) {
    const { rows } = await query(
      `UPDATE resumes SET display_name = $3 WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId, displayName],
    );
    return rows[0] || null;
  },

  /** FR-6.2: delete a specific resume (and its analyses/reports via FK cascade). */
  async deleteByIdForUser(id, userId) {
    const { rowCount } = await query('DELETE FROM resumes WHERE id = $1 AND user_id = $2', [id, userId]);
    return rowCount > 0;
  },

  /** Oldest versions beyond the retention cap (FR-5.3: keep at most 10). */
  async findVersionsBeyondLimit(rootResumeId, userId, limit = 10) {
    const { rows } = await query(
      `SELECT id FROM resumes
       WHERE root_resume_id = $1 AND user_id = $2
       ORDER BY version_number DESC
       OFFSET $3`,
      [rootResumeId, userId, limit],
    );
    return rows;
  },

  async deleteByIds(ids) {
    if (ids.length === 0) return;
    await query('DELETE FROM resumes WHERE id = ANY($1::uuid[])', [ids]);
  },
};
