import { query } from '../config/db.js';

const PUBLIC_COLUMNS = 'id, email, name, username, avatar_url, role, google_id IS NOT NULL AS has_google, created_at';

async function generateUniqueUsername(base) {
  let cleaned = (base || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .slice(0, 20);
  if (cleaned.length < 3) cleaned = cleaned + '_iq';

  let candidate = cleaned;
  let counter = 1;
  while (true) {
    const { rows } = await query('SELECT 1 FROM users WHERE username = $1', [candidate]);
    if (rows.length === 0) return candidate;
    candidate = `${cleaned}_${counter++}`.slice(0, 30);
  }
}

export const userRepository = {
  /** @param {{ email: string, name: string, passwordHash: string, username?: string }} data */
  async createWithPassword({ email, name, passwordHash, username }) {
    const resolvedUsername = username || (await generateUniqueUsername(email.split('@')[0]));
    const { rows } = await query(
      `INSERT INTO users (email, name, password_hash, username)
       VALUES ($1, $2, $3, $4)
       RETURNING ${PUBLIC_COLUMNS}`,
      [email, name, passwordHash, resolvedUsername],
    );
    return rows[0];
  },

  /** @param {{ email: string, name: string, googleId: string }} data */
  async createWithGoogle({ email, name, googleId }) {
    const resolvedUsername = await generateUniqueUsername(name || email.split('@')[0]);
    const { rows } = await query(
      `INSERT INTO users (email, name, google_id, username)
       VALUES ($1, $2, $3, $4)
       RETURNING ${PUBLIC_COLUMNS}`,
      [email, name, googleId, resolvedUsername],
    );
    return rows[0];
  },

  /** @param {string} email */
  async findByEmail(email) {
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] || null;
  },

  /** @param {string} username */
  async findByUsername(username) {
    const { rows } = await query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE username = $1`, [username]);
    return rows[0] || null;
  },

  /** Checks if a username is already taken by another account */
  async isUsernameTaken(username, excludeUserId = null) {
    let sql = 'SELECT 1 FROM users WHERE username = $1';
    const params = [username];
    if (excludeUserId) {
      sql += ' AND id != $2';
      params.push(excludeUserId);
    }
    const { rows } = await query(sql, params);
    return rows.length > 0;
  },

  /** @param {string} googleId */
  async findByGoogleId(googleId) {
    const { rows } = await query('SELECT * FROM users WHERE google_id = $1', [googleId]);
    return rows[0] || null;
  },

  /** @param {string} id */
  async findById(id) {
    const { rows } = await query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`, [id]);
    return rows[0] || null;
  },

  /** Updates user profile fields (name, username, avatarUrl) */
  async updateProfile(userId, { name, username, avatarUrl }) {
    const updates = [];
    const params = [userId];

    if (name !== undefined) {
      params.push(name.trim());
      updates.push(`name = $${params.length}`);
    }
    if (username !== undefined) {
      params.push(username.trim().toLowerCase());
      updates.push(`username = $${params.length}`);
    }
    if (avatarUrl !== undefined) {
      params.push(avatarUrl ? avatarUrl.trim() : null);
      updates.push(`avatar_url = $${params.length}`);
    }

    if (updates.length === 0) {
      return this.findById(userId);
    }

    const { rows } = await query(
      `UPDATE users
       SET ${updates.join(', ')}
       WHERE id = $1
       RETURNING ${PUBLIC_COLUMNS}`,
      params,
    );
    return rows[0] || null;
  },

  /** Links a Google identity to an existing password-based account. */
  async linkGoogleId(userId, googleId) {
    const { rows } = await query(
      `UPDATE users SET google_id = $2 WHERE id = $1 RETURNING ${PUBLIC_COLUMNS}`,
      [userId, googleId],
    );
    return rows[0];
  },

  /** FR-6.3: permanent account deletion. Cascades to resumes/analyses/reports via FK. */
  async deleteById(id) {
    await query('DELETE FROM users WHERE id = $1', [id]);
  },

  /**
   * BR-1: free-tier usage tracking. Resets the counter if we've rolled into
   * a new calendar month, then returns the count *before* incrementing so
   * callers can check the limit first.
   */
  async getAndResetMonthlyCount(userId) {
    const { rows } = await query(
      `UPDATE users
       SET monthly_analysis_count = CASE
             WHEN date_trunc('month', now()) > monthly_count_reset_at THEN 0
             ELSE monthly_analysis_count
           END,
           monthly_count_reset_at = date_trunc('month', now())
       WHERE id = $1
       RETURNING monthly_analysis_count`,
      [userId],
    );
    return rows[0]?.monthly_analysis_count ?? 0;
  },

  async incrementMonthlyCount(userId) {
    await query('UPDATE users SET monthly_analysis_count = monthly_analysis_count + 1 WHERE id = $1', [
      userId,
    ]);
  },

  /** Store OTP code and expiry for email verification */
  async setVerificationCode(userId, code, expiresAt) {
    await query(
      `UPDATE users SET verification_code = $2, verification_expires_at = $3 WHERE id = $1`,
      [userId, code, expiresAt],
    );
  },

  /** Mark user email as verified and clear the OTP */
  async markEmailVerified(userId) {
    await query(
      `UPDATE users SET email_verified = TRUE, verification_code = NULL, verification_expires_at = NULL WHERE id = $1`,
      [userId],
    );
  },

  /** Mark Google users as verified on creation/link */
  async markEmailVerifiedForGoogle(userId) {
    await query(
      `UPDATE users SET email_verified = TRUE WHERE id = $1`,
      [userId],
    );
  },
};
