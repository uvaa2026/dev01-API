// Construct assessment (ECM module, "TCM" in product shorthand) — "Leading a
// function" variant. Served instead of the default content in
// constructScenarios.js when a respondent's registration answer
// (respondents.leadership_scope) is 'FUNCTION' — see
// constructScenarioVariants.js, which selects between this file,
// constructScenarios.js (TEAM, the default), and
// constructScenariosBusinessUnit.js (BUSINESS_UNIT) by that value.
//
// Same 32 scenario ids (up-01..vk-08), same 4 dimensions/8-per-dimension
// structure, same A/B/C 3/2/1 scoring convention as constructScenarios.js —
// only the situation text and option wording differ, written for someone
// who leads several teams or a function with budget or headcount, rather
// than a single team or project.
//
// Sourced verbatim from UVAA_2_SP_32_041126_Final4upload.docx ("Senior
// Professional, 32 Scenarios", reviewed 3 November 2026 — Indian Patent
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
// and the API copy (uvaa-api/src/data/constructScenariosFunction.js)
// together.

export const CONSTRUCT_SCENARIOS_FUNCTION = [
  // ---------------------------------------------------------------------- UPEKSHA (Part 1)
  {
    id: 'up-01',
    dimension: 'UPEKSHA',
    situation: 'Your function has just had its best quarter in three years, and the chief executive named it in the town hall this morning. By the afternoon, two of your five team leads have resigned within a week of each other. Nobody outside your function knows yet.',
    options: [
      { key: 'A', text: 'You raise both resignations with your leadership peers that same week, while the quarter is still being celebrated, and give your read on them.', score: 3 },
      { key: 'B', text: 'You push the celebration of the quarter harder across the whole function and handle the two resignations quietly through replacement hiring over the next month.', score: 2 },
      { key: 'C', text: 'You let the quarter stand as the story for now and bring the resignations up at the quarterly review, when the picture is clearer.', score: 1 },
    ],
  },
  {
    id: 'up-02',
    dimension: 'UPEKSHA',
    situation: 'You have run the same function well for four years. The work is steady, the numbers are good and nothing is wrong. You have noticed you are going with the process however you dread Monday in a way you did not before. Nobody has commented.',
    options: [
      { key: 'A', text: 'You keep delivering to exactly the same standard and wait for the next review to change the shape of the role for you.', score: 1 },
      { key: 'B', text: 'You frame it to your manager as an engagement problem rather than a workload one and explore what else you could do.', score: 3 },
      { key: 'C', text: 'You take on two new initiatives alongside the existing work, filling the time with something that feels new to you for a while.', score: 2 },
    ],
  },
  {
    id: 'up-03',
    dimension: 'UPEKSHA',
    situation: 'You have been told to take fifteen percent out of your function. One of your two teams has delivered strongly, and the other has struggled through a bad year that was not entirely of its own making. Both leads expect the cut to land on the other.',
    options: [
      { key: 'A', text: 'You take most of the cut from the team that struggled through the year and tell its lead that the figures made the decision.', score: 2 },
      { key: 'B', text: 'You split the cut evenly between the two teams, which neither of them can argue with, and let each lead work out the detail.', score: 1 },
      { key: 'C', text: 'You apportion the cut on what each team can deliver next year, not on the year just gone, and give both leads the full reasoning face to face.', score: 3 },
    ],
  },
  {
    id: 'up-04',
    dimension: 'UPEKSHA',
    situation: 'A senior leader praises your function\'s delivery in a forum, then adds that the quality of your reporting is below what the organisation needs. You think the criticism is partly fair. Your team leads are in the room and are waiting to see what you do.',
    options: [
      { key: 'A', text: 'You accept the fair part in the room, say which part you do not accept, and give a date to come back.', score: 3 },
      { key: 'B', text: 'You thank the leader for the recognition and take the documentation point offline, where the rest of the room cannot follow it.', score: 1 },
      { key: 'C', text: 'You defend the documentation standard in front of the room, pointing to the resourcing your function was given to produce it.', score: 2 },
    ],
  },
  {
    id: 'up-05',
    dimension: 'UPEKSHA',
    situation: 'Appraisal ratings are due. One of your team leads has been with you nine years, is trusted by everyone, and holds the function together on the difficult weeks. Measured against this year\'s bar, they sit below two newer people. Both of those things are true.',
    options: [
      { key: 'A', text: 'You rate them on their contribution over the nine years. The two newer people see the gap and draw their own conclusions.', score: 2 },
      { key: 'B', text: 'You rate on capability. In the conversation you say what the nine years have been worth, and what it does not change.', score: 3 },
      { key: 'C', text: 'You place them in the middle where nobody asks questions and keep the conversation general.', score: 1 },
    ],
  },
  {
    id: 'up-06',
    dimension: 'UPEKSHA',
    situation: 'The person you have been developing as your successor presented to the executive committee this week and was visibly better at it than you are. Two executives mentioned it to you afterwards, warmly. Your own next role has not been decided.',
    options: [
      { key: 'A', text: 'You praise them warmly to the two executives and make no change to who presents or when, leaving the schedule as it stands.', score: 1 },
      { key: 'B', text: 'You carry on developing them on your own timeline, and make the next executive presentation yourself, as you had always planned to.', score: 2 },
      { key: 'C', text: 'You schedule them in front of the executive committee again next quarter, and record in your own review that they are ready.', score: 3 },
    ],
  },
  {
    id: 'up-07',
    dimension: 'UPEKSHA',
    situation: 'Your largest client has been satisfied for three years and says so at every review. Your team has proposed nothing new to them in that time. A competitor has just approached them with something your function could have built two years ago.',
    options: [
      { key: 'A', text: 'You surface the gap yourself at the next client review, before they raise the competitor with you.', score: 3 },
      { key: 'B', text: 'You commission a rapid response to the competitor\'s proposal and take it to the client yourself within the month.', score: 2 },
      { key: 'C', text: 'You keep the relationship running exactly as it is and wait to see whether the client raises the competitor with you first.', score: 1 },
    ],
  },
  {
    id: 'up-08',
    dimension: 'UPEKSHA',
    situation: 'Two people you developed have been promoted into roles at the level above you this year. Your own move has been deferred twice, with a good reason each time. Your function\'s results are strong, and your manager says your time will come.',
    options: [
      { key: 'A', text: 'You congratulate both of them and carry on, taking your manager\'s assurance at face value until the next cycle comes round.', score: 1 },
      { key: 'B', text: 'You congratulate both publicly, then get from your manager in writing what has to change for your own move, and by when.', score: 3 },
      { key: 'C', text: 'You ask your manager immediately to put your case to the committee again, with your results since the last deferral set out in full.', score: 2 },
    ],
  },
  // ---------------------------------------------------------------------- ANUVIGNA (Part 2)
  {
    id: 'an-01',
    dimension: 'ANUVIGNA',
    situation: 'Two directors, neither of whom you report to and who do not report to each other, have given your function conflicting instructions for the same quarter. Both say theirs is the priority. Both have escalated once already. The work starts on Monday.',
    options: [
      { key: 'A', text: 'You follow the instruction from the director with the more influence and inform the other one once the work is already under way.', score: 2 },
      { key: 'B', text: 'You start on work that partly satisfies both of them and raise the conflict only if one of them escalates it again.', score: 1 },
      { key: 'C', text: 'You get both in a common meeting, lay out what each instruction costs the other, and share the plan of action for a decision.', score: 3 },
    ],
  },
  {
    id: 'an-02',
    dimension: 'ANUVIGNA',
    situation: 'The executive committee has decided to centralise a capability your function built over three years. You argued against it in the room and lost. You are now asked to announce it to your teams on Monday as the right decision for the organisation.',
    options: [
      { key: 'A', text: 'You announce the decision, acknowledge that you argued against it and on what grounds, and commit to making it work.', score: 3 },
      { key: 'B', text: 'You announce it as agreed and send any questions about your own view through to the executive sponsor to answer.', score: 1 },
      { key: 'C', text: 'You announce it as the organisation\'s decision, make clear it was not yours, and leave your teams to draw their own conclusions.', score: 2 },
    ],
  },
  {
    id: 'an-03',
    dimension: 'ANUVIGNA',
    situation: 'Your manager asks your function to go live with a change that has not completed its compliance check. They say the risk is small, the deadline is external, and that they have signed it off. Your compliance lead has already raised a concern in writing.',
    options: [
      { key: 'A', text: 'You go live as you were instructed and record your own concern by email to your manager on the same day it happens.', score: 2 },
      { key: 'B', text: 'You take your compliance lead\'s written concern to your manager and the risk owner and have the sign-off confirmed in writing.', score: 3 },
      { key: 'C', text: 'You go live as you were instructed. The sign-off came from above you, and the accountability for it sits there.', score: 1 },
    ],
  },
  {
    id: 'an-04',
    dimension: 'ANUVIGNA',
    situation: 'In a steering group a peer director says your function\'s analysis is unreliable and gives one example where they are right. Four other directors are present. The example is one of six pieces of work, and the other five hold up well.',
    options: [
      { key: 'A', text: 'You say that you will review all six and come back on it, then move the steering group on to the next item.', score: 1 },
      { key: 'B', text: 'You challenge the peer\'s single example and ask what evidence they have about the quality of the rest of the work.', score: 2 },
      { key: 'C', text: 'You concede the example in the room, take the other five point by point, and offer the full set for review afterwards.', score: 3 },
    ],
  },
  {
    id: 'an-05',
    dimension: 'ANUVIGNA',
    situation: 'HR shares the themes from three exit interviews in your function this quarter. All three name your leadership style as a contributing factor. The themes are general and no examples are given. Your manager has already seen the same summary.',
    options: [
      { key: 'A', text: 'You ask HR for specific examples to understand the context, then open the themes with your own leads and hear where they see it.', score: 3 },
      { key: 'B', text: 'You ask HR for the names and the detail and prepare a written response setting out your own view.', score: 2 },
      { key: 'C', text: 'You note the themes, treat three cases as a small sample, and wait to see whether the pattern repeats next quarter.', score: 1 },
    ],
  },
  {
    id: 'an-06',
    dimension: 'ANUVIGNA',
    situation: 'A peer has twice described your function\'s delays in executive meetings in a way that leaves out the dependency their own team failed to deliver. You were not in the room either time. A third meeting is next week, and you will be there.',
    options: [
      { key: 'A', text: 'You let it pass a third time and rely on your function\'s results to correct the impression over the coming quarters.', score: 1 },
      { key: 'B', text: 'You go to the peer before the meeting with what you have heard, and what you will do if it recurs.', score: 3 },
      { key: 'C', text: 'You prepare the evidence on the dependency and present it in the meeting if the subject is raised a third time.', score: 2 },
    ],
  },
  {
    id: 'an-07',
    dimension: 'ANUVIGNA',
    situation: 'At a quarterly review the client\'s executive sponsor says your function has become slow and risk-averse and asks directly whether you still have the right leadership in place. Two of your leads are in the room. Your own manager is not.',
    options: [
      { key: 'A', text: 'You set out the governance your function has added and why the pace has changed, with the delivery record to support it.', score: 2 },
      { key: 'B', text: 'You acknowledge the concern, say that you will take it away and look into it, and move the review on to the next item.', score: 1 },
      { key: 'C', text: 'You get the two examples from the sponsor, take them without defending your leads in the room, and commit to a date to come back.', score: 3 },
    ],
  },
  {
    id: 'an-08',
    dimension: 'ANUVIGNA',
    situation: 'In a leadership meeting the chief financial officer says your function\'s cut will be twenty percent, not the fifteen you had planned for, and asks you to confirm now. Your peers have already confirmed theirs. No reason is given for the change.',
    options: [
      { key: 'A', text: 'You hold your answer until the end of the day. Then you talk to the finance chief what twenty percent removes that fifteen does not.', score: 3 },
      { key: 'B', text: 'You say the figure needs working through properly and leave the meeting without giving an answer either way.', score: 1 },
      { key: 'C', text: 'You confirm the twenty percent there in the meeting and work out afterwards where in the function it will come from.', score: 2 },
    ],
  },
  // ---------------------------------------------------------------------- ANASAKTI (Part 3)
  {
    id: 'ak-01',
    dimension: 'ANASAKTI',
    situation: 'A capability you designed and championed four years ago is now the reason three teams miss their dates. It still works as specified. A newer approach would replace it within two quarters. You are the person most associated with it.',
    options: [
      { key: 'A', text: 'You call for a review of the newer approach and let the findings of that review make the case for any change.', score: 2 },
      { key: 'B', text: 'You bring the replacement proposal to the leadership group yourself, naming what you built as the constraint on three teams.', score: 3 },
      { key: 'C', text: 'You fund improvements to the existing capability and leave the question of replacing it entirely to whoever follows you.', score: 1 },
    ],
  },
  {
    id: 'ak-02',
    dimension: 'ANASAKTI',
    situation: 'Your function\'s strongest result this year came from a team lead\'s idea, which you backed against some early resistance. The chief executive has asked you to present it at the annual leadership conference. The invitation names you alone.',
    options: [
      { key: 'A', text: 'You present it as the function\'s result, as you were invited to do, and credit the team generally at the close.', score: 1 },
      { key: 'B', text: 'You present it yourself and name the team lead along with their photograph in your slide.', score: 2 },
      { key: 'C', text: 'You get the team lead onto the platform with you if allowed and ask him to present their own part.', score: 3 },
    ],
  },
  {
    id: 'ak-03',
    dimension: 'ANASAKTI',
    situation: 'Your successor is ready a year earlier than you planned. Your own next move has not been confirmed. If you say they are ready now, the organisation is likely to move them into your role before you have somewhere to go.',
    options: [
      { key: 'A', text: 'You confirm to your manager that they are ready now, accepting your own position may settle after theirs.', score: 3 },
      { key: 'B', text: 'You tell your manager they will be ready in about few months and use that time to secure your own next move first.', score: 2 },
      { key: 'C', text: 'You keep developing them quietly and say nothing about readiness until your own next move has been confirmed.', score: 1 },
    ],
  },
  {
    id: 'ak-04',
    dimension: 'ANASAKTI',
    situation: 'A function next to yours is visibly struggling and you can see why. It is not your area, and nobody has asked you. Helping would cost you two of your own people for a month. Saying nothing costs you nothing, and the comparison makes your function look better.',
    options: [
      { key: 'A', text: 'You keep out of it and carry on. The comparison does your function no harm at all.', score: 1 },
      { key: 'B', text: 'You offer the two people and tell your peer what you are seeing, without going above them', score: 3 },
      { key: 'C', text: 'You raise what you are seeing with your own manager, so that someone acts on it.', score: 2 },
    ],
  },
  {
    id: 'ak-05',
    dimension: 'ANASAKTI',
    situation: 'The cut has to come from one of three programmes. Two belong to your team leads. The third is yours, the one you started and have presented to the board twice. On the numbers, yours has the weakest case this year.',
    options: [
      { key: 'A', text: 'You reduce the scope of your own programme and take a smaller cut from each of the other two as well.', score: 2 },
      { key: 'B', text: 'You put all three cases to your manager without a recommendation and implement whichever way it is decided.', score: 1 },
      { key: 'C', text: 'You cut your own programme, carry the reasoning to the board yourself, and keep both leads\' programmes running.', score: 3 },
    ],
  },
  {
    id: 'ak-06',
    dimension: 'ANASAKTI',
    situation: 'Someone you recruited, developed and promoted over six years has resigned to join a competitor. They have asked you for a reference. You believe they are making a mistake, and you are also genuinely sorry to be losing them.',
    options: [
      { key: 'A', text: 'You give a formal, factual reference through HR, and keep your own view of the move entirely to yourself throughout.', score: 1 },
      { key: 'B', text: 'You give the reference honestly and without reservation and tell them your own view of the move once, briefly.', score: 3 },
      { key: 'C', text: 'You give the reference and use the conversation to set out why staying here would serve them better in the long run.', score: 2 },
    ],
  },
  {
    id: 'ak-07',
    dimension: 'ANASAKTI',
    situation: 'Six months ago, you made the case for a particular approach for a client, and the team went with your recommendation. Limitations have surfaced that are now creating real problems. A colleague mentioned to you quietly that there is a better alternative and asked whether it is worth raising.',
    options: [
      { key: 'A', text: 'You write up the limitations yourself, including the ones you did not anticipate, and take it to your client recommending the alternative.', score: 3 },
      { key: 'B', text: 'You write up the limitations and set out what it would take to work through them. The switching cost is real and that is the case you make.', score: 2 },
      { key: 'C', text: 'You raise the limitations with your client as something the team should look at together. You do not put forward a recommendation either way.', score: 1 },
    ],
  },
  {
    id: 'ak-08',
    dimension: 'ANASAKTI',
    situation: 'A position your function took publicly, which you signed, rests on an assumption that was never checked. The error is yours to own or to leave with the analyst who prepared it. Only three people know how it happened.',
    options: [
      { key: 'A', text: 'You issue the correction through the usual channel and let the record show where the original analysis came from.', score: 1 },
      { key: 'B', text: 'You correct it publicly and also explain the process failure that allowed the unchecked assumption to get through.', score: 2 },
      { key: 'C', text: 'You correct it publicly in your own name and make no reference at all to who prepared the analysis.', score: 3 },
    ],
  },
  // ---------------------------------------------------------------------- VIVEKA (Part 4)
  {
    id: 'vk-01',
    dimension: 'VIVEKA',
    situation: 'You are already at capacity. Your unit head asks you to lead on something additional. Not urgent, clearly framed as an opportunity, and they want you to say yes. If you take it, something you have already committed to will slip by a few weeks. The person waiting on that does not know yet.',
    options: [
      { key: 'A', text: 'You tell them what it would cost: which commitment slips, by how long, and who needs telling. You would be the one who missed it.', score: 3 },
      { key: 'B', text: 'You take it on and absorb it. The existing commitment slips and you work late to pull it back, and the person waiting is never told.', score: 1 },
      { key: 'C', text: 'You say you cannot take it on at the moment. You explain the load without going into what sits behind it.', score: 2 },
    ],
  },
  {
    id: 'vk-02',
    dimension: 'VIVEKA',
    situation: 'Your largest account is satisfied, profitable and asks for nothing new from one year to the next. Investing in innovation there would cost this year\'s margin for a benefit you cannot demonstrate. Doing nothing is defensible for at least two more years.',
    options: [
      { key: 'A', text: 'You keep the account running just as it is and revisit the question when the client\'s own strategy changes.', score: 1 },
      { key: 'B', text: 'You make the case to your manager with the benefit stated as uncertain, and name what would disprove it.', score: 3 },
      { key: 'C', text: 'You fund a small innovation effort out of your own discretionary budget and keep it off the main plan for now.', score: 2 },
    ],
  },
  {
    id: 'vk-03',
    dimension: 'VIVEKA',
    situation: 'Five people have left your function this quarter, against two in a normal quarter. Three gave different reasons and two gave none. It could be a market effect or something inside the function. Acting as though it is systemic would be costly and visible.',
    options: [
      { key: 'A', text: 'You act immediately on the three stated reasons and make visible changes right across the function within the month.', score: 2 },
      { key: 'B', text: 'You note the numbers against the wider market trend and wait for next quarter before drawing any conclusion.', score: 1 },
      { key: 'C', text: 'You treat it as a possible pattern, call for a short review, and tell your leads exactly why you are doing it.', score: 3 },
    ],
  },
  {
    id: 'vk-04',
    dimension: 'VIVEKA',
    situation: 'Your manager asks you to interpret a contract clause in a way that favours your organisation. It is arguable, the client would probably accept it, and your legal team says it sits within the range. It is not what both sides meant at signing.',
    options: [
      { key: 'A', text: 'You flag the gap between wording and intent to your manager and have the client\'s view taken first.', score: 3 },
      { key: 'B', text: 'You apply the interpretation, as legal have confirmed that it sits within the acceptable range for the clause.', score: 1 },
      { key: 'C', text: 'You apply the interpretation as you were asked and record your own reservation about it in the contract file.', score: 2 },
    ],
  },
  {
    id: 'vk-05',
    dimension: 'VIVEKA',
    situation: 'You have been flat for several months. It could be the role, which has not changed in four years, or something outside work, or simply a phase. You could change the role, change employer, or wait. None of the three is clearly right.',
    options: [
      { key: 'A', text: 'You start looking at roles elsewhere, on the basis that four years in the one function is long enough for anyone.', score: 2 },
      { key: 'B', text: 'You test it before deciding anything, taking on one genuinely different piece of work for a full quarter.', score: 3 },
      { key: 'C', text: 'You carry on as you are and wait for it to pass in time, as it has done before now.', score: 1 },
    ],
  },
  {
    id: 'vk-06',
    dimension: 'VIVEKA',
    situation: 'Two candidates could succeed you. One is reliable and would hold the function steady. The other is stronger but would change things you built and may not stay if passed over. Your manager asks for your recommendation this week.',
    options: [
      { key: 'A', text: 'You put both of them forward with equal weight, and leave the final choice to your manager and to HR.', score: 1 },
      { key: 'B', text: 'You recommend the reliable candidate and set out the continuity risk that the other one would bring with them.', score: 2 },
      { key: 'C', text: 'You back the stronger candidate for the role and name the things about your own work that they would probably change.', score: 3 },
    ],
  },
  {
    id: 'vk-07',
    dimension: 'VIVEKA',
    situation: 'A team lead has been steady for two years with no growth. It may be the person, or the role, which has not changed in that time, or that they have gone as far as they want to. You cannot tell which from where you sit.',
    options: [
      { key: 'A', text: 'You take all three possibilities to them directly in their next one-to-one and decide together what follows.', score: 3 },
      { key: 'B', text: 'You change the shape of the role to test whether the role itself was the constraint and watch it over two quarters.', score: 2 },
      { key: 'C', text: 'You keep them exactly where they are and treat steady delivery as an acceptable outcome for someone at this stage.', score: 1 },
    ],
  },
  {
    id: 'vk-08',
    dimension: 'VIVEKA',
    situation: 'You must propose your function\'s cut by Friday. You have about half the information on what each team will be asked to deliver next year. Waiting for the rest would take three weeks, and the decision would then be made without you.',
    options: [
      { key: 'A', text: 'You ask for the three extra weeks and accept that the cut may be decided for your function if the deadline holds.', score: 1 },
      { key: 'B', text: 'You propose whichever cut is easiest to defend on the information you have and adjust it later if it proves wrong.', score: 2 },
      { key: 'C', text: 'You propose by Friday on what you have, record the assumptions you could not test, and set a date to revise them.', score: 3 },
    ],
  },
]
