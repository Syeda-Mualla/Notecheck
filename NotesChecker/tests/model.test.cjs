const {test}=require('node:test');
const assert=require('node:assert/strict');
const loader=require('./helpers/load.cjs');
const reply=value=>new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}});
const success=()=>reply({candidates:[{content:{parts:[{text:'{"entries":[]}'}]},finishReason:'STOP'}]});
function model(fetch,env={}){return loader({fetch,process:{env:{LLM_API_KEY:'synthetic-secret',GEMINI_MODEL:'primary',...env}}})('lib/course/server.ts').model;}
test('normalises model prefix/whitespace and uses fallback after provider failure',async()=>{
 const urls=[];
 const run=model(async url=>{urls.push(url);return urls.length===1?new Response('{}',{status:503}):success()},{GEMINI_MODEL:' models/primary ',GEMINI_FALLBACK_MODEL:' models/backup '});
 assert.deepEqual(JSON.parse(JSON.stringify(await run('test'))),{entries:[]});
 assert.match(urls[0],/models\/primary:generateContent$/);assert.match(urls[1],/models\/backup:generateContent$/);
});
for(const [status,expected] of [[403,/access denied/],[404,/model not found/],[429,/quota or rate limit/],[503,/temporarily unavailable/]]){
 test('classifies provider '+status+' without leaking raw errors',async()=>{
 const run=model(async()=>new Response(JSON.stringify({error:{message:'synthetic-secret private prompt'}}),{status}));
 await assert.rejects(run('private prompt'),error=>{assert.match(error.message,expected);assert.doesNotMatch(error.message,/synthetic-secret|private prompt/);return true;});
 });
}
test('invalid key has an actionable safe message',async()=>{
 await assert.rejects(model(async()=>new Response(JSON.stringify({error:{details:[{reason:'API_KEY_INVALID'}]}}),{status:400}))('test'),/API key rejected/);
});
test('timeout is distinguished from configuration errors',async()=>{
 const err=new Error('internal');err.name='TimeoutError';
 await assert.rejects(model(async()=>{throw err})('test'),/timed out after 22 seconds/);
});
test('malformed JSON tries fallback, duplicate fallback is not called twice',async()=>{
 let calls=0;
 await model(async()=>++calls===1?reply({candidates:[{content:{parts:[{text:'bad'}]}}]}):success(),{GEMINI_FALLBACK_MODEL:'backup'})('test');assert.equal(calls,2);
 calls=0;
 await assert.rejects(model(async()=>{calls++;return new Response('{}',{status:503})},{GEMINI_FALLBACK_MODEL:'primary'})('test'),/503/);assert.equal(calls,1);
});
test('blocked response is reported without pretending notes were generated',async()=>{
 await assert.rejects(model(async()=>reply({promptFeedback:{blockReason:'SAFETY'}}))('test'),/blocked this request/);
});
test('requested JSON schema is sent to Gemini for both primary and fallback',async()=>{
 const configs=[];const schema={type:'object',required:['entries'],properties:{entries:{type:'array',items:{type:'object'}}}};
 const run=model(async(url,options)=>{configs.push(JSON.parse(options.body).generationConfig);return configs.length===1?new Response('{}',{status:503}):success()},{GEMINI_FALLBACK_MODEL:'backup'});
 await run('test',schema);assert.equal(configs.length,2);
 for(const config of configs){assert.deepEqual(config.responseJsonSchema,schema);assert.equal(config.responseMimeType,'application/json')}
});
test('complete Markdown JSON wrapper is accepted but truncated JSON remains rejected',async()=>{
 const run=model(async()=>reply({candidates:[{content:{parts:[{text:'```json\n{"entries":[]}\n```'}]}}]}));
 assert.ok(Array.isArray((await run('test')).entries));
 await assert.rejects(model(async()=>reply({candidates:[{content:{parts:[{text:'{"entries":['}]}}]}))('test'),/not valid JSON/);
});
test('empty text and token truncation receive distinct errors',async()=>{
 await assert.rejects(model(async()=>reply({candidates:[{content:{parts:[]}}]}))('test'),/response was empty/);
 await assert.rejects(model(async()=>reply({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'{"entries":[]}'}]}}]}))('test'),/response was incomplete/);
});
