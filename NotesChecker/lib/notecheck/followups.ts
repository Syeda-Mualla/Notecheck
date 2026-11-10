import type { Note, Receipt, FollowUp, Flag } from './types'
import { extractDate, validDate } from './parse'

// The model links equivalent wording; code owns chronology and displayed status.
export function validateFollowUps(input: unknown, notes: Note[]): { items: FollowUp[]; rejected: number } {
  if (!Array.isArray(input)) return { items: [], rejected: 1 }
  const items: FollowUp[] = []; let rejected = Math.max(0, input.length - 100)
  const seen = new Set<string>()
  const receipt = (raw: any): Receipt | undefined => {
    const n = notes.find(n => n.id === raw?.noteId)
    return n && typeof raw?.quote === 'string' && raw.quote.trim() && n.text.includes(raw.quote)
      ? { noteId: n.id, noteDate: n.date, sourceTitle: n.sourceTitle, quote: raw.quote } : undefined
  }
  for (const raw of input.slice(0, 100)) {
    const promise = receipt(raw?.promise)
    if (!promise || !['completed','pending','none','uncertain'].includes(raw?.evidenceKind) || !Array.isArray(raw?.evidence)) { rejected++; continue }
    const key = promise.noteId + ':' + promise.quote
    if (seen.has(key)) { rejected++; continue }
    const evidence = raw.evidence.map(receipt)
    if (evidence.some((e: Receipt | undefined) => !e) || (['completed','pending'].includes(raw.evidenceKind) && !evidence.length) || (raw.evidenceKind === 'none' && evidence.length)) { rejected++; continue }
    seen.add(key)
    const source = notes.find(n => n.id === promise.noteId)!
    const later = notes.filter(n => n.sessionDate && source.sessionDate && n.sessionDate > source.sessionDate)
    const chronologicallyValid = evidence.every((e: Receipt) => later.some(n => n.id === e.noteId))
    // Establish a deadline from quoted wording, never the current calendar date.
    let dueDate: string | undefined
    if (/\bnext visit\b/i.test(promise.quote)) dueDate = later.map(n => n.sessionDate!).sort()[0]
    else if (typeof raw.dueDate === 'string' && validDate(raw.dueDate) && raw.dueQuote && typeof raw.dueQuote === 'string' && promise.quote.includes(raw.dueQuote) && extractDate(raw.dueQuote, '') === raw.dueDate) dueDate = raw.dueDate
    if (dueDate && source.sessionDate && dueDate < source.sessionDate) dueDate = undefined
    const afterDeadline = dueDate ? later.filter(n => n.sessionDate! > dueDate!) : []
    const unknownDates = notes.some(n => !n.sessionDate)
    let status: FollowUp['status'] = 'Not enough information'
    let explanation = 'The supplied notes do not establish the timing or outcome. Review the promise and any related evidence.'
    if (source.sessionDate && chronologicallyValid) {
      if (raw.evidenceKind === 'completed') {
        status = 'Completion recorded'; explanation = 'A later note records completion of the promised action. Review both quotes to confirm they refer to the same action.'
      } else if (raw.evidenceKind === 'pending') {
        const pendingPastDue = evidence.some((e: Receipt) => afterDeadline.some(n => n.id === e.noteId))
        status = pendingPastDue ? 'Past recorded deadline' : 'Still pending'
        explanation = pendingPastDue ? 'A note after the recorded deadline still describes the action as pending. This does not establish its current real-world status.' : 'A later note records that this action is still pending; it has not been treated as a missing follow-up.'
      } else if (raw.evidenceKind === 'none' && dueDate && afterDeadline.length && !unknownDates) {
        status = 'Completion not recorded'; explanation = 'The supplied later notes extend beyond the recorded deadline, but no completion evidence was identified. This does not prove the action did not happen.'
      }
    }
    items.push({ id: `followup-${items.length}`, title: 'Recorded next step', status, explanation, receipts: [promise, ...evidence], laterNoteIds: later.map(n => n.id), dueDate })
  }
  return { items, rejected }
}

export function followUpFlags(items: FollowUp[]): Flag[] {
  return items.filter(item => ['Past recorded deadline','Completion not recorded'].includes(item.status)).map(item => ({
    id: item.id, type: item.status === 'Completion not recorded' ? 'Next step dropped' : 'Follow-up past deadline',
    title: item.status === 'Completion not recorded' ? 'Follow-up completion is not recorded in later notes' : 'A later note records a pending action past its deadline',
    explanation: item.explanation, severity: 'amber', receipts: item.receipts,
    dates: item.receipts.map(r => r.noteDate).join(' · '), laterNoteIds: item.laterNoteIds, followUpDueDate: item.dueDate,
  }))
}
