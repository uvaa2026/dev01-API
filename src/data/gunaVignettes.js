// Server-side copy of the real UVAA/TPE Guna Profiler content — 15
// vignettes, extracted from
// UVAA_TPE_ScoringMaster_with_key_V2_Final_301026.docx ("Guna Profiler,
// 15 Vignettes" — V2 Final, 30 October 2026). Duplicated from
// uvaa-webapp/src/data/gunaVignettes.js rather than shared across
// packages — keep both in sync if a vignette or its guna/score ever
// changes (same convention as GUNA_VIGNETTE_IDS in lib/validation.js).
//
// Applied 2026-10-31: this is a full content revision over the prior
// UVAA_TPE_ScoringMaster_V6_170826.docx — all 15 vignettes were
// regenerated from the new document (title, prompt, and all three
// options' text/guna/score), not hand patched. `id` values were kept
// stable (same vignette-position slugs as before) even though several
// titles changed materially, so GUNA_VIGNETTE_IDS in lib/validation.js
// did not need to change and any already-submitted respondent's stored
// TPE score is unaffected — scoring happens once at submission time and
// is persisted (guna_responses table), not recomputed from this file on
// every read. The one exception is the admin "review answers" screen,
// which looks up vignette/option text live by id+key — for a respondent
// who submitted before this revision, it will now show the new option
// wording next to their historical choice, not the wording they actually
// saw. Each vignette has exactly one option scored Sattva=3, Rajas=2,
// Tamas=1, cross-checked programmatically against the source document.
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
    title: "Deciding with others affected",
    prompt: "You are about to commit to something that will affect several people around you. Someone who has done this before is nearby and free. You could also just go ahead.",
    options: [
      { key: "A", text: "You go ahead now. The checking can happen once it is moving.", guna: "RAJAS", score: 2 },
      { key: "B", text: "You go over first and set out what you are planning and why.", guna: "SATTVA", score: 3 },
      { key: "C", text: "You hold off deciding for now. Nothing is committed either way.", guna: "TAMAS", score: 1 },
    ],
  },
  {
    id: "now-or-later",
    title: "A closing window",
    prompt: "You are about to commit to an investment. The returns look uncertain, but the offer is attractive and the window closes this week.",
    options: [
      { key: "A", text: "You commit now. Offer looks good and the window matters.", guna: "RAJAS", score: 2 },
      { key: "B", text: "You commit without working it through, and it is done.", guna: "TAMAS", score: 1 },
      { key: "C", text: "You work out what it returns against what it costs.", guna: "SATTVA", score: 3 },
    ],
  },
  {
    id: "when-the-motivation-goes",
    title: "The energy has gone",
    prompt: "You started something six weeks ago and the enthusiasm with which you began has gone. Nobody would notice if you quietly let it drop.",
    options: [
      { key: "A", text: "You carry on at the same pace. The work is the same.", guna: "SATTVA", score: 3 },
      { key: "B", text: "You put it aside and start something that has more in it for you.", guna: "RAJAS", score: 2 },
      { key: "C", text: "You let it drop quietly. Nothing further is done on it at all.", guna: "TAMAS", score: 1 },
    ],
  },
  {
    id: "not-urgent-today",
    title: "Nothing turns on it today",
    prompt: "Something you are responsible for needs proper focus, but nothing turns on it today. Three other things on your list are easier and quicker to start.",
    options: [
      { key: "A", text: "You leave it until the pressure is on, then do it in one go.", guna: "RAJAS", score: 2 },
      { key: "B", text: "You do the other three instead. The rest of it can wait.", guna: "TAMAS", score: 1 },
      { key: "C", text: "You start it now, even a small part, so that it is moving.", guna: "SATTVA", score: 3 },
    ],
  },
  {
    id: "about-to-respond",
    title: "A few seconds to answer",
    prompt: "Someone has just said something you strongly disagree with. Others are present. Whatever you say next will land on them, and you have a few seconds.",
    options: [
      { key: "A", text: "You say what you think, and take the moment over how you put it.", guna: "SATTVA", score: 3 },
      { key: "B", text: "You say it plainly. How they take it is their own business.", guna: "RAJAS", score: 2 },
      { key: "C", text: "You let it go and say nothing. The friction is not worth it.", guna: "TAMAS", score: 1 },
    ],
  },
  {
    id: "you-have-it-now",
    title: "It has come through",
    prompt: "The thing you spent two years working toward has finally come through. It is the middle of an ordinary week and nobody has mentioned it since this morning.",
    options: [
      { key: "A", text: "You are already planning the next one before this has settled.", guna: "RAJAS", score: 2 },
      { key: "B", text: "You take time to get this in properly first. What is next can wait.", guna: "SATTVA", score: 3 },
      { key: "C", text: "You barely register it. The week goes on as the others did.", guna: "TAMAS", score: 1 },
    ],
  },
  {
    id: "harder-than-expected",
    title: "Harder than anyone thought",
    prompt: "You are halfway through something that has turned out much harder than anyone expected. Stepping away without blame is available to you.",
    options: [
      { key: "A", text: "You carry on with it at the same pace and see it through to the end.", guna: "SATTVA", score: 3 },
      { key: "B", text: "You step away from it. It is not working and forcing it rarely helps.", guna: "TAMAS", score: 1 },
      { key: "C", text: "You take it on at double the pace to get it behind you.", guna: "RAJAS", score: 2 },
    ],
  },
  {
    id: "it-went-wrong",
    title: "Asked what happened",
    prompt: "Something has gone badly wrong. Other people's choices contributed to it and so did two of your own. You are the one being asked what happened.",
    options: [
      { key: "A", text: "You put it down to bad luck. These things happen and there is nothing to learn. You put it down to bad luck and the matter is left there.", guna: "TAMAS", score: 1 },
      { key: "B", text: "You focus on what the others decided and yours too, in detail and at once.", guna: "RAJAS", score: 2 },
      { key: "C", text: "You look at the choices and consequences and present the learning ,", guna: "SATTVA", score: 3 },
    ],
  },
  {
    id: "something-disrupts-it",
    title: "At your expense",
    prompt: "Someone has been making remarks at your expense in front of others. Each one is framed as a joke and people laugh. It has been going on for weeks.",
    options: [
      { key: "A", text: "You start giving it back in the same register. It escalates quietly over a fortnight.", guna: "RAJAS", score: 2 },
      { key: "B", text: "You speak to them directly, say how it lands, and ask what can change.", guna: "SATTVA", score: 3 },
      { key: "C", text: "You say nothing each time. You take less part in those conversations.", guna: "TAMAS", score: 1 },
    ],
  },
  {
    id: "unexpected-time",
    title: "The afternoon is clear",
    prompt: "Something cancels and the rest of the day is suddenly clear. Nothing is expected of you until tomorrow.",
    options: [
      { key: "A", text: "You fill it with whatever is nearest to hand, and the time goes.", guna: "TAMAS", score: 1 },
      { key: "B", text: "You fill it with work you had not planned to do today.", guna: "RAJAS", score: 2 },
      { key: "C", text: "You use part of it on something you have been putting off.", guna: "SATTVA", score: 3 },
    ],
  },
  {
    id: "it-may-not-work",
    title: "It may not go your way",
    prompt: "You are partway through something where the outcome is genuinely uncertain. It may well not go your way, and that will not be down to anything you did.",
    options: [
      { key: "A", text: ". You ease off a little. No sense giving everything to something that may not land.", guna: "TAMAS", score: 1 },
      { key: "B", text: ". You do it as well as you can. The outcome is not yours to own.", guna: "SATTVA", score: 3 },
      { key: "C", text: "You put more into it than you planned to. Effort is the part you control.", guna: "RAJAS", score: 2 },
    ],
  },
  {
    id: "two-things-in-one-day",
    title: "Both in one afternoon",
    prompt: "Two things happen within a few hours. One is good and one is difficult. Neither is large enough that anyone else would remember it by Friday.",
    options: [
      { key: "A", text: "You take both in, and carry on much as you were before either arrived.", guna: "SATTVA", score: 3 },
      { key: "B", text: "The difficult one sets the tone and the rest of the day goes with it.", guna: "TAMAS", score: 1 },
      { key: "C", text: "You act on each one as it lands, and the day runs long.", guna: "RAJAS", score: 2 },
    ],
  },
  {
    id: "you-reached-it",
    title: "You have arrived",
    prompt: "You have achieved something you set out a long time ago to reach. It is done and it is yours.",
    options: [
      { key: "A", text: "You move on to whatever is next without marking it at all.", guna: "TAMAS", score: 1 },
      { key: "B", text: "You look around to see what others have managed to get", guna: "RAJAS", score: 2 },
      { key: "C", text: "You stop long enough to register that you have arrived somewhere.", guna: "SATTVA", score: 3 },
    ],
  },
  {
    id: "it-turned",
    title: "It used to be the best part",
    prompt: "Something that used to be the best part of your life has slowly become the part you dread. Nothing about it changed.",
    options: [
      { key: "A", text: "You look at it directly and decide whether it still belongs in your life.", guna: "SATTVA", score: 3 },
      { key: "B", text: "You carry on with it, without asking why you do.", guna: "TAMAS", score: 1 },
      { key: "C", text: "You hold onto it and put more in, to get back what it was.", guna: "RAJAS", score: 2 },
    ],
  },
  {
    id: "it-rises",
    title: "Nobody can tell",
    prompt: "Something rises in you sharply in the middle of a heated conversation. The people around you cannot tell it is happening.",
    options: [
      { key: "A", text: "You push it down and carry on. Going into it would help nobody.", guna: "TAMAS", score: 1 },
      { key: "B", text: "You let it be there, and carry on with the conversation as it was.", guna: "SATTVA", score: 3 },
      { key: "C", text: "You act on it while it is strong. Anything else would be pretending.", guna: "RAJAS", score: 2 },
    ],
  },
]
