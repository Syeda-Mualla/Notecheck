import type { Note } from './types'
import { extractDate, extractTimes } from './parse'

// Split only explicit entry headings. Dates mentioned within prose are not boundaries.
function heading(line: string): boolean {
  const s = line.trim().replace(/^#{1,6}\s*/, '')
  if (/^(?:(?:session|visit|service)\s+date|date|date\s+of\s+(?:visit|session|service))\s*[:\-]/i.test(s)) return true
  return /^(?:(?:session|visit|progress note)\s*[:\-]?\s*)?(?:(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[, ]+)?(?:\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[/.]\d{1,2}[/.]\d{2,4}|\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+(?:[ ,]+\d{4})?|[A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?(?:[,]?\s+\d{4})?)\s*$/i.test(s)
}
export function splitDocument(documentId: string, title: string, text: string): Note[] {
  if (text.length > 300000) throw new Error('Document exceeds 300,000 characters. Divide it into smaller documents.')
  const lines = text.split('\n')
  const boundaries: number[] = []
  lines.forEach((line,index) => { if(heading(line)) boundaries.push(index) })
  const make = (body: string, index?: number): Note => {
    const first = body.split('\n')[0].replace(/^#{1,6}\s*/, '')
    const sessionDate = index === undefined ? extractDate(title, body) : extractDate(first, body)
    return { id: index === undefined ? documentId : `${documentId}::entry-${index+1}`, sourceDocumentId: documentId,
      sourceTitle: index === undefined ? title : `${title} — entry ${index+1}${sessionDate ? ` (${sessionDate})` : ' (date unclear)'}`,
      date: sessionDate ?? 'Date unclear', sessionDate, text: body, ...extractTimes(body) }
  }
  if(boundaries.length < 2) {
    if(text.length > 30000) throw new Error('No separate dated entries recognised. Add a date heading to each session or divide the document.')
    return [make(text)]
  }
  // Retain introductory context with the first entry, but extract dates and times only from the entry itself.
  const sections: string[] = []
  const preamble = lines.slice(0,boundaries[0]).join('\n').trim()
  boundaries.forEach((start,i) => sections.push(lines.slice(start,boundaries[i+1] ?? lines.length).join('\n').trim()))
  if(sections.some(s=>s.length > 30000)) throw new Error('An entry exceeds 30,000 characters. Divide the entry before checking.')
  return sections.map((body,i)=> {
    const note=make(body,i)
    if(preamble && i===0) {
      note.text=preamble+'\n'+note.text
      if(note.text.length > 30000) throw new Error('Introductory text and first entry exceed 30,000 characters. Divide the document.')
    }
    return note
  })
}
