// Server-side copy of the Construct assessment (ECM module, "TCM" in
// product shorthand) — Stage 2 of the assessment. 32 scenarios, 8 per
// dimension across the 4 UVAA dimensions, mirroring the Guna profiler's
// 15/vertical-agnostic setup. Duplicated from
// uvaa-webapp/src/data/constructScenarios.js rather than shared across
// packages — keep both in sync if a scenario or its score ever changes
// (same convention as gunaVignettes.js).
//
// FINAL scenario content, sourced verbatim from UVAA_EC_Final_V1220926.docx
// ("Early Career, Final Set" — participant booklet, 32 scenarios, sector-
// neutral, 3 options A-C per scenario — Indian Patent Application No.
// 202641076718). This replaces the earlier 4-option SAMPLE/PLACEHOLDER set.
//
// IMPORTANT — scoring status: the booklet is participant-facing and carries
// no scoring key. It does not say which of the 4 parts is which dimension,
// nor which option (A/B/C) is Anchored/Reactive/Avoidant for any scenario.
// The dimension assignment below (Part 1=UPEKSHA, Part 2=ANUVIGNA,
// Part 3=ANASAKTI, Part 4=VIVEKA) follows the parts' order and thematic
// content, matching the current dimension ordering. The `score` on each
// option is Claude's best-effort estimate, applying the Anchored(3)/
// Reactive(2)/Avoidant(1) behavioural definitions from Scoring Guide v5
// §3.1 to each response — NOT the validated scoring master referenced
// there ("scores are looked up per item from the scoring master"). Treat
// every dimension tag and score in this file as provisional until the
// UVAA framework developer supplies the real per-item key, and swap them
// in then — the shape (dimension, options[].score) is all this file's
// consumers depend on.
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
  // ---------------------------------------------------------------- UPEKSHA (Part 1)
  {
    id: 'up-01',
    dimension: 'UPEKSHA',
    situation: 'Your manager forwards a message from a senior stakeholder praising work you spent three weeks on. They say it made a real difference and they want to talk to you about doing something similar for their group. An hour later you learn that something else you delivered last week has caused a serious problem for another team on the same client, who have been working through it since yesterday. Your part in the fix is necessary but it is not large.',
    options: [
      { key: 'A', text: 'You do your part of the fix and hand back when it is done, while the team is still in it. You reply to the stakeholder the same day.', score: 3 },
      { key: 'B', text: 'You go over to the affected team and stay well past the point where your part is done. You reply to the stakeholder later in the week.', score: 2 },
      { key: 'C', text: 'You go over to the affected team and stay with the fix. The stakeholder message stays open, and by the time the problem closes you leave it.', score: 1 },
    ],
  },
  {
    id: 'up-02',
    dimension: 'UPEKSHA',
    situation: 'A client contact has sent three escalating messages this week about a delay that is partly yours and partly not. The latest one copies your manager and asks whether the work is being taken seriously. Nothing good has come out of this account in a month and you have started checking the sender of the message before opening it.',
    options: [
      { key: 'A', text: 'Your manager was copied, so you wait to see how they want it handled before sending anything. The client sends a fourth message the next morning.', score: 1 },
      { key: 'B', text: 'You send an update the same day, including the part of the delay that is yours, before you have a fix for it.', score: 3 },
      { key: 'C', text: 'You draft a reply that afternoon and hold it. You want something better in it, so you send it a day later once one item has cleared.', score: 2 },
    ],
  },
  {
    id: 'up-03',
    dimension: 'UPEKSHA',
    situation: 'Your rating comes through as meets expectations. You had expected exceeds expectations at minimum. Two people who joined around the same time as you have gone up a level and you found out from a group message. The written feedback is three lines, mentions consistency, and gives you nothing specific you can act on.',
    options: [
      { key: 'A', text: 'You ask your manager for time to talk it through. Meanwhile you go back over six months of your own work trying to find what was held against you.', score: 2 },
      { key: 'B', text: 'You do not ask. You start staying later and taking on more, and at the same time you begin looking at what else is out there.', score: 1 },
      { key: 'C', text: 'You let the rating stand without contesting it, and ask what specifically would move it next cycle. You get a clear answer and it is not the one you wanted.', score: 3 },
    ],
  },
  {
    id: 'up-04',
    dimension: 'UPEKSHA',
    situation: 'You have been given a piece of work that gives you visibility above your level. Two others in the team wanted it and both know you got it. Your manager tells you privately it was close, and that this is a chance to be noticed.',
    options: [
      { key: 'A', text: 'You work on it as you would anything else, and when the other two ask how it is going, you tell them what is working and what is not.', score: 3 },
      { key: 'B', text: 'You put more into it than into anything else you are carrying. Two smaller commitments slip by a few days and you catch up on them afterwards.', score: 2 },
      { key: 'C', text: 'You keep it to yourself while it is in progress, and show it only once it is finished and holding together. The other two hear about it last.', score: 1 },
    ],
  },
  {
    id: 'up-05',
    dimension: 'UPEKSHA',
    situation: 'You asked to move onto newer, more visible work. Instead you have been put on an older area nobody volunteers for, where little is written down and the person who knew it best left last year. Your manager says it will teach you things you cannot learn anywhere else, and that you are the person they trust with it. You are not sure whether that is true or whether it is what gets said when work needs covering.',
    options: [
      { key: 'A', text: 'You take it on and do what it needs, no more. Six weeks in, the person handing over notices the difference and stops offering you the harder parts.', score: 1 },
      { key: 'B', text: 'You put real effort into it without knowing whether it leads anywhere. Around six weeks in you ask what you should be getting from it and where it goes.', score: 2 },
      { key: 'C', text: 'You take it on, but first you ask your manager to say plainly what comes after it and to put that in writing. You want the commitment before you start.', score: 3 },
    ],
  },
  {
    id: 'up-06',
    dimension: 'UPEKSHA',
    situation: 'Something you built has failed in a way that cost another team two additional days of work. The cause was a decision you made on your own and did not check with anyone. It was reasonable at the time. Nobody has been unpleasant about it. Your manager has asked you to write up what happened.',
    options: [
      { key: 'A', text: 'You write it up accurately. Most of it covers the conditions you were working under and why the decision made sense, with the decision itself toward the end.', score: 2 },
      { key: 'B', text: 'You write it up factually and keep it short. It sets out what failed and what has been done since, without identifying which decision caused it.', score: 1 },
      { key: 'C', text: 'You write it up naming the decision, why you made it at the time, and what you would do differently. You send it that day.', score: 3 },
    ],
  },
  {
    id: 'up-07',
    dimension: 'UPEKSHA',
    situation: 'Something at home has been difficult for about a week. Not a crisis, but ongoing, unresolved, and it takes up headspace. You slept badly. Today is a heavy day at work and it includes one conversation you were already not looking forward to.',
    options: [
      { key: 'A', text: 'You move the difficult conversation to next week and get through the rest of the day. Next week it has grown, and the other person has had a week to build a position.', score: 1 },
      { key: 'B', text: 'You go into the day as planned, including the difficult conversation, and tell one person close to you that something at home is going on, without detail.', score: 3 },
      { key: 'C', text: 'You go into the day as planned and get through all of it, including the conversation. It does not go well, and you are short with the team the next day.', score: 2 },
    ],
  },
  {
    id: 'up-08',
    dimension: 'UPEKSHA',
    situation: 'Over two weeks you spent several hours showing a peer how to handle something you had worked out yourself. They picked it up well and used it last week, and it went noticeably better than expected. In the team meeting your manager singles them out by name for it. They do not mention where it came from and nobody else in the room knows.',
    options: [
      { key: 'A', text: 'When they come back the following week, you help them the same way you did before, for as long as the question needs and no longer.', score: 3 },
      { key: 'B', text: 'When they come back the following week you help, but you keep it short and point them at where they can read the rest up themselves.', score: 2 },
      { key: 'C', text: 'When they come back the following week you are in the middle of something. You are in the middle of something the time after that as well.', score: 1 },
    ],
  },

  // --------------------------------------------------------------- ANUVIGNA (Part 2)
  {
    id: 'an-01',
    dimension: 'ANUVIGNA',
    situation: 'In the team meeting you have just finished explaining an approach you took. A senior colleague cuts across before you have quite finished and says, loudly enough for everyone: that is not going to hold up, and I am not sure why you did not check with anyone before going down that road. Your lead had in fact reviewed it.',
    options: [
      { key: 'A', text: 'You ask where specifically they think it falls over and let the point be examined in front of the room. You do not mention that it was reviewed.', score: 3 },
      { key: 'B', text: 'You say it was reviewed before you committed to it and take the room through the reasoning. You are still explaining it two minutes later.', score: 2 },
      { key: 'C', text: 'You say you will take another look and come back to them, and move the meeting on to the next item. It comes up again a week later.', score: 1 },
    ],
  },
  {
    id: 'an-02',
    dimension: 'ANUVIGNA',
    situation: 'It is nearly eight at night. Something has gone wrong with work your team delivered and you were part of it. Your manager calls and says, fast and hard: what happened? This is the third time this quarter. I have to explain this to someone in thirty minutes.',
    options: [
      { key: 'A', text: 'You say you are on it and end the call as fast as you can. It takes another half hour before you have settled enough to look properly.', score: 2 },
      { key: 'B', text: 'You tell them you do not know yet and will have a factual summary in twenty minutes. You get off the call and start on it.', score: 3 },
      { key: 'C', text: 'You take them through how the work was done, who reviewed it and why the process was sound. You are ten minutes in before you have looked at anything.', score: 1 },
    ],
  },
  {
    id: 'an-03',
    dimension: 'ANUVIGNA',
    situation: 'You are in a meeting with several people considerably more senior than you. One of them turns and asks you directly about something you are supposed to know. You do not know it. Nobody says anything for a couple of seconds.',
    options: [
      { key: 'A', text: 'You give them the closest thing you have, cautious enough that it is not wrong. You check it properly afterwards and it turns out roughly right.', score: 2 },
      { key: 'B', text: 'You say you will need to check on that. For the rest of the meeting, you contribute almost nothing and answer only when asked directly.', score: 1 },
      { key: 'C', text: 'You say you do not know it, in front of all of them, and ask what the key point is so you can come back on it today.', score: 3 },
    ],
  },
  {
    id: 'an-04',
    dimension: 'ANUVIGNA',
    situation: 'In your one-to-one your manager mentions that someone has raised a concern about your behaviour in a team meeting. They do not say who. The account they give leaves out a part that changes how it reads, and you are fairly sure of your version.',
    options: [
      { key: 'A', text: 'You let them finish the whole account without interrupting. Then you give your version, including the part that was missing, and ask what context you might not have.', score: 3 },
      { key: 'B', text: 'You correct it while they are still speaking. The rest of the conversation goes back and forth over what actually happened and neither of you moves.', score: 2 },
      { key: 'C', text: 'You take the account as given and say you will be more careful. You do not mention the part that was left out of it, and it stays on record as it was told.', score: 1 },
    ],
  },
  {
    id: 'an-05',
    dimension: 'ANUVIGNA',
    situation: 'You are a week from a deadline. This morning a team member you depend on has gone off sick for three days. You are on the client call an hour later and you have not had time to work out what it means. Twenty minutes in, the client asks you directly whether the date still holds. Your manager is on the call and says nothing.',
    options: [
      { key: 'A', text: 'You say the date is under review and move the conversation on. You work it out afterwards and send it through two days later.', score: 1 },
      { key: 'B', text: 'You tell the client you do not know yet, give them the current status, and commit to confirming by end of day. The call goes quiet for a moment.', score: 3 },
      { key: 'C', text: 'You say the date still holds and that you will find a way. Two days later you have to go back and revise it, on email, without the room.', score: 2 },
    ],
  },
  {
    id: 'an-06',
    dimension: 'ANUVIGNA',
    situation: 'A delay is being discussed, and your name comes up as where things slowed. The delay was real. The cause was input you were waiting on, which you flagged twice in writing at the time. The person who owed you that input is sitting in the room.',
    options: [
      { key: 'A', text: 'You say you were waiting on input and that you raised it twice at the time. It is accurate and the room notices the way you said it and where you looked.', score: 2 },
      { key: 'B', text: 'You say you will make sure it moves faster next time and the discussion moves on.', score: 1 },
      { key: 'C', text: 'You take everyone through the sequence: what you were waiting on, when you flagged it, when it arrived. You give it as a timeline.', score: 3 },
    ],
  },
  {
    id: 'an-07',
    dimension: 'ANUVIGNA',
    situation: 'You went into your client review expecting it to go reasonably well. It has not. The client is not being unkind, but the review is not going in your favour, and three of the reasons are things you are hearing for the first time. There are about twenty minutes left in the conversation.',
    options: [
      { key: 'A', text: 'After the first few minutes you stop pushing back. You agree with several things you do not agree with and the conversation finishes early.', score: 1 },
      { key: 'B', text: 'You stay in it for the full twenty minutes and ask about each of the three new points before responding to any of them.', score: 3 },
      { key: 'C', text: 'You take each point as it comes and put your case on it. Some of it is fair. By the end it has become a negotiation rather than a review.', score: 2 },
    ],
  },
  {
    id: 'an-08',
    dimension: 'ANUVIGNA',
    situation: 'Something you had put yourself forward for has gone to someone else. When you ask why, your manager says they were not sure you were ready for it yet. They say it kindly and do not go further. You had told them you were ready and you thought they had agreed.',
    options: [
      { key: 'A', text: 'You let the decision stand without making your case and ask only what would need to be different next time. They give you two specific things.', score: 3 },
      { key: 'B', text: 'You take them through what you have done over the last year that shows you were ready. They listen, and the conversation ends where it started.', score: 2 },
      { key: 'C', text: 'You say that is fair enough and leave it there. Six months later the same conversation happens and you still do not know what they were looking for.', score: 1 },
    ],
  },

  // --------------------------------------------------------------- ANASAKTI (Part 3)
  {
    id: 'ak-01',
    dimension: 'ANASAKTI',
    situation: 'Six months ago you made the case for a particular approach, and the team went with your recommendation. Limitations have surfaced that are now creating real problems. A colleague mentioned to you quietly that there is a better alternative and asked whether it is worth raising.',
    options: [
      { key: 'A', text: 'You write up the limitations yourself, including the ones you did not anticipate, and take it to your lead recommending the alternative over your own approach.', score: 3 },
      { key: 'B', text: 'You write up the limitations and set out what it would take to work through them. The switching cost is real, and you leave the decision to your lead.', score: 2 },
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
      { key: 'C', text: 'You contribute, and at a natural point you mention the working session where it first came up. It takes the conversation somewhere it was not going.', score: 2 },
    ],
  },
  {
    id: 'ak-03',
    dimension: 'ANASAKTI',
    situation: 'You spent two weeks building something that works well. In a review someone proposes a much simpler approach that gets most of the same result in a fraction of the time. It does not do everything yours does, but the parts it drops are things nobody has actually asked for. The room likes it.',
    options: [
      { key: 'A', text: 'You take the room through what your version handles that theirs does not. Everyone is still listening and the decision gets deferred to next week.', score: 2 },
      { key: 'B', text: 'You agree with it straight away and say nothing about what is being lost. Four months later someone asks why the part it dropped was never covered.', score: 1 },
      { key: 'C', text: 'You say the simpler approach is the right call, and name what it will not cover so the decision is made with that in front of everyone.', score: 3 },
    ],
  },
  {
    id: 'ak-04',
    dimension: 'ANASAKTI',
    situation: 'A few weeks ago, you argued clearly against a direction the team was considering, in front of everyone. It went ahead anyway. It has now worked, well enough that the results came up positively in this morning\'s meeting. Nobody has mentioned that you were against it.',
    options: [
      { key: 'A', text: 'You say plainly that you were wrong about it, and what you can see now that you could not see then. Nobody asked you to.', score: 3 },
      { key: 'B', text: 'You say it has clearly worked, and note the conditions that made it work, which were not guaranteed at the time it was decided.', score: 2 },
      { key: 'C', text: 'You say nothing. Nobody raises it and the meeting moves on. It stays with you for weeks and you find yourself arguing it again in your head.', score: 1 },
    ],
  },
  {
    id: 'ak-05',
    dimension: 'ANASAKTI',
    situation: 'There is an important presentation next week for a client whose relationship you have carried for eight months. The meeting is where the next phase gets decided, and it is the first thing you have owned end to end. Four days out, a family member is admitted to hospital. You would still be able to travel, and you would be functional. You would not be at your best, and this is the meeting where that matters.',
    options: [
      { key: 'A', text: 'You go. You would not hand this over four days out after eight months of carrying it. You get through the meeting, and it goes adequately.', score: 2 },
      { key: 'B', text: 'You tell your manager what is happening and hand the meeting to the colleague who can carry it. You brief them fully and join online.', score: 3 },
      { key: 'C', text: 'You tell your manager what is happening and let the client know too. Your colleague takes the meeting, and you do not get time to brief them.', score: 1 },
    ],
  },
  {
    id: 'ak-06',
    dimension: 'ANASAKTI',
    situation: 'Something you built and have looked after for four months is being handed to someone else because you are needed elsewhere. In the handover they propose several changes. Most are sensible. One you think is clearly wrong and will cause a problem in about three months.',
    options: [
      { key: 'A', text: 'You explain why you think the one change is wrong. When they go ahead you put a note somewhere recording the reasoning, in case it causes a problem.', score: 3 },
      { key: 'B', text: 'You say very little, including about the change you think is wrong. It is theirs now. Three months later it causes the problem you expected.', score: 1 },
      { key: 'C', text: 'You explain the reasoning behind what you built, agree with the changes that improve it, and say why you think the one is wrong. Then you leave it with them.', score: 2 },
    ],
  },
  {
    id: 'ak-07',
    dimension: 'ANASAKTI',
    situation: 'You have been put on a piece of work with someone you worked with two years ago, on a project that went badly. Your account of why it went badly involves them. Theirs may not. Nothing was ever said about it afterwards and nobody on the current team knows. They have been perfectly straightforward with you this week. The work needs the two of you to depend on each other.',
    options: [
      { key: 'A', text: 'You work with them properly and say nothing about the history. You check their work more closely than anyone else\'s and keep a record of what they commit to.', score: 2 },
      { key: 'B', text: 'You work with them as required and say nothing. Where you can, you shape your part so less of it depends on them, even though that costs a few days.', score: 1 },
      { key: 'C', text: 'Early on you say briefly that the two of you were on that project and you would rather start this one clean. You raise it before they do.', score: 3 },
    ],
  },
  {
    id: 'ak-08',
    dimension: 'ANASAKTI',
    situation: 'Feedback from your manager makes clear that what the team values from you is the reliable, unglamorous work you turn round quickly. The other work, the part you find genuinely interesting and have put your own time into, is not mentioned. It is not criticised. It simply is not there.',
    options: [
      { key: 'A', text: 'You go to your manager and ask directly whether there is a real path for the other work here. You want the answer either way.', score: 3 },
      { key: 'B', text: 'You keep putting your own time into the other work and do not raise it. If it turns into something that matters, that will speak for itself.', score: 2 },
      { key: 'C', text: 'You stop doing the other work and put the time into what was named instead. Your next review is better, and you are noticeably less interested in it.', score: 1 },
    ],
  },

  // ----------------------------------------------------------------- VIVEKA (Part 4)
  {
    id: 'vk-01',
    dimension: 'VIVEKA',
    situation: 'Your lead asks you to skip a standard check on something going out today, because a senior stakeholder has asked for it urgently and there is no time. It involves confidential information. Your lead says the check can happen afterwards and that this has been done before.',
    options: [
      { key: 'A', text: 'You ask the people who own the check for thirty minutes on the confidential parts, which means telling them your lead asked you to skip it.', score: 3 },
      { key: 'B', text: 'You send it as asked, and put your concern in writing to your lead so it is on record if anything comes of it later.', score: 2 },
      { key: 'C', text: 'You send it. Your lead knows the relationship and the risk better than you do, and they have said this has been done before.', score: 1 },
    ],
  },
  {
    id: 'vk-02',
    dimension: 'VIVEKA',
    situation: 'A former colleague you worked with closely for two years asks you to be a reference. You like them and rate them as a collaborator. You also have a specific concern about a gap that is directly relevant to the role they are applying for, and they may not know you hold it.',
    options: [
      { key: 'A', text: 'You decline, saying you are too far from their recent work to give a current picture. It is partly true and it is not the reason.', score: 1 },
      { key: 'B', text: 'You tell them what the concern is before you agree to anything, and let them decide whether they still want you as a reference.', score: 3 },
      { key: 'C', text: 'You agree and give a positive account without raising the concern. They get the role. Four months later you hear it is not going well.', score: 2 },
    ],
  },
  {
    id: 'vk-03',
    dimension: 'VIVEKA',
    situation: 'Your lead is putting together a status update that goes upward this afternoon and asks whether your piece is done. It is nearly done. What remains is small but important, and it depends on something you are waiting on from someone else. Your lead is clearly hoping for a yes.',
    options: [
      { key: 'A', text: 'You say it is essentially done. It will be by the time anyone acts on the report, and the remaining piece would not go into an update at this level.', score: 1 },
      { key: 'B', text: 'You say yes and spend the rest of the afternoon trying to close the remaining part before anyone gets round to reading the update.', score: 2 },
      { key: 'C', text: 'You say it is not done, knowing that changes what goes up this afternoon. You tell them exactly what is left and when it will close.', score: 3 },
    ],
  },
  {
    id: 'vk-04',
    dimension: 'VIVEKA',
    situation: 'You are already at capacity. Your manager asks you to take on something additional. Not urgent, clearly framed as an opportunity, and they want you to say yes. If you take it, something you have already committed to will slip by about a week. The person waiting on that does not know yet.',
    options: [
      { key: 'A', text: 'You put the trade-off in front of your manager, including that you would be the one to have missed it if you said nothing. Then you decide together.', score: 3 },
      { key: 'B', text: 'You take it on and absorb it. The existing commitment slips and you work late to pull it back, and the person waiting is never told.', score: 1 },
      { key: 'C', text: 'You say you cannot take it on at the moment. You do not go into detail on what is behind it or what would have had to move.', score: 2 },
    ],
  },
  {
    id: 'vk-05',
    dimension: 'VIVEKA',
    situation: 'Reviewing something next to your own work, you find what looks like a real error in a piece produced by someone considerably more experienced. You are fairly confident, though there may be context you do not have. It has not caused a problem yet and might not for a while.',
    options: [
      { key: 'A', text: 'You leave it. You are not certain, they have been doing this far longer than you, and if it were wrong someone would have caught it by now.', score: 1 },
      { key: 'B', text: 'You go to them that week with what you are seeing, before you are certain, and say you may be missing context.', score: 3 },
      { key: 'C', text: 'You start gathering more evidence so that when you raise it you are on solid ground. Two weeks later you are still gathering it.', score: 2 },
    ],
  },
  {
    id: 'vk-06',
    dimension: 'VIVEKA',
    situation: 'You have drafted an update for a wider group. Your lead reads it and asks you to take out a line about a problem that came up and was resolved. Their reasoning is that it is fixed and including it will generate questions that are not useful to anyone. Nothing they have said is untrue.',
    options: [
      { key: 'A', text: 'You take it out of the update and mention it informally to the two or three people you think genuinely need to know about it.', score: 2 },
      { key: 'B', text: 'You take it out. Your lead knows how this group reads these updates. It comes up in a meeting six weeks later and nobody in the room had been told.', score: 1 },
      { key: 'C', text: 'You say you would rather keep it, explain why the group is better off knowing, and offer to reword it so it reads as closed.', score: 3 },
    ],
  },
  {
    id: 'vk-07',
    dimension: 'VIVEKA',
    situation: 'A client or senior stakeholder asks late for an additional piece of work. It is outside what was agreed and there is no time to put it through normal approval. Your lead is away all week. If you take it on and it works, it is a real win on an account that has been difficult for months. If it does not, it lands alongside everything else due and puts the rest at risk. Nobody has told you to do it. Nobody has told you not to.',
    options: [
      { key: 'A', text: 'You take it on. The upside is real, you are fairly confident you can do it, and waiting for someone who is away costs the window entirely.', score: 2 },
      { key: 'B', text: 'You decline and cite scope. Everything else goes out cleanly and the window closes. The client raises it again next quarter, framed as something you would not do.', score: 1 },
      { key: 'C', text: 'You work out what has to be true for it to be safe and what failure costs, then hold it until someone signs off, knowing the window may close.', score: 3 },
    ],
  },
  {
    id: 'vk-08',
    dimension: 'VIVEKA',
    situation: 'You have been moved onto work in an area you know nothing about. The terminology is unfamiliar, most of the assumptions are not written down anywhere, and everyone around you has been in it for years. In your second week you are asked directly for a view on something. You can see a pattern in it that resembles something from the area you came from. It might carry over. It might not, and you have no way of telling yet.',
    options: [
      { key: 'A', text: 'You give the view based on the pattern you recognise. It is a reasonable read, it is what they asked you for, and you present it as your view.', score: 2 },
      { key: 'B', text: 'You say you are too new to have a view and keep reading. By the time you understand the area, the decision has already been made.', score: 1 },
      { key: 'C', text: 'You say what you can see and say plainly what you cannot, in front of people who have been in this for years. Two of them look unconvinced.', score: 3 },
    ],
  },
]
