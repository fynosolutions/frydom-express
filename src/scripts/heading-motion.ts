const preference=matchMedia('(prefers-reduced-motion: reduce)');
const active=new Set<Animation>();
const heroFood=document.querySelector<HTMLImageElement>('.poster-stage .hero-food');
let heroFoodAnimation:Animation|undefined;
const canAnimate=()=>!preference.matches&&typeof window.IntersectionObserver==='function'&&Boolean(Element.prototype.animate);
if(heroFood&&canAnimate())heroFood.dataset.heroFoodMotion='waiting';
const selector='main h1,main h2,.poster-wordmark,.page-home main :is(h3,p,.poster-caption,.poster-location>span,.food-sticker,.poster-explore,.gallery-eyebrow,.taste-cheer,.taste-caption),.site-footer :is(h2,h3,p)';
const candidates=Array.from(document.querySelectorAll<HTMLElement>(selector));
const targets=candidates.filter(element=>!candidates.some(parent=>parent!==element&&parent.contains(element)));
const observers:IntersectionObserver[]=[];
for(const target of targets)target.dataset.popHeading='';

// The reference uses back.out(2.35), not a manually timed overshoot keyframe.
function backOut(t:number){const u=t-1;return 1+3.35*u*u*u+2.35*u*u;}
function sampleFrames(value:(t:number)=>Keyframe){return Array.from({length:73},(_,i)=>({...value(i/72),offset:i/72}));}
function settleHeroFood(){
 if(!heroFood)return;
 heroFood.dataset.heroFoodMotion='revealed';
 heroFoodAnimation?.cancel();heroFoodAnimation=undefined;
}
function revealHeroFood(wordmarkEnd?:number){
 if(!heroFood||heroFood.dataset.heroFoodMotion!=='waiting')return;
 if(!canAnimate()){settleHeroFood();return;}
 // A slow image should still enter after the lettering, once its pixels exist.
 if(!heroFood.complete){
  heroFood.addEventListener('load',()=>revealHeroFood(),{once:true});
  heroFood.addEventListener('error',settleHeroFood,{once:true});
  return;
 }
 if(!heroFood.naturalWidth){settleHeroFood();return;}
 heroFood.dataset.heroFoodMotion='entering';
 try{
  // One smooth progress curve keeps growth and visibility in step.
  // Zero endpoint slopes avoid a flash at entry or a snap to the static image.
  const animation=heroFood.animate(sampleFrames(t=>{
   const progress=t*t*(3-2*t);
   return {scale:String(.12+.88*progress),opacity:progress};
  }),
   {duration:1000,easing:'linear',fill:'backwards'});
  // Share the lettering's exact endpoint; do not insert a new frame or delay.
  if(wordmarkEnd!==undefined)animation.startTime=wordmarkEnd;
  heroFoodAnimation=animation;
  animation.finished.then(()=>{
   if(heroFoodAnimation===animation){heroFood.dataset.heroFoodMotion='revealed';heroFoodAnimation=undefined;}
  },()=>{});
 }catch{settleHeroFood();}
}
function split(target:HTMLElement,lines:boolean){
 const walker=document.createTreeWalker(target,NodeFilter.SHOW_TEXT),nodes:Text[]=[];
 while(walker.nextNode()){const node=walker.currentNode as Text;if(!node.parentElement?.closest('svg'))nodes.push(node);}
 const words:HTMLElement[]=[];
 for(const node of nodes){
  const fragment=document.createDocumentFragment();
  for(const token of node.data.match(/\s+|[\p{Script=Han}]|[^\s\p{Script=Han}]+/gu)||[]){
   if(/^\s+$/.test(token)){fragment.append(token);continue;}
   const word=document.createElement('span');word.textContent=token;word.className='heading-pop-word';
   word.style.cssText='display:inline-block;max-width:100%;transform-origin:50% 90%';
   if(lines){
    const mask=document.createElement('span');mask.className='text-line-mask';
    mask.style.cssText='display:inline-block;vertical-align:bottom;overflow:clip;max-width:100%';
    mask.append(word);fragment.append(mask);
   }else fragment.append(word);
   words.push(word);
  }
  node.replaceWith(fragment);
 }
 return words;
}
function reveal(target:HTMLElement,lines:boolean){
 target.dataset.motion='entering';target.dataset.textEffect=lines?'lines':'pop';
 const lineFrames=lines?sampleFrames(t=>({transform:`translateY(${100*Math.pow(1-t,5)}%)`})):undefined;
 if(target.matches('.taste-caption') && lineFrames){
  const animation=target.firstElementChild!.animate(lineFrames,{duration:1400,delay:250,fill:'backwards'});
  active.add(animation);
  animation.finished.catch(()=>{}).finally(()=>{active.delete(animation);target.dataset.motion='revealed';});
  return;
 }
 const words=split(target,lines);
 const tops:number[]=[];
 const lineIndices=words.map(word=>{
  const top=word.getBoundingClientRect().top;
  let index=tops.findIndex(y=>Math.abs(y-top)<4);
  if(index<0){index=tops.length;tops.push(top);}return index;
 });
 const wordAnimations:Animation[]=[];
 const promises=words.map((word,index)=>{
  const y=18+Math.random()*22,rotation=-16+Math.random()*32;
  const frames=lineFrames??
   sampleFrames(t=>{const progress=backOut(t);return {opacity:Math.min(1,Math.max(0,progress)),transform:`translateY(${y*(1-progress)}px) rotate(${rotation*(1-progress)}deg) scale(${progress})`};});
  const heroDelay=target.matches('.food-sticker')?150:target.matches('.poster-caption')?300:0;
  const animation=word.animate(frames,{duration:lines?1400:720,delay:lines?250+lineIndices[index]*150:heroDelay+index*55,fill:'backwards',easing:'linear'});
  wordAnimations.push(animation);
  active.add(animation);return animation.finished.catch(()=>{}).finally(()=>active.delete(animation));
 });
 Promise.all(promises).then(()=>{
  target.dataset.motion='revealed';
  // Restore the original inline flow so resizing never leaves stale line masks.
  for(const word of words){const mask=word.parentElement;if(mask?.classList.contains('text-line-mask'))mask.replaceWith(...word.childNodes);else word.replaceWith(...word.childNodes);}
  if(target.matches('.poster-wordmark')){
   const end=Math.max(...wordAnimations.map(animation=>Number(animation.startTime)+Number(animation.effect!.getComputedTiming().endTime)));
   revealHeroFood(Number.isFinite(end)?end:undefined);
  }
 });
}
function initialize(){
 const root=document.documentElement;
 if(root.hasAttribute('data-intro-active')&&!document.querySelector('#home-intro.is-leaving'))return;
 for(const observer of observers)observer.disconnect();observers.length=0;
 for(const animation of active)animation.cancel();active.clear();
 if(!canAnimate()){settleHeroFood();return;}
 root.setAttribute('data-hero-motion-started','');
 for(const lines of [false,true]){
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries)if(entry.isIntersecting){observer.unobserve(entry.target);reveal(entry.target as HTMLElement,lines);}
  },{threshold:0,rootMargin:lines?'0px 0px -5% 0px':'0px 0px -12% 0px'});
  observers.push(observer);
  for(const target of targets){
   const isBody=target.matches('p,.taste-caption')&&!target.matches('.food-sticker,.poster-caption,.gallery-note');
   if(isBody!==lines||target.dataset.motion==='revealed'||target.dataset.motion==='entering')continue;
   target.dataset.motion='pending';
   const bounds=target.getBoundingClientRect();
   if(target.closest('.poster-stage')&&bounds.bottom>0&&bounds.top<innerHeight*.88)reveal(target,lines);
   else observer.observe(target);
  }
 }
}
initialize();
// Start with the intro fade, without waiting for every page font to download.
if(document.documentElement.hasAttribute('data-intro-active')&&!document.documentElement.hasAttribute('data-hero-motion-started')){
 const introObserver=new MutationObserver(()=>{
  if(!document.documentElement.hasAttribute('data-intro-active')||document.querySelector('#home-intro.is-leaving')){introObserver.disconnect();initialize();}
 });
 introObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-intro-active']});
 const intro=document.querySelector('#home-intro');
 if(intro)introObserver.observe(intro,{attributes:true,attributeFilter:['class']});
}
preference.addEventListener('change',initialize);
window.addEventListener('resize',()=>{for(const animation of active)animation.cancel();settleHeroFood();});
window.addEventListener('pagehide',settleHeroFood);
