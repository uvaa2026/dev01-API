import { Router } from 'express'
import { pool, withTransaction } from '../db.js'
import { config } from '../config.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { generateVerificationToken, hashToken, signSession } from '../lib/tokens.js'
import { sendVerificationEmail } from '../lib/email.js'
import { normalizeCohortCode } from '../lib/cohortCode.js'
import { registerSchema, loginSchema, verifySchema, formatZodError } from '../lib/validation.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { asyncHandler } from '../lib/asyncHandler.js'

export const authRouter = Router()

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15
const VERIFICATION_TOKEN_HOURS = 24

const UNIQUE_VIOLATION = '23505'

// A rejection with a known cause (bad code, seats full, domain mismatch,
// etc.) — thrown from inside the registration transaction so the
// transaction rolls back cleanly (no half-consumed seat, no orphaned
// roster lock) and the route can still respond with the right status code
// and field-level error instead of a generic 500.
class RegistrationRejected extends Error {
  constructor(status, message, errors) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

// ---------------------------------------------------------------------------
// POST /auth/register (participant)
//   Code-first: every registration now requires a cohort code. Inside one
//   transaction, with the organisation row locked for its duration
//   (SELECT ... FOR UPDATE) so two concurrent registrations against the
//   same org can never both squeeze into the last seat:
//     1. Look up the organisation by cohort code — must exist, be ACTIVE,
//        not past its deadline, and have a seat free.
//     2. If the org set an email_domain, the submitted email must match it.
//     3. If this email belongs to the org's own Org Admin/Facilitator
//        contact, they may only register themselves if they said yes to
//        "do you want to participate" during org registration.
//     4. If the org uses the Named Roster model, the email must match a
//        PENDING roster_entries row (and that row locks to this respondent).
//     5. Create the respondent, credentials, consent log, and a
//        verification token; increment seats_used.
//   Email verification always happens (see build assumption 3) regardless
//   of whether a domain was checked — domain matching gates whether
//   registration is ALLOWED, not whether the email gets verified.
// ---------------------------------------------------------------------------
authRouter.post('/register', asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Some details are missing or invalid.',
      errors: formatZodError(parsed.error),
    })
  }
  const data = parsed.data
  const cohortCode = normalizeCohortCode(data.cohortCode)
  const emailDomain = data.email.split('@')[1] || ''

  const existing = await pool.query('SELECT respondent_id FROM respondents WHERE email = $1', [data.email])
  if (existing.rowCount > 0) {
    return res.status(409).json({
      message: 'An account with this email address already exists.',
      errors: { email: 'This email is already registered.' },
    })
  }

  let respondentId, rawToken
  try {
    ;({ respondentId, rawToken } = await withTransaction(async (client) => {
      const orgResult = await client.query(
        `SELECT org_id, email_domain, seat_count, seats_used, approval_mode, provisioning_model,
                org_status, cohort_deadline_at
         FROM organisations WHERE cohort_code = $1 FOR UPDATE`,
        [cohortCode],
      )
      if (orgResult.rowCount === 0) {
        throw new RegistrationRejected(400, 'We could not find an organisation for that cohort code.', {
          cohortCode: 'Check the cohort code and try again.',
        })
      }
      const org = orgResult.rows[0]

      if (org.org_status !== 'ACTIVE') {
        throw new RegistrationRejected(410, 'This cohort is not currently accepting registrations.')
      }
      if (org.cohort_deadline_at && new Date(org.cohort_deadline_at) < new Date()) {
        throw new RegistrationRejected(410, 'The registration deadline for this cohort has passed.')
      }
      if (org.seats_used >= org.seat_count) {
        throw new RegistrationRejected(409, 'This cohort has reached its maximum number of participants.')
      }
      if (org.email_domain && emailDomain.toLowerCase() !== org.email_domain.toLowerCase()) {
        throw new RegistrationRejected(403, `Registration for this organisation requires an @${org.email_domain} email address.`, {
          email: `Use your @${org.email_domain} work email address.`,
        })
      }

      // Org Admin / Facilitator can only use their own org's code on
      // themselves if they opted in ("wants_to_participate") when the
      // organisation was registered.
      const contactResult = await client.query(
        `SELECT contact_id, role, wants_to_participate FROM organisation_contacts
         WHERE org_id = $1 AND email = $2`,
        [org.org_id, data.email],
      )
      const matchedContact = contactResult.rows[0] || null
      if (matchedContact && !matchedContact.wants_to_participate) {
        throw new RegistrationRejected(
          403,
          'Org Admins and Facilitators can only register as a participant if they opted in to participate when the organisation was registered.',
        )
      }

      // Named Roster: the email must be pre-loaded and still unclaimed.
      let rosterEntryId = null
      if (org.provisioning_model === 'NAMED_ROSTER') {
        const rosterResult = await client.query(
          `SELECT roster_entry_id FROM roster_entries
           WHERE org_id = $1 AND email = $2 AND status = 'PENDING'`,
          [org.org_id, data.email],
        )
        if (rosterResult.rowCount === 0) {
          throw new RegistrationRejected(
            403,
            "This email isn't on the pre-approved participant list for this organisation. Contact your organisation's admin.",
            { email: 'Not on the pre-approved list for this organisation.' },
          )
        }
        rosterEntryId = rosterResult.rows[0].roster_entry_id
      }

      // A MANUAL-approval organisation would otherwise lock its own Org
      // Admin out with nobody able to approve them — the Org Admin contact
      // already passed a stronger check (their own email verification at
      // org-verify time), so their self-registration auto-approves
      // regardless of the org's approval_mode. A Facilitator gets no such
      // exception: they still go through the normal approval gate.
      const isOrgAdminSelf = matchedContact?.role === 'ORG_ADMIN'
      const approvalStatus = org.approval_mode === 'MANUAL' && !isOrgAdminSelf ? 'PENDING' : 'APPROVED'

      const respondentResult = await client.query(
        `INSERT INTO respondents
           (organisation_id, full_name, email, industry_vertical, career_stage_code, experience_range, department,
            consent_assessment, consent_facilitator, consent_org_admin, roster_entry_id, approval_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING respondent_id`,
        [
          org.org_id,
          data.fullName,
          data.email,
          data.vertical,
          data.careerStage,
          data.experience,
          data.department || null,
          data.consent.processing,
          data.consent.facilitator,
          data.consent.orgAdmin,
          rosterEntryId,
          approvalStatus,
        ],
      )
      const newRespondentId = respondentResult.rows[0].respondent_id

      const passwordHash = await hashPassword(data.password)
      await client.query(
        `INSERT INTO user_credentials (respondent_id, password_hash) VALUES ($1, $2)`,
        [newRespondentId, passwordHash],
      )

      const consentEntries = [
        ['ASSESSMENT', data.consent.processing],
        ['FACILITATOR_VISIBILITY', data.consent.facilitator],
        ['ORG_ADMIN_VISIBILITY', data.consent.orgAdmin],
      ]
      for (const [type, given] of consentEntries) {
        await client.query(
          `INSERT INTO consent_log (respondent_id, consent_type, consent_given) VALUES ($1, $2, $3)`,
          [newRespondentId, type, given],
        )
      }

      await client.query('UPDATE organisations SET seats_used = seats_used + 1 WHERE org_id = $1', [org.org_id])

      if (matchedContact) {
        await client.query(
          'UPDATE organisation_contacts SET respondent_id = $1 WHERE contact_id = $2',
          [newRespondentId, matchedContact.contact_id],
        )
      }
      if (rosterEntryId) {
        await client.query(
          `UPDATE roster_entries SET status = 'REGISTERED', respondent_id = $1 WHERE roster_entry_id = $2`,
          [newRespondentId, rosterEntryId],
        )
      }

      const { raw, hash } = generateVerificationToken()
      await client.query(
        `INSERT INTO email_verification_tokens (respondent_id, token_hash, expires_at)
         VALUES ($1, $2, now() + interval '${VERIFICATION_TOKEN_HOURS} hours')`,
        [newRespondentId, hash],
      )

      return { respondentId: newRespondentId, rawToken: raw }
    }))
  } catch (err) {
    if (err instanceof RegistrationRejected) {
      return res.status(err.status).json({ message: err.message, ...(err.errors ? { errors: err.errors } : {}) })
    }
    if (err.code === UNIQUE_VIOLATION) {
      // Lost the race against a concurrent registration with the same email.
      return res.status(409).json({
        message: 'An account with this email address already exists.',
        errors: { email: 'This email is already registered.' },
      })
    }
    console.error('Registration failed', err)
    return res.status(500).json({ message: 'Something went wrong creating your account. Please try again.' })
  }

  const verifyUrl = `${config.appVerifyUrlBase}?token=${rawToken}`
  try {
    await sendVerificationEmail({ to: data.email, fullName: data.fullName, verifyUrl })
  } catch (err) {
    console.error('Failed to send verification email for', data.email, err)
    // Account is created either way — the respondent can request a new
    // link once a "resend verification" endpoint exists.
  }

  return res.status(201).json({
    message: 'Account created. Check your email to verify your address before logging in.',
    respondentId,
  })
}))

// ---------------------------------------------------------------------------
// POST /auth/verify — consumes a verification token from the email link.
// POST rather than GET so link-prefetching (email clients, chat unfurlers)
// can't silently burn the token before the person clicks it themselves.
// ---------------------------------------------------------------------------
authRouter.post('/verify', asyncHandler(async (req, res) => {
  const parsed = verifySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Missing verification token.' })
  }

  const tokenHash = hashToken(parsed.data.token)
  const tokenResult = await pool.query(
    `SELECT token_id, respondent_id FROM email_verification_tokens
     WHERE token_hash = $1 AND consumed_at IS NULL AND expires_at > now()`,
    [tokenHash],
  )

  if (tokenResult.rowCount === 0) {
    return res.status(400).json({
      message: 'This verification link is invalid or has expired. Please request a new one.',
    })
  }

  const { token_id: tokenId, respondent_id: respondentId } = tokenResult.rows[0]

  await withTransaction(async (client) => {
    await client.query('UPDATE email_verification_tokens SET consumed_at = now() WHERE token_id = $1', [tokenId])
    await client.query(
      'UPDATE user_credentials SET is_email_verified = true, email_verified_at = now() WHERE respondent_id = $1',
      [respondentId],
    )
  })

  return res.status(200).json({ message: 'Your email has been verified. You can now log in.' })
}))

// ---------------------------------------------------------------------------
// POST /auth/login
// ---------------------------------------------------------------------------
authRouter.post('/login', asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Enter a valid email and password.' })
  }
  const { email, password, rememberMe } = parsed.data

  const result = await pool.query(
    `SELECT r.respondent_id, r.full_name, r.email, r.is_admin, r.approval_status,
            uc.password_hash, uc.is_email_verified, uc.failed_login_attempts, uc.locked_until
     FROM respondents r
     JOIN user_credentials uc ON uc.respondent_id = r.respondent_id
     WHERE r.email = $1`,
    [email],
  )

  const genericInvalid = () => res.status(401).json({ message: 'Invalid email or password.' })

  if (result.rowCount === 0) {
    return genericInvalid()
  }
  const account = result.rows[0]

  if (account.locked_until && new Date(account.locked_until) > new Date()) {
    return res.status(423).json({
      message: `Too many failed attempts. Try again after ${new Date(account.locked_until).toLocaleTimeString()}.`,
    })
  }

  const passwordOk = await verifyPassword(password, account.password_hash)
  if (!passwordOk) {
    const attempts = account.failed_login_attempts + 1
    const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS
      ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000)
      : null
    await pool.query(
      'UPDATE user_credentials SET failed_login_attempts = $1, locked_until = $2 WHERE respondent_id = $3',
      [attempts, lockedUntil, account.respondent_id],
    )
    return genericInvalid()
  }

  if (!account.is_email_verified) {
    return res.status(403).json({ message: 'Please verify your email before logging in.' })
  }

  if (account.approval_status === 'PENDING') {
    return res.status(403).json({ message: "Your registration is awaiting approval from your organisation's admin." })
  }
  if (account.approval_status === 'REJECTED') {
    return res.status(403).json({ message: 'Your registration was not approved. Contact your organisation admin for details.' })
  }

  await pool.query(
    'UPDATE user_credentials SET failed_login_attempts = 0, locked_until = NULL, last_login_at = now() WHERE respondent_id = $1',
    [account.respondent_id],
  )

  const token = signSession({ sub: account.respondent_id, email: account.email }, { rememberMe })
  res.cookie(config.cookieName, token, {
    ...config.sessionCookieOptions,
    maxAge: (rememberMe ? 30 : 0.5) * 24 * 60 * 60 * 1000, // 30 days vs 12 hours
  })

  return res.status(200).json({
    respondent: {
      id: account.respondent_id,
      fullName: account.full_name,
      email: account.email,
      isAdmin: account.is_admin,
    },
  })
}))

// ---------------------------------------------------------------------------
// POST /auth/logout
// ---------------------------------------------------------------------------
authRouter.post('/logout', (req, res) => {
  // clearCookie must be called with the same attributes the cookie was set
  // with (minus maxAge) or some browsers won't recognise it as the same
  // cookie to remove.
  res.clearCookie(config.cookieName, config.sessionCookieOptions)
  return res.status(200).json({ message: 'Logged out.' })
})

// ---------------------------------------------------------------------------
// GET /auth/me — used by the frontend to gate the post-login "My Page" and
// load the signed-in respondent's profile.
// ---------------------------------------------------------------------------
authRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT r.respondent_id, r.full_name, r.email, r.industry_vertical, r.career_stage_code,
            r.experience_range, r.department, r.is_admin, o.name AS organisation_name,
            uc.is_email_verified, uc.last_login_at,
            oc.org_id AS org_admin_of
     FROM respondents r
     JOIN organisations o ON o.org_id = r.organisation_id
     JOIN user_credentials uc ON uc.respondent_id = r.respondent_id
     LEFT JOIN organisation_contacts oc
       ON oc.respondent_id = r.respondent_id AND oc.role = 'ORG_ADMIN' AND oc.verified_at IS NOT NULL
     WHERE r.respondent_id = $1`,
    [req.user.sub],
  )

  if (result.rowCount === 0) {
    res.clearCookie(config.cookieName, { path: '/' })
    return res.status(404).json({ message: 'Account not found.' })
  }

  const row = result.rows[0]
  return res.status(200).json({
    respondent: {
      id: row.respondent_id,
      fullName: row.full_name,
      email: row.email,
      vertical: row.industry_vertical,
      careerStage: row.career_stage_code,
      experience: row.experience_range,
      department: row.department,
      organisationName: row.organisation_name,
      isEmailVerified: row.is_email_verified,
      lastLoginAt: row.last_login_at,
      isAdmin: row.is_admin,
      isOrgAdminOf: row.org_admin_of,
    },
  })
}))
