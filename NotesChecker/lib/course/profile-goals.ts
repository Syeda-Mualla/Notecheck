// Server-only seed data. Never import this module from a client component.
export const profileGoals: Record<string,string> = {
 ahmad: `Your goal: I would like to access respite, to increase my independence and increase my social interaction away from family.
How will you work towards this goal?
I will achieve this goal with support from my formal and informal networks to allow me to get out to a respite, learn skills and to provide a break for my family from parental duties.

Your goal: I would like to increase my social interaction by having more access to the community and working to build on my communication skills.
How will you work towards this goal?
I will practise my social skills in safe environments.
I will learn how to better control my emotions and handle difficult situations.
I will learn how to better read social situations and understand social norms more clearly.
I will implement strategies, exercises or skills recommended to me to improve my communication skills.

Your goal: I would like to increase my independence in day-to-day activities, as this will improve family relationships.
How will you work towards this goal?
I will implement strategies, exercises or skills recommended to me to improve my independence in daily living.
I will learn to handle more of my daily living tasks such as my personal care with minimal support or prompting.

Your goal: I would like to have opportunities to be able to explore my interests out in the community and to develop my vocational skillset for employment.
How will you work towards this goal?
I will achieve this goal with guidance and assistance from relevant programs.

Your goal: In the longer-term, I would like to be able to obtain my full Drivers license.
How will you work towards this goal?
I will achieve this goal with assistance from my team of allied health professionals to guide me towards the most appropriate driving lessons for me.`,
 wiremu: `Your goal: I would like to live independently in the community on my release.
How will you work towards this goal?
My allied health professional and support coordinators.

Your goal: I would like to find and keep a job so that I can own my own car.
How will you work towards this goal?
My support coordinator and allied health will help me.`,
 derek: `Your goal: I would like to work towards rebuilding my capacity to reengage in activities of interest to me, out in the community.
How will you work towards this goal?
I will achieve this goal with support from my medical & allied health team, as well as formal and informal networks to help me to reengage in going to the gym, playing basketball at the local courts and exploring other interests.

Your goal: I would like to be supported to improve and be able to maintain my mental health and wellbeing, including addressing my motivation levels and fatigue.
How will you work towards this goal?
I will achieve this goal by actively implementing strategies and plans as developed with my team of allied health professionals, which work for me.

Your goal: I would like to be supported to build on my independence with daily living activities, such as practicing safe cooking and less reliance on prompts and reminders for self-care and general everyday tasks.
How will you work towards this goal?
I will achieve this goal with support from my formal and informal networks to implement learnings and strategies at home and out in the community.

Your goal: In the longer-term, I would like to be supported to explore vocational pathways to work towards part-time/casual employment opportunities which may be possible and suitable for me.
How will you work towards this goal?
I will achieve this goal via engagement with allied health supports as well as looking into mainstream/community options to determine the best pathway for my abilities.

Your goal: In the longer-term, I would like to work towards obtaining my Learners Permit.
How will you work towards this goal?
I will achieve this goal with support from my family and allied health team to complete the relevant studying over time, in preparation for undergoing the test.`
};
// Preserve the existing deployment's passcode settings during the profile replacement.
export const profilePinSetting:Record<string,string>={ahmad:'PROFILE_PIN_ALEX',wiremu:'PROFILE_PIN_MAYA',derek:'PROFILE_PIN_JORDAN'};
export const writingGuidance = `Write natural, professional Australian English, like concise support-worker documentation. Use specific activity descriptions and clear subjects: distinguish what the participant did from what the support worker did. Connect each session to a relevant supplied goal; do not force every goal into every day. Respect long-term goals: practising a step is not proof of employment, a licence or recovery. Avoid generic praise, repeated openings, stock phrases and claims of steady improvement across invented sessions. Describe observable responses rather than assuming feelings. Vary wording only where it improves clarity. Do not invent diagnoses, clinical advice, causes of release or personal history. All invented activities, responses and times belong to a simulated draft, not verified events. Follow any supplied factual session details faithfully. Do not use another participant's goals. For a measurable goal, describe the relevant measure clearly in the simulated example without claiming verified achievement.`;
