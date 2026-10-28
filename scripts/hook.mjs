const raw=process.env.NETLIFY_BUILD_HOOK;
if(!raw)throw Error('Missing NETLIFY_BUILD_HOOK: commit may already exist. Set secret and rerun; existing website is unaffected.');
const url=new URL(raw);
if(url.protocol!=='https:'||url.hostname!=='api.netlify.com'||!/^\/build_hooks\/[a-zA-Z0-9_-]+$/.test(url.pathname)||url.search||url.hash)throw Error('Invalid Netlify build hook URL');
const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(30000)});
if(!r.ok)throw Error(`Netlify build hook returned HTTP ${r.status}; retry workflow after fixing hook.`);
console.log('Netlify build requested. Check Netlify Deploys for actual deployment result.');
