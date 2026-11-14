// core/prices.js — La Foire du Tool V90
function isPrice(v){return v!==undefined&&v!==null&&v!==''&&Number.isFinite(Number(v))&&Number(v)>=0}

// Métadonnées séparées : les sauvegardes de prix existantes restent compatibles.
const PriceDates=(()=>{
 const KEY='la-foire-du-tool-price-dates-v1',DAY=86400000,dates=Object.create(null);
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))for(const [key,record] of Object.entries(saved))if(record&&isPrice(record.value)&&Number.isFinite(record.at)&&record.at>0)dates[key]={value:Number(record.value),at:record.at}}catch{}
 function record(key,value,now=Date.now()){
  if(!key)return;
  if(isPrice(value))dates[key]={value:Number(value),at:now};else delete dates[key];
  try{localStorage.setItem(KEY,JSON.stringify(dates))}catch{}
 }
 function describe(key,value,now=Date.now()){
  if(!isPrice(value))return null;
  const saved=dates[key];
  if(!saved||saved.value!==Number(value)||saved.at>now)return {text:'Date du prix inconnue · à vérifier',old:true,at:null};
  const days=Math.floor((now-saved.at)/DAY);
  return {text:days===0?'Prix daté d’aujourd’hui':'Prix daté de '+days+' jour'+(days>1?'s':''),old:days>=7,at:saved.at};
 }
 return {record,describe};
})();

// Les champs déclarent une clé stable : jamais un numéro de ligne ou de rendu.
// Seule une saisie utilisateur date le prix ; ouvrir un onglet ne le rafraîchit pas.
(()=>{
 if(typeof document==='undefined'||typeof MutationObserver!=='function'||!document.body)return;
 const selector='input[data-price-key]',svg='<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.3"/><path d="M10 5.5V10l3 2"/></svg>';
 const tooltip=document.createElement('div');tooltip.id='priceAgeTooltip';tooltip.className='price-age-tooltip';tooltip.setAttribute('role','tooltip');tooltip.hidden=true;document.body.append(tooltip);
 let active=null;
 function key(input){const k=input.dataset.priceKey;return k.startsWith('scroll:')?'scroll:'+document.querySelector('#scrollStat').value+':'+k.slice(7):k}
 function details(input){return PriceDates.describe(key(input),input.value)}
 function refresh(input){
  const wrap=input.parentElement;if(!wrap?.classList.contains('price-age-wrap'))return;
  const button=wrap.querySelector('.price-age'),info=details(input);
  button.hidden=!info;wrap.classList.toggle('has-price-age',!!info);
  if(info){button.setAttribute('aria-label',info.text);button.classList.toggle('price-age-old',info.old)}
  if(active===button){if(info)show(button);else hide()}
 }
 function decorate(input){
  if(!input.parentElement.classList.contains('price-age-wrap')){
   const wrap=document.createElement('span');wrap.className='price-age-wrap';
   input.before(wrap);wrap.append(input);
   const button=document.createElement('button');button.type='button';button.className='price-age';button.innerHTML=svg;button.hidden=true;wrap.append(button);
  }
  refresh(input);
 }
 function scan(root=document){if(root.matches?.(selector))decorate(root);root.querySelectorAll?.(selector).forEach(decorate)}
 function hide(){if(active)active.removeAttribute('aria-describedby');active=null;tooltip.hidden=true}
 function show(button){
  const input=button.parentElement.querySelector(selector),info=details(input);if(!info){hide();return}
  if(active&&active!==button)active.removeAttribute('aria-describedby');active=button;
  button.setAttribute('aria-label',info.text);button.classList.toggle('price-age-old',info.old);button.setAttribute('aria-describedby',tooltip.id);
  tooltip.textContent=info.text+(info.at?'\nDernière saisie : '+new Date(info.at).toLocaleString('fr-FR',{dateStyle:'short',timeStyle:'short'}):'');tooltip.hidden=false;
  const rect=button.getBoundingClientRect(),box=tooltip.getBoundingClientRect();
  tooltip.style.left=Math.max(8,Math.min(rect.left,window.innerWidth-box.width-8))+'px';
  tooltip.style.top=(rect.top>=box.height+12?rect.top-box.height-8:rect.bottom+8)+'px';
 }
 function onPrice(event){const input=event.target;if(!input.matches?.(selector)||input.validity?.badInput||input.value!==''&&!isPrice(input.value))return;PriceDates.record(key(input),input.value);document.querySelectorAll(selector).forEach(refresh)}
 document.addEventListener('input',onPrice,true);document.addEventListener('change',onPrice,true);
 document.addEventListener('change',event=>{if(event.target.id==='scrollStat')scan()});
 document.addEventListener('click',event=>{const button=event.target.closest?.('.price-age');if(button){event.preventDefault();show(button)}else{hide();scan()}});
 document.addEventListener('mouseover',event=>{const button=event.target.closest?.('.price-age');if(button)show(button)});
 document.addEventListener('mouseout',event=>{if(event.target.closest?.('.price-age')&&!event.relatedTarget?.closest?.('.price-age'))hide()});
 document.addEventListener('focusin',event=>{const button=event.target.closest?.('.price-age');if(button)show(button)});
 document.addEventListener('focusout',event=>{if(event.target.closest?.('.price-age'))hide()});
 document.addEventListener('keydown',event=>{if(event.key==='Escape')hide()});
 window.addEventListener('scroll',hide,true);window.addEventListener('resize',hide);window.addEventListener('pageshow',()=>scan());
 new MutationObserver(records=>{for(const r of records)for(const node of r.addedNodes)if(node.nodeType===1)scan(node);if(active&&!active.isConnected)hide()}).observe(document.body,{childList:true,subtree:true});
 scan();
})();
