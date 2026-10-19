import{readFile,writeFile,mkdir}from'node:fs/promises';
import{load}from'cheerio';
await mkdir('sources/reference',{recursive:true});
const response=await fetch('https://heynoodles.com/',{signal:AbortSignal.timeout(20000)});
const html=await response.text();await writeFile('sources/reference/heynoodles.html',html);
const q=load(html);
const cssUrl=q('link[rel=stylesheet]').map((i,e)=>q(e).attr('href')).get().find(h=>h.includes('/dist/css/main.css'));
const jsUrl=q('script[src]').map((i,e)=>q(e).attr('src')).get().find(h=>h.includes('/js-dist/main.js'));
for(const[kind,url]of[['css',cssUrl],['js',jsUrl]]){
 const r=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error(r.status+' '+url);
 const body=await r.text();await writeFile(`sources/reference/main.${kind}`,body);
 const patterns=kind==='css'?[/@font-face\s*\{[^}]+\}/g,/[^{}]*#page-loader[^{}]*\{[^}]+\}/g,/font-family:[^;}]+/g]:[/page-loader/g,/loader-top/g,/canvas/g,/blocks/g];
 const matches=[];
 for(const pattern of patterns){let count=0;for(const m of body.matchAll(pattern)){if(count++>=14)break;matches.push(kind==='css'?m[0]:body.slice(Math.max(0,m.index-450),m.index+1000));}}
 console.log(JSON.stringify({kind,url,bytes:body.length,matches},null,2));
}
