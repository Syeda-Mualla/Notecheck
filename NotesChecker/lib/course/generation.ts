import { days, validateGenerated, type Draft, type Entry } from './domain'

type Operations = {
 request: (draft: Draft, dates: string[]) => Promise<Entry[]>;
 persist: (draft: Draft) => Promise<void>;
 stopped: () => boolean;
 progress: (message: string) => void;
 pause: (ms: number) => Promise<void>;
}
export async function generateRange(initial: Draft, resume: boolean, ops: Operations) {
 const dates = days(initial.from, initial.to);
 let working: Draft = {...initial, entries: resume ? initial.entries.filter(e=>dates.includes(e.date)) : []};
 if(new Set(working.entries.map(e=>e.date)).size!==working.entries.length)throw Error('Duplicate session dates found. Correct them before resuming.');
 const pending = dates.filter(date=>!working.entries.some(e=>e.date===date));
 let saved = working.entries.length;
 for(let i=0;i<pending.length;i+=7){
  if(ops.stopped())return {stopped:true,count:saved};
  const batch=pending.slice(i,i+7);
  let entries: Entry[]=[];
  for(let attempt=0;attempt<3;attempt++){
   ops.progress(`${saved} of ${dates.length} days saved · ${attempt?'Retrying':'Generating'} ${batch[0]} to ${batch[batch.length-1]}${attempt?` (retry ${attempt} of 2)`:''}…`);
   try {entries=validateGenerated({entries:await ops.request(working,batch)},batch);break;}
   catch(error){
    const message=error instanceof Error?error.message:String(error);
    const retryable=/AI generation|AI response|fetch|network|timeout|timed out|unavailable|429|502|503|504/i.test(message);
    if(!retryable||attempt===2)throw Error(`Generation paused with ${saved} of ${dates.length} days saved. ${message} ${saved ? 'Select Resume generation to continue missing dates.' : 'Once the issue is resolved, select Generate notes again.'}`);
    if(ops.stopped())return {stopped:true,count:saved};
    await ops.pause(1500*(attempt+1));
   }
  }
  working={...working,entries:[...working.entries,...entries].sort((a,b)=>a.date.localeCompare(b.date))};
  try{await ops.persist(working)}catch(error){throw Error(`Generated notes remain in this draft, but saving could not be confirmed. Do not close this tab. ${error instanceof Error?error.message:String(error)} Resolve saving before resuming.`)}
  saved=working.entries.length;
 }
 return {stopped:false,count:saved};
}
