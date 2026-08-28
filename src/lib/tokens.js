import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'

// Email verification tokens: the RAW token goes in the email link; only its
// SHA-256 hash is ever stored in the database (see email_verification_tokens
// in the schema). A leaked database dump can't be turned back into working
// verification links this way.
export function generateVerificationToken() {
  const raw = crypto.randomBytes(32).toString('hex')
  return { raw, hash: hashToken(raw) }
}

export function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}

// Session JWT — signed, short/medium-lived, delivered as an httpOnly cookie
// (never exposed to page JS, never in localStorage/sessionStorage — see the
// NFR against client-side session storage). "Remember me" just picks a
// longer expiry; the token shape is otherwise identical.
export function signSession(payload, { rememberMe = false } = {}) {
  const expiresIn = rememberMe ? config.jwtExpiresInRemember : config.jwtExpiresIn
  return jwt.sign(payload, config.jwtSecret, { expiresIn })
}

export function verifySession(token) {
  return jwt.verify(token, config.jwtSecret)
}
