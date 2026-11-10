import type { Note, Flag, Receipt, TimelineEntry } from './types'
import { parseTime, sortNotes, isApproximateTime } from './parse'
export { parseTime } from './parse'
const receipt = (n: Note): Receipt => ({ noteId: n.id, noteDate: n.date, quote: n.text, sourceTitle: n.sourceTitle })
function interval(n: Note): [number, number] | null {
  if (isApproximateTime(n.startTime) || isApproximateTime(n.endTime)) return null
  const s = parseTime(n.startTime), e = parseTime(n.endTime)
  return s !== null && e !== null && e > s ? [s,e] : null
}
function overlap(a: Note, b: Note) {
  const x = interval(a), y = interval(b)
  return Boolean(a.sessionDate && a.sessionDate === b.sessionDate && x && y && x[0] < y[1] && y[0] < x[1])
}
export function buildTimeline(notes: Note[]): TimelineEntry[] {
  return sortNotes(notes).map(n => {
    const times = interval(n), diff = times ? times[1]-times[0] : 0
    return { id: n.id, date: n.date, sourceTitle: n.sourceTitle, sessionDate: n.sessionDate, startTime: n.startTime, endTime: n.endTime,
      flagged: !times || notes.some(other => other.id !== n.id && overlap(n, other)),
      duration: times ? `${Math.floor(diff/60) ? `${Math.floor(diff/60)}h` : ''}${diff%60 ? ` ${diff%60}m` : ''}`.trim() : undefined }
  })
}
export function runCodeChecks(notes: Note[]): Flag[] {
  const flags: Flag[] = []
  for (const n of notes) {
    const start = parseTime(n.startTime), end = parseTime(n.endTime)
    if (start === null || end === null) {
      const missing = start === null && end === null ? 'start and end times' : start === null ? 'start time' : 'end time'
      flags.push({ id: `missing-time-${n.id}`, type: `Missing ${missing}`, title: n.sessionDate ? `Missing ${missing} on ${n.date}.` : `Missing ${missing} in ${n.sourceTitle}.`, explanation: 'A reviewer may ask how long this support lasted. The note does not establish the session hours.', dates: n.date, severity: 'amber', receipts: [receipt(n)] })
    } else if (isApproximateTime(n.startTime) || isApproximateTime(n.endTime)) {
      flags.push({ id: `approx-time-${n.id}`, type: 'Approximate session times', title: `Session times are approximate in ${n.sourceTitle}.`, explanation: 'The note uses approximate timing. We preserve that wording and do not calculate exact hours or establish an overlap from it.', dates: n.date, severity: 'amber', receipts: [receipt(n)] })
    } else if (end <= start) {
      flags.push({ id: `invalid-time-${n.id}`, type: 'Unclear time range', title: `Check the session times on ${n.date}.`, explanation: 'The finish is not after the start. We cannot infer an overnight session or calculate its duration.', dates: n.date, severity: 'amber', receipts: [receipt(n)] })
    }
    const body = n.text.replace(/^.*(?:date|start|end|time|worker)\s*:.*$/gim, '').trim()
    if (body.length < 18) flags.push({ id: `thin-${n.id}`, type: 'Thin note', title: 'A reviewer cannot see what support was delivered.', explanation: 'There is very little detail about what happened in this session.', dates: n.date, severity: 'amber', receipts: [receipt(n)] })
  }
  for (let i=0; i<notes.length; i++) for (let j=i+1; j<notes.length; j++) {
    const a=notes[i], b=notes[j]
    if (overlap(a,b)) flags.push({ id: `overlap-${a.id}-${b.id}`, type: 'Overlap', title: `Two sessions overlap on ${a.date}.`, explanation: 'A reviewer may ask about two sessions recorded in the same time window. We do not delete or merge either session.', dates: a.date, severity: 'amber', receipts: [receipt(a),receipt(b)] })
  }
  return flags
}
