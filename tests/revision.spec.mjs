import{test,expect}from'@playwright/test';
import{readFile}from'node:fs/promises';
const baseline=JSON.parse(await readFile('docs/qa/revision-baseline.json','utf8'));

for(const route of['/en/menu.html','/menu.html'])test(`navigation enlarged 2.5 times and stays usable ${route}`,async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const width of[320,390,768,951,1024,1150,1280,1440,1920]){
  await page.setViewportSize({width,height:1000});await page.goto(route);await page.evaluate(()=>document.fonts.ready);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}px overflow`).toBe(true);
  if(width>950){
   const links=page.locator('.desktop-nav a');expect(await links.count()).toBe(7);
   const brand=await page.locator('.brand-lockup').boundingBox();
   for(const link of await links.all()){
    const rect=await link.boundingBox();expect(rect.y,`${width}px navigation clears logo`).toBeGreaterThanOrEqual(brand.y+brand.height);
    expect(rect.x).toBeGreaterThanOrEqual(0);expect(rect.x+rect.width).toBeLessThanOrEqual(width);
    expect(await link.evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBe(width<=1150?30:32.5);
   }
  }else{
   await page.locator('.mobile-navigation summary').click();
   const links=page.locator('.mobile-navigation nav>a');
   for(const link of await links.all()){
    await link.scrollIntoViewIfNeeded();await expect(link).toBeInViewport();
    expect(await link.evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBe(42.5);
   }
   expect(await page.locator('.mobile-navigation nav').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
   await page.locator('.mobile-navigation summary').click();
  }
  await page.evaluate(()=>scrollTo(0,800));
  await expect.poll(async()=>page.evaluate(()=>Math.abs(document.querySelector('.category-nav').getBoundingClientRect().top-document.querySelector('#site-header').getBoundingClientRect().bottom))).toBeLessThan(2);
 }
});

for(const old of baseline)test(`revision sizes ${old.width}px ${old.route}`,async({page})=>{
 await page.setViewportSize({width:old.width,height:1000});await page.emulateMedia({reducedMotion:'reduce'});await page.goto(old.route);await page.evaluate(()=>document.fonts.ready);
 for(const[selector,value]of Object.entries(old.values)){
  if(['menuImage','.footer-wordmark'].includes(selector))continue;
  const current=await page.locator(selector).first().evaluate(e=>({size:parseFloat(getComputedStyle(e).fontSize),family:getComputedStyle(e).fontFamily}));
  const delta=/\bh[1-6]\b/.test(selector)?5:2;
  const expected=selector==='.desktop-nav a'?(value.fontSize+delta)*2.5:value.fontSize+delta;
  expect(Math.abs(current.size-expected),selector).toBeLessThan(.11);expect(current.family,selector).toContain('FuturaPT');
 }
 if(old.values.menuImage){const box=await page.locator('.menu-item .item-photo img').first().boundingBox();expect(box.width/old.values.menuImage.width).toBeCloseTo(.7,2);expect(box.height/old.values.menuImage.height).toBeCloseTo(.7,2);}
});

test('homepage intro shows the brand-colored pixel reveal and dismisses within 1200ms',async({page})=>{
 await page.addInitScript(()=>{
  window.__introChanges=[];
  new MutationObserver(records=>{for(const r of records)if(r.target.id==='home-intro'&&r.attributeName==='hidden')window.__introChanges.push({hidden:r.target.hidden,time:performance.now()});}).observe(document,{subtree:true,attributes:true,attributeFilter:['hidden']});
 });
 await page.goto('/en/',{waitUntil:'domcontentloaded'});
 const intro=page.locator('#home-intro');await expect(intro).toBeVisible();await expect(intro.locator('.intro-loading')).toContainText('LOADING');
 expect(await intro.evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgb(205, 88, 23)');
 await expect.poll(()=>intro.getAttribute('data-pixel-step')).not.toBeNull();
 await expect(intro).toBeHidden({timeout:1600});
 const changes=await page.evaluate(()=>window.__introChanges);const start=changes.find(c=>!c.hidden);const end=changes.find(c=>c.hidden);expect(start).toBeTruthy();expect(end).toBeTruthy();expect(end.time-start.time).toBeLessThan(1250);
 await expect(page.locator('html')).not.toHaveAttribute('data-intro-active');
});

test('homepage intro can be skipped with button or Escape and replays on refresh',async({page})=>{
 await page.goto('/en/',{waitUntil:'domcontentloaded'});await page.locator('.intro-skip').click();await expect(page.locator('#home-intro')).toBeHidden();
 await page.reload({waitUntil:'domcontentloaded'});await expect(page.locator('#home-intro')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('#home-intro')).toBeHidden();
 await page.goto('/en/menu.html');await expect(page.locator('#home-intro')).toHaveCount(0);
});

test('intro bypasses reduced motion and remains absent without JavaScript',async({browser})=>{
 for(const opts of[{reducedMotion:'reduce'},{javaScriptEnabled:false}]){
  const context=await browser.newContext(opts);const page=await context.newPage();try{await page.goto('http://127.0.0.1:4321/');await expect(page.locator('#home-intro')).toBeHidden();await expect(page.locator('h1')).toBeVisible();await expect(page.locator('html')).not.toHaveAttribute('data-intro-active');}finally{await context.close();}
 }
});

test('missing intro artwork and blocked application module cannot trap the page',async({page})=>{
 await page.route('**/_astro/*.js',r=>r.abort());await page.route('**/*brand-new*.webp',r=>r.abort());
 await page.goto('/en/',{waitUntil:'domcontentloaded'});await expect(page.locator('#home-intro')).toBeHidden({timeout:1600});await expect(page.locator('h1')).toBeVisible();await expect(page.locator('html')).not.toHaveAttribute('data-intro-active');
});
