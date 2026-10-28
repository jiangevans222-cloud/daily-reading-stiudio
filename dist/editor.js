(()=>{
 'use strict';
 const $=s=>document.querySelector(s),C=window.ReadingCore,clone=x=>JSON.parse(JSON.stringify(x));
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let lesson=clone(window.SEED_LESSONS[0]),dirty=false,rawDirty=false;
 const names={id:'唯一 id（英文 / 数字 / 连字符）',day:'课程序号',date:'发布日期（北京时间）',title:'英文标题',subtitle:'中文标题',topic:'主题',level:'难度',minutes:'建议分钟数',source:'来源与授权说明'};
 const field=(label,path,value,type='area')=>`<label>${esc(label)}${type==='area'?`<textarea data-path="${path}">${esc(value)}</textarea>`:`<input data-path="${path}" type="${type}" value="${esc(value)}">`}</label>`;
 function group(title,body){return `<fieldset><legend>${esc(title)}</legend>${body}</fieldset>`;}
 function render(){
  $('#lesson-editor').innerHTML=group('基本信息',`<div class="fields-row">${Object.entries(names).map(([key,name])=>field(name,key,lesson[key],['day','minutes'].includes(key)?'number':key==='date'?'date':'text')).join('')}</div>`)
   +lesson.paragraphs.map((p,i)=>group(`第 ${i+1} 段`,field('英文正文',`paragraphs.${i}`,p)+field('对应中文翻译',`translation.${i}`,lesson.translation[i]))).join('')
   +lesson.questions.map((q,i)=>group(`阅读题 ${i+1}`,field('题干',`questions.${i}.stem`,q.stem)+q.options.map((o,j)=>field('选项 '+'ABCD'[j],`questions.${i}.options.${j}`,o,'text')).join('')+field('正确答案（0=A，1=B，2=C，3=D）',`questions.${i}.answer`,q.answer,'number')+q.explanations.map((x,j)=>field('选项 '+'ABCD'[j]+' 解析',`questions.${i}.explanations.${j}`,x)).join('')+field('原文依据（原文连续英文引文）',`questions.${i}.evidence`,q.evidence)+field('题型',`questions.${i}.skill`,q.skill,'text'))).join('')
   +lesson.vocabulary.map((v,i)=>group(`词汇 ${i+1}`,v.map((x,j)=>field(['单词','音标','词性和中文释义','英文例句','中文译文'][j],`vocabulary.${i}.${j}`,x,'text')).join(''))).join('')
   +lesson.sentences.map((v,i)=>group(`长难句 ${i+1}`,['text','structure','meaning','tip'].map((k,j)=>field(['原文句子','结构','译文','提示'][j],`sentences.${i}.${k}`,v[k])).join(''))).join('')
   +lesson.expressions.map((v,i)=>group(`表达 ${i+1}`,['phrase','meaning','example'].map((k,j)=>field(['表达','含义','例句'][j],`expressions.${i}.${k}`,v[k])).join(''))).join('')
   +(lesson.review?group('最后讲解',field('总结','review.summary',lesson.review.summary)+['structure','logic','traps','selfCheck'].map((k,j)=>group(['逐段结构','论证逻辑','易错点','自测'][j],lesson.review[k].map((x,i)=>field(`条目 ${i+1}`,`review.${k}.${i}`,x)).join(''))).join('')+field('带走的方法','review.takeaway',lesson.review.takeaway)):'');
  $('#raw-json').value=JSON.stringify(lesson,null,2);rawDirty=false;
  $('#lesson-editor').onsubmit=e=>e.preventDefault();
  $('#lesson-editor').oninput=e=>{const path=e.target.dataset.path;if(!path)return;const parts=path.split('.');let target=lesson;for(const p of parts.slice(0,-1))target=target[p];target[parts.at(-1)]=e.target.type==='number'?Number(e.target.value):e.target.value;dirty=true;$('#raw-json').value=JSON.stringify(lesson,null,2);};
 }
 function status(t){$('#editor-status').textContent=t;}
 $('#lesson-select').innerHTML=window.SEED_LESSONS.map((l,i)=>`<option value="${i}">${esc(l.date+' · '+l.title)}</option>`).join('');
 function allowReplace(){return !dirty||confirm('当前修改尚未下载，是否舍弃并载入另一份课程？');}
 $('#lesson-select').onchange=e=>{if(!allowReplace())return;lesson=clone(window.SEED_LESSONS[Number(e.target.value)]);dirty=false;render();status('课程已载入。修改已发布内容时请使用新的 id。');};
 $('#open-file').onchange=async e=>{try{if(!allowReplace())return;const f=e.target.files[0];if(!f)return;if(f.size>5000000)throw Error('文件需小于 5MB');const raw=JSON.parse(await f.text());C.validateLesson(raw.lesson||raw);lesson=clone(raw.lesson||raw);dirty=false;render();status('文件已载入，仅在当前页面编辑。');}catch(err){status('载入失败：'+err.message);}};
 $('#apply-json').onclick=()=>{try{const raw=JSON.parse($('#raw-json').value);C.validateLesson(raw);lesson=raw;dirty=true;render();status('JSON 已应用。');}catch(e){status('JSON 无效：'+e.message);}};
 $('#raw-json').oninput=()=>{dirty=true;rawDirty=true;};
 function validate(){if(rawDirty){const raw=JSON.parse($('#raw-json').value);C.validateLesson(raw);lesson=raw;render();}const report=C.quality(lesson);let message=`检查通过：${report.words} 词，5 道题。\n结构检查不代表题意、翻译及版权审校完成。`;if(window.SEED_LESSONS.some(l=>l.id===lesson.id))message+='\n提醒：id 已发布，请复制为新 id 后发布修订。';status(message);return true;}
 $('#validate').onclick=()=>{try{validate();}catch(e){status('检查未通过：'+e.message);}};
 function download(queue){try{validate();const data=queue?{status:'draft',lesson}:lesson;const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=(queue?'queue-':'')+lesson.id+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);dirty=false;status(queue?'待审队列已下载。人工审校后改 status 为 approved，再提交到仓库。':'课程文件已下载。提交到仓库并等待 Netlify 发布。');}catch(e){status('无法下载：'+e.message);}}
 $('#download-lesson').onclick=()=>download(false);$('#download-queue').onclick=()=>download(true);
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});render();
})();
