import{test,expect}from'@playwright/test';

for (const [prefix, width] of [['/en', 1440], ['', 390]]) {
 test(`chicken popup fades and scales in on each home visit at ${width}px`, async ({page}) => {
  await page.setViewportSize({width,height:900});
  await page.addInitScript(()=>{
   document.addEventListener('animationstart', event => {
    if (event.target.matches('.chicken-popup') && !event.pseudoElement) {
     const effect = event.target.getAnimations().find(a => a.animationName === event.animationName)?.effect;
     if (effect) window.__popupFrames = effect.getKeyframes();
    }
   });
   new MutationObserver(records=>{
    for(const record of records){
     if(record.target.id==='home-intro' && record.target.hidden)window.__introEnd ??= performance.now();
     if(record.target.matches('.chicken-popup[open]'))window.__popupStart ??= performance.now();
    }
   }).observe(document,{subtree:true,attributes:true,attributeFilter:['hidden','open']});
  });
  await page.goto(prefix+'/', {waitUntil:'domcontentloaded'});
  const popup=page.locator('.chicken-popup');
  await expect(popup).toBeVisible({timeout:10000});
  const firstDelay = await page.evaluate(()=>window.__popupStart-window.__introEnd);
  expect(firstDelay).toBeGreaterThanOrEqual(2980);
  expect(firstDelay).toBeLessThan(4000);
  await expect(page.locator('#home-intro')).toBeHidden();
  await expect(popup.locator('.popup-close')).toBeFocused();
  await expect.poll(()=>page.evaluate(()=>window.__popupFrames?.[0]?.opacity)).toBe('0');
  const frames=await page.evaluate(()=>window.__popupFrames);
  expect(frames[0].transform).toBe('scale(0.45)');
  expect(frames.at(-1).opacity).toBe('1');
  expect(frames.at(-1).transform).toBe('scale(1)');
  await expect.poll(()=>popup.locator('video').evaluate(v=>v.currentTime>0 && v.muted && !v.loop)).toBe(true);
  await expect(popup.locator('.popup-menu')).toHaveAttribute('href',prefix+'/menu.html#fried-chicken');
  for(const [i,offer] of ['staff-offer','leg-quarter','chicken-bucket'].entries()){
   await popup.locator('[data-next]').click();
   await expect(popup.locator('.popup-poster:not([inert])')).toHaveAttribute('href',prefix+'/'+offer+'.html');
   await expect(popup.locator('.popup-controls span')).toHaveText((i+2)+' / 4');
   expect(await popup.locator('video').evaluate(v=>v.paused)).toBe(true);
   await popup.locator('.popup-poster:not([inert]) img').evaluate(img=>img.decode());
  }
  await popup.locator('[data-next]').click();
  await expect(popup.locator('.popup-menu')).toBeVisible();
  if(prefix){
   await page.keyboard.press('Escape');
   await expect(popup).toBeHidden();
   await expect.poll(()=>popup.locator('video').evaluate(v=>v.paused)).toBe(true);
  }else{
   await popup.locator('.popup-menu').click();
   await expect(page).toHaveURL(/\/menu\.html#fried-chicken$/);
   await expect(page.locator('.chicken-popup')).toHaveCount(0);
  }
  if(prefix) await page.reload({waitUntil:'domcontentloaded'});
  else await page.goto('/en/',{waitUntil:'domcontentloaded'});
  await expect(popup).toBeVisible({timeout:10000});
  const nextDelay = await page.evaluate(()=>window.__popupStart-window.__introEnd);
  expect(nextDelay).toBeGreaterThanOrEqual(2980);
  expect(nextDelay).toBeLessThan(4000);
  await expect(popup.locator('.popup-controls span')).toHaveText('1 / 4');
 });
}

test('popup advances every three seconds through the video and three posters', async ({page}) => {
 await page.goto('/en/');
 const popup = page.locator('.chicken-popup');
 const video = popup.locator('video');
 const count = popup.locator('.popup-controls span');
 await expect.poll(()=>video.evaluate(v=>Number.isFinite(v.duration) && !v.paused), {timeout:10000}).toBe(true);
 await popup.locator('[data-rotation]').click();
 await page.clock.install();
 await page.clock.fastForward(6000);
 await expect(count).toHaveText('1 / 4');
 await popup.locator('[data-rotation]').click();
 for(const next of ['2 / 4','3 / 4','4 / 4','1 / 4']){
  const previous = await count.textContent();
  await page.clock.fastForward(2500);
  await expect(count).toHaveText(previous);
  await page.clock.fastForward(500);
  await expect(count).toHaveText(next);
 }
 await expect(video).toBeVisible();
 await expect.poll(()=>video.evaluate(v=>!v.paused)).toBe(true);
});

for (const [prefix,width] of [['/en',1440],['',390]]) {
 test(`food captions align and slide up together at ${width}px`, async ({page}) => {
  await page.setViewportSize({width,height:900});
  await page.goto(prefix+'/');
  await page.locator('.popup-close').click();
  await page.evaluate(()=>document.fonts.ready);
  const captions=page.locator('.taste-caption');
  await captions.first().scrollIntoViewIfNeeded();
  for(const caption of await captions.all()){
   await expect(caption).toHaveAttribute('data-text-effect','lines');
   await expect(caption).toHaveAttribute('data-motion','revealed');
  }
  const metrics=await captions.evaluateAll(elements=>elements.map(el=>{
   const child=el.firstElementChild;
   return {top:child.getBoundingClientRect().top,size:getComputedStyle(child).fontSize};
  }));
  expect(metrics).toHaveLength(3);
  for(const {top,size} of metrics){
   expect(Math.abs(top-metrics[0].top)).toBeLessThan(1);
   expect(size).toBe(width===1440?'24px':'16px');
  }
 });
}

test('homepage intro shows the brand-colored pixel reveal and dismisses within 1200ms',async({page})=>{
 await page.addInitScript(()=>{
  window.__introChanges=[];
  new MutationObserver(records=>{for(const r of records)if(r.target.id==='home-intro'&&r.attributeName==='hidden')window.__introChanges.push({hidden:r.target.hidden,time:performance.now()});}).observe(document,{subtree:true,attributes:true,attributeFilter:['hidden']});
 });
 await page.goto('/en/',{waitUntil:'domcontentloaded'});
 const intro=page.locator('#home-intro');await expect(intro).toBeVisible();await expect(intro.locator('.intro-loading')).toContainText('LOADING');
 expect(await intro.evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgb(182, 74, 22)');
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
  const context=await browser.newContext(opts);const page=await context.newPage();try{await page.goto((process.env.FRYDOM_TEST_URL||'http://127.0.0.1:4321')+'/');await expect(page.locator('#home-intro')).toBeHidden();await expect(page.locator('h1')).toBeVisible();await expect(page.locator('html')).not.toHaveAttribute('data-intro-active');}finally{await context.close();}
 }
});

test('missing intro artwork and blocked application module cannot trap the page',async({page})=>{
 await page.route('**/_astro/*.js',r=>r.abort());await page.route('**/angus-beef-cheeseburger-combo.webp',r=>r.abort());
 await page.goto('/en/',{waitUntil:'domcontentloaded'});await expect(page.locator('#home-intro')).toBeHidden({timeout:1600});await expect(page.locator('h1')).toBeVisible();await expect(page.locator('html')).not.toHaveAttribute('data-intro-active');
});
