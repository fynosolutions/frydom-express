import{chromium}from'@playwright/test';
import{browserLaunchOptions}from'./browser.mjs';
const browser=await chromium.launch(browserLaunchOptions());
try{for(const[width,route]of[[390,'/en/'],[390,'/en/menu.html'],[320,'/en/about-us.html'],[768,'/en/support.html'],[320,'/stores.html'],[1440,'/en/']]){
 const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});await page.goto('http://127.0.0.1:4321'+route);await page.evaluate(()=>document.fonts.ready);
 console.log(JSON.stringify({width,route,scroll:await page.evaluate(()=>document.documentElement.scrollWidth),text:await page.evaluate(()=>{
 const out=[];const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
 while(n=walker.nextNode()){
  if(!n.textContent.trim())continue;let clipped=false;
  for(let p=n.parentElement;p&&p!==document.body;p=p.parentElement)if(['hidden','clip','auto','scroll'].includes(getComputedStyle(p).overflowX)){clipped=true;break;}
  if(clipped)continue;
  const range=document.createRange();range.selectNode(n);const r=range.getBoundingClientRect();if(r.width&&r.right>innerWidth+1)out.push({text:n.textContent.trim().slice(0,65),parent:n.parentElement.tagName,class:n.parentElement.className,right:Math.round(r.right)});
 }
 return out.slice(0,12);
 }),elements:await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>{
   const r=e.getBoundingClientRect();if(r.width<1||r.right<=innerWidth+1)return false;
   for(let parent=e.parentElement;parent&&parent!==document.body;parent=parent.parentElement)if(['hidden','clip','auto','scroll'].includes(getComputedStyle(parent).overflowX))return false;
   return true;
 }).map(e=>({tag:e.tagName,class:typeof e.className==='string'?e.className:'svg',text:e.textContent?.trim().slice(0,80),right:Math.round(e.getBoundingClientRect().right),width:Math.round(e.getBoundingClientRect().width)})).slice(0,18))}));
 await page.close();
}}finally{await browser.close();}
