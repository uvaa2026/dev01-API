// Construct assessment (ECM module, "TCM" in product shorthand) — "Leading a
// business unit(s)" variant. Served instead of the default content in
// constructScenarios.js when a respondent's registration answer
// (respondents.leadership_scope) is 'BUSINESS_UNIT' — see
// constructScenarioVariants.js, which selects between this file,
// constructScenarios.js (TEAM, the default), and
// constructScenariosFunction.js (FUNCTION) by that value.
//
// Same 32 scenario ids (up-01..vk-08), same 4 dimensions/8-per-dimension
// structure, same A/B/C 3/2/1 scoring convention as constructScenarios.js —
// only the situation text and option wording differ, written for someone
// who owns the outcomes for a business or unit(s), rather than a single
// team/project or a function.
//
// Sourced verbatim from UVAA_3_LS_32_041126_Final4upload.docx (scenario
// codes prefixed "LD-", reviewed 3 November 2026 — Indian Patent
// Application No. 202641076718), parsed structurally (python-docx,
// situation/options tables) and cross-checked: 32 scenarios, 8 per
// dimension, every option's "<score> <label>" pair internally consistent
// (3 Anchored / 2 Reactive / 1 Avoidant) across all 32 scenarios.
//
// DIMENSION_LABELS is not re-exported here — import it from
// constructScenarios.js, which stays the single source for that mapping.
//
// Respondent-facing UI never renders `score` while answering — see
// ConstructAssessment.jsx. If this content changes, update both this file
// and the API copy (uvaa-api/src/data/constructScenariosBusinessUnit.js)
// together.

export const CONSTRUCT_SCENARIOS_BUSINESS_UNIT = [
  // ---------------------------------------------------------------------- UPEKSHA (Part 1)
  {
    id: 'up-01',
    dimension: 'UPEKSHA',
    situation: 'Your unit closes its strongest quarter in four years, and it is announced internally this morning. By midday a competitor has announced something that makes a large part of your roadmap look dated. Your leadership team is still celebrating.',
    options: [
      { key: 'A', text: 'You let the quarter stand. The competitor announcement goes on next week\'s leadership agenda, put there by you.', score: 3 },
      { key: 'B', text: 'You pull the leadership team together that afternoon. The roadmap rework starts while the news is still fresh.', score: 2 },
      { key: 'C', text: 'You keep the focus on the quarter. The competitor announcement comes up at the next scheduled review.', score: 1 },
    ],
  },
  {
    id: 'up-02',
    dimension: 'UPEKSHA',
    situation: 'Two of your senior leaders resign within a fortnight of each other, three weeks after the unit delivered its best year. Both gave reasons that sound reasonable and neither mentioned you. Your own leadership peers have started asking.',
    options: [
      { key: 'A', text: 'You treat them as two separate decisions. You wait to see whether a third follows before concluding anything.', score: 1 },
      { key: 'B', text: 'You take both departures to your leadership team as a pattern worth understanding, before anyone else frames it.', score: 3 },
      { key: 'C', text: 'You move quickly on replacements. The year\'s result stays the story people hear.', score: 2 },
    ],
  },
  {
    id: 'up-03',
    dimension: 'UPEKSHA',
    situation: 'You have cancelled three family commitments this quarter, each for something that genuinely could not move. The fourth is next week. Nothing is on fire, but the week is full and two things could reasonably claim it.',
    options: [
      { key: 'A', text: 'You keep the week as it is. You tell your family you will make the next one, and you intend to.', score: 2 },
      { key: 'B', text: 'You decide closer to the day, once you can see how the week has gone. The pattern repeats next quarter.', score: 1 },
      { key: 'C', text: 'You hold the commitment and move the two work items. One of them lands on someone else.', score: 3 },
    ],
  },
  {
    id: 'up-04',
    dimension: 'UPEKSHA',
    situation: 'You have made the annual number. One segment inside it has collapsed and the shortfall was covered by a one-off that will not repeat. The results announcement goes out on Friday and the headline is accurate.',
    options: [
      { key: 'A', text: 'You put the segment and the one-off in the announcement yourself, alongside the headline.', score: 3 },
      { key: 'B', text: 'You report the number as made. The segment comes up next quarter when it cannot be covered again.', score: 1 },
      { key: 'C', text: 'You report the number as made. You prepare the segment detail in case anyone asks for it.', score: 2 },
    ],
  },
  {
    id: 'up-05',
    dimension: 'UPEKSHA',
    situation: 'A launch you fronted has gone well and the early numbers are good. Internally you know it held together because three people worked unreasonable hours for six weeks. Nobody has complained.',
    options: [
      { key: 'A', text: 'You name what it cost those three in the review. You change what the next launch asks of people.', score: 3 },
      { key: 'B', text: 'You recognise the three publicly and give them time off. The next launch runs the same way.', score: 2 },
      { key: 'C', text: 'You take the result as the outcome that matters. The three are thanked privately and it is left there.', score: 1 },
    ],
  },
  {
    id: 'up-06',
    dimension: 'UPEKSHA',
    situation: 'You have been pushing a change for two months. Your leadership team agrees in meetings, and nothing moves between them. No one objects. The work quietly does not happen, and you are the only person raising it.',
    options: [
      { key: 'A', text: 'You keep raising it at each meeting. The agreement is repeated and the position is unchanged in a month.', score: 1 },
      { key: 'B', text: 'You put the gap between agreement and action to the team. You ask what is actually in the way.', score: 3 },
      { key: 'C', text: 'You take two of the pieces back and drive them yourself. At least something is moving by month end.', score: 2 },
    ],
  },
  {
    id: 'up-07',
    dimension: 'UPEKSHA',
    situation: 'One part of your unit is highly profitable and is quietly funding another that has lost money for six quarters. Both report to you. The group sees the combined number, which is good, and nobody has asked.',
    options: [
      { key: 'A', text: 'You put a turnaround plan on the loss-making part. You keep reporting combined while it works.', score: 2 },
      { key: 'B', text: 'You separate the two in the next review and show what each is doing. The combined number stops protecting you.', score: 3 },
      { key: 'C', text: 'You keep reporting the combined number. The question comes when the profitable part has a weaker year.', score: 1 },
    ],
  },
  {
    id: 'up-08',
    dimension: 'UPEKSHA',
    situation: 'The organisation has grown fast and works differently now. Some of what made it good has gone and you can name three things. Others point to the growth and say it is worth it. Both readings are true.',
    options: [
      { key: 'A', text: 'You take it as the price of scale. The three things go unsaid and a fourth appears next year.', score: 1 },
      { key: 'B', text: 'You put both to the executive: what the growth has brought and what it has cost, with the three examples.', score: 3 },
      { key: 'C', text: 'You push to restore what has been lost. The growth case gets argued back at you and little changes.', score: 2 },
    ],
  },
  // ---------------------------------------------------------------------- ANUVIGNA (Part 2)
  {
    id: 'an-01',
    dimension: 'ANUVIGNA',
    situation: 'In a meeting with the executive / Board and your peers, your numbers are questioned sharply, and the implication is that you have been managing the narrative. Two of the figures have straightforward explanations. One does not and you have not finished looking at it.',
    options: [
      { key: 'A', text: 'You give all three explanations, including the one you are unsure of. You hold your position in the room.', score: 2 },
      { key: 'B', text: 'You say you will take the questions away and come back fully. The meeting moves on without the explanations.', score: 1 },
      { key: 'C', text: 'You give the two explanations. You say you do not have the third yet and name the day you will.', score: 3 },
    ],
  },
  {
    id: 'an-02',
    dimension: 'ANUVIGNA',
    situation: 'The executive of your largest client calls you directly. They are angry about something your unit did, the facts are mostly right, and they say they are reviewing the relationship. The call is ten minutes long .',
    options: [
      { key: 'A', text: 'You apologise, say you will look into all of it personally, and give no date. They call the chair/executive instead.', score: 1 },
      { key: 'B', text: 'You take it without defending the unit. You get the specifics and commit to a date you can meet.', score: 3 },
      { key: 'C', text: 'You explain what happened and the parts their own side contributed. It is accurate and they are still angry.', score: 2 },
    ],
  },
  {
    id: 'an-03',
    dimension: 'ANUVIGNA',
    situation: 'Two function heads have escalated to you against each other, separately, within a day. Each account is credible and each wants you to rule. They have worked around each other for months and it is now affecting delivery.',
    options: [
      { key: 'A', text: 'You rule for the stronger case on the facts. You tell the other what you expect from here.', score: 2 },
      { key: 'B', text: 'You tell both to resolve it between themselves and come back if they cannot. It reaches you again in six weeks.', score: 1 },
      { key: 'C', text: 'You call them for a meeting. Each state what they need from the other, and you decide in front of them.', score: 3 },
    ],
  },
  {
    id: 'an-04',
    dimension: 'ANUVIGNA',
    situation: 'A measure the executive watches has moved against you, and the reason is not yet clear. the executive meeting in four days. Your team has three theories and no evidence for any of them.',
    options: [
      { key: 'A', text: 'You take the executive the movement and the three theories. You say what you are doing to establish which.', score: 3 },
      { key: 'B', text: 'You report the movement and say the analysis is in progress. the executive asks the same question next time.', score: 1 },
      { key: 'C', text: 'You take the executive the theory that fits best, framed as the likely cause, with the work already under way.', score: 2 },
    ],
  },
  {
    id: 'an-05',
    dimension: 'ANUVIGNA',
    situation: 'In an executive meeting one of your senior leaders disagrees with a decision you have already made, in front of the full team, and does it well. Several people look convinced. The decision is sound and you have information they do not.',
    options: [
      { key: 'A', text: 'You let them finish and say what sat behind the decision. You take it to them afterwards.', score: 3 },
      { key: 'B', text: 'You answer the disagreement point by point in the room. The decision stands where it was.', score: 2 },
      { key: 'C', text: 'You say it is worth discussing and move the agenda on. The decision is quietly not implemented.', score: 1 },
    ],
  },
  {
    id: 'an-06',
    dimension: 'ANUVIGNA',
    situation: 'Someone raises your unit\'s mistakes at every forum, including after your best results. Each point is accurate and each one happened. The pattern is now part of how your unit is seen, and nobody else raises it.',
    options: [
      { key: 'A', text: 'You accept each point and say nothing about the pattern. It is repeated at the next forum.', score: 1 },
      { key: 'B', text: 'You correct the framing in the forum, setting out what went right alongside what did not.', score: 2 },
      { key: 'C', text: 'You take each point as it stands. Separately, you put the pattern to them directly and in private.', score: 3 },
    ],
  },
  {
    id: 'an-07',
    dimension: 'ANUVIGNA',
    situation: 'Revenue has come in eleven percent below plan for the second quarter running. In a group meeting the executive / chair asks, in front of others , whether you still believe the plan was realistic. You wrote it.',
    options: [
      { key: 'A', text: 'You set out the market conditions that moved, with the data, and where the plan still holds.', score: 2 },
      { key: 'B', text: 'You say you will come back with a full review. The question is asked again next quarter.', score: 1 },
      { key: 'C', text: 'You say the plan was yours and where you now think it was wrong. You give the two things you are changing.', score: 3 },
    ],
  },
  {
    id: 'an-08',
    dimension: 'ANUVIGNA',
    situation: 'In a leadership meeting the finance director says your unit\'s cost base has grown faster than its revenue for three years and puts the chart on screen. The chart is accurate. Your peers are in the room.',
    options: [
      { key: 'A', text: 'You say the comparison needs context and offer to take it offline. You are busy until the next quarter.', score: 1 },
      { key: 'B', text: 'You accept the chart in the room. You name the two years you let it drift with reasons and commit to a date.', score: 3 },
      { key: 'C', text: 'You explain what the growth bought and which parts of it are now delivering.', score: 2 },
    ],
  },
  // ---------------------------------------------------------------------- ANASAKTI (Part 3)
  {
    id: 'ak-01',
    dimension: 'ANASAKTI',
    situation: 'An initiative you championed personally, and defended twice at board/executive level, is eighteen months in. The early signals are not there. Another year would cost a meaningful share of the innovation budget, and you are the person most identified with it.',
    options: [
      { key: 'A', text: 'You propose a reduced version for two more quarters. There is a clear decision point at the end of it.', score: 2 },
      { key: 'B', text: 'You take the case for stopping to the board or executive. You say that the original case was yours.', score: 3 },
      { key: 'C', text: 'You put the evidence up without a recommendation and let the group decide what happens.', score: 1 },
    ],
  },
  {
    id: 'ak-02',
    dimension: 'ANASAKTI',
    situation: 'A launch carrying your name has underperformed for two quarters. You can see now that the segment choice was wrong and that was your call. The team has worked hard and believes a third quarter will turn it.',
    options: [
      { key: 'A', text: 'You stop it and tell the team the segment call was yours. They had believed it would turn.', score: 3 },
      { key: 'B', text: 'You let it run while the team still believes in it. The decision is taken out of your hands at year end.', score: 1 },
      { key: 'C', text: 'You give it one more quarter with a narrower segment. You set what has to be true by the end.', score: 2 },
    ],
  },
  {
    id: 'ak-03',
    dimension: 'ANASAKTI',
    situation: 'A senior leader you appointed, against some resistance at the time, has not delivered for three quarters. You have defended the appointment more than once. Their own people have started to raise it with you.',
    options: [
      { key: 'A', text: 'You put a structured plan around them. You give it two more quarters before saying anything upward.', score: 2 },
      { key: 'B', text: 'You ask your peers for a view and have one of them pass the feedback on.', score: 1 },
      { key: 'C', text: 'You talk to the leader that it is not working and discuss the way forward openly.', score: 3 },
    ],
  },
  {
    id: 'ak-04',
    dimension: 'ANASAKTI',
    situation: 'The positioning you set two years ago was right then and it is what the unit is known for. The market has moved and a newer approach is winning. Changing means unwinding something you are publicly identified with.',
    options: [
      { key: 'A', text: 'You set out publicly why the position has changed and what replaces it. You name the original as yours.', score: 3 },
      { key: 'B', text: 'You hold the position and strengthen the case for it. There are still some takers for it.', score: 1 },
      { key: 'C', text: 'You adapt the positioning gradually without calling out the change. The shift reads as continuity.', score: 2 },
    ],
  },
  {
    id: 'ak-05',
    dimension: 'ANASAKTI',
    situation: 'Someone who helped you build the unit over six years tells you privately they want to leave. They are not unhappy with you and there is a genuine reason. You could probably persuade them to stay another year.',
    options: [
      { key: 'A', text: 'You put together what it would take to keep them another year and make the case.', score: 2 },
      { key: 'B', text: 'You help them go well. You start the succession conversation the same week.', score: 3 },
      { key: 'C', text: 'You ask them to think about it again and leave the conversation open. Nothing is planned for either outcome.', score: 1 },
    ],
  },
  {
    id: 'ak-06',
    dimension: 'ANASAKTI',
    situation: 'The idea that has most changed your unit this year came from the person you are developing to replace you. It is being attributed to your leadership in the half-year review going to the executive.',
    options: [
      { key: 'A', text: 'You correct the attribution and name them. the executive reads that paper as your result.', score: 3 },
      { key: 'B', text: 'You let the paper stand as written. The attribution is the unit\'s and that is how it is read.', score: 1 },
      { key: 'C', text: 'You let the paper stand. You credit them in your verbal remarks when you present it.', score: 2 },
    ],
  },
  {
    id: 'ak-07',
    dimension: 'ANASAKTI',
    situation: 'A business offering you started six years ago has lost money for eight quarters. It employs forty people and carries your name internally. Closing it would release capital the rest of the unit needs. Another year is affordable.',
    options: [
      { key: 'A', text: 'You give it one more year with a reduced cost base and a clear test at the end.', score: 2 },
      { key: 'B', text: 'You keep funding it from the unit\'s margin and reduce team size. The decision is taken for you when the capital is needed elsewhere.', score: 1 },
      { key: 'C', text: 'You put the closure to the board or executive yourself and come out with plan for team members rotation and exit.', score: 3 },
    ],
  },
  {
    id: 'ak-08',
    dimension: 'ANASAKTI',
    situation: 'You have run this unit for five years and you are good at it. You know you have stopped learning. Your successor is ready, the executive/board is content, and nobody is asking you to move.',
    options: [
      { key: 'A', text: 'You tell them you have stopped growing in the role and ask what comes next.', score: 3 },
      { key: 'B', text: 'You stay and keep delivering. The question comes up again in a year unchanged.', score: 1 },
      { key: 'C', text: 'You leave without giving real reasons. The details may not matter here.', score: 2 },
    ],
  },
  // ---------------------------------------------------------------------- VIVEKA (Part 4)
  {
    id: 'vk-01',
    dimension: 'VIVEKA',
    situation: 'The quarter has missed by a margin that needs explaining. One reading fits the facts well, you reached it inside a day, and it points at something outside your control. The executive wants the explanation on Thursday.',
    options: [
      { key: 'A', text: 'You give the reading as the cause. It holds up, and the underlying reason surfaces two quarters later.', score: 2 },
      { key: 'B', text: 'You say the analysis is still running and give no reading. Someone else supplies one before Thursday.', score: 1 },
      { key: 'C', text: 'You give the reading and say it is the first one that fitted. You set out what you are doing to test it.', score: 3 },
    ],
  },
  {
    id: 'vk-02',
    dimension: 'VIVEKA',
    situation: 'A measure your unit reports has improved for three quarters and is cited as evidence the strategy is working. You can see the teams have taken a different parameter and did the reporting. Nobody has asked.',
    options: [
      { key: 'A', text: 'You put the change in front of the executive, with what the measure looks like without it.', score: 3 },
      { key: 'B', text: 'You keep reporting it as defined. The question comes when someone outside the unit looks closely.', score: 1 },
      { key: 'C', text: 'You tighten the definition from next quarter. The number finds its own level over two reports.', score: 2 },
    ],
  },
  {
    id: 'vk-03',
    dimension: 'VIVEKA',
    situation: 'Your External Advisor say a capability will become the top one within two years and you should start now. Your own senior people say it is being oversold and the timing is wrong. Both have grounds and both are people you trust.',
    options: [
      { key: 'A', text: 'You agree with the Advisor’s report. They see more of the market than your own people see from inside it.', score: 2 },
      { key: 'B', text: 'You set out what each side would have to be right about and run the smallest test that separates them.', score: 3 },
      { key: 'C', text: 'You hold the current model and revisit when the market gives you a clearer reason to move.', score: 1 },
    ],
  },
  {
    id: 'vk-04',
    dimension: 'VIVEKA',
    situation: 'Someone on your leadership team has far more years in this market than you and says plainly that the direction you are setting will not work. They are respected and they have been right before. They cannot point to data.',
    options: [
      { key: 'A', text: 'You slow the direction while you think about it. The pause is read as uncertainty by the rest of the team.', score: 1 },
      { key: 'B', text: 'You hear them out and proceed as planned. Experience is not the same as evidence.', score: 2 },
      { key: 'C', text: 'You get them to name what they are seeing that you are not and take it seriously enough to test it.', score: 3 },
    ],
  },
  {
    id: 'vk-05',
    dimension: 'VIVEKA',
    situation: 'Three unrelated things have gone wrong across your unit in the past few weeks. Each has a reasonable explanation of its own. Together they could be coincidence, or something in how the unit is running. Treating it as systemic is costly and visible.',
    options: [
      { key: 'A', text: 'You act on all three immediately and make visible changes within the month.', score: 2 },
      { key: 'B', text: 'You take them as three separate incidents. The pattern is clearer next quarter and so is the cost of having waited.', score: 1 },
      { key: 'C', text: 'You treat it as a possible pattern, run a short review, and tell your leads why you are doing it.', score: 3 },
    ],
  },
  {
    id: 'vk-06',
    dimension: 'VIVEKA',
    situation: 'You have been running at full intensity for eight months. You have noticed you are deciding faster than you used to and going back over fewer things. Nothing has gone wrong yet and the results are good.',
    options: [
      { key: 'A', text: 'You note it and watch it. The pace does not change, and nothing is said to anyone.', score: 1 },
      { key: 'B', text: 'You name it as a risk to your judgement and take two things off your own list. The pace changes this month.', score: 3 },
      { key: 'C', text: 'You put a second pair of eyes on the larger decisions. The intensity stays where it is.', score: 2 },
    ],
  },
  {
    id: 'vk-07',
    dimension: 'VIVEKA',
    situation: 'A part of the business is bleeding cash, and the turnaround is eighteen months away at best. Funding it means not funding two things that would work sooner. Closing it costs ninety jobs and cannot be undone.',
    options: [
      { key: 'A', text: 'You fund it for two more quarters and set a hard test at the end of them.', score: 2 },
      { key: 'B', text: 'You keep it alive at reduced funding while you look for more information. Eighteen months becomes two years.', score: 1 },
      { key: 'C', text: 'You decide this quarter on criteria you can defend. You say plainly what the decision costs.', score: 3 },
    ],
  },
  {
    id: 'vk-08',
    dimension: 'VIVEKA',
    situation: 'You could stay and finish what you started, which would take three years. You could go now, while the unit is strong and someone is ready to take over. Neither is clearly right and both are defensible to everyone else.',
    options: [
      { key: 'A', text: 'You set out what each path costs over five years and decide inside the quarter.', score: 3 },
      { key: 'B', text: 'You carry on and let the next cycle decide it. The choice is made by circumstance.', score: 1 },
      { key: 'C', text: 'You start talking to people outside, on the basis that three more years is a long time.', score: 2 },
    ],
  },
]
