import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * @param {{ id: string, email: string, role: string }} user
 */
export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN },
  );
}

/**
 * @param {string} token
 * @returns {{ sub: string, email: string, role: string, iat: number, exp: number }}
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}
