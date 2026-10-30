import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { load } from 'cheerio';
import sharp from 'sharp';

await mkdir('src/data', { recursive: true });
await mkdir('docs', { recursive: true });
const manifest = JSON.parse(await readFile('sources/manifest.json', 'utf8'));
const origin = 'https://frydomexpress.com';
const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const slug = value => value.toLowerCase().replace(/\(6 pcs\)/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const data = { capturedAt: manifest.capturedAt, locales: {}, routes: [], assets: {} };
const migration = [];
const links = [];
const issues = [];
const issue = (id, details, handling) => { if (!issues.some(x => x.id === id)) issues.push({ id, details, handling }); };
const pages = manifest.pages.filter(p => p.status === 200 && !p.route.endsWith('/index.html') && p.route !== '/index.html');
const dimensions = new Map();
for (const asset of manifest.assets.filter(a => a.status === 200)) {
  if (/\.(webp|png|jpe?g|gif)$/i.test(asset.localPath)) {
    const meta = await sharp('public' + asset.localPath).metadata();
    asset.width = meta.width; asset.height = meta.height;
    dimensions.set(asset.localPath, { width: meta.width, height: meta.height });
  }
  data.assets[decodeURIComponent(new URL(asset.sourceUrl).pathname)] = { src: asset.localPath, width: asset.width || 48, height: asset.height || 48 };
}
function image(ref, sourceUrl) {
  const key = decodeURIComponent(new URL(ref || '/logo-mark-240.webp', sourceUrl).pathname);
  if (data.assets[key]) return data.assets[key];
  issue('ASSET-404', 'Old HTML references unavailable images; comments also contain obsolete asset URLs.', 'Unavailable story JPG maps to the downloaded original story WebP. No fabricated product imagery.');
  return data.assets['/images/frydom-express-our3-800.webp'];
}
const routes = {
  en: { home: '/en/', story: '/en/about-us.html', menu: '/en/menu.html', locations: '/en/stores.html', partner: '/en/franchise.html', support: '/en/support.html', privacy: '/en/privacy-policy.html', terms: '/en/terms-of-service.html' },
  zh: { home: '/', story: '/about-us.html', menu: '/menu.html', locations: '/stores.html', partner: '/franchise.html', support: '/fuwu.html', privacy: '/privacy-policy.html', terms: '/terms-of-service.html' },
};
const categoryIds = { fried: 'fried-chicken', wings: 'wings', boneless: 'boneless-nuggets', burger: 'burgers-wraps', sides: 'sides-drinks' };
const categoryNames = { en: ['Fried Chicken', 'Wings', 'Boneless & Nuggets', 'Burgers & Wraps', 'Sides & Drinks'], zh: ['经典炸鸡', '风味鸡翅', '无骨鸡与鸡块', '汉堡与卷饼', '小食与饮品'] };
const pageSelectors = new Map();
function locator(q,element){
  const parts=[];let current=element;
  while(current&&current.type!=='root'){
    if(current.attribs?.id){parts.unshift('#'+current.attribs.id);break;}
    if(current.tagName){const node=q(current);const n=node.parent().children(current.tagName).index(node)+1;parts.unshift(current.tagName+`:nth-of-type(${Math.max(n,1)})`);}
    current=current.parent;
  }
  return parts.join(' > ');
}
for (const lang of ['en', 'zh']) {
  const locale = { routes: routes[lang], pages: {}, menu: [], categories: Object.values(categoryIds).map((id,i) => ({ id, name: categoryNames[lang][i] })) };
  const sources = {};
  for (const [kind, route] of Object.entries(routes[lang])) {
    const entry = pages.find(p => p.route === route);
    const q = load(await readFile(entry.file, 'utf8'));
    q('script,style,noscript').remove();
    sources[kind] = { q, entry };
    data.routes.push({ lang, kind, path: route });
    q('a[href]').each((i,el) => {
      const original = q(el).attr('href');
      let absolute; try { absolute = new URL(original, origin + route); } catch { return; }
      let target = absolute.href;
      if (absolute.origin === origin) {
        target = absolute.pathname + absolute.hash;
        // The old English logo and Home sometimes incorrectly link to the Chinese root.
        if (lang === 'en' && (original === '/' || original === 'index.html')) target = routes.en.home + absolute.hash;
        if (lang === 'zh' && absolute.pathname === '/index.html') target = '/' + absolute.hash;
      }
      links.push({ source_url: entry.sourceUrl, original_href: original, resolved_target: absolute.href, type: absolute.origin === origin ? 'internal' : absolute.protocol.replace(':', ''), new_href: target, status: 'preserved_or_language_corrected' });
    });
    const scope = q('main,.page').first();
    const clone = scope.clone(); clone.find('footer,header').remove();
    const sourceText = clean(clone.text());
    locale.pages[kind] = { sourceUrl: entry.sourceUrl, sourceTitle: clean(q('h1').first().text()), sourceText };
    pageSelectors.set(route, q);
    // Every non-empty leaf / paragraph / list item is individually traceable.
    clone.find('h1,h2,h3,h4,p,li,address,dt,dd,label,div,span,a').each((i,el) => {
      const node = q(el); const text = clean(node.text());
      if (!text || (['div','span'].includes(el.tagName) && node.children().length)) return;
      const card=node.closest('.menu-card,.hot-card');
      const record = { source_url: entry.sourceUrl, source_locator: locator(q,el), source_text: text, captured_at: manifest.capturedAt, entity_id: `${lang}-${kind}`, target_url: route, target_anchor: kind === 'home' ? 'brand' : kind === 'menu' ? 'menu' : kind === 'locations' ? 'locations' : 'content', action: ['privacy','terms'].includes(kind) ? 'retained' : 'restructured', issue_id: '', source_card_title:clean(card.find('.menu-card-title,.hot-name,.hot-title').first().text()),source_card_image:card.find('img').attr('src')||'' };
      if(kind==='home'){
        const section=node.closest('section').attr('id');
        record.target_anchor=({hero:'brand',hot:'favorites',brand:'why-frydom',promo:'special-offers',menu:'menu-highlights',franchise:'partner-banner-title','franchise-cta':'partner-banner-title',contact:'contact'})[section]||'contact';
      }
      if (node.closest('form').length) { record.entity_id = 'franchise-inquiry'; record.target_anchor = 'franchise-inquiry'; }
      migration.push(record);
    });
  }
  // Structured menu items: an English item ID identifies the same product across languages.
  const menuSource = sources.menu;
  const q = menuSource.q;
  const englishNames = lang === 'en' ? null : data.locales.en.menu.filter(item => !['whole-chicken-combo','original-recipe-fried-chicken'].includes(item.id));
  if (englishNames) englishNames.splice(9,0,data.locales.en.menu.find(item => item.id === 'original-recipe-fried-chicken'));
  q('.menu-card').each((i,el) => {
    const card = q(el);
    const rawName = clean(card.find('.menu-card-title').text());
    const id = lang === 'en' ? slug(rawName) : englishNames[i].id;
    const existing = locale.menu.find(item => item.id === id);
    if (existing) {
      existing.sources.push({ sourceUrl: menuSource.entry.sourceUrl, locator: `.menu-card:nth-of-type(${i+1})`, originalCategory: card.attr('data-cat') });
      issue('MENU-DUPLICATE', 'Original Recipe Fried Chicken is repeated under boneless in English and incorrectly classified as boneless in Chinese.', 'Merge the English duplicate by stable product ID; place the original bone-in chicken in Fried Chicken in both languages.');
      return;
    }
    const category = id === 'original-recipe-fried-chicken' ? 'fried-chicken' : categoryIds[card.attr('data-cat')];
    const price = clean(card.find('.menu-card-price').text());
    const labels = card.find('.menu-card-label').map((i,e) => clean(q(e).text())).get();
    locale.menu.push({ id, name: rawName, sourceName:rawName,description: clean(card.find('.menu-card-tagline').text()), sectionId: category, image: image(card.find('img').attr('src'), menuSource.entry.sourceUrl), labels, variants: price ? [{ id: 'combo', label: lang === 'en' ? 'Combo' : '套餐', quantityText: '', price: Number(price.replace(/[^0-9.]/g,'')), currency: null, status: 'source_consistent', scope: 'Representative menu; varies by location.' }] : [], sourcePrices: price ? [{ sourceUrl: menuSource.entry.sourceUrl, text: price }] : [], sources: [{ sourceUrl: menuSource.entry.sourceUrl, locator: `.menu-card:nth-of-type(${i+1})`, originalCategory: card.attr('data-cat') }], notes: [], priceStatus: 'source_consistent' });
  });
  const byId = id => locale.menu.find(item => item.id === id);
  function variants(id, values) {
    const item = byId(id); if (!item) return;
    item.variants = values.map(([label, price, quantityText = ''], index) => ({ id: slug(label) || 'variant-' + (index+1), label, quantityText, price, currency: null, status: 'source_consistent', scope: 'Representative menu; varies by location.' }));
  }
  const pcs = n => lang === 'en' ? `${n} pcs` : `${n} 块`;
  variants('original-recipe-fried-chicken', [[pcs(3),9.95,pcs(3)],[pcs(6),18.95,pcs(6)],[pcs(9),26.95,pcs(9)]]);
  variants('snow-cheese-wings', [[lang === 'en' ? 'Small' : '小份',5.95,pcs(4)],[lang === 'en' ? 'Large' : '大份',11.25,pcs(8)]]);
  variants('crispy-chicken-burger', [[lang === 'en' ? 'Burger only' : '单点汉堡',6.25]]);
  variants('french-fries', [[lang === 'en' ? 'Listed price' : '参考价格',3.95]]);
  variants('popcorn-chicken', [[lang === 'en' ? 'Listed price' : '参考价格',4.95]]);
  variants('drinks', [[lang === 'en' ? 'Soft drink' : '可乐 / 无糖可乐',1.5]]);
  if (lang === 'en') variants('amber-wings', [['Small',5.95,''],['Large',11.25,'']]);
  else {
    variants('drinks', [['可乐 / 无糖可乐',1.5],['雪碧',1.5],['橙味汽水',1.5]]);
    byId('drinks').notes.push('可乐 / 无糖可乐：原网站标注可加 $1 升级饮品；升级选项请向门店确认。');
    for (const id of ['honey-mustard-wings','sweet-chili-wings']) variants(id,[['小份',5.95,'4 块'],['大份',11.25,'8 块']]);
    for (const id of ['snow-cheese-boneless-chicken','amber-boneless-chicken','honey-mustard-boneless-chicken','sweet-chili-boneless-chicken']) variants(id,[['小份',4.95],['大份',8.95]]);
    variants('colonel-chicken-nuggets', [['6 块',3.25,'6 块'],['12 块',5.95,'12 块']]);
    variants('cod-fish-sandwich-combo', [['套餐',9.25]]);
    const zhCopy = {
      'crispy-chicken-burger': ['香脆鸡腿堡','金黄酥脆的鸡腿肉，外酥里嫩。'],
      'angus-beef-cheeseburger': ['安格斯芝士牛肉堡','多汁的安格斯牛肉搭配融化芝士，经典熟悉的风味。'],
      'crunch-burger-combo': ['劲脆鸡肉堡套餐','口味温和、搭配均衡的劲脆鸡肉堡套餐。'],
      'cod-fish-sandwich-combo': ['鳕鱼堡套餐','鳕鱼堡搭配薯条与饮品，适合午餐与外带。'],
      'crispy-chicken-burger-combo': ['香脆鸡腿堡套餐','香脆鸡腿堡、薯条与饮品。'],
      'angus-beef-cheeseburger-combo': ['安格斯芝士牛肉堡套餐','安格斯芝士牛肉堡、薯条与饮品。'],
      'chicken-wrap-combo': ['鸡肉卷套餐','手持鸡肉卷搭配酥脆鸡肉，适合午餐与外带。'],
      'wings-combo': ['鸡翅套餐','鸡翅、薯条与饮品。'],
      'onion-cheese-bacon-burger-combo': ['洋葱芝士培根汉堡套餐','洋葱芝士培根汉堡、薯条与饮品。'],
      'pineapple-beef-burger-combo': ['菠萝牛肉汉堡套餐','菠萝牛肉汉堡、薯条与饮品。'],
      'french-fries': ['薯条','经典金黄薯条，适合搭配炸鸡和汉堡套餐。'],
    };
    for (const [id,[name,description]] of Object.entries(zhCopy)) Object.assign(byId(id),{name,description});
  }
  const conflicts = lang === 'en' ? ['crispy-chicken-burger-combo'] : ['crispy-chicken-burger-combo','angus-beef-cheeseburger-combo','beef-cheeseburger-combo','pineapple-beef-burger-combo','wings-combo','onion-cheese-bacon-burger-combo'];
  for (const id of conflicts) {
    const item = byId(id);
    item.priceStatus = 'conflict';
    for (const v of item.variants) v.status = 'conflict';
    issue(`PRICE-${lang}-${id}`, `${item.name}: home highlights and menu list disagree, or home product identity is ambiguous.`, 'Preserve all source text in the migration ledger. Display a current-pricing enquiry instead of selecting a price; omit Offer JSON-LD.');
  }
  if(lang==='zh'){
    byId('wings-combo').description='6 块鸡翅搭配薯条与饮品。';
    byId('wings-combo').variants.push({id:'wings-only',label:'单点鸡翅',quantityText:'6 块',price:7.95,currency:null,status:'source_consistent',scope:'Representative menu; varies by location.'});
    byId('pineapple-beef-burger-combo').variants.push({id:'burger-only',label:'单点汉堡',quantityText:'',price:6.25,currency:null,status:'source_consistent',scope:'Representative menu; varies by location.'});
  }
  const home = sources.home.q;
  home('.menu-card,.hot-card').each((i,el) => {
    const card = home(el); const text = clean(card.text());
    const name = clean(card.find('.menu-card-title,.hot-name,.hot-title').first().text());
    const img = card.find('img').attr('src');
    const resolvedImage = img ? image(img,sources.home.entry.sourceUrl).src : null;
    const match = locale.menu.find(item => item.name === name || (lang === 'en' && item.name === name.replace('Soft Drinks','Drinks'))) || locale.menu.find(item => item.image.src === resolvedImage);
    if (match) match.sourcePrices.push({ sourceUrl: sources.home.entry.sourceUrl, locator: `.menu-card,.hot-card [${i+1}]`, text });
  });
  for (const item of locale.menu) {
    if (item.variants.length) item.sources.push({sourceUrl:sources.home.entry.sourceUrl,locator:'.hot-card / .menu-card (see sourcePrices and migration ledger)'});
    if (item.labels.some(s => /Photo update|图片更新/.test(s))) item.imageStatus = 'update_pending';
    if (item.id === 'classic-wings') { item.imageStatus = 'shared_source'; item.notes.push(lang === 'en' ? 'Illustrative photo shared with Honey Mustard Wings on the original website.' : '原网站与蜂蜜芥末鸡翅共用图片，图片仅供参考。'); }
    if (item.id === 'drinks') item.notes.push(lang === 'en' ? 'Illustrative beverage photo.' : '图片仅为饮品示意，不代表每一种口味。');
  }
  locale.home = {
    tagline: clean(home('h1').first().text()),
    intro: clean(home('.hero-v2-subtitle').text()),
    scan: home('.scan-item').map((i,e)=>({label:clean(home(e).find('.scan-k').text()),value:clean(home(e).find('.scan-v').text())})).get(),
    whyIntro: clean(home('#brand p,.section-brand-v2 p').first().text()),
    whyList: home('#brand li,.section-brand-v2 li').map((i,e)=>clean(home(e).text())).get(),
    offerText: clean(home('#promo .section-desc,#promo p,.promo-sub,.promo-text').text()),
    partnerText: clean(home('#franchise .section-desc,#franchise .fr-lead').text()),
    partnerList: home('#franchise li').map((i,e)=>clean(home(e).text())).get(),
    sourceSections: home('main > section').map((i,e)=>({id:home(e).attr('id'),text:clean(home(e).text())})).get(),
  };
  const story = sources.story.q;
  locale.story = {
    intro: clean(story('.brand-hero-sub').text()),
    paragraphs: story('.brand-hero-body p').map((i,e)=>clean(story(e).text())).get(),
    badges: story('.brand-hero-badge').map((i,e)=>clean(story(e).text())).get(),
    cards: story('.brand-card').map((i,e)=>({tag:clean(story(e).find('.brand-card-tag').text()),title:clean(story(e).find('h3').text()),text:clean(story(e).find('.brand-card-text').text())})).get(),
    timeline: story('.timeline-item').map((i,e)=>({label:clean(story(e).find('.timeline-label').text()),text:clean(story(e).find('.timeline-text').text())})).get(),
    contact: clean(story('.contact-block > div').first().text()),
  };
  const support = sources.support.q;
  locale.support = {
    intro: clean(support('.support-hero-sub').text()),
    sections: support('.support-section').map((i,e)=>({id:['brand-marketing','brand-operations','campaign-planning','promotional-support','market-research'][i],title:clean(support(e).find('h2').text()),subtitle:clean(support(e).find('.en-sub').text()),paragraphs:support(e).find('p').map((i,p)=>clean(support(p).text())).get(),tags:support(e).find('.tag').map((i,t)=>clean(support(t).text())).get(),image:image(support(e).find('img').attr('src'),sources.support.entry.sourceUrl)})).get(),
    overview: support('.support-card').map((i,e)=>({title:clean(support(e).find('h3').text()),text:clean(support(e).find('p').text())})).get(),
    ctaTitle: clean(support('.cta-box h2').text()), ctaText: clean(support('.cta-box p').text()),
  };
  const franchise = sources.partner.q;
  const fc = franchise('main').clone();
  fc.find('.fr-top-hero,#franchise-form-wrap,footer,script,style').remove();
  fc.find('*').each((i,e)=>{
    for (const key of Object.keys(e.attribs)) if (key.startsWith('on') || ['style','hidden','data-aos'].includes(key)) franchise(e).removeAttr(key);
  });
  fc.find('.fr-kicker').remove();
  fc.find('div.fr-title').each((i,e)=>{e.tagName='h2';franchise(e).find('.title-mark').remove();});
  fc.find('.fr-section').each((i,e)=>franchise(e).attr('id',i===0?'why-partner':'who-we-want'));
  fc.find('.flow-card').attr('id','partnership-process');
  fc.find('img').each((i,e)=>{ const ref=image(franchise(e).attr('src'),sources.partner.entry.sourceUrl);franchise(e).attr({src:ref.src,width:ref.width,height:ref.height,loading:'lazy'}).removeAttr('srcset'); });
  fc.find('a[href]').each((i,e)=>{const url=new URL(franchise(e).attr('href'),sources.partner.entry.sourceUrl);franchise(e).attr('href',url.origin === origin ? url.pathname : url.href);});
  fc.find('.flow-steps').each((i,e)=>{e.tagName='ol';franchise(e).find('.flow-step').each((i,n)=>{n.tagName='li';franchise(n).find('.flow-step-index').attr('aria-hidden','true');});});
  locale.partner = { intro:clean(franchise('.fr-top-hero-sub,.fr-top-hero-lead').text()), tags:franchise('.fr-top-hero-tag').map((i,e)=>clean(franchise(e).text())).get(),note:clean(franchise('.fr-top-hero-note').text()),heroText:clean(franchise('.fr-top-hero').text()), bodyHtml:fc.html(), sourceFormText:clean(franchise('#franchise-form-wrap').text()) };
  for (const kind of ['privacy','terms']) {
    const pq = sources[kind].q;
    const body = pq('main,.page').first().clone();body.find('footer,header,h1,script,style').remove();
    body.find('*').each((i,e)=>{
      for (const key of Object.keys(e.attribs)) if (key.startsWith('on') || ['style','hidden','class'].includes(key)) pq(e).removeAttr(key);
    });
    body.find('a[href]').each((i,e)=>{const url=new URL(pq(e).attr('href'),sources[kind].entry.sourceUrl);pq(e).attr('href',url.origin === origin ? url.pathname : url.href);});
    const toc=[];
    body.find('h2').each((i,e)=>{const id=slug(clean(pq(e).text()))||`section-${i+1}`;pq(e).attr('id',id);toc.push({id,text:clean(pq(e).text())});});
    locale.pages[kind].bodyHtml = body.html();
    locale.pages[kind].toc=toc;
    locale.pages[kind].bodyLanguage=kind==='privacy'?'en':lang==='zh'?'zh-Hans':'en';
    locale.pages[kind].date=kind==='privacy'?'2025-12-10':'2026-08-28';
  }
  locale.locations = [
    { id:'brooklyn',name:'Brooklyn, New York',address:{streetAddress:'781 61st St',addressLocality:'Brooklyn',addressRegion:'NY',postalCode:'11220',addressCountry:'US'},hoursText:'11 AM – 9 PM',schedule:null,services:['Dine-in','Takeout'],image:data.assets['/images/store-outside-800.webp'],sourceUrl:sources.locations.entry.sourceUrl },
  ];
  // Publish only the retained New York location, including imported page text.
  const locationText = locale.pages.locations.sourceText;
  const removedStart = lang === 'en' ? 'Rolla, Missouri' : '密苏里门店';
  const removedEnd = lang === 'en' ? 'More locations are on the way.' : '更多门店持续拓展中';
  const start = locationText.indexOf(removedStart), end = locationText.indexOf(removedEnd);
  if (start >= 0 && end > start) locale.pages.locations.sourceText = locationText.slice(0, start) + locationText.slice(end);
  data.locales[lang]=locale;
}
// A translation is not evidence that the same combo price conflict has been resolved.
// Retain distinct source records, but share uncertainty until market/channel scope is verified.
const conflictedIds=new Set(Object.values(data.locales).flatMap(l=>l.menu.filter(item=>item.priceStatus==='conflict').map(item=>item.id)));
for(const [lang,content]of Object.entries(data.locales))for(const item of content.menu){
  if(conflictedIds.has(item.id)&&item.priceStatus!=='conflict'){
    item.priceStatus='conflict';for(const variant of item.variants)variant.status='conflict';
    issue(`PRICE-${lang}-${item.id}`,`${item.name}: shared item has conflicting or ambiguous home/menu records in the other language; separate market/channel scope has not been verified.`,'Retain original values in sourcePrices; share conflict status across translations and request current restaurant pricing.');
  }
}
issue('HOURS-DAYS','Both location pages list 11 AM – 9 PM without weekdays.','Keep the original hours text with days unspecified; do not generate OpeningHoursSpecification or live open status.');
issue('ZH-LABELS','Chinese home Cod Fish combo says Only Wrap, onion bacon combo says Only Wings, and Snow Cheese Wings description says boneless.','Do not publish ambiguous standalone variants; use the corresponding menu description. Preserve source records for business confirmation.');
issue('PHOTO-STATUS','Original Crunch/Onion/Drinks cards say Photo update coming soon; Classic/Honey Mustard wings share an image.','Keep an explicit image note; do not infer item identity from filenames.');
issue('ZH-POLICY-EN','Existing Chinese-route privacy document is English; Chinese-route Terms of Service is Chinese.','Keep both original texts and dates; mark the privacy article en and the Chinese terms article zh-Hans, with a Chinese navigation shell.');
issue('TRACKING','Original malformed noscript pixel tag pollutes extracted text; old source matching classifies Gemini as Google.','Production-only valid pixel loading, no preview tracking; match Gemini before Google and support chatgpt.com.');
data.brand={ name:'Frydom Express',email:'info@frydomexpress.com',partnershipPhone:'400-672-8856',logo:data.assets['/logo-mark-240.webp'],wordmark:'FRYDOM EXPRESS',colors:{primary:'#ed8f21',dark:'#cd5817',background:'#faeec9',soft:'#fff7e8',accent:'#e7c579',heading:'#a94a17',body:'#5c4a3a',muted:'#7a6552'} };
data.forms={ endpoint:'https://api.hsforms.com/submissions/v3/integration/submit/244594952/076c2dbe-f5cb-46b7-a711-09d2dfd0f430',method:'POST',contentType:'application/json',fields:['name','phone','wechat','note','email','traffic_source','utm_source','utm_medium','utm_campaign','referrer_url'],required:['name','phone'],pixelId:'4404293963139526' };
const csv=rows=>{const keys=Object.keys(rows[0]);return '\ufeff'+[keys,...rows.map(row=>keys.map(key=>String(row[key]??'')))].map(row=>row.map(cell=>'"'+String(cell).replaceAll('"','""')+'"').join(',')).join('\n')+'\n';};
for (const row of migration) {
  const lang=row.source_url.includes('/en/')?'en':'zh';
  const content=data.locales[lang];
  if(row.source_card_image||row.source_card_title){
    const ref=row.source_card_image?image(row.source_card_image,row.source_url):null;
    const item=content.menu.find(i=>i.sourceName===row.source_card_title||i.name===row.source_card_title)||content.menu.find(i=>i.image.src===ref?.src);
    if(item){row.entity_id=item.id;row.target_url=content.routes.menu;row.target_anchor=item.id;if(item.priceStatus==='conflict'&&/\$/.test(row.source_text)){row.action='unresolved';row.issue_id='PRICE-'+lang+'-'+item.id;}if(item.id==='original-recipe-fried-chicken'&&row.source_url.endsWith('menu.html')){row.action='merged';row.issue_id='MENU-DUPLICATE';}}
  }
  if (/Only Wrap|Only Wings|无骨鸡肉裹上浓郁芝士风味/.test(row.source_text) && row.source_url===origin+'/') {row.action='unresolved';row.issue_id='ZH-LABELS';}
}
data.routes=data.routes.filter(route=>!['story','support'].includes(route.kind));
for(const content of Object.values(data.locales)){content.routes.story=content.routes.home;content.routes.support=content.routes.partner+'#partner-support';}
await writeFile('src/data/site.json',JSON.stringify(data,null,2));
await writeFile('docs/content-migration.csv',csv(migration));
await writeFile('docs/link-map.csv',csv(links));
await writeFile('docs/asset-manifest.csv',csv(manifest.assets.map(a=>({source_url:a.sourceUrl,local_file:a.status===200?'public'+a.localPath:'',pages:a.pages.join(' | '),width:a.width,height:a.height,bytes:a.bytes,status:a.status,handling:a.status===200?'downloaded':'obsolete_or_unavailable; see content-issues.md'}))));
await writeFile('docs/content-issues.json',JSON.stringify(issues,null,2));
await writeFile('docs/content-issues.md','# 内容问题与处理\n\n'+issues.map(i=>`## ${i.id}\n\n${i.details}\n\n处理：${i.handling}\n`).join('\n'));
console.log(JSON.stringify({routes:data.routes.length,menu:{en:data.locales.en.menu.length,zh:data.locales.zh.menu.length},migrationRows:migration.length,links:links.length,issues:issues.length}));
