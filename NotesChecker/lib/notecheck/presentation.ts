import type { Flag } from './types'
export const categories = [
  { name: 'Times', colour: '#945d12', background: '#fff6df' },
  { name: 'Overlaps', colour: '#ad4523', background: '#fff0e9' },
  { name: 'Inconsistencies', colour: '#a63250', background: '#fff0f4' },
  { name: 'Follow-ups', colour: '#6346a0', background: '#f4efff' },
  { name: 'Documentation', colour: '#24688a', background: '#edf7fc' },
  { name: 'Possible incidents', colour: '#9a3434', background: '#fff0ef' },
] as const
export function categoryFor(type: string) {
  const index = type === 'Overlap' ? 1 : type === 'Clash' ? 2 : ['Next step dropped','Follow-up past deadline'].includes(type) ? 3 : type === 'Possible incident' ? 5 : ['Thin note','Activity and support mismatch'].includes(type) ? 4 : 0
  return categories[index]
}
export function flagExplanation(flag: Flag): string {
  if(flag.type.startsWith('Missing ')) return 'Add the missing start or finish time if known.'
  if(flag.type === 'Approximate session times') return 'Session times are approximate. Confirm the start and finish times if known.'
  if(flag.type === 'Unclear time range') return 'The finish time is not after the start time. Check both entries.'
  if(flag.type === 'Overlap') return 'These sessions share part of the same time window. Check the times and workers involved.'
  if(flag.type === 'Thin note') return 'Add detail about the support provided and what happened during the visit.'
  if(flag.type === 'Next step dropped') return 'Later notes do not record completion of this action. Check whether it was followed up.'
  if(flag.type === 'Follow-up past deadline') return 'A later note records this action as pending after its recorded deadline.'
  if(flag.type === 'Activity and support mismatch') return 'Check that the support name matches the activity described.'
  if(flag.type === 'Possible incident') return 'This passage describes an event that may need review under your incident process.'
  return flag.explanation
}
