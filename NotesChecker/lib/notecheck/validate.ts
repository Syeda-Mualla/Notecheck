import type { Note, Flag, Receipt } from './types'
import { validDate } from './parse'
export function validateAIFlags(input: unknown, notes: Note[]): Flag[] {
  if (!Array.isArray(input)) return []
  const output: Flag[] = []
  for (const raw of input.slice(0,100)) {
    if (!raw || !['Clash','Next step dropped','Activity and support mismatch','Possible incident'].includes(raw.type) || typeof raw.title !== 'string' || typeof raw.explanation !== 'string' || !Array.isArray(raw.receipts) || !raw.receipts.length) continue
    const receipts: Receipt[] = []
    for (const r of raw.receipts) {
      const n = notes.find(n => n.id === r?.noteId)
      if (!n || typeof r.quote !== 'string' || !r.quote.trim() || !n.text.includes(r.quote)) break
      receipts.push({ noteId: n.id, noteDate: n.date, sourceTitle: n.sourceTitle, quote: r.quote })
    }
    if (receipts.length !== raw.receipts.length) continue
    if (raw.type === 'Clash' && (new Set(receipts.map(r => r.noteId)).size < 2 || receipts.some(r => !notes.find(n => n.id === r.noteId)?.sessionDate))) continue
    if (raw.type === 'Activity and support mismatch') {
      // Require the named support and activity as separate body quotes in one note.
      if (receipts.length < 2 || new Set(receipts.map(r => r.noteId)).size !== 1 || receipts[0].quote === receipts[1].quote) continue
    }
    let laterNoteIds: string[] | undefined
    if (raw.type === 'Next step dropped') {
      const promise = notes.find(n => n.id === receipts[0].noteId)!
      const due = raw.followUpDueDate
      if (!promise.sessionDate || typeof due !== 'string' || !validDate(due) || due < promise.sessionDate || !Array.isArray(raw.laterNoteIds) || !raw.laterNoteIds.length) continue
      laterNoteIds = [...new Set<string>(raw.laterNoteIds)]
      if (!laterNoteIds.every(id => notes.some(n => n.id === id && n.sessionDate && n.sessionDate > promise.sessionDate! && n.sessionDate >= due))) continue
    }
    output.push({ id: `ai-${output.length}`, type: raw.type, title: raw.type === 'Possible incident' ? 'A note describes a possible incident' : raw.type === 'Activity and support mismatch' ? 'Review the named support and described activity' : raw.title.slice(0,250), explanation: raw.type === 'Possible incident' ? 'Review this passage in context and follow your organisation’s process if needed. This flag does not determine reporting obligations.' : raw.type === 'Activity and support mismatch' ? 'The named support and activity may need clarification. Review the quoted wording; this is not a claim eligibility decision.' : raw.explanation.slice(0,1000), dates: [...new Set(receipts.map(r=>r.noteDate))].join(' · '), severity: raw.type === 'Clash' ? 'red' : 'amber', receipts, laterNoteIds, followUpDueDate: raw.followUpDueDate })
  }
  return output
}

// Model summaries are withheld when associated findings failed validation.
// Replace internal IDs with human-readable source titles before display.
export function displayStory(story: string, notes: Note[], hadRejectedFlags: boolean): string {
  if (hadRejectedFlags) return 'The summary was withheld because some AI findings could not be verified against the notes. Read the source notes and the verified flags below.'
  // v1 has no goal-input feature. Remove goal commentary from the displayed
  // story, rather than relying only on the model to obey the prompt.
  // Conservative sentence filtering may shorten the story; never pad with facts.
  const sentences = story.match(/[^.!?]+(?:[.!?]+|$)/g) ?? []
  let text = sentences.filter(sentence => !/\b(?:goals?|objectives?|clashes?|conflicts?|inconsistenc(?:y|ies)|contradictions?|incidents?)\b/i.test(sentence)).join('').trim()
  if (!text) return 'No activity summary is available. Review the source notes and verified flags.' 
  for (const n of [...notes].sort((a,b) => b.id.length-a.id.length)) {
    const escaped = n.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    text = text.replace(new RegExp(`(?<![A-Za-z0-9_-])${escaped}(?![A-Za-z0-9_-])`, 'g'), () => n.sourceTitle)
  }
  return text
}
