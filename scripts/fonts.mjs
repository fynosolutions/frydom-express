import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('public/assets/fonts',{recursive:true});
async function request(url,options={}){for(let attempt=0;attempt<3;attempt++){try{const r=await fetch(url,{...options,signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error('HTTP '+r.status);return r;}catch(error){if(attempt===2)throw error;}}}
const response=await request('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap',{headers:{'User-Agent':'Mozilla/5.0'}});
const css=await response.text();
let localCss=css;
for(const [i,match] of [...css.matchAll(/url\((https:[^)]+)\)/g)].entries()){
  const url=match[1];const r=await request(url);
  const file=`font-${i}.${url.includes('.woff2')?'woff2':url.includes('.woff')?'woff':'ttf'}`;
  await writeFile('public/assets/fonts/'+file,Buffer.from(await r.arrayBuffer()));
  localCss=localCss.replace(url,'/assets/fonts/'+file);
}
await writeFile('public/assets/fonts/fonts.css',localCss);
for(const [family,dir]of[['BarlowCondensed','barlowcondensed'],['DMSans','dmsans']]){
  const r=await request(`https://raw.githubusercontent.com/google/fonts/main/ofl/${dir}/OFL.txt`);
  if(r.ok)await writeFile(`public/assets/fonts/${family}-OFL.txt`,await r.text());
}
console.log('Fonts self-hosted');
