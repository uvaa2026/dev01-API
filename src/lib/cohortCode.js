import crypto from 'node:crypto'

// Alphanumeric, date-stamped, human-typeable: 4 random chars + today's date
// as DDMMYY + 2 more random chars (e.g. "7F3KDDMMYYQ2"). The alphabet skips
// 0/O/1/I so a participant reading the code off an email or a slide doesn't
// mistype it. Uniqueness across ALL organisations is enforced at the
// database level (organisations.cohort_code UNIQUE, see migration 014) —
// this function only produces a candidate; the caller is responsible for
// retrying with a fresh candidate if the INSERT/UPDATE collides (see
// organisations.js's verify handler, which mirrors the existing
// generateVerificationToken()-collision-handling style used for the old
// duplicate-email check in auth.js).
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomChars(length) {
  const bytes = crypto.randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length]
  }
  return out
}

function todayAsDdMmYy() {
  const now = new Date()
  const dd = String(now.getUTCDate()).padStart(2, '0')
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const yy = String(now.getUTCFullYear()).slice(-2)
  return `${dd}${mm}${yy}`
}

export function generateCohortCode() {
  return `${randomChars(4)}${todayAsDdMmYy()}${randomChars(2)}`
}

// A participant may type the code with dashes, spaces, or lowercase letters
// (however it appeared on a slide or in an email signature) — normalise
// before comparing against organisations.cohort_code so "gppx-240926-wb"
// and "GPPX240926WB" are treated as the same code.
export function normalizeCohortCode(raw) {
  return String(raw || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}
