// Conservative extraction: unknown dates/hours stay unknown.
export function parseTime(value?: string): number | null {
  if (!value) return null
  const m = value.trim().replace(/^(?:around|about|approximately|roughly|just after|just before)\s+/i, '').match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i)
  if (!m) return null
  let h = Number(m[1]); const min = Number(m[2] ?? 0)
  if (min > 59 || (m[3] ? h < 1 || h > 12 : h > 23 || !m[2])) return null
  if (m[3]) h = h % 12 + (m[3].toLowerCase() === 'pm' ? 12 : 0)
  return h * 60 + min
}
export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = new Date(value + 'T00:00:00Z')
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === value
}
export function extractDate(title: string, text: string): string | undefined {
  // Recognize explicit dates without requiring a template. Never infer a year
  // from the selected window, today's date, or Drive modification metadata.
  const dateToken = String.raw`(?:\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[/.]\d{1,2}[/.]\d{4}|\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+[ ,]+\d{4}|[A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?[,]?\s+\d{4})`
  const standalone = new RegExp(String.raw`^\s*(?:(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[, ]+)?${dateToken}\s*$`, 'i')
  const candidates = [title, ...text.split('\n').filter(l =>
    /^\s*(?:(?:session|visit|service)\s+date|date|date\s+of\s+(?:visit|session|service))\s*[:\-]/i.test(l) || standalone.test(l))]
  const found = new Set<string>()
  const months: Record<string, number> = { jan:1,january:1,feb:2,february:2,mar:3,march:3,apr:4,april:4,may:5,jun:6,june:6,jul:7,july:7,aug:8,august:8,sep:9,sept:9,september:9,oct:10,october:10,nov:11,november:11,dec:12,december:12 }
  let unclear = false
  const add = (y: string, m: number, d: number) => {
    const value = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    if (validDate(value)) found.add(value); else unclear = true
  }
  for (const line of candidates) {
    for (const m of line.matchAll(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/g)) add(m[1],Number(m[2]),Number(m[3]))
    for (const m of line.matchAll(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)[ ,]+(\d{4})\b/gi)) add(m[3],months[m[2].toLowerCase()] ?? 0,Number(m[1]))
    for (const m of line.matchAll(/\b([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?[,]?\s+(\d{4})\b/gi)) add(m[3],months[m[1].toLowerCase()] ?? 0,Number(m[2]))
    for (const m of line.matchAll(/\b(\d{1,2})[/.](\d{1,2})[/.](\d{4})\b/g)) {
      const a=Number(m[1]), b=Number(m[2])
      if(a > 12) add(m[3],b,a)
      else if(b > 12) add(m[3],a,b)
      else if(a === b) add(m[3],a,b)
      else unclear=true // 03/04 could mean March 4 or April 3.
    }
  }
  return !unclear && found.size === 1 ? [...found][0] : undefined
}
const time = String.raw`(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{1,2}:\d{2})(?!\w)`
export function extractTimes(text: string): { startTime?: string; endTime?: string } {
  const starts: string[] = []; const ends: string[] = []
  const collect = (pattern: RegExp, target: string[]) => {
    for (const m of text.matchAll(pattern)) {
      const prefix = text.slice(0,m.index).split(/[.!?\n]/).pop() ?? ''
      if (/\b(?:will|would|plan(?:ned)?|tomorrow|next|appointment|client|participant|bus|taxi)\b/i.test(prefix)) continue
      if (parseTime(m[1]) !== null) target.push(m[1].trim())
    }
  }
  const qualifier = String.raw`(?:(?:around|about|approximately|roughly|just after|just before)\s+)?`
  collect(new RegExp(String.raw`\b(?:start(?:\s+time|ed)?|arrived|arrival|popped in)(?:\s+at)?\s*:?\s*(${qualifier}${time})`, 'gi'), starts)
  collect(new RegExp(String.raw`\b(?:end(?:\s+time|ed)?|finish(?:\s+time|ed)?|departed|left|stayed (?:till|until))(?:\s+at)?\s*:?\s*(${qualifier}${time})`, 'gi'), ends)
  for (const m of text.matchAll(new RegExp(String.raw`^\s*(?:(?:session(?:\s+time)?|time|hours)\s*:?\s*)?(${time})\s*(?:–|—|-|to)\s*(${time})\s*[.,]?\s*$`, 'gim'))) {
    if (parseTime(m[1]) !== null && parseTime(m[2]) !== null) { starts.push(m[1].trim()); ends.push(m[2].trim()) }
  }
  const unique = (values: string[]) => new Set(values.map(v => parseTime(v))).size === 1 ? (values.find(isApproximateTime) ?? values[0]) : undefined
  return { startTime: unique(starts), endTime: unique(ends) }
}
export function sortNotes<T extends { sessionDate?: string; startTime?: string }>(notes: T[]): T[] {
  return [...notes].sort((a,b) => (a.sessionDate ?? '9999').localeCompare(b.sessionDate ?? '9999') || (parseTime(a.startTime) ?? 1440) - (parseTime(b.startTime) ?? 1440))
}
export function defaultWindow() {
  const now = new Date(); const end = new Date(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()))
  const start = new Date(end); start.setUTCDate(start.getUTCDate()-89)
  return { from: start.toISOString().slice(0,10), to: end.toISOString().slice(0,10) }
}

export function isApproximateTime(value?: string): boolean {
  return Boolean(value && /^(?:around|about|approximately|roughly|just after|just before)\s+/i.test(value))
}
