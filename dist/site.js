(async()=>{
 'use strict';
 try{
  const r=await fetch('site-config.json',{cache:'no-store'});if(!r.ok)return;const c=await r.json();
  if(typeof c.name!=='string'||typeof c.tagline!=='string')return;
  document.title=c.name+' · '+c.tagline;
  document.querySelectorAll('[data-site-name]').forEach(e=>e.textContent=c.name);
  const meta=document.querySelector('meta[name="description"]');if(meta&&typeof c.description==='string')meta.content=c.description;
  const repo=document.querySelector('#repository-link');if(repo&&/^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/.test(c.repositoryUrl||'')){repo.href=c.repositoryUrl;repo.hidden=false;}
 }catch{/* Keep the built-in name when offline. */}
})();
