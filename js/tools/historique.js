// tools/historique.js — La Foire du Tool V90
// Historique : les lots et leurs ventes sont indépendants des recettes.
const LEDGER_KEY='dofusdude-purchase-ledger-v1';
let ledger=[];
try{const saved=JSON.parse(localStorage.getItem(LEDGER_KEY)||'[]');if(Array.isArray(saved))ledger=saved}catch{}
const ledgerSave=()=>localStorage.setItem(LEDGER_KEY,JSON.stringify(ledger));
const ledgerSold=lot=>(lot.sales||[]).reduce((n,s)=>n+Number(s.qty),0);
const LEDGER_SALE_TAX=0.02;
const ledgerSaleProfit=(lot,sale)=>Number(sale.qty)*(Number(sale.price)*(1-LEDGER_SALE_TAX)-Number(lot.buy));
function ledgerTotals(lots){
 let profit=0,pending=0,remaining=0;
 for(const lot of lots){
  const sold=ledgerSold(lot),left=Math.max(0,Number(lot.qty)-sold);
  remaining+=left;pending+=left*Number(lot.buy);
  for(const sale of lot.sales||[])profit+=ledgerSaleProfit(lot,sale);
 }
 return {profit,pending,remaining};
}
const ledgerSigned=n=>(n>0?'+':n<0?'−':'')+fmt(Math.abs(n));
const ledgerProfitPercent=lot=>{const cost=Number(lot.qty)*Number(lot.buy);return cost>0?ledgerTotals([lot]).profit/cost*100:null};
const ledgerSignedPercent=n=>n===null?'—':`${n>0?'+':n<0?'−':''}${new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2}).format(Math.abs(n))} %`;
const ledgerId=()=>String(Date.now())+'-'+Math.random().toString(36).slice(2);
function ledgerEntryHTML(lot){
 const sold=ledgerSold(lot),left=Math.max(0,Number(lot.qty)-sold),p=ledgerTotals([lot]).profit;
 const title=lot.itemId?`<span class="ledger-item-title">${lot.image?`<img class="ledger-item-icon" src="${esc(lot.image)}" alt="">`:''}<strong>${esc(lot.name)}</strong></span>`:`<strong>${esc(lot.name)}</strong>`;
 return `<article class="ledger-entry" data-lot="${esc(lot.id)}"><div class="ledger-head">${title}</div>${lot.comment?`<div class="ledger-comment">💬 ${esc(lot.comment)}</div>`:''}<div class="ledger-sub">Acheté le ${esc(lot.date)} · ${fmtNum(lot.qty)} × ${fmt(lot.buy)} · Coût ${fmt(lot.qty*lot.buy)}</div><div class="ledger-sub">${left?`Restant : <b>${fmtNum(left)}</b> · Kamas en attente : <b>${fmt(left*lot.buy)}</b> · `:''}Gain réalisé : <b class="${p>0?'green':p<0?'red':''}">${ledgerSigned(p)}</b>${left?'':` <b class="${p>0?'green':p<0?'red':''}">(${ledgerSignedPercent(ledgerProfitPercent(lot))})</b>`}</div>${left?`<form class="ledger-sale" data-lsale="${esc(lot.id)}"><label>Quantité vendue<input name="qty" type="number" required min="1" max="${left}" step="1" value="${left}"></label><label>Prix de vente unitaire (K)<small>Taxe HDV de 2 % déduite du bénéfice</small><input name="price" type="number" required min="0" step="1" placeholder="Prix HDV"></label><div class="ledger-sale-actions"><button type="submit">Enregistrer la vente</button><button type="button" class="ledger-delete-button" data-ldel="${esc(lot.id)}">Supprimer le lot</button></div></form>`:`<div class="ledger-finished-actions"><span class="green">✓ Lot entièrement vendu</span><button type="button" class="ledger-delete-button" data-ldel="${esc(lot.id)}">Supprimer le lot</button></div>`}${lot.sales?.length?`<div class="ledger-history">${lot.sales.map(s=>`<div>↳ ${esc(s.date)} · ${fmtNum(s.qty)} vendu(s) à ${fmt(s.price)}/u · <span class="${ledgerSaleProfit(lot,s)>=0?'green':'red'}">${ledgerSigned(ledgerSaleProfit(lot,s))}</span></div>`).join('')}</div>`:''}</article>`;
}
function ledgerTileHTML(lot){
 const left=Math.max(0,Number(lot.qty)-ledgerSold(lot));
 const title=esc(lot.name),comment=esc(lot.comment||''),buyPrice=fmt(Number(lot.qty)*Number(lot.buy));
 const archived=left===0;
 const profit=archived?ledgerTotals([lot]).profit:0;
 const outcomeClass=archived?(profit>0?' ledger-tile-profit':profit<0?' ledger-tile-loss':''):'';
 const margin=archived?`${ledgerSigned(profit)} (${ledgerSignedPercent(ledgerProfitPercent(lot))})`:'';
 const icon=lot.image?`<img src="${esc(lot.image)}" alt="" loading="lazy">`:'<span class="ledger-tile-fallback" aria-hidden="true">📦</span>';
 return `<button type="button" class="ledger-tile${outcomeClass}" data-lopen="${esc(lot.id)}" aria-label="Voir le lot : ${title}" title="${title}${comment?` — ${comment}`:''} — Prix d’achat : ${buyPrice}${archived?` — Marge nette : ${margin}`:''}">${icon}<span class="ledger-tile-name">${title}</span><span class="ledger-tile-qty">${fmtNum(left||lot.qty)}</span><span class="ledger-tile-tip"><strong>${title}</strong>${comment?`<br>${comment}`:''}<br><span class="ledger-tile-buy">Prix d’achat : ${buyPrice}</span>${archived?`<br><span class="ledger-tile-margin ${profit>0?'green':profit<0?'red':'neutral'}">Marge nette : ${margin}</span>`:''}</span></button>`;
}
function ledgerOpenLot(id){
 const lot=ledger.find(l=>l.id===id);if(!lot)return;
 $('#ledgerModalContent').innerHTML=ledgerEntryHTML(lot);
 const dialog=$('#ledgerLotDialog');
 if(!dialog.open)dialog.showModal();
 ledgerBindActions(dialog);
}
function ledgerBindActions(scope){
 scope.querySelectorAll('[data-ldel]').forEach(b=>b.onclick=()=>{if(confirm('Supprimer cet achat et tout son historique de ventes ?')){ledger=ledger.filter(x=>x.id!==b.dataset.ldel);ledgerSave();$('#ledgerLotDialog').close();ledgerRender()}});
 scope.querySelectorAll('[data-lsale]').forEach(f=>f.onsubmit=e=>{e.preventDefault();const lot=ledger.find(x=>x.id===f.dataset.lsale);if(!lot)return;const qty=Number(f.elements.qty.value),price=Number(f.elements.price.value);if(!Number.isSafeInteger(qty)||qty<1||qty>lot.qty-ledgerSold(lot)||!Number.isFinite(price)||price<0){alert('Vérifie la quantité disponible et le prix de vente.');return}lot.sales.push({qty,price,date:new Date().toISOString().slice(0,10)});ledgerSave();$('#ledgerLotDialog').close();ledgerRender()});
}
$('#ledgerLotDialog .ledger-modal-close').onclick=()=>$('#ledgerLotDialog').close();
$('#ledgerLotDialog').addEventListener('click',e=>{if(e.target.id==='ledgerLotDialog')e.target.close()});
function ledgerMatchesQuery(lot,query){
 const normalized=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr');
 const words=normalized(query).trim().split(/\s+/).filter(Boolean);
 if(!words.length)return true;
 const haystack=normalized([lot.name,lot.comment,lot.date,lot.qty,lot.buy,...(lot.sales||[]).flatMap(s=>[s.date,s.qty,s.price])].join(' '));
 return words.every(word=>haystack.includes(word));
}
function ledgerRender(){
 const t=ledgerTotals(ledger);
 const profit=$('#ledgerProfit');profit.textContent=ledgerSigned(t.profit);profit.className=t.profit>0?'green':t.profit<0?'red':'neutral';
 $('#ledgerPending').textContent=fmt(t.pending);
 const active=ledger.filter(lot=>ledgerSold(lot)<Number(lot.qty));
 const archived=ledger.filter(lot=>ledgerSold(lot)>=Number(lot.qty));
 const filteredActive=active.filter(lot=>ledgerMatchesQuery(lot,$('#ledgerActiveSearch').value));
 const filteredArchived=archived.filter(lot=>ledgerMatchesQuery(lot,$('#ledgerArchivedSearch').value));
 $('#ledgerActiveCount').textContent=fmtNum(active.length);
 $('#ledgerArchivedCount').textContent=fmtNum(archived.length);
 $('#ledgerActiveMatches').textContent=active.length?`${fmtNum(filteredActive.length)} lot(s) affiché(s) sur ${fmtNum(active.length)}`:'';
 $('#ledgerArchivedMatches').textContent=archived.length?`${fmtNum(filteredArchived.length)} lot(s) trouvé(s) sur ${fmtNum(archived.length)}`:'';
 $('#ledgerEntries').innerHTML=filteredActive.length?`<div class="ledger-tiles">${filteredActive.slice().reverse().map(ledgerTileHTML).join('')}</div>`:`<div class="multi-empty">${active.length?'Aucun achat ne correspond à ta recherche.':'Aucun lot en cours.'}</div>`;
 $('#ledgerArchivedEntries').innerHTML=filteredArchived.length?`<div class="ledger-tiles">${filteredArchived.slice().reverse().map(ledgerTileHTML).join('')}</div>`:`<div class="multi-empty">${archived.length?'Aucun lot terminé ne correspond à ta recherche.':'Aucun lot terminé pour le moment.'}</div>`;
 document.querySelectorAll('[data-lopen]').forEach(b=>b.onclick=()=>ledgerOpenLot(b.dataset.lopen));
}
$('#ledgerActiveSearch').addEventListener('input',ledgerRender);
$('#ledgerArchivedSearch').addEventListener('input',()=>{if($('#ledgerArchivedSearch').value.trim())$('#ledgerArchive').open=true;ledgerRender()});
let ledgerSearchRequest=0,ledgerSearchResults=[];
const ledgerName=$('#ledgerName'),ledgerMatches=$('#ledgerMatches');
ledgerName.addEventListener('input',async()=>{
 const q=ledgerName.value.trim(),request=++ledgerSearchRequest;
 $('#ledgerItemId').value='';$('#ledgerItemImage').value='';
 ledgerMatches.innerHTML='';
 if(q.length<2)return;
 ledgerMatches.textContent='Recherche…';
 try{
  const data=await get('/items/search?'+new URLSearchParams({query:q,limit:'30'}));
  if(request!==ledgerSearchRequest)return;
  ledgerSearchResults=Array.isArray(data)?data:data.items||data.results||[];
  ledgerMatches.innerHTML=ledgerSearchResults.map((item,i)=>`<button type="button" class="ledger-match" data-ledger-pick="${i}">${img(item.item_fields||item)?`<img src="${esc(img(item.item_fields||item))}" alt="">`:''}<span>${esc(item.name)}</span></button>`).join('')||'<div class="muted">Aucun objet trouvé.</div>';
  ledgerMatches.querySelectorAll('[data-ledger-pick]').forEach(button=>button.onclick=()=>{
   const item=ledgerSearchResults[Number(button.dataset.ledgerPick)];
   ledgerName.value=item.name;$('#ledgerItemId').value=String(item.ankama_id??item.id??'');
   $('#ledgerItemImage').value=img(item.item_fields||item)||'';
   ++ledgerSearchRequest;ledgerMatches.innerHTML='';
  });
 }catch(error){if(request===ledgerSearchRequest)ledgerMatches.textContent='Recherche impossible : '+error.message}
});
$('#ledgerDate').value=new Date().toLocaleDateString('en-CA');
$('#ledgerForm').onsubmit=e=>{
 e.preventDefault();
 const name=ledgerName.value.trim(),itemId=$('#ledgerItemId').value,image=$('#ledgerItemImage').value,comment=$('#ledgerComment').value.trim();
 const qty=Number($('#ledgerQty').value),buy=Number($('#ledgerBuy').value),date=$('#ledgerDate').value;
 if(!name||!itemId){alert('Sélectionne un objet dans les résultats de recherche.');return}
 if(!Number.isSafeInteger(qty)||qty<1||!Number.isFinite(buy)||buy<0||!date)return;
 ledger.push({id:ledgerId(),name,itemId,image,comment,qty,buy,date,sales:[]});
 ledgerSave();$('#ledgerForm').reset();ledgerMatches.innerHTML='';++ledgerSearchRequest;
 $('#ledgerQty').value='1';$('#ledgerDate').value=new Date().toLocaleDateString('en-CA');ledgerRender();
};
ledgerRender();
customInit();

