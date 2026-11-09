// Real UVAA/TPE Guna Profiler content — 15 vignettes, extracted from
// UVAA_TPE_15_081126_Final4upload.docx ("Core Orientation, 15 Vignettes" —
// for upload, 8 November 2026 — Indian Patent Application No. 202641076718,
// Publication No. 27/2026).
//
// Applied 2026-11-09: full content revision over the prior
// UVAA_TPE_ScoringMaster_with_key_V2_Final_301026.docx-sourced content —
// every vignette's title/prompt/options was regenerated from this new
// document, not hand patched. `id` values were kept stable (same
// vignette-position slugs as before) even though most titles/prompts/option
// wording changed, so GUNA_VIGNETTE_IDS in uvaa-api/src/lib/validation.js
// did not need to change. Each vignette has exactly one option scored
// Sattva=3, Rajas=2, Tamas=1, cross-checked programmatically against the
// source document.
//
// Scoring (kept here for when a scoring pass is built — nothing in the UI
// computes or shows this today; answers are stored raw and scored later):
//   TPE_raw   = sum of the 15 selected option scores        range 15-45
//   TPE_index = ((TPE_raw - 15) / 30) * 100                 range 0-100
//
// Deliberately never shows `guna` or `score` to the respondent while they
// answer — the FRD requires responses to stay unprimed by the framework.
// This file is backend-only: GunaProfiler.jsx no longer imports it directly
// — it fetches question content (no guna/score) from GET
// /assessment/guna/content, which strips those fields server-side via
// lib/scoring.js's getGunaContent(). Scoring is computed once at submission
// time and persisted — a respondent who already submitted under the prior
// content keeps their original score; this change only affects respondents
// who submit from this point on.

export const GUNA_VIGNETTES = [
  {
    id: "before-you-commit",
    title: "Deciding with others affected",
    prompt: "You are about to commit to something that will affect several people around you. Someone who has done this before is nearby and free. You could also just go ahead.",
    options: [
      { key: "A", text: "You go ahead now. The checking can happen once it is moving.", guna: "RAJAS", score: 2 },
      { key: "B", text: "You go over first and set out what you are planning.", guna: "SATTVA", score: 3 },
      { key: "C", text: "You hold off deciding for now. Nothing is committed either way.", guna: "TAMAS", score: 1 },
    ],
  },
  {
    id: "now-or-later",
    title: "A closing window",
    prompt: "You are about to commit to an investment. The returns look uncertain, but the offer is attractive and the window closes this week.",
    options: [
      { key: "A", text: "You commit now, while the window is still open to you.", guna: "RAJAS", score: 2 },
      { key: "B", text: "You let the window close. Nothing is decided either way.", guna: "TAMAS", score: 1 },
      { key: "C", text: "You work it through properly, and the evening goes on that.", guna: "SATTVA", score: 3 },
    ],
  },
  {
    id: "when-the-motivation-goes",
    title: "The energy has gone",
    prompt: "You started something six weeks ago and the energy with which you began has gone. Nobody would notice if you quietly let it drop.",
    options: [
      { key: "A", text: "You carry on at the same pace, whether the energy is there or not.", guna: "SATTVA", score: 3 },
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
      { key: "B", text: "You take it in properly first, before what is next.", guna: "SATTVA", score: 3 },
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
      { key: "A", text: "You put it down to bad luck. These things happen and there is nothing to learn.", guna: "TAMAS", score: 1 },
      { key: "B", text: "You focus on what the others decided, in detail and at once.", guna: "RAJAS", score: 2 },
      { key: "C", text: "You look at what happened and set out all of it, your own part included.", guna: "SATTVA", score: 3 },
    ],
  },
  {
    id: "something-disrupts-it",
    title: "At your expense",
    prompt: "Someone you see regularly has been making remarks at your expense in front of others. Each one is framed as a joke and people laugh. It has been going on for weeks.",
    options: [
      { key: "A", text: "You start giving it back in the same register. It escalates quietly over a fortnight.", guna: "RAJAS", score: 2 },
      { key: "B", text: "You speak to them directly and say how it lands.", guna: "SATTVA", score: 3 },
      { key: "C", text: "You say nothing each time. You take less part in those conversations.", guna: "TAMAS", score: 1 },
    ],
  },
  {
    id: "unexpected-time",
    title: "The afternoon is clear",
    prompt: "Something cancels and the rest of the day is suddenly clear. Nothing is expected of you until tomorrow.",
    options: [
      { key: "A", text: "You fill it with whatever is nearest to hand, and the time goes.", guna: "TAMAS", score: 1 },
      { key: "B", text: "You fill all of it with work you had not planned to do today.", guna: "RAJAS", score: 2 },
      { key: "C", text: "You use part of it on something you have been putting off for a while.", guna: "SATTVA", score: 3 },
    ],
  },
  {
    id: "it-may-not-work",
    title: "It may not go your way",
    prompt: "You are partway through something where the outcome is genuinely uncertain. It may well not go your way, and that will not be down to anything you did.",
    options: [
      { key: "A", text: "You ease off a little. No sense giving everything to something that may not land.", guna: "TAMAS", score: 1 },
      { key: "B", text: "You do it as well as you can, whatever the outcome.", guna: "SATTVA", score: 3 },
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
      { key: "B", text: "You look around to see what others have managed to get for themselves.", guna: "RAJAS", score: 2 },
      { key: "C", text: "You stop long enough to register you have arrived.", guna: "SATTVA", score: 3 },
    ],
  },
  {
    id: "it-turned",
    title: "It used to be the best part",
    prompt: "Something that used to be the best part of your life has slowly become the part you dread. Nothing about it changed.",
    options: [
      { key: "A", text: "You look at it directly and decide whether it still belongs in your life.", guna: "SATTVA", score: 3 },
      { key: "B", text: "You carry on with it much as before, without ever asking why you do.", guna: "TAMAS", score: 1 },
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
