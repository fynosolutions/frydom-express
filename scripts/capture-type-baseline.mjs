import{chromium}from'@playwright/test';
import{browserLaunchOptions}from'./browser.mjs';
import{writeFile}from'node:fs/promises';
const browser=await chromium.launch(browserLaunchOptions());const results=[];
try{
for(const width of[320,390,768,1440])for(const route of['/en/','/en/menu.html','/menu.html']){
 const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});await page.goto('http://127.0.0.1:4321'+route);await page.evaluate(()=>document.fonts.ready);
 const selectors=['body','h1','.hero-intro','.desktop-nav a','.item-body h3','.item-description','.item-prices dd','.menu-section-heading h2','.brand-wordmark strong','.footer-wordmark'];const values={};
 for(const selector of selectors){const el=page.locator(selector).first();if(await el.count())values[selector]=await el.evaluate(e=>({fontSize:parseFloat(getComputedStyle(e).fontSize),fontFamily:getComputedStyle(e).fontFamily,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}));}
 const img=page.locator('.menu-item .item-photo img').first();if(await img.count())values.menuImage=await img.evaluate(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}));
 results.push({width,route,values});await page.close();
}
}finally{await browser.close();}
await writeFile('docs/qa/revision-baseline.json',JSON.stringify(results,null,2));console.log('Saved typography and image baseline for 12 route/width combinations.');
