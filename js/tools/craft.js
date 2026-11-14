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
function craftItemHeading(item){return `<h2 class="craft-item-heading">${img(item)?`<img src="${esc(img(item))}" alt="" width="28" height="28">`:''}${itemNameHTML(item.name)}</h2>`}
async function openItem(x){selected=x;craftQty=1;$('#detail').innerHTML='<div class="empty">Chargement de la recette…</div>';let errors=[];const preferred=x._category||'equipment';let detail=null;for(const type of [preferred,...categories.filter(c=>c!==preferred)]){try{detail=await get('/items/'+type+'/'+x.ankama_id);if(detail)break}catch(e){errors.push(e.message)}}if(!detail){$('#detail').innerHTML='<p class="error">Impossible de charger cet objet : '+esc(errors.join(' ; '))+'</p>';return}selected=detail;const recipe=Array.isArray(detail.recipe)?detail.recipe:[];if(!recipe.length){const saved=itemFields[detail.ankama_id]||{};$('#detail').innerHTML=`${craftItemHeading(detail)}<div class="sell" style="border-top:0;padding-top:8px"><div class="sell-label">${img(detail)?`<img class="selected-icon" src="${esc(img(detail))}" alt="">`:''}<label for="sell">Prix HDV de l'objet <small>(par unité)</small></label></div><input id="sell" data-price-key="sell:${esc(selected.ankama_id)}" class="optional-field" type="number" min="0" step="1" placeholder="Prix / objet" value="${esc(saved.sell??'')}"></div>`;$('#sell').addEventListener('input',saveItemFields);return}$('#detail').innerHTML=craftItemHeading(detail)+'<p class="muted">Chargement des ingrédients…</p>';ingredients=await Promise.all(recipe.map(async r=>{const type=subtype(r.item_subtype);let item=null;for(const t of [type,...categories.filter(c=>c!==type)]){try{item=await get('/items/'+t+'/'+r.item_ankama_id);if(item)break}catch{}}return{id:r.item_ankama_id,qty:Number(r.quantity)||0,name:item?.name||'Ressource #'+r.item_ankama_id,image:img(item),detail:item}}));rootNodes=ingredients.map(r=>makeNode(r));renderDetail();await hydrateSingleSaved(rootNodes,new Set([detail.ankama_id]));if(selected===detail)updateNodes()}
function makeNode(r){return {...r,uid:++nodeSeq,children:null,loading:false,expanded:false,forced:null,error:''}}
// Charge les sous-recettes déjà valorisées sans nécessiter un clic sur « Fabriquer ».
async function hydrateSingleSaved(nodes,ancestors,depth=0,budget={remaining:90}){
 if(depth>=5||budget.remaining<=0)return;
 await Promise.all(nodes.map(async n=>{
  const recipe=n.detail?.recipe;
  if(!Array.isArray(recipe)||!recipe.length||ancestors.has(n.id)||budget.remaining<=0)return;
  const next=new Set(ancestors);next.add(n.id);budget.remaining--;
  try{
   const children=(await Promise.all(recipe.map(async r=>{
    if(next.has(r.item_ankama_id))return null;
    let d=detailsCache.get(r.item_ankama_id);
    if(!d){for(const t of [subtype(r.item_subtype),...categories]){try{d=await get('/items/'+t+'/'+r.item_ankama_id);if(d){detailsCache.set(r.item_ankama_id,d);break}}catch{}}}
    return makeNode({id:r.item_ankama_id,qty:Number(r.quantity)||0,name:d?.name||'Ressource #'+r.item_ankama_id,image:img(d),detail:d});
   }))).filter(Boolean);
   await hydrateSingleSaved(children,next,depth+1,budget);
   if(children.some(c=>isPrice(prices[c.id])||c.children?.length))n.children=children;
  }catch{}
 }));
}

// Stock saisi par ligne de recette (UID), pour éviter de compter deux fois un même stock.
const ownedSingle=new Map(),ownedMulti=new Map();
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
function renderNode(n,depth=0){const v=nodeValue(n),hasRecipe=Array.isArray(n.detail?.recipe)&&n.detail.recipe.length>0;
 const selectedBuy=v.buy!==null&&v.craft!==null&&v.buy<=v.craft,selectedCraft=v.buy!==null&&v.craft!==null&&v.craft<v.buy;
 const choice=n.forced||v.source;
 return `<div class="composite" data-node="${n.uid}"><div class="ingredient"><img src="${esc(n.image)}" alt=""><div class="ingredient-name"><strong>${itemNameHTML(n.name)}</strong><small class="need" style="display:block">× ${n.qty*craftQty} à acheter / fabriquer</small>${hasRecipe?`<div class="comp-actions"><button type="button" data-expand="${n.uid}" class="${selectedCraft?'choice-good':selectedBuy?'choice-bad':''}">${n.expanded?'▾':'▸'} Fabriquer ${v.craft!==null?'· '+fmt(v.craft)+'/u':''}</button><span class="choice-note">${v.buy!==null&&v.craft!==null?(v.buy<=v.craft?'Achat moins cher':'Craft moins cher'):''}</span></div>`:""}</div><label class="stock-field"><small>Possédés</small><input aria-label="Quantité possédée de ${esc(n.name)}" type="number" min="0" step="1" data-owned-node="${n.uid}" value="${ownedSingle.get(n.uid)??0}"></label><label class="stock-field price-field"><small>Prix unitaire (K)</small><input aria-label="Prix d'achat unitaire de ${esc(n.name)}" type="number" min="0" step="1" data-price-node="${n.uid}" data-price-key="item:${esc(n.id)}" placeholder="Prix/u" value="${esc(prices[n.id]??'')}" class="${v.buy===null&&v.craft===null?'required-missing':''} ${selectedBuy?'choice-good':selectedCraft?'choice-bad':''}"></label><strong class="right line">${stockCost(n,n.qty*craftQty,ownedSingle).complete?fmt(stockCost(n,n.qty*craftQty,ownedSingle).cost):'—'}</strong></div>${hasRecipe?`<div class="comp-children" data-children="${n.uid}" ${n.expanded?'':'hidden'}>${n.loading?'Chargement…':n.error?`<span class="error">${esc(n.error)}</span>`:n.children?n.children.map(c=>renderNode(c,depth+1)).join(''):''}</div>`:''}</div>`;
}
function walk(nodes,fn){for(const n of nodes){if(fn(n))return n;if(n.children){const found=walk(n.children,fn);if(found)return found}}return null}
async function loadNode(n){if(n.loading||n.children)return;n.loading=true;updateNodes();try{
 const chain=new Set();function findAncestors(nodes,target,path=[]){for(const x of nodes){if(x===target)return path.map(p=>p.id);if(x.children){const a=findAncestors(x.children,target,[...path,x]);if(a)return a}}return null}
 (findAncestors(rootNodes,n)||[]).forEach(id=>chain.add(id));chain.add(n.id);
 const recipe=n.detail?.recipe||[];
 const loaded=await Promise.all(recipe.map(async r=>{
 const id=r.item_ankama_id;if(chain.has(id))return null;
 let detail=detailsCache.get(id);
 if(!detail){for(const t of [subtype(r.item_subtype),...categories]){try{detail=await get('/items/'+t+'/'+id);if(detail){detailsCache.set(id,detail);break}}catch{}}}
 return makeNode({id,qty:Number(r.quantity)||0,name:detail?.name||'Ressource #'+id,image:img(detail),detail});
 }));n.children=loaded.filter(Boolean);n.error='';
 }catch(e){n.error=e.message}finally{n.loading=false;updateNodes()}}
function updateNodes(){const list=$('#nodeList');if(!list)return;list.innerHTML=rootNodes.map(n=>renderNode(n)).join('');list.querySelectorAll('[data-price-node]').forEach(el=>{el.addEventListener('input',()=>{const n=walk(rootNodes,x=>x.uid===Number(el.dataset.priceNode));if(!n)return;if(el.value==='')delete prices[n.id];else if(isPrice(el.value))prices[n.id]=Number(el.value);localStorage.setItem('dofusdude-prices',JSON.stringify(prices));el.classList.toggle('required-missing',el.value===''&&!n.children);calculate()});el.addEventListener('blur',ev=>{if(!ev.relatedTarget?.matches?.('#nodeList input,#nodeList .price-age'))updateNodes()})});list.querySelectorAll('[data-owned-node]').forEach(el=>{el.oninput=()=>{ownedSingle.set(Number(el.dataset.ownedNode),Math.max(0,Math.floor(Number(el.value)||0)));calculate()};el.onblur=ev=>{if(!ev.relatedTarget?.matches?.('#nodeList input,#nodeList .price-age'))updateNodes()}});list.querySelectorAll('[data-expand]').forEach(b=>b.onclick=()=>{const n=walk(rootNodes,x=>x.uid===Number(b.dataset.expand));n.expanded=!n.expanded;if(n.expanded&&!n.children)loadNode(n);else updateNodes()});calculate()}
function renderDetail(){const saved=itemFields[selected.ankama_id]||{};const hasComposite=rootNodes.some(n=>Array.isArray(n.detail?.recipe)&&n.detail.recipe.length>0);
 $('#detail').innerHTML=`${craftItemHeading(selected)}<div class="craft-qty"><label for="craftQty"><strong>Quantité à crafter</strong><small style="display:block">Multiplie tous les ingrédients</small></label><input id="craftQty" class="optional-field" aria-label="Nombre d'objets à crafter" type="number" min="1" max="1000000" step="1" value="${craftQty}"></div>${hasComposite?`<p class="muted">Ouvrir "Fabriquer" pour les ingrédients composites. Le moins cher entre crafter et acheter est choisi automatiquement.</p>`:""}<div id="nodeList"></div><div class="total"><span>Coût total du craft</span><strong id="total">0 K</strong></div><div class="sell-stack"><div class="sell"><div class="sell-label">${img(selected)?`<img class="selected-icon" src="${esc(img(selected))}" alt="">`:''}<label for="sell">Prix HDV de l'objet final <small>(par unité, facultatif)</small></label></div><input id="sell" data-price-key="sell:${esc(selected.ankama_id)}" class="optional-field" type="number" min="0" step="1" placeholder="Prix / objet" value="${esc(saved.sell??'')}"></div><div class="sell"><div class="sell-label"><svg class="sales-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="m6 15 5-5 4 3 5-7"/><path d="M16 6h4v4"/></svg><label for="monthlySales">Articles vendus sur 30 jours <small>(facultatif)</small></label></div><input id="monthlySales" class="optional-field" type="number" min="0" step="1" placeholder="Ventes / mois" value="${esc(saved.monthlySales??'')}"></div></div><div class="summary"><div class="stat"><small>Coût de fabrication</small><strong id="statCost">—</strong></div><div class="stat"><small>Économies en craftant</small><strong id="statDiff">—</strong></div><div class="stat"><small>Économies en %</small><strong id="statPercent">—</strong></div><div class="stat"><small>Marge journalière en kamas</small><strong id="statDaily">—</strong></div><div class="stat"><small>Marge journalière en %</small><strong id="statDailyPercent">—</strong></div></div><p class="note">Prix et ventes sauvegardés dans ce navigateur. Les taxes HDV ne sont pas prises en compte. La marge journalière est basée sur les ventes mensuelles / 30.</p>`;
 $('#craftQty').addEventListener('input',()=>{craftQty=Math.min(1000000,Math.max(1,Math.floor(Number($('#craftQty').value)||1)));updateNodes()});$('#craftQty').addEventListener('change',()=>{$('#craftQty').value=craftQty;updateNodes()});$('#sell').addEventListener('input',()=>{saveItemFields();calculate()});$('#monthlySales').addEventListener('input',()=>{saveItemFields();calculate()});updateNodes()}
function calculate(){let total=0,complete=true;for(const n of rootNodes){const v=stockCost(n,n.qty*craftQty,ownedSingle);if(!v.complete)complete=false;else total+=v.cost}
 $('#total').textContent=fmt(total)+(complete?'':' (partiel)');$('#statCost').textContent=complete?fmt(total):fmt(total)+' (partiel)';
 const diffEl=$('#statDiff'),pctEl=$('#statPercent'),dailyEl=$('#statDaily'),dailyPctEl=$('#statDailyPercent');for(const el of [diffEl,pctEl,dailyEl,dailyPctEl]){el.textContent='—';el.className='neutral'}
 const sell=$('#sell').value,monthly=$('#monthlySales').value;if(!complete||!isPrice(sell))return;
 const diff=Number(sell)*craftQty-total,pct=total>0?diff/total*100:null;diffEl.textContent=(diff>0?'+':diff<0?'−':'')+fmt(Math.abs(diff));pctEl.textContent=pct===null?'N/A':(pct>0?'+':'')+pct.toLocaleString('fr-FR',{maximumFractionDigits:2,minimumFractionDigits:1})+' %';const color=diff>0?'green':diff<0?'red':'neutral';diffEl.className=color;pctEl.className=color;
 if(isPrice(monthly)){const daily=Number(monthly)/30*(diff/craftQty);dailyEl.textContent=(daily>0?'+':daily<0?'−':'')+fmt(Math.abs(daily));dailyEl.className=daily>0?'green':daily<0?'red':'neutral';const dailyPct=pct===null?null:Number(monthly)/30*(pct/craftQty);dailyPctEl.textContent=dailyPct===null?'N/A':(dailyPct>0?'+':'')+dailyPct.toLocaleString('fr-FR',{maximumFractionDigits:2,minimumFractionDigits:1})+' %';dailyPctEl.className=dailyPct>0?'green':dailyPct<0?'red':'neutral'}
}
$('#search').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(search,350)});document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{cat=b.dataset.cat;document.querySelectorAll('[data-cat]').forEach(x=>x.classList.toggle('active',x===b));search()});

