import {test,expect} from '@playwright/test';

const scale=label=>label.evaluate(e=>{const t=getComputedStyle(e).transform;return t==='none'?1:new DOMMatrixReadOnly(t).a;});

for(const width of [390,1440])test(`hero title keeps two lines through font loading ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('**/MouseMemoirs-latin.woff2',async route=>{await new Promise(resolve=>setTimeout(resolve,1800));await route.continue();});
 await page.goto('/en/',{waitUntil:'domcontentloaded'});
 const title=page.locator('#hero-title');await expect(title.locator('.hero-title-line')).toHaveCount(2);
 const before=await title.boundingBox();
 await page.evaluate(()=>document.fonts.ready);
 const after=await title.boundingBox();expect(Math.abs(before.height-after.height)).toBeLessThan(1);
 for(const line of await title.locator('.hero-title-line').all())expect(await line.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
});

test('slow font downloads do not delay the hero after the intro fade',async({page})=>{
 await page.route('**/*.woff2',async route=>{await new Promise(resolve=>setTimeout(resolve,2200));await route.continue();});
 await page.goto('/en/',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#home-intro')).toHaveClass(/is-leaving/);
 await expect(page.locator('.poster-wordmark')).toHaveAttribute('data-motion','entering',{timeout:500});
 expect(await page.evaluate(()=>document.fonts.status)).toBe('loading');
 await expect(page.locator('.poster-wordmark')).toHaveAttribute('data-motion','revealed');
});

test('hero lettering waits until the introduction has cleared',async({page})=>{
 await page.goto('/en/',{waitUntil:'domcontentloaded'});
 const intro=page.locator('#home-intro'),brand=page.locator('.poster-wordmark');
 if(await intro.isVisible())expect(await brand.getAttribute('data-motion')).not.toBe('revealed');
 await expect(intro).toBeHidden();await expect(brand).toHaveAttribute('data-motion','entering');
 for(const selector of ['.poster-wordmark','.sticker-crispy','.sticker-juicy','.poster-caption']){
  await expect(page.locator(selector)).toHaveAttribute('data-text-effect','pop');
 }
 await expect(brand).toHaveAttribute('data-motion','revealed');
});

test('homepage matches reference pop curve and separate masked line reveal',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await page.goto('/en/');await page.evaluate(()=>document.fonts.ready);
 const title=page.locator('#taste-title');
 await title.evaluate(e=>scrollTo({top:e.getBoundingClientRect().top+scrollY-200,behavior:'instant'}));
 await expect(title).toHaveAttribute('data-motion','entering');
 const effects=await title.evaluate(e=>e.getAnimations({subtree:true}).map(a=>({timing:a.effect.getTiming(),frames:a.effect.getKeyframes()})));
 expect(effects.length).toBeGreaterThan(1);expect(effects[0].timing.duration).toBe(720);
 expect(effects[1].timing.delay-effects[0].timing.delay).toBe(55);
 expect(effects[0].frames).toHaveLength(73);
 const peak=Math.max(...effects[0].frames.map(f=>Number(f.transform.match(/scale\(([^)]+)/)[1])));
 expect(peak).toBeGreaterThan(1.17);expect(peak).toBeLessThan(1.18);
 const paragraph=page.locator('.taste-copy>p');
 await expect(paragraph).toHaveAttribute('data-text-effect','lines');
 const timing=await paragraph.evaluate(e=>e.getAnimations({subtree:true})[0]?.effect.getTiming());
 expect(timing.duration).toBe(1400);
 await expect(title).toHaveAttribute('data-motion','revealed');
 await expect(title.locator('.heading-pop-word')).toHaveCount(0);
 await expect(paragraph).toHaveAttribute('data-motion','revealed');
 await expect(paragraph.locator('.text-line-mask')).toHaveCount(0);
});

test('navigation zooms on hover, restores on exit and keeps its hit area stable',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await page.goto('/en/menu.html');await page.evaluate(()=>document.fonts.ready);
 for(const link of await page.locator('.desktop-nav > a').all()){
  const label=link.locator('.nav-label');const before=await link.boundingBox();
  await link.hover();await expect.poll(()=>scale(label)).toBeGreaterThan(1.095);
  expect(await link.boundingBox()).toEqual(before);
  const box=await label.boundingBox();expect(box.x).toBeGreaterThan(0);expect(box.x+box.width).toBeLessThan(1440);
  await page.mouse.move(0,400);await expect.poll(()=>scale(label)).toBeLessThan(1.005);
 }
});

test('navigation zoom is available from the keyboard',async({page})=>{
 await page.goto('/en/menu.html');
 await page.keyboard.press('Tab');await page.keyboard.press('Tab');await page.keyboard.press('Tab');
 const link=page.locator('.desktop-nav > a').first();await expect(link).toBeFocused();await expect.poll(()=>scale(link.locator('.nav-label'))).toBeGreaterThan(1.095);
});

test('touch menu stays readable without sticky hover enlargement',async({browser})=>{
 const context=await browser.newContext({viewport:{width:320,height:844},hasTouch:true,isMobile:true});const page=await context.newPage();
 try{
  await page.goto((process.env.FRYDOM_TEST_URL||'http://127.0.0.1:4321')+'/en/menu.html');await page.locator('.mobile-navigation summary').tap();
  const nav=page.locator('.mobile-navigation nav');
  expect(await nav.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
  for(const label of await nav.locator('.nav-label').all())expect(await scale(label)).toBe(1);
 }finally{await context.close();}
});

for(const [width,route] of [[1440,'/en/menu.html'],[390,'/menu.html']])test(`text animates on scroll and remains settled on return ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto(route);
 const title=page.locator('.menu-section-heading h2').nth(2);
 await expect(title).toHaveAttribute('data-motion','pending');
 // Pending blocks remain fully readable even before an observer callback.
 expect(await title.evaluate(e=>getComputedStyle(e).opacity)).toBe('1');
 await title.evaluate(e=>scrollTo({top:e.getBoundingClientRect().top+scrollY-400,behavior:'instant'}));
 await expect(title).toHaveAttribute('data-motion','entering');
 const spacing=await title.evaluate(e=>({bottom:e.getBoundingClientRect().bottom,caption:e.nextElementSibling.getBoundingClientRect().top}));
 expect(spacing.caption).toBeGreaterThanOrEqual(spacing.bottom);
 const effect=await title.evaluate(e=>{const animation=e.getAnimations({subtree:true})[0];return {frames:animation.effect.getKeyframes(),duration:animation.effect.getTiming().duration};});
 expect(effect.frames[0].transform).toContain('translateY');expect(effect.duration).toBeGreaterThan(500);
 await expect(title).toHaveAttribute('data-motion','revealed');
 expect(await title.evaluate(e=>getComputedStyle(e).opacity)).toBe('1');
 await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await title.scrollIntoViewIfNeeded();
 expect(await title.evaluate(e=>e.getAnimations().length)).toBe(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('reduced motion cancels a running reveal and suppresses navigation zoom',async({page})=>{
 await page.goto('/en/menu.html');const title=page.locator('.menu-section-heading h2').nth(2);
 await title.evaluate(e=>scrollTo({top:e.getBoundingClientRect().top+scrollY-400,behavior:'instant'}));
 await expect(title).toHaveAttribute('data-motion','entering');await page.emulateMedia({reducedMotion:'reduce'});
 await expect(title).toHaveAttribute('data-motion','revealed');expect(await title.evaluate(e=>e.getAnimations().length)).toBe(0);
 expect(await title.evaluate(e=>getComputedStyle(e).opacity)).toBe('1');
 const link=page.locator('.desktop-nav > a').first();await link.hover();expect(await scale(link.locator('.nav-label'))).toBe(1);
 await page.reload();await expect(page.locator('html')).not.toHaveClass(/motion-ready/);
 expect(await page.locator('[data-motion]').count()).toBe(0);
});

test('missing motion APIs preserve text and application initialization',async({page})=>{
 await page.addInitScript(()=>{window.IntersectionObserver=undefined;});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/en/franchise.html');
 await expect(page.locator('h1')).toBeVisible();await expect(page.locator('#submit-inquiry')).toBeEnabled();
 expect(await page.locator('h1').evaluate(e=>getComputedStyle(e).opacity)).toBe('1');expect(errors).toEqual([]);
});

for(const width of [390,1440])test(`burger enlarges only after the wordmark finishes ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});
 await page.goto('/en/',{waitUntil:'domcontentloaded'});
 const brand=page.locator('.poster-wordmark'),food=page.locator('.hero-food');
 await expect(brand).toHaveAttribute('data-motion','entering');
 await expect(food).toHaveAttribute('data-hero-food-motion','waiting');
 expect(Number(await food.evaluate(e=>getComputedStyle(e).scale))).toBeCloseTo(.12,2);
 expect(await food.evaluate(e=>getComputedStyle(e).opacity)).toBe('0');
 const wordmarkEnd=await brand.evaluate(async e=>{
  const animation=e.getAnimations({subtree:true})[0];await animation.ready;
  return Number(animation.startTime)+Number(animation.effect.getComputedTiming().endTime);
 });
 await expect(food).toHaveAttribute('data-hero-food-motion','entering');
 await expect(brand).toHaveAttribute('data-motion','revealed');
 const effect=await food.evaluate(e=>{
  const a=e.getAnimations()[0];const startTime=Number(a.startTime);a.pause();
  a.currentTime=0;const start=Number(getComputedStyle(e).scale),startOpacity=Number(getComputedStyle(e).opacity);
  a.currentTime=400;const later=Number(getComputedStyle(e).scale),middleOpacity=Number(getComputedStyle(e).opacity);
  a.currentTime=800;const lateOpacity=Number(getComputedStyle(e).opacity);
  const duration=a.effect.getTiming().duration;a.play();
  return {start,later,startOpacity,middleOpacity,lateOpacity,duration,startTime,filter:getComputedStyle(e).filter};
 });
 expect(effect.start).toBeCloseTo(.12,2);expect(effect.later).toBeGreaterThan(effect.start);
 expect(effect.duration).toBe(1000);expect(effect.filter).toContain('rgb(17, 17, 17)');
 expect(effect.startTime).toBeCloseTo(wordmarkEnd,3);
 expect(effect.filter).toContain('0.6px');
 expect(effect.startOpacity).toBe(0);
 expect(effect.middleOpacity).toBeGreaterThan(0);expect(effect.middleOpacity).toBeLessThan(1);
 expect(effect.later).toBeLessThan(1);
 expect((effect.later-effect.start)/(1-effect.start)).toBeCloseTo(effect.middleOpacity,3);
 expect(effect.lateOpacity).toBeGreaterThan(effect.middleOpacity);expect(effect.lateOpacity).toBeLessThan(1);
 await expect(food).toHaveAttribute('data-hero-food-motion','revealed');
 expect(await food.evaluate(e=>getComputedStyle(e).scale)).toBe('none');
 expect(await food.evaluate(e=>getComputedStyle(e).opacity)).toBe('1');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('burger motion settles when reduced motion is enabled or the viewport changes',async({page})=>{
 await page.goto('/en/',{waitUntil:'domcontentloaded'});
 const food=page.locator('.hero-food');await expect(food).toHaveAttribute('data-hero-food-motion','entering');
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(food).toHaveAttribute('data-hero-food-motion','revealed');
 expect(await food.evaluate(e=>e.getAnimations().length)).toBe(0);
 expect(await food.evaluate(e=>getComputedStyle(e).scale)).toBe('none');
 expect(await food.evaluate(e=>getComputedStyle(e).opacity)).toBe('1');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.reload({waitUntil:'domcontentloaded'});
 await expect(food).toHaveAttribute('data-hero-food-motion','entering');
 await page.setViewportSize({width:390,height:844});
 await expect(food).toHaveAttribute('data-hero-food-motion','revealed');
 expect(await food.evaluate(e=>e.getAnimations().length)).toBe(0);
 expect(await food.evaluate(e=>getComputedStyle(e).scale)).toBe('none');
 expect(await food.evaluate(e=>getComputedStyle(e).opacity)).toBe('1');
});
