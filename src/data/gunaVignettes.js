// Server-side copy of the real UVAA/TPE Guna Profiler content — 15
// vignettes, extracted from UVAA_TPE_ScoringMaster_V6_170826.docx. Each
// vignette has exactly one option scored Sattva=3, Rajas=2, Tamas=1
// (scoring master V6). Duplicated from
// uvaa-webapp/src/data/gunaVignettes.js rather than shared across
// packages — keep both in sync if a vignette or its guna/score ever
// changes (same convention as GUNA_VIGNETTE_IDS in lib/validation.js).
//
// This copy is what actually computes results: src/lib/scoring.js reads
// the `guna`/`score` fields to turn a respondent's option picks into a
// TPE dominance + index (Scoring Guide v5, section 2). It's also what the
// admin "review answers" endpoint uses to show each vignette's prompt and
// option text next to what the respondent chose.
//
// The respondent-facing UI never sees `guna`/`score` while answering —
// this file exists on the API only, not sent to the browser during the
// quiz itself.
export const GUNA_VIGNETTES = [
  {
    id: "before-you-commit",
    title: "Before You Commit",
    prompt: "You are about to commit to something that will affect the people around you. Someone who has done this before is available to talk to. You could also just proceed.",
    options: [
      { key: "A", text: "You ask them first and say openly what you are planning and why.", guna: "SATTVA", score: 3 },
      { key: "B", text: "You go ahead. You have thought it through and checking would only slow it down.", guna: "RAJAS", score: 2 },
      { key: "C", text: "You put the decision off. You would rather not commit until it feels certain.", guna: "TAMAS", score: 1 },
    ],
  },
  {
    id: "now-or-later",
    title: "Now or Later",
    prompt: "Something you want is available now. Taking it means a cost later, one you can see clearly but cannot yet feel.",
    options: [
      { key: "A", text: "You take it because deciding not to would take more effort than taking it.", guna: "TAMAS", score: 1 },
      { key: "B", text: "You weigh what it actually costs later, then decide either way.", guna: "SATTVA", score: 3 },
      { key: "C", text: "You take it, and tell yourself you will offset the cost somehow when it arrives.", guna: "RAJAS", score: 2 },
    ],
  },
  {
    id: "when-the-motivation-goes",
    title: "When the Motivation Goes",
    prompt: "You committed to something weeks ago. The energy that started it has gone. Nobody would notice if you quietly stopped now.",
    options: [
      { key: "A", text: "You wait until you feel like it again, then pick it back up with energy.", guna: "RAJAS", score: 2 },
      { key: "B", text: "You stop for now. You are not feeling it and forcing yourself rarely works.", guna: "TAMAS", score: 1 },
      { key: "C", text: "You keep going because you said you would, whatever the feeling is.", guna: "SATTVA", score: 3 },
    ],
  },
  {
    id: "not-urgent-today",
    title: "Not Urgent Today",
    prompt: "Something you are responsible for needs doing. It is not urgent today. Easier and more enjoyable things are available to you.",
    options: [
      { key: "A", text: "You do the easier things instead. It will still be sitting there tomorrow.", guna: "TAMAS", score: 1 },
      { key: "B", text: "You start it now, even a small part, so that it is moving.", guna: "SATTVA", score: 3 },
      { key: "C", text: "You do it once it becomes urgent. You work better under pressure anyway.", guna: "RAJAS", score: 2 },
    ],
  },
  {
    id: "about-to-respond",
    title: "About to Respond",
    prompt: "You strongly disagree with what someone has just said and you are about to reply. What you say will land on them.",
    options: [
      { key: "A", text: "You say it plainly. How they choose to take it is not your responsibility.", guna: "RAJAS", score: 2 },
      { key: "B", text: "You say nothing at all. It is not worth the friction it would cause.", guna: "TAMAS", score: 1 },
      { key: "C", text: "You say what you think, and take a moment over how to say it.", guna: "SATTVA", score: 3 },
    ],
  },
  {
    id: "you-have-it-now",
    title: "You Have It Now",
    prompt: "Something you wanted for a long time has arrived. You have it.",
    options: [
      { key: "A", text: "You take it in properly before moving on to whatever comes next.", guna: "SATTVA", score: 3 },
      { key: "B", text: "You are already thinking about the next thing before this one has settled.", guna: "RAJAS", score: 2 },
      { key: "C", text: "You barely register it at all. It was never really the point anyway.", guna: "TAMAS", score: 1 },
    ],
  },
  {
    id: "harder-than-expected",
    title: "Harder Than Expected",
    prompt: "You are partway through something that has turned out much harder than you expected. Stopping is available and nobody would hold it against you.",
    options: [
      { key: "A", text: "You look for something else to move to that would feel more productive.", guna: "RAJAS", score: 2 },
      { key: "B", text: "You stop. It is not working and there is no point forcing it.", guna: "TAMAS", score: 1 },
      { key: "C", text: "You keep going. You said you would and the difficulty does not change it.", guna: "SATTVA", score: 3 },
    ],
  },
  {
    id: "it-went-wrong",
    title: "It Went Wrong",
    prompt: "Something has gone wrong for you. Other people's decisions contributed to it. So did some of your own.",
    options: [
      { key: "A", text: "You look at your own part first, then theirs, and act on what you can.", guna: "SATTVA", score: 3 },
      { key: "B", text: "You focus on what the others did. That is where most of it sits.", guna: "RAJAS", score: 2 },
      { key: "C", text: "You accept it as bad luck. These things happen and there is nothing to learn.", guna: "TAMAS", score: 1 },
    ],
  },
  {
    id: "something-disrupts-it",
    title: "Something Disrupts It",
    prompt: "Something unexpected has disrupted your plans for the week. It is nobody's fault in particular.",
    options: [
      { key: "A", text: "You go straight to worrying about what else is likely to go wrong.", guna: "TAMAS", score: 1 },
      { key: "B", text: "You feel the reaction rise, notice it, and then work out what to do.", guna: "SATTVA", score: 3 },
      { key: "C", text: "You feel it as a wave of irritation that takes some time to pass.", guna: "RAJAS", score: 2 },
    ],
  },
  {
    id: "unexpected-time",
    title: "Unexpected Time",
    prompt: "An unexpected stretch of free time opens up. Nothing at all is required of you.",
    options: [
      { key: "A", text: "You use some of it to sit with something you have been avoiding.", guna: "SATTVA", score: 3 },
      { key: "B", text: "You fill it with something productive. There is always more to get done.", guna: "RAJAS", score: 2 },
      { key: "C", text: "You fill it with whatever is easiest to hand, and the time goes.", guna: "TAMAS", score: 1 },
    ],
  },
  {
    id: "it-may-not-work",
    title: "It May Not Work",
    prompt: "You are partway through something where the outcome is genuinely uncertain and may well not go your way.",
    options: [
      { key: "A", text: "You ease off. There is no sense putting everything into something that may not land.", guna: "TAMAS", score: 1 },
      { key: "B", text: "You do it as well as you can and let the outcome be what it is.", guna: "SATTVA", score: 3 },
      { key: "C", text: "You push harder, because the uncertainty makes the result matter more to you.", guna: "RAJAS", score: 2 },
    ],
  },
  {
    id: "two-things-in-one-day",
    title: "Two Things in One Day",
    prompt: "Two things happen in the same day. One good, one difficult. Neither of them is major.",
    options: [
      { key: "A", text: "You feel both strongly, one after the other, and are tired by the evening.", guna: "RAJAS", score: 2 },
      { key: "B", text: "The difficult one stays with you and colours the whole rest of the day.", guna: "TAMAS", score: 1 },
      { key: "C", text: "You take both in, and neither pulls you far from where you were.", guna: "SATTVA", score: 3 },
    ],
  },
  {
    id: "you-reached-it",
    title: "You Reached It",
    prompt: "You have reached something you set out some time ago to reach.",
    options: [
      { key: "A", text: "You start comparing it to what the others around you have managed to get.", guna: "TAMAS", score: 1 },
      { key: "B", text: "You stop long enough to register having arrived where you aimed.", guna: "SATTVA", score: 3 },
      { key: "C", text: "You set the next target almost immediately and start working on it.", guna: "RAJAS", score: 2 },
    ],
  },
  {
    id: "it-turned",
    title: "It Turned",
    prompt: "Something that once brought you real pleasure has started to feel like a burden.",
    options: [
      { key: "A", text: "You hold onto it. It meant something once and letting go would be a loss.", guna: "RAJAS", score: 2 },
      { key: "B", text: "You keep it going out of habit, without ever examining why you still do.", guna: "TAMAS", score: 1 },
      { key: "C", text: "You look at it clearly and decide whether it still belongs in your life.", guna: "SATTVA", score: 3 },
    ],
  },
  {
    id: "it-rises",
    title: "It Rises",
    prompt: "A strong feeling rises in you, anger or craving or hurt. Nobody around you knows it is happening.",
    options: [
      { key: "A", text: "You notice it, let it be there, and choose what you do next.", guna: "SATTVA", score: 3 },
      { key: "B", text: "You act on it while it is strong. It is honest and it is what you feel.", guna: "RAJAS", score: 2 },
      { key: "C", text: "You push it down and carry on. Feeling it would not help you anything.", guna: "TAMAS", score: 1 },
    ],
  },
]

export const TOTAL_GUNA_QUESTIONS = GUNA_VIGNETTES.length
// Kept for a future results UI — not used anywhere today since scoring is
// deliberately deferred (see the note at the top of this file).
export const GUNA_LABELS = {
  SATTVA: {
    title: 'Sattva Dominant',
    description: 'Tends to meet pressure with balance — steady, clear-headed, and quick to reorient toward what’s next.',
  },
  RAJAS: {
    title: 'Rajas Dominant',
    description: 'Tends to meet pressure with drive and urgency — energised to act, though it can tip into restlessness or reactivity.',
  },
  TAMAS: {
    title: 'Tamas Dominant',
    description: 'Tends to meet pressure by withdrawing — pausing, avoiding, or disengaging until the pressure eases on its own.',
  },
}
