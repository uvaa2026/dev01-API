import { config } from '../config.js'
import { verifySession } from '../lib/tokens.js'

export function requireAuth(req, res, next) {
  const token = req.cookies?.[config.cookieName]
  if (!token) {
    return res.status(401).json({ message: 'Not logged in.' })
  }

  try {
    req.user = verifySession(token) // { sub: respondent_id, email }
    next()
  } catch {
    res.clearCookie(config.cookieName)
    return res.status(401).json({ message: 'Your session has expired. Please log in again.' })
  }
}
