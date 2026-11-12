// tools/multicraft.js — La Foire du Tool V90
// Multicraft : état et rendu indépendants du calculateur unitaire.
const multi={cat:'all',items:[],timer:null,request:0,seq:0,strategy:'auto',inventory:{},overrides:{}};
try{multi.inventory=JSON.parse(localStorage.getItem('dofus-craft-multi-inventory-v1')||'{}')||{}}catch{}
const multiSaveInventory=()=>localStorage.setItem('dofus-craft-multi-inventory-v1',JSON.stringify(multi.inventory));
const MODE_INTROS={
 single:{title:'Calculateur de craft',description:'Recherche un objet, renseigne les prix de ses ingrédients et compare avec son prix en HDV.'},
 multi:{title:'Calculateur multicraft',description:'Ajoute plusieurs recettes, compare les coûts de craft et d’achat, puis prépare une liste d’achats cumulée en tenant compte de tes possessions.'},
 break:{title:'Calculateur de brisage',description:'Sélectionne un équipement, indique les runes obtenues et leurs prix pour calculer la rentabilité de son brisage.'},
 ledger:{title:'Historique d’achats',description:'Enregistre tes achats, suis les ventes partielles et retrouve les lots terminés ainsi que tes gains et pertes.'},
 fm:{title:'XP Forgemagie',description:'Compare les runes par poids / prix pour optimiser tes dépenses de forgemagie.'},
 farm:{title:'Comparaison de farm',description:'Crée tes activités, chronomètre tes sessions et compare leurs gains moyens en kamas par heure.'},
 drop:{title:'Calculateur de taux de drop',description:'Calcule ton multiplicateur de butin avec la prospection, le challenge, l’Almanax et Ankama Shield.'},
 scroll:{title:'Optimiseur de parchotage',description:'Choisis une caractéristique, renseigne ton niveau actuel et les prix des parchemins pour trouver la combinaison la moins chère jusqu’à 100.'}
};
function switchMode(mode){for(const name of ['single','multi','break','ledger','scroll','farm','fm','drop']){$('#'+name+'Mode').classList.toggle('mode-hidden',mode!==name)}for(const [name,id] of [['single','tabSingle'],['multi','tabMulti'],['break','tabBreak'],['ledger','tabLedger'],['scroll','tabScroll'],['farm','tabFarm'],['fm','tabFm'],['drop','tabDrop']])$('#'+id).classList.toggle('active',mode===name);$('#pageModeTitle').textContent=MODE_INTROS[mode].title;$('#pageModeDescription').textContent=MODE_INTROS[mode].description;}
$('#tabSingle').onclick=()=>switchMode('single');$('#tabMulti').onclick=()=>switchMode('multi');$('#tabLedger').onclick=()=>switchMode('ledger');$('#tabBreak').onclick=()=>switchMode('break');$('#tabScroll').onclick=()=>switchMode('scroll');$('#tabFarm').onclick=()=>switchMode('farm');$('#tabFm').onclick=()=>switchMode('fm');$('#tabDrop').onclick=()=>switchMode('drop');
async function multiSearch(){const q=$('#multiSearch').value.trim(),id=++multi.request;if(q.length<2){$('#multiStatus').textContent='';$('#multiResults').innerHTML='';return}$('#multiStatus').textContent='Recherche en cours…';$('#multiResults').innerHTML='';try{const ep=multi.cat==='all'?'/items/search':'/items/'+multi.cat+'/search';const data=await get(ep+'?'+new URLSearchParams({query:q,limit:'50'}));if(id!==multi.request)return;const rows=Array.isArray(data)?data:data.items||data.results||[];$('#multiStatus').textContent=rows.length+' résultat(s)';$('#multiResults').innerHTML=rows.map((x,i)=>`<button class="multi-pick" data-mpick="${i}">${img(x.item_fields||x)?`<img src="${esc(img(x.item_fields||x))}" alt="">`:''}<span>${esc(x.name)}</span><span style="flex:0;color:#b8eb72">＋</span></button>`).join('')||'<div class="multi-empty">Aucun résultat</div>';$('#multiResults').querySelectorAll('[data-mpick]').forEach(b=>b.onclick=()=>multiAdd({...rows[+b.dataset.mpick],_category:multi.cat==='all'?subtype(rows[+b.dataset.mpick].item_subtype||rows[+b.dataset.mpick].item_fields?.type?.name_id):multi.cat}));}catch(e){if(id===multi.request)$('#multiStatus').textContent='Recherche impossible : '+e.message}}
$('#multiSearch').addEventListener('input',()=>{clearTimeout(multi.timer);multi.timer=setTimeout(multiSearch,350)});document.querySelectorAll('[data-mcat]').forEach(b=>b.onclick=()=>{multi.cat=b.dataset.mcat;document.querySelectorAll('[data-mcat]').forEach(x=>x.classList.toggle('active',x===b));multiSearch()});
async function multiDetail(id,preferred){if(detailsCache.has(id))return detailsCache.get(id);for(const t of [preferred,...categories.filter(c=>c!==preferred)]){try{const d=await get('/items/'+t+'/'+id);if(d){detailsCache.set(id,d);return d}}catch{}}return null}
async function multiAdd(x){const id=x.ankama_id;if(multi.items.some(e=>e.id===id)){const entry=multi.items.find(e=>e.id===id);entry.qty++;multiRender();return}const entry={id,name:x.name,image:img(x.item_fields||x),qty:1,nodes:[],loading:true,error:'',detail:null};multi.items.push(entry);multiRender();try{const detail=await multiDetail(id,x._category||'equipment');if(!detail)throw Error('Fiche introuvable');entry.detail=detail;entry.noRecipe=false;entry.name=detail.name;entry.image=img(detail);if(!Array.isArray(detail.recipe)||!detail.recipe.length){entry.noRecipe=true;return;}entry.nodes=await Promise.all(detail.recipe.map(async r=>{const d=await multiDetail(r.item_ankama_id,subtype(r.item_subtype));return multiNode(r,d)}));await multiHydrateSaved(entry.nodes,new Set([entry.id]));}catch(e){entry.error=e.message}finally{entry.loading=false;multiRender()}}
// Précharge les sous-recettes dont les composants ont déjà un prix mémorisé.
// Le calcul est ainsi correct dès l'ajout de l'objet, sans clic sur « Fabriquer ».
async function multiHydrateSaved(nodes,ancestors,depth=0,budget={remaining:90}){
 if(depth>=5||budget.remaining<=0)return;
 await Promise.all(nodes.map(async n=>{
  const recipe=n.detail?.recipe;
  if(!Array.isArray(recipe)||!recipe.length||ancestors.has(n.id)||budget.remaining<=0)return;
  const next=new Set(ancestors);next.add(n.id);
  // Précharger également les recettes imbriquées pour retrouver les prix déjà enregistrés.
  budget.remaining--;
  try{
   const children=(await Promise.all(recipe.map(async r=>{
    if(next.has(r.item_ankama_id))return null;
    const d=await multiDetail(r.item_ankama_id,subtype(r.item_subtype));
    return multiNode(r,d);
   }))).filter(Boolean);
   // On garde les composants uniquement lorsqu'un prix sauvegardé existe dans cette branche.
   await multiHydrateSaved(children,next,depth+1,budget);
   if(children.some(c=>isPrice(prices[c.id])||c.children?.length))n.children=children;
  }catch(e){ /* Un sous-craft indisponible ne bloque pas la recette principale. */ }
 }));
}
function multiNode(r,d){return {uid:++multi.seq,id:r.item_ankama_id,qty:Number(r.quantity)||0,name:d?.name||'Ressource #'+r.item_ankama_id,image:img(d),detail:d,children:null,expanded:false,loading:false,error:''}}
function multiValue(n,seen=new Set()){const buy=isPrice(prices[n.id])?Number(prices[n.id]):null;let craft=null;if(n.children?.length&&!seen.has(n.id)){let sum=0,ok=true;const next=new Set(seen);next.add(n.id);for(const c of n.children){const v=multiValue(c,next).best;if(v===null){ok=false;break}sum+=c.qty*v}if(ok)craft=sum}let source=null,best=null;if(buy!==null&&(craft===null||buy<=craft)){source='buy';best=buy}else if(craft!==null){source='craft';best=craft}return {buy,craft,best,source}}
function multiNodeHTML(n,amount,depth=0){const v=multiValue(n),hasRecipe=!!n.detail?.recipe?.length;const buyGood=v.buy!==null&&v.craft!==null&&v.buy<=v.craft,craftGood=v.buy!==null&&v.craft!==null&&v.craft<v.buy;return `<div data-mnode="${n.uid}"><div class="multi-row"><img src="${esc(n.image)}" alt=""><div><strong>${esc(n.name)}</strong><small>× ${fmtNum(amount*n.qty)}</small></div><label class="stock-field price-field"><small>Prix unitaire (K)</small><input type="number" min="0" step="1" placeholder="Prix/u" aria-label="Prix de ${esc(n.name)}" data-mprice="${n.uid}" class="${v.best===null?'required-missing':''} ${buyGood?'choice-good':craftGood?'choice-bad':''}" value="${esc(prices[n.id]??'')}"></label><strong class="right">${isPrice(prices[n.id])?fmt(Number(prices[n.id])*amount*n.qty):'—'}</strong></div>${hasRecipe?`<div class="multi-actions"><button data-mexpand="${n.uid}" class="${craftGood?'choice-good':buyGood?'choice-bad':''}">${n.expanded?'▾':'▸'} Fabriquer${v.craft!==null?' · '+fmt(v.craft)+'/u':''}</button>${v.buy!==null&&v.craft!==null?`<small>${v.source==='buy'?'Achat moins cher':'Craft moins cher'}</small>`:''}</div><div class="multi-children" ${n.expanded?'':'hidden'}>${n.loading?'Chargement…':n.error?`<span class="error">${esc(n.error)}</span>`:n.children?.map(c=>multiNodeHTML(c,amount*n.qty,depth+1)).join('')||''}</div>`:''}</div>`}
function fmtNum(n){return n.toLocaleString('fr-FR')}
function multiWalk(uid){for(const e of multi.items){const found=walk(e.nodes,n=>n.uid===uid);if(found)return {node:found,entry:e}}return null}
async function multiExpand(uid){const found=multiWalk(uid);if(!found)return;const {node:n,entry}=found;n.expanded=!n.expanded;if(!n.expanded||n.children||n.loading){multiRender();return}n.loading=true;multiRender();try{const ancestors=new Set([entry.id]);function visit(nodes,path){for(const x of nodes){if(x===n)return path;const result=x.children&&visit(x.children,[...path,x.id]);if(result)return result}return null}for(const a of visit(entry.nodes,[])||[])ancestors.add(a);ancestors.add(n.id);n.children=(await Promise.all((n.detail?.recipe||[]).map(async r=>{if(ancestors.has(r.item_ankama_id))return null;const d=await multiDetail(r.item_ankama_id,subtype(r.item_subtype));return multiNode(r,d)}))).filter(Boolean)}catch(e){n.error=e.message}finally{n.loading=false;multiRender()}}
function multiCollect(n,qty,shopping){
 const need=qty*n.qty,missing=remainingQty(need,ownedQty(ownedMulti,n.uid));
 if(!missing)return;
 const choice=stockCost(n,need,ownedMulti);
 if(choice.source==='craft'&&n.children?.length){
  for(const c of n.children)multiCollect(c,missing,shopping);
 }else{
  const key=String(n.id),old=shopping.get(key)||{id:n.id,name:n.name,image:n.image,qty:0,unit:null};
  old.qty+=missing;old.unit=isPrice(prices[n.id])?Number(prices[n.id]):null;shopping.set(key,old);
 }
}
function multiEntryDecision(e){
 if(e.loading||e.error||(!e.nodes.length&&!e.noRecipe))return {craft:null,buy:null,source:null};
 let craft=e.noRecipe?null:0;
 for(const n of e.nodes){const v=multiValue(n);if(v.best===null){craft=null;break}craft+=v.best*n.qty}
 const sell=itemFields[e.id]?.sell;
 const buy=isPrice(sell)?Number(sell):null;
 const source=craft!==null&&buy!==null?(craft<=buy?'craft':'buy'):craft!==null?'craft':buy!==null?'buy':null;
 return {craft,buy,source};
}
function multiDecisionDifference(d,quantity=1){
 if(d.craft===null||d.buy===null)return null;
 return Math.abs(d.buy-d.craft)*quantity;
}
function multiChoiceFor(id){
 return multi.strategy==='craft'||multi.strategy==='buy' ? multi.strategy : (multi.strategy==='manual' ? (multi.overrides[id]||'auto') : 'auto');
}
function multiSetStrategy(strategy){
 // Manuel est un mode passif : conserver exactement les choix visibles.
 if(strategy==='manual'){
  const currentChoices={};
  for(const item of multi.items)currentChoices[item.id]=multiChoiceFor(item.id);
  multi.overrides=currentChoices;
 }else if(strategy==='craft'||strategy==='buy'||strategy==='auto'){
  multi.overrides={};
 }
 multi.strategy=strategy;
 document.querySelectorAll('[name="multiStrategy"]').forEach(r=>{r.checked=r.value===strategy});
 multiCalculate();
}
function multiSetItemChoice(id,choice){
 // Une modification individuelle active le mode manuel, sans écraser les autres choix.
 if(multi.strategy!=='manual'){
  const previous=multi.strategy;
  multi.overrides={};
  if(previous==='craft'||previous==='buy')for(const item of multi.items)multi.overrides[item.id]=previous;
  multi.strategy='manual';
  document.querySelectorAll('[name="multiStrategy"]').forEach(r=>{r.checked=r.value==='manual'});
 }
 multi.overrides[id]=choice;
 multiCalculate();
}
function multiDecisionDisplay(d,choice,quantity=1){
 const selected=choice==='craft'||choice==='buy'?choice:d.source;
 if(d.craft===null||d.buy===null)return {label:'Gain',value:null,css:'pending'};
 const difference=Math.abs(d.craft-d.buy)*quantity;
 if(difference===0)return {label:'Gain',value:0,css:'even'};
 const cheaper=d.craft<d.buy?'craft':'buy';
 return selected===cheaper?{label:'Gain',value:difference,css:'craft-saving'}:{label:'Perte',value:difference,css:'loss'};
}
// Somme des gains/pertes affichés pour les choix réellement retenus.
// Une comparaison impossible rend le bilan indisponible plutôt que trompeur.
function multiSelectionGain(entries,decisions){
 let total=0;
 for(const e of entries){
  const d=multiEntryDecision(e);
  const choice=decisions.get(String(e.id));
  if((choice!=='craft'&&choice!=='buy')||d.craft===null||d.buy===null)return null;
  const diff=multiDecisionDisplay(d,choice,e.qty);
  if(diff.value===null)return null;
  total+=(diff.label==='Perte'?-1:1)*diff.value;
 }
 return total;
}
// Gain théorique fixe : somme des écarts entre craft et achat HDV,
// indépendamment des choix manuels, de l'inventaire et de la liste d'achats.
function multiOptimalGain(entries){
 let total=0;
 for(const e of entries){
  const d=multiEntryDecision(e);
  const diff=multiDecisionDifference(d,e.qty);
  if(diff===null)return null;
  total+=diff;
 }
 return total;
}
function multiDecisionHTML(e){
 const d=multiEntryDecision(e),both=d.craft!==null&&d.buy!==null;
 const chosen=multiChoiceFor(e.id),selected=chosen==='auto'?d.source:chosen;
 const cls=which=>both?(selected===which?(multiDecisionDisplay(d,selected,e.qty).label==='Perte'?'selected-loss':'winner'):'loser'):(selected===which?'winner':'pending');
 const diff=multiDecisionDisplay(d,selected,e.qty);
 const diffText=diff.value===null?'—':fmt(diff.value);
 return `<div class="multi-choice" data-mdecision="${e.id}"><span class="multi-choice-pill ${cls('craft')}">⚒ Craft ${d.craft===null?'—':fmt(d.craft)+'/u'}</span><span class="multi-choice-pill ${cls('buy')}">🪙 Achat HDV ${d.buy===null?'—':fmt(d.buy)+'/u'}</span><span class="multi-choice-pill multi-difference ${diff.css}" title="Écart total sur ${e.qty} objet(s) par rapport à l’option la moins chère">${diff.label} - ${diffText}</span><label class="multi-force-label">Choix <select data-mforce="${e.id}"><option value="auto" ${chosen==='auto'?'selected':''}>Auto</option><option value="craft" ${chosen==='craft'?'selected':''}>Craft</option><option value="buy" ${chosen==='buy'?'selected':''}>Achat HDV</option></select></label></div>`;
}
function multiToggleCollapse(id){const e=multi.items.find(x=>String(x.id)===String(id));if(!e||e.loading||e.error||e.noRecipe)return;e.collapsed=!e.collapsed;multiRender()}
function multiRender(){const area=$('#multiSelected');area.className='';area.innerHTML=multi.items.length?multi.items.map(e=>`<div class="multi-entry ${e.collapsed?'is-collapsed':''}" data-mentry="${e.id}"><div class="multi-entry-top"><img src="${esc(e.image)}" alt=""><strong>${esc(e.name)}</strong><label class="multi-qty-inline"><small>Quantité</small><input class="optional-field" data-mqty="${e.id}" type="number" min="1" step="1" value="${e.qty}" aria-label="Quantité de ${esc(e.name)}"></label><label class="multi-hdv-inline"><small>Prix HDV / objet</small><input class="optional-field" data-msell="${e.id}" type="number" min="0" step="1" placeholder="Facultatif" aria-label="Prix HDV de ${esc(e.name)}" value="${esc(itemFields[e.id]?.sell??'')}"></label>${!e.loading&&!e.error&&!e.noRecipe?`<button type="button" class="multi-collapse" data-mcollapse="${e.id}" aria-expanded="${!e.collapsed}" aria-label="${e.collapsed?'Déplier':'Replier'} la recette de ${esc(e.name)}" title="${e.collapsed?'Afficher':'Masquer'} les composants">${e.collapsed?'▸':'▾'}</button>`:''}<button class="remove" data-mremove="${e.id}" title="Retirer">✕</button></div>${e.loading?'<p class="multi-message">Chargement…</p>':e.error?`<p class="error">${esc(e.error)}</p>`:e.noRecipe?'':`<div class="multi-rows">${e.nodes.map(n=>multiNodeHTML(n,e.qty)).join('')}</div>${multiDecisionHTML(e)}`}</div>`).join(''):'<div class="multi-empty">Ajoute un ou plusieurs objets depuis la recherche.</div>';
area.querySelectorAll('[data-mcollapse]').forEach(b=>b.onclick=()=>multiToggleCollapse(b.dataset.mcollapse));area.querySelectorAll('[data-mqty]').forEach(el=>{el.oninput=()=>{const e=multi.items.find(x=>x.id===+el.dataset.mqty);if(e&&Number(el.value)>=1&&Number.isInteger(Number(el.value))){e.qty=Number(el.value);multiCalculate()}};el.onchange=multiRender});area.querySelectorAll('[data-mremove]').forEach(b=>b.onclick=()=>{multi.items=multi.items.filter(e=>e.id!==+b.dataset.mremove);multiRender()});area.querySelectorAll('[data-msell]').forEach(el=>el.oninput=()=>{const id=el.dataset.msell;itemFields[id]={...(itemFields[id]||{}),sell:el.value};localStorage.setItem('dofusdude-item-fields',JSON.stringify(itemFields));multiCalculate()});area.querySelectorAll('[data-mprice]').forEach(el=>{el.oninput=()=>{const found=multiWalk(+el.dataset.mprice);if(!found)return;const id=found.node.id;if(el.value==='')delete prices[id];else if(isPrice(el.value))prices[id]=Number(el.value);localStorage.setItem('dofusdude-prices',JSON.stringify(prices));multiCalculate()};el.onblur=ev=>{if(!ev.relatedTarget?.matches?.('#multiSelected input'))multiRender()}});area.querySelectorAll('[data-mexpand]').forEach(b=>b.onclick=()=>multiExpand(+b.dataset.mexpand));multiCalculate()}


// Le plan craft/achat est calculé uniquement à partir des prix.
// Les possessions ne sont appliquées qu'après la fusion de la liste.
function multiCatalog(){
 const map=new Map();
 const visit=n=>{map.set(String(n.id),{id:n.id,name:n.name,image:n.image});for(const c of n.children||[])visit(c)};
 for(const e of multi.items){map.set(String(e.id),{id:e.id,name:e.name,image:e.image});for(const n of e.nodes)visit(n)}
 return map;
}
function multiPlanNode(n,quantity,shopping,ancestors=new Set(),depth=0){
 if(depth>12||ancestors.has(String(n.id)))return false;
 const next=new Set(ancestors);next.add(String(n.id));
 const decision=multiValue(n);
 if(decision.source==='craft'&&n.children?.length){
  for(const c of n.children)if(!multiPlanNode(c,quantity*c.qty,shopping,next,depth+1))return false;
  return true;
 }
 // Même sans prix, la ressource doit figurer dans la liste d'achat.
 const id=String(n.id);shopping.set(id,(shopping.get(id)||0)+quantity);
 return true;
}
function multiPlan(){
 const shopping=new Map(),decisions=new Map();
 let unresolved=false;
 for(const e of multi.items){
  if(e.loading||e.error){unresolved=true;continue}
  const d=multiEntryDecision(e),mode=multiChoiceFor(e.id);
  const decision=mode==='auto'?d.source:mode;
  if(!decision){unresolved=true;continue}
  decisions.set(String(e.id),decision);
  if(decision==='buy'){
   const id=String(e.id);shopping.set(id,(shopping.get(id)||0)+e.qty);
  }else if(e.noRecipe||!e.nodes.length){unresolved=true}
  else for(const n of e.nodes)if(!multiPlanNode(n,n.qty*e.qty,shopping,new Set([String(e.id)])))unresolved=true;
 }
 return {shopping,decisions,unresolved};
}
function multiShoppingRows(shopping,catalog){
 return [...shopping].map(([id,need])=>{
  const entry=multi.items.find(e=>String(e.id)===id);
  const info=catalog.get(id)||{id,name:'Objet #'+id,image:''};
  const owned=Math.max(0,Math.floor(Number(multi.inventory[id])||0));
  const remaining=Math.max(0,need-owned);
  const unit=entry?itemFields[id]?.sell:prices[id];
  return {...info,id,need,owned,remaining,unit,cost:isPrice(unit)?remaining*Number(unit):null};
 }).sort((a,b)=>a.name.localeCompare(b.name,'fr'));
}
function multiShoppingRender(rows,preserveFocus=false){
 const el=$('#multiShopping');
 const active=document.activeElement;
 if(preserveFocus&&el.contains(active)&&active.matches('[data-mowned-final]')){
  for(const row of rows){
   const tr=[...el.querySelectorAll('tr[data-shopping-id]')].find(x=>x.dataset.shoppingId===String(row.id));
   if(!tr)continue;
   const remain=tr.querySelector('[data-shopping-remaining]');
   const cost=tr.querySelector('[data-shopping-cost]');
   if(remain)remain.textContent=fmtNum(row.remaining);
   if(cost)cost.textContent=row.cost===null?'Prix manquant':fmt(row.cost);
  }
  return;
 }
 el.className='';
 el.innerHTML=rows.length?`<table class="multi-shopping"><thead><tr><th>Ressource / objet</th><th>Besoin</th><th>Possédés</th><th>À acheter</th><th>Coût restant</th></tr></thead><tbody>${rows.map(r=>`<tr data-shopping-id="${esc(r.id)}"><td>${r.image?`<img src="${esc(r.image)}" alt="">`:''}${esc(r.name)}</td><td>${fmtNum(r.need)}</td><td><input data-mowned-final="${esc(r.id)}" type="number" min="0" step="1" value="${r.owned}" aria-label="Quantité possédée de ${esc(r.name)}"></td><td data-shopping-remaining>${fmtNum(r.remaining)}</td><td data-shopping-cost>${r.cost===null?'Prix manquant':fmt(r.cost)}</td></tr>`).join('')}</tbody></table>`:'<div class="multi-empty">Aucun achat à prévoir ou aucune recette sélectionnée.</div>';
 el.querySelectorAll('[data-mowned-final]').forEach(input=>input.oninput=()=>{
  multi.inventory[input.dataset.mownedFinal]=Math.max(0,Math.floor(Number(input.value)||0));
  multiSaveInventory();
  multiCalculate(true);
 });
}
function multiCalculate(preserveShoppingFocus=false){
 const catalog=multiCatalog(),plan=multiPlan(),rows=multiShoppingRows(plan.shopping,catalog);
 for(const e of multi.items){
  const d=multiEntryDecision(e);
  const block=$(`[data-mdecision="${e.id}"]`);
  if(block&&document.activeElement!==block.querySelector('[data-mforce]')){
   const tmp=document.createElement('div');tmp.innerHTML=multiDecisionHTML(e);
   block.replaceWith(tmp.firstElementChild);
  }
  const choice=plan.decisions.get(String(e.id)),choiceEl=$(`[data-mdecision="${e.id}"]`);
  if(choiceEl&&choice){
   choiceEl.dataset.optimizedChoice=choice;
   const select=choiceEl.querySelector('[data-mforce]');
   // Le menu reste sur Auto ; seules les pastilles indiquent le choix calculé.
   const diff=multiDecisionDisplay(d,choice,e.qty);
   const diffEl=choiceEl.querySelector('.multi-difference');
   if(diffEl){diffEl.classList.remove('pending','even','craft-saving','buy-saving','loss');diffEl.classList.add(diff.css);diffEl.textContent=diff.label+' - '+(diff.value===null?'—':fmt(diff.value));}
   const pills=choiceEl.querySelectorAll('.multi-choice-pill:not(.multi-difference)');
   if(pills.length===2){
    const isLoss=diff.label==='Perte';
    pills[0].classList.toggle('winner',choice==='craft'&&!isLoss);
    pills[0].classList.toggle('selected-loss',choice==='craft'&&isLoss);
    pills[0].classList.toggle('loser',choice==='buy');
    pills[1].classList.toggle('winner',choice==='buy'&&!isLoss);
    pills[1].classList.toggle('selected-loss',choice==='buy'&&isLoss);
    pills[1].classList.toggle('loser',choice==='craft');
   }
  }
 }
 const selectionEl=$('#multiSelectionGain');
 const selectionGain=multi.items.length&&!plan.unresolved?multiSelectionGain(multi.items,plan.decisions):null;
 selectionEl.className='';
 if(selectionGain===null)selectionEl.textContent='—';
 else{
  selectionEl.textContent=(selectionGain>0?'+':'')+fmt(selectionGain);
  selectionEl.className=selectionGain>0?'green':selectionGain<0?'red':'neutral';
 }
 const complete=rows.every(r=>r.cost!==null)&&!plan.unresolved;
 const total=rows.reduce((sum,r)=>sum+(r.cost||0),0);
 $('#multiPurchaseTotal').textContent=multi.items.length&&complete?fmt(total):'—';
 const profit=$('#multiProfit');profit.className='';
 const optimalGain=multi.items.length?multiOptimalGain(multi.items):null;
 if(optimalGain!==null){
  profit.textContent=(optimalGain>0?'+':'')+fmt(optimalGain);
  profit.className=optimalGain>0?'green':optimalGain<0?'red':'neutral';
 }else profit.textContent='—';
 multiShoppingRender(rows,preserveShoppingFocus);
 $('#multiSelected').querySelectorAll('[data-mforce]').forEach(el=>el.onchange=()=>multiSetItemChoice(el.dataset.mforce,el.value));
}
document.querySelectorAll('[name="multiStrategy"]').forEach(el=>el.onchange=()=>{if(el.checked)multiSetStrategy(el.value)});


