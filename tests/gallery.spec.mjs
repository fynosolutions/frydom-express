import {test,expect} from '@playwright/test';
test('gallery videos autoplay together silently and close accessibly',async({page})=>{
 await page.goto('/en/#gallery');
 await page.locator('.popup-close').click();
 const videos=page.locator('.gallery-film video');await expect(videos).toHaveCount(7);
 await expect(page.locator('.home-offers-band')).toHaveCount(0);
 await expect.poll(()=>videos.evaluateAll(items=>items.every(v=>!v.paused&&v.currentTime>0&&v.muted&&v.volume===0&&v.loop)),{timeout:20000}).toBe(true);
 const expand=page.locator('[data-gallery-expand]').first();await expand.click();
 await expect(page.locator('.gallery-dialog')).toBeVisible();
 expect(await page.locator('.gallery-dialog video').evaluate(v=>v.muted&&v.volume===0)).toBe(true);
 expect(await videos.evaluateAll(items=>items.every(v=>!v.paused))).toBe(true);
 await page.keyboard.press('Escape');await expect(page.locator('.gallery-dialog')).not.toBeVisible();await expect(expand).toBeFocused();
 await expect.poll(()=>page.locator('.gallery-dialog video').evaluate(v=>v.paused)).toBe(true);
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:900});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
