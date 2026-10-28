import {test,expect} from '@playwright/test';

test('reference palette, three-column offers and preserved detail navigation',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/en/offers.html');await page.evaluate(()=>document.fonts.ready);
 expect(await page.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgb(249, 236, 210)');
 expect(await page.locator('.offer-copy h3').first().evaluate(e=>getComputedStyle(e).color)).toBe('rgb(229, 43, 43)');
 expect(await page.locator('.offer-copy h3').first().evaluate(e=>getComputedStyle(e).fontFamily)).toContain('Fraunces');
 const cards=await page.locator('.offer-card').all();const boxes=await Promise.all(cards.map(c=>c.boundingBox()));
 expect(boxes).toHaveLength(3);for(const b of boxes)expect(Math.abs(b.y-boxes[0].y)).toBeLessThan(2);
 expect(boxes[1].x).toBeGreaterThan(boxes[0].x+boxes[0].width);
 await page.locator('.offer-staff-offer .text-link').click();await expect(page.locator('.benefit-tier')).toHaveCount(3);
 await expect(page.locator('.campaign-terms')).toContainText('stored-value card');
});

test('primary and secondary navigation work with keyboard and Escape',async({page})=>{
 await page.goto('/en/menu.html');await expect(page.locator('.desktop-nav > a')).toHaveCount(4);
 const summary=page.locator('.more-navigation summary');await summary.focus();await page.keyboard.press('Enter');
 await expect(page.locator('.more-navigation a').first()).toBeVisible();await page.keyboard.press('Escape');
 await expect(summary).toBeFocused();await expect(page.locator('.more-navigation')).not.toHaveAttribute('open','');
 await summary.click();await page.locator('.more-navigation a[href="/en/about-us.html"]').click();
 await expect(page).toHaveURL(/about-us.html$/);await expect(page.locator('#why-frydom')).toHaveCount(1);
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
