import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { GUNA_VIGNETTES } from '../data/gunaVignettes.js'
import { CONSTRUCT_SCENARIOS } from '../data/constructScenarios.js'
import { computePattern, DIMENSION_RAW_COLUMN, CAPACITY_NAME, classifyCapacityBand, capacityLine } from '../lib/scoring.js'

export const adminRouter = Router()

// Every admin route requires a signed-in session AND is_admin = true.
adminRouter.use(requireAuth, requireAdmin)

// ---------------------------------------------------------------------------
// GET /admin/users — every registered respondent, with a per-assessment
// completion flag (today: just Guna). Ordered newest-registration-first.
// Excludes the signed-in admin's own account — an admin manages other
// respondents, not themselves, so their own row would just be noise (and
// confusing, since an admin account is also a normal respondent underneath
// and could otherwise show up looking like "just another user").
// ---------------------------------------------------------------------------
adminRouter.get('/users', asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT r.respondent_id, r.full_name, r.email, r.industry_vertical, r.career_stage_code,
            r.experience_range, r.created_at, o.name AS organisation_name,
            uc.is_email_verified, uc.last_login_at,
            gr.submitted_at AS guna_submitted_at,
            cr.submitted_at AS construct_submitted_at,
            (gr.scored_at IS NOT NULL AND cr.scored_at IS NOT NULL) AS report_ready
     FROM respondents r
     JOIN organisations o ON o.org_id = r.organisation_id
     JOIN user_credentials uc ON uc.respondent_id = r.respondent_id
     LEFT JOIN guna_responses gr ON gr.respondent_id = r.respondent_id
     LEFT JOIN construct_responses cr ON cr.respondent_id = r.respondent_id
     WHERE r.respondent_id != $1
     ORDER BY r.created_at DESC`,
    [req.user.sub],
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
      construct: { submitted: Boolean(row.construct_submitted_at), submittedAt: row.construct_submitted_at },
    },
    reportReady: row.report_ready,
  }))

  return res.status(200).json({ users })
}))

// ---------------------------------------------------------------------------
// GET /admin/users/:id — one respondent's full profile plus a status
// summary per assessment (expand `assessments` here as ECM/Construct etc.
// come online — same shape, new key).
// ---------------------------------------------------------------------------
adminRouter.get('/users/:id', asyncHandler(async (req, res) => {
  if (req.params.id === req.user.sub) {
    return res.status(403).json({ message: 'Admins do not manage their own account from here.' })
  }

  const result = await pool.query(
    `SELECT r.respondent_id, r.full_name, r.email, r.industry_vertical, r.career_stage_code,
            r.experience_range, r.department, r.created_at, o.name AS organisation_name,
            uc.is_email_verified, uc.last_login_at,
            gr.submitted_at AS guna_submitted_at,
            cr.submitted_at AS construct_submitted_at,
            (gr.scored_at IS NOT NULL AND cr.scored_at IS NOT NULL) AS report_ready
     FROM respondents r
     JOIN organisations o ON o.org_id = r.organisation_id
     JOIN user_credentials uc ON uc.respondent_id = r.respondent_id
     LEFT JOIN guna_responses gr ON gr.respondent_id = r.respondent_id
     LEFT JOIN construct_responses cr ON cr.respondent_id = r.respondent_id
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
      construct: { submitted: Boolean(row.construct_submitted_at), submittedAt: row.construct_submitted_at },
    },
    reportReady: row.report_ready,
  })
}))

// ---------------------------------------------------------------------------
// GET /admin/users/:id/guna — the computed TPE result plus a per-question
// review (each vignette's prompt/options next to what this respondent
// actually picked). This is the one place the scoring columns ever leave
// the database — never exposed to the respondent themselves.
// ---------------------------------------------------------------------------
adminRouter.get('/users/:id/guna', asyncHandler(async (req, res) => {
  if (req.params.id === req.user.sub) {
    return res.status(403).json({ message: 'Admins do not manage their own account from here.' })
  }

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

// ---------------------------------------------------------------------------
// GET /admin/users/:id/construct — mirrors /guna above: the computed DQI /
// dimension result plus a per-scenario review (situation + all four options
// next to what this respondent picked). Never exposed to the respondent.
// ---------------------------------------------------------------------------
adminRouter.get('/users/:id/construct', asyncHandler(async (req, res) => {
  if (req.params.id === req.user.sub) {
    return res.status(403).json({ message: 'Admins do not manage their own account from here.' })
  }

  const result = await pool.query(
    `SELECT answers, submitted_at, upeksha_raw, anuvigna_raw, anasakti_raw, viveka_raw,
            dqi_raw, dqi_pct, dqi_band, scored_at
     FROM construct_responses
     WHERE respondent_id = $1`,
    [req.params.id],
  )

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'This respondent has not completed the Construct assessment yet.' })
  }

  const row = result.rows[0]
  const selectedKeyByScenario = new Map(row.answers.map((a) => [a.scenarioId, a.optionKey]))

  const dimensionRaw = {}
  const dimensionPct = {}
  for (const [dim, col] of Object.entries(DIMENSION_RAW_COLUMN)) {
    dimensionRaw[dim] = row[col]
    dimensionPct[dim] = Math.round((((row[col] - 8) / 16) * 100) * 100) / 100
  }

  const review = CONSTRUCT_SCENARIOS.map((s) => {
    const selectedKey = selectedKeyByScenario.get(s.id) || null
    const selectedOption = s.options.find((o) => o.key === selectedKey) || null
    return {
      scenarioId: s.id,
      dimension: s.dimension,
      situation: s.situation,
      options: s.options.map((o) => ({ key: o.key, text: o.text, score: o.score })),
      selectedKey,
      selectedScore: selectedOption?.score ?? null,
    }
  })

  return res.status(200).json({
    submittedAt: row.submitted_at,
    scoredAt: row.scored_at,
    result: {
      dimensionRaw,
      dimensionPct,
      dqiRaw: row.dqi_raw,
      dqiPct: row.dqi_pct !== null ? Number(row.dqi_pct) : null,
      dqiBand: row.dqi_band,
    },
    review,
  })
}))

// ---------------------------------------------------------------------------
// GET /admin/users/:id/report — the full facilitator view (Screen Flow
// S13): everything the respondent's own report shows, PLUS guna
// percentages/dominance, the research-only TPE index, and the pattern name
// even when provisional (with the provisional flag so the UI can label it
// as such rather than hide it, per section 5.3: "the facilitator report
// notes the lean").
// ---------------------------------------------------------------------------
adminRouter.get('/users/:id/report', asyncHandler(async (req, res) => {
  if (req.params.id === req.user.sub) {
    return res.status(403).json({ message: 'Admins do not manage their own account from here.' })
  }

  const result = await pool.query(
    `SELECT g.sattva_count, g.rajas_count, g.tamas_count, g.dominance, g.provisional,
            g.tpe_raw, g.tpe_index, g.scored_at AS guna_scored_at,
            c.upeksha_raw, c.anuvigna_raw, c.anasakti_raw, c.viveka_raw,
            c.dqi_raw, c.dqi_pct, c.dqi_band, c.scored_at AS construct_scored_at
     FROM respondents r
     LEFT JOIN guna_responses g ON g.respondent_id = r.respondent_id
     LEFT JOIN construct_responses c ON c.respondent_id = r.respondent_id
     WHERE r.respondent_id = $1`,
    [req.params.id],
  )

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Respondent not found.' })
  }

  const row = result.rows[0]
  if (!row.guna_scored_at || !row.construct_scored_at) {
    return res.status(200).json({
      ready: false,
      message: !row.guna_scored_at
        ? 'Guna profiler not completed yet.'
        : 'Construct assessment not completed yet.',
    })
  }

  const dimensionPct = {}
  const dimensionDeficient = {}
  for (const [dim, col] of Object.entries(DIMENSION_RAW_COLUMN)) {
    const raw = row[col]
    const pct = Math.round((((raw - 8) / 16) * 100) * 100) / 100
    dimensionPct[dim] = pct
    dimensionDeficient[dim] = pct < 67
  }

  const pattern = computePattern(
    { dominance: row.dominance, provisional: row.provisional },
    { dqiBand: row.dqi_band, dimensionPct },
  )

  const capacities = Object.keys(DIMENSION_RAW_COLUMN)
    .map((dim) => ({
      dimension: dim,
      name: CAPACITY_NAME[dim],
      pct: dimensionPct[dim],
      deficient: dimensionDeficient[dim],
      band: classifyCapacityBand(dimensionPct[dim]),
      line: capacityLine(dim, dimensionPct[dim]),
    }))
    .sort((a, b) => b.pct - a.pct)

  return res.status(200).json({
    ready: true,
    guna: {
      sattvaCount: row.sattva_count,
      rajasCount: row.rajas_count,
      tamasCount: row.tamas_count,
      sattvaPct: Math.round((row.sattva_count / 15) * 100),
      rajasPct: Math.round((row.rajas_count / 15) * 100),
      tamasPct: Math.round((row.tamas_count / 15) * 100),
      dominance: row.dominance,
      provisional: row.provisional,
      tpeRaw: row.tpe_raw,
      tpeIndex: row.tpe_index !== null ? Number(row.tpe_index) : null,
    },
    dqi: { raw: row.dqi_raw, pct: Number(row.dqi_pct), band: row.dqi_band },
    dimensions: Object.fromEntries(
      Object.keys(DIMENSION_RAW_COLUMN).map((dim) => [dim, { pct: dimensionPct[dim], deficient: dimensionDeficient[dim] }]),
    ),
    capacities,
    // Same nine-cell copy the participant report uses (report spec 4.2) —
    // shown here in full regardless of provisional/heldPattern, since the
    // facilitator view is exempt from both the "held pattern ends the
    // report" and "provisional omits the label" rules that shape the
    // participant-facing route.
    pattern: {
      patternKey: pattern.patternKey,
      label: pattern.label,
      description: pattern.description,
      whatHolds: pattern.whatHolds,
      developmentFocus: pattern.developmentFocus,
      patternBand: pattern.patternBand,
      provisional: pattern.provisional,
      steppedDown: pattern.steppedDown,
    },
    needsFacilitatorReview: pattern.heldPattern,
  })
}))
