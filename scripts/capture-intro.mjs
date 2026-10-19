import{chromium}from'@playwright/test';
import{mkdir,writeFile}from'node:fs/promises';
import{browserLaunchOptions}from'./browser.mjs';
const browser=await chromium.launch(browserLaunchOptions());await mkdir('docs/qa/intro-frames',{recursive:true});
const states=[];
try{
 const page=await browser.newPage({viewport:{width:960,height:720},reducedMotion:'no-preference'});
 const epoch=new Date('2026-10-19T14:00:00Z');await page.clock.install({time:epoch});await page.clock.pauseAt(new Date(epoch.getTime()+100));
 await page.goto('http://127.0.0.1:4321/en/',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);await page.locator('.hero-food').evaluate(i=>i.decode());
 let previous=0;
 for(const [index,time]of[0,120,240,360,480,600,720,840,960,1120,1520].entries()){
  if(time>previous)await page.clock.runFor(time-previous);previous=time;
  await page.screenshot({path:`docs/qa/intro-frames/${String(index).padStart(2,'0')}.png`});
  states.push({time,...await page.locator('#home-intro').evaluate(e=>({hidden:e.hidden,pixelStep:e.dataset.pixelStep,opacity:getComputedStyle(e).opacity}))});
 }
 await writeFile('docs/qa/intro-animation.json',JSON.stringify(states,null,2));console.log(JSON.stringify(states));
}finally{await browser.close();}
