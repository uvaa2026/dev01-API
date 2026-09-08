// TPE (disposition) + ECM/Construct (decision quality) scoring, the UVAA
// Pattern that combines them, and the report-assembly helpers that turn all
// of that into the exact copy/layout described in UVAA_Report_V4_050926.docx
// ("the report spec" in comments below). Scoring Guide v5 sections 2-4
// remain the source of truth for the numbers; the report spec is the source
// of truth for what text prints around them.
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
// only ever arises when nobody reaches the threshold. This threshold still
// drives the `provisional` flag (facilitator-only per the report spec's
// data table — "does not affect the participant report"); it does NOT
// affect which guna is reported as dominant to the participant — per the
// report spec, "Dominance always resolves to the highest count" regardless.
const GUNA_DOMINANCE_THRESHOLD = 8

/**
 * @param {{ vignetteId: string, optionKey: 'A'|'B'|'C' }[]} answers - exactly
 *   15 entries, already validated by gunaSubmissionSchema (all ids present,
 *   no duplicates, valid option keys).
 * @returns {{
 *   sattvaCount: number, rajasCount: number, tamasCount: number,
 *   sattvaPct: number, rajasPct: number, tamasPct: number, margin: number,
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

  // Ranked descending by count, ties broken toward the earlier entry in
  // GUNA_ORDER (Array.sort is stable, and GUNA_ORDER's own sequence is the
  // tie-break order, so mapping-then-sorting preserves that automatically).
  const ranked = GUNA_ORDER.map((guna) => ({ guna, count: counts[guna] }))
    .sort((a, b) => b.count - a.count)

  const maxCount = ranked[0].count
  const dominance = ranked[0].guna
  const margin = ranked[0].count - ranked[1].count
  const provisional = maxCount < GUNA_DOMINANCE_THRESHOLD

  const tpeIndex = Math.round((((tpeRaw - 15) / 30) * 100) * 100) / 100 // 2dp, range 0-100

  return {
    sattvaCount: counts.SATTVA,
    rajasCount: counts.RAJAS,
    tamasCount: counts.TAMAS,
    sattvaPct: Math.round((counts.SATTVA / 15) * 100),
    rajasPct: Math.round((counts.RAJAS / 15) * 100),
    tamasPct: Math.round((counts.TAMAS / 15) * 100),
    margin,
    dominance,
    provisional,
    tpeRaw,
    tpeIndex,
  }
}

// Margin bands per report spec 2.2 ("Margin bands are configurable.
// margin_clear default 4, margin_narrow default 2") — selects which of the
// three Section 2.2 narrative variants prints under the dominance block.
const MARGIN_CLEAR = 4
const MARGIN_NARROW = 2

export function classifyGunaMargin(margin) {
  if (margin >= MARGIN_CLEAR) return 'CLEAR'
  if (margin >= MARGIN_NARROW) return 'NARROW'
  return 'SPREAD'
}

// Section 2.2 dominance-margin narrative. Returns null for CLEAR (the
// dominance block prints alone, nothing else) — a string otherwise,
// percentages and names substituted from the actual result.
export function buildOrientationMarginNote({ sattvaPct, rajasPct, tamasPct, sattvaCount, rajasCount, tamasCount }) {
  const pctByGuna = { SATTVA: sattvaPct, RAJAS: rajasPct, TAMAS: tamasPct }
  const countByGuna = { SATTVA: sattvaCount, RAJAS: rajasCount, TAMAS: tamasCount }
  const ranked = GUNA_ORDER.map((guna) => ({ guna, count: countByGuna[guna] })).sort((a, b) => b.count - a.count)
  const margin = ranked[0].count - ranked[1].count
  const band = classifyGunaMargin(margin)
  if (band === 'CLEAR') return null

  const top = ranked[0].guna
  const topName = GUNA_DOMINANCE_PROFILE[top].name

  if (band === 'NARROW') {
    const second = ranked[1].guna
    const secondName = GUNA_DOMINANCE_PROFILE[second].name
    return `${topName} is your strongest orientation at ${pctByGuna[top]} percent, though less pronounced than in many profiles. ${secondName} at ${pctByGuna[second]} percent is close enough that you will recognise parts of both.`
  }

  // SPREAD: name the other two in fixed Sattva/Rajas/Tamas order, matching
  // the report spec's own example ("...ahead at 33 percent, with drive at
  // 33 and reserve at 33").
  const others = GUNA_ORDER.filter((g) => g !== top)
  const othersText = others
    .map((g) => `${GUNA_DOMINANCE_PROFILE[g].name.toLowerCase()} at ${pctByGuna[g]}`)
    .join(' and ')
  return `Your responses spread fairly evenly. ${topName} came out marginally ahead at ${pctByGuna[top]} percent, with ${othersText} percent. What you work from is shaped more by the situation than by disposition, and the sections that follow will tell you more than this one.`
}

// Section 2.2 per-dominance description blocks (report spec, verbatim).
export const GUNA_DOMINANCE_PROFILE = {
  SATTVA: {
    name: 'Composure',
    heading: 'Composure dominant',
    whatThisLooksLike:
      'You work from a stable baseline. Things land without immediately producing a response, and you can hold a situation open without the discomfort of not knowing pushing you to close it. When the picture is clear you commit. What you resist is committing before it is.',
    whatItSupports:
      'Decisions where the obvious answer is wrong and the situation needs working through. Situations with several people whose interests differ. Anything that will be hard to reverse. You are also the person others orient around when something is going badly, which is a contribution you may not be aware you are making.',
    whereItCostsYou:
      'Where you are still weighing, others may be unable to move, and the delay becomes theirs rather than yours. Decisions with a closing window are the exposure, since the thinking that produces your better calls is the same thinking that can cost you the window.',
    howOthersMaySeeIt:
      'Colleagues moving faster may read the steadiness as a lack of urgency, or as reluctance to take a position.',
  },
  RAJAS: {
    name: 'Drive',
    heading: 'Drive dominant',
    whatThisLooksLike:
      'You work from an activated baseline. Work produces energy and a pull toward action, and waiting itself feels uncomfortable. You move toward situations rather than letting them resolve, and an open question sits badly until it is settled.',
    whatItSupports:
      'Momentum, particularly where someone has to commit before the picture is complete. Willingness to take a position while others are still weighing, which is often what allows a group to move at all. You break inertia, in yourself and in others.',
    whereItCostsYou:
      'The pace is not free. Sustained activation carries a personal cost that does not appear in your output, and it is usually visible to you before it is visible to anyone else. Decisions taken before the picture was complete also accumulate, and the ones that needed the extra day are rarely obvious at the time.',
    howOthersMaySeeIt:
      'Colleagues may read the energy as impatience and the readiness to commit as not having thought it through. Where you are moving faster than the situation needs, it can be hard for someone to raise a concern in time for it to matter.',
  },
  TAMAS: {
    name: 'Reserve',
    heading: 'Reserve dominant',
    whatThisLooksLike:
      'You work from a low activation baseline. Things register without producing much pull, and you put effort where it is needed rather than across the board. Where a situation is uncomfortable, your instinct is to step away from it rather than into it.',
    whatItSupports:
      'Distance. You are not caught up in situations the way others are, which lets you read them more clearly than people who are invested in the outcome.',
    whereItCostsYou:
      'The distance that helps you see clearly also keeps you out of situations that needed you in them. Decisions get made by time passing rather than by choice, and the cost of that is rarely visible at the moment it happens. What looks like restraint from the inside can be avoidance.',
    howOthersMaySeeIt:
      'Colleagues may read the low activation as disengagement and the selective effort as inconsistency. Where something needs someone to press, your default not to can leave it unaddressed. Worth asking whether this is how you usually are or how you are at the moment, since sustained load produces the same picture temporarily.',
  },
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

// Report spec's names for each capacity (section 3.1) — same wording as the
// frontend's DIMENSION_LABELS, kept here too since this is where the
// capacity-band report text (below) is keyed by dimension.
export const CAPACITY_NAME = {
  UPEKSHA: 'Emotional Balance',
  ANUVIGNA: 'Pressure Non-Reactivity',
  ANASAKTI: 'Detached Decision-Making',
  VIVEKA: 'Clarity in Complexity',
}

const DQI_BAND_HIGH = 75 // at or above -> ANCHORED
const DQI_BAND_LOW = 40 // below -> AT_RISK, else DEVELOPING
const DEFICIENCY_THRESHOLD_PCT = 67 // construct below this would receive a development plan
const CAPACITY_BAND_MID_FLOOR = 50 // below this -> LOW band for capacity-line text

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

// Section 3.2 DQI band callout (report spec, verbatim).
export const DQI_BAND_CALLOUT = {
  ANCHORED: {
    range: '75 to 100',
    headline: 'Your decisions hold their direction under pressure.',
    body:
      'Escalations and appreciations are weighed evenly. Being challenged in front of others or authority will not change your response. Your judgement stays independent of what you have already invested or already argued for. You can work in ambiguity for long to get the clarity in solution.',
  },
  DEVELOPING: {
    range: '40 to 74',
    headline: 'Some capacities hold, others bend.',
    body:
      'You may stay entirely steady under challenge and still find your decision bending toward something you committed to earlier. You may oscillate between staying strong in your decisions and letting an escalation impact the whole day. The capacity scores show which is which.',
  },
  AT_RISK: {
    range: '0 to 39',
    headline: 'Pressure is shaping your decisions, not the situation.',
    body:
      'Good and bad affects you in extremes. Challenge produces defence or withdrawal. What you have already committed to carries more weight than the evidence. Uncertainty closes early.',
  },
}

// Section 3.3 capacity lines — one per capacity, banded at 67 and 50
// (report spec, verbatim).
const CAPACITY_BAND_LINE = {
  UPEKSHA: {
    HIGH: 'Good news and bad news arriving together are weighted evenly. Neither distorts how you engage with the other.',
    MID: 'One tends to carry more weight than the other. A difficult message can colour how you take a good one, or a good one can soften how seriously you take the difficult one.',
    LOW: 'Gain and loss are weighted unevenly. Whatever arrives first sets the tone for what follows, and the second gets less of your attention than it needs.',
  },
  ANUVIGNA: {
    HIGH: 'Being challenged, interrupted or questioned in front of others does not decide your response. You engage with what was said rather than with the moment.',
    MID: 'Under direct challenge your response sometimes arrives before your assessment does. You stay professional, and the order of what you say shows the challenge landed first.',
    LOW: 'Being challenged publicly tends to produce defence or withdrawal rather than engagement. The reaction arrives faster than the thinking, and the response follows the reaction.',
  },
  ANASAKTI: {
    HIGH: "Your own prior recommendations and investments carry no extra weight. You read evidence about your own work the way you read evidence about anyone else's.",
    MID: 'Evidence that challenges something you argued for gets more scrutiny than evidence that supports it. The scrutiny is honest and it is not even.',
    LOW: 'What you have already committed to carries real weight in what you decide next. Reversing your own position, or letting go of credit you earned, is where judgement gives way.',
  },
  VIVEKA: {
    HIGH: 'You hold a position under pressure to close and stay in uncertainty long enough to reach a logical decision rather than a comfortable answer.',
    MID: 'Where a situation is ambiguous and someone is pushing for an answer, your judgement moves further than the evidence does.',
    LOW: 'Uncertainty closes early. The first workable reading tends to become the working one, particularly where holding out would cost you something socially.',
  },
}

export function classifyCapacityBand(pct) {
  if (pct >= DEFICIENCY_THRESHOLD_PCT) return 'HIGH'
  if (pct >= CAPACITY_BAND_MID_FLOOR) return 'MID'
  return 'LOW'
}

export function capacityLine(dimension, pct) {
  return CAPACITY_BAND_LINE[dimension][classifyCapacityBand(pct)]
}

// Section 5 — Development Focus. Builds the ordered list of capacities
// below 67 (ascending, lowest/most urgent first) plus the headline copy,
// which varies by how many capacities qualify (report spec, adapted to be
// grammatically correct for any count from 0-4 rather than hard-coding
// "two"/"three" as the spec's own examples happen to show).
const NUMBER_WORD = ['Zero', 'One', 'Two', 'Three', 'Four']

export function buildDevelopmentFocus(dimensionPct) {
  const below = DIMENSIONS
    .filter((dim) => dimensionPct[dim] < DEFICIENCY_THRESHOLD_PCT)
    .map((dim) => ({ dimension: dim, name: CAPACITY_NAME[dim], pct: dimensionPct[dim] }))
    .sort((a, b) => a.pct - b.pct)

  if (below.length === 0) {
    return {
      condition: 'NONE_BELOW',
      headline: 'All four capacities are holding.',
      body: 'All four capacities are holding. Nothing here needs building. What good work needs is upkeep, and a maintenance plan is what keeps it current.',
      items: [],
    }
  }

  if (below.length <= 2) {
    const n = below.length
    return {
      condition: 'SOME_BELOW',
      headline: `${NUMBER_WORD[n]} capacit${n === 1 ? 'y needs' : 'ies need'} attention${n > 1 ? ', in this order.' : '.'}`,
      body: 'The order follows the current scores. Starting with the lower one is not arbitrary. The second usually becomes easier once the first has moved.',
      items: below.map((item, i) => ({ ...item, rank: i + 1, startHere: false })),
    }
  }

  return {
    condition: 'MANY_BELOW',
    headline: `${NUMBER_WORD[below.length]} capacities need attention. Work them in sequence, not together.`,
    body: 'Three at once is not workable, and trying usually means none of them move. Each becomes more tractable once the one before it has shifted.',
    items: below.map((item, i) => ({ ...item, rank: i + 1, startHere: i === 0 })),
  }
}

// ---------------------------------------------------------------------------
// UVAA Pattern — Scoring Guide v5, section 4. Guna dominance crossed with
// the DQI band, nine cells, with a step-down rule: where two or more
// constructs sit below pattern_floor_pct (50), the pattern band used for
// classification steps down one level. The DQI score and DQI band as
// reported are never modified by this — only the pattern classification.
// Copy for each of the nine cells is the report spec's section 4.2, verbatim
// (three parts: description, what holds, development focus).
// ---------------------------------------------------------------------------
const PATTERN_FLOOR_PCT = 50
const PATTERN_STEPDOWN_COUNT = 2
const BAND_ORDER = ['ANCHORED', 'DEVELOPING', 'AT_RISK'] // best to worst

const UVAA_PATTERN_TABLE = {
  SATTVA: {
    ANCHORED: {
      label: 'Composed and steady',
      description:
        'Your composure and judgement both hold under pressure. The two are consistent and neither is being sustained by effort. Because the steadiness is how you are rather than something you are working at, it is unlikely to reduce under sustained demand. Decisions are thought through and they stay through even when the situation gets harder.',
      whatHolds: 'All four capacities. There is nothing here that needs building.',
      developmentFocus:
        'Your core orientation and your decision quality are both healthy. Nothing here needs building. Every good work needs is upkeep, so a maintenance plan is what fits.',
    },
    DEVELOPING: {
      label: 'Composed, decides unevenly',
      description:
        'You are steady by core orientation and your judgement holds in some situations and not others. The understanding is consistently there. What varies is whether it survives the particular kinds of pressure that catch you.',
      whatHolds: 'The composure is real and it is not being performed. That is the foundation the rest of the work builds on.',
      developmentFocus:
        'You already hold the understanding. What is inconsistent is whether it reaches when in need. So the development plan will focus on what you do when the pressure is live rather than in thinking about it differently.',
    },
    AT_RISK: {
      label: 'Composed but unanchored',
      description:
        'By core orientation, you are composed. However, under live pressure your judgement does not hold. This is the most consequential pattern and the least visible from outside, because the composure is real and nothing in how you come across signals that the judgement underneath is not following it.',
      whatHolds: 'Composure under load is present and it is not performance. The work is not building steadiness. It is connecting the steadiness you already have to the moment of decision.',
      developmentFocus:
        'The understanding is not reaching the decision. The work is entirely in what you do in the moment. The development plan will focus on sustained practice that builds the connection between the two.',
    },
  },
  RAJAS: {
    ANCHORED: {
      label: 'Driven by effort',
      description:
        'Your judgement holds under pressure, and what carries it is drive rather than settledness. This works, and it works at a cost that does not show up in the results. The output looks the same whether the steadiness is settled or worked for.',
      whatHolds: 'Decision quality across all four capacities. This is a genuinely effective profile and the results are not in question. The consideration is sustainability, not capability.',
      developmentFocus:
        'Nothing in your judgement needs building. What needs attention is what is carrying it. The work is in boundaries and in recovery, so that the effort holding this together does not become the thing that ends it.',
    },
    DEVELOPING: {
      label: 'Fast, skips the check',
      description:
        'You decide quickly and you are frequently right. Assessment and response arrive together rather than in sequence, which serves you well where the situation is familiar and less well where it is not. The step that would catch the exceptions is being passed.',
      whatHolds: 'Decisiveness, and the willingness to commit where others hesitate. This is not indecision and it should not be worked on as if it were.',
      developmentFocus:
        'The gap is the pause, not the judgement. The work is in building a deliberate check into decisions that are currently made at speed, and in recognising which situations warrant one.',
    },
    AT_RISK: {
      label: 'Activated and reactive',
      description:
        'Activation arrives before assessment does, and the response follows the activation. Under pressure your state is deciding rather than the situation, consistently enough to be a pattern rather than the occasional lapse.',
      whatHolds: 'There is engagement here. You do not withdraw, defer or absorb, and that is a real starting point. The energy is present and currently pointed at the wrong target.',
      developmentFocus:
        'Regulation comes first. Working on how you frame situations will not land while the reaction is still arriving ahead of the assessment, so the work starts with what happens in the moment.',
    },
  },
  TAMAS: {
    ANCHORED: {
      label: 'Reserved but steady',
      description:
        'Your judgement holds under pressure while your core orientation reads low on activation. This is an uncommon combination and an interesting one. You are not visibly working at it, and the decisions hold anyway. Where others are carried by their own energy or their own steadiness, you appear to be carried by neither, and the quality is there regardless. Most instruments would not pick this up at all.',
      whatHolds: 'All four capacities. Whatever is producing this is working, and it is not costing you the way effort-driven profiles cost their owners.',
      developmentFocus:
        'Nothing here needs building on the evidence. What is worth a conversation is what is actually carrying the judgement, since the assessment can see the result but not the mechanism. Your facilitator will be in touch to look at that with you.',
    },
    DEVELOPING: {
      label: 'Reserved, decides late',
      description:
        'Low activation is starting to reach your decisions, and the issue is when rather than whether. Commitment arrives later than the situation needs, often after the point where it would have counted for most.',
      whatHolds: 'Where you do decide, the decisions are sound. The judgement is there. What is inconsistent is the timing, which is a different problem and responds to different work.',
      developmentFocus:
        'The judgement is sound and the timing is not, which is a different problem and responds to different work. The focus is on engaging earlier, in what you do and in how you frame the decision to commit.',
    },
    AT_RISK: {
      label: 'Reserved and withdrawn',
      description:
        'Both how you operate and how your judgement holds point the same way. When pressure arrives the pattern is withdrawal, and the decision that needed making tends to get resolved by time passing rather than by a choice.',
      whatHolds: 'You are reading the situations accurately. Your sense of what is happening is intact, which is more than half of what most development work has to build.',
      developmentFocus:
        'Engagement comes first. The other work requires you to be present in the situation, so the focus is on what you do when pressure arrives, before anything else.',
    },
  },
}

/**
 * @param {{ dominance: 'SATTVA'|'RAJAS'|'TAMAS'|null, provisional: boolean } | null} guna -
 *   null when the Guna profiler hasn't been scored yet (partial profile).
 * @param {{ dqiBand: 'ANCHORED'|'DEVELOPING'|'AT_RISK', dimensionPct: Record<string, number> }} construct
 * @returns {{
 *   patternKey: string|null, label: string|null, description: string|null,
 *   whatHolds: string|null, developmentFocus: string|null,
 *   patternBand: string, steppedDown: boolean, provisional: boolean, partial: boolean,
 *   heldPattern: boolean,
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
      description: null,
      whatHolds: null,
      developmentFocus: null,
      patternBand,
      steppedDown,
      provisional: false,
      partial: true,
      heldPattern: false,
    }
  }

  const patternKey = `${guna.dominance}_${patternBand}`
  const cell = UVAA_PATTERN_TABLE[guna.dominance][patternBand]
  return {
    patternKey,
    label: cell.label,
    description: cell.description,
    whatHolds: cell.whatHolds,
    developmentFocus: cell.developmentFocus,
    patternBand,
    steppedDown,
    // dominance_provisional per the report spec's data table: facilitator
    // view only, does not affect the participant report's own rendering.
    provisional: guna.provisional,
    partial: false,
    // "Held pattern" (report spec rendering rules): Reserved but steady
    // (Tamas + Anchored) ends the participant report after section 3 — a
    // facilitator reviews this case rather than an automated plan printing.
    heldPattern: patternKey === 'TAMAS_ANCHORED',
  }
}
