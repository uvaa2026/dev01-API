// Organisation/cohort-level aggregate report — UVAA_Cohort_Report_Spec_v1_1.docx
// ("the cohort spec" below). Aggregate-only, no roster, no individual ever
// named or picked out (cohort spec, section 2 — the privacy rules). This is
// a *different* report from the per-participant one in routes/assessment.js
// and routes/admin.js's per-user report: it describes the whole group under
// one organisation, is read by the buyer's HR administrator and by the
// facilitator, and is never shown to a respondent.
//
// "Cohort" here, for the pilot, is simply "every respondent under one
// organisation who has completed both assessment stages" — organisations
// issue one cohort_code at a time (see migration 014), so there is no
// separate cohort grouping to join against yet. If UVAA later supports more
// than one cohort per organisation, this is the seam to add a cohort_id to.
//
// One builder function (getCohortReport) is shared by both routes that
// expose it: GET /org-admin/cohort-report (the buyer, scoped to their own
// org via requireOrgAdmin) and GET /admin/organisations/:id/cohort-report
// (the facilitator/Super Admin, any org). The only difference between the
// two audiences is `patternGrid` — the cohort spec's decision 5 ("only the
// facilitator does") — which this module always computes once the group is
// large enough, leaving it to the buyer-facing route to strip before
// responding (see orgAdmin.js).
import { pool } from '../db.js'
import {
  DIMENSION_RAW_COLUMN,
  CAPACITY_NAME,
  GUNA_DOMINANCE_PROFILE,
  BAND_TITLE,
  classifyGunaOrientation,
  classifyDqiBand,
  dimensionPctFromRaw,
  computePattern,
  joinNames,
} from './scoring.js'

// Cohort spec, section 2 ("Minimum group" / "Two views").
const MIN_GROUP = 8
const FULL_VIEW_MIN = 20
// Section 2 ("Nine-cell pattern grid") — reserved past the pilot; see the
// module comment on patternGrid below.
const PATTERN_GRID_MIN = 30
// "Small counts (full view)" — any shown bucket holding 1-4 people is merged
// into an adjacent one until every bucket shown has this many or is zero.
const SMALL_COUNT_FLOOR = 5

// Section 4's fixed display order ("never sorted by score") — distinct from
// scoring.js's DIMENSIONS order (UPEKSHA, ANUVIGNA, ANASAKTI, VIVEKA), which
// is a tie-break order for the lowest-capacity pick in section 6, not a
// display order. Keeping two separately named constants here rather than
// reusing one for both purposes, since the cohort spec is explicit that
// they're unrelated rules.
const CAPACITY_DISPLAY_ORDER = ['UPEKSHA', 'VIVEKA', 'ANUVIGNA', 'ANASAKTI']
const FOCUS_TIE_BREAK_ORDER = ['UPEKSHA', 'ANUVIGNA', 'ANASAKTI', 'VIVEKA']

const GUNA_ORDER = ['SATTVA', 'RAJAS', 'TAMAS']
const DQI_BAND_ORDER = ['AT_RISK', 'DEVELOPING', 'ANCHORED']
// Matches reportCharts.jsx's GUNA_LABEL (the Sanskrit term shown alongside
// the English name everywhere else in the app). Cohort spec section 5:
// "using the English name with the Sanskrit name in brackets" — the
// opposite order from section 4's capacity names (Sanskrit first, English
// in brackets), so this is kept separate rather than shared with
// CAPACITY_NAME's pairing.
const SANSKRIT_LABEL = { SATTVA: 'Sattva', RAJAS: 'Rajas', TAMAS: 'Tamas' }
function gunaDisplayName(guna) {
  return `${GUNA_DOMINANCE_PROFILE[guna].name} (${SANSKRIT_LABEL[guna]})`
}

// Mirrors uvaa-webapp/src/data/leadershipScope.js's `lead` text — keep in
// sync if that file's wording changes. A NULL leadership_scope (any
// respondent registered before migration 024) is treated as TEAM, the same
// convention used everywhere else this column is read.
const BAND_LABEL = {
  TEAM: 'Leading a team',
  FUNCTION: 'Leading a function',
  BUSINESS_UNIT: 'Leading business unit(s)',
}
function bandLabel(scope) {
  return BAND_LABEL[scope] || BAND_LABEL.TEAM
}

// Section 4's fixed, pilot-only group-level suggestions (verbatim).
const FOCUS_SUGGESTION = {
  UPEKSHA: 'Agree as a group how bad news and good news will be shared and weighed before a decision, so a hard message does not set the pace for everything that follows.',
  VIVEKA: 'Where a decision is unclear, give the group a short, agreed time to stay with the uncertainty before closing it, and name who will decide when that time ends.',
  ANUVIGNA: 'Agree a norm for challenge in meetings: the question is heard and written down before it is answered, so replies follow thinking and not the other way round.',
  ANASAKTI: 'Build in a regular review where anyone can say that a decision they own or argued for needs revisiting, and treat it as a normal part of how the group works.',
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
function formatDate(date, withYear) {
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}${withYear ? ` ${date.getUTCFullYear()}` : ''}`
}
// "between {start} and {end}" — the sample report omits the year on the
// first date when both fall in the same year ("24 November and 5 December
// 2026"), so this only prints a year on `start` when the two dates differ.
function formatDateRange(startIso, endIso) {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear()
  return { start: formatDate(start, !sameYear), end: formatDate(end, true) }
}

// Privacy rule ("Small counts (full view)"): a shown bucket holding 1-4
// people is merged into an adjacent one (combining both label and count)
// until every bucket shown has 5+ (or 0 — zero people isn't identifying, so
// it's left alone, not merged). Operates on an ordered array so "adjacent"
// is well defined; merges toward the following bucket, falling back to the
// preceding one only for the last bucket in the list. If every bucket still
// can't clear the floor (shouldn't arise given this is only ever called
// once the view's own minimum group size is met), the surviving small
// bucket's count is replaced with the string 'fewer than 5' rather than an
// exact small number, per the spec's fallback.
function mergeSmallCounts(buckets) {
  let list = buckets.map((b) => ({ ...b }))
  let changed = true
  while (changed && list.length > 1) {
    changed = false
    for (let i = 0; i < list.length; i++) {
      if (list[i].count === 0 || list[i].count >= SMALL_COUNT_FLOOR) continue
      const j = i < list.length - 1 ? i + 1 : i - 1
      const lo = Math.min(i, j)
      const hi = Math.max(i, j)
      const a = list[lo]
      const b = list[hi]
      list.splice(lo, 2, { key: `${a.key}+${b.key}`, label: `${a.label} and ${b.label}`, count: a.count + b.count })
      changed = true
      break
    }
  }
  return list.map((b) => (
    b.count > 0 && b.count < SMALL_COUNT_FLOOR
      ? { key: b.key, label: b.label, count: null, display: 'fewer than 5' }
      : { key: b.key, label: b.label, count: b.count, display: String(b.count) }
  ))
}

// Section 5's own small-count rule is narrower than the general one above:
// "Where an orientation has fewer than 5, print fewer than 5" — no merging
// with an adjacent guna (unlike the DQI/capacity bands, two orientations
// merged into one bucket wouldn't mean anything), just direct suppression.
function suppressSmallCounts(buckets) {
  return buckets.map((b) => (
    b.count > 0 && b.count < SMALL_COUNT_FLOOR
      ? { ...b, display: 'fewer than 5' }
      : { ...b, display: String(b.count) }
  ))
}

/**
 * @param {string} orgId
 * @returns {Promise<object|null>} null if the org doesn't exist; otherwise
 *   the full cohort report payload. `view` is 'LOCKED' (fewer than 8
 *   completed — only the base fields are meaningful), 'SMALL' (8-19) or
 *   'FULL' (20+). `patternGrid` is null below 30 completed either way, and
 *   must be stripped by the caller for the buyer-facing route even when
 *   it's present — see the module comment above.
 */
export async function getCohortReport(orgId) {
  const orgResult = await pool.query(
    `SELECT name, seat_count, cohort_code, org_status FROM organisations WHERE org_id = $1`,
    [orgId],
  )
  if (orgResult.rowCount === 0) return null
  const org = orgResult.rows[0]

  // "Completed" here matches reportReady everywhere else in the app (both
  // stages scored) — see orgAdmin.js's /overview and admin.js's
  // /organisations/:id. This intentionally does NOT filter on
  // consent_org_admin (that flag governs whether an org admin may see one
  // *named* participant's individual report, in org-admin/participants) or
  // on disabled_at (disabling blocks future logins, it doesn't retroactively
  // un-complete an assessment already taken) — an aggregate that never names
  // anyone has nothing for either of those consent/status flags to gate.
  const rowsResult = await pool.query(
    `SELECT r.leadership_scope,
            g.sattva_count, g.rajas_count, g.tamas_count, g.dominance,
            c.dqi_pct, c.dqi_band,
            c.upeksha_raw, c.anuvigna_raw, c.anasakti_raw, c.viveka_raw,
            c.submitted_at AS completed_at
     FROM respondents r
     JOIN guna_responses g ON g.respondent_id = r.respondent_id
     JOIN construct_responses c ON c.respondent_id = r.respondent_id
     WHERE r.organisation_id = $1
       AND g.scored_at IS NOT NULL AND c.scored_at IS NOT NULL
     ORDER BY c.submitted_at ASC`,
    [orgId],
  )

  const n = rowsResult.rowCount
  const base = {
    organisationName: org.name,
    cohortCode: org.cohort_code,
    orgStatus: org.org_status,
    groupSize: org.seat_count,
    completedN: n,
  }

  // "Minimum group" — below this, the dashboard shows only the completion
  // count (cohort spec section 2); no other section is computed at all.
  if (n < MIN_GROUP) {
    return { ...base, view: 'LOCKED' }
  }

  const view = n < FULL_VIEW_MIN ? 'SMALL' : 'FULL'
  const rows = rowsResult.rows
  const isFull = view === 'FULL'

  // --- Section 2: who took part ---------------------------------------
  const scopesPresent = new Set(rows.map((r) => r.leadership_scope || 'TEAM'))
  const mixedBands = scopesPresent.size > 1
  const bandsTaken = [...scopesPresent].map((scope) => ({ scope, label: bandLabel(scope) }))
  const dates = formatDateRange(rows[0].completed_at, rows[rows.length - 1].completed_at)
  const completionRate = Math.round((n / base.groupSize) * 100)

  // --- Section 3: decision quality across the group --------------------
  const dqiMean = Math.round(rows.reduce((sum, r) => sum + Number(r.dqi_pct), 0) / n)
  const dqiBand = classifyDqiBand(dqiMean)
  const dqiCountsRaw = { ANCHORED: 0, DEVELOPING: 0, AT_RISK: 0 }
  for (const r of rows) dqiCountsRaw[r.dqi_band] += 1

  let dqiCounts = null
  let dqiLine
  if (isFull) {
    dqiCounts = mergeSmallCounts(DQI_BAND_ORDER.map((b) => ({ key: b, label: BAND_TITLE[b], count: dqiCountsRaw[b] })))
    const majority = DQI_BAND_ORDER.find((b) => dqiCountsRaw[b] > n / 2)
    if (majority === 'ANCHORED') {
      dqiLine = 'Most of the group held their judgement under pressure. The capacities below show where the remaining difficulty sits.'
    } else if (majority === 'DEVELOPING') {
      dqiLine = 'Most of the group held under some kinds of pressure and gave way under others. The capacities below show which kinds.'
    } else if (majority === 'AT_RISK') {
      dqiLine = 'For most of the group, pressure shaped decisions more than the situation did. The capacities below show where it gave way most, which is where to start.'
    } else {
      dqiLine = 'The group is spread across bands. A single group-wide response would suit some people and miss others, so the capacities below are the better guide.'
    }
  } else if (dqiBand === 'ANCHORED') {
    dqiLine = 'On average the group held its judgement under pressure. The capacities below show where it held best and where it was tested.'
  } else if (dqiBand === 'DEVELOPING') {
    dqiLine = 'On average the group held under some kinds of pressure and gave way under others. The capacities below show which kinds.'
  } else {
    dqiLine = 'On average pressure shaped decisions in this group more than the situation did. The capacities below show where it gave way most, which is where to start.'
  }

  // --- Section 4: the four capacities -----------------------------------
  const dimensionPctByRow = rows.map((r) => {
    const pct = {}
    for (const [dim, col] of Object.entries(DIMENSION_RAW_COLUMN)) pct[dim] = dimensionPctFromRaw(r[col])
    return pct
  })
  const capacities = CAPACITY_DISPLAY_ORDER.map((dim) => {
    const mean = Math.round(dimensionPctByRow.reduce((sum, pct) => sum + pct[dim], 0) / n)
    let bandCounts = null
    if (isFull) {
      const raw = { LOW: 0, MID: 0, HIGH: 0 }
      for (const pct of dimensionPctByRow) {
        if (pct[dim] < 50) raw.LOW += 1
        else if (pct[dim] < 67) raw.MID += 1
        else raw.HIGH += 1
      }
      bandCounts = mergeSmallCounts([
        { key: 'LOW', label: 'Below 50', count: raw.LOW },
        { key: 'MID', label: '50 to 66', count: raw.MID },
        { key: 'HIGH', label: '67 or above', count: raw.HIGH },
      ])
    }
    return { dimension: dim, name: CAPACITY_NAME[dim], mean, bandCounts }
  })

  // --- Section 5: how the group operates --------------------------------
  // dominance is already resolved with the Sattva/Rajas/Tamas tie-break at
  // scoring time (computeTpe, lib/scoring.js) — reused as-is rather than
  // re-deriving it from the counts, so this always agrees with every other
  // view of the same respondent's dominance.
  const gunaCountsRaw = { SATTVA: 0, RAJAS: 0, TAMAS: 0 }
  for (const r of rows) gunaCountsRaw[r.dominance] += 1
  const maxGunaCount = Math.max(...GUNA_ORDER.map((g) => gunaCountsRaw[g]))
  const mostCommon = GUNA_ORDER
    .filter((g) => gunaCountsRaw[g] === maxGunaCount)
    .map((g) => ({ guna: g, name: GUNA_DOMINANCE_PROFILE[g].name }))

  let orientation
  if (isFull) {
    const ranked = suppressSmallCounts(
      [...GUNA_ORDER].sort((a, b) => gunaCountsRaw[b] - gunaCountsRaw[a])
        .map((g) => ({ key: g, label: GUNA_DOMINANCE_PROFILE[g].name, count: gunaCountsRaw[g], guna: g })),
    )
    const [top, second, third] = ranked
    const summaryLine = `${gunaDisplayName(top.guna)} was the most common orientation in the group, followed by `
      + `${gunaDisplayName(second.guna)}: ${top.display} people worked from ${gunaDisplayName(top.guna)} and `
      + `${second.display} from ${gunaDisplayName(second.guna)}. ${third.display} worked from ${gunaDisplayName(third.guna)}.`

    // "Blend" — a person whose own margin (classifyGunaOrientation, the same
    // per-person function the individual report uses) is 0 or 1 sits close
    // enough between two orientations that no single one is clearly theirs.
    // Counted separately from the three dominance buckets above, never as a
    // fourth bucket in them (cohort spec: "not as a fourth colour").
    const blendN = rows.filter((r) => {
      const { margin } = classifyGunaOrientation({ sattvaCount: r.sattva_count, rajasCount: r.rajas_count, tamasCount: r.tamas_count })
      return margin <= 1
    }).length
    orientation = {
      mostCommon,
      ranked,
      summaryLine,
      blendN,
      blendLine: blendN >= SMALL_COUNT_FLOOR
        ? `${blendN} people sit between orientations, with no single one clearly ahead of the others. For them the situation shapes what they work from more than a settled disposition does.`
        : null,
    }
  } else {
    const summaryLine = mostCommon.length === 1
      ? `${gunaDisplayName(mostCommon[0].guna)} was the most common orientation in the group.`
      : `${joinNames(mostCommon.map((g) => gunaDisplayName(g.guna)))} were equally common orientations in the group.`
    orientation = { mostCommon, ranked: null, summaryLine, blendN: null, blendLine: null }
  }

  // --- Section 6: where the group could focus ---------------------------
  // Ties fall back to the individual report's own fixed tie-break order
  // (scoring.js's DIMENSIONS constant), not this report's section 4 display
  // order — "as in the individual report" per the cohort spec.
  const focusCapacity = FOCUS_TIE_BREAK_ORDER
    .map((dim) => capacities.find((c) => c.dimension === dim))
    .sort((a, b) => a.mean - b.mean)[0]
  const focus = {
    dimension: focusCapacity.dimension,
    name: focusCapacity.name,
    mean: focusCapacity.mean,
    suggestion: FOCUS_SUGGESTION[focusCapacity.dimension],
  }

  // --- Nine-cell pattern grid (facilitator-only; reserved past the pilot) -
  // "Not shown in the pilot. Show it only where 30 or more have completed"
  // (cohort spec section 2) — computed here whenever the group is actually
  // that large, so the feature needs no further build once a cohort grows
  // past pilot size. Decision 5 reserves this to the facilitator: the
  // buyer-facing route (orgAdmin.js) strips this field before responding,
  // even though it's present in what this function returns.
  let patternGrid = null
  if (n >= PATTERN_GRID_MIN) {
    const cells = {}
    for (const guna of GUNA_ORDER) for (const band of DQI_BAND_ORDER) cells[`${guna}_${band}`] = 0
    rows.forEach((r, i) => {
      const pattern = computePattern({ dominance: r.dominance, provisional: false }, { dqiBand: r.dqi_band, dimensionPct: dimensionPctByRow[i] })
      if (pattern.patternKey) cells[pattern.patternKey] += 1
    })
    patternGrid = { cells, totalN: n }
  }

  return {
    ...base,
    view,
    mixedBands,
    bandsTaken,
    startDate: dates.start,
    endDate: dates.end,
    completionRate,
    dqi: { mean: dqiMean, band: dqiBand, counts: dqiCounts, line: dqiLine },
    capacities,
    orientation,
    focus,
    patternGrid,
  }
}
