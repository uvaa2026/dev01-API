// Construct assessment (ECM module, "TCM" in product shorthand) — "Leading a
// team" variant, served to respondents who picked that option for "what do
// you lead?" at registration (respondents.leadership_scope = 'TEAM'), and
// the default/fallback content for any respondent with no leadership_scope
// on record (every respondent registered before that question existed —
// see data/constructScenarioVariants.js, which selects between this file
// (TEAM), constructScenariosFunction.js (FUNCTION), and
// constructScenariosBusinessUnit.js (BUSINESS_UNIT)). 32 scenarios, 8 per
// dimension across the 4 UVAA dimensions, mirroring the Guna profiler's
// 15/vertical-agnostic setup.
//
// Sourced verbatim from UVAA_1_MC_32_041126_Final4upload.docx ("Mid-Career,
// 32 Scenarios", reviewed 3 November 2026 — Indian Patent Application No.
// 202641076718), parsed structurally (python-docx, situation/options
// tables) and cross-checked: 32 scenarios, 8 per dimension, every option's
// "<score> <label>" pair internally consistent (3 Anchored / 2 Reactive /
// 1 Avoidant) across all 32 scenarios. This REPLACES the prior content of
// this file, which was sourced from
// UVAA_EC_ScoringMaster_with_key_FinalVersionforUpload_271026.docx
// ("Early Career, Final") — scenario ids are unchanged (up-01..vk-08,
// same positions), but every situation and option was rewritten for this
// Mid-Career framing, so do not assume continuity with the prior wording
// when reading old comments/history on this file.
//
// Scoring for this variant is computed once at submission time and
// persisted — a respondent who already submitted the Construct assessment
// under the prior content keeps their original score; this change only
// affects respondents who submit from this point on. The one cosmetic
// exception: the admin per-respondent construct review (GET
// /admin/users/:id/construct) re-renders scenario TEXT from whichever
// content set is live when viewed, so a reviewer looking at an
// already-submitted TEAM respondent's answers will see this new wording
// next to their original answer key/score (same caveat already documented
// for the EC and TPE content revisions earlier in this project).
//
// Dimension assignment (Part 1=UPEKSHA, Part 2=ANUVIGNA, Part 3=ANASAKTI,
// Part 4=VIVEKA) matches the document's own section headers. If a future
// scoring master version changes any scenario's text or point values,
// update both this file and the API copy
// (uvaa-api/src/data/constructScenarios.js) together.
//
// Respondent-facing UI never renders `score` while answering — see
// ConstructAssessment.jsx.

export const DIMENSION_LABELS = {
  UPEKSHA: { name: 'Emotional Balance', sanskrit: 'Upeksha' },
  ANUVIGNA: { name: 'Pressure Non-Reactivity', sanskrit: 'Anuvigna' },
  ANASAKTI: { name: 'Detached Decision-Making', sanskrit: 'Anasakti' },
  VIVEKA: { name: 'Clarity in Complexity', sanskrit: 'Viveka' },
}

export const CONSTRUCT_SCENARIOS = [
  // ---------------------------------------------------------------------- UPEKSHA (Part 1)
  {
    id: 'up-01',
    dimension: 'UPEKSHA',
    situation: 'Your manager forwards a message from a senior stakeholder praising work you spent three weeks on. They want to talk to you about doing something similar for their group. An hour later you learn that something else you delivered last week has caused a serious problem for another team on the same client. Your part in the fix is necessary, but it is not large.',
    options: [
      { key: 'A', text: 'You do your part of the fix and hand back when it is done. The team is still in it when you leave. You reply to the stakeholder the same day.', score: 3 },
      { key: 'B', text: 'You go over to the affected team and stay well past the point where your part is done. You reply to the stakeholder later in the week.', score: 2 },
      { key: 'C', text: 'You go over to the affected team and stay with the fix. The stakeholder message stays open, and by the time the problem closes you leave it.', score: 1 },
    ],
  },
  {
    id: 'up-02',
    dimension: 'UPEKSHA',
    situation: 'Your rating comes through as meets expectations. You had expected exceeds expectations at minimum. Two people who joined around the same time as you have gone up a level and you found out from a group message. The written feedback is three lines, mentions consistency, and gives you nothing specific you can act on.',
    options: [
      { key: 'A', text: 'You ask your manager for time and make the case that the rating is wrong. You bring a summary of what you have delivered over the whole period.', score: 2 },
      { key: 'B', text: 'You do not ask. You start staying later and taking on more, and at the same time you begin looking at what else is out there.', score: 1 },
      { key: 'C', text: 'You let the rating stand and do not contest it. You ask what specifically would move it next cycle. The answer is clear and not the one you wanted.', score: 3 },
    ],
  },
  {
    id: 'up-03',
    dimension: 'UPEKSHA',
    situation: 'Something at home has been difficult for about a week. Not a crisis, but ongoing, unresolved, and it takes up mind space. You slept badly. Today is a heavy day at work and it includes one conversation you were already not looking forward to.',
    options: [
      { key: 'A', text: 'You move the difficult conversation into next week and get through the rest of the day. Next week it has grown, and the other person has had a week to build a position.', score: 1 },
      { key: 'B', text: 'You go into the day as planned, including the difficult conversation. You tell one person close to you that something at home is going on, without detail.', score: 3 },
      { key: 'C', text: 'You go into the day as planned and get through all of it, including the conversation. You mention it to nobody and say you are fine when asked.', score: 2 },
    ],
  },
  {
    id: 'up-04',
    dimension: 'UPEKSHA',
    situation: 'Your manager tells you this morning that your promotion has been approved and will be announced at the team meeting. Two hours later your strongest team member hands in their resignation. Others on the team are watching how you respond. The meeting is at four.',
    options: [
      { key: 'A', text: 'You spend the afternoon trying to talk them out of leaving. You cancel the four o\'clock meeting and the team hears nothing.', score: 2 },
      { key: 'B', text: 'You tell the team about the resignation at four, as planned. You hold the promotion announcement until a cover plan is agreed.', score: 3 },
      { key: 'C', text: 'You make the promotion the main news and celebrate it at four. The resignation goes to the formal handover process.', score: 1 },
    ],
  },
  {
    id: 'up-05',
    dimension: 'UPEKSHA',
    situation: 'Pay review results are out. You received a solid increase and a good rating. A peer who joined on the same day received a noticeably larger increase and a stretch role. You find out at lunch, from the peer. Your one-to-one is tomorrow.',
    options: [
      { key: 'A', text: 'You congratulate your peer that day. At tomorrow\'s meeting you accept your own result and ask what would put you in line.', score: 3 },
      { key: 'B', text: 'You thank your manager and say little about the result. That evening you update your CV and look at what else is out there.', score: 1 },
      { key: 'C', text: 'At tomorrow\'s meeting you ask your manager to explain the difference between the two results, point by point, and in writing.', score: 2 },
    ],
  },
  {
    id: 'up-06',
    dimension: 'UPEKSHA',
    situation: 'You booked a week of leave months ago to be with your family at a ceremony that matters to them. This week your team\'s project date was brought forward, and your leave now falls on the busiest days. Your manager says the decision is yours.',
    options: [
      { key: 'A', text: 'You take the leave and brief your sub-ordinate. You agree one hour a day to be reached. Some decisions get made without you.', score: 3 },
      { key: 'B', text: 'You cancel the leave and tell your family you will make it up to them later. You stay with the delivery until it is done.', score: 2 },
      { key: 'C', text: 'You wait to see how the week develops. You decide the night before whether to go, then tell the team and your manager.', score: 1 },
    ],
  },
  {
    id: 'up-07',
    dimension: 'UPEKSHA',
    situation: 'You have been running at high intensity for seven months. Your sleep is poor and you have been short with people. Nothing is failing and your numbers are good. In your one-to-one your manager says you look tired and asks how you are.',
    options: [
      { key: 'A', text: 'You say it has been a busy patch and move on to the team\'s results. The question does not come up again.', score: 1 },
      { key: 'B', text: 'You say you are fine and carry on. You book a holiday for after the next milestone, three months away.', score: 2 },
      { key: 'C', text: 'You say that you are running low. You share what would have to change. It may look like you cannot cope.', score: 3 },
    ],
  },
  {
    id: 'up-08',
    dimension: 'UPEKSHA',
    situation: 'A client contact has sent three escalating messages this week about a delay that is partly yours and partly not. The latest one copies your manager and asks whether the work is being taken seriously. Nothing good has come out of this account in a month and you have started checking the sender of the message before opening it.',
    options: [
      { key: 'A', text: 'Your manager was copied, so you wait to see how they want it handled before sending anything. Nothing goes back to the client that day or the next.', score: 1 },
      { key: 'B', text: 'You send an update the same day. You include the part of the delay that is yours. You send it before you have a fix.', score: 3 },
      { key: 'C', text: 'You draft a reply that afternoon and hold it. You want something better in it, so you send it a day later once one item has cleared.', score: 2 },
    ],
  },
  // ---------------------------------------------------------------------- ANUVIGNA (Part 2)
  {
    id: 'an-01',
    dimension: 'ANUVIGNA',
    situation: 'It is nearly nine at night. Something has gone wrong with work your team delivered. Your manager calls and says, fast and hard: what happened? This is the third time this quarter. I have to explain this to someone in thirty minutes.',
    options: [
      { key: 'A', text: 'You say you are on it and end the call as fast as you can. It takes another half hour before you have settled enough to look properly.', score: 1 },
      { key: 'B', text: 'You tell them you do not know yet. You will send a factual summary in twenty minutes. You get off the call and start on it.', score: 3 },
      { key: 'C', text: 'You take them through how the work was done, who reviewed it and why the process was sound. You are ten minutes in before you have looked at anything.', score: 2 },
    ],
  },
  {
    id: 'an-02',
    dimension: 'ANUVIGNA',
    situation: 'A delay is being discussed, and your team\'s name comes up as where things slowed. The delay was real. The cause was input you were waiting on from another team, which you flagged twice in writing at the time. The person who owed you that input is sitting in the room.',
    options: [
      { key: 'A', text: 'You say you were waiting on input and that you raised it twice at the time. It is accurate and the room notices the way you said it.', score: 2 },
      { key: 'B', text: 'You say you will make sure it moves faster next time and the discussion moves on. The sequence is never corrected and the record stands.', score: 1 },
      { key: 'C', text: 'You take everyone through the sequence: what you were waiting on, when you flagged it, when it arrived. You give it as a timeline.', score: 3 },
    ],
  },
  {
    id: 'an-03',
    dimension: 'ANUVIGNA',
    situation: 'Something you had applied for has gone to someone else. When you ask why, your manager says they were not sure you were ready for it yet. They say it kindly and do not go further. You had told them you were ready and you thought they had agreed.',
    options: [
      { key: 'A', text: 'You ask what ready would look like, specifically, and what they would need to see. They give you two specific things.', score: 3 },
      { key: 'B', text: 'You take them through what you have done over the last year that shows you were ready and ask what it would take next time or now.', score: 2 },
      { key: 'C', text: 'You say that is fair enough and leave it there. Six months later the same conversation happens, and you still do not know what they were looking for.', score: 1 },
    ],
  },
  {
    id: 'an-04',
    dimension: 'ANUVIGNA',
    situation: 'In your weekly meeting two team members start arguing about whose work is holding up the other. Voices are raised and the rest of the team goes quiet. Both look at you. The agenda has six more items, and a senior colleague is sitting in.',
    options: [
      { key: 'A', text: 'You say you will pick this up later and move to the next item. The two of them sort it out themselves.', score: 1 },
      { key: 'B', text: 'You back the point you think is correct. You tell the other person the matter is closed, in front of everyone.', score: 2 },
      { key: 'C', text: 'You stop the meeting there. You give each one sentence to say what they need and set a time that day.', score: 3 },
    ],
  },
  {
    id: 'an-05',
    dimension: 'ANUVIGNA',
    situation: 'You are a week away from a project milestone. This morning a team member you depend on has gone off sick for three days. You are on the client/stakeholder status call an hour later and you have not had time to work out what it means. Twenty minutes in, they ask you directly whether the date still holds. Your manager is on the call and says nothing.',
    options: [
      { key: 'A', text: 'You say the date is under review and move the conversation on. You work it out afterwards and send it through two days later.', score: 2 },
      { key: 'B', text: 'You say you do not have the answer yet, that you will have it by end of day, and that you will send an update.', score: 3 },
      { key: 'C', text: 'You say the date still holds. You work the three days back into the plan on your own. Nobody is told until the week it is due.', score: 1 },
    ],
  },
  {
    id: 'an-06',
    dimension: 'ANUVIGNA',
    situation: 'In a planning meeting every other team lead has agreed to an ambitious target for next quarter. Your manager asks you last. Your team\'s numbers suggest the target is a stretch, and you have not had time to test it properly.',
    options: [
      { key: 'A', text: 'You agree with the group and commit your team to the target. You plan to raise problems if they appear later.', score: 1 },
      { key: 'B', text: 'You name your concern and give one specific reason. You set out what would make your team able to commit.', score: 3 },
      { key: 'C', text: 'You say the target is unrealistic and decline to commit your team. You ask that the whole plan be reopened.', score: 2 },
    ],
  },
  {
    id: 'an-07',
    dimension: 'ANUVIGNA',
    situation: 'On a call, the client\'s senior sponsor says your team\'s recent work has been below standard and that they want one of your people taken off the account. Your manager is not on the call. Two of your team are.',
    options: [
      { key: 'A', text: 'You defend the team\'s work on the call. You point to the parts the client\'s own side did not deliver on time.', score: 2 },
      { key: 'B', text: 'You find out exactly what fell short. You take it without defending anyone while your team listens and name a time to come back.', score: 3 },
      { key: 'C', text: 'You agree to the change on the call to settle it there. You tell the person concerned once the call has ended.', score: 1 },
    ],
  },
  {
    id: 'an-08',
    dimension: 'ANUVIGNA',
    situation: 'In a skip-level meeting, your manager\'s manager says several people find you hard to approach when you are under pressure. No names are given. You are hearing this for the first time, and you have been told the opposite before.',
    options: [
      { key: 'A', text: 'You accept the feedback politely and say nothing further. Neither of you raises the subject again.', score: 1 },
      { key: 'B', text: 'You set out the evidence to the contrary. You bring your engagement scores and the people who would say otherwise.', score: 2 },
      { key: 'C', text: 'You hear the whole account without countering it. You get one specific example. You come back within the week.', score: 3 },
    ],
  },
  // ---------------------------------------------------------------------- ANASAKTI (Part 3)
  {
    id: 'ak-01',
    dimension: 'ANASAKTI',
    situation: 'Six months ago, you made the case for a particular approach, and the team went with your recommendation. Limitations have surfaced that are now creating real problems. A colleague mentioned to you quietly that there is a better alternative and asked whether it is worth raising.',
    options: [
      { key: 'A', text: 'You write up the limitations yourself, including the ones you did not anticipate, and take it to your manager recommending the alternative.', score: 3 },
      { key: 'B', text: 'You write up the limitations and set out what it would take to work through them. The switching cost is real and that is the case you make.', score: 2 },
      { key: 'C', text: 'You raise the limitations with your manager as something the team should look at together. You do not put forward a recommendation either way.', score: 1 },
    ],
  },
  {
    id: 'ak-02',
    dimension: 'ANASAKTI',
    situation: 'A few weeks ago, you argued clearly against a direction the team was considering, in front of everyone. It went ahead anyway. It has now worked, well enough that the results came up positively in this morning\'s meeting. Nobody has mentioned that you were against it.',
    options: [
      { key: 'A', text: 'You say plainly that you were wrong, and what you can see now that you could not see then. Nobody asked you to.', score: 3 },
      { key: 'B', text: 'You say it has clearly worked, and note the conditions that made it work, which were not guaranteed at the time it was decided.', score: 2 },
      { key: 'C', text: 'You say nothing. Nobody raises it and the meeting moves on. You do not go back over what you got wrong.', score: 1 },
    ],
  },
  {
    id: 'ak-03',
    dimension: 'ANASAKTI',
    situation: 'You pushed to be the one who goes onsite for this meeting and you got it. It is a client/stakeholder whose relationship you have carried for eight months, and the meeting is where the next phase gets decided. Four days out, a family member is admitted to hospital. You could still travel and you would be functional, but not at your best.',
    options: [
      { key: 'A', text: 'You go. Four days out, after eight months on the account, you are the one who should be in the room.', score: 2 },
      { key: 'B', text: '.You hand the meeting to the senior member of your team and brief them fully. You join online. Eight months of carrying it counts for nothing in the room.', score: 3 },
      { key: 'C', text: 'You tell your manager you cannot go and leave the team to cover it. No briefing is handed over before you leave considering the time.', score: 1 },
    ],
  },
  {
    id: 'ak-04',
    dimension: 'ANASAKTI',
    situation: 'Three months ago, you strongly recommended hiring a particular candidate over others. They are now clearly struggling with the core of the role, and two team members have quietly mentioned it. The probation review is in six weeks.',
    options: [
      { key: 'A', text: 'You tell your manager the hire is not working. You own that your judgement may have been wrong. You propose a dated plan.', score: 3 },
      { key: 'B', text: 'You coach them daily for the next two months and say nothing to your manager. At the review you present the progress made.', score: 2 },
      { key: 'C', text: 'You wait for the probation review and let the formal process decide. You answer questions only if your manager asks.', score: 1 },
    ],
  },
  {
    id: 'ak-05',
    dimension: 'ANASAKTI',
    situation: 'Someone you hired and coached for two years is no longer keeping up. You have given them extra time, support and a changed role. Nothing has moved in six months, and two others are quietly carrying parts of their work.',
    options: [
      { key: 'A', text: 'You leave the arrangement as it stands. You carry on redistributing the work quietly among the others.', score: 1 },
      { key: 'B', text: 'You give them one more quarter in another changed role, with more of your own time set aside.', score: 2 },
      { key: 'C', text: 'You start the formal process with Human Resources and have the conversation yourself.', score: 3 },
    ],
  },
  {
    id: 'ak-06',
    dimension: 'ANASAKTI',
    situation: 'Something your team built and has looked after for four months is being handed to another team because you are needed elsewhere. In the handover they propose several changes. Most are sensible. One you think is clearly wrong and will cause a problem in about three months.',
    options: [
      { key: 'A', text: 'You explain why you think the one change is wrong. When they go ahead you put a note somewhere recording the reasoning, in case it causes a problem.', score: 2 },
      { key: 'B', text: 'You say very little, including about the change you think is wrong. It is theirs now. Three months later it causes the problem you expected.', score: 1 },
      { key: 'C', text: 'You explain the reasoning behind what you built, agree with the changes that improve it, and say why you think the one is wrong. Then you leave it.', score: 3 },
    ],
  },
  {
    id: 'ak-07',
    dimension: 'ANASAKTI',
    situation: 'You are fourteen months from a retention bonus vesting, worth about a quarter of your annual pay. A role elsewhere would fit your longer-term goals better and the money is comparable. The offer is open for three weeks. Your family has no strong view either way.',
    options: [
      { key: 'A', text: 'You map both paths over five years, with the bonus counted once. You talk it through with someone you trust, then decide.', score: 3 },
      { key: 'B', text: 'You let the offer lapse and stay until the bonus vests. You put the question of other roles aside entirely.', score: 1 },
      { key: 'C', text: 'You accept the new role within the week. You resign without asking whether the bonus can be adjusted.', score: 2 },
    ],
  },
  {
    id: 'ak-08',
    dimension: 'ANASAKTI',
    situation: 'A process you designed two years ago is now causing delays across three teams, according to figures a peer has put together. In a joint meeting the peer presents them and several people look to you. You know the process well and believe parts still work.',
    options: [
      { key: 'A', text: 'You take the data and change the parts of your design causing the delays. You present the revised version yourself.', score: 3 },
      { key: 'B', text: 'You say you are open to changes. You leave it to your peer to propose what should change and wait to see the response.', score: 1 },
      { key: 'C', text: 'You defend the design. You say the delays come from how other teams use it and ask for their data to be rechecked.', score: 2 },
    ],
  },
  // ---------------------------------------------------------------------- VIVEKA (Part 4)
  {
    id: 'vk-01',
    dimension: 'VIVEKA',
    situation: 'You are already at capacity. Your manager asks you to lead on something additional. Not urgent, clearly framed as an opportunity, and they want you to say yes. If you take it, something you have already committed to will slip by about a week. The person waiting on that does not know yet.',
    options: [
      { key: 'A', text: 'You tell your manager what it would cost: which commitment slips, by how long, and who needs telling. You would be the one who missed it. Then you decide together.', score: 3 },
      { key: 'B', text: 'You take it on and absorb it. The existing commitment slips and you work late to pull it back, and the person waiting is never told.', score: 1 },
      { key: 'C', text: 'You say you cannot take it on at the moment. You do not go into what is behind it or what would have had to move.', score: 2 },
    ],
  },
  {
    id: 'vk-02',
    dimension: 'VIVEKA',
    situation: 'You have drafted an update for a wider group. Your manager reads it and asks you to take out a line about a problem that came up and was resolved. Their reasoning is that it is fixed and including it will generate questions that are not useful to anyone. Nothing they have said is untrue.',
    options: [
      { key: 'A', text: 'You take it out of the update and mention it informally to the two or three people you think genuinely need to know about it.', score: 2 },
      { key: 'B', text: 'You take it out. Your manager knows how this group reads these updates and the problem genuinely was resolved before anyone noticed it.', score: 1 },
      { key: 'C', text: 'You push to keep the line in, set out why the group is better off knowing, and offer to reword it so it reads as closed.', score: 3 },
    ],
  },
  {
    id: 'vk-03',
    dimension: 'VIVEKA',
    situation: 'You have been moved onto work in a domain you know nothing about. Most of the assumptions are not written down and everyone around you has been in it for years. In your second week you are asked directly for a view on something. You can see a pattern that resembles something from the domain you came from. It might transfer. It might not, and you have no way of telling yet.',
    options: [
      { key: 'A', text: 'You give the view based on the pattern you recognise. It is a reasonable read, and it is the contribution they asked you for.', score: 2 },
      { key: 'B', text: 'You say what you can see and what you cannot: that it resembles something from where you came from, and you do not know whether that holds.', score: 3 },
      { key: 'C', text: 'You say you are too new to have a view and keep reading. By the time you understand the domain the decision has been made.', score: 1 },
    ],
  },
  {
    id: 'vk-04',
    dimension: 'VIVEKA',
    situation: 'You are asked to present quarterly figures using a definition that is technically defensible and makes the quarter look better than it is. Everyone senior in the room knows which definition is being used. Nobody has called it wrong.',
    options: [
      { key: 'A', text: 'You present the quarter on both definitions and let the room see the gap. The comparison will not be welcome.', score: 3 },
      { key: 'B', text: 'You present as asked. You add the other definition as a footnote in small type at the bottom of the slide.', score: 2 },
      { key: 'C', text: 'You present as asked and answer the questions as they come. The definition was agreed above you.', score: 1 },
    ],
  },
  {
    id: 'vk-05',
    dimension: 'VIVEKA',
    situation: 'You are at a crossroads. One path leads to managing people and the other to deepening your specialist expertise. Both sound attractive and neither is clearly better. Neither can be undone easily. Your manager asks you to choose by Friday.',
    options: [
      { key: 'A', text: 'You choose the path with the most visibility right now and start preparing. You tell your manager you will work out the details afterwards.', score: 2 },
      { key: 'B', text: 'You take time and spend select days on the work of each path. You agree in advance what you will look at.', score: 3 },
      { key: 'C', text: 'You ask your manager which path is better for you and follow what they suggest. You state no preference of your own.', score: 1 },
    ],
  },
  {
    id: 'vk-06',
    dimension: 'VIVEKA',
    situation: 'A client asks late for an additional piece of work. It is outside what was agreed and there is no time to put it through normal approval. Your manager is away all week. If it works, it is a real win on an account that has been difficult for months. If it does not, it puts everything else due at risk.',
    options: [
      { key: 'A', text: 'You take it on and start that day. You tell nobody until it is working.', score: 2 },
      { key: 'B', text: 'You decline and cite scope. The client raises it again next quarter, framed as something you would not do.', score: 1 },
      { key: 'C', text: 'You work out what has to be true for it to be safe and what failure costs. You put that to whoever can decide in your manager\'s absence, the same day.', score: 3 },
    ],
  },
  {
    id: 'vk-07',
    dimension: 'VIVEKA',
    situation: 'A handover between two of your team members failed and the client noticed. Each gives you a different, detailed account of what happened, and each blames the other. Both are credible and both are respected in the team.',
    options: [
      { key: 'A', text: 'You side with the person who has worked with you longer. You tell the other what you expect next time.', score: 2 },
      { key: 'B', text: 'You collect from each the dates and messages that support their account. You read both, then fix a date to decide.', score: 3 },
      { key: 'C', text: 'You tell both that the handover process was unclear. You make no judgement on either account or move on.', score: 1 },
    ],
  },
  {
    id: 'vk-08',
    dimension: 'VIVEKA',
    situation: 'A piece of work across three teams is drifting. Each team is doing its own part, and nobody owns the whole. You have no authority over the other two leads. The sponsor believes it is on track and has said so.',
    options: [
      { key: 'A', text: 'You raise it informally with the other two leads. Then you wait to see whether either takes it to the sponsor.', score: 1 },
      { key: 'B', text: 'You make sure your own team\'s part is clean. You leave the other two leads to manage their areas as they see fit.', score: 2 },
      { key: 'C', text: 'You set out for the sponsor where it stands and what nobody owns. The gap is not yours to fix.', score: 3 },
    ],
  },
]
