// tools/craft.js — La Foire du Tool V90
const CUSTOM_KEY='dofus-craft-manual-recipes-v2';
let customRecipes={};
try{const v=JSON.parse(localStorage.getItem(CUSTOM_KEY)||'{}');if(v&&typeof v==='object'&&!Array.isArray(v))customRecipes=v}catch{}
function customSave(){localStorage.setItem(CUSTOM_KEY,JSON.stringify(customRecipes))}
function customDetail(id){const r=customRecipes[id];return r?{ankama_id:Number(id),name:r.name,item_subtype:r.category,image_urls:{},recipe:r.ingredients.map(x=>({item_ankama_id:x.id,item_subtype:x.category,quantity:x.qty}))}:null}
function customInit(){
 document.querySelectorAll('.custom-dropdown').forEach((panel,index)=>{
  const form=panel.querySelector('form'),query=panel.querySelector('.custom-query'),found=panel.querySelector('.custom-found'),selected=panel.querySelector('.custom-selected'),feedback=panel.querySelector('.custom-feedback');
  let chosen=[],results=[],timer=0,seq=0;
  function draw(){
   selected.innerHTML=chosen.map((x,i)=>`<div class="custom-row"><span>${img(x)?`<img src="${esc(img(x))}" width="25" height="25" style="vertical-align:middle" alt="">`:''} ${itemNameHTML(x.name)}</span><input type="number" min="1" step="1" value="${x.qty}" data-cqty="${i}" aria-label="Quantité de ${esc(x.name)}"><button type="button" data-cremove="${i}">✕</button></div>`).join('');
   selected.querySelectorAll('[data-cqty]').forEach(el=>el.oninput=()=>{chosen[Number(el.dataset.cqty)].qty=Number(el.value)});
   selected.querySelectorAll('[data-cremove]').forEach(el=>el.onclick=()=>{chosen.splice(Number(el.dataset.cremove),1);draw()});
  }
  query.addEventListener('input',()=>{
   clearTimeout(timer);const q=query.value.trim(),request=++seq;
   if(q.length<2){found.innerHTML='';return}
   timer=setTimeout(async()=>{
    found.textContent='Recherche…';
    try{
     const data=await get('/items/search?'+new URLSearchParams({query:q,limit:'30'}));
     if(request!==seq)return;
     results=(Array.isArray(data)?data:data.items||data.results||[]).filter(x=>{
      if(!Number.isSafeInteger(Number(x.ankama_id)))return false;
      // Exclure les catégories cosmétiques de la recherche d'ingrédients manuels.
      // Ne pas filtrer les noms d'objets : seuls les types/catégories comptent.
      const fields=x.item_fields||{};
      const kinds=[x.item_subtype,x.category,x.type?.name,x.type?.name_id,fields.type?.name,fields.type?.name_id,fields.item_type?.name,fields.item_type?.name_id,fields.category];
      const normalized=kinds.filter(Boolean).map(v=>String(typeof v==='object'?(v.fr||v.name||v.name_id||''):v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase());
      return !normalized.some(v=>/(apparat|ceremonial|cosmetic|mimibiot|mount|monture|montilier|petsmount|pets_mount|shield|bouclier|harnachement|costume|parure|ornement|aura)/.test(v));
     });
     found.innerHTML=results.map((x,i)=>`<button type="button" data-cfound="${i}">${img(x.item_fields||x)?`<img src="${esc(img(x.item_fields||x))}" width="25" height="25" style="vertical-align:middle" alt="">`:''} ${esc(x.name)}</button>`).join('')||'Aucun objet trouvé';
     found.querySelectorAll('[data-cfound]').forEach(b=>b.onclick=()=>{
      const x=results[Number(b.dataset.cfound)],id=Number(x.ankama_id);
      if(!chosen.some(y=>y.id===id))chosen.push({id,name:x.name,category:subtype(x.item_subtype||x.item_fields?.type?.name_id),qty:1,image_urls:x.image_urls||x.item_fields?.image_urls||{}});
      query.value='';found.innerHTML='';draw();
     });
    }catch(e){if(request===seq)found.textContent='Recherche indisponible : '+e.message}
   },300);
  });
  form.onsubmit=e=>{
   e.preventDefault();const name=form.elements.name.value.trim(),category=form.elements.category.value;
   if(!name||!chosen.length||chosen.some(x=>!Number.isSafeInteger(x.qty)||x.qty<1)){feedback.textContent='Ajoute au moins un ingrédient avec une quantité entière positive.';return}
   const id=String(Math.min(-1000000,...Object.keys(customRecipes).map(Number))-1);
   customRecipes[id]={name,category,ingredients:chosen.map(({id,name,category,qty})=>({id,name,category,qty}))};
   customSave();chosen=[];draw();form.reset();feedback.textContent='Recette enregistrée.';customLists();
  };
 });
 customLists();
}
function customLists(){
 document.querySelectorAll('.custom-dropdown').forEach((panel,index)=>{
  const list=panel.querySelector('.custom-list');
  list.innerHTML=Object.entries(customRecipes).map(([id,r])=>`<div style="display:flex;gap:6px"><button type="button" data-custom="${id}" style="flex:1;text-align:left">${esc(r.name)} · ${r.ingredients.length} ingrédient(s)</button><button type="button" data-delete="${id}" title="Supprimer">✕</button></div>`).join('');
  list.querySelectorAll('[data-custom]').forEach(b=>b.onclick=()=>{const id=b.dataset.custom,r=customRecipes[id],item={...customDetail(id),_category:r.category};index===0?openItem(item):multiAdd(item)});
  list.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{if(confirm('Supprimer cette recette personnalisée ?')){delete customRecipes[b.dataset.delete];customSave();customLists()}});
 });
}
async function search(){const q=$('#search').value.trim(),id=++requestId;if(q.length<2){$('#status').textContent='';$('#results').innerHTML='';return}$('#status').textContent='Recherche en cours…';$('#results').innerHTML='';try{const endpoint=cat==='all'?'/items/search':'/items/'+cat+'/search';const data=await get(endpoint+'?'+new URLSearchParams({query:q,limit:'50'}));if(id!==requestId)return;const rows=Array.isArray(data)?data:Array.isArray(data.items)?data.items:Array.isArray(data.results)?data.results:[];const items=rows.map(x=>({...x,_category:cat==='all'?subtype(x.item_subtype||x.type?.name_id||x.item_fields?.type?.name_id||'resources'):cat}));$('#status').textContent=items.length+' résultat(s) · sélectionne un objet pour voir sa recette';$('#results').innerHTML=items.map((x,i)=>`<button class="item" data-index="${i}">${img(x.item_fields||x)?`<img src="${esc(img(x.item_fields||x))}" alt="">`:''}<span><strong>${esc(x.name)}</strong><small>${esc(x.item_fields?.type?.name_id||x.type?.name||'Objet')}</small></span></button>`).join('')||'<div class="empty">Aucun résultat.</div>';$('#results').querySelectorAll('[data-index]').forEach(b=>b.onclick=()=>openItem(items[+b.dataset.index]));}catch(e){if(id!==requestId)return;$('#status').innerHTML='<span class="error">Recherche impossible : '+esc(e.message)+'</span>';$('#results').innerHTML='<p class="muted">Si « Failed to fetch » apparaît, vérifie le réseau et les restrictions CORS dans F12 → Console.</p>'}}
function craftItemHeading(item){return `<h2 class="craft-item-heading">${img(item)?`<img src="${esc(img(item))}" alt="" width="28" height="28">`:''}${itemNameHTML(item.name)}${item.recipe?.length?'<button id="singleResetStocks" class="stock-reset" type="button">Réinitialiser les stocks</button>':''}</h2>`}
async function openItem(x){selected=x;craftQty=1;$('#detail').innerHTML='<div class="empty">Chargement de la recette…</div>';let errors=[];const preferred=x._category||'equipment';let detail=null;for(const type of [preferred,...categories.filter(c=>c!==preferred)]){try{detail=await get('/items/'+type+'/'+x.ankama_id);if(detail)break}catch(e){errors.push(e.message)}}if(!detail){$('#detail').innerHTML='<p class="error">Impossible de charger cet objet : '+esc(errors.join(' ; '))+'</p>';return}selected=detail;const recipe=Array.isArray(detail.recipe)?detail.recipe:[];if(!recipe.length){const saved=itemFields[detail.ankama_id]||{};$('#detail').innerHTML=`${craftItemHeading(detail)}<div class="sell" style="border-top:0;padding-top:8px"><div class="sell-label">${img(detail)?`<img class="selected-icon" src="${esc(img(detail))}" alt="">`:''}<label for="sell">Prix HDV de l'objet <small>(par unité)</small></label></div><input id="sell" data-price-key="sell:${esc(selected.ankama_id)}" type="number" min="0" step="1" placeholder="Prix / objet" value="${esc(saved.sell??'')}"></div>`;$('#sell').addEventListener('input',saveItemFields);return}$('#detail').innerHTML=craftItemHeading(detail)+'<p class="muted">Chargement des ingrédients…</p>';ingredients=await Promise.all(recipe.map(async r=>{const type=subtype(r.item_subtype);let item=null;for(const t of [type,...categories.filter(c=>c!==type)]){try{item=await get('/items/'+t+'/'+r.item_ankama_id);if(item)break}catch{}}return{id:r.item_ankama_id,qty:Number(r.quantity)||0,name:item?.name||'Ressource #'+r.item_ankama_id,image:img(item),detail:item}}));rootNodes=ingredients.map((r,i)=>makeNode(r,detail.ankama_id+'/'+i+':'+r.id));renderDetail();await hydrateSingleSaved(rootNodes,new Set([detail.ankama_id]));if(selected===detail)updateNodes()}
function makeNode(r,stockKey){const node={...r,stockKey,uid:++nodeSeq,children:null,loading:false,expanded:false,forced:null,error:''};if(stockKey&&SharedStocks.get(r.id)>0)ownedSingle.set(node.uid,SharedStocks.get(r.id));return node}
// Charge les sous-recettes déjà valorisées sans nécessiter un clic sur « Fabriquer ».
async function hydrateSingleSaved(nodes,ancestors,depth=0,budget={remaining:90}){
 if(depth>=5||budget.remaining<=0)return;
 await Promise.all(nodes.map(async n=>{
  const recipe=n.detail?.recipe;
  if(!Array.isArray(recipe)||!recipe.length||ancestors.has(n.id)||budget.remaining<=0)return;
  const next=new Set(ancestors);next.add(n.id);budget.remaining--;
  try{
   const children=(await Promise.all(recipe.map(async (r,i)=>{
    if(next.has(r.item_ankama_id))return null;
    let d=detailsCache.get(r.item_ankama_id);
    if(!d){for(const t of [subtype(r.item_subtype),...categories]){try{d=await get('/items/'+t+'/'+r.item_ankama_id);if(d){detailsCache.set(r.item_ankama_id,d);break}}catch{}}}
    return makeNode({id:r.item_ankama_id,qty:Number(r.quantity)||0,name:d?.name||'Ressource #'+r.item_ankama_id,image:img(d),detail:d},n.stockKey+'/'+i+':'+r.item_ankama_id);
   }))).filter(Boolean);
   await hydrateSingleSaved(children,next,depth+1,budget);
   if(children.some(c=>isPrice(prices[c.id])||c.children?.length||ownedQty(ownedSingle,c.uid)>0))n.children=children;
  }catch{}
 }));
}

// Une quantité par objet ; les UID servent uniquement à répartir le stock dans la recette.
const ownedSingle=new Map(),ownedMulti=new Map();
const SharedStocks=(()=>{
 const KEY='la-foire-du-tool-shared-stock-v1',OLD_MULTI='dofus-craft-multi-inventory-v1',values=Object.create(null);
 function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
 function clean(data){return Object.fromEntries(Object.entries(data&&typeof data==='object'&&!Array.isArray(data)?data:{}).filter(([id,qty])=>Number.isSafeInteger(Number(id))&&Number.isSafeInteger(qty)&&qty>=0))}
 const saved=read(KEY);
 if(saved!==null)Object.assign(values,clean(saved));
 else{
  Object.assign(values,clean(read(OLD_MULTI)));
  const old=read('la-foire-du-tool-single-stock-v1'),legacy={};
  for(const [path,qty] of Object.entries(old&&typeof old==='object'?old:{})){const id=path.match(/:(-?\d+)$/)?.[1];if(id&&Number.isSafeInteger(qty)&&qty>=0)legacy[id]=Math.max(legacy[id]||0,qty)}
  for(const [id,qty] of Object.entries(legacy))if(!(id in values))values[id]=qty;
 }
 function save(){try{const json=JSON.stringify(values);localStorage.setItem(KEY,json);localStorage.setItem(OLD_MULTI,json)}catch{}}
 function replace(data){const next=clean(data);for(const id of Object.keys(values))delete values[id];Object.assign(values,next);save()}
 function set(id,qty){values[id]=Math.max(0,Math.floor(Number(qty)||0));save()}
 return {values,get:id=>values[id]||0,set,replace};
})();
function singleSyncStocks(){
 if(!rootNodes.some(n=>n.stockKey))return;
 const pool={...SharedStocks.values};let allocation=new Map();
 function clear(nodes){for(const n of nodes){ownedSingle.delete(n.uid);if(n.children)clear(n.children)}}clear(rootNodes);
 function allocate(n,need,available,assigned,stack=new Set()){
  const owned=Math.min(need,Math.max(0,available[n.id]||0)),missing=remainingQty(need,owned);assigned.set(n.uid,owned);available[n.id]=(available[n.id]||0)-owned;
  if(!missing||!n.children?.length||stack.has(n.id))return;
  const trialPool={...available},trialAssigned=new Map(assigned),next=new Set(stack);next.add(n.id);
  for(const c of n.children)allocate(c,missing*c.qty,trialPool,trialAssigned,next);
  if(stockCost(n,need,trialAssigned,stack).source==='craft'){
   Object.assign(available,trialPool);assigned.clear();for(const [uid,qty] of trialAssigned)assigned.set(uid,qty);
  }
 }
 for(const n of rootNodes)allocate(n,n.qty*craftQty,pool,allocation);
 for(const [uid,qty] of allocation)ownedSingle.set(uid,qty);
}
function singleSetStock(uid,qty){
 const node=walk(rootNodes,n=>n.uid===uid);if(node){SharedStocks.set(node.id,qty);singleSyncStocks()}
}
function singleResetStocks(){
 const values={...SharedStocks.values};function clear(nodes){for(const n of nodes){delete values[n.id];for(const r of n.detail?.recipe||[])delete values[r.item_ankama_id];if(n.children)clear(n.children)}}clear(rootNodes);SharedStocks.replace(values);ownedSingle.clear();updateNodes();
}
const ownedQty=(map,uid)=>Math.max(0,Math.floor(Number(map.get(uid))||0));
const remainingQty=(need,stock)=>Math.max(0,need-stock);
// Coût d'une branche pour une quantité donnée, après déduction du stock affecté à ses lignes.
function stockCost(node,need,stock,stack=new Set()){
 const missing=remainingQty(need,ownedQty(stock,node.uid));
 if(!missing)return {cost:0,complete:true,source:'owned'};
 const buy=isPrice(prices[node.id])?missing*Number(prices[node.id]):null;
 let craft=null;
 if(node.children?.length&&!stack.has(node.id)){
  const next=new Set(stack);next.add(node.id);let sum=0,valid=true;
  for(const c of node.children){const r=stockCost(c,missing*c.qty,stock,next);if(!r.complete){valid=false;break}sum+=r.cost}
  if(valid)craft=sum;
 }
 const forced=node.forced;
 if(forced==='buy'&&buy!==null)return {cost:buy,complete:true,source:'buy'};
 if(forced==='craft'&&craft!==null)return {cost:craft,complete:true,source:'craft'};
 if(buy===null&&craft===null)return {cost:0,complete:false,source:null};
 if(craft!==null&&(buy===null||craft<buy))return {cost:craft,complete:true,source:'craft'};
 return {cost:buy,complete:true,source:'buy'};
}
function nodeValue(node,stack=new Set()){
 const buy=isPrice(prices[node.id])?Number(prices[node.id]):null;
 let craft=null;
 if(node.children&&node.children.length&&!stack.has(node.id)){
  const next=new Set(stack);next.add(node.id);let sum=0,valid=true;
  for(const child of node.children){const v=nodeValue(child,next).best;if(v===null){valid=false;break}sum+=child.qty*v}
  if(valid)craft=sum;
 }
 let best=null,source=null;
 if(node.forced==='buy'&&buy!==null){best=buy;source='buy'}
 else if(node.forced==='craft'&&craft!==null){best=craft;source='craft'}
 else if(buy!==null&&craft!==null){source=buy<=craft?'buy':'craft';best=Math.min(buy,craft)}
 else if(buy!==null){best=buy;source='buy'}
 else if(craft!==null){best=craft;source='craft'}
 return {buy,craft,best,source};
}
function renderNode(n,depth=0,need=n.qty*craftQty){const missing=remainingQty(need,ownedQty(ownedSingle,n.uid));const v=nodeValue(n),hasRecipe=Array.isArray(n.detail?.recipe)&&n.detail.recipe.length>0;
 const selectedBuy=v.buy!==null&&v.craft!==null&&v.buy<=v.craft,selectedCraft=v.buy!==null&&v.craft!==null&&v.craft<v.buy;
 const choice=n.forced||v.source;
 return `<div class="composite" data-node="${n.uid}"><div class="ingredient${missing===0?' shopping-settled':''}"><img src="${esc(n.image)}" alt=""><div class="ingredient-name"><strong>${itemNameHTML(n.name)}</strong><small class="need" data-single-need="${n.uid}" style="display:block">× ${need} nécessaires</small>${hasRecipe?`<div class="comp-actions"><span class="craft-expand-group"><button type="button" data-expand="${n.uid}" class="${selectedCraft?'choice-good':selectedBuy?'choice-bad':''}">${n.expanded?'▾':'▸'} Fabriquer ${v.craft!==null?'· '+fmt(v.craft)+'/u':''}</button>${craftHelpHTML()}</span><span class="choice-note">${v.buy!==null&&v.craft!==null?(v.buy<=v.craft?'Achat moins cher':'Craft moins cher'):''}</span></div>`:""}</div><label class="stock-field"><small>Possédés</small><input aria-label="Quantité possédée de ${esc(n.name)}" type="number" min="0" step="1" data-owned-node="${n.uid}" value="${n.stockKey?SharedStocks.get(n.id):ownedSingle.get(n.uid)??0}"></label><label class="stock-field price-field"><small>Prix unitaire (K)</small><input aria-label="Prix d'achat unitaire de ${esc(n.name)}" type="number" min="0" step="1" data-price-node="${n.uid}" data-price-key="item:${esc(n.id)}" placeholder="Prix/u" value="${esc(prices[n.id]??'')}" class="${v.buy===null&&v.craft===null?'required-missing':''} ${selectedBuy?'choice-good':selectedCraft?'choice-bad':''}"></label><div class="single-remaining-field"><small>À acheter</small><strong data-single-remaining="${n.uid}">${fmtNum(missing)}</strong></div><strong class="right line" data-single-line="${n.uid}">${stockCost(n,need,ownedSingle).complete?fmt(stockCost(n,need,ownedSingle).cost):'—'}</strong></div>${hasRecipe?`<div class="comp-children" data-children="${n.uid}" ${n.expanded?'':'hidden'}>${n.loading?'Chargement…':n.error?`<span class="error">${esc(n.error)}</span>`:n.children?n.children.map(c=>renderNode(c,depth+1,missing*c.qty)).join(''):''}</div>`:''}</div>`;
}
function walk(nodes,fn){for(const n of nodes){if(fn(n))return n;if(n.children){const found=walk(n.children,fn);if(found)return found}}return null}
async function loadNode(n){if(n.loading||n.children)return;n.loading=true;updateNodes();try{
 const chain=new Set();function findAncestors(nodes,target,path=[]){for(const x of nodes){if(x===target)return path.map(p=>p.id);if(x.children){const a=findAncestors(x.children,target,[...path,x]);if(a)return a}}return null}
 (findAncestors(rootNodes,n)||[]).forEach(id=>chain.add(id));chain.add(n.id);
 const recipe=n.detail?.recipe||[];
 const loaded=await Promise.all(recipe.map(async (r,i)=>{
 const id=r.item_ankama_id;if(chain.has(id))return null;
 let detail=detailsCache.get(id);
 if(!detail){for(const t of [subtype(r.item_subtype),...categories]){try{detail=await get('/items/'+t+'/'+id);if(detail){detailsCache.set(id,detail);break}}catch{}}}
 return makeNode({id,qty:Number(r.quantity)||0,name:detail?.name||'Ressource #'+id,image:img(detail),detail},n.stockKey+'/'+i+':'+id);
 }));n.children=loaded.filter(Boolean);n.error='';
 }catch(e){n.error=e.message}finally{n.loading=false;updateNodes()}}
function updateNodes(){singleSyncStocks();const list=$('#nodeList');if(!list)return;list.innerHTML=rootNodes.map(n=>renderNode(n)).join('');list.querySelectorAll('[data-price-node]').forEach(el=>{el.addEventListener('input',()=>{const n=walk(rootNodes,x=>x.uid===Number(el.dataset.priceNode));if(!n)return;if(el.value==='')delete prices[n.id];else if(isPrice(el.value))prices[n.id]=Number(el.value);localStorage.setItem('dofusdude-prices',JSON.stringify(prices));el.classList.toggle('required-missing',el.value===''&&!n.children);calculate()});el.addEventListener('blur',ev=>{if(!ev.relatedTarget?.matches?.('#nodeList input,#nodeList .price-age,#nodeList .craft-help'))updateNodes()})});list.querySelectorAll('[data-owned-node]').forEach(el=>{el.oninput=()=>{singleSetStock(Number(el.dataset.ownedNode),el.value);calculate()};el.onblur=ev=>{if(!ev.relatedTarget?.matches?.('#nodeList input,#nodeList .price-age,#nodeList .craft-help'))updateNodes()}});list.querySelectorAll('[data-expand]').forEach(b=>b.onclick=()=>{const n=walk(rootNodes,x=>x.uid===Number(b.dataset.expand));n.expanded=!n.expanded;if(n.expanded&&!n.children)loadNode(n);else updateNodes()});calculate()}
function renderDetail(){const saved=itemFields[selected.ankama_id]||{};
 $('#detail').innerHTML=`${craftItemHeading(selected)}<div class="craft-qty"><label for="craftQty"><strong>Quantité à crafter</strong><small style="display:block">Multiplie tous les ingrédients</small></label><input id="craftQty" class="optional-field" aria-label="Nombre d'objets à crafter" type="number" min="1" max="1000000" step="1" value="${craftQty}"></div><div id="nodeList"></div><div class="total"><span>Coût total du craft</span><strong id="total">0 K</strong></div><div class="sell-stack"><div class="sell"><div class="sell-label">${img(selected)?`<img class="selected-icon" src="${esc(img(selected))}" alt="">`:''}<label for="sell">Prix HDV de l'objet final <small>(par unité)</small></label></div><input id="sell" data-price-key="sell:${esc(selected.ankama_id)}" type="number" min="0" step="1" placeholder="Prix / objet" value="${esc(saved.sell??'')}"></div><div class="sell"><div class="sell-label"><svg class="sales-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="m6 15 5-5 4 3 5-7"/><path d="M16 6h4v4"/></svg><label for="monthlySales">Articles vendus sur 30 jours <small>(facultatif)</small></label></div><input id="monthlySales" data-price-key="sales:${esc(selected.ankama_id)}" class="optional-field" type="number" min="0" step="1" placeholder="Ventes / mois" value="${esc(saved.monthlySales??'')}"></div></div><div id="craftConclusions" class="craft-conclusions" hidden><p id="stockConclusion" hidden></p><p id="grossConclusion" hidden></p></div><div class="summary"><div class="stat"><small class="stat-heading"><span>Comparaison des coûts</span>${craftHelpHTML("Montre ce que cela va vous couter de crafter, d'acheter, ou de revendre votre stock et d'acheter.")}</small><div class="craft-cost-line"><span>Fabrication</span><strong id="statCost">—</strong></div><div class="craft-cost-line"><span>Achat HDV</span><strong id="statBuy">—</strong></div><div id="resellBuyRow" class="craft-cost-line"><span>Revente + achat</span><strong id="statResellBuy">—</strong></div></div><div class="stat"><small class="stat-heading"><span>Économies en craftant</span>${craftHelpHTML("Économies réalisées si on décide de craft le produit final en complétant son stock au lieu de l'acheter")}</small><strong id="statDiff">—</strong><strong class="summary-percent" id="statPercent">—</strong></div><div class="stat craft-resale-stat"><small class="stat-heading"><span>Valeurs brutes totales</span>${craftHelpHTML("Prix totaux sans stock des composants et de l'item HDV. Permet de savoir s'il vaut mieux vendre les composants séparément ou si le craft est rentable à partir de zéro.")}</small><div class="craft-cost-line"><span>Composants</span><strong id="statResale">—</strong></div><div class="craft-cost-line"><span>Achat HDV</span><strong id="statGrossBuy">—</strong></div></div><div class="stat"><small class="stat-heading"><span>Marge journalière</span>${craftHelpHTML("Articles vendus par jour x Marge brute en craftant vis-à-vis de l'achat. Les composants possédés ne sont pas pris en compte, c'est pour refléter le flux de kamas porté par cet item sur une journée.")}</small><strong id="statDaily">—</strong><strong class="summary-percent" id="statDailyPercent">—</strong></div></div><p class="note">Prix et ventes sauvegardés dans ce navigateur. Les taxes HDV ne sont pas prises en compte. La marge journalière est basée sur les ventes mensuelles / 30.</p>`;
 $('#singleResetStocks')?.addEventListener('click',singleResetStocks);
 $('#craftQty').addEventListener('input',()=>{craftQty=Math.min(1000000,Math.max(1,Math.floor(Number($('#craftQty').value)||1)));updateNodes()});$('#craftQty').addEventListener('change',()=>{$('#craftQty').value=craftQty;updateNodes()});$('#sell').addEventListener('input',()=>{saveItemFields();calculate()});$('#monthlySales').addEventListener('input',()=>{saveItemFields();calculate()});updateNodes()}
// Valeur de revente HDV des composants, et coût optimisé d'un craft sans stock.
function singleGrossValues(nodes,quantity){
 let components=0,craft=0,componentsComplete=true,craftComplete=true;const emptyStock=new Map();
 for(const node of nodes){
  const need=node.qty*quantity;
  if(isPrice(prices[node.id]))components+=need*Number(prices[node.id]);else componentsComplete=false;
  const cost=stockCost(node,need,emptyStock);if(cost.complete)craft+=cost.cost;else craftComplete=false;
 }
 return {components:componentsComplete?components:null,craft:craftComplete?craft:null};
}
// Le stock pertinent est celui que le craft consommerait. Les surplus restent
// disponibles dans tous les scénarios et ne doivent pas favoriser une option.
function singleStockResale(node,need,stock,stack=new Set()){
 const owned=Math.min(need,ownedQty(stock,node.uid)),missing=remainingQty(need,owned);
 if(owned>0&&!isPrice(prices[node.id]))return null;
 let value=owned>0?owned*Number(prices[node.id]):0;
 const decision=stockCost(node,need,stock,stack);if(!decision.complete)return null;
 if(missing>0&&decision.source==='craft'){
  const next=new Set(stack);next.add(node.id);
  for(const child of node.children){const resale=singleStockResale(child,missing*child.qty,stock,next);if(resale===null)return null;value+=resale}
 }
 return value;
}
function singleKeepDecision(nodes,quantity,sell,stock){
 if(!isPrice(sell))return null;
 let craft=0,stockValue=0;
 for(const node of nodes){const need=node.qty*quantity,cost=stockCost(node,need,stock),resale=singleStockResale(node,need,stock);if(!cost.complete||resale===null)return null;craft+=cost.cost;stockValue+=resale}
 const buy=Number(sell)*quantity,resellBuy=stockValue>0?buy-stockValue:null,options={craft,buy,...(resellBuy===null?{}:{resellBuy})},minimum=Math.min(...Object.values(options));
 return {craft,buy,resellBuy,stockValue,best:Object.keys(options).filter(key=>Math.abs(options[key]-minimum)<1e-9)};
}
function singleRefreshRows(nodes=rootNodes,multiplier=craftQty){
 for(const node of nodes){
  const need=node.qty*multiplier,missing=remainingQty(need,ownedQty(ownedSingle,node.uid)),cost=stockCost(node,need,ownedSingle);
  const quantity=$('[data-single-remaining="'+node.uid+'"]'),needed=$('[data-single-need="'+node.uid+'"]'),line=$('[data-single-line="'+node.uid+'"]');
  quantity?.closest?.('.ingredient')?.classList.toggle('shopping-settled',missing===0);
  if(quantity)quantity.textContent=fmtNum(missing);if(needed)needed.textContent='× '+fmtNum(need)+' nécessaires';if(line)line.textContent=cost.complete?fmt(cost.cost):'—';
  if(node.children)singleRefreshRows(node.children,missing);
 }
}
function calculate(){singleRefreshRows();let total=0,complete=true;for(const n of rootNodes){const v=stockCost(n,n.qty*craftQty,ownedSingle);if(!v.complete)complete=false;else total+=v.cost}
 $('#total').textContent=fmt(total)+(complete?'':' (partiel)');$('#statCost').textContent=complete?fmt(total):fmt(total)+' (partiel)';
 const diffEl=$('#statDiff'),pctEl=$('#statPercent'),dailyEl=$('#statDaily'),dailyPctEl=$('#statDailyPercent');for(const el of [diffEl,pctEl,dailyEl,dailyPctEl]){el.textContent='—';el.className='neutral'}
 const sell=$('#sell').value,monthly=$('#monthlySales').value;
 const buyTotal=isPrice(sell)?Number(sell)*craftQty:null,buyEl=$('#statBuy'),costEl=$('#statCost');
 buyEl.textContent=buyTotal===null?'—':fmt(buyTotal);costEl.className=buyEl.className='neutral';
 const keep=singleKeepDecision(rootNodes,craftQty,sell,ownedSingle),resellEl=$('#statResellBuy');
 const hasStock=rootNodes.some(function has(node){return ownedQty(ownedSingle,node.uid)>0||!!node.children?.some(has)});
 const resellDisplay=keep?(keep.resellBuy??keep.buy):!hasStock?buyTotal:null;
 resellEl.textContent=resellDisplay===null?'—':resellDisplay<0?'Gain de '+fmt(Math.abs(resellDisplay)):fmt(resellDisplay);resellEl.className='neutral';
 if(keep){const values=[keep.craft,keep.buy,...(keep.resellBuy===null?[]:[keep.resellBuy])],min=Math.min(...values),max=Math.max(...values);for(const [el,value] of [[costEl,keep.craft],[buyEl,keep.buy],[resellEl,resellDisplay]])if(value!==null)el.className=min===max?'neutral':value===min?'green':value===max?'red':'neutral'}
 if(keep?.resellBuy<0){costEl.className=buyEl.className='red';resellEl.className='green'}
 $('#resellBuyRow').classList.toggle('is-inactive',!hasStock);if(!hasStock)resellEl.className='neutral';
 const gross=singleGrossValues(rootNodes,craftQty),componentsEl=$('#statResale'),grossBuyEl=$('#statGrossBuy');
 componentsEl.textContent=gross.components===null?'—':fmt(gross.components);grossBuyEl.textContent=buyTotal===null?'—':fmt(buyTotal);
 componentsEl.className=grossBuyEl.className='neutral';
 if(gross.components!==null&&buyTotal!==null&&gross.components!==buyTotal){componentsEl.className=gross.components<buyTotal?'green':'red';grossBuyEl.className=buyTotal<gross.components?'green':'red'}
 const stockConclusion=$('#stockConclusion'),grossConclusion=$('#grossConclusion');
 stockConclusion.hidden=!keep;
 const names={craft:'le crafter',buy:'l’acheter',resellBuy:'revendre votre stock puis acheter l’item'};
 stockConclusion.innerHTML=!keep?'':keep.best.length>1?'Si vous voulez garder l’item, <strong class="green">'+keep.best.map(key=>names[key]).join(' ou ')+'</strong> revient au même coût.':'Si vous voulez garder l’item, le mieux est de <strong class="green">'+names[keep.best[0]]+'</strong>.';
 grossConclusion.hidden=gross.components===null||buyTotal===null;
 grossConclusion.innerHTML=grossConclusion.hidden?'':buyTotal>gross.components?'L’achat/revente sans stock à la chaine <strong class="green">est rentable</strong>.':'L’achat/revente sans stock à la chaine <strong class="red">n’est pas rentable</strong>.';
 $('#craftConclusions').hidden=stockConclusion.hidden&&grossConclusion.hidden;
 if(!isPrice(sell))return;
 if(complete){
  const diff=buyTotal-total,pct=total>0?diff/total*100:null;
  diffEl.textContent=(diff>0?'+':diff<0?'−':'')+fmt(Math.abs(diff));pctEl.textContent=pct===null?'N/A':(pct>0?'+':'')+pct.toLocaleString('fr-FR',{maximumFractionDigits:2,minimumFractionDigits:1})+' %';
  const color=diff>0?'green':diff<0?'red':'neutral';diffEl.className=color;pctEl.className=color;
 }
 if(isPrice(monthly)&&gross.craft!==null){
  const margin=Number(sell)-gross.craft/craftQty,daily=Number(monthly)/30*margin;
  dailyEl.textContent=(daily>0?'+':daily<0?'−':'')+fmt(Math.abs(daily));dailyEl.className=daily>0?'green':daily<0?'red':'neutral';
  const dailyPct=gross.craft>0?Number(monthly)/30*(margin/(gross.craft/craftQty)*100):null;
  dailyPctEl.textContent=dailyPct===null?'N/A':(dailyPct>0?'+':'')+dailyPct.toLocaleString('fr-FR',{maximumFractionDigits:2,minimumFractionDigits:1})+' %';dailyPctEl.className=dailyPct>0?'green':dailyPct<0?'red':'neutral';
 }

}
$('#search').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(search,350)});document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{cat=b.dataset.cat;document.querySelectorAll('[data-cat]').forEach(x=>x.classList.toggle('active',x===b));search()});

