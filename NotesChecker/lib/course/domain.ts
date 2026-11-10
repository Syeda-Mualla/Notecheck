export type Entry = { id: string; date: string; start: string; end: string; lines: string[]; endDate?: string; status?: "planned"|"completed"|"cancelled"; noteReady?: boolean }
export type Finding = { id: string; entryId: string; lineIndex?: number; kind: 'time'|'goal'; message: string; suggestion?: string; original?: string; goal?: string }
export type Draft = { goals: string; prompt: string; from: string; to: string; entries: Entry[]; schedule?: import("./schedule").ScheduleRules }
export const profiles = [
 {key:'ahmad',name:'Ahmad Moustafa',initials:'AM',description:'Goals and daily notes',colour:'#afbaeb'},
 {key:'wiremu',name:'Wiremu Thompson',initials:'WT',description:'Goals and daily notes',colour:'#e6b8a2'},
 {key:'derek',name:'Derek Paerau',initials:'DP',description:'Goals and daily notes',colour:'#a4c9b5'},
]
export const legacyPrompt = 'Write fictional daily support notes for this practice client, using the goals below. Use 3–4 short lines per day with clear activity keywords, what support was provided and the response. Include start and finish times. Keep every entry clearly fictional.'
export function days(from: string,to: string): string[] {
 const valid=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s
 if(!valid(from)||!valid(to)||from>to) throw Error('Choose a valid start and end date.')
 const count=(Date.parse(to)-Date.parse(from))/86400000+1
 if(count>366) throw Error('Choose up to 366 calendar days at a time.')
 return Array.from({length:count},(_,i)=>new Date(Date.parse(from)+i*86400000).toISOString().slice(0,10))
}
export function resolveRange(prompt:string,from:string,to:string): {from:string;to:string;source:string} {
 const explicit=prompt.match(/\bfrom\s+(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})\b/i)
 if(explicit){days(explicit[1],explicit[2]);return {from:explicit[1],to:explicit[2],source:'Prompt dates'}}
 const duration=prompt.match(/\b(?:for\s+)?(\d+|one|two|three)\s+(days?|weeks?|months?)\b/i)
 if(duration){const n=Number(duration[1])||({one:1,two:2,three:3} as Record<string,number>)[duration[1].toLowerCase()];if(n<1||n>100)throw Error('Use a duration between 1 and 100 days, or up to 3 months.')
 days(from,from);let end=new Date(from+'T00:00:00Z')
 if(duration[2].toLowerCase().startsWith('month')){const day=end.getUTCDate();end.setUTCDate(1);end.setUTCMonth(end.getUTCMonth()+n);end.setUTCDate(Math.min(day,new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth()+1,0)).getUTCDate()));end.setUTCDate(end.getUTCDate()-1)}
 else end.setUTCDate(end.getUTCDate()+n*(duration[2].toLowerCase().startsWith('week')?7:1)-1)
 const finish=end.toISOString().slice(0,10);days(from,finish);return {from,to:finish,source:'Prompt duration (from selected start date)'}}
 days(from,to);return {from,to,source:'Selected dates'}
}
export function minute(s:string):number|null {if(!/^\d{2}:\d{2}$/.test(s))return null;const [h,m]=s.split(':').map(Number);return h<24&&m<60?h*60+m:null}
export function interval(e:Entry):[number,number]|null {
 const s=minute(e.start),t=minute(e.end),finish=e.endDate||e.date
 if(s===null||t===null||!validDate(e.date)||!validDate(finish))return null
 const start=Date.parse(e.date+'T00:00:00Z')/60000+s,end=Date.parse(finish+'T00:00:00Z')/60000+t
 return end>start&&end-start<=2880?[start,end]:null
}
export function validDate(s:string){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s}
export function timeChecks(entries:Entry[]):Finding[]{
 const out:Finding[]=[]
 for(const e of entries)if(!interval(e))out.push({id:'time-'+e.id,entryId:e.id,kind:'time',message:'Enter valid start and finish dates/times. Finish must be after start, within 48 hours; use the next date for an overnight shift.'})
 for(let i=0;i<entries.length;i++)for(let j=i+1;j<entries.length;j++){const a=entries[i],b=entries[j],x=interval(a),y=interval(b);if(a.status!=='cancelled'&&b.status!=='cancelled'&&x&&y&&x[0]<y[1]&&y[0]<x[1])for(const n of [a,b])out.push({id:`overlap-${a.id}-${b.id}-${n.id}`,entryId:n.id,kind:'time',message:'Overlaps another session beginning '+a.date+'. Review the times.'})}
 return out
}
export function validEntries(value:unknown):value is Entry[]{return Array.isArray(value)&&value.length<=500&&new Set(value.map(e=>e?.id)).size===value.length&&value.every(e=>e&&typeof e.id==='string'&&e.id.length<=100&&typeof e.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(e.date)&&Number.isFinite(Date.parse(e.date))&&new Date(e.date+'T00:00:00Z').toISOString().slice(0,10)===e.date&&(e.endDate===undefined||(typeof e.endDate==='string'&&validDate(e.endDate)))&&(e.status===undefined||['planned','completed','cancelled'].includes(e.status))&&(e.noteReady===undefined||typeof e.noteReady==='boolean')&&typeof e.start==='string'&&e.start.length<=20&&typeof e.end==='string'&&e.end.length<=20&&Array.isArray(e.lines)&&e.lines.length>=1&&e.lines.length<=8&&e.lines.every((l:unknown)=>typeof l==='string'&&l.length<=1000))}
export function validateGenerated(raw:any,requested:string[]):Entry[]{
 const fail=(detail:string):never=>{throw Error('AI response could not be used: '+detail)}
 if(!Array.isArray(raw?.entries))return fail('missing entries list.')
 if(raw.entries.length!==requested.length)return fail(`expected ${requested.length} daily entries; received ${raw.entries.length}.`)
 const normalTime=(value:unknown):string=>{
  if(typeof value!=='string')return ''
  const match=value.trim().match(/^(\d{1,2}):(\d{2})(?:\s*([ap])\.?m\.?)?$/i)
  if(!match)return value.trim()
  let h=Number(match[1]);const m=Number(match[2]),period=match[3]?.toLowerCase()
  if(m>59||(!period&&h>23)||(period&&(h<1||h>12)))return value.trim()
  if(period)h=h%12+(period==='p'?12:0)
  return String(h).padStart(2,'0')+':'+match[2]
 }
 const seen=new Set<string>()
 const entries=raw.entries.map((e:any)=>{
  if(!e||typeof e.date!=='string'||!requested.includes(e.date)||seen.has(e.date))return fail('dates must match the selected range exactly, without duplicates.')
  seen.add(e.date)
  if(!Array.isArray(e.lines)||e.lines.length<3||e.lines.length>4||e.lines.some((l:unknown)=>typeof l!=='string'||!l.trim()||l.length>1000))return fail('each date needs 3–4 non-empty note lines.')
  return {id:'day-'+e.date,date:e.date,start:normalTime(e.start),end:normalTime(e.end),lines:e.lines.map((l:string)=>l.trim())} as Entry
 })
 if(timeChecks(entries).length)return fail('a session has missing or invalid times, or finishes before it starts.')
 return requested.map(date=>entries.find((e:Entry)=>e.date===date)!)
}
export function validateGoalResults(raw:any,entries:Entry[],goals:string):{findings:Finding[];reviewed:number}{
 if(!Array.isArray(raw?.reviews))throw Error('Goal review was incomplete. Please retry.')
 const expected=entries.flatMap(e=>e.lines.map((line,lineIndex)=>({entry:e,line,lineIndex}))),seen=new Set<string>(),findings:Finding[]=[]
 for(const r of raw.reviews){const item=expected.find(x=>x.entry.id===r.entryId&&x.lineIndex===r.lineIndex);const key=r.entryId+':'+r.lineIndex
 if(!item||seen.has(key)||r.quote!==item.line||!['aligned','mismatch','unclear'].includes(r.status))throw Error('Goal review failed source validation. Please retry.')
 seen.add(key)
 if(r.status!=='aligned'){if(typeof r.message!=='string'||typeof r.suggestion!=='string'||!r.suggestion.trim()||r.suggestion.length>1000||typeof r.goalQuote!=='string'||!r.goalQuote.trim()||!goals.includes(r.goalQuote))throw Error('A goal suggestion could not be verified. Please retry.')
 findings.push({id:'goal-'+key,entryId:r.entryId,lineIndex:r.lineIndex,kind:'goal',message:r.message.slice(0,400),suggestion:r.suggestion,original:r.quote,goal:r.goalQuote})}}
 if(seen.size!==expected.length)throw Error('Some lines were not reviewed. Please retry.')
 return {findings,reviewed:seen.size}
}
export function exportText(name:string,draft:Draft):string{return `NOTESCHECKER · DRAFT SUPPORT NOTES\nParticipant: ${name}\nReview session details and observations before finalising.\n\nGOALS\n${draft.goals}\n\nDAILY NOTES\n\n`+draft.entries.map(e=>`${e.date} · ${e.status||"Unclassified"}\nStart: ${e.date} ${e.start} | Finish: ${e.endDate||e.date} ${e.end} | Hours: ${interval(e)?((interval(e)![1]-interval(e)![0])/60).toFixed(2):"Invalid"}\n${e.lines.map(line=>'• '+line).join('\n')}`).join('\n\n')+'\n\nTOTALS (elapsed time, not billing):\n'+summaryText(draft.entries)}

export function goalMatch(entry:Entry,findings:Finding[]):{aligned:number;total:number;percent:number}{
 const flagged=new Set(findings.filter(f=>f.kind==='goal'&&f.entryId===entry.id&&f.lineIndex!==undefined&&f.lineIndex>=0&&f.lineIndex<entry.lines.length).map(f=>f.lineIndex))
 const total=entry.lines.length,aligned=total-flagged.size
 return {aligned,total,percent:total?Math.round(aligned/total*100):0}
}

export const defaultPrompt = 'Write daily support notes using the client goals. Use 3–4 concise bullet points per day covering the activity, support provided and response. Include start and finish times.'

// All active profiles in an account share one provider. Compare intervals,
// not entry IDs (generated IDs intentionally repeat across profiles).
export function crossProfileTimeChecks(entries:Entry[],currentKey:string,saved:{profile_key:string;data:{entries?:Entry[]}}[]):Finding[]{
 const out:Finding[]=[]
 for(const row of saved){
  const other=profiles.find(p=>p.key===row.profile_key)
  if(!other||other.key===currentKey)continue
  const sessions=row.data?.entries??[]
  if(!validEntries(sessions))throw Error('A saved profile has invalid session data. Reload and correct it before checking timestamps.')
  for(const a of entries)for(const b of sessions){
   const x=interval(a),y=interval(b)
   if(a.status!=='cancelled'&&b.status!=='cancelled'&&x&&y&&x[0]<y[1]&&y[0]<x[1])
    out.push({id:`cross-${a.id}-${other.key}-${b.id}`,entryId:a.id,kind:'time',message:`${profiles.find(p=>p.key===currentKey)?.name??'This client'} (${a.start}–${a.end}) overlaps ${other.name} (${b.start}–${b.end}) on ${a.date}. The same provider cannot attend both sessions. Review the recorded times.`})
  }
 }
 return out
}

export function totals(entries:Entry[]){
 const result={planned:0,completed:0,cancelled:0,unclassified:0,invalid:0}
 for(const e of entries){const t=interval(e);if(!t){result.invalid++;continue}result[e.status||'unclassified']+=(t[1]-t[0])/60}
 return result
}
export function summaryText(entries:Entry[]){const t=totals(entries);return `Planned: ${t.planned.toFixed(2)} h; Completed: ${t.completed.toFixed(2)} h; Cancelled scheduled time: ${t.cancelled.toFixed(2)} h; Unclassified: ${t.unclassified.toFixed(2)} h; Invalid intervals: ${t.invalid}`}
