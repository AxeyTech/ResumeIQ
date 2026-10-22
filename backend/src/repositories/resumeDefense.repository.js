import { query } from '../config/db.js';

export const resumeDefenseRepository = {
  /**
   * Find defense analysis by resume ID and user ID
   * @param {string} resumeId
   * @param {string} userId
   */
  async findByResumeId(resumeId, userId) {
    const { rows } = await query(
      `SELECT * FROM resume_defenses
       WHERE resume_id = $1 AND user_id = $2
       ORDER BY analyzed_at DESC
       LIMIT 1`,
      [resumeId, userId],
    );
    return rows[0] || null;
  },

  /**
   * Upsert defense analysis for a given resume
   * @param {{
   *   resumeId: string,
   *   userId: string,
   *   overallDefensibilityScore: number,
   *   xyzComplianceRate: number,
   *   riskDistribution: object,
   *   keyStrengths: string[],
   *   topVulnerabilities: string[],
   *   bullets: object[]
   * }} data
   */
  async upsert(data) {
    const {
      resumeId,
      userId,
      overallDefensibilityScore,
      xyzComplianceRate,
      riskDistribution,
      keyStrengths = [],
      topVulnerabilities = [],
      bullets = [],
    } = data;

    // Check if an existing row exists for this resume and user
    const existing = await this.findByResumeId(resumeId, userId);

    if (existing) {
      const { rows } = await query(
        `UPDATE resume_defenses
         SET overall_defensibility_score = $3,
             xyz_compliance_rate = $4,
             risk_distribution = $5,
             key_strengths = $6,
             top_vulnerabilities = $7,
             bullets = $8,
             analyzed_at = now()
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [
          existing.id,
          userId,
          overallDefensibilityScore,
          xyzComplianceRate,
          JSON.stringify(riskDistribution),
          JSON.stringify(keyStrengths),
          JSON.stringify(topVulnerabilities),
          JSON.stringify(bullets),
        ],
      );
      return rows[0];
    }

    const { rows } = await query(
      `INSERT INTO resume_defenses
         (resume_id, user_id, overall_defensibility_score, xyz_compliance_rate,
          risk_distribution, key_strengths, top_vulnerabilities, bullets, analyzed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
       RETURNING *`,
      [
        resumeId,
        userId,
        overallDefensibilityScore,
        xyzComplianceRate,
        JSON.stringify(riskDistribution),
        JSON.stringify(keyStrengths),
        JSON.stringify(topVulnerabilities),
        JSON.stringify(bullets),
      ],
    );
    return rows[0];
  },

  /**
   * Delete defense records for a resume
   * @param {string} resumeId
   */
  async deleteByResumeId(resumeId) {
    await query('DELETE FROM resume_defenses WHERE resume_id = $1', [resumeId]);
  },
};
