import { days, interval, minute, validEntries, timeChecks, crossProfileTimeChecks, profiles, type Entry } from './domain'
export type ScheduleRules={simple?:boolean;weekdays:number[];minShifts:number;maxShifts:number;weeklyHours:number;minHours:number;maxHours:number;workStart:string;workEnd:string;changeDate:string;laterMin:number;laterMax:number;laterHours:number;overnightDate:string;overnightStart:string;overnightEnd:string;cancelDate:string;cancelStart:string;cancelHours:number}
export const emptyRules=():ScheduleRules=>({weekdays:[1,2,3,4,5,6],minShifts:3,maxShifts:4,weeklyHours:20,minHours:2,maxHours:8,workStart:'08:00',workEnd:'18:00',changeDate:'',laterMin:2,laterMax:2,laterHours:10,overnightDate:'',overnightStart:'22:00',overnightEnd:'06:00',cancelDate:'',cancelStart:'09:00',cancelHours:2})
export function preset(key:string){const rules=emptyRules();if(key==='derek')Object.assign(rules,{minShifts:1,maxShifts:1,weeklyHours:5,changeDate:'2026-09-16'});return {rules,from:key==='wiremu'?'2026-07-02':key==='derek'?'2026-06-05':'',to:key==='wiremu'?'2026-09-15':''}}
const clock=(n:number)=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')
export const nextDate=(s:string)=>new Date(Date.parse(s+'T00:00:00Z')+86400000).toISOString().slice(0,10)
export function weekOf(s:string){const d=new Date(s+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10)}
function feasibleCounts(r:ScheduleRules,low:number,high:number,hours:number){
 const available=(minute(r.workEnd)!-minute(r.workStart)!)/60;
 return Array.from({length:high-low+1},(_,i)=>low+i).filter(count=>{
 const duration=Math.round(hours/count*4)/4;
 return hours>=count*r.minHours&&hours<=count*Math.min(r.maxHours,available)&&duration>=r.minHours&&duration<=Math.min(r.maxHours,available);
 });
}
export function validateRules(r:ScheduleRules){
 if(!r||!Array.isArray(r.weekdays)||!r.weekdays.length||r.weekdays.some(n=>!Number.isInteger(n)||n<1||n>6)||new Set(r.weekdays).size!==r.weekdays.length)throw Error('Select working days Monday to Saturday. Sundays are excluded.')
 for(const [name,n] of Object.entries({minShifts:r.minShifts,maxShifts:r.maxShifts,laterMin:r.laterMin,laterMax:r.laterMax}))if(!Number.isInteger(n)||n<1||n>6)throw Error(name+': choose 1–6 shifts.')
 if(r.minShifts>r.maxShifts||r.laterMin>r.laterMax||r.maxShifts>r.weekdays.length||(!!r.changeDate&&r.laterMax>r.weekdays.length))throw Error('Shift counts must fit the selected working days.')
 for(const n of [r.weeklyHours,r.laterHours,r.minHours,r.maxHours,r.cancelHours])if(!Number.isFinite(n)||n<=0||n>48)throw Error('Hours must be positive and no more than 48.')
 if(r.minHours<2||r.maxHours>8||r.minHours>r.maxHours)throw Error('Regular shifts must be between 2 and 8 hours.')
 const a=minute(r.workStart),b=minute(r.workEnd);if(a===null||b===null||b<=a)throw Error('Enter valid daytime working hours.')
 for(const [low,high,hours] of [[r.minShifts,r.maxShifts,r.weeklyHours],...(r.changeDate?[[r.laterMin,r.laterMax,r.laterHours]]:[])])if(!feasibleCounts(r,low,high,hours).length)throw Error(`${hours} weekly hours cannot fit ${low}–${high} shifts within the selected duration limits and working hours. Adjust the weekly target, shift count or available hours.`)
 if(r.changeDate)days(r.changeDate,r.changeDate)
}
export function buildSchedule(from:string,to:string,r:ScheduleRules,key:string,saved:{profile_key:string;data:{entries?:Entry[]}}[]){
 if(r?.simple)return buildSimpleSchedule(from,to,r,key,saved)
 validateRules(r);const range=days(from,to),entries:Entry[]=[],warnings:string[]=[]
 const occupied:Entry[]=saved.filter(x=>x.profile_key!==key&&profiles.some(p=>p.key===x.profile_key)).flatMap(x=>{const e=x.data?.entries??[];if(!validEntries(e)||timeChecks(e).some(f=>f.id.startsWith('time-')))throw Error('Correct invalid saved session times in the other profiles first.');return e.filter(n=>n.status!=='cancelled')})
 const free=(entry:Entry)=>{const x=interval(entry);return !!x&&![...occupied,...entries.filter(e=>e.status!=='cancelled')].some(e=>{const y=interval(e);return y&&x[0]<y[1]&&y[0]<x[1]})}
 const allowed=(date:string)=>range.includes(date)&&r.weekdays.includes(new Date(date+'T00:00:00Z').getUTCDay())
 const special=(date:string,start:string,end:string,endDate:string,status:'planned'|'cancelled',line:string)=>{if(!allowed(date))throw Error('Special-session date must be within the range and on a selected working day.');const e:Entry={id:'shift-'+date,date,start,end,endDate,status,noteReady:status==='cancelled',lines:[line]};if(!interval(e))throw Error('Special-session times are invalid.');if(new Date(endDate+'T00:00:00Z').getUTCDay()===0&&end!=='00:00')throw Error('Overnight support cannot continue into Sunday.');if(endDate>to)throw Error('Finish date must be within the report range.');if(status!=='cancelled'&&!free(e))throw Error('Overnight session overlaps a saved session. Choose another time.');entries.push(e)}
 if(r.overnightDate)special(r.overnightDate,r.overnightStart,r.overnightEnd,nextDate(r.overnightDate),'planned','Proposed overnight respite — review activities before use.')
 if(r.cancelDate){if(r.cancelDate===r.overnightDate)throw Error('Choose separate dates for respite and cancellation.');const start=minute(r.cancelStart);if(start===null||start+r.cancelHours*60>=1440)throw Error('Cancellation interval must fit the same day.');special(r.cancelDate,r.cancelStart,clock(Math.round(start+r.cancelHours*60)),r.cancelDate,'cancelled','Cancellation entry — enter the actual reason and notice received. No support delivered; billing eligibility is not determined.')}
 const weeks=[...new Set(range.map(weekOf))]
 weeks.forEach((week,index)=>{
 const group=range.filter(d=>weekOf(d)===week),later=!!r.changeDate&&group.some(d=>d>=r.changeDate)
 const low=later?r.laterMin:r.minShifts,high=later?r.laterMax:r.maxShifts,target=later?r.laterHours:r.weeklyHours
 if(r.changeDate&&group.some(d=>d<r.changeDate)&&group.some(d=>d>=r.changeDate))warnings.push(`${week}: the new pattern applies to this transition week.`)
 const possible=feasibleCounts(r,low,high,target)
 const count=possible[index%possible.length],duration=Math.round(target/count*4)*15
 const candidates=group.filter(d=>allowed(d)&&!entries.some(e=>e.date===d));const existing=entries.filter(e=>weekOf(e.date)===week)
 // Rotate candidate days deterministically for a proposed roster, never to imply work occurred.
 const ordered=candidates.length?[...candidates.slice(index%candidates.length),...candidates.slice(0,index%candidates.length)]:[]
 let placed=existing.length
 for(const date of ordered){if(placed>=count)break;for(let start=minute(r.workStart)!;start+duration<=minute(r.workEnd)!;start+=15){const e:Entry={id:'shift-'+date,date,endDate:date,start:clock(start),end:clock(start+duration),status:'planned',noteReady:false,lines:['Planned session — notes not generated yet.']};if(free(e)){entries.push(e);placed++;break}}}
 const hours=entries.filter(e=>weekOf(e.date)===week&&e.status!=='cancelled').reduce((n,e)=>{const x=interval(e)!;return n+(x[1]-x[0])/60},0)
 if(placed<count||Math.abs(hours-target)>.01)warnings.push(`${week}: ${placed}/${count} shifts; ${hours.toFixed(2)} planned hours versus ${target} target. Partial weeks, availability, respite and cancellations can change totals.`)
 })
 entries.sort((a,b)=>a.date.localeCompare(b.date)||a.start.localeCompare(b.start))
 if(timeChecks(entries).length||crossProfileTimeChecks(entries,key,saved).length)throw Error('Schedule contains a conflict. Adjust the rules and preview again.')
 return {entries,warnings}
}

// Current client brief: fixed patterns, with manual editing retained in the draft.
export function clientSettings(key:string){
 const rules:ScheduleRules={...emptyRules(),simple:true,minShifts:4,maxShifts:4,minHours:4,maxHours:6,weeklyHours:20,workStart:'09:00',workEnd:'18:00',changeDate:'',overnightDate:'',cancelDate:''};
 return {rules,from:key==='derek'?'2026-06-05':'2026-07-02',to:'2026-09-15'};
}
export function buildSimpleSchedule(from:string,to:string,r:ScheduleRules,key:string,saved:{profile_key:string;data:{entries?:Entry[]}}[]){
 if(key!=='wiremu'&&key!=='derek')throw Error('This schedule is configured for Wiremu and Derek.');
 const range=days(from,to),low=minute(r.workStart),high=minute(r.workEnd);
 if(low===null||high===null||high<=low)throw Error('Choose a valid available start and finish time.');
 if(high-low<360)throw Error('Allow at least six hours in the working day for the agreed shift pattern.');
 const occupied=saved.filter(row=>row.profile_key!==key&&profiles.some(p=>p.key===row.profile_key)).flatMap(row=>{
 const entries=row.data?.entries??[];
 if(!validEntries(entries)||entries.some(e=>e.status!=='cancelled'&&!interval(e)))throw Error('Correct invalid saved times in another profile before previewing.');
 return entries.filter(e=>e.status!=='cancelled');
 });
 const entries:Entry[]=[],warnings:string[]=[];
 const weeks=[...new Set(range.map(weekOf))];
 for(const week of weeks){
 const group=range.filter(date=>weekOf(date)===week&&new Date(date+'T00:00:00Z').getUTCDay()!==0);
 if(!group.length)continue;
 // 10 August belongs only to the later period. It is a Monday.
 const later=key==='derek'&&week>='2026-08-10';
 const weeklyCount=key==='wiremu'?4:later?2:1;
 const count=Math.min(weeklyCount,Math.ceil(weeklyCount*group.length/6));
 const index=Math.round((Date.parse(week)-Date.parse(key==='wiremu'?'2026-06-29':'2026-06-01'))/604800000);
 const cycle=((index%6)+6)%6;
 const hours=key==='wiremu'?(index%2===0?[4,6,4,6]:[5,5,6,4]):later?(count===1?[4]:[4,6]):[[4,6,5,6,4,5][cycle]];
 const preferred=key==='wiremu'?[1,2,4,5,6,3]:[3,6,1,2,4,5];
 const candidates=[...group].sort((a,b)=>preferred.indexOf(new Date(a+'T00:00:00Z').getUTCDay())-preferred.indexOf(new Date(b+'T00:00:00Z').getUTCDay()));
 for(let i=0;i<count;i++){
 const duration=hours[i]*60;
 let placed=false;
 for(const date of candidates){
 if(entries.some(e=>e.date===date))continue;
 for(let start=low;start+duration<=high;start+=15){
 const e:Entry={id:'shift-'+date,date,endDate:date,start:clock(start),end:clock(start+duration),status:'planned',noteReady:false,lines:['Planned session — notes not generated yet.']};
 const x=interval(e)!;
 if([...occupied,...entries].some(other=>{const y=interval(other)!;return x[0]<y[1]&&y[0]<x[1]}))continue;
 entries.push(e);placed=true;break;
 }
 if(placed)break;
 }
 if(!placed)warnings.push(`Week of ${week}: no free ${hours[i]}-hour slot for shift ${i+1}. Existing sessions were kept unchanged.`);
 }
 if(group.length<6)warnings.push(`Week of ${week}: partial week (${group.length} available dates in the range); ${count} shifts requested. The full-week target is not forced into this shorter period.`);
 }
 entries.sort((a,b)=>a.date.localeCompare(b.date)||a.start.localeCompare(b.start));
 if(timeChecks(entries).length||crossProfileTimeChecks(entries,key,saved).length)throw Error('A timestamp conflict was found. Review saved sessions before continuing.');
 return {entries,warnings};
}
