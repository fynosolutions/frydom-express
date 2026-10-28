import {test,expect} from '@playwright/test';

for(const prefix of ['', '/en'])test(`offer navigation, terms and language switch ${prefix||'zh'}`,async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(prefix+'/offers.html');
 await expect(page.locator('.offer-card')).toHaveCount(3);
 await page.locator('.offer-staff-offer .text-link').click();
 await expect(page.locator('.campaign-benefits')).toContainText('$100');
 await expect(page.locator('.campaign-terms')).toContainText(prefix?'stored-value card':'充值卡');
 await expect(page.locator('a[href="tel:+19298050718"]')).toBeVisible();
 await page.locator('.language-link').click();
 await expect(page).toHaveURL(new RegExp((prefix?'^http://127.0.0.1:4321':'/en')+'/staff-offer.html$'));
 await page.goto(prefix+'/menu.html');
 await page.locator('#chicken-bucket .text-link').click();
 await expect(page.locator('.campaign-price')).toContainText('$38.99');
 await expect(page.locator('.campaign-benefits')).toContainText('2 Korean-Style');
 await expect(page.locator('.campaign-terms')).toContainText(prefix?'portions':'份量');
 await page.goto(prefix+'/stores.html');
 await expect(page.locator('#brooklyn a[href$="staff-offer.html"]')).toHaveCount(1);
 await expect(page.locator('#rolla a[href$="staff-offer.html"]')).toHaveCount(0);
});
