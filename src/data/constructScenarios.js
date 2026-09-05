// Server-side copy of the Construct assessment (ECM module, "TCM" in
// product shorthand) — Stage 2 of the assessment. 32 scenarios, 8 per
// dimension across the 4 UVAA dimensions, mirroring the Guna profiler's
// 15/vertical-agnostic setup. Duplicated from
// uvaa-webapp/src/data/constructScenarios.js rather than shared across
// packages — keep both in sync if a scenario or its score ever changes
// (same convention as gunaVignettes.js).
//
// SAMPLE / PLACEHOLDER content. The FRD (FR-11/FR-11A) calls for a minimum
// 64 validated scenarios (32 IT + 32 Education, 8 per dimension per
// vertical) authored and scored by the UVAA framework developer — that
// scoring key is the product's core IP and isn't something to invent here.
// These 32 (IT vertical flavour, used for both verticals until an
// Education-specific bank exists) exist so the full assessment flow —
// navigation, save/resume, submission, scoring, admin review, report — is
// wired and testable end to end. Swap in the real scenario bank by
// replacing this file (and its frontend twin); lib/scoring.js only depends
// on the shape below (dimension, options[].score).
//
// This copy is what actually computes results: src/lib/scoring.js reads
// the `score` field to turn a respondent's option picks into the four
// construct subscales and the DQI (Scoring Guide v5, section 3). It's also
// what the admin "review answers" endpoint uses to show each scenario's
// situation and option text next to what the respondent chose.
//
// Per Scoring Guide v5 section 3.1, item scores are 1-3 (3 = Anchored,
// 2 = Reactive, 1 = Avoidant) — NOT 0-3. construct_raw sums 8 items per
// dimension to a range of 8-24; a 0 would break that floor. Score
// placement is not tied to a fixed letter — each scenario's options are in
// a different order, same as the real scoring key will be.
//
// The respondent-facing UI never sees `score` while answering — this file
// exists on the API only, not sent to the browser during the quiz itself.

export const DIMENSION_LABELS = {
  UPEKSHA: { name: 'Emotional Balance', sanskrit: 'Upeksha' },
  ANUVIGNA: { name: 'Pressure Non-Reactivity', sanskrit: 'Anuvigna' },
  ANASAKTI: { name: 'Detached Decision-Making', sanskrit: 'Anasakti' },
  VIVEKA: { name: 'Clarity in Complexity', sanskrit: 'Viveka' },
}

export const CONSTRUCT_SCENARIOS = [
  // ---------------------------------------------------------------- UPEKSHA
  {
    id: 'up-01',
    dimension: 'UPEKSHA',
    situation: 'A client you worked hard to win chooses a competitor at the final stage.',
    options: [
      { key: 'A', text: 'Note it, look for what’s transferable, and move to the next opportunity.', score: 3 },
      { key: 'B', text: 'Feel it sting for a while and quietly lower your expectations for the next pitch.', score: 1 },
      { key: 'C', text: 'Ask for one more conversation to try to change their mind.', score: 2 },
      { key: 'D', text: 'Stop investing effort in prospects until you’re sure they’ll convert.', score: 1 },
    ],
  },
  {
    id: 'up-02',
    dimension: 'UPEKSHA',
    situation: 'A feature you championed gets cut from the roadmap after a leadership review.',
    options: [
      { key: 'A', text: 'Push back hard in the next planning meeting to get it reinstated.', score: 2 },
      { key: 'B', text: 'Accept the call, archive the work cleanly, and ask what’s next.', score: 3 },
      { key: 'C', text: 'Quietly keep building it on the side, unconvinced by the decision.', score: 1 },
      { key: 'D', text: 'Ask for the reasoning, note it, and let it go.', score: 3 },
    ],
  },
  {
    id: 'up-03',
    dimension: 'UPEKSHA',
    situation: 'A quarter that started strong ends with the numbers well below target.',
    options: [
      { key: 'A', text: 'Pick apart what went wrong until it feels like your fault alone.', score: 1 },
      { key: 'B', text: 'Review it plainly — what held, what didn’t — and set the next quarter’s plan.', score: 3 },
      { key: 'C', text: 'Point to the external factors and move on without a real review.', score: 2 },
      { key: 'D', text: 'Play down the miss in the team update so morale doesn’t take a hit.', score: 2 },
    ],
  },
  {
    id: 'up-04',
    dimension: 'UPEKSHA',
    situation: 'A colleague you mentored gets the promotion you were also up for.',
    options: [
      { key: 'A', text: 'Congratulate them genuinely and ask your manager for direct feedback on your own case.', score: 3 },
      { key: 'B', text: 'Congratulate them, but pull back from mentoring so it doesn’t happen again.', score: 1 },
      { key: 'C', text: 'Feel flat about it for a while and let your output dip.', score: 1 },
      { key: 'D', text: 'Congratulate them and privately decide to look elsewhere.', score: 2 },
    ],
  },
  {
    id: 'up-05',
    dimension: 'UPEKSHA',
    situation: 'An investment you argued for internally pays off well beyond expectations.',
    options: [
      { key: 'A', text: 'Enjoy it, credit the people involved, and get back to the next problem.', score: 3 },
      { key: 'B', text: 'Start treating your judgement as unusually reliable going forward.', score: 1 },
      { key: 'C', text: 'Bring it up often as evidence you should have more say.', score: 2 },
      { key: 'D', text: 'Feel mild relief more than anything and move on quickly.', score: 2 },
    ],
  },
  {
    id: 'up-06',
    dimension: 'UPEKSHA',
    situation: 'A long-running project you led is shut down for reasons outside your control.',
    options: [
      { key: 'A', text: 'Take it personally and let it colour how you approach the next assignment.', score: 1 },
      { key: 'B', text: 'Document what was learned, thank the team, and transition cleanly.', score: 3 },
      { key: 'C', text: 'Push to keep a scaled-down version alive informally.', score: 2 },
      { key: 'D', text: 'Go quiet for a while and let others absorb the transition work.', score: 1 },
    ],
  },
  {
    id: 'up-07',
    dimension: 'UPEKSHA',
    situation: 'A performance review lands more critical than you expected, on a project you were proud of.',
    options: [
      { key: 'A', text: 'Get defensive in the moment and revisit it once you’ve cooled down.', score: 2 },
      { key: 'B', text: 'Hear it out fully, ask clarifying questions, and decide what to act on afterward.', score: 3 },
      { key: 'C', text: 'Agree with everything on the spot to end the conversation.', score: 1 },
      { key: 'D', text: 'Let it sit unaddressed and avoid bringing it up again.', score: 1 },
    ],
  },
  {
    id: 'up-08',
    dimension: 'UPEKSHA',
    situation: 'A budget you fought for gets approved in full, larger than you asked for.',
    options: [
      { key: 'A', text: 'Allocate it against the actual plan, not just because it’s available.', score: 3 },
      { key: 'B', text: 'Expand scope to use all of it, since it was granted.', score: 2 },
      { key: 'C', text: 'Sit on most of it in case it gets clawed back later.', score: 1 },
      { key: 'D', text: 'Treat the win as proof your next ask should be bigger too.', score: 2 },
    ],
  },

  // --------------------------------------------------------------- ANUVIGNA
  {
    id: 'an-01',
    dimension: 'ANUVIGNA',
    situation: 'Production goes down during a client demo you’re running.',
    options: [
      { key: 'A', text: 'Pause, acknowledge it to the room, and work the problem methodically.', score: 3 },
      { key: 'B', text: 'Scramble visibly, apologising repeatedly while trying fixes at random.', score: 1 },
      { key: 'C', text: 'Freeze for a moment, then hand it off to someone else entirely.', score: 1 },
      { key: 'D', text: 'Stay calm outwardly but rush the fix without checking root cause.', score: 2 },
    ],
  },
  {
    id: 'an-02',
    dimension: 'ANUVIGNA',
    situation: 'You get a terse, urgent message from a senior stakeholder mid-sprint demanding an immediate call.',
    options: [
      { key: 'A', text: 'Reply immediately, dropping everything, visibly rattled on the call.', score: 1 },
      { key: 'B', text: 'Take a beat, gather context, then respond with a clear time to talk.', score: 3 },
      { key: 'C', text: 'Delay responding until the urgency passes on its own.', score: 1 },
      { key: 'D', text: 'Respond right away but stay measured on the call itself.', score: 2 },
    ],
  },
  {
    id: 'an-03',
    dimension: 'ANUVIGNA',
    situation: 'A teammate publicly disagrees with your approach in front of the wider team.',
    options: [
      { key: 'A', text: 'Cut them off and defend your position immediately.', score: 1 },
      { key: 'B', text: 'Hear the objection out, respond to the substance, and take detail offline if needed.', score: 3 },
      { key: 'C', text: 'Agree on the spot just to defuse the tension.', score: 2 },
      { key: 'D', text: 'Go quiet in the meeting and raise it with them privately afterward.', score: 2 },
    ],
  },
  {
    id: 'an-04',
    dimension: 'ANUVIGNA',
    situation: 'A deadline moves up by a week with no change to scope.',
    options: [
      { key: 'A', text: 'Assess what’s actually achievable and negotiate scope or the date explicitly.', score: 3 },
      { key: 'B', text: 'Agree to it under pressure and figure out the cost later.', score: 2 },
      { key: 'C', text: 'Push the team harder without changing the plan.', score: 1 },
      { key: 'D', text: 'Quietly slip the internal date and hope no one notices until it’s due.', score: 1 },
    ],
  },
  {
    id: 'an-05',
    dimension: 'ANUVIGNA',
    situation: 'A key vendor cancels a commitment two days before you need it.',
    options: [
      { key: 'A', text: 'Escalate loudly and demand an explanation before doing anything else.', score: 1 },
      { key: 'B', text: 'Work the alternatives calmly while keeping stakeholders informed.', score: 3 },
      { key: 'C', text: 'Wait to see if they change their mind before acting.', score: 1 },
      { key: 'D', text: 'Start a fallback plan but skip informing anyone until it’s resolved.', score: 2 },
    ],
  },
  {
    id: 'an-06',
    dimension: 'ANUVIGNA',
    situation: 'You’re paged at 2am for a critical incident affecting customers.',
    options: [
      { key: 'A', text: 'Get up, orient quickly, and work the incident to a stable state before sleeping.', score: 3 },
      { key: 'B', text: 'Silence the alert and deal with it properly in the morning.', score: 1 },
      { key: 'C', text: 'Respond immediately but make hasty changes without checking impact.', score: 2 },
      { key: 'D', text: 'Wake up several other people before you’ve assessed anything yourself.', score: 2 },
    ],
  },
  {
    id: 'an-07',
    dimension: 'ANUVIGNA',
    situation: 'A leadership town hall Q&A puts you on the spot with a question you weren’t prepared for.',
    options: [
      { key: 'A', text: 'Answer confidently with whatever comes to mind first.', score: 2 },
      { key: 'B', text: 'Give an honest, considered answer, including what you don’t yet know.', score: 3 },
      { key: 'C', text: 'Deflect the question to avoid looking unprepared.', score: 1 },
      { key: 'D', text: 'Visibly struggle and let the moment run long.', score: 1 },
    ],
  },
  {
    id: 'an-08',
    dimension: 'ANUVIGNA',
    situation: 'Two team members escalate a heated disagreement to you at the same time, both wanting an immediate ruling.',
    options: [
      { key: 'A', text: 'Rule quickly in favour of whoever raised it first.', score: 1 },
      { key: 'B', text: 'Hear both sides properly before deciding, even if it takes a little longer.', score: 3 },
      { key: 'C', text: 'Avoid ruling at all and let them work it out themselves.', score: 1 },
      { key: 'D', text: 'Make a fast call under the pressure of both of them waiting.', score: 2 },
    ],
  },

  // -------------------------------------------------------------- ANASAKTI
  {
    id: 'ak-01',
    dimension: 'ANASAKTI',
    situation: 'A tool your team built in-house is clearly outperformed by a new vendor option.',
    options: [
      { key: 'A', text: 'Recommend switching, despite the time your team invested building it.', score: 3 },
      { key: 'B', text: 'Advocate for keeping the in-house tool since so much effort already went in.', score: 1 },
      { key: 'C', text: 'Suggest a slow transition, mostly to avoid the sunk-cost conversation.', score: 2 },
      { key: 'D', text: 'Compare both fairly, but lean toward keeping what’s familiar.', score: 2 },
    ],
  },
  {
    id: 'ak-02',
    dimension: 'ANASAKTI',
    situation: 'Your original project plan no longer fits new information that’s come in.',
    options: [
      { key: 'A', text: 'Keep executing the original plan since it’s already approved and underway.', score: 1 },
      { key: 'B', text: 'Revise the plan to fit the new information, even though it means rework.', score: 3 },
      { key: 'C', text: 'Adjust a few details but largely stay the course.', score: 2 },
      { key: 'D', text: 'Flag the mismatch but wait for someone else to decide on a change.', score: 2 },
    ],
  },
  {
    id: 'ak-03',
    dimension: 'ANASAKTI',
    situation: 'A design pattern you personally created becomes the team standard, and a new hire proposes replacing it.',
    options: [
      { key: 'A', text: 'Evaluate their proposal on its merits, separate from who authored it.', score: 3 },
      { key: 'B', text: 'Find reasons the existing pattern is still better without examining the new one closely.', score: 1 },
      { key: 'C', text: 'Agree to a trial, while quietly hoping it fails.', score: 1 },
      { key: 'D', text: 'Defer the decision to committee to avoid being seen as protecting your own work.', score: 2 },
    ],
  },
  {
    id: 'ak-04',
    dimension: 'ANASAKTI',
    situation: 'Your name is on a strategy document that later proves to need major revision.',
    options: [
      { key: 'A', text: 'Lead the revision yourself and put your name on the update too.', score: 3 },
      { key: 'B', text: 'Resist changes that would make the original look wrong.', score: 1 },
      { key: 'C', text: 'Let someone else revise it so it’s not visibly your correction.', score: 2 },
      { key: 'D', text: 'Quietly agree changes are needed but delay acting on them.', score: 2 },
    ],
  },
  {
    id: 'ak-05',
    dimension: 'ANASAKTI',
    situation: 'A hiring decision you pushed for turns out not to be working six months in.',
    options: [
      { key: 'A', text: 'Avoid addressing it directly since it would mean admitting the call was wrong.', score: 1 },
      { key: 'B', text: 'Assess it honestly and act on what the situation actually needs now.', score: 3 },
      { key: 'C', text: 'Give it more time than the evidence supports, hoping it turns around.', score: 2 },
      { key: 'D', text: 'Quietly blame the process rather than the decision itself.', score: 2 },
    ],
  },
  {
    id: 'ak-06',
    dimension: 'ANASAKTI',
    situation: 'A process you designed is slowing the team down as it has grown.',
    options: [
      { key: 'A', text: 'Ask the team directly what isn’t working and redesign it with them.', score: 3 },
      { key: 'B', text: 'Explain why the process is necessary rather than reconsidering it.', score: 1 },
      { key: 'C', text: 'Make small tweaks that avoid touching the core of what you built.', score: 2 },
      { key: 'D', text: 'Let people quietly work around it rather than change it formally.', score: 2 },
    ],
  },
  {
    id: 'ak-07',
    dimension: 'ANASAKTI',
    situation: 'A competitor ships something similar to an idea you’d been sitting on, unannounced, for a year.',
    options: [
      { key: 'A', text: 'Reassess quickly — what’s still worth building, and what’s no longer the right bet.', score: 3 },
      { key: 'B', text: 'Rush to ship your version largely unchanged, just to not be seen as second.', score: 2 },
      { key: 'C', text: 'Keep it shelved rather than confront that the window may have moved.', score: 1 },
      { key: 'D', text: 'Downplay the competitor’s version instead of evaluating it honestly.', score: 1 },
    ],
  },
  {
    id: 'ak-08',
    dimension: 'ANASAKTI',
    situation: 'You’re asked to hand off a project you’ve owned for two years to someone else.',
    options: [
      { key: 'A', text: 'Hand it off with a real transition — context, risks, and honest advice.', score: 3 },
      { key: 'B', text: 'Withhold context so the transition is harder without you.', score: 1 },
      { key: 'C', text: 'Stay involved unofficially well past the handoff.', score: 2 },
      { key: 'D', text: 'Hand it off but disengage completely, offering nothing beyond the minimum.', score: 2 },
    ],
  },

  // ---------------------------------------------------------------- VIVEKA
  {
    id: 'vk-01',
    dimension: 'VIVEKA',
    situation: 'Two credible teammates give you conflicting advice on how to proceed.',
    options: [
      { key: 'A', text: 'Pick whichever opinion came from the more senior person.', score: 1 },
      { key: 'B', text: 'Weigh both against the actual goal and decide on that basis.', score: 3 },
      { key: 'C', text: 'Delay deciding until a third opinion resolves the conflict.', score: 1 },
      { key: 'D', text: 'Blend both approaches without fully resolving the tension between them.', score: 2 },
    ],
  },
  {
    id: 'vk-02',
    dimension: 'VIVEKA',
    situation: 'Requirements for a project remain genuinely ambiguous a week before a milestone.',
    options: [
      { key: 'A', text: 'Make a reasonable working assumption, state it clearly, and proceed.', score: 3 },
      { key: 'B', text: 'Wait for full clarity before doing any further work.', score: 1 },
      { key: 'C', text: 'Proceed on your best guess without flagging the assumption to anyone.', score: 2 },
      { key: 'D', text: 'Ask a clarifying question, then proceed cautiously once you get a partial answer.', score: 2 },
    ],
  },
  {
    id: 'vk-03',
    dimension: 'VIVEKA',
    situation: 'A dataset you’re relying on for a decision has some inconsistencies you can’t fully explain.',
    options: [
      { key: 'A', text: 'Investigate enough to understand the risk, then decide with that caveat stated.', score: 3 },
      { key: 'B', text: 'Ignore the inconsistencies and proceed as if the data were clean.', score: 1 },
      { key: 'C', text: 'Refuse to decide anything until the data is perfectly resolved.', score: 1 },
      { key: 'D', text: 'Quietly adjust the numbers to something that feels more sensible.', score: 2 },
    ],
  },
  {
    id: 'vk-04',
    dimension: 'VIVEKA',
    situation: 'A new regulation is announced with guidance that is still being finalised.',
    options: [
      { key: 'A', text: 'Freeze all related work until the final guidance is published.', score: 1 },
      { key: 'B', text: 'Build toward the most likely reading, with a clear plan to adjust if it lands differently.', score: 3 },
      { key: 'C', text: 'Guess at compliance without tracking what might change.', score: 2 },
      { key: 'D', text: 'Assign someone to monitor it, but take no position yourself in the meantime.', score: 2 },
    ],
  },
  {
    id: 'vk-05',
    dimension: 'VIVEKA',
    situation: 'A postmortem surfaces three plausible root causes for an outage, with no single clear answer.',
    options: [
      { key: 'A', text: 'Pick the most convenient explanation to close the postmortem quickly.', score: 1 },
      { key: 'B', text: 'Address all three with proportional mitigations rather than forcing one answer.', score: 3 },
      { key: 'C', text: 'Assign blame to whichever cause is easiest to act on.', score: 2 },
      { key: 'D', text: 'Leave the postmortem open indefinitely until certainty is reached.', score: 2 },
    ],
  },
  {
    id: 'vk-06',
    dimension: 'VIVEKA',
    situation: 'A candidate interviews brilliantly but their references are lukewarm and hard to interpret.',
    options: [
      { key: 'A', text: 'Weigh the full picture, probe the gap directly, and decide with that in view.', score: 3 },
      { key: 'B', text: 'Go with the interview performance and discount the references.', score: 2 },
      { key: 'C', text: 'Reject based on the references alone without further inquiry.', score: 2 },
      { key: 'D', text: 'Ask someone else to make the call since it’s not clear-cut.', score: 1 },
    ],
  },
  {
    id: 'vk-07',
    dimension: 'VIVEKA',
    situation: 'Market signals are mixed heading into a decision about whether to expand into a new segment.',
    options: [
      { key: 'A', text: 'Commit fully based on the most optimistic signal alone.', score: 2 },
      { key: 'B', text: 'Design a staged entry that lets the evidence firm up before full commitment.', score: 3 },
      { key: 'C', text: 'Shelve the decision indefinitely until the signals agree.', score: 1 },
      { key: 'D', text: 'Let the loudest internal voice settle it rather than the evidence.', score: 1 },
    ],
  },
  {
    id: 'vk-08',
    dimension: 'VIVEKA',
    situation: 'A proposal you’re reviewing has a compelling headline number built on assumptions you haven’t verified.',
    options: [
      { key: 'A', text: 'Approve it — the headline number is convincing enough on its own.', score: 1 },
      { key: 'B', text: 'Trace the assumptions before forming a view on the number.', score: 3 },
      { key: 'C', text: 'Reject it outright because you don’t have time to check it properly.', score: 2 },
      { key: 'D', text: 'Approve it with a vague caveat, without actually checking anything.', score: 2 },
    ],
  },
]
