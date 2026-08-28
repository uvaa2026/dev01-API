// TPE (disposition) scoring — Scoring Guide v5, section 2.
//
// Pure function: takes the validated answers array
// [{ vignetteId, optionKey }, ...15] and returns everything that gets
// stored in guna_responses. No I/O here — the caller (assessment route)
// is responsible for persisting the result.
import { GUNA_VIGNETTES } from '../data/gunaVignettes.js'

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
