import { Router } from 'express'
import { parse } from 'csv-parse/sync'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireOrgAdmin } from '../middleware/requireOrgAdmin.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { rosterEntrySchema, formatZodError } from '../lib/validation.js'
import { computePattern, DIMENSION_RAW_COLUMN, CAPACITY_NAME, classifyCapacityBand, capacityLine } from '../lib/scoring.js'

export const orgAdminRouter = Router()

const UNIQUE_VIOLATION = '23505'

// Every route below requires a signed-in session AND that session belongs
// to this organisation's verified Org Admin contact (req.orgId is set by
// requireOrgAdmin) — every query is scoped to that org_id, so an org admin
// can never see or touch another organisation's data by guessing an id.
orgAdminRouter.use(requireAuth, requireOrgAdmin)

// ---------------------------------------------------------------------------
// GET /org-admin/overview
// ---------------------------------------------------------------------------
orgAdminRouter.get('/overview', asyncHandler(async (req, res) => {
  const orgResult = await pool.query(
    `SELECT name, seat_count, seats_used, cohort_code, cohort_deadline_at,
            approval_mode, provisioning_model, email_domain, org_status
     FROM organisations WHERE org_id = $1`,
    [req.orgId],
  )
  const org = orgResult.rows[0]

  const completionResult = await pool.query(
    `SELECT
       count(*) AS total_registered,
       count(*) FILTER (WHERE r.approval_status = 'PENDING') AS pending_approval,
       count(*) FILTER (WHERE gr.scored_at IS NOT NULL) AS guna_completed,
       count(*) FILTER (WHERE cr.scored_at IS NOT NULL) AS construct_completed,
       count(*) FILTER (WHERE gr.scored_at IS NOT NULL AND cr.scored_at IS NOT NULL) AS reports_ready
     FROM respondents r
     LEFT JOIN guna_responses gr ON gr.respondent_id = r.respondent_id
     LEFT JOIN construct_responses cr ON cr.respondent_id = r.respondent_id
     WHERE r.organisation_id = $1`,
    [req.orgId],
  )
  const c = completionResult.rows[0]

  return res.status(200).json({
    organisationName: org.name,
    seatCount: org.seat_count,
    seatsUsed: org.seats_used,
    cohortCode: org.cohort_code,
    cohortDeadlineAt: org.cohort_deadline_at,
    approvalMode: org.approval_mode,
    provisioningModel: org.provisioning_model,
    emailDomain: org.email_domain,
    orgStatus: org.org_status,
    totalRegistered: Number(c.total_registered),
    pendingApproval: Number(c.pending_approval),
    gunaCompleted: Number(c.guna_completed),
    constructCompleted: Number(c.construct_completed),
    reportsReady: Number(c.reports_ready),
  })
}))

// Shared between the list and single-participant routes: turns raw score
// columns into the same capacity/pattern shape admin.js's per-user report
// uses, so the Org Admin sees a consistent view of the framework.
function buildScoreView(row) {
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
  return { dimensionPct, dimensionDeficient, pattern }
}

// ---------------------------------------------------------------------------
// GET /org-admin/participants
//   The single most important behavioural rule in this build: a participant
//   who declined ORG_ADMIN_VISIBILITY (consent_org_admin = false) shows up
//   here with their registration/completion status, but their score is
//   computed and attached ONLY when that consent is true. This redaction
//   happens here, server-side — never as a frontend "hide this field",
//   which a modified client could bypass.
// ---------------------------------------------------------------------------
orgAdminRouter.get('/participants', asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT r.respondent_id, r.full_name, r.email, r.approval_status, r.consent_org_admin, r.created_at,
            uc.is_email_verified,
            gr.scored_at AS guna_scored_at, gr.dominance, gr.provisional,
            cr.scored_at AS construct_scored_at, cr.dqi_pct, cr.dqi_band,
            cr.upeksha_raw, cr.anuvigna_raw, cr.anasakti_raw, cr.viveka_raw
     FROM respondents r
     JOIN user_credentials uc ON uc.respondent_id = r.respondent_id
     LEFT JOIN guna_responses gr ON gr.respondent_id = r.respondent_id
     LEFT JOIN construct_responses cr ON cr.respondent_id = r.respondent_id
     WHERE r.organisation_id = $1
     ORDER BY r.created_at DESC`,
    [req.orgId],
  )

  const participants = result.rows.map((row) => {
    const completion = {
      guna: Boolean(row.guna_scored_at),
      construct: Boolean(row.construct_scored_at),
      reportReady: Boolean(row.guna_scored_at && row.construct_scored_at),
    }
    const base = {
      id: row.respondent_id,
      fullName: row.full_name,
      email: row.email,
      approvalStatus: row.approval_status,
      isEmailVerified: row.is_email_verified,
      createdAt: row.created_at,
      completion,
      consentOrgAdmin: row.consent_org_admin,
    }

    if (!row.consent_org_admin || !completion.reportReady) {
      return { ...base, score: null }
    }

    const { pattern } = buildScoreView(row)
    return {
      ...base,
      score: {
        dominance: row.dominance,
        provisional: row.provisional,
        dqiPct: Number(row.dqi_pct),
        dqiBand: row.dqi_band,
        patternKey: pattern.patternKey,
        patternLabel: pattern.label,
      },
    }
  })

  return res.status(200).json({ participants })
}))

// ---------------------------------------------------------------------------
// GET /org-admin/participants/:id — same redaction rule, single row, with
// the full capacity breakdown when consent and completion both allow it.
// ---------------------------------------------------------------------------
orgAdminRouter.get('/participants/:id', asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT r.respondent_id, r.full_name, r.email, r.approval_status, r.consent_org_admin, r.created_at,
            r.industry_vertical, r.career_stage_code, r.experience_range, r.department,
            uc.is_email_verified, uc.last_login_at,
            gr.sattva_count, gr.rajas_count, gr.tamas_count, gr.dominance, gr.provisional,
            gr.tpe_raw, gr.tpe_index, gr.scored_at AS guna_scored_at,
            cr.upeksha_raw, cr.anuvigna_raw, cr.anasakti_raw, cr.viveka_raw,
            cr.dqi_raw, cr.dqi_pct, cr.dqi_band, cr.scored_at AS construct_scored_at
     FROM respondents r
     JOIN user_credentials uc ON uc.respondent_id = r.respondent_id
     LEFT JOIN guna_responses gr ON gr.respondent_id = r.respondent_id
     LEFT JOIN construct_responses cr ON cr.respondent_id = r.respondent_id
     WHERE r.respondent_id = $1 AND r.organisation_id = $2`,
    [req.params.id, req.orgId],
  )

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Participant not found in your organisation.' })
  }
  const row = result.rows[0]

  const completion = {
    guna: Boolean(row.guna_scored_at),
    construct: Boolean(row.construct_scored_at),
    reportReady: Boolean(row.guna_scored_at && row.construct_scored_at),
  }
  const base = {
    id: row.respondent_id,
    fullName: row.full_name,
    email: row.email,
    approvalStatus: row.approval_status,
    isEmailVerified: row.is_email_verified,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    completion,
    consentOrgAdmin: row.consent_org_admin,
  }

  if (!row.consent_org_admin) {
    return res.status(200).json({
      ...base,
      score: null,
      message: 'This participant has not consented to share their profile and scores with the Org Admin.',
    })
  }
  if (!completion.reportReady) {
    return res.status(200).json({
      ...base,
      score: null,
      message: !completion.guna ? 'Guna profiler not completed yet.' : 'Construct assessment not completed yet.',
    })
  }

  const { dimensionPct, dimensionDeficient, pattern } = buildScoreView(row)
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
    ...base,
    profile: {
      vertical: row.industry_vertical,
      careerStage: row.career_stage_code,
      experience: row.experience_range,
      department: row.department,
    },
    score: {
      guna: {
        sattvaCount: row.sattva_count,
        rajasCount: row.rajas_count,
        tamasCount: row.tamas_count,
        dominance: row.dominance,
        provisional: row.provisional,
      },
      dqi: { raw: row.dqi_raw, pct: Number(row.dqi_pct), band: row.dqi_band },
      dimensions: Object.fromEntries(
        Object.keys(DIMENSION_RAW_COLUMN).map((dim) => [dim, { pct: dimensionPct[dim], deficient: dimensionDeficient[dim] }]),
      ),
      capacities,
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
    },
  })
}))

// ---------------------------------------------------------------------------
// PATCH /org-admin/participants/:id/approve
//   For MANUAL-approval organisations: { "decision": "APPROVE" | "REJECT" }.
//   Scoped to req.orgId so an org admin can only decide on their own
//   organisation's participants.
// ---------------------------------------------------------------------------
orgAdminRouter.patch('/participants/:id/approve', asyncHandler(async (req, res) => {
  const decision = req.body?.decision
  if (decision !== 'APPROVE' && decision !== 'REJECT') {
    return res.status(400).json({ message: 'decision must be "APPROVE" or "REJECT".' })
  }
  const newStatus = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED'

  const result = await pool.query(
    `UPDATE respondents SET approval_status = $1
     WHERE respondent_id = $2 AND organisation_id = $3
     RETURNING respondent_id, approval_status`,
    [newStatus, req.params.id, req.orgId],
  )
  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Participant not found in your organisation.' })
  }

  return res.status(200).json({ id: result.rows[0].respondent_id, approvalStatus: result.rows[0].approval_status })
}))

// ---------------------------------------------------------------------------
// GET /org-admin/roster — current pre-loaded seat list (Named Roster orgs).
// ---------------------------------------------------------------------------
orgAdminRouter.get('/roster', asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT roster_entry_id, full_name, email, status, source, created_at
     FROM roster_entries WHERE org_id = $1 ORDER BY created_at DESC`,
    [req.orgId],
  )
  return res.status(200).json({
    roster: result.rows.map((r) => ({
      id: r.roster_entry_id,
      fullName: r.full_name,
      email: r.email,
      status: r.status,
      source: r.source,
      createdAt: r.created_at,
    })),
  })
}))

async function assertNamedRoster(orgId) {
  const orgResult = await pool.query('SELECT provisioning_model FROM organisations WHERE org_id = $1', [orgId])
  if (orgResult.rows[0]?.provisioning_model !== 'NAMED_ROSTER') {
    const err = new Error('This organisation is not using the Named Roster model.')
    err.status = 400
    throw err
  }
}

// ---------------------------------------------------------------------------
// POST /org-admin/roster — add a single participant to the pre-approved
// list, one at a time.
// ---------------------------------------------------------------------------
orgAdminRouter.post('/roster', asyncHandler(async (req, res) => {
  try {
    await assertNamedRoster(req.orgId)
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ message: err.message })
    throw err
  }

  const parsed = rosterEntrySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid roster entry.', errors: formatZodError(parsed.error) })
  }

  try {
    const result = await pool.query(
      `INSERT INTO roster_entries (org_id, full_name, email, source) VALUES ($1, $2, $3, 'MANUAL')
       RETURNING roster_entry_id`,
      [req.orgId, parsed.data.fullName, parsed.data.email],
    )
    return res.status(201).json({ rosterEntryId: result.rows[0].roster_entry_id })
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) {
      return res.status(409).json({ message: 'This email is already on the roster.', errors: { email: 'Already on the roster.' } })
    }
    throw err
  }
}))

// ---------------------------------------------------------------------------
// POST /org-admin/roster/bulk — { "csv": "fullName,email\n..." }.
//   Each row is validated and inserted independently: one bad or duplicate
//   row is skipped and reported, not a reason to reject the whole file.
// ---------------------------------------------------------------------------
orgAdminRouter.post('/roster/bulk', asyncHandler(async (req, res) => {
  try {
    await assertNamedRoster(req.orgId)
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ message: err.message })
    throw err
  }

  const csvText = typeof req.body?.csv === 'string' ? req.body.csv : ''
  if (!csvText.trim()) {
    return res.status(400).json({ message: 'Provide CSV text with fullName and email columns.' })
  }

  let records
  try {
    records = parse(csvText, { columns: true, skip_empty_lines: true, trim: true })
  } catch (err) {
    return res.status(400).json({ message: 'Could not parse the CSV. Expected a header row with fullName and email columns.' })
  }

  const added = []
  const skipped = []

  for (const [index, record] of records.entries()) {
    const rowNumber = index + 2 // +1 for 0-index, +1 for the header row
    const candidate = {
      fullName: (record.fullName ?? record.name ?? '').trim(),
      email: (record.email ?? '').trim().toLowerCase(),
    }
    const parsed = rosterEntrySchema.safeParse(candidate)
    if (!parsed.success) {
      skipped.push({ row: rowNumber, email: candidate.email || null, reason: 'Missing or invalid fullName/email.' })
      continue
    }

    try {
      await pool.query(
        `INSERT INTO roster_entries (org_id, full_name, email, source) VALUES ($1, $2, $3, 'CSV')`,
        [req.orgId, parsed.data.fullName, parsed.data.email],
      )
      added.push(parsed.data.email)
    } catch (err) {
      if (err.code === UNIQUE_VIOLATION) {
        skipped.push({ row: rowNumber, email: parsed.data.email, reason: 'Already on the roster.' })
      } else {
        throw err
      }
    }
  }

  return res.status(200).json({ addedCount: added.length, skippedCount: skipped.length, skipped })
}))
