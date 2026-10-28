const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=require('../dist/core.js');
const lesson=require('../content/lessons/day-1.json');
const clone=x=>JSON.parse(JSON.stringify(x));
const state=()=>({progress:{'day-1':{answers:{},checks:{},vocab:{},notes:'个人笔记',bookmark:false,attempts:[],wrong:[],elapsed:12.5}},custom:[]});
test('shared lessons and prepared queue pass quality checks',()=>{
 assert.equal(core.quality(lesson).questions,5);
 assert.equal(core.quality(require('./fixtures/library.json').lesson).questions,5);
});
test('grade tracks wrong indices and refuses partial answers',()=>{
 const a=Object.fromEntries(lesson.questions.map((q,i)=>[i,q.answer]));
 assert.equal(core.grade(lesson,a).score,100);
 a[2]=(a[2]+1)%4;assert.deepEqual(core.grade(lesson,a).wrong,[2]);assert.equal(core.grade(lesson,a).score,80);
 assert.throws(()=>core.grade(lesson,{}));
});
test('versioned backup keeps time, notes and orphan lesson snapshots; legacy works',()=>{
 const s=state(),backup=core.backup(s,[lesson]);assert.equal(backup.version,2);
 assert.deepEqual(core.restore(backup,[lesson]),s);
 assert.deepEqual(core.restore(s,[lesson]),s);
 const other={...clone(lesson),id:'other'};
 const recovered=core.restore(backup,[other]);assert.equal(recovered.custom[0].id,'day-1');assert.equal(recovered.progress['day-1'].elapsed,12.5);
});
test('reject bad evidence, impossible dates, duplicate options, unsafe identifiers',()=>{
 for(const alter of [l=>l.questions[0].evidence='invented quotation',l=>l.date='2026-02-30',l=>l.questions[0].options[1]=l.questions[0].options[0],l=>l.id='__proto__']){const l=clone(lesson);alter(l);assert.throws(()=>core.quality(l));}
});
test('restore rejects broken histories, out-of-range indices and unsupported versions',()=>{
 let s=state();s.progress['day-1'].submitted=true;assert.throws(()=>core.restore(s,[lesson]));
 s=state();s.progress['day-1'].answers[99]=1;assert.throws(()=>core.restore(s,[lesson]));
 const b=core.backup(state(),[lesson]);b.version=999;assert.throws(()=>core.restore(b,[lesson]));
});
test('Beijing day boundary and future course selection',()=>{
 assert.equal(core.today(new Date('2026-10-28T16:01:00Z')),'2026-10-29');
 const next={...lesson,id:'tomorrow',date:'2026-10-29',day:2};
 assert.deepEqual(core.available([next,lesson],'2026-10-28').map(l=>l.id),['day-1']);
 assert.equal(core.available([next,lesson],'2026-10-29').at(-1).id,'tomorrow');
});
