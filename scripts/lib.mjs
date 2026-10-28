import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import core from '../dist/core.js';
import {validateSchema} from './schema.mjs';
export {core};
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
export const write=(p,data)=>{const file=path.join(root,p);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');};
export const files=dir=>fs.readdirSync(path.join(root,dir)).filter(n=>n.endsWith('.json')).sort();
export function lessons(){return files('content/lessons').map(n=>read('content/lessons/'+n)).sort((a,b)=>a.date.localeCompare(b.date));}
export function validate(){const list=lessons(),schema=read('schemas/lesson.schema.json');core.validateCollection(list);const days=new Set(),dates=new Set(),titles=new Set(),bodies=new Set();for(const l of list){validateSchema(l,schema);core.quality(l);for(const [set,value] of [[days,l.day],[dates,l.date],[titles,l.title.toLowerCase()],[bodies,l.paragraphs.join(' ')]]){if(set.has(value))throw Error('公共课程 day/date/title/body 重复');set.add(value);}}return list;}
