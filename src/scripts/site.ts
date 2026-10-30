const productionHost = ['frydomexpress.com','www.frydomexpress.com'].includes(location.hostname) && location.protocol === 'https:';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

// Animate only after a text block enters the viewport. Never hide pending text:
// blocked scripts, unsupported APIs and interrupted animations remain readable.
let textObserver: IntersectionObserver | undefined;
const textAnimations = new Set<Animation>();
function stopMotion() {
  textObserver?.disconnect();
  for (const animation of textAnimations) animation.cancel();
  textAnimations.clear();
  document.documentElement.classList.remove('motion-ready');
}
function initializeMotion() {
  if (reducedMotion.matches) return;
  document.documentElement.classList.add('motion-ready');
  if (typeof window.IntersectionObserver !== 'function' || typeof Element.prototype.animate !== 'function') return;
  const compact = innerWidth <= 700;
  textObserver = new IntersectionObserver(entries => {
    let stagger = 0;
    for (const entry of entries) if (entry.isIntersecting && !reducedMotion.matches) {
      const target = entry.target as HTMLElement;
      textObserver?.unobserve(target);
      target.dataset.motion = 'entering';
      try {
        const animation = target.animate([
          {opacity:.25,transform:`translateY(${compact ? 18 : 28}px)`},
          {opacity:1,transform:'translateY(0)'}
        ],{duration:compact ? 560 : 680,delay:Math.min(stagger++,3)*65,fill:'backwards',easing:'cubic-bezier(.2,.7,.3,1)'});
        textAnimations.add(animation);
        const complete = () => {textAnimations.delete(animation);target.dataset.motion = 'revealed';};
        animation.finished.then(complete,complete);
      } catch {target.dataset.motion = 'revealed';}
    }
  },{threshold:.08,rootMargin:'0px 0px -5% 0px'});
  const selector = '.item-body,h1,h2,h3,h4,p,li,dl,.eyebrow,.offer-art,.item-photo,.editorial-photo,.location-detail-photo,.support-detail-image';
  document.querySelectorAll<HTMLElement>(`main :is(${selector})`).forEach(target => {
    if (target.dataset.motion === 'revealed' || target.closest('form,nav,aside,[aria-hidden="true"],.hero-copy') || target.parentElement?.closest(selector)) return;
    target.dataset.motion = 'pending';
    textObserver!.observe(target);
  });
}
try { initializeMotion(); } catch { stopMotion(); }
reducedMotion.addEventListener('change', () => {
  stopMotion();
  try { initializeMotion(); } catch { stopMotion(); }
});

const header = document.querySelector<HTMLElement>('#site-header');
if(header){
  const updateHeaderHeight=()=>{
    document.documentElement.style.setProperty('--site-header-height',`${header.getBoundingClientRect().height}px`);
    document.documentElement.style.setProperty('--site-header-bottom',`${header.getBoundingClientRect().bottom}px`);
    document.documentElement.classList.add('header-measured');
  };
  updateHeaderHeight();
  if('ResizeObserver'in window)new ResizeObserver(updateHeaderHeight).observe(header);
  else addEventListener('resize',updateHeaderHeight);
}
const heroFood=document.querySelector<HTMLImageElement>('.hero-food');
let scrollQueued=false;
addEventListener('scroll',()=>{
  if(scrollQueued)return;scrollQueued=true;
  requestAnimationFrame(()=>{
    header?.classList.toggle('is-scrolled',scrollY>20);
    if(header)document.documentElement.style.setProperty('--site-header-bottom',`${header.getBoundingClientRect().bottom}px`);
    if(heroFood&&!reducedMotion.matches)heroFood.style.transform='none';
    scrollQueued=false;
  });
},{passive:true});
const mobile = document.querySelector<HTMLDetailsElement>('#mobile-navigation');
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&mobile?.open){mobile.open=false;mobile.querySelector('summary')?.focus();}});
document.addEventListener('click',event=>{if(mobile?.open&&!mobile.contains(event.target as Node))mobile.open=false;});
mobile?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{mobile.open=false;}));
const more = document.querySelector<HTMLDetailsElement>('.more-navigation');
document.addEventListener('click',event=>{if(more?.open&&!more.contains(event.target as Node))more.open=false;});
document.addEventListener('keydown',event=>{
  if(event.key==='Tab'&&mobile?.open){
    const items=[...mobile.querySelectorAll<HTMLElement>('summary,a[href]')];
    const first=items[0],last=items[items.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
});
mobile?.addEventListener('toggle',()=>{
  const open=mobile.open&&innerWidth<=950;
  document.documentElement.classList.toggle('nav-open',open);
  document.querySelectorAll<HTMLElement>('main,.site-footer,.mobile-customer-actions').forEach(el=>el.inert=open);
});
addEventListener('resize',()=>{if(innerWidth>950&&mobile?.open)mobile.open=false;});

const ribbon = document.querySelector<HTMLElement>('[data-ribbon]');
const pauseButton = ribbon?.querySelector<HTMLButtonElement>('.ribbon-pause');
pauseButton?.addEventListener('click',()=>{
  const paused=ribbon!.classList.toggle('is-paused');
  pauseButton.setAttribute('aria-pressed',String(paused));
  pauseButton.setAttribute('aria-label',(paused?pauseButton.dataset.playLabel:pauseButton.dataset.pauseLabel)||'');
  pauseButton.firstElementChild!.textContent=paused?'▶':'Ⅱ';
});
if(ribbon&&typeof window.IntersectionObserver==='function'){new IntersectionObserver(([entry])=>ribbon.classList.toggle('is-offscreen',!entry.isIntersecting)).observe(ribbon);}

const gallery=document.querySelector<HTMLElement>('#favorites-gallery');
if(gallery){
  const controls=document.querySelector<HTMLElement>('.favorite-controls')!;
  controls.hidden=false;
  const previous=controls.querySelector<HTMLButtonElement>('[data-favorites-prev]')!;
  const next=controls.querySelector<HTMLButtonElement>('[data-favorites-next]')!;
  const sync=()=>{previous.disabled=gallery.scrollLeft<2;next.disabled=gallery.scrollLeft+gallery.clientWidth>=gallery.scrollWidth-2;};
  previous.addEventListener('click',()=>gallery.scrollBy({left:-gallery.clientWidth*.85,behavior:reducedMotion.matches?'instant':'smooth'}));
  next.addEventListener('click',()=>gallery.scrollBy({left:gallery.clientWidth*.85,behavior:reducedMotion.matches?'instant':'smooth'}));
  gallery.addEventListener('scroll',sync,{passive:true});addEventListener('resize',sync);sync();
}

const categoryLinks = [...document.querySelectorAll<HTMLAnchorElement>('.category-nav a')];
if(categoryLinks.length && typeof window.IntersectionObserver==='function'){
  const visible = new Set<string>();
  const sections=categoryLinks.map(a=>document.querySelector<HTMLElement>(a.hash)).filter(Boolean) as HTMLElement[];
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){if(entry.isIntersecting)visible.add(entry.target.id);else visible.delete(entry.target.id);}
    const current=sections.find(section=>visible.has(section.id));
    categoryLinks.forEach(a=>{if(a.hash==='#'+current?.id)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});
  },{rootMargin:'-155px 0px -50% 0px'});
  sections.forEach(section=>observer.observe(section));
}

type Attribution = { source:string; utm_source:string; utm_medium:string; utm_campaign:string; referrer:string };
function classifySource(referrer:string) {
  let host='';try{host=new URL(referrer).hostname.toLowerCase();}catch{return'Other';}
  const domain=(suffix:string)=>host===suffix||host.endsWith('.'+suffix);
  if(domain('facebook.com'))return'Facebook';if(domain('instagram.com'))return'Instagram';
  if(domain('gemini.google.com'))return'Google Gemini';
  if(domain('chat.openai.com')||domain('chatgpt.com'))return'ChatGPT';
  if(domain('claude.ai'))return'Claude';if(domain('deepseek.com'))return'Deepseek';
  if(domain('bing.com'))return'Bing';if(/(^|\.)google\.[a-z.]+$/.test(host))return'Google';
  return'Other';
}
function attribution():Attribution {
  const params=new URLSearchParams(location.search);
  const initial:Attribution={source:classifySource(document.referrer),utm_source:params.get('utm_source')||'',utm_medium:params.get('utm_medium')||'',utm_campaign:params.get('utm_campaign')||'',referrer:document.referrer||''};
  const keys={source:'initial_source',utm_source:'initial_utm_source',utm_medium:'initial_utm_medium',utm_campaign:'initial_utm_campaign',referrer:'initial_referrer'} as const;
  try{
    if(!sessionStorage.getItem('initial_source'))Object.entries(keys).forEach(([key,storageKey])=>sessionStorage.setItem(storageKey,initial[key as keyof Attribution]));
    return Object.fromEntries(Object.entries(keys).map(([key,storageKey])=>[key,sessionStorage.getItem(storageKey)||'']))as Attribution;
  }catch{return initial;}
}
// First visit attribution also survives navigation from the homepage to the form.
const initialAttribution=attribution();

function initializeForm(){
  const form=document.querySelector<HTMLFormElement>('#franchise-form');if(!form)return;
  const submit=form.querySelector<HTMLButtonElement>('#submit-inquiry')!;
  const message=form.querySelector<HTMLElement>('#form-status')!;
  const en=form.dataset.language==='en';
  const input=(name:string)=>form.elements.namedItem(name) as HTMLInputElement;
  const say=(english:string,chinese:string)=>en?english:chinese;
  let inFlight=false;
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(inFlight)return;
    message.textContent='';delete message.dataset.state;
    for(const name of ['name','phone','email']){input(name).removeAttribute('aria-invalid');form.querySelector<HTMLElement>('#'+name+'-error')!.textContent='';}
    const fail=(name:string,text:string)=>{input(name).setAttribute('aria-invalid','true');form.querySelector<HTMLElement>('#'+name+'-error')!.textContent=text;input(name).focus();};
    if(!input('name').value.trim()){fail('name',say('Please enter your full name.','请填写姓名。'));return;}
    if(!input('phone').value.trim()){fail('phone',say('Please enter your phone number, including country code.','请填写联系电话，包含国家或地区代码。'));return;}
    if(input('email').value.trim()&&!input('email').validity.valid){fail('email',say('Please enter a valid email address.','请输入有效的电子邮箱。'));return;}
    // Local previews cannot create real CRM leads. Browser tests intercept the same endpoint.
    const testMode=(window as any).__FRYDOM_FORM_TEST__===true&&!productionHost;
    if(!productionHost&&!testMode){message.dataset.state='error';message.textContent=say('Local preview: live submissions are disabled. Please email info@frydomexpress.com for an inquiry.','本地预览不会发送正式加盟线索。咨询请发送邮件至 info@frydomexpress.com。');return;}
    inFlight=true;submit.disabled=true;submit.querySelector('span')!.textContent=say('Sending…','提交中…');
    message.textContent=say('Sending your inquiry…','正在提交加盟意向…');
    const fields=['name','phone','wechat','note','email'].map(name=>({name,value:input(name).value.trim()}));
    fields.push({name:'traffic_source',value:initialAttribution.source},...['utm_source','utm_medium','utm_campaign'].map(name=>({name,value:initialAttribution[name as keyof Attribution]})),{name:'referrer_url',value:initialAttribution.referrer});
    try{
      const response=await fetch(form.dataset.endpoint!,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fields,context:{pageUri:location.href,pageName:document.title}}),signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw new Error('Submission failed');
      form.reset();message.dataset.state='success';message.textContent=say('Thank you! Your inquiry has been sent. Our team will be in touch.','提交成功，我们的团队会与你联系。');
      if(productionHost&&typeof(window as any).fbq==='function')(window as any).fbq('track','Lead',{source:initialAttribution.source});
    }catch{
      message.dataset.state='error';message.textContent=say('Your inquiry could not be sent. Your details have been kept. Please try again or email info@frydomexpress.com.','提交未成功，已保留你填写的内容。请重试，或发送邮件至 info@frydomexpress.com。');
    }finally{inFlight=false;submit.disabled=false;submit.querySelector('span')!.textContent=say('Send inquiry','提交加盟意向');}
  });
  // Enable only after the handler has bound; without JS there is no GET data leakage.
  submit.disabled=false;
}
initializeForm();

// Preserve the original pixel configuration only on the formal domain.
// No personal form fields ever enter analytics events.
if(productionHost&&!(window as any).fbq){
  const fbq:any=function(...args:any[]){fbq.callMethod?fbq.callMethod(...args):fbq.queue.push(args);};
  fbq.queue=[];fbq.loaded=true;fbq.version='2.0';(window as any).fbq=fbq;(window as any)._fbq=fbq;
  const pixel=document.createElement('script');pixel.async=true;pixel.src='https://connect.facebook.net/en_US/fbevents.js';document.head.append(pixel);
  fbq('init','4404293963139526');fbq('track','PageView');
}

// Native disclosures keep platform selection usable without JavaScript.
const orderPickers = [...document.querySelectorAll<HTMLDetailsElement>('[data-order-picker]')];
orderPickers.forEach(picker => picker.addEventListener('toggle', () => {
  if (picker.open) orderPickers.forEach(other => { if (other !== picker) other.open = false; });
}));
document.addEventListener('click', event => {
  orderPickers.forEach(picker => { if (!picker.contains(event.target as Node)) picker.open = false; });
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  orderPickers.forEach(picker => {
    if (picker.open) {
      if (picker.contains(document.activeElement)) picker.querySelector<HTMLElement>('summary')?.focus();
      picker.open = false;
    }
  });
});
