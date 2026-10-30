import {test,expect} from '@playwright/test';

test('retired pages redirect by language and support is complete before the form',async({page,request})=>{
 const redirects={'/about-us.html':'/','/en/about-us.html':'/en/','/fuwu.html':'/franchise.html#partner-support','/en/support.html':'/en/franchise.html#partner-support'};
 for(const [from,to] of Object.entries(redirects)){
  const response=await request.get(from,{maxRedirects:0});expect(response.status()).toBe(301);expect(response.headers()['location']).toBe(to);
 }
 for(const prefix of ['','/en']){
  await page.goto(prefix+'/franchise.html');
  await expect(page.locator('h1')).toHaveCount(1);await expect(page.locator('#partner-support .support-detail')).toHaveCount(5);
  expect(await page.locator('#partner-support').evaluate(e=>Boolean(e.compareDocumentPosition(document.querySelector('#franchise-inquiry'))&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  await expect(page.locator('a[href*="about-us.html"], a[href$="support.html"], a[href$="fuwu.html"]')).toHaveCount(0);
 }
});

test('reference palette, three-column offers and preserved detail navigation',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/en/offers.html');await page.evaluate(()=>document.fonts.ready);
 expect(await page.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgb(249, 236, 210)');
 expect(await page.locator('.offer-copy h3').first().evaluate(e=>getComputedStyle(e).color)).toBe('rgb(184, 74, 22)');
 expect(await page.locator('.offer-copy h3').first().evaluate(e=>getComputedStyle(e).fontFamily)).toContain('Fraunces');
 const cards=await page.locator('.offer-card').all();const boxes=await Promise.all(cards.map(c=>c.boundingBox()));
 expect(boxes).toHaveLength(3);for(const b of boxes)expect(Math.abs(b.y-boxes[0].y)).toBeLessThan(2);
 expect(boxes[1].x).toBeGreaterThan(boxes[0].x+boxes[0].width);
 await page.locator('.offer-staff-offer .text-link').click();await expect(page.locator('.poster-page img')).toHaveCount(2);
 await expect(page.locator('.poster-page').first()).toHaveAttribute('href','/assets/posters/staff-offer.pdf#page=1');
});

test('online ordering is accessible with keyboard and Escape',async({page})=>{
 await page.goto('/en/menu.html');await expect(page.locator('.desktop-nav > a')).toHaveCount(4);
 const summary=page.locator('.desktop-nav .order-picker summary');await summary.focus();await page.keyboard.press('Enter');
 await expect(page.locator('.desktop-nav .order-picker a').first()).toBeVisible();await page.keyboard.press('Escape');
 await expect(summary).toBeFocused();await expect(page.locator('.desktop-nav .order-picker')).not.toHaveAttribute('open','');
 await summary.click();await expect(summary).toContainText('Order online');
 await expect(page.locator('.desktop-nav .order-picker a').nth(0)).toHaveAttribute('href',/ubereats\.com\/store\/frydom-express/);
 await expect(page.locator('.desktop-nav .order-picker a').nth(1)).toHaveAttribute('href',/grubhub\.com\/restaurant\/frydom-express/);
 for(const link of await page.locator('.desktop-nav .order-picker a').all())await expect(link).toHaveAttribute('target','_blank');
});

test('mobile full-screen navigation closes accessibly and cards stack',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/offers.html');
 await page.locator('#mobile-navigation summary').click();
 await expect(page.locator('main')).toHaveAttribute('inert','');await expect(page.locator('html')).toHaveClass(/nav-open/);
 await expect(page.locator('#mobile-navigation nav')).toBeVisible();
 await page.keyboard.press('Escape');await expect(page.locator('main')).not.toHaveAttribute('inert','');
 await expect(page.locator('#mobile-navigation summary')).toBeFocused();
 const boxes=await Promise.all((await page.locator('.offer-card').all()).map(c=>c.boundingBox()));
 expect(boxes[1].y).toBeGreaterThan(boxes[0].y+boxes[0].height);
});

test('menu categories remain below the sticky header',async({page})=>{
 for(const width of [390,1024,1440]){
  await page.setViewportSize({width,height:900});await page.goto('/en/menu.html');await page.evaluate(()=>document.fonts.ready);
  await page.locator('#wings').scrollIntoViewIfNeeded();
  await expect.poll(()=>page.evaluate(()=>Math.abs(document.querySelector('.category-nav').getBoundingClientRect().top-document.querySelector('#site-header').getBoundingClientRect().bottom))).toBeLessThan(2);
 }
});
