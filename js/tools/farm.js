// tools/farm.js — La Foire du Tool V90
/* Farm : sessions chronométrées, prix partagés avec les autres outils */
const FARM_KEY='la-foire-du-tool-farm-v1',FARM_TIMER_KEY='la-foire-du-tool-farm-running-v1';
let farmManualOpen=false,farmEditingId=null;
let farmActivities=[],farmRunning=null,farmDraft=[],farmSearchResults=[],farmSearchSeq=0,farmSearchTimer=null,farmSelectedId=null,farmTicker=null;
try{const saved=JSON.parse(localStorage.getItem(FARM_KEY)||'[]');if(Array.isArray(saved))farmActivities=saved}catch{}
try{farmRunning=JSON.parse(localStorage.getItem(FARM_TIMER_KEY)||'null')}catch{}
const farmSave=()=>localStorage.setItem(FARM_KEY,JSON.stringify(farmActivities));
const farmSaveTimer=()=>{if(farmRunning)localStorage.setItem(FARM_TIMER_KEY,JSON.stringify(farmRunning));else localStorage.removeItem(FARM_TIMER_KEY)};
const farmId=()=>String(Date.now())+'-'+Math.random().toString(36).slice(2,9);
const farmElapsed=(timer,now=Date.now())=>Math.max(0,(timer.stoppedAt||timer.pausedAt||now)-timer.startedAt-(timer.pausedMs||0));
const farmSeconds=ms=>{const sec=Math.max(0,Math.floor(ms/1000));return [Math.floor(sec/3600),Math.floor(sec%3600/60),sec%60].map(n=>String(n).padStart(2,'0')).join(':')};
function farmTotals(activity){
 const sessions=activity.sessions||[],ms=sessions.reduce((v,s)=>v+s.duration,0),amounts={};
 for(const session of sessions)for(const [id,q] of Object.entries(session.counts||{}))amounts[id]=(amounts[id]||0)+Number(q||0);
 let revenue=0,complete=true;
 for(const [id,q] of Object.entries(amounts)){if(!q)continue;const p=prices[id];if(p===undefined||p===null||p===''){complete=false;continue}revenue+=Number(p)*q}
 return {ms,revenue,complete,kph:ms>0&&complete?revenue*3600000/ms:null,amounts};
}
const farmItemIcon=item=>item.image?`<img src="${esc(item.image)}" alt="">`:'<span aria-hidden="true">📦</span>';
function farmDraftRender(){
 $('#farmDraftItems').innerHTML=farmDraft.map((item,i)=>`<div class="farm-reward">${farmItemIcon(item)}<span>${esc(item.name)}</span><button type="button" data-farm-draft-remove="${i}" title="Retirer">✕</button></div>`).join('');
 $('#farmDraftItems').querySelectorAll('[data-farm-draft-remove]').forEach(b=>b.onclick=()=>{farmDraft.splice(Number(b.dataset.farmDraftRemove),1);farmDraftRender()});
}
async function farmSearchItems(){
 const query=$('#farmItemSearch').value.trim(),seq=++farmSearchSeq,container=$('#farmItemResults');
 if(query.length<2){container.innerHTML='';return}
 container.textContent='Recherche…';
 try{
  const data=await get('/items/search?'+new URLSearchParams({query,limit:'30'}));if(seq!==farmSearchSeq)return;
  farmSearchResults=Array.isArray(data)?data:data.items||data.results||[];
  container.innerHTML=farmSearchResults.map((item,i)=>`<button type="button" data-farm-pick="${i}">${img(item.item_fields||item)?`<img src="${esc(img(item.item_fields||item))}" alt="">`:''}<span>${esc(item.name)}</span></button>`).join('')||'<div class="farm-hint">Aucun objet trouvé.</div>';
  container.querySelectorAll('[data-farm-pick]').forEach(b=>b.onclick=()=>{const item=farmSearchResults[Number(b.dataset.farmPick)],id=String(item.ankama_id??item.id??'');if(!id)return;if(!farmDraft.some(x=>x.id===id))farmDraft.push({id,name:item.name,image:img(item.item_fields||item)});farmDraftRender();$('#farmItemSearch').value='';container.innerHTML='';++farmSearchSeq});
 }catch(e){if(seq===farmSearchSeq)container.textContent='Recherche impossible : '+e.message}
}
$('#farmItemSearch').addEventListener('input',()=>{clearTimeout(farmSearchTimer);farmSearchTimer=setTimeout(farmSearchItems,300)});
$('#farmCreate').onsubmit=e=>{
 e.preventDefault();const name=$('#farmName').value.trim(),description=$('#farmDescription').value.trim();
 if(!name||!farmDraft.length){alert('Renseigne un nom et au moins une récompense.');return}
 const activity={id:farmId(),name,description,items:farmDraft.map(x=>({...x})),sessions:[]};farmActivities.push(activity);farmSave();farmDraft=[];farmDraftRender();$('#farmCreate').reset();farmSelectedId=activity.id;farmRender();
};
function farmRender(){
 const sorted=[...farmActivities],sort=$('#farmSort').value;
 sorted.sort((a,b)=>sort==='name'?a.name.localeCompare(b.name,'fr'):sort==='sessions'?(b.sessions||[]).length-(a.sessions||[]).length:((farmTotals(b).kph??-1)-(farmTotals(a).kph??-1)));
 $('#farmActivityList').innerHTML=sorted.map(activity=>{const t=farmTotals(activity),running=farmRunning?.activityId===activity.id;
 return `<article class="farm-card"><div class="farm-card-heading"><h3>${esc(activity.name)} ${running?'⏱️':''}</h3><button type="button" class="farm-edit-icon" data-farm-edit="${esc(activity.id)}" title="Modifier le nom et la description" aria-label="Modifier ${esc(activity.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z"/></svg></button><span class="farm-card-icons">${activity.items.map(item=>`<span title="${esc(item.name)}">${farmItemIcon(item)}</span>`).join('')}</span></div>${farmEditingId===activity.id?`<form class="farm-edit-form" data-farm-edit-form="${esc(activity.id)}"><label>Nom de l'activité<input name="name" maxlength="100" required value="${esc(activity.name)}"></label><label>Description<textarea name="description" rows="3" maxlength="600">${esc(activity.description||'')}</textarea></label><div class="farm-actions"><button type="submit" class="active">Enregistrer</button><button type="button" data-farm-edit-cancel>Annuler</button></div></form>`:(activity.description?`<p>${esc(activity.description)}</p>`:'')}<div class="farm-metrics"><div class="farm-metric"><small>Kamas / heure</small><strong>${t.kph===null?'—':fmt(t.kph)}</strong></div><div class="farm-metric"><small>Sessions · temps total</small><strong>${(activity.sessions||[]).length} · ${farmSeconds(t.ms)}</strong></div></div><div class="farm-actions"><button type="button" data-farm-view="${esc(activity.id)}">Sélectionner l’activité</button><button type="button" data-farm-delete="${esc(activity.id)}" ${running?'disabled':''}>Supprimer</button></div></article>`}).join('')||'<div class="farm-hint">Aucune activité. Crée ta première activité pour commencer.</div>';
 $('#farmActivityList').querySelectorAll('[data-farm-edit]').forEach(b=>b.onclick=()=>{farmEditingId=farmEditingId===b.dataset.farmEdit?null:b.dataset.farmEdit;farmRender()});
 $('#farmActivityList').querySelectorAll('[data-farm-edit-cancel]').forEach(b=>b.onclick=()=>{farmEditingId=null;farmRender()});
 $('#farmActivityList').querySelectorAll('[data-farm-edit-form]').forEach(form=>form.onsubmit=e=>{e.preventDefault();const activity=farmActivities.find(a=>a.id===form.dataset.farmEditForm);if(!activity)return;const name=form.elements.name.value.trim();if(!name){alert('Renseigne un nom pour cette activité.');return}activity.name=name;activity.description=form.elements.description.value.trim();farmEditingId=null;farmSave();farmRender()});
 $('#farmActivityList').querySelectorAll('[data-farm-view]').forEach(b=>b.onclick=()=>{farmManualOpen=false;farmSelectedId=b.dataset.farmView;farmRenderSession()});
 $('#farmActivityList').querySelectorAll('[data-farm-delete]').forEach(b=>b.onclick=()=>{if(!confirm('Supprimer cette activité et toutes ses sessions ?'))return;farmActivities=farmActivities.filter(a=>a.id!==b.dataset.farmDelete);if(farmSelectedId===b.dataset.farmDelete)farmSelectedId=null;farmSave();farmRender()});
 if(!farmManualOpen)farmRenderSession();
}
function farmRenderManualSession(){
 const activity=farmActivities.find(a=>a.id===farmSelectedId),area=$('#farmSessionContent');
 if(!activity||farmRunning){farmManualOpen=false;farmRenderSession();return}
 area.innerHTML=`<h3>Déclarer une session — ${esc(activity.name)}</h3><p class="farm-hint">Enregistre une session déjà effectuée, sans lancer le chronomètre.</p><form id="farmManualForm"><div class="farm-manual-duration"><label>Heures<input name="hours" type="number" min="0" max="9999" step="1" value="1" required></label><label>Minutes<input name="minutes" type="number" min="0" max="59" step="1" value="0" required></label><label>Secondes<input name="seconds" type="number" min="0" max="59" step="1" value="0" required></label></div><h3>Récompenses obtenues</h3><div class="farm-session-quantities">${activity.items.map(item=>`<label>${farmItemIcon(item)}<span>${esc(item.name)}</span><input type="number" min="0" step="1" value="0" required data-farm-count="${esc(item.id)}"></label>`).join('')}</div><div class="farm-actions" style="margin-top:14px"><button type="submit" class="active">Enregistrer la session</button><button type="button" id="farmManualCancel">Annuler</button></div></form>`;
 $('#farmManualCancel').onclick=()=>{farmManualOpen=false;farmRenderSession()};
 $('#farmManualForm').onsubmit=e=>{
  e.preventDefault();const f=e.currentTarget;
  const h=Number(f.elements.hours.value),m=Number(f.elements.minutes.value),sec=Number(f.elements.seconds.value);
  if(!Number.isSafeInteger(h)||h<0||h>9999||!Number.isSafeInteger(m)||m<0||m>59||!Number.isSafeInteger(sec)||sec<0||sec>59){alert('Durée invalide.');return}
  const duration=((h*60+m)*60+sec)*1000;
  if(duration<=0){alert('La durée doit être supérieure à zéro.');return}
  const counts={};for(const input of f.querySelectorAll('[data-farm-count]')){const n=Number(input.value);if(!Number.isSafeInteger(n)||n<0){alert('Saisis des quantités entières positives.');return}counts[input.dataset.farmCount]=n}
  activity.sessions.push({id:farmId(),date:new Date().toISOString(),duration,counts});
  farmSave();farmManualOpen=false;farmRender();
 };
}
function farmRenderSession(){
 farmManualOpen=false;
 const area=$('#farmSessionContent');
 if(farmRunning){
  const activity=farmActivities.find(a=>a.id===farmRunning.activityId);
  if(!activity){farmRunning=null;farmSaveTimer();farmRender();return}
  farmSelectedId=activity.id;
  const elapsed=farmElapsed(farmRunning);
  area.innerHTML=`<div class="farm-running"><h3>${esc(activity.name)}</h3><div class="farm-timer" id="farmClock">${farmSeconds(elapsed)}</div><p class="farm-hint">${farmRunning.pausedAt?'Session en pause : le temps est arrêté.':'La session reste chronométrée même si tu actualises la page.'}</p><div class="farm-actions"><button id="farmPause" type="button">${farmRunning.pausedAt?'▶ Reprendre':'⏸ Mettre en pause'}</button><button id="farmStop" type="button">■ Arrêter la session</button></div></div>`;
  $('#farmPause').onclick=()=>{if(farmRunning.pausedAt){farmRunning.pausedMs=(farmRunning.pausedMs||0)+Date.now()-farmRunning.pausedAt;delete farmRunning.pausedAt}else farmRunning.pausedAt=Date.now();farmSaveTimer();farmRenderSession()};
  $('#farmStop').onclick=()=>{farmRunning.stoppedAt=farmRunning.pausedAt||Date.now();farmSaveTimer();farmRenderSession()};
  if(farmRunning.stoppedAt){
   const duration=Math.max(1000,farmElapsed(farmRunning));
   area.innerHTML=`<h3>${esc(activity.name)}</h3><div class="farm-timer">${farmSeconds(duration)}</div><p class="farm-hint">Combien de récompenses as-tu obtenues ?</p><form id="farmFinish"><div class="farm-session-quantities">${activity.items.map(item=>`<label>${farmItemIcon(item)}<span>${esc(item.name)}</span><input type="number" min="0" step="1" value="0" required data-farm-count="${esc(item.id)}"></label>`).join('')}</div><div class="farm-actions" style="margin-top:14px"><button type="submit" class="active">Enregistrer la session</button><button type="button" id="farmDiscard">Annuler la session</button></div></form>`;
   $('#farmFinish').onsubmit=e=>{e.preventDefault();const counts={};for(const el of area.querySelectorAll('[data-farm-count]')){const v=Number(el.value);if(!Number.isSafeInteger(v)||v<0){alert('Saisis des quantités entières positives.');return}counts[el.dataset.farmCount]=v}activity.sessions.push({id:farmId(),date:new Date(farmRunning.stoppedAt).toISOString(),duration,counts});farmRunning=null;farmSaveTimer();farmSave();farmRender()};
   $('#farmDiscard').onclick=()=>{if(confirm('Abandonner cette session sans enregistrer de récompenses ?')){farmRunning=null;farmSaveTimer();farmRender()}};
  }
  return;
 }
 const activity=farmActivities.find(a=>a.id===farmSelectedId);
 if(!activity){area.textContent='Choisis une activité pour démarrer une session.';return}
 const totals=farmTotals(activity);
 area.innerHTML=`<h3>${esc(activity.name)}</h3>${activity.description?`<p class="farm-hint">${esc(activity.description)}</p>`:''}<div class="farm-metrics"><div class="farm-metric"><small>Revenus estimés cumulés</small><strong>${totals.complete?fmt(totals.revenue):'Prix manquants'}</strong></div><div class="farm-metric"><small>Moyenne K / heure</small><strong>${totals.kph===null?'—':fmt(totals.kph)}</strong></div></div><div class="farm-session-actions"><button type="button" id="farmStartHere">▶ Lancer une session</button><button type="button" id="farmManualHere">＋ Déclarer une session</button></div><h3>Prix HDV des récompenses</h3><p class="farm-hint">Ces prix sont partagés avec le craft, le multicraft et le brisage.</p><div class="farm-prices">${activity.items.map(item=>`<div class="farm-reward">${farmItemIcon(item)}<span>${esc(item.name)}<br><small>Obtenu : ${totals.amounts[item.id]||0}</small></span><input type="number" min="0" step="1" placeholder="K / unité" aria-label="Prix de ${esc(item.name)}" data-farm-price="${esc(item.id)}" data-price-key="item:${esc(item.id)}" value="${prices[item.id]??''}"></div>`).join('')}</div><h3>Sessions enregistrées</h3><div class="farm-session-history">${(activity.sessions||[]).slice().reverse().map(session=>`<div>${new Date(session.date).toLocaleDateString('fr-FR')} · ${farmSeconds(session.duration)}<br>${activity.items.filter(item=>session.counts?.[item.id]).map(item=>`${esc(item.name)} × ${session.counts[item.id]}`).join(' · ')||'Aucune récompense'} <button type="button" data-farm-remove-session="${esc(session.id)}">Supprimer</button></div>`).join('')||'<p class="farm-hint">Aucune session terminée.</p>'}</div>`;
 $('#farmManualHere').onclick=()=>{farmManualOpen=true;farmRenderManualSession()};
 $('#farmStartHere').onclick=()=>{farmRunning={activityId:activity.id,startedAt:Date.now()};farmSaveTimer();farmRender()};
 area.querySelectorAll('[data-farm-price]').forEach(el=>el.oninput=()=>{if(el.value==='')delete prices[el.dataset.farmPrice];else if(Number.isFinite(Number(el.value))&&Number(el.value)>=0)prices[el.dataset.farmPrice]=Number(el.value);localStorage.setItem('dofusdude-prices',JSON.stringify(prices));farmRenderCardsOnly()});
 area.querySelectorAll('[data-farm-remove-session]').forEach(b=>b.onclick=()=>{if(!confirm('Supprimer cette session ?'))return;activity.sessions=activity.sessions.filter(x=>x.id!==b.dataset.farmRemoveSession);farmSave();farmRender()});
}
function farmRenderCardsOnly(){
 // Les prix se mettent à jour sans recréer le champ en cours de saisie.
 const activity=farmActivities.find(a=>a.id===farmSelectedId),t=activity?farmTotals(activity):null;
 if(t){const metrics=$('#farmSessionContent .farm-metrics');if(metrics){const values=metrics.querySelectorAll('strong');if(values[0])values[0].textContent=t.complete?fmt(t.revenue):'Prix manquants';if(values[1])values[1].textContent=t.kph===null?'—':fmt(t.kph)}}
 // Le classement est actualisé à la sortie du champ pour préserver le focus.
}
$('#farmSort').onchange=farmRender;
$('#farmSessionContent').addEventListener('focusout',e=>{if(e.target.matches('[data-farm-price]')&&e.relatedTarget?.closest?.('.price-age-wrap')!==e.target.parentElement)farmRender()});
function farmTick(){if(farmRunning&&!farmRunning.stoppedAt){const clock=$('#farmClock');if(clock)clock.textContent=farmSeconds(farmElapsed(farmRunning))}}
if(typeof setInterval==='function'){farmTicker=setInterval(farmTick,1000);farmRender();}

