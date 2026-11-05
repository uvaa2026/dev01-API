// Selects which of the three Construct/ECM 32-scenario content sets a
// respondent should see and be scored against, based on their registration
// answer to "what do you lead?" (respondents.leadership_scope).
//
// TEAM is both the literal value for "Leading a team" and the fallback for
// any respondent with no leadership_scope on record — every respondent
// registered before this question existed (migration 024) has
// leadership_scope IS NULL, and they get exactly the scenario content they
// would have gotten before this change: constructScenarios.js, unchanged.
//
// Used by lib/scoring.js (computeConstruct) to pick the right scenario-by-id
// map for deriving a submitted answer's score, and by routes/assessment.js
// to resolve a respondent's variant before scoring their submission. The
// frontend (uvaa-webapp) has a byte-identical copy of this file for the
// same purpose on the serving/UI side — keep both in sync if a variant is
// ever added, removed, or renamed.

import { CONSTRUCT_SCENARIOS } from './constructScenarios.js'
import { CONSTRUCT_SCENARIOS_FUNCTION } from './constructScenariosFunction.js'
import { CONSTRUCT_SCENARIOS_BUSINESS_UNIT } from './constructScenariosBusinessUnit.js'

export const LEADERSHIP_SCOPES = ['TEAM', 'FUNCTION', 'BUSINESS_UNIT']

export const DEFAULT_LEADERSHIP_SCOPE = 'TEAM'

export const CONSTRUCT_SCENARIOS_BY_SCOPE = {
  TEAM: CONSTRUCT_SCENARIOS,
  FUNCTION: CONSTRUCT_SCENARIOS_FUNCTION,
  BUSINESS_UNIT: CONSTRUCT_SCENARIOS_BUSINESS_UNIT,
}

// `scope` is typically a respondent's leadership_scope column value, which
// may be null/undefined (pre-migration-024 respondents, or an unrecognised
// value) — always falls back to the TEAM content rather than throwing.
export function getConstructScenarios(scope) {
  return CONSTRUCT_SCENARIOS_BY_SCOPE[scope] || CONSTRUCT_SCENARIOS
}
