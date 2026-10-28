const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const source=path.resolve(__dirname,'..');
function fixture(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'reading-test-'));fs.cpSync(source,dir,{recursive:true,filter:p=>!['.git','node_modules','work'].includes(path.basename(p))});t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));for(const name of fs.readdirSync(path.join(dir,'content/lessons')))if(name!=='day-1.json')fs.unlinkSync(path.join(dir,'content/lessons',name));for(const name of fs.readdirSync(path.join(dir,'content/queue')))fs.unlinkSync(path.join(dir,'content/queue',name));fs.copyFileSync(path.join(dir,'tests/fixtures/library.json'),path.join(dir,'content/queue/001-library.json'));return dir;}
function run(dir,script,env={}){return spawnSync(process.execPath,[script],{cwd:dir,env:{...process.env,COURSE_MODE:'queue',COURSE_DATE:'2026-10-29',...env},encoding:'utf8'});}
test('daily queue publish, build, same-day idempotency and exhausted queue failure',t=>{
 const dir=fixture(t);let r=run(dir,'scripts/daily.mjs');assert.equal(r.status,0,r.stderr);
 const l=JSON.parse(fs.readFileSync(path.join(dir,'content/lessons/library-learning.json')));assert.equal(l.date,'2026-10-29');assert.equal(l.day,2);
 assert.equal(run(dir,'scripts/build.mjs').status,0);
 assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'dist/courses.json'))).lessons.length,2);
 r=run(dir,'scripts/daily.mjs');assert.equal(r.status,0);assert.match(r.stdout,/Already published/);
 r=run(dir,'scripts/daily.mjs',{COURSE_DATE:'2026-10-30'});assert.notEqual(r.status,0);assert.match(r.stderr,/No approved/);
 assert.equal(fs.readdirSync(path.join(dir,'content/lessons')).length,2);
});
test('invalid queue never becomes published content or consumes the queue',t=>{
 const dir=fixture(t),file=path.join(dir,'content/queue/001-library.json');
 const entry=JSON.parse(fs.readFileSync(file));entry.lesson.questions[0].answer=99;fs.writeFileSync(file,JSON.stringify(entry));
 const r=run(dir,'scripts/daily.mjs');assert.notEqual(r.status,0);assert.ok(fs.existsSync(file));assert.equal(fs.readdirSync(path.join(dir,'content/lessons')).length,1);
});
test('missing API credentials fail without publishing',t=>{
 const dir=fixture(t);const r=run(dir,'scripts/daily.mjs',{COURSE_MODE:'draft',OPENAI_API_KEY:'',OPENAI_MODEL:''});assert.notEqual(r.status,0);assert.match(r.stderr,/Set OPENAI_API_KEY/);assert.equal(fs.readdirSync(path.join(dir,'content/lessons')).length,1);
});
test('build hook rejects untrusted destinations before any network call',t=>{
 const dir=fixture(t);const r=run(dir,'scripts/hook.mjs',{NETLIFY_BUILD_HOOK:'https://example.invalid/steal'});assert.notEqual(r.status,0);assert.match(r.stderr,/Invalid Netlify/);
});
