const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
test('API generation uses server-side structured output and rejects incomplete response',async()=>{
 const {ask}=await import('../scripts/draft.mjs');
 const oldFetch=global.fetch,oldKey=process.env.OPENAI_API_KEY,oldModel=process.env.OPENAI_MODEL;
 process.env.OPENAI_API_KEY='test-only';process.env.OPENAI_MODEL='test-model';
 try{
  global.fetch=async(url,options)=>{assert.equal(url,'https://api.openai.com/v1/responses');const b=JSON.parse(options.body);assert.equal(b.store,false);assert.equal(b.text.format.type,'json_schema');return {ok:true,json:async()=>({status:'completed',output:[{content:[{type:'output_text',text:'{"approved":true}'}]}]})};};
  assert.equal((await ask('test',{},'test')).approved,true);
  global.fetch=async()=>({ok:true,json:async()=>({status:'incomplete',output:[]})});await assert.rejects(ask('test',{},'test'),/incomplete/);
 }finally{global.fetch=oldFetch;if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;if(oldModel===undefined)delete process.env.OPENAI_MODEL;else process.env.OPENAI_MODEL=oldModel;}
});
test('JSON Schema rejects extra fields and undersized vocabulary',async()=>{
 const {validateSchema}=await import('../scripts/schema.mjs');
 const schema=require('../schemas/lesson.schema.json'),l=JSON.parse(JSON.stringify(require('../content/lessons/day-1.json')));
 assert.equal(validateSchema(l,schema),true);l.extra='unexpected';assert.throws(()=>validateSchema(l,schema),/unknown property/);delete l.extra;l.vocabulary=[];assert.throws(()=>validateSchema(l,schema),/array length/);
});
