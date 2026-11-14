// tools/forgemagie.js — La Foire du Tool V90
// XP Forgemagie — catalogue des runes usuelles, poids unitaires et variantes.
// Les prix sont volontairement indépendants des prix des objets : une rune est une entrée distincte.
// Catalogue explicite : seules les variantes réellement existantes sont proposées.
// Chaque valeur est le poids TOTAL de la rune, et non le poids d'un point de stat.
const FM_GROUPS=[
 ['Vi','Vitalité',[1,3,10]],['Ini','Initiative',[1,3,10]],['Pod','Pods',[2.5,7.5,25]],
 ['Fo','Force',[1,3,10]],['Ine','Intelligence',[1,3,10]],['Cha','Chance',[1,3,10]],['Age','Agilité',[1,3,10]],
 ['Sa','Sagesse',[3,9,30]],['Prospe','Prospection',[3,9]],['Pui','Puissance',[2,6,20]],
 ['Pi Per','Puissance pièges',[2,6,20]],['Pi','Dommages pièges',[5,15]],
 ['Do','Dommages',[20]],['Do Ren','Dommages renvoyés',[5]],
 ['Do Cri','Dommages critiques',[5,15]],['Do Pou','Dommages poussée',[5,15]],
 ['Do Terre','Dommages Terre',[5,15]],['Do Feu','Dommages Feu',[5,15]],['Do Eau','Dommages Eau',[5,15]],['Do Air','Dommages Air',[5,15]],['Do Neutre','Dommages Neutre',[5,15]],
 ['Ré Terre','Résistance Terre',[2,6]],['Ré Feu','Résistance Feu',[2,6]],['Ré Eau','Résistance Eau',[2,6]],['Ré Air','Résistance Air',[2,6]],['Ré Neutre','Résistance Neutre',[2,6]],
 ['Ré Per Terre','Résistance Terre %',[6]],['Ré Per Feu','Résistance Feu %',[6]],['Ré Per Eau','Résistance Eau %',[6]],['Ré Per Air','Résistance Air %',[6]],['Ré Per Neutre','Résistance Neutre %',[6]],
 ['Ré Cri','Résistance critiques',[2,6]],['Ré Pou','Résistance poussée',[2,6]],
 ['Cri','Coups critiques',[10]],['So','Soins',[10,30]],['Tac','Tacle',[4,12]],['Fui','Fuite',[4,12]],
 ['Ret Pa','Retrait PA',[7,21]],['Ret Pme','Retrait PM',[7,21]],['Ré Pa','Esquive PA',[7,21]],['Ré Pme','Esquive PM',[7,21]],
 ['Invo','Invocation',[30]],['Po','Portée',[51]],['Ga Pa','Point d’action',[100]],['Ga Pme','Point de mouvement',[90]],
 ['Do Per So','Dommages sorts %',[15]],['Do Per Ar','Dommages armes %',[15]],['Do Per Di','Dommages distance %',[15]],['Do Per Mé','Dommages mêlée %',[15]],
 ['Ré Per Di','Résistance distance %',[15]],['Ré Per Mé','Résistance mêlée %',[15]],['Chasse','Arme de chasse',[5]]
];
const fmRunes=FM_GROUPS.flatMap(([id,description,weights])=>weights.map((weight,index)=>{
 const prefix=id.startsWith('Ga ')?'':index===0?'':index===1?'Pa ':'Ra ';
 const name=id==='Chasse'?'Rune de Chasse':'Rune '+prefix+id;
 return {id:prefix+id,name,description,weight};
}));
// Icônes chargées à partir des ressources DofusDude ; aucune image fictive.
const fmIcons={};const FM_ICON_KEY='dofus-fm-icons-v1';
try{Object.assign(fmIcons,JSON.parse(localStorage.getItem(FM_ICON_KEY)||'{}'))}catch{}
function fmIconHTML(r){const url=fmIcons[r.id];return url?`<img class="fm-rune-icon" src="${esc(url)}" alt="" loading="lazy">`:'<span class="fm-rune-icon fm-icon-placeholder" aria-hidden="true">◇</span>'}
function fmRuneLabel(r){return `<span class="fm-rune-label" data-fm-icon="${esc(r.id)}">${fmIconHTML(r)}${itemNameHTML(r.name)}</span>`}
let fmIconsLoading=false;
async function fmLoadIcons(){
 if(fmIconsLoading)return;fmIconsLoading=true;
 // Recherches limitées et séquentielles par lots pour ne pas surcharger l’API.
 const missing=fmRunes.filter(r=>!(r.id in fmIcons));let cursor=0;
 async function worker(){while(cursor<missing.length){const r=missing[cursor++];try{
  const results=await get('/items/resources/search?'+new URLSearchParams({query:r.name,limit:'20'}));
  const entries=Array.isArray(results)?results:results.items||results.results||[];
  const found=entries.find(x=>fmNorm(x.name)===fmNorm(r.name));
  fmIcons[r.id]=found?img(found):'';
  if(fmIcons[r.id])document.querySelectorAll('[data-fm-icon]').forEach(el=>{if(el.dataset.fmIcon===r.id){const old=el.querySelector('.fm-rune-icon');if(old)old.outerHTML=fmIconHTML(r)}});
 }catch{fmIcons[r.id]=''}
 }}
 await Promise.all(Array.from({length:3},worker));
 try{localStorage.setItem(FM_ICON_KEY,JSON.stringify(fmIcons))}catch{}
 fmIconsLoading=false;
}
const FM_KEY='dofus-fm-rune-prices-v1';let fmPrices={};try{const data=JSON.parse(localStorage.getItem(FM_KEY)||'{}');if(data&&typeof data==='object'&&!Array.isArray(data))fmPrices=data}catch{}
// Le coût optimal d’une rune évoluée est le minimum entre son prix HDV
// et 3 fois le coût optimal du palier immédiatement inférieur.
const fmRuneById=new Map(fmRunes.map(r=>[r.id,r]));
function fmPreviousRune(r){
 const id=r.id;
 if(id.startsWith('Ra '))return fmRuneById.get('Pa '+id.slice(3))||null;
 if(id.startsWith('Pa '))return fmRuneById.get(id.slice(3))||null;
 return null;
}
function fmBuyPrice(r){const v=fmPrices[r.id];return v!==''&&v!=null&&Number.isFinite(Number(v))&&Number(v)>0?Number(v):null}
function fmBestCost(r){
 const buy=fmBuyPrice(r),previous=fmPreviousRune(r);
 const prevCost=previous?fmBestCost(previous):null;
 const craft=prevCost?3*prevCost.cost:null;
 if(buy===null&&craft===null)return null;
 if(craft!==null&&(buy===null||craft<buy))return {cost:craft,method:'craft',previous:previous.id};
 return {cost:buy,method:'buy',previous:null};
}
function fmRank(items){return items.filter(r=>fmBestCost(r)!==null).sort((a,b)=>b.weight/fmBestCost(b).cost-a.weight/fmBestCost(a).cost||a.name.localeCompare(b.name,'fr'))}
function fmFormatRatio(r){const best=fmBestCost(r);return best?(r.weight/best.cost*1000).toLocaleString('fr-FR',{maximumFractionDigits:3}):'—'}
function fmFormatCost(value){return Number(value).toLocaleString('fr-FR',{maximumFractionDigits:2})+' K'}
function fmMethod(r){const best=fmBestCost(r);if(!best)return '—';return best.method==='craft'?'<span class="fm-method fm-method-craft" title="Fabriquer avec 3 runes du palier précédent (au coût optimal)">Fabriquer</span>':'<span class="fm-method fm-method-buy">Acheter</span>'}
function fmRankTable(rows,limit=0){const ranked=fmRank(rows);if(!ranked.length)return '<p class="fm-empty">Renseigne des prix pour voir le classement.</p>';const shown=limit?ranked.slice(0,limit):ranked;return '<div class="fm-ranking-scroll"><table class="fm-ranking-table"><thead><tr><th>Rune / méthode</th><th>Poids / 1 000 K</th></tr></thead><tbody>'+shown.map(r=>`<tr><td title="${esc(r.description)}">${fmRuneLabel(r)}<div>${fmMethod(r)} · ${fmFormatCost(fmBestCost(r).cost)}</div></td><td>${fmFormatRatio(r)}</td></tr>`).join('')+'</tbody></table></div>'}
function fmRenderRanking(){for(const [selector,rows] of [['#fmRanking',fmRunes],['#fmLow',fmRunes.filter(r=>r.weight<=4)],['#fmHigh',fmRunes.filter(r=>r.weight>4)]])$(selector).innerHTML=fmRankTable(rows);fmRenderItemRanking()}
function fmUpdatePriceResults(){
 $('#fmPrices').querySelectorAll('[data-fm-cost]').forEach(cell=>{
  const r=fmRuneById.get(cell.dataset.fmCost),best=fmBestCost(r);
  cell.innerHTML=best?`${fmFormatCost(best.cost)}<div>${fmMethod(r)}</div>`:'—';
 });
 $('#fmPrices').querySelectorAll('[data-fm-ratio]').forEach(cell=>{
  const r=fmRuneById.get(cell.dataset.fmRatio);cell.textContent=fmFormatRatio(r);
 });
}
function fmRenderPrices(){const query=$('#fmSearch').value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const found=fmRunes.filter(r=>(r.name+' '+r.description).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(query));let previousFamily='';$('#fmPrices').innerHTML=found.map(r=>{const family=r.id.replace(/^(Pa |Ra )/,'');const header=family!==previousFamily?`<tr class="fm-family-heading"><td colspan="5">${esc(r.description)} <span>· ${esc(family)}</span></td></tr>`:'';previousFamily=family;return `${header}<tr><td title="${esc(r.description)}">${fmRuneLabel(r)}</td><td>${r.weight.toLocaleString('fr-FR')}</td><td><input type="number" min="0" step="1" inputmode="numeric" data-fm-price="${esc(r.id)}" data-price-key="fm:${esc(r.id)}" aria-label="Prix ${esc(r.name)}" placeholder="—" value="${fmPrices[r.id]??''}"></td><td data-fm-cost="${esc(r.id)}">—</td><td class="fm-ratio" data-fm-ratio="${esc(r.id)}">—</td></tr>`}).join('')||'<tr><td colspan="5">Aucune rune trouvée.</td></tr>';$('#fmPrices').querySelectorAll('[data-fm-price]').forEach(input=>input.addEventListener('input',()=>{const value=input.value;if(value==='')delete fmPrices[input.dataset.fmPrice];else if(Number.isFinite(Number(value))&&Number(value)>=0)fmPrices[input.dataset.fmPrice]=Number(value);localStorage.setItem(FM_KEY,JSON.stringify(fmPrices));fmUpdatePriceResults();fmRenderRanking()}));fmUpdatePriceResults()}
let fmEquipment=null,fmItemSeq=0,fmItemTimer=0,fmItemCandidates=[];
const fmNorm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
// Correspondance prudente : seules les caractéristiques présentes dans les effets de l'objet sont proposées.
const fmStatTerms=[
 [/vitalit/, 'Vi'],[/initiative/,'Ini'],[/pods?/,'Pod'],[/force/,'Fo'],[/intelligence/,'Ine'],[/chance/,'Cha'],[/agilite/,'Age'],[/sagesse/,'Sa'],[/prospection/,'Prospe'],[/puissance/,'Pui'],[/coup.? critique/,'Cri'],[/soins?/,'So'],[/tacle/,'Tac'],[/fuite/,'Fui'],[/portee/,'Po'],[/invocation/,'Invo'],[/point.? d.action/,'Ga Pa'],[/point.? de mouvement/,'Ga Pme'],[/retrait pa/,'Ret Pa'],[/retrait pm/,'Ret Pme'],[/esquive pa/,'Ré Pa'],[/esquive pm/,'Ré Pme'],[/dommages? critiques?/,'Do Cri'],[/dommages? poussee/,'Do Pou'],[/resistance.? poussee/,'Ré Pou'],[/resistance.? critiques?/,'Ré Cri'],[/dommages? terre/,'Do Terre'],[/dommages? feu/,'Do Feu'],[/dommages? eau/,'Do Eau'],[/dommages? air/,'Do Air'],[/dommages? neutre/,'Do Neutre'],[/resistance terre/,'Ré Terre'],[/resistance feu/,'Ré Feu'],[/resistance eau/,'Ré Eau'],[/resistance air/,'Ré Air'],[/resistance neutre/,'Ré Neutre'],[/dommages?/,'Do']
];
function fmEffectText(effect){const fields=[effect?.type?.name,effect?.type?.name_id,effect?.type?.name?.fr,effect?.name,effect?.description,effect?.formatted,effect?.effect?.name,effect?.effect?.name?.fr,effect?.effect?.name_id];return fields.map(v=>typeof v==='string'?v:'').join(' ')}
function fmApplicableRunes(item){
 // Réutilise exactement la détection des caractéristiques de l'onglet Brisage :
 // elle inspecte plusieurs emplacements de l'API et analyse chaque effet séparément.
 const detected=breakRuneGroups(item);
 const names=new Set(detected.flat().map(name=>fmNorm(name)));
 return fmRunes.filter(r=>names.has(fmNorm(r.id)));
}
function fmRenderItemRanking(){const el=$('#fmItemRanking');if(!fmEquipment){el.innerHTML='';return}const allRunes=fmApplicableRunes(fmEquipment);const basicOnly=$('#fmBasicOnly').checked;const runes=basicOnly?allRunes.filter(r=>!r.id.startsWith('Pa ')&&!r.id.startsWith('Ra ')):allRunes;el.innerHTML=runes.length?'<p class="fm-help">Runes correspondant aux lignes de caractéristiques détectées (prix renseignés uniquement). L’XP exacte n’est pas calculée.</p>'+fmRankTable(runes):'<p class="fm-empty">Impossible de déterminer les caractéristiques compatibles depuis les données de cet objet. Aucune rune n’est recommandée sans vérification.</p>'}
async function fmChooseItem(item){fmItemCandidates=[];$('#fmItemResults').innerHTML='';$('#fmItemSearch').value=item.name;$('#fmItemSelected').textContent='Chargement des caractéristiques…';const id=item.ankama_id??item.id;let detail=null;try{detail=await get('/items/equipment/'+id)}catch(e){$('#fmItemSelected').textContent='Impossible de charger les caractéristiques : '+e.message;return}fmEquipment=detail;$('#fmItemSelected').innerHTML=`<div class="fm-selected-item">${img(detail)?`<img class="fm-selected-icon" src="${esc(img(detail))}" alt="">`:''}<strong>${itemNameHTML(detail.name||item.name)}</strong></div>`;fmRenderItemRanking()}
async function fmSearchEquipment(){const query=$('#fmItemSearch').value.trim(),seq=++fmItemSeq,el=$('#fmItemResults');if(query.length<2){el.innerHTML='';return}el.textContent='Recherche…';try{const data=await get('/items/equipment/search?'+new URLSearchParams({query,limit:'25'}));if(seq!==fmItemSeq)return;fmItemCandidates=Array.isArray(data)?data:data.items||data.results||[];el.innerHTML=fmItemCandidates.map((x,i)=>`<button type="button" data-fm-item="${i}">${img(x.item_fields||x)?`<img src="${esc(img(x.item_fields||x))}" alt="">`:''}${esc(x.name)}</button>`).join('')||'<p class="fm-empty">Aucun équipement trouvé.</p>';el.querySelectorAll('[data-fm-item]').forEach(btn=>btn.onclick=()=>fmChooseItem(fmItemCandidates[Number(btn.dataset.fmItem)]))}catch(e){if(seq===fmItemSeq)el.textContent='Recherche impossible : '+e.message}}
$('#fmBasicOnly').addEventListener('change',fmRenderItemRanking);
$('#fmItemSearch').addEventListener('input',()=>{clearTimeout(fmItemTimer);fmItemTimer=setTimeout(fmSearchEquipment,300)});
function fmOpenGelano(event){
 if(event.key!=='Enter'||event.isComposing||event.repeat||fmNorm($('#fmSearch').value.trim())!=='gelano')return;
 event.preventDefault();window.location.href='gelano.html';
}
$('#fmSearch').addEventListener('keydown',fmOpenGelano);
$('#fmSearch').addEventListener('input',fmRenderPrices);fmRenderPrices();fmRenderRanking();fmLoadIcons();
if(typeof window!=='undefined'&&window.location?.hash==='#fm')switchMode('fm');
