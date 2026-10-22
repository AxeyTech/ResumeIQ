import { query } from '../config/db.js';

export const proofOfWorkRepository = {
  /**
   * Find latest Proof-of-Work verification by resume ID and user ID
   * @param {string} resumeId
   * @param {string} userId
   */
  async findByResumeId(resumeId, userId) {
    const { rows } = await query(
      `SELECT * FROM proof_of_work_verifications
       WHERE resume_id = $1 AND user_id = $2
       ORDER BY verified_at DESC
       LIMIT 1`,
      [resumeId, userId],
    );
    return rows[0] || null;
  },

  /**
   * Public lookup by verification code
   * @param {string} code
   */
  async findByVerificationCode(code) {
    const { rows } = await query(
      `SELECT * FROM proof_of_work_verifications
       WHERE verification_code = $1
       LIMIT 1`,
      [code],
    );
    return rows[0] || null;
  },

  /**
   * Upsert Proof-of-Work record
   */
  async upsert(data) {
    const {
      resumeId,
      userId,
      repoUrl,
      verificationCode,
      overallPowScore,
      verificationLevel,
      verifiedSkills = [],
      architectureSignals = [],
      claimMappings = [],
      embedMarkdown = '',
      embedHtml = '',
    } = data;

    const existing = await this.findByResumeId(resumeId, userId);

    if (existing) {
      const { rows } = await query(
        `UPDATE proof_of_work_verifications
         SET repo_url = $3,
             verification_code = $4,
             overall_pow_score = $5,
             verification_level = $6,
             verified_skills = $7,
             architecture_signals = $8,
             claim_mappings = $9,
             embed_markdown = $10,
             embed_html = $11,
             verified_at = now()
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [
          existing.id,
          userId,
          repoUrl,
          verificationCode,
          overallPowScore,
          verificationLevel,
          JSON.stringify(verifiedSkills),
          JSON.stringify(architectureSignals),
          JSON.stringify(claimMappings),
          embedMarkdown,
          embedHtml,
        ],
      );
      return rows[0];
    }

    const { rows } = await query(
      `INSERT INTO proof_of_work_verifications
         (resume_id, user_id, repo_url, verification_code, overall_pow_score,
          verification_level, verified_skills, architecture_signals, claim_mappings,
          embed_markdown, embed_html, verified_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now())
       RETURNING *`,
      [
        resumeId,
        userId,
        repoUrl,
        verificationCode,
        overallPowScore,
        verificationLevel,
        JSON.stringify(verifiedSkills),
        JSON.stringify(architectureSignals),
        JSON.stringify(claimMappings),
        embedMarkdown,
        embedHtml,
      ],
    );
    return rows[0];
  },
};
