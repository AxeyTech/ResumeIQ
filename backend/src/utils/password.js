import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

/**
 * NFR-SE3: passwords stored using a salted, one-way hash. Plaintext
 * passwords are never persisted or logged.
 * @param {string} plainPassword
 */
export async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, env.BCRYPT_SALT_ROUNDS);
}

/**
 * @param {string} plainPassword
 * @param {string} passwordHash
 */
export async function verifyPassword(plainPassword, passwordHash) {
  if (!passwordHash) return false;
  return bcrypt.compare(plainPassword, passwordHash);
}
