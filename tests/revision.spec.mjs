import{test,expect}from'@playwright/test';

test('homepage intro shows the brand-colored pixel reveal and dismisses within 1200ms',async({page})=>{
 await page.addInitScript(()=>{
  window.__introChanges=[];
  new MutationObserver(records=>{for(const r of records)if(r.target.id==='home-intro'&&r.attributeName==='hidden')window.__introChanges.push({hidden:r.target.hidden,time:performance.now()});}).observe(document,{subtree:true,attributes:true,attributeFilter:['hidden']});
 });
 await page.goto('/en/',{waitUntil:'domcontentloaded'});
 const intro=page.locator('#home-intro');await expect(intro).toBeVisible();await expect(intro.locator('.intro-loading')).toContainText('LOADING');
 expect(await intro.evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgb(229, 43, 43)');
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
