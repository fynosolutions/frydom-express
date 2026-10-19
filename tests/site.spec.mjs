import{test,expect}from'@playwright/test';
import{readFile}from'node:fs/promises';
import path from'node:path';
const data=JSON.parse(await readFile('src/data/site.json','utf8'));
for(const width of[320,390,768,1440])for(const route of data.routes){
  test(`${width}px ${route.path} readable and no overflow`,async({page})=>{
    await page.setViewportSize({width,height:900});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const response=await page.goto(route.path);expect(response.status()).toBe(200);
    await page.evaluate(()=>document.fonts.ready);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await expect(page.locator('h1')).toBeVisible();expect(errors).toEqual([]);
    if(route.kind==='menu'){
      await expect(page.locator('article[data-item-id]')).toHaveCount(data.locales[route.lang].menu.length);
      const last=page.locator('.menu-section').last();await last.scrollIntoViewIfNeeded();await expect(last.locator('h2')).toBeVisible();
    }
    if(route.kind==='partner')await expect(page.locator('#submit-inquiry')).toBeEnabled();
  });
}

test('first visit attribution survives homepage to form navigation',async({page})=>{
  await page.addInitScript(()=>{window.__FRYDOM_FORM_TEST__=true;});let payload;
  await page.route('https://api.hsforms.com/**',route=>{payload=route.request().postDataJSON();return route.fulfill({status:200,contentType:'application/json',body:'{}'});});
  await page.goto('/en/?utm_source=first-visit&utm_campaign=homepage');await page.goto('/en/franchise.html?utm_source=later');
  await page.locator('[name=name]').fill('LOCAL QA TEST');await page.locator('[name=phone]').fill('+1 202 555 0100');await page.locator('#submit-inquiry').click();await expect(page.locator('#form-status')).toHaveAttribute('data-state','success');
  expect(payload.fields.find(f=>f.name==='utm_source').value).toBe('first-visit');expect(payload.fields.find(f=>f.name==='utm_campaign').value).toBe('homepage');
});

test('storage restrictions do not break navigation or the form handler',async({page})=>{
  await page.addInitScript(()=>{Object.defineProperty(window,'sessionStorage',{get(){throw new DOMException('Disabled','SecurityError');}});});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/en/franchise.html');await expect(page.locator('#submit-inquiry')).toBeEnabled();await page.locator('#submit-inquiry').click();await expect(page.locator('[name=name]')).toBeFocused();expect(errors).toEqual([]);
});

test('simulated production host: one request, one Lead, no personal analytics fields',async({browser})=>{
  const context=await browser.newContext();const page=await context.newPage();let submissions=0;
  await context.route('**/*',async route=>{
    const request=route.request();const u=new URL(request.url());
    if(u.hostname==='api.hsforms.com'){
      if(request.method()==='OPTIONS')return route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'POST'}});
      submissions++;return route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:'{}'});
    }
    if(u.hostname!=='frydomexpress.com')return route.abort();
    const target=path.resolve('dist','.'+u.pathname);if(!target.startsWith(path.resolve('dist')+path.sep))return route.abort();
    try{
      const file=await readFile(target);const ext=path.extname(target);const types={'.html':'text/html','.css':'text/css','.js':'application/javascript','.webp':'image/webp','.png':'image/png','.ttf':'font/ttf'};
      return route.fulfill({status:200,contentType:types[ext]||'application/octet-stream',body:file});
    }catch{return route.abort();}
  });
  try{
    await page.goto('https://frydomexpress.com/en/franchise.html');await page.locator('[name=name]').fill('LOCAL QA TEST');await page.locator('[name=phone]').fill('+1 202 555 0100');
    await page.locator('#franchise-form').evaluate(form=>{form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
    await expect(page.locator('#form-status')).toHaveAttribute('data-state','success');expect(submissions).toBe(1);
    const events=await page.evaluate(()=>window.fbq.queue);expect(events.filter(e=>e[0]==='track'&&e[1]==='PageView')).toHaveLength(1);const leads=events.filter(e=>e[0]==='track'&&e[1]==='Lead');expect(leads).toHaveLength(1);expect(Object.keys(leads[0][2])).toEqual(['source']);expect(JSON.stringify(events)).not.toContain('LOCAL QA TEST');
  }finally{await context.close();}
});
for(const route of data.routes)test(`no JavaScript ${route.path}`,async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});const page=await context.newPage();
  try{
    await page.goto('http://127.0.0.1:4321'+route.path);await expect(page.locator('h1')).toBeVisible();
    await page.locator('summary').first().click();await expect(page.locator('.mobile-navigation nav')).toBeVisible();
    if(route.kind==='menu')for(const category of data.locales[route.lang].categories){await expect(page.locator('#'+category.id+' h2')).toBeVisible();}
    if(route.kind==='partner'){await expect(page.locator('#submit-inquiry')).toBeDisabled();await expect(page.locator('noscript a')).toBeVisible();await expect(page.locator('noscript a')).toHaveAttribute('href','mailto:info@frydomexpress.com');}
    if(route.kind==='locations')for(const location of data.locales[route.lang].locations)await expect(page.locator('#'+location.id+' address')).toContainText(location.address.streetAddress);
  }finally{await context.close();}
});
test('homepage responsive image and paused ribbon',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/en/');
  await page.locator('.hero-food').evaluate(image=>image.decode());expect(await page.locator('.hero-food').evaluate(image=>image.naturalWidth)).toBeGreaterThan(0);
  await page.locator('.ribbon-pause').click();await expect(page.locator('.ribbon-pause')).toHaveAttribute('aria-pressed','true');await expect(page.locator('.brand-ribbon')).toHaveClass(/is-paused/);
  const gallery=page.locator('#favorites-gallery');await gallery.scrollIntoViewIfNeeded();await page.locator('[data-favorites-next]').click();await expect.poll(()=>gallery.evaluate(e=>e.scrollLeft)).toBeGreaterThan(0);
});
test('reduced motion and blocked animation script preserve content',async({browser})=>{
  const context=await browser.newContext({reducedMotion:'reduce',viewport:{width:390,height:844}});const page=await context.newPage();
  try{
    await page.goto('http://127.0.0.1:4321/en/');expect(await page.locator('.ribbon-track').evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
    await page.route('**/_astro/*.js',route=>route.abort());await page.goto('http://127.0.0.1:4321/en/menu.html');await expect(page.locator('article[data-item-id]')).toHaveCount(26);await expect(page.locator('h1')).toBeVisible();
  }finally{await context.close();}
});
test('all legacy routes return full initial HTTP HTML, aliases redirect and missing URL is 404',async({request})=>{
  for(const route of data.routes){const response=await request.get(route.path);expect(response.status()).toBe(200);expect(response.headers()['x-robots-tag']).toBe('noindex, nofollow');expect(await response.text()).toContain('<h1');}
  for(const route of['/robots.txt','/sitemap.xml'])expect((await request.get(route)).status()).toBe(200);
  expect((await request.get('/en/not-a-real-page.html')).status()).toBe(404);
  expect((await request.get('/en/index.html',{maxRedirects:0})).status()).toBe(301);
  expect((await request.get('/index.html',{maxRedirects:0})).status()).toBe(301);
});
for(const lang of['en','zh']){
  const route=data.locales[lang].routes.partner;
  test(`${lang} form required fields and optional email`,async({page})=>{
    await page.goto(route);await page.locator('#submit-inquiry').click();await expect(page.locator('[name=name]')).toBeFocused();
    await page.locator('[name=name]').fill('QA TEST');await page.locator('#submit-inquiry').click();await expect(page.locator('[name=phone]')).toBeFocused();
    await page.locator('[name=phone]').fill('+1 202 555 0100');await page.locator('[name=email]').fill('invalid');await page.locator('#submit-inquiry').click();await expect(page.locator('[name=email]')).toBeFocused();
    await expect(page.locator('[name=email]')).toHaveAttribute('aria-invalid','true');
  });
  test(`${lang} preview blocks real CRM submissions and analytics`,async({page})=>{
    let externalRequests=0;page.on('request',r=>{if(/api.hsforms|facebook/.test(r.url()))externalRequests++;});
    await page.goto(route);await page.locator('[name=name]').fill('QA TEST');await page.locator('[name=phone]').fill('+1 202 555 0100');await page.locator('#submit-inquiry').click();await expect(page.locator('#form-status')).toHaveAttribute('data-state','error');expect(externalRequests).toBe(0);await expect(page.locator('[name=name]')).toHaveValue('QA TEST');
  });
  for(const state of['success','failure','network-failure'])test(`${lang} mocked ${state} preserves contract`,async({page})=>{
    await page.addInitScript(()=>{window.__FRYDOM_FORM_TEST__=true;});
    let count=0;let payload;
    await page.route('https://api.hsforms.com/**',async route=>{
      count++;payload=route.request().postDataJSON();
      if(state==='network-failure')await route.abort();else await route.fulfill({status:state==='success'?200:500,contentType:'application/json',body:JSON.stringify({})});
    });
    await page.goto(route+'?utm_source=qa&utm_medium=test&utm_campaign=local');
    await page.locator('[name=name]').fill('LOCAL QA TEST');await page.locator('[name=phone]').fill('+1 202 555 0100');await page.locator('#submit-inquiry').click();
    await expect(page.locator('#form-status')).toHaveAttribute('data-state',state==='success'?'success':'error');expect(count).toBe(1);
    expect(payload.fields.map(f=>f.name).sort()).toEqual([...data.forms.fields].sort());expect(payload.fields.find(f=>f.name==='utm_source').value).toBe('qa');expect(payload.context.pageUri).toContain(route);expect(payload.context.pageName).toBe(await page.title());
    await expect(page.locator('[name=name]')).toHaveValue(state==='success'?'':'LOCAL QA TEST');await expect(page.locator('#submit-inquiry')).toBeEnabled();
  });
}
