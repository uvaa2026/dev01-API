// TPE (disposition) + ECM/Construct (decision quality) scoring, and the
// UVAA Pattern that combines them — Scoring Guide v5, sections 2, 3, 4.
//
// Pure functions: no I/O here — the caller (assessment/admin routes) is
// responsible for persisting or returning whatever these compute.
import { GUNA_VIGNETTES } from '../data/gunaVignettes.js'
import { CONSTRUCT_SCENARIOS } from '../data/constructScenarios.js'

const GUNA_VIGNETTE_BY_ID = new Map(GUNA_VIGNETTES.map((v) => [v.id, v]))

// Resolution/tie-break order per section 2.1: "resolve toward the lower
// guna in the order Sattva, Rajas, Tamas" — assigning an undemonstrated
// Sattva is the costlier error. Array order doubles as that preference.
const GUNA_ORDER = ['SATTVA', 'RAJAS', 'TAMAS']
const GUNA_ITEM_SCORE = { SATTVA: 3, RAJAS: 2, TAMAS: 1 }

// Of 15 vignettes. Two gunas cannot both reach this (8 + 8 > 15), so a
// "declared" dominance is always unique — the tie/provisional case below
// only ever arises when nobody reaches the threshold.
const GUNA_DOMINANCE_THRESHOLD = 8

/**
 * @param {{ vignetteId: string, optionKey: 'A'|'B'|'C' }[]} answers - exactly
 *   15 entries, already validated by gunaSubmissionSchema (all ids present,
 *   no duplicates, valid option keys).
 * @returns {{
 *   sattvaCount: number, rajasCount: number, tamasCount: number,
 *   dominance: 'SATTVA'|'RAJAS'|'TAMAS', provisional: boolean,
 *   tpeRaw: number, tpeIndex: number,
 * }}
 */
export function computeTpe(answers) {
  const counts = { SATTVA: 0, RAJAS: 0, TAMAS: 0 }
  let tpeRaw = 0

  for (const { vignetteId, optionKey } of answers) {
    const vignette = GUNA_VIGNETTE_BY_ID.get(vignetteId)
    if (!vignette) {
      throw new Error(`computeTpe: unknown vignette id "${vignetteId}"`)
    }
    const option = vignette.options.find((o) => o.key === optionKey)
    if (!option) {
      throw new Error(`computeTpe: unknown option "${optionKey}" for vignette "${vignetteId}"`)
    }
    counts[option.guna] += 1
    tpeRaw += GUNA_ITEM_SCORE[option.guna]
  }

  const maxCount = Math.max(counts.SATTVA, counts.RAJAS, counts.TAMAS)
  let dominance
  let provisional

  if (maxCount >= GUNA_DOMINANCE_THRESHOLD) {
    dominance = GUNA_ORDER.find((g) => counts[g] === maxCount)
    provisional = false
  } else {
    // MIXED: nobody reached the threshold. Resolve to the highest count,
    // tie-broken toward the earlier entry in GUNA_ORDER (Sattva first).
    provisional = true
    dominance = GUNA_ORDER.find((g) => counts[g] === maxCount)
  }

  const tpeIndex = Math.round((((tpeRaw - 15) / 30) * 100) * 100) / 100 // 2dp, range 0-100

  return {
    sattvaCount: counts.SATTVA,
    rajasCount: counts.RAJAS,
    tamasCount: counts.TAMAS,
    dominance,
    provisional,
    tpeRaw,
    tpeIndex,
  }
}

// ---------------------------------------------------------------------------
// ECM / Construct (decision quality) scoring — Scoring Guide v5, section 3.
// ---------------------------------------------------------------------------
const CONSTRUCT_SCENARIO_BY_ID = new Map(CONSTRUCT_SCENARIOS.map((s) => [s.id, s]))

const DIMENSIONS = ['UPEKSHA', 'ANUVIGNA', 'ANASAKTI', 'VIVEKA']
// Maps a dimension to the *_raw column name used across the API (routes,
// admin views) — keeps the DB column names and the in-memory result shape
// in one place instead of re-deriving `${dim.toLowerCase()}_raw` everywhere.
export const DIMENSION_RAW_COLUMN = {
  UPEKSHA: 'upeksha_raw',
  ANUVIGNA: 'anuvigna_raw',
  ANASAKTI: 'anasakti_raw',
  VIVEKA: 'viveka_raw',
}

const DQI_BAND_HIGH = 75 // at or above -> ANCHORED
const DQI_BAND_LOW = 40 // below -> AT_RISK, else DEVELOPING
const DEFICIENCY_THRESHOLD_PCT = 67 // construct below this would receive a development plan

/**
 * @param {{ scenarioId: string, optionKey: 'A'|'B'|'C'|'D' }[]} answers -
 *   exactly 32 entries, already validated by constructSubmissionSchema.
 * @returns {{
 *   dimensionRaw: Record<string, number>, dimensionPct: Record<string, number>,
 *   deficient: Record<string, boolean>,
 *   dqiRaw: number, dqiPct: number, dqiBand: 'ANCHORED'|'DEVELOPING'|'AT_RISK',
 * }}
 */
export function computeConstruct(answers) {
  const raw = { UPEKSHA: 0, ANUVIGNA: 0, ANASAKTI: 0, VIVEKA: 0 }

  for (const { scenarioId, optionKey } of answers) {
    const scenario = CONSTRUCT_SCENARIO_BY_ID.get(scenarioId)
    if (!scenario) {
      throw new Error(`computeConstruct: unknown scenario id "${scenarioId}"`)
    }
    const option = scenario.options.find((o) => o.key === optionKey)
    if (!option) {
      throw new Error(`computeConstruct: unknown option "${optionKey}" for scenario "${scenarioId}"`)
    }
    raw[scenario.dimension] += option.score
  }

  const dimensionPct = {}
  const deficient = {}
  for (const dim of DIMENSIONS) {
    // construct_pct = ((construct_raw - 8) / 16) * 100 — the -8 corrects
    // for the item floor being 1, not 0 (Scoring Guide v5, 3.2).
    dimensionPct[dim] = Math.round((((raw[dim] - 8) / 16) * 100) * 100) / 100
    deficient[dim] = dimensionPct[dim] < DEFICIENCY_THRESHOLD_PCT
  }

  const dqiRaw = raw.UPEKSHA + raw.ANUVIGNA + raw.ANASAKTI + raw.VIVEKA
  const dqiPct = Math.round((((dqiRaw - 32) / 64) * 100) * 100) / 100

  let dqiBand
  if (dqiPct >= DQI_BAND_HIGH) dqiBand = 'ANCHORED'
  else if (dqiPct < DQI_BAND_LOW) dqiBand = 'AT_RISK'
  else dqiBand = 'DEVELOPING'

  return { dimensionRaw: raw, dimensionPct, deficient, dqiRaw, dqiPct, dqiBand }
}

// ---------------------------------------------------------------------------
// UVAA Pattern — Scoring Guide v5, section 4. Guna dominance crossed with
// the DQI band, nine cells, with a step-down rule: where two or more
// constructs sit below pattern_floor_pct (50), the pattern band used for
// classification steps down one level. The DQI score and DQI band as
// reported are never modified by this — only the pattern classification.
// ---------------------------------------------------------------------------
const PATTERN_FLOOR_PCT = 50
const PATTERN_STEPDOWN_COUNT = 2
const BAND_ORDER = ['ANCHORED', 'DEVELOPING', 'AT_RISK'] // best to worst

const UVAA_PATTERN_TABLE = {
  SATTVA: {
    ANCHORED: { label: 'Composed and decisive', meaning: 'Composure and judgement both hold under load. Nothing is being worked for.' },
    DEVELOPING: { label: 'Composed, decides unevenly', meaning: 'Settled in reflection. Judgement holds in some situations and bends in others.' },
    AT_RISK: { label: 'Composed but unanchored', meaning: 'Appears settled and decisions do not survive contact with live pressure.' },
  },
  RAJAS: {
    ANCHORED: { label: 'Driven and decisive', meaning: 'Judgement holds, sustained by effort rather than anchored. Effective now, worth watching for sustainability.' },
    DEVELOPING: { label: 'Driven, decides fast', meaning: 'Speed carries the decision. Often right, and the deliberation that would catch the wrong ones is not happening.' },
    AT_RISK: { label: 'Driven and reactive', meaning: 'Pressure carries the decision rather than the situation. Activation arrives before assessment does.' },
  },
  TAMAS: {
    ANCHORED: { label: 'Reserved and decisive', meaning: 'Low expression under load, judgement holds regardless. Uncommon and a rare case.' },
    DEVELOPING: { label: 'Reserved, decides late', meaning: 'Low activation is beginning to reach the decisions. Commitment lags rather than fails.' },
    AT_RISK: { label: 'Reserved and withdrawn', meaning: 'Disengages rather than deciding. Energy drops away under load and judgement withdraws with it.' },
  },
}

/**
 * @param {{ dominance: 'SATTVA'|'RAJAS'|'TAMAS'|null, provisional: boolean } | null} guna -
 *   null when the Guna profiler hasn't been scored yet (partial profile).
 * @param {{ dqiBand: 'ANCHORED'|'DEVELOPING'|'AT_RISK', dimensionPct: Record<string, number> }} construct
 * @returns {{
 *   patternKey: string|null, label: string|null, meaning: string|null,
 *   patternBand: string, steppedDown: boolean, provisional: boolean, partial: boolean,
 * }}
 */
export function computePattern(guna, construct) {
  const belowFloorCount = DIMENSIONS.reduce(
    (n, dim) => n + (construct.dimensionPct[dim] < PATTERN_FLOOR_PCT ? 1 : 0),
    0,
  )

  const dqiBandIndex = BAND_ORDER.indexOf(construct.dqiBand)
  const steppedDown = belowFloorCount >= PATTERN_STEPDOWN_COUNT && dqiBandIndex < BAND_ORDER.length - 1
  const patternBand = BAND_ORDER[steppedDown ? dqiBandIndex + 1 : dqiBandIndex]

  // Partial profile: Construct is done but Guna isn't (shouldn't normally
  // happen given Construct is gated behind Guna submission, but the scoring
  // guide's edge-case table — section 9 — calls for this to degrade
  // gracefully rather than error).
  if (!guna || !guna.dominance) {
    return {
      patternKey: null,
      label: null,
      meaning: null,
      patternBand,
      steppedDown,
      provisional: false,
      partial: true,
    }
  }

  const cell = UVAA_PATTERN_TABLE[guna.dominance][patternBand]
  return {
    patternKey: `${guna.dominance}_${patternBand}`,
    label: cell.label,
    meaning: cell.meaning,
    patternBand,
    steppedDown,
    // Where guna dominance resolved from MIXED, the pattern is provisional —
    // the participant-facing report omits the pattern name (section 5.3).
    provisional: guna.provisional,
    partial: false,
  }
}
