import { pool } from '../db.js'

// Runs after requireAuth (which sets req.user.sub). Checked against the
// database on every request rather than trusting a JWT claim, so revoking
// admin access takes effect immediately instead of waiting for the
// session token to expire.
export async function requireAdmin(req, res, next) {
  try {
    const result = await pool.query('SELECT is_admin FROM respondents WHERE respondent_id = $1', [req.user.sub])
    if (result.rowCount === 0 || !result.rows[0].is_admin) {
      return res.status(403).json({ message: 'Admin access required.' })
    }
    next()
  } catch (err) {
    next(err)
  }
}
