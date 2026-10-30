import { readFile,writeFile,mkdir,access } from 'node:fs/promises';
import { load } from 'cheerio';
import path from 'node:path';
import assert from 'node:assert/strict';
const data=JSON.parse(await readFile('src/data/site.json','utf8'));
const checks=[];const failures=[];const cache=new Map();
const origin='https://frydomexpress.com';
// Prices transcribed from the owner-approved 1015 printed menu, page 1.
const printedPrices={
  'original-recipe-fried-chicken':[9.95,18.95,26.95],
  'golden-chicken-combo':[13.95], 'korean-fried-chicken-combo':[15.95],
  'chicken-burger-fried-chicken-combo':[8.45], 'chicken-burger-lemon-tea-combo':[11.45],
  'angus-beef-cheeseburger':[8.25], 'crispy-chicken-burger':[6.25],
  'crispy-fish-fillet-burger':[6.75], 'chicken-wrap':[5.95], 'fried-wings-6-pcs':[7.95],
  'angus-beef-cheeseburger-combo':[11.95], 'crispy-chicken-burger-combo':[9.95],
  'crispy-fish-fillet-burger-combo':[10.75], 'chicken-wrap-combo':[9.25], 'wings-combo':[11.25],
  ...Object.fromEntries(['sweet-plum','snow-cheese','cumin','amber','sweet-chili','honey-mustard'].flatMap(flavor=>[
    [flavor+'-wings',[5.95,11.25]],[flavor+'-boneless-chicken',[4.95,8.95]]
  ])),
  'popcorn-chicken':[4.95], 'colonel-chicken-nuggets':[3.25,5.95], 'french-fries':[3.95], 'buttercorn':[3.95],
  'cola':[1.50], 'sprite':[1.50], 'orange-soda':[1.50], 'bottled-water':[1.50]
};
const text=value=>String(value||'').replace(/\s+/g,' ').trim();
const fileFor=route=>'dist'+(route.endsWith('/')?route+'index.html':route);
async function document(route){if(cache.has(route))return cache.get(route);const q=load(await readFile(fileFor(route),'utf8'));cache.set(route,q);return q;}
function check(name,run){try{run();checks.push({name,status:'passed'});}catch(error){failures.push({name,error:error.message});checks.push({name,status:'failed',error:error.message});}}
for(const {lang,kind,path:route}of data.routes){
  const q=await document(route);const source=data.locales[lang];
  check(route+' semantics',()=>{assert.equal(q('h1').length,1);assert.equal(q('main').length,1);assert.equal(q('html').attr('lang'),lang==='en'?'en':'zh-Hans');if(['staff-offer','leg-quarter','chicken-bucket'].includes(kind)){assert.equal(q('.campaign-posters img').length,kind==='staff-offer'?2:1);assert.equal(q('.campaign-copy').length,1);assert.equal(q('.campaign-terms').length,1);assert(q('.campaign-copy').text().includes(source.offers.find(o=>o.id===kind).headline));}else assert(q('main').text().trim().length>100);assert.equal(q('head meta[name=robots]').length,0);assert(!q('main').text().includes('< img'));});
  check(route+' canonical and language alternates',()=>{assert.equal(q('link[rel=canonical]').attr('href'),origin+route);for(const l of ['en','zh'])assert.equal(q(`link[hreflang="${l==='en'?'en':'zh-Hans'}"]`).attr('href'),origin+data.locales[l].routes[kind]);});
  check(route+' unique IDs',()=>{const ids=q('[id]').map((i,e)=>q(e).attr('id')).get();assert.equal(new Set(ids).size,ids.length);});
  check(route+' exact active navigation',()=>{assert.equal(q('.desktop-nav a[aria-current=page]').length,['home','privacy','terms'].includes(kind)?0:1);assert.equal(q('.desktop-nav a').length,6);assert.equal(q('.desktop-nav[hidden]').length,0);});
  let graph;
  check(route+' JSON-LD parses and contains only supported facts',()=>{graph=JSON.parse(q('script[type="application/ld+json"]').text())['@graph'];assert(graph.some(n=>n['@type']==='Organization'));assert(!JSON.stringify(graph).match(/OpeningHoursSpecification|aggregateRating|ratingValue|legalName|priceCurrency|Open now|OrderAction/));});
  for(const element of q('a[href]').toArray()){
    const href=q(element).attr('href');let dest;try{dest=new URL(href,origin+route);}catch{failures.push({name:route+' link',error:href});continue;}
    if(dest.origin!==origin)continue;
    if(dest.pathname.endsWith('.pdf')){const pdf=await readFile(path.join('dist',dest.pathname));check(route+' original poster PDF',()=>assert.equal(pdf.subarray(0,5).toString(),'%PDF-'));continue;}
    const destPath=['/en/index.html','/index.html'].includes(dest.pathname)?dest.pathname.startsWith('/en/')?'/en/':'/':dest.pathname;
    try{const target=await document(destPath);if(dest.hash)assert.equal(target('[id]').toArray().filter(e=>target(e).attr('id')===decodeURIComponent(dest.hash.slice(1))).length,1);}
    catch(error){failures.push({name:route+' link target',error:href+' — '+error.message});}
  }
  for(const element of q('img[src]').toArray()){
    const img=q(element);const src=img.attr('src');
    try{assert(src.startsWith('/assets/'));await access(path.join('dist',src));assert(Number(img.attr('width'))>0);assert(Number(img.attr('height'))>0);assert.notEqual(img.attr('alt'),undefined);}
    catch(error){failures.push({name:route+' image',error:src+' — '+error.message});}
  }
  if(kind==='menu'){
    check(route+' approved printed menu prices and portions',()=>{
      assert.deepEqual(Object.fromEntries(source.menu.map(i=>[i.id,i.variants.map(v=>v.price)])),printedPrices);
      assert.deepEqual(source.categories.map(c=>source.menu.filter(i=>i.sectionId===c.id).length),[1,4,5,5,6,6,4,4]);
      assert.equal(q('#combos .menu-item').length,5);
      assert.equal(q('#burgers-wraps .menu-item').length,5);
      assert.equal(q('.price-enquiry').length,0);
      for(const item of source.menu.filter(i=>['wings','boneless-nuggets'].includes(i.sectionId))){
        assert.deepEqual(item.variants.map(v=>v.id),['small','large']);
        assert(item.variants.every(v=>!v.quantityText));
      }
      assert.equal(q('a.menu-pdf').attr('href'),'/assets/menu-1015/menu-1015.pdf');
    });
    check(route+' full menu coverage and headings',()=>{
      assert.deepEqual(q('main article[data-item-id]').map((i,e)=>q(e).attr('id')).get().sort(),source.menu.map(item=>item.id).sort());
      for(const category of source.categories){const section=q('#'+category.id);assert.equal(section.find('h2').length,1);}
      for(const item of source.menu){const card=q('#'+item.id);assert.equal(text(card.find('h3').text()),item.name);assert.equal(text(card.find('.item-description').text()),item.description);for(const v of item.variants.filter(v=>v.status!=='conflict')){const price=card.find(`[data-variant="${v.id}"]`);assert.equal(price.text(),'$'+v.price.toFixed(2));}if(item.priceStatus==='conflict')assert(card.find('.price-enquiry').length);}
      const schemaItems=graph.find(n=>n['@type']==='Menu').hasMenuSection.flatMap(c=>c.hasMenuItem);
      assert.equal(schemaItems.length,source.menu.length);
      for(const item of source.menu)assert.equal(schemaItems.find(s=>s['@id'].endsWith('#'+item.id)).name,item.name);
    });
  }
  if(kind==='locations')check(route+' only the Brooklyn location is published accurately',()=>{
    const restaurants=graph.filter(n=>n['@type']==='Restaurant');assert.equal(restaurants.length,1);assert.deepEqual(source.locations.map(location=>location.id),['brooklyn']);assert.equal(q('.location-detail').length,1);
    for(const location of source.locations){const card=q('#'+location.id);assert.equal(card.length,1);assert(text(card.find('address').text()).includes(location.address.streetAddress));assert(card.text().includes(location.hoursText));assert(!card.text().includes(data.brand.partnershipPhone));const restaurant=restaurants.find(r=>r['@id'].endsWith('#'+location.id));assert.deepEqual(restaurant.address,{'@type':'PostalAddress',...location.address});}
  });
  if(['privacy','terms'].includes(kind))check(route+' legal text and dates preserved',()=>{
    const old=load(source.pages[kind].bodyHtml);assert.equal(text(q('.legal-content').text()),text(old.root().text()));assert(q('.legal-content').text().includes(kind==='privacy'?'December 10, 2025':'2026-08-28'));assert.equal(q('.legal-content').attr('lang'),source.pages[kind].bodyLanguage);
  });
  if(kind==='partner')check(route+' original form contract and safe no-script fallback',()=>{assert.equal(q('form').length,1);const form=q('#franchise-form');assert.equal(form.attr('method'),'post');assert.equal(form.attr('data-endpoint'),data.forms.endpoint);assert.deepEqual(form.find('[required]').map((i,e)=>q(e).attr('name')).get().sort(),['name','phone']);assert.equal(form.find('button[type=submit][disabled]').length,1);assert.equal(form.find('noscript').length,1);for(const name of ['name','phone','wechat','email','note'])assert.equal(form.find(`[name="${name}"]`).length,1);});
  if(kind==='partner')check(route+' five complete original support sections',()=>{for(const section of source.support.sections){assert(q('#'+section.id).length);for(const p of section.paragraphs)assert(text(q('#'+section.id).text()).includes(p));}});
}
check('unique page titles and descriptions',()=>{const titles=[...cache.values()].map(q=>q('title').text());assert.equal(new Set(titles).size,data.routes.length);const descriptions=[...cache.values()].map(q=>q('meta[name=description]').attr('content'));assert.equal(new Set(descriptions).size,data.routes.length);});
const sitemap=await readFile('dist/sitemap.xml','utf8');
check('sitemap lists only canonical routes',()=>{const q=load(sitemap,{xml:true});assert.equal(q('url').length,data.routes.length);for(const route of data.routes)assert(q('loc').map((i,e)=>q(e).text()).get().includes(origin+route.path));assert(!sitemap.includes('#'));assert(!sitemap.includes('localhost'));assert(!sitemap.includes('lastmod'));});
check('robots and homepage aliases',()=>{assert(data.routes.some(r=>r.path==='/en/'));assert(data.routes.some(r=>r.path==='/'));});
await mkdir('docs/qa',{recursive:true});
function readable(q,node){if(node.type==='text')return node.data;if(['script','style','nav','footer'].includes(node.tagName))return'';const block=['h1','h2','h3','h4','p','li','section','article','dt','dd','address','div','br','summary'].includes(node.tagName);return(block?'\n':' ')+(node.children||[]).map(n=>readable(q,n)).join('')+(block?'\n':' ');}
for(const {lang,kind,path:route}of data.routes){const q=(await document(route));const main=q('main').clone();main.find('script,style,nav').remove();const output=readable(q,main[0]).split('\n').map(text).filter(Boolean).join('\n');await writeFile(`docs/qa/extracted-${lang}-${kind}.txt`,output+'\n');}
const report={executedAt:new Date().toISOString(),method:'Production HTML parsed with Cheerio, without executing JavaScript. Not a search indexing or live CRM test.',routes:data.routes.length,checks:checks.length,passed:checks.filter(c=>c.status==='passed').length,failures,details:checks};
await writeFile('docs/qa/static-verification.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({routes:report.routes,passed:report.passed,checks:report.checks,failures}));
if(failures.length)process.exitCode=1;
