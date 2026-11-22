import { pool } from '../db.js'
import { config } from '../config.js'

// Runs after requireAuth (which sets req.user.sub/email). is_admin is
// checked against the database on every request rather than trusting a
// JWT claim, so revoking admin access takes effect immediately instead of
// waiting for the session token to expire.
//
// Super Admin console (18 Nov 2026): this same gate now also protects
// account disable/enable, cross-org approve/reject, and organisation seat
// changes — real actions with real consequences for customer accounts, not
// just read-only visibility. So is_admin alone is no longer enough: the
// signed-in account's email must also be on config.superAdminEmails (an
// allowlist set via the SUPER_ADMIN_EMAILS env var). That check costs no
// extra DB round trip — the email is already in the verified session
// token (req.user.email) — and fails closed: an empty/misconfigured
// allowlist denies everyone rather than silently falling back to
// "is_admin is enough".
export async function requireAdmin(req, res, next) {
  try {
    const email = (req.user.email || '').toLowerCase()
    if (!config.superAdminEmails.includes(email)) {
      return res.status(403).json({ message: 'Admin access required.' })
    }
    const result = await pool.query('SELECT is_admin FROM respondents WHERE respondent_id = $1', [req.user.sub])
    if (result.rowCount === 0 || !result.rows[0].is_admin) {
      return res.status(403).json({ message: 'Admin access required.' })
    }
    next()
  } catch (err) {
    next(err)
  }
}
