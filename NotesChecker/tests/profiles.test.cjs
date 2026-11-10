const {test}=require('node:test'),assert=require('node:assert/strict');
const loader=require('./helpers/load.cjs');
test('three new profiles seed separate owner records and preserve existing drafts',async()=>{
 const existing=new Map([['alex',{data:{goals:'Old goals',entries:[{id:'old'}]}}],['wiremu',{data:{goals:'Edited goal',entries:[]}}]]);
 const inserted=[];
 const env={NEXT_PUBLIC_SUPABASE_URL:'https://db.example',NEXT_PUBLIC_SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'server',PROFILE_PIN_ALEX:'1234',PROFILE_PIN_MAYA:'2345',PROFILE_PIN_JORDAN:'3456'};
 const l=loader({process:{env},fetch:async(url,options)=>{
 if(url.endsWith('/auth/v1/user'))return new Response(JSON.stringify({id:'owner-a'}));
 if(options.method==='POST'){const row=JSON.parse(options.body);inserted.push(row);existing.set(row.profile_key,row);return new Response('[]');}
 assert.match(url,/owner_id=eq.owner-a/);return new Response(JSON.stringify([...existing.keys()].map(profile_key=>({profile_key}))));
 }});
 const {POST}=l('app/api/course/route.ts');
 const req=()=>new Request('http://localhost/api/course',{method:'POST',headers:{authorization:'Bearer valid'},body:'{"action":"profiles"}'});
 const response=await POST(req());assert.equal(response.status,200);
 const result=await response.json();assert.deepEqual(result.profiles.map(p=>p.name),['Ahmad Moustafa','Wiremu Thompson','Derek Paerau']);
 assert.doesNotMatch(JSON.stringify(result),/respite|fatigue|release/);
 assert.equal(inserted.length,2);for(const row of inserted){assert.equal(row.owner_id,'owner-a');assert.equal(row.data.entries.length,0);assert.equal(row.data.goals.match(/Your goal:/g).length,5);}
 assert.equal(existing.get('wiremu').data.goals,'Edited goal');assert.equal(existing.get('alex').data.entries[0].id,'old');
 await POST(req());assert.equal(inserted.length,2);
});
test('all supplied goals and strategies are present with the correct participant',()=>{
 const {profileGoals}=loader()('lib/course/profile-goals.ts');
 assert.equal(profileGoals.wiremu.match(/Your goal:/g).length,2);
 assert.match(profileGoals.ahmad,/respite/);assert.match(profileGoals.ahmad,/communication skills/);assert.match(profileGoals.ahmad,/personal care/);assert.match(profileGoals.ahmad,/vocational/);assert.match(profileGoals.ahmad,/Drivers license/);
 assert.match(profileGoals.wiremu,/on my release/);assert.match(profileGoals.wiremu,/own my own car/);
 assert.match(profileGoals.derek,/basketball/);assert.match(profileGoals.derek,/fatigue/);assert.match(profileGoals.derek,/safe cooking/);assert.match(profileGoals.derek,/employment/);assert.match(profileGoals.derek,/Learners Permit/);
});
