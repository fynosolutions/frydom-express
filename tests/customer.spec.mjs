import {test,expect} from '@playwright/test';

for(const prefix of ['', '/en'])test(`customer actions and confirmed hours ${prefix||'zh'}`,async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(prefix+'/');
 const bar=page.locator('.mobile-customer-actions');
 await bar.locator('summary').click();
 await expect(bar.getByRole('link',{name:'Uber Eats ↗'})).toBeVisible();
 await expect(bar.getByRole('link',{name:'Grubhub ↗'})).toBeVisible();
 await bar.getByRole('link',{name:'Uber Eats ↗'}).focus();await page.keyboard.press('Escape');
 await expect(bar.locator('summary')).toBeFocused();
 await expect(bar.locator('details')).not.toHaveAttribute('open','');
 await page.locator('#mobile-navigation summary').click();await expect(bar).toBeHidden();
 await page.keyboard.press('Escape');await expect(bar).toBeVisible();
 await page.goto(prefix+'/stores.html');
 await expect(page.locator('.location-detail')).toContainText('11:00–22:00');
 await expect(page.locator('.location-detail a[href="tel:+19298050718"]')).toBeVisible();
 await expect(page.locator('.location-detail a[href*="google.com/maps"]')).toHaveAttribute('href',/781%2061st%20St/);
 await expect(page.locator('.partner-banner')).toHaveCount(0);
 await page.goto(prefix+'/staff-offer.html');
 await expect(page.locator('.campaign-copy')).toContainText('$10');
 await expect(page.locator('.campaign-copy')).toContainText('$50');
 await expect(page.locator('.campaign-copy')).toContainText('$100');
 for(const poster of await page.locator('.poster-page img').all()){
   await poster.scrollIntoViewIfNeeded();
   await expect.poll(()=>poster.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
 }
});
