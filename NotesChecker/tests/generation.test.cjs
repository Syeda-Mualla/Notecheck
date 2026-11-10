const {test}=require('node:test'),assert=require('node:assert/strict');
const load=require('./helpers/load.cjs')();
const {generateRange}=load('lib/course/generation.ts');
const {days,defaultPrompt,legacyPrompt}=load('lib/course/domain.ts');
const initial={goals:'Prepare lunch',prompt:'Lunch',from:'2026-10-01',to:'2026-10-21',entries:[]};
const entries=dates=>dates.map(date=>({id:date,date,start:'09:00',end:'10:00',lines:['Prepared lunch.','Used a checklist.','Needed one prompt.']}));
test('21 days continue automatically; transient third-batch failure retries without duplicates',async()=>{
 let calls=0,saved;
 const result=await generateRange(initial,false,{request:async(d,dates)=>{if(++calls===3)throw Error('AI generation or review is unavailable.');return entries(dates)},persist:async d=>{saved=d},stopped:()=>false,progress:()=>{},pause:async()=>{}});
 assert.equal(result.count,21);assert.equal(calls,4);assert.equal(new Set(saved.entries.map(e=>e.date)).size,21);
});
test('exhausted retries preserve 14 saved days and resume requests only missing dates',async()=>{
 let saved,calls=0;
 const ops={request:async(d,dates)=>{if(++calls>=3)throw Error('network unavailable');return entries(dates)},persist:async d=>{saved=d},stopped:()=>false,progress:()=>{},pause:async()=>{}};
 await assert.rejects(generateRange(initial,false,ops),/14 of 21/);assert.equal(saved.entries.length,14);assert.equal(calls,5);
 await generateRange(saved,true,{...ops,request:async(d,dates)=>{assert.equal(dates[0],'2026-10-15');return entries(dates)}});assert.equal(saved.entries.length,21);
});
test('save failure never triggers another AI request or uncertain save retry',async()=>{
 let calls=0;
 await assert.rejects(generateRange(initial,false,{request:async(d,dates)=>{calls++;return entries(dates)},persist:async()=>{throw Error('connection lost')},stopped:()=>false,progress:()=>{},pause:async()=>{}}),/saving could not be confirmed/);
 assert.equal(calls,1);
});
test('pause keeps completed batch and stops subsequent generation',async()=>{
 let stopped=false;
 const result=await generateRange(initial,false,{request:async(d,dates)=>entries(dates),persist:async()=>{stopped=true},stopped:()=>stopped,progress:()=>{},pause:async()=>{}});
 assert.equal(result.count,7);assert.equal(result.stopped,true);
});
test('professional default prompt retains legacy value for exact-only migration',()=>{assert.match(legacyPrompt,/fictional/);assert.doesNotMatch(defaultPrompt,/fictional|practice/)});
test('configuration failure is not retried and zero saved days gives the visible Generate action',async()=>{
 let calls=0;
 await assert.rejects(generateRange(initial,false,{request:async()=>{calls++;throw Error('GEMINI_MODEL: model not found or unsupported (404).')},persist:async()=>{},stopped:()=>false,progress:()=>{},pause:async()=>{}}),error=>{assert.match(error.message,/Generate notes again/);assert.doesNotMatch(error.message,/Select Resume/);return true});
 assert.equal(calls,1);
});
