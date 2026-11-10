import type { Flag } from './types'
export function suggestedFix(flag: Flag): string[] {
  if (flag.type === 'Clash') return flag.receipts.slice(0, 2).map((_, i) => `If account ${i + 1} is correct, add a correction to the other note explaining which statement was inaccurate and what actually happened. Keep the original record and follow your organisation’s correction process.`)
  if (flag.type === 'Missing end time') return ['Add the finish time you already know. Until then this session cannot show hours.']
  if (flag.type.startsWith('Missing ')) return ['Add the missing session time you already know. Until then this session cannot show hours. Do not guess a time.']
  if (flag.type === 'Overlap') return ['These two sessions overlap. Keep both only if two workers were there. Otherwise correct the times in the note that is wrong. Do not delete a session.']
  if (flag.type === 'Next step dropped' || flag.type === 'Follow-up past deadline') return ['If the follow-up happened, add one sentence to the next note with the date and what was done. If it did not happen, add: follow-up not done yet.']
  if (flag.type === 'Thin note') return ['Write what you did, where, and the next step. Do not add hours that are not in the note.']
  if (flag.type === 'Activity and support mismatch') return ['Either change the support name to match what happened, or add the community-access detail if that is what happened. Do not change both to force a match.']
  if (flag.type === 'Possible incident') return ['Review the quoted event. If accurate, record what happened and any response you actually took. Follow your organisation’s incident process; this suggestion does not decide whether an incident is reportable.']
  return ['Check the recorded session times against what you know. Correct them only if you can confirm them. Otherwise keep the uncertainty explicit; do not invent hours.']
}
