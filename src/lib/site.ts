import site from '../data/site.json';

export type Language = 'en' | 'zh';
export type PageKind = 'home' | 'story' | 'menu' | 'locations' | 'partner' | 'support' | 'privacy' | 'terms' | 'offers' | 'staff-offer' | 'leg-quarter' | 'chicken-bucket';
export const data = site as any;
export const t = (lang: Language, en: string, zh: string) => lang === 'en' ? en : zh;
export const locale = (lang: Language) => data.locales[lang];
export const url = (lang: Language, kind: PageKind) => locale(lang).routes[kind];
export const navigation: PageKind[] = ['home','menu','offers','locations','partner','support','privacy'];
export const primaryNavigation: PageKind[] = ['menu','offers','locations','partner'];
export const orderPlatforms = [
  {name:'Uber Eats',href:'https://www.ubereats.com/store/frydom-express-fried-chicken-%E9%A3%9E%E4%B9%90%E7%82%B8%E9%B8%A1-781-61st-street/OLdZQvsVXzWCMBpsf9uctg'},
  {name:'Grubhub',href:'https://www.grubhub.com/restaurant/frydom-express-fried-chicken-fei-le-zha-ji-781-61st-street-brooklyn/13464504'},
];
export const labels: Record<Language, Record<PageKind,string>> = {
  en: { offers:'Offers', 'staff-offer':'Work ID & Group Offers', 'leg-quarter':'Crispy-Skinned Chicken Leg Quarter', 'chicken-bucket':'Ultimate Chicken Bucket', home:'Home',story:'Our Story',menu:'Menu',locations:'Locations',partner:'Become a Partner',support:'Partner Support',privacy:'Privacy Policy',terms:'Terms of Service' },
  zh: { offers:'新品与优惠', 'staff-offer':'工作证件优惠 · 团餐福利', 'leg-quarter':'脆皮手枪腿', 'chicken-bucket':'炸鸡桶与盲盒', home:'首页',story:'品牌故事',menu:'菜单',locations:'门店',partner:'加盟合作',support:'总部支持',privacy:'隐私政策',terms:'服务条款' },
};
const descriptions: Record<Language,Record<PageKind,string>> = {
  en: {
    offers:'Explore new arrivals, staff and group meal benefits, and the Ultimate Chicken Bucket blind box offer.',
    'staff-offer':'Show your work ID at our Brooklyn location for staff and group meal benefits. View qualifying amounts and contact details.',
    'leg-quarter':'Discover our freshly fried Crispy-Skinned Chicken Leg Quarter, advertised at $6.45. Ask about participating locations.',
    'chicken-bucket':'Discover the $38.99 Ultimate Chicken Bucket with a free $20 blind box. View the advertised meal and ask about availability.',
    home:'Meet Frydom Express: crispy fried chicken, wings, burgers, wraps and sides. Explore our menu and visit our Brooklyn, New York location.',
    story:'Discover the Brooklyn roots of Frydom Express, our golden fried chicken, globally inspired sauces and neighborhood store experience.',
    menu:'Explore the Frydom Express Brooklyn menu with prices for fried chicken, combos, burgers, wings, boneless chicken, sides and drinks.',
    locations:'Find our Frydom Express location in Brooklyn, New York, including the address, hours, phone number, directions and dine-in and takeout services.',
    partner:'Explore Frydom Express partnership opportunities, local menu flexibility, standardized operations, opening support and the original franchise inquiry form.',
    support:'Learn about Frydom Express brand marketing, licensing, campaign planning, promotional support, market research and partner operations.',
    privacy:'Read the Frydom Express Privacy Policy, last updated December 10, 2025, including personal data handling and contact details.',
    terms:'Read the Frydom Express Terms of Service, last updated August 28, 2026, including acceptable use, intellectual property and contact details.',
  },
  zh: {
    offers:'探索 Frydom Express 新品、员工团餐福利及炸鸡桶赠盲盒活动，查看优惠详情与门店信息。',
    'staff-offer':'Brooklyn 门店员工与团餐福利：出示工作证件 ID，查看九折门槛、赠品及电话咨询方式。',
    'leg-quarter':'脆皮手枪腿新品，海报价格 $6.45，酥脆、多汁、现炸。查看商品介绍并咨询供应门店。',
    'chicken-bucket':'Ultimate Chicken Bucket 炸鸡桶 $38.99，赠价值 $20 盲盒。查看套餐说明与活动详情。',
    home:'Frydom Express 炸鸡、风味鸡翅、汉堡、卷饼与小食。查看真实菜单，了解纽约布鲁克林门店。',
    story:'了解 Frydom Express 品牌故事、现炸鸡肉、环球风味蘸料与社区门店体验。',
    menu:'查看 Frydom Express 纽约门店菜单：炸鸡、特色套餐、汉堡、鸡翅、无骨鸡块、小食与饮料，以及单点和套餐价格。',
    locations:'查看 Frydom Express 纽约布鲁克林门店地址、营业时段与联系电话及堂食、外带服务。',
    partner:'了解 Frydom Express 加盟合作、菜单适配、标准化运营与开业支持，提交原品牌渠道加盟意向。',
    support:'了解 Frydom Express 品牌推广、授权管理、营销策划、促销支持与市场研究服务。',
    privacy:'阅读 Frydom Express 原版隐私政策，保留 2025 年 12 月 10 日更新日期与完整英文条款。',
    terms:'阅读 Frydom Express 原版服务条款，保留 2026 年 8 月 28 日更新日期与完整原版条款。',
  },
};
export function metadata(lang:Language,kind:PageKind) {
  return {
    title:kind==='home'?t(lang,'Frydom Express — Crispy Fried Chicken & Burgers','Frydom Express — 金黄酥脆，一口爆汁'):labels[lang][kind]+' | Frydom Express',
    description:descriptions[lang][kind],
  };
}
export function asset(path:string) {return data.assets[path];}
export function structuredData(lang:Language,kind:PageKind) {
  const origin='https://frydomexpress.com';
  const canonical=origin+url(lang,kind);
  const organization={'@type':'Organization','@id':origin+'/#organization',name:'Frydom Express',url:origin+'/',email:data.brand.email,logo:origin+data.brand.logo.src};
  const website={'@type':'WebSite','@id':origin+'/#website',url:origin+'/',name:'Frydom Express',publisher:{'@id':organization['@id']}};
  const type=kind==='story'?'AboutPage':kind==='locations'?'CollectionPage':'WebPage';
  const page:any={'@type':type,'@id':canonical+'#webpage',url:canonical,name:metadata(lang,kind).title,description:metadata(lang,kind).description,inLanguage:lang==='zh'?'zh-Hans':'en',isPartOf:{'@id':website['@id']},about:{'@id':organization['@id']}};
  const graph:any[]=[organization,website,page];
  if(kind!=='home')graph.push({'@type':'BreadcrumbList','@id':canonical+'#breadcrumbs',itemListElement:[{'@type':'ListItem',position:1,name:labels[lang].home,item:origin+url(lang,'home')},{'@type':'ListItem',position:2,name:labels[lang][kind],item:canonical}]});
  if(kind==='menu') {
    const menu={'@type':'Menu','@id':canonical+'#menu',name:t(lang,'Frydom Express Menu','Frydom Express 菜单'),url:canonical,inLanguage:lang==='zh'?'zh-Hans':'en',description:descriptions[lang].menu,hasMenuSection:locale(lang).categories.filter((c:any)=>locale(lang).menu.some((i:any)=>i.sectionId===c.id)).map((c:any)=>({'@type':'MenuSection','@id':canonical+'#'+c.id,name:c.name,hasMenuItem:locale(lang).menu.filter((i:any)=>i.sectionId===c.id).map((i:any)=>({'@type':'MenuItem','@id':canonical+'#'+i.id,name:i.name,description:i.description,image:origin+i.image.src}))}))};
    graph.push(menu);page.mainEntity={'@id':menu['@id']};
  }
  if(kind==='locations'){
    const locations=locale(lang).locations.map((location:any)=>({'@type':'Restaurant','@id':origin+url('en','locations')+'#'+location.id,name:'Frydom Express — '+location.name,url:canonical+'#'+location.id,image:origin+(location.detailImage||location.image).src,address:{'@type':'PostalAddress',...location.address},parentOrganization:{'@id':organization['@id']}}));
    graph.push(...locations);graph.push({'@type':'ItemList','@id':canonical+'#locations',itemListElement:locations.map((location:any,i:number)=>({'@type':'ListItem',position:i+1,item:{'@id':location['@id']}}))});page.mainEntity={'@id':canonical+'#locations'};
  }
  return {'@context':'https://schema.org','@graph':graph};
}
