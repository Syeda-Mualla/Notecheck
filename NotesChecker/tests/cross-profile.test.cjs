const {test}=require('node:test'),assert=require('node:assert/strict'),loader=require('./helpers/load.cjs');
const {crossProfileTimeChecks}=loader()('lib/course/domain.ts');
const entry=(start='09:00',end='10:00',date='2026-10-01')=>({id:'same-id',date,start,end,lines:['Private note']});
const row=(key,e)=>({profile_key:key,data:{entries:[e]}});
for(const [name,start,end,count] of [['identical','09:00','10:00',1],['partial','09:30','10:30',1],['contained','09:15','09:45',1],['contains','08:00','11:00',1],['adjacent after','10:00','11:00',0],['adjacent before','08:00','09:00',0],['invalid','','10:00',0]])test(name,()=>assert.equal(crossProfileTimeChecks([entry()],'ahmad',[row('wiremu',entry(start,end))]).length,count));
test('different dates, same profile and retired profiles do not conflict',()=>assert.equal(crossProfileTimeChecks([entry()],'ahmad',[row('wiremu',entry('09:00','10:00','2026-10-02')),row('ahmad',entry()),row('maya',entry())]).length,0));
test('both other profiles appear without disclosing their notes',()=>{const f=crossProfileTimeChecks([entry()],'ahmad',[row('wiremu',entry()),row('derek',entry())]);assert.equal(f.length,2);assert.match(f[0].message,/Ahmad Moustafa.*Wiremu Thompson/);assert.doesNotMatch(JSON.stringify(f),/Private note/)});
function setup(fail=false){
 const env={NEXT_PUBLIC_SUPABASE_URL:'https://db.example',NEXT_PUBLIC_SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'server',PROFILE_SESSION_SECRET:'test-secret'};
 let driveCalls=0;
 const l=loader({process:{env},fetch:async(url)=>{
  if(url.endsWith('/auth/v1/user'))return new Response(JSON.stringify({id:'owner-a'}));
  if(url.includes('googleapis.com')){driveCalls++;throw Error('Unexpected Drive call')}
  assert.match(url,/owner_id=eq.owner-a/);
  if(url.includes('profile_key=in.')){assert.match(url,/ahmad,wiremu,derek/);if(fail)return new Response('{}',{status:500});return new Response(JSON.stringify([row('wiremu',entry())]));}
  return new Response(JSON.stringify([row('ahmad',entry())]));
 }});
 const server=l('lib/course/server.ts'),{POST}=l('app/api/course/route.ts');
 const draft={goals:'Goal',prompt:'',from:'2026-10-01',to:'2026-10-01',entries:[entry()]};
 return {draft,drive:()=>driveCalls,request:async(action,extra={})=>POST(new Request('http://localhost/api/course',{method:'POST',headers:{authorization:'Bearer test'},body:JSON.stringify({action,profile:'ahmad',unlock:server.unlockToken('owner-a','ahmad'),draft,proofs:[server.reviewToken('owner-a','ahmad',draft.goals,draft.entries[0])],googleToken:'test',...extra})}))};
}
test('timestamp endpoint checks latest draft, owner scope and minimal response',async()=>{const x=setup();let r=await x.request('timestamps');assert.equal(r.status,200);assert.equal((await r.json()).findings.length,1);x.draft.entries=[entry('10:00','11:00')];r=await x.request('timestamps');assert.equal((await r.json()).findings.length,0)});
test('export rejects cross-profile overlap even with valid goal proof',async()=>{const x=setup(),r=await x.request('export');assert.equal(r.status,409);assert.match((await r.json()).error,/overlap/);assert.equal(x.drive(),0)});
test('database failure cannot produce a clean check or export',async()=>{const x=setup(true);assert.equal((await x.request('timestamps')).status,400);assert.equal((await x.request('export')).status,400);assert.equal(x.drive(),0)});
