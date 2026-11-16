import { Router } from 'express'
import ExcelJS from 'exceljs'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { GUNA_VIGNETTES } from '../data/gunaVignettes.js'
import { getConstructScenarios } from '../data/constructScenarioVariants.js'
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
    `SELECT r.respondent_id, r.full_name, r.email, r.industry_vertical, r.leadership_scope,
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
    leadershipScope: row.leadership_scope,
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
    `SELECT r.respondent_id, r.full_name, r.email, r.industry_vertical, r.leadership_scope,
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
      leadershipScope: row.leadership_scope,
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
//
// The review must be built from the SAME scenario content set the
// respondent actually answered (their leadership_scope — see
// data/constructScenarioVariants.js) — otherwise a Function/Business Unit
// respondent's review would silently show the default Team scenario text
// next to an answer key that doesn't correspond to it.
// ---------------------------------------------------------------------------
adminRouter.get('/users/:id/construct', asyncHandler(async (req, res) => {
  if (req.params.id === req.user.sub) {
    return res.status(403).json({ message: 'Admins do not manage their own account from here.' })
  }

  const result = await pool.query(
    `SELECT cr.answers, cr.submitted_at, cr.upeksha_raw, cr.anuvigna_raw, cr.anasakti_raw, cr.viveka_raw,
            cr.dqi_raw, cr.dqi_pct, cr.dqi_band, cr.scored_at, r.leadership_scope
     FROM construct_responses cr
     JOIN respondents r ON r.respondent_id = cr.respondent_id
     WHERE cr.respondent_id = $1`,
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

  const review = getConstructScenarios(row.leadership_scope).map((s) => {
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

// ---------------------------------------------------------------------------
// GET /admin/export — every registered respondent (profile + final results)
// plus every raw Guna/Construct answer they submitted, as a downloadable
// .xlsx workbook. This is the bulk counterpart to the four per-respondent
// routes above: same source data (guna_responses/construct_responses,
// GUNA_VIGNETTES, getConstructScenarios), just assembled for everyone in one
// request instead of one respondent at a time, and written out as a
// spreadsheet rather than JSON.
//
// Sheets:
//   1. Results Summary        — one row per respondent: profile + final scores
//   2. Guna Responses         — one row per respondent, one column per vignette
//   3. Guna Question Key      — the 15 vignettes' text, for lookup
//   4. Construct Responses    — one row per respondent, one column per scenario
//   5. Construct Question Key — the 32 scenarios' text, once per leadership-
//                                scope variant actually in use
// ---------------------------------------------------------------------------
const FONT_NAME = 'Arial'
const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1C7FD6' } }
const SUBHEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE8F7' } }
const THIN_BORDER = {
  top: { style: 'thin', color: { argb: 'FFD8DEE9' } },
  left: { style: 'thin', color: { argb: 'FFD8DEE9' } },
  bottom: { style: 'thin', color: { argb: 'FFD8DEE9' } },
  right: { style: 'thin', color: { argb: 'FFD8DEE9' } },
}

function styleHeaderRow(row, { sub = false } = {}) {
  row.eachCell((cell) => {
    cell.font = { name: FONT_NAME, size: sub ? 9 : 10, bold: true, color: { argb: sub ? 'FF1A1E2A' : 'FFFFFFFF' } }
    cell.fill = sub ? SUBHEADER_FILL : HEADER_FILL
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border = THIN_BORDER
  })
}

function styleBodyRow(row, { center = false } = {}) {
  row.eachCell((cell) => {
    cell.font = { name: FONT_NAME, size: 10 }
    cell.border = THIN_BORDER
    cell.alignment = center
      ? { horizontal: 'center', vertical: 'middle' }
      : { vertical: 'top', wrapText: true }
  })
}

const VARIANT_LABELS = {
  TEAM: 'Leading a Team/Project',
  FUNCTION: 'Leading a Function',
  BUSINESS_UNIT: 'Leading a Business Unit',
}

adminRouter.get('/export', asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT r.respondent_id, r.full_name, r.email, r.industry_vertical, r.leadership_scope,
            r.experience_range, r.created_at, o.name AS organisation_name,
            uc.is_email_verified, uc.last_login_at,
            gr.answers AS guna_answers, gr.submitted_at AS guna_submitted_at,
            gr.sattva_count, gr.rajas_count, gr.tamas_count, gr.dominance, gr.provisional,
            gr.tpe_raw, gr.tpe_index, gr.scored_at AS guna_scored_at,
            cr.answers AS construct_answers, cr.submitted_at AS construct_submitted_at,
            cr.upeksha_raw, cr.anuvigna_raw, cr.anasakti_raw, cr.viveka_raw,
            cr.dqi_raw, cr.dqi_pct, cr.dqi_band, cr.scored_at AS construct_scored_at
     FROM respondents r
     JOIN organisations o ON o.org_id = r.organisation_id
     JOIN user_credentials uc ON uc.respondent_id = r.respondent_id
     LEFT JOIN guna_responses gr ON gr.respondent_id = r.respondent_id
     LEFT JOIN construct_responses cr ON cr.respondent_id = r.respondent_id
     WHERE r.respondent_id != $1
     ORDER BY r.created_at DESC`,
    [req.user.sub],
  )

  // Resolve each respondent's full review (same shape the per-user /guna and
  // /construct routes above build) plus, where both stages are scored, the
  // UVAA Pattern — all from data already on the row, no extra queries.
  const respondents = result.rows.map((row) => {
    const scope = row.leadership_scope
    let gunaReview = null
    if (row.guna_submitted_at) {
      const selectedKeyByVignette = new Map(row.guna_answers.map((a) => [a.vignetteId, a.optionKey]))
      gunaReview = GUNA_VIGNETTES.map((v) => {
        const selectedKey = selectedKeyByVignette.get(v.id) || null
        const selectedOption = v.options.find((o) => o.key === selectedKey) || null
        return { vignetteId: v.id, title: v.title, prompt: v.prompt, options: v.options, selectedKey, selectedGuna: selectedOption?.guna || null }
      })
    }

    let constructReview = null
    if (row.construct_submitted_at) {
      const selectedKeyByScenario = new Map(row.construct_answers.map((a) => [a.scenarioId, a.optionKey]))
      constructReview = getConstructScenarios(scope).map((s) => {
        const selectedKey = selectedKeyByScenario.get(s.id) || null
        const selectedOption = s.options.find((o) => o.key === selectedKey) || null
        return { scenarioId: s.id, dimension: s.dimension, situation: s.situation, options: s.options, selectedKey, selectedScore: selectedOption?.score ?? null }
      })
    }

    let dimensionPct = null
    let pattern = null
    if (row.guna_scored_at && row.construct_scored_at) {
      dimensionPct = {}
      for (const [dim, col] of Object.entries(DIMENSION_RAW_COLUMN)) {
        dimensionPct[dim] = Math.round((((row[col] - 8) / 16) * 100) * 100) / 100
      }
      pattern = computePattern(
        { dominance: row.dominance, provisional: row.provisional },
        { dqiBand: row.dqi_band, dimensionPct },
      )
    }

    return {
      id: row.respondent_id,
      fullName: row.full_name,
      email: row.email,
      organisationName: row.organisation_name,
      vertical: row.industry_vertical,
      leadershipScope: scope,
      experience: row.experience_range,
      isEmailVerified: row.is_email_verified,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
      reportReady: Boolean(row.guna_scored_at && row.construct_scored_at),
      guna: row.guna_submitted_at ? {
        submittedAt: row.guna_submitted_at,
        dominance: row.dominance, provisional: row.provisional,
        sattvaCount: row.sattva_count, rajasCount: row.rajas_count, tamasCount: row.tamas_count,
        tpeRaw: row.tpe_raw, tpeIndex: row.tpe_index !== null ? Number(row.tpe_index) : null,
        review: gunaReview,
      } : null,
      construct: row.construct_submitted_at ? {
        submittedAt: row.construct_submitted_at,
        dqiRaw: row.dqi_raw, dqiPct: row.dqi_pct !== null ? Number(row.dqi_pct) : null, dqiBand: row.dqi_band,
        dimensionPct, review: constructReview,
      } : null,
      pattern,
    }
  })

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'UVAA Admin'
  workbook.created = new Date()

  // --- Sheet 1: Results Summary --------------------------------------------
  const ws1 = workbook.addWorksheet('Results Summary')
  const headers1 = [
    'Full Name', 'Email', 'Organisation', 'Leadership Scope', 'Vertical', 'Experience (yrs)',
    'Registered', 'Last Login', 'Email Verified', 'Guna Submitted', 'Construct Submitted', 'Report Ready',
    'Guna Dominance', 'Guna Provisional', 'Sattva', 'Rajas', 'Tamas', 'TPE Raw', 'TPE Index',
    'DQI Raw', 'DQI %', 'DQI Band', 'Upeksha %', 'Viveka %', 'Anuvigna %', 'Anasakti %',
    'UVAA Pattern', 'Pattern Band', 'Pattern Provisional', 'Needs Facilitator Review',
  ]
  ws1.addRow(headers1)
  styleHeaderRow(ws1.getRow(1))
  ws1.views = [{ state: 'frozen', ySplit: 1 }]
  ws1.columns = [22, 28, 20, 16, 12, 12, 18, 18, 12, 18, 18, 11, 13, 13, 8, 8, 8, 9, 10,
    9, 9, 11, 10, 10, 11, 10, 26, 13, 15, 20].map((width) => ({ width }))

  for (const p of respondents) {
    const dims = p.construct?.dimensionPct || {}
    const row = ws1.addRow([
      p.fullName, p.email, p.organisationName, p.leadershipScope || 'TEAM (default)', p.vertical, p.experience,
      p.createdAt, p.lastLoginAt, p.isEmailVerified ? 'Yes' : 'No',
      p.guna?.submittedAt || '', p.construct?.submittedAt || '', p.reportReady ? 'Yes' : 'No',
      p.guna?.dominance ?? '', p.guna?.provisional ?? '',
      p.guna?.sattvaCount ?? '', p.guna?.rajasCount ?? '', p.guna?.tamasCount ?? '',
      p.guna?.tpeRaw ?? '', p.guna?.tpeIndex ?? '',
      p.construct?.dqiRaw ?? '', p.construct?.dqiPct ?? '', p.construct?.dqiBand ?? '',
      dims.UPEKSHA ?? '', dims.VIVEKA ?? '', dims.ANUVIGNA ?? '', dims.ANASAKTI ?? '',
      p.pattern?.label ?? '', p.pattern?.patternBand ?? '', p.pattern?.provisional ?? '',
      p.pattern?.heldPattern ?? '',
    ])
    styleBodyRow(row)
  }

  // --- Sheet 2: Guna Responses (wide) ---------------------------------------
  const ws2 = workbook.addWorksheet('Guna Responses')
  const refGuna = respondents.find((p) => p.guna)?.guna.review || GUNA_VIGNETTES.map((v) => ({ vignetteId: v.id, title: v.title }))
  const vignetteIds = refGuna.map((v) => v.vignetteId)
  ws2.addRow(['Full Name', 'Email', ...vignetteIds])
  ws2.addRow(['', '', ...refGuna.map((v) => v.title)])
  styleHeaderRow(ws2.getRow(1))
  styleHeaderRow(ws2.getRow(2), { sub: true })
  ws2.views = [{ state: 'frozen', xSplit: 2, ySplit: 2 }]
  ws2.columns = [22, 28, ...vignetteIds.map(() => 16)].map((width) => ({ width }))

  for (const p of respondents) {
    const row = ws2.addRow([
      p.fullName, p.email,
      ...vignetteIds.map((vid) => {
        if (!p.guna) return '(not started)'
        const v = p.guna.review.find((x) => x.vignetteId === vid)
        return v?.selectedKey ? `${v.selectedKey} — ${v.selectedGuna}` : '(no answer)'
      }),
    ])
    styleBodyRow(row, { center: true })
  }

  // --- Sheet 3: Guna Question Key -------------------------------------------
  const ws3 = workbook.addWorksheet('Guna Question Key')
  ws3.addRow(['Vignette ID', 'Title', 'Prompt', 'Option A', 'A — Guna', 'Option B', 'B — Guna', 'Option C', 'C — Guna'])
  styleHeaderRow(ws3.getRow(1))
  ws3.columns = [14, 24, 40, 32, 10, 32, 10, 32, 10].map((width) => ({ width }))
  for (const v of GUNA_VIGNETTES) {
    const opts = Object.fromEntries(v.options.map((o) => [o.key, o]))
    const row = ws3.addRow([
      v.id, v.title, v.prompt,
      opts.A?.text || '', opts.A?.guna || '', opts.B?.text || '', opts.B?.guna || '', opts.C?.text || '', opts.C?.guna || '',
    ])
    styleBodyRow(row)
  }

  // --- Sheet 4: Construct Responses (wide) ----------------------------------
  const ws4 = workbook.addWorksheet('Construct Responses')
  const refConstruct = respondents.find((p) => p.construct)?.construct.review || getConstructScenarios('TEAM')
  const scenarioIds = refConstruct.map((s) => s.scenarioId || s.id)
  ws4.addRow(['Full Name', 'Email', 'Leadership Scope', ...scenarioIds])
  ws4.addRow(['', '', '', ...refConstruct.map((s) => s.dimension)])
  styleHeaderRow(ws4.getRow(1))
  styleHeaderRow(ws4.getRow(2), { sub: true })
  ws4.views = [{ state: 'frozen', xSplit: 3, ySplit: 2 }]
  ws4.columns = [22, 28, 16, ...scenarioIds.map(() => 12)].map((width) => ({ width }))

  for (const p of respondents) {
    const row = ws4.addRow([
      p.fullName, p.email, p.leadershipScope || 'TEAM (default)',
      ...scenarioIds.map((sid) => {
        if (!p.construct) return '(not started)'
        const s = p.construct.review.find((x) => x.scenarioId === sid)
        return s?.selectedKey ? `${s.selectedKey} — ${s.selectedScore}` : '(no answer)'
      }),
    ])
    styleBodyRow(row, { center: true })
  }

  // --- Sheet 5: Construct Question Key (one block per variant in use) ------
  const ws5 = workbook.addWorksheet('Construct Question Key')
  ws5.addRow(['Scenario ID', 'Dimension', 'Leadership-Scope Version', 'Situation', 'Option A', 'A Score', 'Option B', 'B Score', 'Option C', 'C Score'])
  styleHeaderRow(ws5.getRow(1))
  ws5.columns = [12, 12, 22, 42, 32, 8, 32, 8, 32, 8].map((width) => ({ width }))

  const seenVariants = new Map()
  for (const p of respondents) {
    if (!p.construct) continue
    const scope = p.leadershipScope || 'TEAM'
    if (!seenVariants.has(scope)) seenVariants.set(scope, p.construct.review)
  }
  if (seenVariants.size === 0) {
    // Nobody has submitted the Construct assessment yet — fall back to all
    // three content sets as written, so the key sheet is never empty.
    for (const scope of ['TEAM', 'FUNCTION', 'BUSINESS_UNIT']) {
      seenVariants.set(scope, getConstructScenarios(scope))
    }
  }
  for (const [scope, review] of seenVariants) {
    const label = VARIANT_LABELS[scope] || scope
    for (const s of review) {
      const opts = Object.fromEntries(s.options.map((o) => [o.key, o]))
      const row = ws5.addRow([
        s.scenarioId || s.id, s.dimension, label, s.situation,
        opts.A?.text || '', opts.A?.score ?? '', opts.B?.text || '', opts.B?.score ?? '', opts.C?.text || '', opts.C?.score ?? '',
      ])
      styleBodyRow(row)
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="uvaa-respondent-export-${today}.xlsx"`)
  await workbook.xlsx.write(res)
  res.end()
}))
