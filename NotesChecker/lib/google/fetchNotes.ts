import { splitDocument } from '@/lib/notecheck/split-document'
import type { Note } from '@/lib/notecheck/types'
import { sortNotes } from '@/lib/notecheck/parse'
import type { PickedFile } from './picker'
export async function fetchAndBuildNotes(accessToken: string, files: PickedFile[], window: { from: string; to: string }): Promise<{ notes: Note[]; skipped: { name: string; reason: string }[] }> {
  const notes: Note[] = [], skipped: { name: string; reason: string }[] = []
  if (files.length > 100) throw new Error('Choose at most 100 files per check.')
  for (const file of files) {
    try {
      if (file.mimeType !== 'application/vnd.google-apps.document') throw new Error('Not a Google Doc (PDFs are skipped).')
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}/export?mimeType=text/plain`, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(15000) })
      if (!res.ok) throw new Error(res.status === 401 ? 'Google access expired. Sign in again.' : `Could not read file (${res.status}).`)
      const text = (await res.text()).trim()
      if (!text) throw new Error('Empty document.')
      const entries = splitDocument(file.id, file.name, text)
      for (const entry of entries) {
        if (entry.sessionDate && (entry.sessionDate < window.from || entry.sessionDate > window.to)) {
          skipped.push({name: entry.sourceTitle, reason: 'Entry outside the selected date window.'})
        } else notes.push(entry)
      }
    } catch (err) { skipped.push({ name: file.name, reason: err instanceof Error ? err.message : 'Could not read file.' }) }
  }
  if (notes.length > 100) throw new Error('More than 100 entries were found. Select a shorter date range or fewer documents.')
  if (new TextEncoder().encode(JSON.stringify({notes,participantLabel:' '.repeat(100)})).length > 450000) throw new Error('The selected entries are too large for one check. Select a shorter date range or fewer documents.')
  return { notes: sortNotes(notes), skipped }
}
