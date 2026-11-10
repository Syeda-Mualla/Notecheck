import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
export function env(name:string):string {const v=process.env[name];if(!v)throw Error('Server setup is incomplete. Check '+name+'.');return v}
export async function identity(request:Request):Promise<string>{const authorization=request.headers.get('authorization');if(!authorization?.startsWith('Bearer '))throw Error('Please sign in again.');const r=await fetch(env('NEXT_PUBLIC_SUPABASE_URL')+'/auth/v1/user',{headers:{apikey:env('NEXT_PUBLIC_SUPABASE_ANON_KEY'),Authorization:authorization},cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Please sign in again.');const u=await r.json();if(!u.id)throw Error('Please sign in again.');return u.id}
export async function db(query:string,method='GET',body?:unknown){const r=await fetch(env('NEXT_PUBLIC_SUPABASE_URL')+'/rest/v1/course_profiles'+query,{method,headers:{apikey:env('SUPABASE_SERVICE_ROLE_KEY'),Authorization:'Bearer '+env('SUPABASE_SERVICE_ROLE_KEY'),'Content-Type':'application/json',Prefer:method==='POST'?'return=representation,resolution=ignore-duplicates':'return=representation'},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('Could not save or load profiles. Check database setup and connection.');return r.json()}
export function hashPin(pin:string){const salt=randomBytes(16).toString('hex');return salt+':'+scryptSync(pin,salt,32).toString('hex')}
export function pinMatches(pin:string,stored:string){const [salt,hash]=stored.split(':');const b=Buffer.from(hash,'hex'),a=scryptSync(pin,salt,32);return a.length===b.length&&timingSafeEqual(a,b)}
export function unlockToken(user:string,profile:string){const payload=Buffer.from(JSON.stringify({user,profile,exp:Date.now()+3600000})).toString('base64url');return payload+'.'+createHmac('sha256',env('PROFILE_SESSION_SECRET')).update(payload).digest('base64url')}
export function verifyUnlock(token:unknown,user:string,profile:string){if(typeof token!=='string')throw Error('Unlock this profile first.');const [payload,sig]=token.split('.');const expected=createHmac('sha256',env('PROFILE_SESSION_SECRET')).update(payload||'').digest('base64url');if(!sig||sig.length!==expected.length||!timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))throw Error('Unlock this profile again.');let data;try{data=JSON.parse(Buffer.from(payload,'base64url').toString())}catch{throw Error('Unlock this profile again.')};if(data.user!==user||data.profile!==profile||data.exp<Date.now())throw Error('Unlock this profile again.')}
// Keep provider responses and credentials out of browser-visible errors.
export async function model(prompt:string, responseJsonSchema?:Record<string,unknown>):Promise<any> {
 const key=(process.env.LLM_API_KEY||process.env.GEMINI_API_KEY||'').trim();
 if(!key)throw Error('AI setup: add LLM_API_KEY to the deployment secrets.');
 const primary=(process.env.GEMINI_MODEL||'').trim().replace(/^models\//,'');
 if(!primary)throw Error('AI setup: add GEMINI_MODEL to the deployment secrets.');
 const models=[...new Set([primary,(process.env.GEMINI_FALLBACK_MODEL||'').trim().replace(/^models\//,'')].filter(Boolean))];
 const failures:string[]=[];
 for(let index=0;index<models.length;index++) {
  const name=models[index];
  const setting=index===0?'GEMINI_MODEL':'GEMINI_FALLBACK_MODEL';
  if(!/^[a-zA-Z0-9._-]+$/.test(name)) {
   failures.push(setting+': invalid model ID. Use the model ID only, without quotes or a URL.');
   continue;
  }
  let r:Response;
  try {
   r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(name)+':generateContent',{
    method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},
    body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',...(responseJsonSchema?{responseJsonSchema}:{}),temperature:0.2}}),
    signal:AbortSignal.timeout(22000)
   });
  } catch(error) {
   const timedOut=error instanceof Error && /timeout|abort/i.test(error.name);
   failures.push(setting+(timedOut?': Gemini timed out after 22 seconds.':': network connection to Gemini failed.'));
   continue;
  }
  if(!r.ok) {
   // Inspect only known codes/reasons; never forward Google's raw message.
   const payload=await r.json().catch(()=>null);
   const invalidKey=payload?.error?.details?.some((d:any)=>d?.reason==='API_KEY_INVALID') || /api key not valid/i.test(payload?.error?.message||'');
   let detail:string;
   if(invalidKey || r.status===401) detail='API key rejected. Check the deployed LLM_API_KEY in Google AI Studio.';
   else if(r.status===403) detail='access denied (403). Check API key restrictions and Gemini API permissions.';
   else if(r.status===404) detail='model not found or unsupported (404). Check this model ID and its availability for your API key.';
   else if(r.status===429) detail='Gemini quota or rate limit reached (429). Check usage and billing in Google AI Studio before retrying.';
   else if(r.status===400) detail='Gemini rejected the request (400). Check model support, API setup and regional availability.';
   else if(r.status===402) detail='Gemini billing requires attention (402). Check billing and credits.';
   else if(r.status>=500) detail='Gemini temporarily unavailable ('+r.status+'). Try again shortly.';
   else detail='Gemini rejected the request (HTTP '+r.status+'). Check API setup.';
   failures.push(setting+': '+detail);
   continue;
  }
  try {
   const data=await r.json();
   const candidate=data?.candidates?.[0];
   if(data?.promptFeedback?.blockReason || ['SAFETY','RECITATION','PROHIBITED_CONTENT','BLOCKLIST'].includes(candidate?.finishReason)) {
    failures.push(setting+': Gemini blocked this request. Review the instructions and try again.');continue;
   }
   if(candidate?.finishReason==='MAX_TOKENS') {
    failures.push(setting+': AI response was incomplete. Try again or use a shorter date range.');continue;
   }
   const text=Array.isArray(candidate?.content?.parts)?candidate.content.parts.filter((p:any)=>typeof p.text==='string'&&!p.thought).map((p:any)=>p.text).join(''):'';
   if(!text.trim()) { failures.push(setting+': AI response was empty. Try again.');continue; }
   // Remove only a complete Markdown wrapper; never repair or invent JSON values.
   const wrapped=text.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
   const result=JSON.parse(wrapped?wrapped[1]:text);
   if(!result || typeof result!=='object' || Array.isArray(result))throw Error('Invalid JSON object');
   return result;
  } catch {
   failures.push(setting+': AI response was not valid JSON. Try again.');
  }
 }
 throw Error(failures.join(' ')+' Your saved draft is safe.');
}

export function reviewToken(user:string,profile:string,goals:string,entry:unknown):string {
 const hash=createHash('sha256').update(JSON.stringify({user,profile,goals,entry})).digest('hex')
 return createHmac('sha256',env('PROFILE_SESSION_SECRET')).update('review:'+hash).digest('hex')
}

// API-enforced shapes complement (and never replace) our date/time/quote validators.
export function notesSchema(dates:string[]):Record<string,unknown> {
 return {type:'object',additionalProperties:false,required:['entries'],properties:{entries:{
  type:'array',minItems:dates.length,maxItems:dates.length,items:{
   type:'object',additionalProperties:false,required:['date','start','end','lines'],properties:{
    date:{type:'string',enum:dates},start:{type:'string',description:'Start time in 24-hour HH:mm format'},
    end:{type:'string',description:'Finish time in 24-hour HH:mm format, later than start'},
    lines:{type:'array',minItems:3,maxItems:4,items:{type:'string'}}
   }
  }
 }}};
}
export function goalsSchema(lineCount:number):Record<string,unknown> {
 return {type:'object',additionalProperties:false,required:['reviews'],properties:{reviews:{
  type:'array',minItems:lineCount,maxItems:lineCount,items:{
   type:'object',additionalProperties:false,
   required:['entryId','lineIndex','quote','status','message','goalQuote','suggestion'],properties:{
    entryId:{type:'string'},lineIndex:{type:'integer',minimum:0},quote:{type:'string'},
    status:{type:'string',enum:['aligned','mismatch','unclear']},
    message:{type:'string'},goalQuote:{type:'string'},suggestion:{type:'string'}
   }
  }
 }}};
}
