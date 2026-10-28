(function(root,factory){if(typeof module==='object')module.exports=factory();else root.ReadingCore=factory();})(typeof window==='object'?window:globalThis,()=>{
'use strict';
const safeId=x=>typeof x==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(x)&&!['constructor','prototype','__proto__'].includes(x);
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const text=x=>typeof x==='string'&&x.trim().length>0&&x.length<20000;
function assert(ok,message){if(!ok)throw Error(message);}
function date(x){return typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!isNaN(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;}
function validateLesson(l){
 assert(obj(l)&&safeId(l.id),'课程 id 无效');
 assert(Number.isInteger(l.day)&&l.day>0&&l.day<100000,'day 无效');
 assert(['title','subtitle','topic','level','source'].every(k=>text(l[k])),'课程基本信息缺失');
 assert(Number.isFinite(l.minutes)&&l.minutes>0&&l.minutes<=180,'建议时长无效');
 assert(l.date===undefined||date(l.date),'课程日期无效');
 assert(Array.isArray(l.paragraphs)&&l.paragraphs.length>0&&l.paragraphs.length<=20&&l.paragraphs.every(text),'正文无效');
 assert(Array.isArray(l.translation)&&l.translation.length===l.paragraphs.length&&l.translation.every(text),'正文与译文段落必须对应');
 assert(Array.isArray(l.questions)&&l.questions.length>0&&l.questions.length<=20,'题目无效');
 l.questions.forEach(q=>assert(obj(q)&&['stem','evidence','skill'].every(k=>text(q[k]))&&Array.isArray(q.options)&&q.options.length===4&&q.options.every(text)&&new Set(q.options).size===4&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4&&Array.isArray(q.explanations)&&q.explanations.length===4&&q.explanations.every(text),'题目须包含四个不同选项、四条解析、依据和 0–3 的答案'));
 assert(Array.isArray(l.vocabulary)&&l.vocabulary.every(v=>Array.isArray(v)&&v.length===5&&v.every(text)),'词汇格式无效');
 assert(Array.isArray(l.sentences)&&l.sentences.every(s=>obj(s)&&['text','structure','meaning','tip'].every(k=>text(s[k]))),'长难句格式无效');
 assert(Array.isArray(l.expressions)&&l.expressions.every(s=>obj(s)&&['phrase','meaning','example'].every(k=>text(s[k]))),'表达格式无效');
 if(l.review!==undefined)assert(obj(l.review)&&text(l.review.summary)&&text(l.review.takeaway)&&['structure','logic','traps','selfCheck'].every(k=>Array.isArray(l.review[k])&&l.review[k].length>0&&l.review[k].every(text)),'复盘格式无效');
 return l;
}
function quality(l){
 validateLesson(l); assert(date(l.date),'公共课程必须有日期');
 const words=l.paragraphs.join(' ').trim().split(/\s+/).length;
 assert(words>=350&&words<=850,'公共阅读应为 350–850 词');
 assert(l.questions.length===5,'公共课程需要 5 道题');
 assert(l.vocabulary.length>=8&&l.sentences.length>=2&&l.expressions.length>=2&&l.review,'词汇≥8、长难句≥2、表达≥2，且需要复盘');
 assert(l.review.structure.length===l.paragraphs.length,'复盘结构需覆盖每段');
 const body=l.paragraphs.join(' ').toLowerCase();
 l.questions.forEach(q=>assert(body.includes(q.evidence.toLowerCase()),'每题 evidence 必须为原文中的连续引文'));
 l.sentences.forEach(s=>assert(body.includes(s.text.toLowerCase()),'长难句必须来自原文'));
 assert(new Set(l.questions.map(q=>q.stem.toLowerCase())).size===5,'题干重复');
 assert(new Set(l.vocabulary.map(v=>v[0].toLowerCase())).size===l.vocabulary.length,'词汇重复');
 return {words,questions:5};
}
function validateCollection(list){assert(Array.isArray(list)&&list.length>0&&list.length<=10000,'课库格式无效');list.forEach(validateLesson);assert(new Set(list.map(l=>l.id)).size===list.length,'课程 id 重复');return list;}
function validateState(s,shared){
 assert(obj(s)&&obj(s.progress)&&Array.isArray(s.custom)&&s.custom.length<=1000,'备份格式无效');
 s.custom.forEach(validateLesson);const lessons=[...shared,...s.custom];validateCollection(lessons);
 for(const [id,p] of Object.entries(s.progress)){
  const l=lessons.find(l=>l.id===id);assert(safeId(id)&&l&&obj(p),'学习记录对应课程缺失');
  assert(obj(p.answers)&&obj(p.checks)&&obj(p.vocab)&&typeof p.notes==='string'&&p.notes.length<=100000&&typeof p.bookmark==='boolean'&&Array.isArray(p.attempts)&&Array.isArray(p.wrong),'学习记录不完整');
  const answers=(a,complete=false)=>obj(a)&&Object.entries(a).every(([k,v])=>/^\d+$/.test(k)&&Number(k)<l.questions.length&&Number.isInteger(v)&&v>=0&&v<=3)&&(!complete||Object.keys(a).length===l.questions.length);
  assert(answers(p.answers),'答案记录无效');
  assert(Object.entries(p.checks).every(([k,v])=>['read','quiz','vocab','writing'].includes(k)&&typeof v==='boolean'),'清单记录无效');
  assert(Object.entries(p.vocab).every(([k,v])=>/^\d+$/.test(k)&&Number(k)<l.vocabulary.length&&typeof v==='boolean'),'词汇记录无效');
  assert(p.wrong.every(i=>Number.isInteger(i)&&i>=0&&i<l.questions.length)&&new Set(p.wrong).size===p.wrong.length,'错题索引无效');
  assert(p.submitted===undefined||typeof p.submitted==='boolean','提交状态无效');
  assert(p.attempts.length<=10000&&p.attempts.every(a=>obj(a)&&answers(a.answers,true)&&Number.isFinite(a.score)&&a.score>=0&&a.score<=100&&Number.isInteger(a.correct)&&a.correct>=0&&a.correct<=l.questions.length&&Math.abs(a.score-a.correct/l.questions.length*100)<0.001&&typeof a.date==='string'&&!isNaN(Date.parse(a.date))&&(a.seconds===undefined||Number.isFinite(a.seconds)&&a.seconds>=0)),'答题历史无效');
  assert(!p.submitted||p.attempts.length>0,'提交状态缺少历史');
  assert(p.elapsed===undefined||Number.isFinite(p.elapsed)&&p.elapsed>=0&&p.elapsed<=1e9,'计时记录无效');
 }
 return s;
}
function backup(s,shared){validateState(s,shared);return {format:'daily-reading-backup',version:2,exportedAt:new Date().toISOString(),lessons:shared,state:s};}
function restore(raw,shared){
 if(raw?.format!=='daily-reading-backup')return validateState(raw,shared); // legacy v1
 assert(raw.version===2,'不支持的备份版本');validateCollection(raw.lessons);
 // Retain snapshots of lessons no longer present on this server. Never replace shared lessons.
 const s=JSON.parse(JSON.stringify(raw.state));assert(Array.isArray(s.custom),'备份缺少课程');
 for(const l of raw.lessons)if(!shared.some(x=>x.id===l.id)&&!s.custom.some(x=>x.id===l.id))s.custom.push(l);
 return validateState(s,shared);
}
function today(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
function available(list,now=today()){return list.filter(l=>!l.date||l.date<=now).sort((a,b)=>(a.date||'').localeCompare(b.date||'')||a.day-b.day);}
function grade(l,answers){assert(l.questions.every((q,i)=>Number.isInteger(answers[i])&&answers[i]>=0&&answers[i]<4),'请完成全部题目');const wrong=l.questions.flatMap((q,i)=>q.answer===answers[i]?[]:[i]);const correct=l.questions.length-wrong.length;return {correct,wrong,score:correct/l.questions.length*100};}
return {safeId,date,validateLesson,quality,validateCollection,validateState,backup,restore,today,available,grade};
});
