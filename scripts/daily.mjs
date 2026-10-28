import fs from 'node:fs';
import path from 'node:path';
import {core,root,read,write,files,validate} from './lib.mjs';
import {generateDraft,reviewDraft} from './draft.mjs';
const mode=process.env.COURSE_MODE||'queue';
if(!['queue','draft','auto'].includes(mode))throw Error('COURSE_MODE must be queue, draft or auto');
const date=process.env.COURSE_DATE||core.today();if(!core.date(date))throw Error('Invalid COURSE_DATE');
const list=validate();
if(list.some(l=>l.date===date)){console.log(`Already published for ${date}; no changes.`);process.exit(0);}
if(date<list.at(-1).date)throw Error('Cannot backdate a new course');
const day=Math.max(...list.map(l=>l.day))+1;
let lesson,queueFile;
if(mode==='queue'){
 for(const name of files('content/queue')){const entry=read('content/queue/'+name);if(entry.status==='approved'&&!list.some(l=>l.id===entry.lesson?.id)){lesson=entry.lesson;queueFile=name;break;}}
 if(!lesson)throw Error('No approved lessons remain. Refill content/queue; existing site stays online.');
}else{
 if(mode==='auto'&&process.env.AUTO_PUBLISH_AI!=='true')throw Error('Auto mode requires explicit AUTO_PUBLISH_AI=true opt-in');
 lesson=await generateDraft({date,day,titles:list.map(l=>l.title)});
 write('work/draft.json',lesson);
 if(mode==='draft'){console.log('Draft saved to work/draft.json. Review it and add an approved queue entry; nothing published.');process.exit(0);}
 const review=await reviewDraft(lesson);write('work/ai-review.json',review);
 if(review.approved!==true||!Array.isArray(review.issues)||review.issues.length)throw Error('AI review rejected draft; see work/ai-review.json');
}
lesson={...lesson,date,day};core.quality(lesson);
if(list.some(l=>l.id===lesson.id||l.title.toLowerCase()===lesson.title.toLowerCase()||l.paragraphs.join(' ')===lesson.paragraphs.join(' ')))throw Error('Duplicate course content');
// Stage and validate before consuming queue. Workflow commits only after tests/build pass.
const target=`content/lessons/${lesson.id}.json`;
write(target,lesson);
try{validate();}catch(e){fs.unlinkSync(path.join(root,target));throw e;}
if(queueFile)fs.unlinkSync(path.join(root,'content/queue',queueFile));
console.log(`Prepared ${lesson.id} for ${date}. Run checks/build before committing.`);
