import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { gunaSubmissionSchema, formatZodError } from '../lib/validation.js'
import { computeTpe } from '../lib/scoring.js'

export const assessmentRouter = Router()

// All assessment routes require a signed-in, verified session.
assessmentRouter.use(requireAuth)

// ---------------------------------------------------------------------------
// GET /assessment/guna — tells the frontend whether this respondent has
// already completed the Guna Profiler, and returns their answers if so
// (used both to show a "completed" state and to let them review/edit).
// Deliberately does NOT return tpe_raw/tpe_index/scored_at — scoring is a
// later pass and isn't shown to respondents yet.
// ---------------------------------------------------------------------------
assessmentRouter.get('/guna', asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT answers, submitted_at FROM guna_responses WHERE respondent_id = $1`,
    [req.user.sub],
  )

  if (result.rowCount === 0) {
    return res.status(200).json({ submitted: false, answers: [], submittedAt: null })
  }

  const row = result.rows[0]
  return res.status(200).json({ submitted: true, answers: row.answers, submittedAt: row.submitted_at })
}))

// ---------------------------------------------------------------------------
// POST /assessment/guna — records a complete submission (all 15 answers)
// and scores it immediately (Scoring Guide v5, section 2: guna dominance +
// TPE_raw/TPE_index). Upserts on respondent_id: a resubmission replaces
// the previous answers and recomputes the score from scratch, so a stale
// result can never sit alongside fresher answers.
//
// The computed result is stored but deliberately NOT returned here or from
// GET /assessment/guna — per the FRD, respondents never see their own
// score. Only the admin routes (src/routes/admin.js) expose it.
// ---------------------------------------------------------------------------
assessmentRouter.post('/guna', asyncHandler(async (req, res) => {
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

  return res.status(200).json({
    message: 'Your responses have been recorded.',
    submittedAt: result.rows[0].submitted_at,
  })
}))
