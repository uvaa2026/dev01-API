// Server-side copy of the Construct assessment (ECM module, "TCM" in
// product shorthand) — Stage 2 of the assessment. 32 scenarios, 8 per
// dimension across the 4 UVAA dimensions, mirroring the Guna profiler's
// 15/vertical-agnostic setup. Duplicated from
// uvaa-webapp/src/data/constructScenarios.js rather than shared across
// packages — keep both in sync if a scenario or its score ever changes
// (same convention as gunaVignettes.js).
//
// FINAL scenario content and scoring key, sourced verbatim from
// UVAA_EC_ScoringMaster_with_key_FinalVersionforUpload_271026.docx
// ("Early Career, Final" — 32 situations with scoring key, 26 October
// 2026 — Indian Patent Application No. 202641076718). This is the
// authoritative combined situation/option/score source and supersedes
// both of the two earlier documents this file was previously built
// from (UVAA_EC_Final_V1220926.docx for scenario text, and
// UVAA_EC_V12051026_ScoringMaster.docx for the scoring key).
//
// Applied 2026-10-28: situation and/or option wording was revised on 17
// of the 32 scenarios (up-01, up-04, up-05, up-06, up-07, an-02, an-05,
// an-06, an-07, an-08, ak-04, ak-05, ak-08, vk-01, vk-02, vk-07, vk-08)
// relative to the prior V1220926 text, and one scoring key changed
// (vk-08: option B and C scores swapped, now B=3/Anchored, C=1/Avoidant).
// All 32 scenarios were regenerated from the new document (not hand
// patched) and every option's score was programmatically cross-checked
// against it — see the scoring-audit note in the assistant's summary of
// this change for the verification method.
//
// Dimension assignment (Part 1=UPEKSHA, Part 2=ANUVIGNA, Part 3=ANASAKTI,
// Part 4=VIVEKA) matches the document's own section headers. If a future
// scoring master version changes any scenario's text or point values,
// update both this file and the frontend copy
// (uvaa-webapp/src/data/constructScenarios.js) together.
//
// This copy is what actually computes results: src/lib/scoring.js reads
// the `score` field to turn a respondent's option picks into the four
// construct subscales and the DQI (Scoring Guide v5, section 3). It's also
// what the admin "review answers" endpoint uses to show each scenario's
// situation and option text next to what the respondent chose.
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
  // ------------------------------------------------------------------ UPEKSHA (Part 1)
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
    situation: 'A client contact has sent three escalating messages this week about a delay that is partly yours and partly not. The latest one copies your manager and asks whether the work is being taken seriously. Nothing good has come out of this account in a month and you have started checking the sender of the message before opening it.',
    options: [
      { key: 'A', text: 'Your manager was copied, so you wait to see how they want it handled before sending anything. Nothing goes back to the client that day or the next.', score: 1 },
      { key: 'B', text: 'You send an update the same day. You include the part of the delay that is yours. You send it before you have a fix.', score: 3 },
      { key: 'C', text: 'You draft a reply that afternoon and hold it. You want something better in it, so you send it a day later once one item has cleared.', score: 2 },
    ],
  },
  {
    id: 'up-03',
    dimension: 'UPEKSHA',
    situation: 'Your rating comes through as meets expectations. You had expected exceeds expectations at minimum. Two people who joined around the same time as you have gone up a level and you found out from a group message. The written feedback is three lines, mentions consistency, and gives you nothing specific you can act on.',
    options: [
      { key: 'A', text: 'You ask your manager for time and make the case that the rating is wrong. You bring a summary of what you have delivered over the whole period.', score: 2 },
      { key: 'B', text: 'You do not ask. You start staying later and taking on more, and at the same time you begin looking at what else is out there.', score: 1 },
      { key: 'C', text: 'You let the rating stand and do not contest it. You ask what specifically would move it next cycle. The answer is clear and not the one you wanted.', score: 3 },
    ],
  },
  {
    id: 'up-04',
    dimension: 'UPEKSHA',
    situation: 'You have been given a piece of work that will be seen well above your level. Two others in the team wanted it and both know you got it. Your manager tells you privately it was close, and that this is a chance to be noticed.',
    options: [
      { key: 'A', text: 'You work on it as you would anything else. When the other two ask how it is going, you tell them what is not working.', score: 3 },
      { key: 'B', text: 'You put more into it than into anything else you are carrying. Two smaller commitments slip by a few days and you catch up on them afterwards.', score: 2 },
      { key: 'C', text: 'You keep it to yourself while it is in progress. You would rather show it finished and holding together than have people watching it take shape.', score: 1 },
    ],
  },
  {
    id: 'up-05',
    dimension: 'UPEKSHA',
    situation: 'You asked to move onto newer, more visible work. Instead you have been put on an older area nobody volunteers for. Little is written down and the person who knew it best left last year. Your manager says you are the person they trust with it. You are not sure whether that is true or whether it is what gets said when work needs covering.',
    options: [
      { key: 'A', text: 'You take it on and do what it needs, no more. You are waiting for something better and you are not going to put yourself into this meanwhile.', score: 1 },
      { key: 'B', text: 'You take it on and work it properly, without knowing where it leads. Six weeks in you ask what you should be getting from it.', score: 3 },
      { key: 'C', text: 'You take it on, but first you ask your manager to say plainly what comes after it and to put that in writing. You want the commitment before you start.', score: 2 },
    ],
  },
  {
    id: 'up-06',
    dimension: 'UPEKSHA',
    situation: 'Something you built has failed in a way that cost another team two days. The cause was a decision you made on your own and did not check with anyone. It was reasonable at the time and it was still yours. Nobody has been unpleasant about it. Your manager has asked you to write up what happened.',
    options: [
      { key: 'A', text: 'You write it up accurately. Most of it covers the conditions you were working under and why the decision made sense, with the decision itself toward the end.', score: 2 },
      { key: 'B', text: 'You write it up factually and keep it short. It sets out what failed and what has been done since, without identifying which decision caused it.', score: 1 },
      { key: 'C', text: 'You write it up naming the decision, why you made it at the time, and what you would do differently. You send it that day.', score: 3 },
    ],
  },
  {
    id: 'up-07',
    dimension: 'UPEKSHA',
    situation: 'Something at home has been difficult for about a week. Not a crisis, but ongoing, unresolved, and it takes up Mindspace. You slept badly. Today is a heavy day at work and it includes one conversation you were already not looking forward to.',
    options: [
      { key: 'A', text: 'You move the difficult conversation into next week and get through the rest of the day. Next week it has grown, and the other person has had a week to build a position.', score: 1 },
      { key: 'B', text: 'You go into the day as planned, including the difficult conversation. You tell one person close to you that something at home is going on, without detail.', score: 3 },
      { key: 'C', text: 'You go into the day as planned and get through all of it, including the conversation. You mention it to nobody and say you are fine when asked.', score: 2 },
    ],
  },
  {
    id: 'up-08',
    dimension: 'UPEKSHA',
    situation: 'Over two weeks you spent several hours showing a peer how to handle something you had worked out yourself. They picked it up well and used it last week, and it went noticeably better than expected. In the team meeting your manager singles them out by name for it. They do not mention where it came from and nobody else in the room knows.',
    options: [
      { key: 'A', text: 'When they come back the following week, you help them the same way you did before. You give it the time the question needs and no more.', score: 3 },
      { key: 'B', text: 'When they come back the following week you help, but you keep it short and point them at where they can read the rest up themselves.', score: 2 },
      { key: 'C', text: 'When they come back the following week you are in the middle of something. You are in the middle of something the time after that as well.', score: 1 },
    ],
  },
  // ----------------------------------------------------------------- ANUVIGNA (Part 2)
  {
    id: 'an-01',
    dimension: 'ANUVIGNA',
    situation: 'In the team meeting you have just finished explaining an approach you took. A senior colleague cuts across before you have quite finished and says, loudly enough for everyone: that is not going to hold up, and I am not sure why you did not check with anyone before going down that road. Your lead had in fact reviewed it.',
    options: [
      { key: 'A', text: 'You ask them where specifically they think it falls over, and wait while they answer. You go through the point with them in front of the room.', score: 3 },
      { key: 'B', text: 'You say it was reviewed before you committed to it and take the room through the reasoning. You are still explaining it two minutes later.', score: 2 },
      { key: 'C', text: 'You say you will take another look and come back to them, and hand the meeting on to the next item. It comes up again a week later.', score: 1 },
    ],
  },
  {
    id: 'an-02',
    dimension: 'ANUVIGNA',
    situation: 'It is nearly nine at night. Something has gone wrong with work your team delivered and you were part of it. Your manager calls and says, fast and hard: what happened? This is the third time this quarter. I have to explain this to someone in thirty minutes.',
    options: [
      { key: 'A', text: 'You say you are on it and end the call as fast as you can. It takes another half hour before you have settled enough to look properly.', score: 1 },
      { key: 'B', text: 'You tell them you do not know yet. You will send a factual summary in twenty minutes. You get off the call and start on it.', score: 3 },
      { key: 'C', text: 'You take them through how the work was done, who reviewed it and why the process was sound. You are ten minutes in before you have looked at anything.', score: 2 },
    ],
  },
  {
    id: 'an-03',
    dimension: 'ANUVIGNA',
    situation: 'You are in a meeting with several people considerably more senior than you. One of them turns and asks you directly about something you are supposed to know. You do not know it. Nobody says anything for a couple of seconds.',
    options: [
      { key: 'A', text: 'You give them the closest thing you have, hedged enough that it is not wrong. You check it properly afterwards and it turns out roughly right.', score: 2 },
      { key: 'B', text: 'You say you will need to check on that. For the rest of the meeting, you contribute almost nothing and answer only when asked directly.', score: 1 },
      { key: 'C', text: 'You say you do not know. You say you will come back by the end of the day, and you write it down.', score: 3 },
    ],
  },
  {
    id: 'an-04',
    dimension: 'ANUVIGNA',
    situation: 'In your one-to-one your manager mentions that someone has raised a concern about your behaviour in a team meeting. They do not say who. The account they give leaves out a part that changes how it reads, and you are fairly sure of your version.',
    options: [
      { key: 'A', text: 'You let them finish the whole account. Then you give your version, including the part that was missing, and ask what context you might not have.', score: 3 },
      { key: 'B', text: 'You correct it while they are still speaking. The rest of the conversation goes back and forth over what actually happened and neither of you moves.', score: 2 },
      { key: 'C', text: 'You take the account as given and say you will be more careful. You do not mention the part that was left out of it.', score: 1 },
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
    situation: 'A delay is being discussed and your name comes up as where things slowed. The delay was real. The cause was input you were waiting on, which you flagged twice in writing at the time. The person who owed you that input is sitting in the room.',
    options: [
      { key: 'A', text: 'You say you were waiting on input and that you raised it twice at the time. It is accurate and the room notices the way you said it.', score: 2 },
      { key: 'B', text: 'You say you will make sure it moves faster next time and the discussion moves on. The sequence is never corrected and the record stands.', score: 1 },
      { key: 'C', text: 'You take everyone through the sequence: what you were waiting on, when you flagged it, when it arrived. You give it as a timeline.', score: 3 },
    ],
  },
  {
    id: 'an-07',
    dimension: 'ANUVIGNA',
    situation: 'You went into your client/Stakeholder review expecting it to go reasonably well. It has not. They are not being unkind, but the review is not going in your favour, and three of the reasons are things you are hearing for the first time. There are about twenty minutes left in the conversation.',
    options: [
      { key: 'A', text: 'After the first few minutes you stop pushing back. You agree with several things you do not agree with and the conversation finishes early.', score: 1 },
      { key: 'B', text: 'You take each of the three new points and get them to walk you through what they would want instead. You are still on it at the end.', score: 3 },
      { key: 'C', text: 'You take each point as it comes and put your case on it. Some of it is fair. By the end it has become a negotiation rather than a review.', score: 2 },
    ],
  },
  {
    id: 'an-08',
    dimension: 'ANUVIGNA',
    situation: 'Something you had applied for has gone to someone else. When you ask why, your manager says they were not sure you were ready for it yet. They say it kindly and do not go further. You had told them you were ready and you thought they had agreed.',
    options: [
      { key: 'A', text: 'You ask what ready would look like, specifically, and what they would need to see. They give you two specific things.', score: 3 },
      { key: 'B', text: 'You take them through what you have done over the last year that shows you were ready and ask them the possibilities to get it for you.', score: 2 },
      { key: 'C', text: 'You say that is fair enough and leave it there. Six months later the same conversation happens, and you still do not know what they were looking for.', score: 1 },
    ],
  },
  // ----------------------------------------------------------------- ANASAKTI (Part 3)
  {
    id: 'ak-01',
    dimension: 'ANASAKTI',
    situation: 'Six months ago you made the case for a particular approach, and the team went with your recommendation. Limitations have surfaced that are now creating real problems. A colleague mentioned to you quietly that there is a better alternative and asked whether it is worth raising.',
    options: [
      { key: 'A', text: 'You write up the limitations yourself, including the ones you did not anticipate, and take it to your lead recommending the alternative.', score: 3 },
      { key: 'B', text: 'You write up the limitations and set out what it would take to work through them. The switching cost is real and that is the case you make.', score: 2 },
      { key: 'C', text: 'You raise the limitations with your lead as something the team should look at together. You do not put forward a recommendation either way.', score: 1 },
    ],
  },
  {
    id: 'ak-02',
    dimension: 'ANASAKTI',
    situation: 'You put an idea into a working session a few weeks ago. It was interesting and half-formed. A colleague took it, worked out the parts you had not, and has turned it into something that works and is being rolled out. In the discussion about implementation, they present it as theirs.',
    options: [
      { key: 'A', text: 'You contribute less than you could have. You do not mention the working session to anyone, then or afterwards when it comes up again.', score: 1 },
      { key: 'B', text: 'You contribute on the merits of what exists now. When someone asks later how it came about, you give an accurate account of how it developed.', score: 3 },
      { key: 'C', text: 'You contribute, and at a natural point you tell the room where it first came up. It takes the conversation somewhere it was not going.', score: 2 },
    ],
  },
  {
    id: 'ak-03',
    dimension: 'ANASAKTI',
    situation: 'You spent two weeks building something that works well. In a review someone proposes a much simpler approach that gets most of the same result in a fraction of the time. It does not do everything yours does, but the parts it drops are things nobody has actually asked for. The room likes it.',
    options: [
      { key: 'A', text: 'You take the room through what your version handles that theirs does not. Everyone is still listening and the decision gets deferred to next week.', score: 2 },
      { key: 'B', text: 'You agree with it straight away and say nothing about what is being lost. Four months later someone asks why the part it dropped was never covered.', score: 1 },
      { key: 'C', text: 'You say the simpler approach is the right call, and name specifically possibilities of additional coverage so the decision is made with that in front of everyone.', score: 3 },
    ],
  },
  {
    id: 'ak-04',
    dimension: 'ANASAKTI',
    situation: 'A few weeks ago you argued clearly against a direction the team was considering, in front of everyone. It went ahead anyway. It has now worked, well enough that the results came up positively in this morning\'s meeting. Nobody has mentioned that you were against it.',
    options: [
      { key: 'A', text: 'You say plainly that you were wrong, and what you can see now that you could not see then. Nobody asked you to.', score: 3 },
      { key: 'B', text: 'You say it has clearly worked, and note the conditions that made it work, which were not guaranteed at the time it was decided.', score: 2 },
      { key: 'C', text: 'You say nothing. Nobody raises it and the meeting moves on. You do not go back over what you got wrong.', score: 1 },
    ],
  },
  {
    id: 'ak-05',
    dimension: 'ANASAKTI',
    situation: 'You pushed to be the one who goes onsite for this meeting and you got it. It is a client whose relationship you have carried for eight months, and the meeting is where the next phase gets decided. Four days out, a family member is admitted to hospital. You could still travel and you would be functional. You would not be at your best, and this is the meeting where that matters.',
    options: [
      { key: 'A', text: 'You go. You would not hand this over four days out after eight months of carrying it. You get through the meeting and it goes adequately.', score: 2 },
      { key: 'B', text: 'You tell your manager what is happening and hand the meeting to the colleague who can carry it. You brief them fully and join online.', score: 3 },
      { key: 'C', text: 'You go, and afterwards you tell your manager you had not been at full capacity going in. The meeting has already happened by then.', score: 1 },
    ],
  },
  {
    id: 'ak-06',
    dimension: 'ANASAKTI',
    situation: 'Something you built and have looked after for four months is being handed to someone else because you are needed elsewhere. In the handover they propose several changes. Most are sensible. One you think is clearly wrong and will cause a problem in about three months.',
    options: [
      { key: 'A', text: 'You explain why you think the one change is wrong. When they go ahead you put a note somewhere recording the reasoning, in case it causes a problem.', score: 2 },
      { key: 'B', text: 'You say very little, including about the change you think is wrong. It is theirs now. Three months later it causes the problem you expected.', score: 1 },
      { key: 'C', text: 'You explain the reasoning behind what you built, agree with the changes that improve it, and say why you think the one is wrong. Then you leave it.', score: 3 },
    ],
  },
  {
    id: 'ak-07',
    dimension: 'ANASAKTI',
    situation: 'You have been put on a piece of work with someone you worked with two years ago, on a project that went badly. Your account of why it went badly involves them. Theirs may not. Nothing was ever said about it afterwards and nobody on the current team knows. They have been perfectly straightforward with you this week. The work needs the two of you to depend on each other.',
    options: [
      { key: 'A', text: 'You work with them properly and say nothing about the history. You check their work more closely than anyone else\'s and keep a record of what they commit to.', score: 2 },
      { key: 'B', text: 'You work with them properly and say nothing. Where you can, you shape your part so less of it depends on them. It costs a few days.', score: 1 },
      { key: 'C', text: 'Early on you say briefly that the two of you were on that project and that you would rather start this one clean. You do not go back over it.', score: 3 },
    ],
  },
  {
    id: 'ak-08',
    dimension: 'ANASAKTI',
    situation: 'Feedback from your manager makes clear that what the team values from you is the reliable, unglamorous work you turn round quickly. The other work, the part you find genuinely interesting and have put your own time into is not mentioned. It is not criticised. It simply is not there.',
    options: [
      { key: 'A', text: 'You put it to your manager directly: whether there is a real path for the other work here. You want the answer either way.', score: 3 },
      { key: 'B', text: 'You keep putting your own time into the other work and do not raise it. A year on, nobody has asked about it.', score: 2 },
      { key: 'C', text: 'You stop doing the other work and put the time into what was named instead. The question of whether there was a path goes unanswered.', score: 1 },
    ],
  },
  // ------------------------------------------------------------------- VIVEKA (Part 4)
  {
    id: 'vk-01',
    dimension: 'VIVEKA',
    situation: 'Your lead asks you to skip a standard check on something going out today, because a stakeholder has asked for it urgently and there is no time. The work handles sensitive information. Your lead says the check can happen afterwards and that this has been done before.',
    options: [
      { key: 'A', text: 'You go back to your lead with what a thirty-minute check on the sensitive parts would cover. You are not comfortable sending it without that.', score: 3 },
      { key: 'B', text: 'You send it as asked. You put your concern in writing to your lead, so that it is on record if anything comes of it later.', score: 2 },
      { key: 'C', text: 'You send it. Your lead has said this has been done before, and the check is booked in for afterwards.', score: 1 },
    ],
  },
  {
    id: 'vk-02',
    dimension: 'VIVEKA',
    situation: 'A former colleague you worked with closely for two years asks you to be a reference. You like them and you rate them as a collaborator. You also have a specific concern about a gap that is directly relevant to the role they are applying for, and they may not know you hold it.',
    options: [
      { key: 'A', text: 'You decline, saying you are too far from their recent work to give a current picture. You do not mention the concern to anyone.', score: 2 },
      { key: 'B', text: 'You tell them you will give a complete account including the concern, tell them what the concern is, and let them decide whether to still use you.', score: 3 },
      { key: 'C', text: 'You agree and give a positive account. You do not raise the concern. They get the role and the gap shows up within the first six months.', score: 1 },
    ],
  },
  {
    id: 'vk-03',
    dimension: 'VIVEKA',
    situation: 'Your lead is putting together a status update that goes upward this afternoon and asks whether your piece is done. It is nearly done. What remains is small but important, and it depends on something you are waiting on from someone else. Your lead is clearly hoping for a yes.',
    options: [
      { key: 'A', text: 'You say it is essentially done. It will be by the time anyone acts on the report, and the remaining piece would not go into an update at this level.', score: 2 },
      { key: 'B', text: 'You say yes, and spend the rest of the afternoon trying to close the remaining part before anyone gets round to reading the update.', score: 1 },
      { key: 'C', text: 'You say it is not done. That changes what goes up this afternoon. You tell them exactly what is left, what it is waiting on, and when it will close.', score: 3 },
    ],
  },
  {
    id: 'vk-04',
    dimension: 'VIVEKA',
    situation: 'You are already at capacity. Your manager asks you to take on something additional. Not urgent, clearly framed as an opportunity, and they want you to say yes. If you take it, something you have already committed to will slip by about a week. The person waiting on that does not know yet.',
    options: [
      { key: 'A', text: 'You tell your manager what it would cost: which commitment slips, by how long, and who needs telling. You would be the one who missed it. Then you decide together.', score: 3 },
      { key: 'B', text: 'You take it on and absorb it. The existing commitment slips and you work late to pull it back, and the person waiting is never told.', score: 1 },
      { key: 'C', text: 'You say you cannot take it on at the moment. You do not go into what is behind it or what would have had to move.', score: 2 },
    ],
  },
  {
    id: 'vk-05',
    dimension: 'VIVEKA',
    situation: 'Reviewing something next to your own work, you find what looks like a real error in a piece produced by someone considerably more experienced. You are fairly confident, though there may be context you do not have. It has not caused a problem yet and might not for a while.',
    options: [
      { key: 'A', text: 'You do not act on it. Nothing is said and the work goes out as it is. You find out three weeks later that it was an error.', score: 1 },
      { key: 'B', text: 'You go to them directly and walk them through what you are seeing. You do it that week, before you are certain, and flag that you may be missing context.', score: 3 },
      { key: 'C', text: 'You start gathering more evidence so that when you raise it you are on solid ground. Two weeks later you are still gathering it.', score: 2 },
    ],
  },
  {
    id: 'vk-06',
    dimension: 'VIVEKA',
    situation: 'You have drafted an update for a wider group. Your lead reads it and asks you to take out a line about a problem that came up and was resolved. Their reasoning is that it is fixed and including it will generate questions that are not useful to anyone. Nothing they have said is untrue.',
    options: [
      { key: 'A', text: 'You take it out of the update, and mention it informally to the two or three people you think genuinely need to know about it.', score: 2 },
      { key: 'B', text: 'You take it out. Your lead knows how this group reads these updates and the problem genuinely was resolved before anyone noticed it.', score: 1 },
      { key: 'C', text: 'You push to keep the line in, set out why the group is better off knowing, and offer to reword it so it reads as closed.', score: 3 },
    ],
  },
  {
    id: 'vk-07',
    dimension: 'VIVEKA',
    situation: 'A client asks late for an additional piece of work. It is outside what was agreed and there is no time to put it through normal approval. Your lead is away all week. If it works, it is a real win on an account that has been difficult for months. If it does not, it puts everything else due at risk. Nobody has told you either way.',
    options: [
      { key: 'A', text: 'You take it on and start that day. You tell nobody until it is working', score: 2 },
      { key: 'B', text: 'You decline and cite scope. The client raises it again next quarter, framed as something you would not do', score: 1 },
      { key: 'C', text: 'You work out what has to be true for it to be safe and what failure costs. You put that to whoever can decide in your lead’s absence, the same day.', score: 3 },
    ],
  },
  {
    id: 'vk-08',
    dimension: 'VIVEKA',
    situation: 'You have been moved onto work in a domain you know nothing about. Most of the assumptions are not written down and everyone around you has been in it for years. In your second week you are asked directly for a view on something. You can see a pattern that resembles something from the domain you came from. It might transfer. It might not, and you have no way of telling yet.',
    options: [
      { key: 'A', text: 'You give the view based on the pattern you recognise. It is a reasonable read and it is the contribution they asked you for.', score: 2 },
      { key: 'B', text: 'You say what you can see and what you cannot: that it resembles something from where you came from, and you do not know whether that holds.', score: 3 },
      { key: 'C', text: 'You say you are too new to have a view and keep reading. By the time you understand the domain the decision has been made.', score: 1 },
    ],
  },
]
