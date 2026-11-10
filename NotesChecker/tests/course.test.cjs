const {test}=require('node:test'),assert=require('node:assert/strict')
const loader=require('./helpers/load.cjs')
const load=loader({process:{env:{PROFILE_SESSION_SECRET:'test-secret-with-at-least-thirty-two-characters'}}})
const {days,resolveRange,timeChecks,validateGenerated,validateGoalResults,exportText,validEntries}=load('lib/course/domain.ts')
const {hashPin,pinMatches,unlockToken,verifyUnlock}=load('lib/course/server.ts')
const entry=(extra={})=>({id:'a',date:'2026-09-01',start:'09:00',end:'10:00',lines:['Practised lunch preparation.','Used a checklist.','Responded to one prompt.'],...extra})
test('date range is inclusive and capped; invalid dates fail',()=>{
 assert.equal(days('2026-07-01','2026-09-30').length,92)
 assert.throws(()=>days('2026-02-30','2026-03-01'))
 assert.equal(days('2026-01-01','2026-12-31').length,365)
 assert.throws(()=>days('2026-01-01','2027-01-02'))
 assert.throws(()=>days('2026-02-02','2026-02-01'))
})
test('prompt three months, weeks and ISO dates resolve visibly',()=>{
 assert.equal(resolveRange('Generate 3 months','2026-07-01','2026-07-02').to,'2026-09-30')
 assert.equal(resolveRange('for two weeks','2026-07-01','2026-07-02').to,'2026-07-14')
 assert.equal(resolveRange('from 2026-08-01 to 2026-08-09','2026-07-01','2026-07-02').from,'2026-08-01')
})
test('missing and reversed times are checked without AI',()=>{
 for(const patch of [{start:''},{end:''},{end:'08:00'},{end:'09:00'},{start:'25:00'}])assert.equal(timeChecks([entry(patch)]).length,1)
 assert.equal(timeChecks([entry()]).length,0)
})
test('same-day overlap marks both entries; touching boundaries and different days do not',()=>{
 assert.equal(timeChecks([entry(),entry({id:'b',start:'09:30',end:'11:00'})]).length,2)
 assert.equal(timeChecks([entry(),entry({id:'b',start:'10:00',end:'11:00'})]).length,0)
 assert.equal(timeChecks([entry(),entry({id:'b',date:'2026-09-02'})]).length,0)
})
test('AI generation rejects missing days, bad times and short format',()=>{
 assert.equal(validateGenerated({entries:[entry()]},['2026-09-01'])[0].id,'day-2026-09-01')
 for(const entries of [[],[entry({date:'2026-09-02'})],[entry({end:''})],[entry({lines:['Too short.']})]])assert.throws(()=>validateGenerated({entries},['2026-09-01']))
})
test('goal review must cover every line with exact source quotes',()=>{
 const e=entry(),reviews=e.lines.map((quote,lineIndex)=>({entryId:'a',quote,lineIndex,status:'aligned'}))
 assert.equal(validateGoalResults({reviews},[e],'Lunch independence').reviewed,3)
 assert.throws(()=>validateGoalResults({reviews:reviews.slice(0,2)},[e],'Lunch independence'))
 assert.throws(()=>validateGoalResults({reviews:[...reviews,reviews[0]]},[e],'Lunch independence'))
 assert.throws(()=>validateGoalResults({reviews:reviews.map(r=>({...r,quote:'invented'}))},[e],'Lunch independence'))
})
test('goal correction requires real goal quote and replacement text',()=>{
 const e=entry(),reviews=e.lines.map((quote,lineIndex)=>({entryId:'a',quote,lineIndex,status:'aligned'}))
 reviews[0]={...reviews[0],status:'mismatch',goalQuote:'Lunch',message:'Clarify connection',suggestion:'Practised preparing lunch with a checklist.'}
 assert.equal(validateGoalResults({reviews},[e],'Lunch independence').findings.length,1)
 reviews[0].goalQuote='Unstated goal';assert.throws(()=>validateGoalResults({reviews},[e],'Lunch independence'))
})
test('passcodes are salted, checked and profile unlock is bound to user and client',()=>{
 const hashed=hashPin('4821');assert.notEqual(hashed,hashPin('4821'));assert.ok(pinMatches('4821',hashed));assert.ok(!pinMatches('1234',hashed))
 const token=unlockToken('user-a','ahmad');verifyUnlock(token,'user-a','ahmad')
 assert.throws(()=>verifyUnlock(token,'user-b','ahmad'));assert.throws(()=>verifyUnlock(token,'user-a','wiremu'));assert.throws(()=>verifyUnlock(token+'x','user-a','ahmad'))
})
test('export keeps fictional marking, goals and corrected entry text',()=>{
 const text=exportText('Alex',{goals:'Lunch independence',entries:[entry()]})
 assert.match(text,/FICTIONAL COURSEWORK/);assert.match(text,/Lunch independence/);assert.match(text,/Start: 2026-09-01 09:00/)
 assert.ok(!validEntries([entry(),entry()]))
})
test('API rejects a request without verified sign-in before database access',async()=>{
 const {POST}=loader()('app/api/course/route.ts')
 const r=await POST(new Request('http://localhost/api/course',{method:'POST',body:JSON.stringify({action:'profiles'})}))
 assert.notEqual(r.status,200);assert.match((await r.json()).error,/sign in/)
})
test('API refuses cross-origin mutations',async()=>{
 const {POST}=loader()('app/api/course/route.ts')
 const r=await POST(new Request('http://localhost/api/course',{method:'POST',headers:{origin:'https://other.example'},body:'{}'}));assert.equal(r.status,403)
})
test('export review proofs change after any edit, goal or account change',()=>{
 const {reviewToken}=load('lib/course/server.ts'),e=entry()
 const proof=reviewToken('a','ahmad','Lunch',[e])
 assert.notEqual(proof,reviewToken('b','ahmad','Lunch',[e]))
 assert.notEqual(proof,reviewToken('a','wiremu','Lunch',[e]))
 assert.notEqual(proof,reviewToken('a','ahmad','Shopping',[e]))
 assert.notEqual(proof,reviewToken('a','ahmad','Lunch',[entry({start:'08:00'})]))
})
test('saved draft updates use verified owner and revision; conflict returns 409',async()=>{
 const secret='test-secret-with-at-least-thirty-two-characters'
 const calls=[]
 const l=loader({process:{env:{NEXT_PUBLIC_SUPABASE_URL:'https://db.example',NEXT_PUBLIC_SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'server',PROFILE_SESSION_SECRET:secret}},fetch:async(url,options)=>{
 calls.push({url,options})
 if(url.endsWith('/auth/v1/user'))return {ok:true,json:async()=>({id:'owner-a'})}
 if(options.method==='PATCH')return {ok:true,json:async()=>[]}
 return {ok:true,json:async()=>[{data:{},revision:4}]}
 }})
 const {unlockToken}=l('lib/course/server.ts'),{POST}=l('app/api/course/route.ts')
 const r=await POST(new Request('http://localhost/api/course',{method:'POST',headers:{authorization:'Bearer valid'},body:JSON.stringify({action:'save',profile:'ahmad',unlock:unlockToken('owner-a','ahmad'),revision:3,draft:{goals:'Lunch',prompt:'Practice',from:'2026-09-01',to:'2026-09-01',entries:[entry()]}})}))
 assert.equal(r.status,409)
 const patch=calls.find(c=>c.options.method==='PATCH');assert.ok(patch.url.includes('owner_id=eq.owner-a'));assert.ok(patch.url.includes('revision=eq.3'))
})
test('generation normalises presentation without inventing missing content',()=>{
 const a=entry({id:undefined,start:'9:00 am',end:'10:00 AM'}),b=entry({id:undefined,date:'2026-09-02',start:'1:00 pm',end:'2:00 pm'})
 const result=validateGenerated({entries:[b,a]},['2026-09-01','2026-09-02'])
 assert.equal(result[0].start,'09:00');assert.equal(result[1].start,'13:00')
 assert.equal(result[0].id,'day-2026-09-01')
 assert.throws(()=>validateGenerated({entries:[a,a]},['2026-09-01','2026-09-02']),/duplicates/)
 assert.throws(()=>validateGenerated({entries:[entry({start:'13:00 pm'})]},['2026-09-01']),/times/)
})
test('session goal match counts distinct goal findings only',()=>{
 const {goalMatch}=load('lib/course/domain.ts');const e=entry({lines:['a','b','c','d']})
 assert.equal(goalMatch(e,[]).percent,100)
 const f={entryId:'a',kind:'goal',lineIndex:1}
 assert.equal(goalMatch(e,[f,f,{entryId:'a',kind:'time'},{entryId:'other',kind:'goal',lineIndex:0}]).percent,75)
 assert.equal(goalMatch(e,[0,1,2,3].map(lineIndex=>({...f,lineIndex}))).percent,0)
})
test('generation route enforces response schema on initial and semantic-repair requests',async()=>{
 const env={NEXT_PUBLIC_SUPABASE_URL:'https://db.example',NEXT_PUBLIC_SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'server',PROFILE_SESSION_SECRET:'secret',LLM_API_KEY:'synthetic',GEMINI_MODEL:'primary'};
 const requests=[];
 const l=loader({process:{env},fetch:async(url,options)=>{
 if(url.endsWith('/auth/v1/user'))return new Response(JSON.stringify({id:'owner-a'}));
 if(url.includes('/rest/v1/'))return new Response(JSON.stringify([{revision:0}]));
 const body=JSON.parse(options.body);requests.push(body);
 const e=entry({date:'2026-09-01',end:requests.length===1?'08:00':'10:00'});
 return new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify({entries:[e]})}]}}]}));
 }});
 const {unlockToken}=l('lib/course/server.ts'),{POST}=l('app/api/course/route.ts');
 const r=await POST(new Request('http://localhost/api/course',{method:'POST',headers:{authorization:'Bearer valid'},body:JSON.stringify({action:'generate',profile:'ahmad',unlock:unlockToken('owner-a','ahmad'),dates:['2026-09-01'],draft:{goals:'Lunch',prompt:'Practice',from:'2026-09-01',to:'2026-09-01',entries:[]}})}));
 assert.equal(r.status,200);assert.equal((await r.json()).entries[0].end,'10:00');assert.equal(requests.length,2);
 for(const request of requests){const schema=request.generationConfig.responseJsonSchema;assert.deepEqual(schema.required,['entries']);assert.equal(schema.properties.entries.minItems,1);assert.deepEqual(schema.properties.entries.items.properties.date.enum,['2026-09-01']);}
});
