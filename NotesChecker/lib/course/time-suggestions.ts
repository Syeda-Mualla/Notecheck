import { profiles, validEntries, interval, type Entry } from './domain'
export type TimePlan = { changes: {entryId:string;date:string;beforeStart:string;beforeEnd:string;start:string;end:string}[]; unresolved: {entryId:string;message:string}[] }
const minutes=(s:string)=>/^([01]\d|2[0-3]):[0-5]\d$/.test(s)?Number(s.slice(0,2))*60+Number(s.slice(3)):null
const clock=(n:number)=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')
export function suggestTimes(entries:Entry[],current:string,saved:{profile_key:string;data:{entries?:Entry[]}}[],from:string,to:string):TimePlan{
 const low=minutes(from),high=minutes(to)
 if(low===null||high===null||high<=low)throw Error('Choose a valid working-day start and finish.')
 const plan:TimePlan={changes:[],unresolved:[]}, occupied:{date:string;start:number;end:number}[]=[]
 const blocked=new Set<string>()
 const reserve=(e:Entry)=>{const span=interval(e);if(!span){blocked.add(e.date);return}for(let day=Math.floor(span[0]/1440)*1440;day<span[1];day+=1440){occupied.push({date:new Date(day*60000).toISOString().slice(0,10),start:Math.max(span[0],day)-day,end:Math.min(span[1],day+1440)-day})}}
 for(const row of saved){if(row.profile_key===current||!profiles.some(p=>p.key===row.profile_key))continue
 const other=row.data?.entries??[];if(!validEntries(other))throw Error('A saved profile has invalid data. Correct it before requesting suggestions.')
 for(const e of other){if(e.status!=='cancelled')reserve(e)}}
 const movable:Entry[]=[]
 const overlaps=(date:string,s:number,t:number)=>occupied.some(o=>o.date===date&&s<o.end&&o.start<t)
 // Reserve unaffected entries first so suggestions do not push them out of place.
 for(const e of entries){const s=minutes(e.start),t=minutes(e.end)
 if(e.status==='cancelled')continue;
 if((e.endDate&&e.endDate!==e.date)||e.status==='completed'){reserve(e);plan.unresolved.push({entryId:e.id,message:'Overnight and completed sessions stay fixed. Correct their actual times manually if needed.'});continue}
 if(s===null||t===null||t<=s){blocked.add(e.date);plan.unresolved.push({entryId:e.id,message:'Enter the actual start and finish manually; duration cannot be inferred.'});continue}
 if(overlaps(e.date,s,t))movable.push(e);else occupied.push({date:e.date,start:s,end:t})}
 for(const e of movable){const s=minutes(e.start)!,t=minutes(e.end)!,duration=t-s
 if(blocked.has(e.date)){plan.unresolved.push({entryId:e.id,message:'Correct missing or invalid times on this date before scheduling.'});continue}
 const candidates=[low,...occupied.filter(o=>o.date===e.date).map(o=>o.end),s].filter(n=>n>=low&&n+duration<=high&&!overlaps(e.date,n,n+duration)).sort((a,b)=>Math.abs(a-s)-Math.abs(b-s)||a-b)
 if(!candidates.length){occupied.push({date:e.date,start:s,end:t});plan.unresolved.push({entryId:e.id,message:'No available slot within these working hours. Edit manually or widen the hours.'});continue}
 const start=candidates[0];occupied.push({date:e.date,start,end:start+duration});plan.changes.push({entryId:e.id,date:e.date,beforeStart:e.start,beforeEnd:e.end,start:clock(start),end:clock(start+duration)})}
 return plan
}
