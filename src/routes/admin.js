import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { GUNA_VIGNETTES } from '../data/gunaVignettes.js'

export const adminRouter = Router()

// Every admin route requires a signed-in session AND is_admin = true.
adminRouter.use(requireAuth, requireAdmin)

// ---------------------------------------------------------------------------
// GET /admin/users — every registered respondent, with a per-assessment
// completion flag (today: just Guna). Ordered newest-registration-first.
// ---------------------------------------------------------------------------
adminRouter.get('/users', asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT r.respondent_id, r.full_name, r.email, r.industry_vertical, r.career_stage_code,
            r.experience_range, r.created_at, o.name AS organisation_name,
            uc.is_email_verified, uc.last_login_at,
            gr.submitted_at AS guna_submitted_at
     FROM respondents r
     JOIN organisations o ON o.org_id = r.organisation_id
     JOIN user_credentials uc ON uc.respondent_id = r.respondent_id
     LEFT JOIN guna_responses gr ON gr.respondent_id = r.respondent_id
     ORDER BY r.created_at DESC`,
  )

  const users = result.rows.map((row) => ({
    id: row.respondent_id,
    fullName: row.full_name,
    email: row.email,
    organisationName: row.organisation_name,
    vertical: row.industry_vertical,
    careerStage: row.career_stage_code,
    experience: row.experience_range,
    isEmailVerified: row.is_email_verified,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    assessments: {
      guna: { submitted: Boolean(row.guna_submitted_at), submittedAt: row.guna_submitted_at },
    },
  }))

  return res.status(200).json({ users })
}))

// ---------------------------------------------------------------------------
// GET /admin/users/:id — one respondent's full profile plus a status
// summary per assessment (expand `assessments` here as ECM/Construct etc.
// come online — same shape, new key).
// ---------------------------------------------------------------------------
adminRouter.get('/users/:id', asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT r.respondent_id, r.full_name, r.email, r.industry_vertical, r.career_stage_code,
            r.experience_range, r.department, r.created_at, o.name AS organisation_name,
            uc.is_email_verified, uc.last_login_at,
            gr.submitted_at AS guna_submitted_at
     FROM respondents r
     JOIN organisations o ON o.org_id = r.organisation_id
     JOIN user_credentials uc ON uc.respondent_id = r.respondent_id
     LEFT JOIN guna_responses gr ON gr.respondent_id = r.respondent_id
     WHERE r.respondent_id = $1`,
    [req.params.id],
  )

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Respondent not found.' })
  }

  const row = result.rows[0]
  return res.status(200).json({
    respondent: {
      id: row.respondent_id,
      fullName: row.full_name,
      email: row.email,
      organisationName: row.organisation_name,
      vertical: row.industry_vertical,
      careerStage: row.career_stage_code,
      experience: row.experience_range,
      department: row.department,
      isEmailVerified: row.is_email_verified,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
    },
    assessments: {
      guna: { submitted: Boolean(row.guna_submitted_at), submittedAt: row.guna_submitted_at },
    },
  })
}))

// ---------------------------------------------------------------------------
// GET /admin/users/:id/guna — the computed TPE result plus a per-question
// review (each vignette's prompt/options next to what this respondent
// actually picked). This is the one place the scoring columns ever leave
// the database — never exposed to the respondent themselves.
// ---------------------------------------------------------------------------
adminRouter.get('/users/:id/guna', asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT answers, submitted_at, sattva_count, rajas_count, tamas_count,
            dominance, provisional, tpe_raw, tpe_index, scored_at
     FROM guna_responses
     WHERE respondent_id = $1`,
    [req.params.id],
  )

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'This respondent has not completed the Guna profiler yet.' })
  }

  const row = result.rows[0]
  const selectedKeyByVignette = new Map(row.answers.map((a) => [a.vignetteId, a.optionKey]))

  // Reconstruct the order the vignettes were presented in, with the
  // respondent's pick resolved against the scoring master so the admin can
  // see prompt + all three options + which one was chosen (and its guna),
  // without needing to cross-reference the assessment source separately.
  const review = GUNA_VIGNETTES.map((v) => {
    const selectedKey = selectedKeyByVignette.get(v.id) || null
    const selectedOption = v.options.find((o) => o.key === selectedKey) || null
    return {
      vignetteId: v.id,
      title: v.title,
      prompt: v.prompt,
      options: v.options.map((o) => ({ key: o.key, text: o.text, guna: o.guna })),
      selectedKey,
      selectedGuna: selectedOption?.guna || null,
    }
  })

  return res.status(200).json({
    submittedAt: row.submitted_at,
    scoredAt: row.scored_at,
    result: {
      sattvaCount: row.sattva_count,
      rajasCount: row.rajas_count,
      tamasCount: row.tamas_count,
      dominance: row.dominance,
      provisional: row.provisional,
      tpeRaw: row.tpe_raw,
      tpeIndex: row.tpe_index !== null ? Number(row.tpe_index) : null,
    },
    review,
  })
}))
