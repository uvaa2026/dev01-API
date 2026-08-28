import { Router } from 'express'
import { pool, withTransaction } from '../db.js'
import { config } from '../config.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { generateVerificationToken, hashToken, signSession } from '../lib/tokens.js'
import { sendVerificationEmail } from '../lib/email.js'
import { registerSchema, loginSchema, verifySchema, formatZodError } from '../lib/validation.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { asyncHandler } from '../lib/asyncHandler.js'

export const authRouter = Router()

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15
const VERIFICATION_TOKEN_HOURS = 24

const UNIQUE_VIOLATION = '23505'

// ---------------------------------------------------------------------------
// POST /auth/register
//   1. Validate the payload shape (missing/invalid data).
//   2. Check the email isn't already registered.
//   3. Create the organisation (if new), respondent, credentials, consent
//      log entries, and a verification token — all in one transaction.
//   4. Send the verification email (best-effort — a failed send doesn't
//      fail the registration; the account exists and can request a new
//      link later).
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
      let orgResult = await client.query('SELECT org_id FROM organisations WHERE name = $1', [data.organisation])
      let orgId
      if (orgResult.rowCount > 0) {
        orgId = orgResult.rows[0].org_id
      } else {
        orgResult = await client.query(
          `INSERT INTO organisations (name, industry_vertical)
           VALUES ($1, $2)
           RETURNING org_id`,
          [data.organisation, data.vertical],
        )
        orgId = orgResult.rows[0].org_id
      }

      const respondentResult = await client.query(
        `INSERT INTO respondents
           (organisation_id, full_name, email, industry_vertical, career_stage_code, experience_range, department,
            consent_assessment, consent_research, consent_share_with_hr)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING respondent_id`,
        [
          orgId,
          data.fullName,
          data.email,
          data.vertical,
          data.careerStage,
          data.experience,
          data.department || null,
          data.consent.assessment,
          data.consent.research,
          data.consent.shareWithHrAdmin,
        ],
      )
      const newRespondentId = respondentResult.rows[0].respondent_id

      const passwordHash = await hashPassword(data.password)
      await client.query(
        `INSERT INTO user_credentials (respondent_id, password_hash) VALUES ($1, $2)`,
        [newRespondentId, passwordHash],
      )

      const consentEntries = [
        ['ASSESSMENT', data.consent.assessment],
        ['RESEARCH_VALIDATION', data.consent.research],
        ['INDIVIDUAL_DATA_SHARING', data.consent.shareWithHrAdmin],
      ]
      for (const [type, given] of consentEntries) {
        await client.query(
          `INSERT INTO consent_log (respondent_id, consent_type, consent_given) VALUES ($1, $2, $3)`,
          [newRespondentId, type, given],
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
    `SELECT r.respondent_id, r.full_name, r.email, r.is_admin,
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
            uc.is_email_verified, uc.last_login_at
     FROM respondents r
     JOIN organisations o ON o.org_id = r.organisation_id
     JOIN user_credentials uc ON uc.respondent_id = r.respondent_id
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
    },
  })
}))
