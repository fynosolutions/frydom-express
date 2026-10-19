import { chromium } from '@playwright/test';
import { mkdir, readFile,writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import {browserLaunchOptions} from './browser.mjs';
const browser=await chromium.launch(browserLaunchOptions());
await mkdir('docs/screenshots',{recursive:true});
const data=JSON.parse(await readFile('src/data/site.json','utf8'));
const report=[];
const entries=data.routes.flatMap(route=>[[1440,1000,`${route.kind}-${route.lang}-desktop`,route.path],[390,844,`${route.kind}-${route.lang}-mobile`,route.path]]);
for(const[width,height,name,route]of entries){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4321'+route,{waitUntil:'networkidle'});
  await page.evaluate(async()=>{document.querySelectorAll('img').forEach(img=>img.loading='eager');await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})));await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
  // Prime the compositor at the real viewport before Chromium expands for a full-page capture.
  const top=await page.screenshot();
  if(name.includes('home-'))await writeFile(`docs/screenshots/${name}-top.png`,top);
  await page.screenshot({path:`docs/screenshots/${name}.png`,fullPage:true});
  if(name==='partner-en-mobile'||name==='partner-zh-mobile'){
    const rect=await page.locator('#franchise-inquiry').evaluate(e=>{const r=e.getBoundingClientRect();return {left:Math.floor(r.x),top:Math.floor(r.y+scrollY),width:Math.floor(r.width),height:Math.floor(r.height)};});
    await sharp(`docs/screenshots/${name}.png`).extract(rect).png().toFile(`docs/screenshots/${name}-form.png`);
  }
  report.push({name,title:await page.title(),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),errors});
  await page.close();
}
for(const javaScriptEnabled of[false,true]){
  const context=await browser.newContext({javaScriptEnabled,reducedMotion:javaScriptEnabled?'reduce':'no-preference',viewport:{width:390,height:844}});
  const page=await context.newPage();await page.goto('http://127.0.0.1:4321/en/menu.html');await page.evaluate(async()=>{document.querySelectorAll('img').forEach(i=>i.loading='eager');await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));await document.fonts.ready;});
  await page.screenshot({path:`docs/screenshots/menu-en-${javaScriptEnabled?'reduced-motion':'no-javascript'}.png`,fullPage:true});await context.close();
}
await writeFile('docs/qa/screenshot-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({screenshots:entries.length+2,failures:report.filter(r=>r.overflow||r.errors.length)}));
await browser.close();
