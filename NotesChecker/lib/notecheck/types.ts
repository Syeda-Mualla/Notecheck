export type Note = {
  sourceDocumentId?: string
  id: string
  date: string
  sessionDate?: string
  startTime?: string
  endTime?: string
  text: string
  nextStep?: string
  sourceTitle: string
}
export type Receipt = { noteId: string; noteDate: string; quote: string; sourceTitle: string }
export type Flag = {
  id: string; type: string; title: string; explanation: string
  dates?: string; severity: 'red' | 'amber'; receipts: Receipt[]
  laterNoteIds?: string[]
  followUpDueDate?: string
}
export type TimelineEntry = {
  id: string; date: string; sourceTitle: string; sessionDate?: string
  startTime?: string; endTime?: string; flagged?: boolean; duration?: string
}
export type FollowUp = {
  id: string; title: string; status: 'Completion recorded' | 'Still pending' | 'Past recorded deadline' | 'Completion not recorded' | 'Not enough information'
  explanation: string; receipts: Receipt[]; laterNoteIds: string[]; dueDate?: string
}
export type AnalysisResult = {
  followUps?: FollowUp[]
  story: string; timeline: TimelineEntry[]; flags: Flag[]
  aiStatus: 'complete' | 'unavailable' | 'partial'
}
