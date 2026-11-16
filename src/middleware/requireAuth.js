import { config } from '../config.js'
import { verifySession } from '../lib/tokens.js'

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
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const headerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
  const token = headerToken || req.cookies?.[config.cookieName]
  if (!token) {
    return res.status(401).json({ message: 'Not logged in.' })
  }

  try {
    req.user = verifySession(token) // { sub: respondent_id, email }
    next()
  } catch {
    // clearCookie needs the same attributes the cookie was set with
    // (domain included) or the browser won't treat it as the same cookie
    // to remove — see the matching comment in routes/auth.js's GET /me.
    res.clearCookie(config.cookieName, config.sessionCookieOptions)
    return res.status(401).json({ message: 'Your session has expired. Please log in again.' })
  }
}
