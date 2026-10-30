import {test,expect} from '@playwright/test';

for(const prefix of ['', '/en'])test(`original posters, offer navigation and language switch ${prefix||'zh'}`,async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(prefix+'/offers.html');
 await expect(page.locator('.offer-card')).toHaveCount(3);
 await page.locator('.offer-staff-offer .text-link').click();
 await expect(page.locator('.poster-page img')).toHaveCount(2);
 await expect(page.locator('.poster-page').last()).toHaveAttribute('href','/assets/posters/staff-offer.pdf#page=2');
 await expect(page.locator('.campaign-copy h1')).toBeVisible();
 await expect(page.locator('.campaign-terms a[href="tel:+19298050718"]').first()).toBeVisible();
 await page.locator('.language-link').click();
 await expect(page).toHaveURL(new RegExp((prefix?'(?<!/en)':'/en')+'/staff-offer.html$'));
 await page.goto(prefix+'/menu.html');
 await expect(page.locator('.menu-grid #chicken-bucket, .menu-grid #leg-quarter')).toHaveCount(0);
 await page.locator('.campaign-callout .text-link').click();
 await expect(page.locator('.offer-card')).toHaveCount(3);
 await page.locator('.offer-chicken-bucket .text-link').click();
 await expect(page.locator('.poster-page img')).toHaveCount(1);
 await expect(page.locator('.poster-page img')).toHaveAttribute('src','/assets/posters/chicken-bucket-1.webp');
 await page.goto(prefix+'/leg-quarter.html');
 await expect(page.locator('.poster-page img')).toHaveCount(1);
 await expect(page.locator('.poster-page img')).toHaveAttribute('src','/assets/posters/leg-quarter-1.webp');
 await page.goto(prefix+'/stores.html');
 await expect(page.locator('#brooklyn .campaign-callout')).toHaveCount(0);
 await expect(page.locator('.location-detail')).toHaveCount(1);
 await expect(page.locator('#rolla')).toHaveCount(0);
});
