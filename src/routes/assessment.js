import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import {
  gunaSubmissionSchema,
  gunaDraftSchema,
  constructSubmissionSchema,
  constructDraftSchema,
  formatZodError,
} from '../lib/validation.js'
import { computeTpe, computeConstruct, computePattern, DIMENSION_RAW_COLUMN } from '../lib/scoring.js'

export const assessmentRouter = Router()

// All assessment routes require a signed-in, verified session.
assessmentRouter.use(requireAuth)

// Screen Flow "INTERRUPTION" block / FR-17: a draft older than this (from
// started_at, not last_saved_at) is discarded and the respondent restarts.
const RESUME_WINDOW_HOURS = 72

function isExpired(startedAt) {
  return Date.now() - new Date(startedAt).getTime() > RESUME_WINDOW_HOURS * 60 * 60 * 1000
}

// Reads the in-progress draft for one respondent/assessment pair. If it's
// past the 72-hour resume window it's deleted here (server-side, so an
// expired draft can never be resumed by any client) and null is returned —
// the caller sees this exactly like "no draft", i.e. start from question 1.
async function loadDraft(respondentId, assessmentType) {
  const result = await pool.query(
    `SELECT draft_answers, current_index, started_at, last_saved_at
     FROM assessment_progress WHERE respondent_id = $1 AND assessment_type = $2`,
    [respondentId, assessmentType],
  )
  if (result.rowCount === 0) return { draft: null, expired: false }

  const row = result.rows[0]
  if (isExpired(row.started_at)) {
    await pool.query(
      `DELETE FROM assessment_progress WHERE respondent_id = $1 AND assessment_type = $2`,
      [respondentId, assessmentType],
    )
    return { draft: null, expired: true }
  }

  return {
    draft: { answers: row.draft_answers, currentIndex: row.current_index, startedAt: row.started_at },
    expired: false,
  }
}

// Upserts a draft. If a prior draft exists but has expired, it's replaced
// with a fresh one (new started_at) rather than extended — an autosave
// should never be able to revive an expired session past 72 hours.
async function saveDraft(respondentId, assessmentType, answers, currentIndex) {
  const existing = await pool.query(
    `SELECT started_at FROM assessment_progress WHERE respondent_id = $1 AND assessment_type = $2`,
    [respondentId, assessmentType],
  )
  const expired = existing.rowCount > 0 && isExpired(existing.rows[0].started_at)

  if (expired) {
    await pool.query(
      `DELETE FROM assessment_progress WHERE respondent_id = $1 AND assessment_type = $2`,
      [respondentId, assessmentType],
    )
  }

  const result = await pool.query(
    `INSERT INTO assessment_progress (respondent_id, assessment_type, draft_answers, current_index, started_at, last_saved_at)
     VALUES ($1, $2, $3::jsonb, $4, now(), now())
     ON CONFLICT (respondent_id, assessment_type) DO UPDATE SET
       draft_answers = EXCLUDED.draft_answers,
       current_index = EXCLUDED.current_index,
       last_saved_at = now()
     RETURNING last_saved_at, started_at`,
    [respondentId, assessmentType, JSON.stringify(answers), currentIndex],
  )
  return { savedAt: result.rows[0].last_saved_at, restarted: expired }
}

async function clearDraft(respondentId, assessmentType) {
  await pool.query(
    `DELETE FROM assessment_progress WHERE respondent_id = $1 AND assessment_type = $2`,
    [respondentId, assessmentType],
  )
}

// ---------------------------------------------------------------------------
// Pre-assessment briefing / consent gate (Screen Flow S2 Consent / S4
// Briefing, collapsed into one screen). A respondent cannot reach the Guna
// profiler until they've acknowledged this, regardless of how long ago they
// registered — see POST /guna and PATCH /guna/draft below, which both
// enforce it server-side too.
// ---------------------------------------------------------------------------
assessmentRouter.get('/briefing', asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT briefing_ack_at FROM respondents WHERE respondent_id = $1', [req.user.sub])
  const ackAt = result.rows[0]?.briefing_ack_at || null
  return res.status(200).json({ acknowledged: Boolean(ackAt), acknowledgedAt: ackAt })
}))

assessmentRouter.post('/briefing', asyncHandler(async (req, res) => {
  const result = await pool.query(
    `UPDATE respondents SET briefing_ack_at = COALESCE(briefing_ack_at, now())
     WHERE respondent_id = $1 RETURNING briefing_ack_at`,
    [req.user.sub],
  )
  return res.status(200).json({ acknowledged: true, acknowledgedAt: result.rows[0].briefing_ack_at })
}))

async function requireBriefingAck(req, res) {
  const result = await pool.query('SELECT briefing_ack_at FROM respondents WHERE respondent_id = $1', [req.user.sub])
  if (!result.rows[0]?.briefing_ack_at) {
    res.status(403).json({ message: 'Please read and acknowledge the briefing before starting the assessment.' })
    return false
  }
  return true
}

// ---------------------------------------------------------------------------
// GUNA — Stage 1 (15 vignettes).
// ---------------------------------------------------------------------------

// GET /assessment/guna — tells the frontend whether this respondent has
// already completed the Guna Profiler, and if not, whether there's a
// resumable draft (and its answers-so-far + last position). Deliberately
// does NOT return tpe_raw/tpe_index/dominance/scored_at — scoring stays
// hidden from respondents until the combined report is ready (FR-09).
assessmentRouter.get('/guna', asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT answers, submitted_at FROM guna_responses WHERE respondent_id = $1`,
    [req.user.sub],
  )

  if (result.rowCount > 0) {
    const row = result.rows[0]
    return res.status(200).json({ submitted: true, answers: row.answers, submittedAt: row.submitted_at, draft: null, expired: false })
  }

  const { draft, expired } = await loadDraft(req.user.sub, 'GUNA')
  return res.status(200).json({ submitted: false, answers: [], submittedAt: null, draft, expired })
}))

// PATCH /assessment/guna/draft — saves partial progress. Called on every
// answer and on explicit "Save draft" clicks (FR-17).
assessmentRouter.patch('/guna/draft', asyncHandler(async (req, res) => {
  if (!(await requireBriefingAck(req, res))) return

  const parsed = gunaDraftSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Could not save your progress.', errors: formatZodError(parsed.error) })
  }

  const answers = parsed.data.answers.map((a) => ({ id: a.vignetteId, optionKey: a.optionKey }))
  const { savedAt, restarted } = await saveDraft(req.user.sub, 'GUNA', answers, parsed.data.currentIndex)
  return res.status(200).json({ savedAt, restarted })
}))

// POST /assessment/guna — records a complete submission (all 15 answers)
// and scores it immediately (Scoring Guide v5, section 2: guna dominance +
// TPE_raw/TPE_index). Upserts on respondent_id: a resubmission replaces
// the previous answers and recomputes the score from scratch. Clears the
// draft on success — a submitted assessment has no draft.
assessmentRouter.post('/guna', asyncHandler(async (req, res) => {
  if (!(await requireBriefingAck(req, res))) return

  const parsed = gunaSubmissionSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Some answers are missing or invalid.',
      errors: formatZodError(parsed.error),
    })
  }

  const scoring = computeTpe(parsed.data.answers)

  const result = await pool.query(
    `INSERT INTO guna_responses
       (respondent_id, answers, submitted_at,
        sattva_count, rajas_count, tamas_count, dominance, provisional,
        tpe_raw, tpe_index, scored_at)
     VALUES ($1, $2::jsonb, now(), $3, $4, $5, $6, $7, $8, $9, now())
     ON CONFLICT (respondent_id) DO UPDATE SET
       answers = EXCLUDED.answers,
       submitted_at = now(),
       sattva_count = EXCLUDED.sattva_count,
       rajas_count = EXCLUDED.rajas_count,
       tamas_count = EXCLUDED.tamas_count,
       dominance = EXCLUDED.dominance,
       provisional = EXCLUDED.provisional,
       tpe_raw = EXCLUDED.tpe_raw,
       tpe_index = EXCLUDED.tpe_index,
       scored_at = now()
     RETURNING submitted_at`,
    [
      req.user.sub,
      JSON.stringify(parsed.data.answers),
      scoring.sattvaCount,
      scoring.rajasCount,
      scoring.tamasCount,
      scoring.dominance,
      scoring.provisional,
      scoring.tpeRaw,
      scoring.tpeIndex,
    ],
  )

  await clearDraft(req.user.sub, 'GUNA')

  return res.status(200).json({
    message: 'Your responses have been recorded.',
    submittedAt: result.rows[0].submitted_at,
  })
}))

// ---------------------------------------------------------------------------
// CONSTRUCT / "TCM" — Stage 2 (32 scenarios). Same shape as Guna above,
// gated behind a completed Guna submission (Screen Flow: Part Two follows
// immediately once "all 15 answered?" resolves yes).
// ---------------------------------------------------------------------------

async function requireGunaSubmitted(req, res) {
  const result = await pool.query('SELECT 1 FROM guna_responses WHERE respondent_id = $1', [req.user.sub])
  if (result.rowCount === 0) {
    res.status(403).json({ message: 'Complete the Guna profiler before starting this assessment.' })
    return false
  }
  return true
}

// GET /assessment/construct — same shape as GET /assessment/guna, plus a
// `locked` flag when Guna isn't submitted yet (so the frontend can show a
// clear "finish Guna first" state instead of an error).
assessmentRouter.get('/construct', asyncHandler(async (req, res) => {
  const gunaDone = await pool.query('SELECT 1 FROM guna_responses WHERE respondent_id = $1', [req.user.sub])
  if (gunaDone.rowCount === 0) {
    return res.status(200).json({ locked: true, submitted: false, answers: [], submittedAt: null, draft: null, expired: false })
  }

  const result = await pool.query(
    `SELECT answers, submitted_at FROM construct_responses WHERE respondent_id = $1`,
    [req.user.sub],
  )

  if (result.rowCount > 0) {
    const row = result.rows[0]
    return res.status(200).json({ locked: false, submitted: true, answers: row.answers, submittedAt: row.submitted_at, draft: null, expired: false })
  }

  const { draft, expired } = await loadDraft(req.user.sub, 'CONSTRUCT')
  return res.status(200).json({ locked: false, submitted: false, answers: [], submittedAt: null, draft, expired })
}))

assessmentRouter.patch('/construct/draft', asyncHandler(async (req, res) => {
  if (!(await requireGunaSubmitted(req, res))) return

  const parsed = constructDraftSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Could not save your progress.', errors: formatZodError(parsed.error) })
  }

  const answers = parsed.data.answers.map((a) => ({ id: a.scenarioId, optionKey: a.optionKey }))
  const { savedAt, restarted } = await saveDraft(req.user.sub, 'CONSTRUCT', answers, parsed.data.currentIndex)
  return res.status(200).json({ savedAt, restarted })
}))

// POST /assessment/construct — records the complete 32-answer submission
// and scores it immediately (Scoring Guide v5, section 3: four construct
// subscales + DQI). The UVAA Pattern (which also needs the Guna result) is
// computed at report time, not here — see GET /assessment/report.
assessmentRouter.post('/construct', asyncHandler(async (req, res) => {
  if (!(await requireGunaSubmitted(req, res))) return

  const parsed = constructSubmissionSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Some answers are missing or invalid.',
      errors: formatZodError(parsed.error),
    })
  }

  const scoring = computeConstruct(parsed.data.answers)

  const result = await pool.query(
    `INSERT INTO construct_responses
       (respondent_id, answers, submitted_at,
        upeksha_raw, anuvigna_raw, anasakti_raw, viveka_raw,
        dqi_raw, dqi_pct, dqi_band, scored_at)
     VALUES ($1, $2::jsonb, now(), $3, $4, $5, $6, $7, $8, $9, now())
     ON CONFLICT (respondent_id) DO UPDATE SET
       answers = EXCLUDED.answers,
       submitted_at = now(),
       upeksha_raw = EXCLUDED.upeksha_raw,
       anuvigna_raw = EXCLUDED.anuvigna_raw,
       anasakti_raw = EXCLUDED.anasakti_raw,
       viveka_raw = EXCLUDED.viveka_raw,
       dqi_raw = EXCLUDED.dqi_raw,
       dqi_pct = EXCLUDED.dqi_pct,
       dqi_band = EXCLUDED.dqi_band,
       scored_at = now()
     RETURNING submitted_at`,
    [
      req.user.sub,
      JSON.stringify(parsed.data.answers),
      scoring.dimensionRaw.UPEKSHA,
      scoring.dimensionRaw.ANUVIGNA,
      scoring.dimensionRaw.ANASAKTI,
      scoring.dimensionRaw.VIVEKA,
      scoring.dqiRaw,
      scoring.dqiPct,
      scoring.dqiBand,
    ],
  )

  await clearDraft(req.user.sub, 'CONSTRUCT')

  return res.status(200).json({
    message: 'Your responses have been recorded.',
    submittedAt: result.rows[0].submitted_at,
  })
}))

// ---------------------------------------------------------------------------
// REPORT — read-only, respondent-facing. Only exists once BOTH stages are
// scored (Screen Flow: "TPE complete, ECM not -> No output produced...
// Session remains open until the resume window expires"). Never exposes
// Guna counts/percentages or the research-only TPE index — those stay
// facilitator/admin-only (see routes/admin.js), matching FR-09.
// ---------------------------------------------------------------------------
assessmentRouter.get('/report', asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT g.dominance, g.provisional, g.scored_at AS guna_scored_at,
            c.upeksha_raw, c.anuvigna_raw, c.anasakti_raw, c.viveka_raw,
            c.dqi_raw, c.dqi_pct, c.dqi_band, c.scored_at AS construct_scored_at
     FROM respondents r
     LEFT JOIN guna_responses g ON g.respondent_id = r.respondent_id
     LEFT JOIN construct_responses c ON c.respondent_id = r.respondent_id
     WHERE r.respondent_id = $1`,
    [req.user.sub],
  )

  const row = result.rows[0]
  if (!row || !row.guna_scored_at || !row.construct_scored_at) {
    return res.status(200).json({ ready: false })
  }

  const dimensionPct = {}
  const dimensionDeficient = {}
  for (const [dim, col] of Object.entries(DIMENSION_RAW_COLUMN)) {
    const raw = row[col]
    const pct = Math.round((((raw - 8) / 16) * 100) * 100) / 100
    dimensionPct[dim] = pct
    dimensionDeficient[dim] = pct < 67
  }

  const construct = { dqiBand: row.dqi_band, dimensionPct }
  const pattern = computePattern({ dominance: row.dominance, provisional: row.provisional }, construct)

  return res.status(200).json({
    ready: true,
    dqi: { raw: row.dqi_raw, pct: Number(row.dqi_pct), band: row.dqi_band },
    dimensions: Object.fromEntries(
      Object.keys(DIMENSION_RAW_COLUMN).map((dim) => [dim, { pct: dimensionPct[dim], deficient: dimensionDeficient[dim] }]),
    ),
    // Per Scoring Guide v5 5.3: a provisional pattern's NAME is omitted from
    // the participant report (construct scores and DQI still show above).
    pattern: pattern.provisional
      ? { label: null, meaning: null, provisional: true }
      : { label: pattern.label, meaning: pattern.meaning, provisional: false },
    // Per 10.3: "Reserved and decisive" (Tamas + Anchored) prints no plan —
    // the report ends with a note that a facilitator will be in touch.
    needsFacilitatorReview: pattern.patternKey === 'TAMAS_ANCHORED',
  })
}))
