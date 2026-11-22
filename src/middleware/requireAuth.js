import { config } from '../config.js'
import { verifySession } from '../lib/tokens.js'
import { pool } from '../db.js'

// The Authorization header is the primary way the session token travels
// now — Safari (ITP), Firefox strict mode, Brave, and an increasing share
// of Chrome block third-party cookies outright, which silently broke login
// for anyone on those browsers while the frontend and API live on
// different domains (a cross-site cookie, however configured, is exactly
// what they block). The frontend stores the token itself (see lib/api.js)
// and sends it as `Authorization: Bearer <token>` on every request instead
// of relying on the browser to attach a cookie. The cookie is still
// accepted as a fallback below (covers any still-open tab from before this
// change, or a browser where third-party cookies happen to work), but
// nothing new depends on it.
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const headerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
  const token = headerToken || req.cookies?.[config.cookieName]
  if (!token) {
    return res.status(401).json({ message: 'Not logged in.' })
  }

  try {
    req.user = verifySession(token) // { sub: respondent_id, email, kind? }
  } catch {
    // clearCookie needs the same attributes the cookie was set with
    // (domain included) or the browser won't treat it as the same cookie
    // to remove — see the matching comment in routes/auth.js's GET /me.
    res.clearCookie(config.cookieName, config.sessionCookieOptions)
    return res.status(401).json({ message: 'Your session has expired. Please log in again.' })
  }

  // Super Admin console: an account a Super Admin disables must lose
  // access right away, not whenever its existing session token happens to
  // expire (up to 30 days away with "remember me"). Checked against the
  // database on every request — same reasoning as requireAdmin.js's
  // is_admin check — which is the one DB round trip this adds to every
  // authenticated request app-wide. req.user.sub is an
  // organisation_contacts.contact_id for a direct Org Admin login (see
  // requireOrgAdmin.js), which simply won't match any respondents row —
  // harmless no-op for that session kind, since disabling is a
  // respondent-account concept only.
  try {
    const result = await pool.query('SELECT disabled_at FROM respondents WHERE respondent_id = $1', [req.user.sub])
    if (result.rowCount > 0 && result.rows[0].disabled_at) {
      return res.status(403).json({ message: 'This account has been disabled. Contact your organisation or UVAA support.' })
    }
  } catch (err) {
    return next(err)
  }

  next()
}
