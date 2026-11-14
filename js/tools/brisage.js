// tools/brisage.js — La Foire du Tool V90
// Brisage : les quantités et les prix sont mémorisés par équipement et par rune.
const BREAK_KEY='dofus-craft-breaking-v1';
let breaking={};try{breaking=JSON.parse(localStorage.getItem(BREAK_KEY)||'{}')||{}}catch{}
const breakSave=()=>localStorage.setItem(BREAK_KEY,JSON.stringify(breaking));
// Correspondances explicites : une ligne par statistique, jusqu'à trois puissances.
const BREAK_RUNES=[
 [/^(?:vitalit|vitality)/i,['Vi','Pa Vi','Ra Vi']],
 [/^(?:sagesse|wisdom)/i,['Sa','Pa Sa','Ra Sa']],
 [/^(?:force|strength)/i,['Fo','Pa Fo','Ra Fo']],
 [/^(?:intelligence)/i,['Ine','Pa Ine','Ra Ine']],
 [/^(?:chance)/i,['Cha','Pa Cha','Ra Cha']],
 [/^(?:agilit|agility)/i,['Age','Pa Age','Ra Age']],
 [/^(?:puissance pieges?|trap power)/i,['Per Pi','Pa Per Pi','Ra Per Pi']],
 [/^(?:puissance|power)/i,['Pui','Pa Pui','Ra Pui']],
 [/^(?:pa$|points? d.action|action points?|ap$)/i,['Ga Pa']],
 [/^(?:pm$|points? de mouvement|movement points?|mp$)/i,['Ga Pme']],
 [/^(?:portee|range)/i,['Po']],
 [/^(?:coups? critiques?|critical hits?)/i,['Cri']],
 [/^(?:initiative)/i,['Ini','Pa Ini','Ra Ini']],
 [/^(?:prospection|prospecting)/i,['Prospe','Pa Prospe']],
 [/^(?:invocations?|summons?)/i,['Invo']],
 [/^(?:soins?|heals?)/i,['So','Pa So']],
 [/^(?:tacle|lock)/i,['Tac','Pa Tac']],
 [/^(?:fuite|dodge)/i,['Fui','Pa Fui']],
 [/^(?:retrait pa|ap reduction)/i,['Ret Pa','Pa Ret Pa']],
 [/^(?:retrait pm|mp reduction)/i,['Ret Pme','Pa Ret Pme']],
 [/^(?:esquive pa|ap dodge)/i,['Ré Pa','Pa Ré Pa']],
 [/^(?:esquive pm|mp dodge)/i,['Ré Pme','Pa Ré Pme']],
 [/^(?:pods?)/i,['Pod','Pa Pod','Ra Pod']],
 [/^(?:dommages? pieges?|trap damage)/i,['Do Pi','Pa Do Pi']],
 [/^(?:dommages? renvoyes?|reflected damage)/i,['Do Ren','Pa Do Ren']],
 [/^(?:dommages? critiques?|critical damage)/i,['Do Cri','Pa Do Cri']],
 [/^(?:dommages? poussee|pushback damage)/i,['Do Pou','Pa Do Pou','Ra Do Pou']],
 [/^(?:dommages? neutre|neutral damage)/i,['Do Neutre','Pa Do Neutre']],
 [/^(?:dommages? terre|earth damage)/i,['Do Terre','Pa Do Terre']],
 [/^(?:dommages? feu|fire damage)/i,['Do Feu','Pa Do Feu']],
 [/^(?:dommages? eau|water damage)/i,['Do Eau','Pa Do Eau']],
 [/^(?:dommages? air|air damage)/i,['Do Air','Pa Do Air']],
 [/^(?:dommages?|damage)/i,['Do']],
 [/^(?:resistances? critiques?|critical resistance)/i,['Ré Cri','Pa Ré Cri','Ra Ré Cri']],
 [/^(?:resistances? poussee|pushback resistance)/i,['Ré Pou','Pa Ré Pou','Ra Ré Pou']],
 [/^(?:resistances? neutre|neutral resistance)/i,['Ré Neutre','Pa Ré Neutre','Ra Ré Neutre']],
 [/^(?:resistances? terre|earth resistance)/i,['Ré Terre','Pa Ré Terre','Ra Ré Terre']],
 [/^(?:resistances? feu|fire resistance)/i,['Ré Feu','Pa Ré Feu','Ra Ré Feu']],
 [/^(?:resistances? eau|water resistance)/i,['Ré Eau','Pa Ré Eau','Ra Ré Eau']],
 [/^(?:resistances? air|air resistance)/i,['Ré Air','Pa Ré Air','Ra Ré Air']]
];
const BREAK_PERCENT_DAMAGE=[
 [/sorts?|spells?/i,'Do Per So'],[/armes?|weapons?/i,'Do Per Ar'],
 [/distance|ranged/i,'Do Per Di'],[/melee|close combat/i,'Do Per Mé']
];
const BREAK_PERCENT_RESIST=[
 [/neutre|neutral/i,'Ré Per Neutre'],[/terre|earth/i,'Ré Per Terre'],
 [/feu|fire/i,'Ré Per Feu'],[/eau|water/i,'Ré Per Eau'],[/air/i,'Ré Per Air'],
 [/distance|ranged/i,'Ré Per Di'],[/melee|close combat/i,'Ré Per Mé']
];
function breakText(v){
 if(typeof v==='string')return v;
 if(v&&typeof v==='object')return v.fr||v.name||v.name_id||v.en||'';
 return '';
}
function breakEffects(d){
 const sources=[d.effects,d.possible_effects,d.characteristics,d.stats,d.item_fields?.effects,d.item_fields?.possible_effects];
 const raw=sources.flatMap(v=>Array.isArray(v)?v:[]);
 return raw.flatMap(e=>{
  if(typeof e==='string')return [e];
  const candidates=[e.type?.name,e.type?.name_id,e.effect?.name,e.effect?.name_id,e.name,e.description,e.formatted,e.effect_type?.name,e.effect_type?.name_id];
  return candidates.map(breakText).filter(Boolean);
 });
}
function breakNormalize(v){
 return String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().replace(/^[+-]?\d+(?:[.,]\d+)?\s*(?:a|à|-)\s*\d+\s*/i,'').replace(/^[+-]?\d+(?:[.,]\d+)?\s*/,'').replace(/^% ?/,'');
}
function breakRuneGroups(d){
 const groups=new Map();
 for(const raw of breakEffects(d)){
  const effect=breakNormalize(raw);
  const percent=/%|pourcent|percent/i.test(raw);
  if(percent){
   const patterns=/resistan/i.test(effect)?BREAK_PERCENT_RESIST:/dommage|damage/i.test(effect)?BREAK_PERCENT_DAMAGE:null;
   if(patterns){
    const match=patterns.find(([re])=>re.test(effect));
    if(match)groups.set(match[1],[match[1]]);
   }
   continue;
  }
  for(const [re,names] of BREAK_RUNES)if(re.test(effect)){
   groups.set(names[0],names);
   break;
  }
 }
 return [...groups.values()];
}
function breakRuneNames(d){return breakRuneGroups(d).flat()}
function breakMath(cost,quantity,rows){
 const revenue=rows.reduce((n,r)=>n+Number(r.qty||0)*Number(r.price||0),0);
 const expense=Number(cost||0)*Number(quantity||1),profit=revenue-expense;
 return {revenue,expense,profit,percent:expense>0?profit/expense*100:null};
}
let breakRequest=0,breakTimer,breakSelected=null;
$('#breakSearch').addEventListener('input',()=>{
 clearTimeout(breakTimer);const q=$('#breakSearch').value.trim(),seq=++breakRequest;
 if(q.length<2){$('#breakStatus').textContent='';$('#breakResults').innerHTML='';return}
 breakTimer=setTimeout(async()=>{
  $('#breakStatus').textContent='Recherche…';
  try{
   const data=await get('/items/equipment/search?'+new URLSearchParams({query:q,limit:'40'}));
   if(seq!==breakRequest)return;
   const rows=Array.isArray(data)?data:data.items||data.results||[];
   $('#breakStatus').textContent=rows.length?'':'Aucun équipement trouvé';
   $('#breakResults').innerHTML=rows.map((x,i)=>`<div class="break-item" data-break="${i}">${img(x)?`<img src="${esc(img(x))}" alt="">`:''}<span>${esc(x.name)}</span></div>`).join('');
   $('#breakResults').querySelectorAll('[data-break]').forEach(el=>el.onclick=()=>breakOpen(rows[Number(el.dataset.break)]));
  }catch(e){if(seq===breakRequest)$('#breakStatus').textContent='Erreur de recherche : '+e.message}
 },300);
});
async function breakOpen(item){
 $('#breakDetail').innerHTML='Chargement des caractéristiques…';
 let detail=null;
 try{detail=await get('/items/equipment/'+item.ankama_id)}
 catch(e){$('#breakDetail').textContent='Impossible de charger les caractéristiques : '+e.message;return}
 const id=String(detail.ankama_id||item.ankama_id);
 const groups=breakRuneGroups(detail).map(group=>[group[0]]),names=groups.flat(),old=breaking[id]||{};
 breakSelected={id,detail,name:detail.name||item.name,groups,runes:names.map(name=>({name,qty:old.runes?.[name]?.qty??'',price:old.runes?.[name]?.price??''})),cost:old.cost??'',quantity:old.quantity??1};
 breakDraw();
}
// Recherche des icônes parmi les ressources de DofusDude, sans bloquer le calcul.
const breakIconCache=new Map();
async function breakRuneIcon(name){
 if(!breakIconCache.has(name))breakIconCache.set(name,(async()=>{
  try{
   const data=await get('/items/resources/search?'+new URLSearchParams({query:'Rune '+name,limit:'30'}));
   const rows=Array.isArray(data)?data:data.items||data.results||[];
   const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
   const expected=normalize('Rune '+name);
   const match=rows.find(x=>normalize(x.name)===expected)||rows.find(x=>normalize(x.name)===normalize(name));
   return match?img(match):'';
  }catch{return ''}
 })());
 return breakIconCache.get(name);
}
function breakLoadRuneIcons(b){
 b.runes.forEach(async(r,i)=>{
  const src=await breakRuneIcon(r.name);
  if(!src||breakSelected!==b)return;
  const el=$(`[data-rune-icon="${i}"]`);
  if(el){el.src=src;el.hidden=false;el.onerror=()=>{el.hidden=true}}
 });
}
function breakDraw(){
 const b=breakSelected;if(!b)return;
 $('#breakDetail').innerHTML=`<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">${img(b.detail)?`<img src="${esc(img(b.detail))}" width="50" height="50" alt="">`:''}<strong style="font-size:20px">${itemNameHTML(b.name)}</strong></div>
 <div class="break-cost"><label>Prix d'achat unitaire de l'équipement (K)<input id="breakCost" data-price-key="break:${esc(b.id)}:cost" type="number" min="0" step="1" value="${esc(b.cost)}" placeholder="Prix HDV"></label><label>Nombre d'équipements brisés<input id="breakQty" type="number" min="1" step="1" value="${esc(b.quantity)}"></label></div>
 ${b.runes.length?`<table class="break-grid break-compact"><thead><tr><th>Rune mineure</th><th>Obtenues</th><th>Prix unitaire (K)</th><th>Total</th></tr></thead><tbody>${b.runes.map((r,i)=>`<tr><td><span class="break-rune-label"><img class="break-rune-icon" data-rune-icon="${i}" alt="" hidden>${itemNameHTML(r.name,'Rune '+r.name)}</span></td><td><input aria-label="Quantité ${esc(r.name)}" data-bqty="${i}" type="number" min="0" step="1" value="${esc(r.qty)}" placeholder="Qté"></td><td><input aria-label="Prix ${esc(r.name)}" data-bprice="${i}" data-price-key="break:${esc(b.id)}:rune:${esc(r.name)}" type="number" min="0" step="1" value="${esc(r.price)}" placeholder="Prix K"></td><td class="break-total" data-btotal="${i}">—</td></tr>`).join('')}</tbody></table>`:'<p class="break-note">Aucune caractéristique compatible reconnue pour cet équipement.</p>'}

 <div class="break-summary"><div><small>Valeur des runes</small><strong id="breakRevenue">—</strong></div><div><small>Gain / perte</small><strong id="breakProfit">—</strong></div><div><small>Rentabilité</small><strong id="breakPercent">—</strong></div></div><p class="break-note">Les quantités obtenues sont à renseigner après brisage. Le calcul n'inclut pas les taxes HDV.</p>`;
 const update=()=>{
  b.cost=$('#breakCost').value;b.quantity=$('#breakQty').value;
  b.runes.forEach((r,i)=>{r.qty=$(`[data-bqty="${i}"]`).value;r.price=$(`[data-bprice="${i}"]`).value});
  breaking[b.id]={cost:b.cost,quantity:b.quantity,runes:Object.fromEntries(b.runes.map(r=>[r.name,{qty:r.qty,price:r.price}]))};breakSave();
  const valid=b.cost!==''&&Number(b.quantity)>0&&b.runes.some(r=>r.qty!==''&&Number(r.qty)>0)&&b.runes.every(r=>r.qty===''||Number(r.qty)===0||r.price!=='');
  b.runes.forEach((r,i)=>{$(`[data-btotal="${i}"]`).textContent=r.qty!==''&&r.price!==''?fmt(Number(r.qty)*Number(r.price)):'—'});
  if(!valid){$('#breakRevenue').textContent='—';$('#breakProfit').textContent='—';$('#breakPercent').textContent='—';return}
  const v=breakMath(b.cost,b.quantity,b.runes);
  $('#breakRevenue').textContent=fmt(v.revenue);$('#breakProfit').textContent=(v.profit>0?'+':'')+fmt(v.profit);
  $('#breakProfit').style.color=v.profit>0?'#5dff91':v.profit<0?'#ff7777':'';
  $('#breakPercent').textContent=v.percent===null?'—':(v.percent>0?'+':'')+v.percent.toLocaleString('fr-FR',{maximumFractionDigits:1})+' %';
  $('#breakPercent').style.color=v.profit>0?'#5dff91':v.profit<0?'#ff7777':'';
 };
 $('#breakDetail').querySelectorAll('input').forEach(x=>x.addEventListener('input',update));update();breakLoadRuneIcons(b);
}

