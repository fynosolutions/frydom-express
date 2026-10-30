import {test,expect} from '@playwright/test';

const scale=label=>label.evaluate(e=>{const t=getComputedStyle(e).transform;return t==='none'?1:new DOMMatrixReadOnly(t).a;});

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
 const effect=await title.evaluate(e=>{const animation=e.getAnimations()[0];return {frames:animation.effect.getKeyframes(),duration:animation.effect.getTiming().duration};});
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
