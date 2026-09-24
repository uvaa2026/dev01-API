import { Router } from 'express'
import { pool, withTransaction } from '../db.js'
import { config } from '../config.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { generateVerificationToken, hashToken, signSession } from '../lib/tokens.js'
import { generateCohortCode, normalizeCohortCode } from '../lib/cohortCode.js'
import { sendVerificationEmail, sendCohortCodeEmail } from '../lib/email.js'
import { orgRegisterSchema, verifySchema, loginSchema, formatZodError } from '../lib/validation.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { asyncHandler } from '../lib/asyncHandler.js'

export const organisationsRouter = Router()

const VERIFICATION_TOKEN_HOURS = 24
const UNIQUE_VIOLATION = '23505'
const MAX_CODE_ATTEMPTS = 10
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

// ---------------------------------------------------------------------------
// POST /org/register
//   An organisation buys seats and registers itself: org details, a
//   mandatory Org Admin contact, and an optional Facilitator contact.
//   Nothing here activates the organisation — it stays PENDING_VERIFICATION
//   with no cohort code until the Org Admin verifies their email
//   (POST /org/verify), which is what actually issues the code.
// ---------------------------------------------------------------------------
organisationsRouter.post('/register', asyncHandler(async (req, res) => {
  const parsed = orgRegisterSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Some details are missing or invalid.',
      errors: formatZodError(parsed.error),
    })
  }
  const data = parsed.data

  let orgId, rawToken
  try {
    ;({ orgId, rawToken } = await withTransaction(async (client) => {
      const orgResult = await client.query(
        `INSERT INTO organisations
           (name, industry_vertical, admin_email, email_domain, seat_count, approval_mode, provisioning_model)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING org_id`,
        [
          data.organisationName,
          data.organisationType,
          data.orgAdmin.email,
          data.emailDomain || null,
          data.seatCount,
          data.approvalMode,
          data.provisioningModel,
        ],
      )
      const newOrgId = orgResult.rows[0].org_id

      const adminContactResult = await client.query(
        `INSERT INTO organisation_contacts (org_id, role, full_name, email, phone, wants_to_participate)
         VALUES ($1, 'ORG_ADMIN', $2, $3, $4, $5)
         RETURNING contact_id`,
        [newOrgId, data.orgAdmin.fullName, data.orgAdmin.email, data.orgAdmin.phone || null, data.orgAdmin.wantsToParticipate],
      )
      const adminContactId = adminContactResult.rows[0].contact_id

      // The Org Admin's own login is independent of the respondent system —
      // set now, usable once their email is verified (organisation_contacts.
      // verified_at), regardless of whether they ever opt in as a respondent.
      const adminPasswordHash = await hashPassword(data.orgAdmin.password)
      await client.query(
        `INSERT INTO organisation_contact_credentials (contact_id, password_hash) VALUES ($1, $2)`,
        [adminContactId, adminPasswordHash],
      )

      if (data.facilitator.enabled) {
        await client.query(
          `INSERT INTO organisation_contacts (org_id, role, full_name, email, phone, wants_to_participate)
           VALUES ($1, 'FACILITATOR', $2, $3, $4, $5)`,
          [newOrgId, data.facilitator.fullName, data.facilitator.email, data.facilitator.phone || null, data.facilitator.wantsToParticipate],
        )
      }

      const { raw, hash } = generateVerificationToken()
      await client.query(
        `INSERT INTO email_verification_tokens (organisation_contact_id, token_hash, expires_at)
         VALUES ($1, $2, now() + interval '${VERIFICATION_TOKEN_HOURS} hours')`,
        [adminContactId, hash],
      )

      return { orgId: newOrgId, rawToken: raw }
    }))
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) {
      return res.status(409).json({
        message: 'An organisation with this name is already registered.',
        errors: { organisationName: 'This organisation name is already registered.' },
      })
    }
    console.error('Organisation registration failed', err)
    return res.status(500).json({ message: 'Something went wrong registering your organisation. Please try again.' })
  }

  const verifyUrl = `${config.appVerifyUrlBase}?type=org&token=${rawToken}`
  try {
    await sendVerificationEmail({ to: data.orgAdmin.email, fullName: data.orgAdmin.fullName, verifyUrl })
  } catch (err) {
    console.error('Failed to send org verification email for', data.orgAdmin.email, err)
    // The organisation record exists either way — verification can be
    // re-requested once a "resend" endpoint exists, same as respondents.
  }

  return res.status(201).json({
    message: 'Organisation registered. Check the Org Admin email to verify before a cohort code is issued.',
    organisationId: orgId,
  })
}))

// ---------------------------------------------------------------------------
// POST /org/verify
//   Consumes the Org Admin's verification token, activates the
//   organisation, and issues the cohort code (generated here, not at
//   registration time, so a never-verified organisation never occupies a
//   code). POST, not GET, for the same link-prefetch reason as /auth/verify.
//
//   Re-clicking an already-consumed link is handled gracefully: if the
//   token was already used, we look up whether ITS organisation already has
//   a code and return that instead of a hard failure, since a mail client
//   or chat app re-fetching the link is indistinguishable from the admin
//   double-clicking it.
// ---------------------------------------------------------------------------
organisationsRouter.post('/verify', asyncHandler(async (req, res) => {
  const parsed = verifySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Missing verification token.' })
  }

  const tokenHash = hashToken(parsed.data.token)
  const tokenResult = await pool.query(
    `SELECT token_id, organisation_contact_id, consumed_at FROM email_verification_tokens
     WHERE token_hash = $1 AND expires_at > now() AND organisation_contact_id IS NOT NULL`,
    [tokenHash],
  )

  if (tokenResult.rowCount === 0) {
    return res.status(400).json({
      message: 'This verification link is invalid or has expired. Please request a new one.',
    })
  }

  const { organisation_contact_id: contactId } = tokenResult.rows[0]

  let result
  let lastErr
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    try {
      result = await withTransaction(async (client) => {
        await client.query(
          `UPDATE email_verification_tokens SET consumed_at = now()
           WHERE token_hash = $1 AND consumed_at IS NULL`,
          [tokenHash],
        )

        const contactResult = await client.query(
          `UPDATE organisation_contacts SET verified_at = COALESCE(verified_at, now())
           WHERE contact_id = $1 AND role = 'ORG_ADMIN'
           RETURNING org_id, full_name, email`,
          [contactId],
        )
        if (contactResult.rowCount === 0) {
          throw Object.assign(new Error('Verification token did not belong to an Org Admin contact.'), { status: 400 })
        }
        const { org_id: orgId, full_name: fullName, email } = contactResult.rows[0]

        // Lock the organisation row for the duration of this transaction so
        // two admins verifying at the same instant (unlikely, but the code
        // must never duplicate) can't both read "no code yet" and both try
        // to assign one.
        const orgRow = await client.query(
          'SELECT name, cohort_code FROM organisations WHERE org_id = $1 FOR UPDATE',
          [orgId],
        )
        const orgName = orgRow.rows[0].name
        let cohortCode = orgRow.rows[0].cohort_code

        if (!cohortCode) {
          cohortCode = generateCohortCode()
          await client.query(
            `UPDATE organisations SET cohort_code = $1, org_status = 'ACTIVE' WHERE org_id = $2`,
            [cohortCode, orgId],
          )
        }

        return { orgName, cohortCode, fullName, email }
      })
      break
    } catch (err) {
      if (err.code === UNIQUE_VIOLATION && attempt < MAX_CODE_ATTEMPTS - 1) {
        lastErr = err
        continue // cohort_code collision — vanishingly unlikely, retry with a fresh code
      }
      if (err.status === 400) {
        return res.status(400).json({ message: 'This verification link is not valid for an organisation.' })
      }
      throw err
    }
  }

  if (!result) {
    console.error('Could not generate a unique cohort code after retries', lastErr)
    return res.status(500).json({ message: 'Something went wrong issuing your cohort code. Please try again.' })
  }

  try {
    await sendCohortCodeEmail({
      to: result.email,
      fullName: result.fullName,
      orgName: result.orgName,
      cohortCode: result.cohortCode,
    })
  } catch (err) {
    console.error('Failed to send cohort code email for', result.email, err)
    // The code is already saved and returned in this response either way.
  }

  return res.status(200).json({
    message: 'Organisation verified. Your cohort code is ready.',
    organisationName: result.orgName,
    cohortCode: result.cohortCode,
  })
}))

// ---------------------------------------------------------------------------
// GET /org/lookup?code=... (public)
//   Step 1 of participant registration: confirm the code is real and
//   currently usable, and tell the frontend just enough to render the next
//   step (which org, whether a matching email domain will be required,
//   whether the email must already be on a pre-loaded roster). Never
//   returns seat counts or contact details.
// ---------------------------------------------------------------------------
organisationsRouter.get('/lookup', asyncHandler(async (req, res) => {
  const code = normalizeCohortCode(req.query.code)
  if (!code) {
    return res.status(400).json({ message: 'Enter a cohort code.' })
  }

  const result = await pool.query(
    `SELECT name, email_domain, provisioning_model, org_status, seat_count, seats_used, cohort_deadline_at
     FROM organisations WHERE cohort_code = $1`,
    [code],
  )

  if (result.rowCount === 0) {
    return res.status(404).json({ message: "We couldn't find an organisation with that cohort code. Check the code and try again." })
  }
  const org = result.rows[0]

  if (org.org_status !== 'ACTIVE') {
    return res.status(410).json({ message: 'This cohort is not currently accepting registrations.' })
  }
  if (org.cohort_deadline_at && new Date(org.cohort_deadline_at) < new Date()) {
    return res.status(410).json({ message: 'The registration deadline for this cohort has passed.' })
  }
  if (org.seats_used >= org.seat_count) {
    return res.status(409).json({ message: 'This cohort has reached its maximum number of participants.' })
  }

  return res.status(200).json({
    organisationName: org.name,
    requiresDomainMatch: Boolean(org.email_domain),
    hasRoster: org.provisioning_model === 'NAMED_ROSTER',
  })
}))

// ---------------------------------------------------------------------------
// POST /org/login
//   A separate login for the Org Admin, entirely independent of the
//   respondent/user_credentials system — an Org Admin who declined to
//   participate as a respondent (wants_to_participate = false) still needs
//   to be able to sign in and run their organisation. Mirrors /auth/login's
//   lockout/verification-gate shape exactly, against
//   organisation_contact_credentials instead of user_credentials.
//
//   The issued session JWT carries { sub: contact_id, email, kind:
//   'ORG_ADMIN' } — requireOrgAdmin.js recognises this shape and resolves
//   req.orgId directly from the contact id, without needing a respondent
//   row to exist at all.
// ---------------------------------------------------------------------------
organisationsRouter.post('/login', asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Enter a valid email and password.' })
  }
  const { email, password, rememberMe } = parsed.data

  const result = await pool.query(
    `SELECT oc.contact_id, oc.full_name, oc.email, oc.org_id, oc.verified_at,
            occ.password_hash, occ.failed_login_attempts, occ.locked_until
     FROM organisation_contacts oc
     JOIN organisation_contact_credentials occ ON occ.contact_id = oc.contact_id
     WHERE oc.email = $1 AND oc.role = 'ORG_ADMIN'`,
    [email],
  )

  const genericInvalid = () => res.status(401).json({ message: 'Invalid email or password.' })

  if (result.rowCount === 0) {
    return genericInvalid()
  }
  const contact = result.rows[0]

  if (contact.locked_until && new Date(contact.locked_until) > new Date()) {
    return res.status(423).json({
      message: `Too many failed attempts. Try again after ${new Date(contact.locked_until).toLocaleTimeString()}.`,
    })
  }

  const passwordOk = await verifyPassword(password, contact.password_hash)
  if (!passwordOk) {
    const attempts = contact.failed_login_attempts + 1
    const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS
      ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000)
      : null
    await pool.query(
      'UPDATE organisation_contact_credentials SET failed_login_attempts = $1, locked_until = $2 WHERE contact_id = $3',
      [attempts, lockedUntil, contact.contact_id],
    )
    return genericInvalid()
  }

  if (!contact.verified_at) {
    return res.status(403).json({ message: 'Please verify your organisation email before logging in.' })
  }

  await pool.query(
    'UPDATE organisation_contact_credentials SET failed_login_attempts = 0, locked_until = NULL, last_login_at = now() WHERE contact_id = $1',
    [contact.contact_id],
  )

  const token = signSession({ sub: contact.contact_id, email: contact.email, kind: 'ORG_ADMIN' }, { rememberMe })
  res.cookie(config.cookieName, token, {
    ...config.sessionCookieOptions,
    maxAge: (rememberMe ? 30 : 0.5) * 24 * 60 * 60 * 1000,
  })

  return res.status(200).json({
    orgAdmin: { id: contact.contact_id, fullName: contact.full_name, email: contact.email, orgId: contact.org_id },
  })
}))

// ---------------------------------------------------------------------------
// GET /org/me — used by the frontend Org Admin dashboard shell when the
// signed-in session is a direct Org Admin login (kind: 'ORG_ADMIN'), i.e.
// one with no respondent row at all.
// ---------------------------------------------------------------------------
organisationsRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
  if (req.user.kind !== 'ORG_ADMIN') {
    return res.status(404).json({ message: 'Not an Org Admin session.' })
  }

  const result = await pool.query(
    `SELECT oc.contact_id, oc.full_name, oc.email, oc.org_id, o.name AS organisation_name
     FROM organisation_contacts oc
     JOIN organisations o ON o.org_id = oc.org_id
     WHERE oc.contact_id = $1 AND oc.role = 'ORG_ADMIN' AND oc.verified_at IS NOT NULL`,
    [req.user.sub],
  )

  if (result.rowCount === 0) {
    res.clearCookie(config.cookieName, { path: '/' })
    return res.status(404).json({ message: 'Org Admin account not found.' })
  }

  const row = result.rows[0]
  return res.status(200).json({
    orgAdmin: {
      id: row.contact_id,
      fullName: row.full_name,
      email: row.email,
      orgId: row.org_id,
      organisationName: row.organisation_name,
    },
  })
}))
