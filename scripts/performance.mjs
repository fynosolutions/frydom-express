import{chromium}from'@playwright/test';
import{writeFile}from'node:fs/promises';
import{browserLaunchOptions}from'./browser.mjs';
const browser=await chromium.launch(browserLaunchOptions());
const runs=[];
try{
for(const viewport of[{width:390,height:844},{width:1440,height:1000}]){
  const context=await browser.newContext({viewport});const page=await context.newPage();const cdp=await context.newCDPSession(page);
  await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1600000/8,uploadThroughput:750000/8});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.addInitScript(()=>{window.__metrics={lcp:0,cls:0};new PerformanceObserver(list=>{for(const e of list.getEntries())window.__metrics.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__metrics.cls+=e.value;}).observe({type:'layout-shift',buffered:true});});
  await page.goto('http://127.0.0.1:4321/en/',{waitUntil:'networkidle'});await page.evaluate(async()=>{await document.fonts.ready;await document.querySelector('.hero-food').decode();});
  runs.push(await page.evaluate(()=>({viewport:{width:innerWidth,height:innerHeight},...window.__metrics,domContentLoaded:performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd,transferBytes:performance.getEntriesByType('resource').reduce((n,r)=>n+r.transferSize,0)})));
  await context.close();
}
}finally{await browser.close();}
const report={executedAt:new Date().toISOString(),method:'Single cold-cache laboratory navigation per viewport. Chromium headless, 4× CPU slowdown, 1.6 Mbps download, 750 Kbps upload, 150ms latency, local source server. Not Lighthouse, CrUX or real-user p75 data; no INP claim.',runs};
await writeFile('docs/qa/performance.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
