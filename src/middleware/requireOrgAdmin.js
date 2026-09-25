import { pool } from '../db.js'

// Runs after requireAuth. Mirrors requireAdmin.js's "check the database
// every request, not a JWT claim" pattern so revoking Org Admin access
// takes effect immediately, not when the session token expires.
//
// Two ways to arrive here, both resolved to the same req.orgId:
//   1. A direct Org Admin login (POST /org/login) — the session's `kind`
//      claim is 'ORG_ADMIN' and `sub` IS the organisation_contacts.contact_id
//      directly. This is the ONLY path for an Org Admin who declined to
//      participate as a respondent (wants_to_participate = false) — they
//      have no respondent row, so they must still be able to reach here.
//   2. An Org Admin who opted in and also registered as a respondent
//      (POST /auth/register + POST /auth/login) — `sub` is their
//      respondent_id, resolved via organisation_contacts.respondent_id.
// Either way, verified_at IS NOT NULL is required — an org that hasn't
// completed its own email verification has no active cohort code yet, so
// there's nothing for its admin to administer.
export async function requireOrgAdmin(req, res, next) {
  try {
    const query = req.user.kind === 'ORG_ADMIN'
      ? `SELECT org_id FROM organisation_contacts
         WHERE contact_id = $1 AND role = 'ORG_ADMIN' AND verified_at IS NOT NULL`
      : `SELECT org_id FROM organisation_contacts
         WHERE respondent_id = $1 AND role = 'ORG_ADMIN' AND verified_at IS NOT NULL`

    const result = await pool.query(query, [req.user.sub])
    if (result.rowCount === 0) {
      return res.status(403).json({ message: 'Admin access required.' })
    }
    req.orgId = result.rows[0].org_id
    next()
  } catch (err) {
    next(err)
  }
}
