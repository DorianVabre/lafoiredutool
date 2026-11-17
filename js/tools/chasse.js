// Chasse : API DofusDB, chargée uniquement à la demande.
(()=>{
 if(typeof document.getElementById!=='function')return;
 const el=id=>document.getElementById(id);if(!el('huntForm'))return;
 let direction=null,controller=null,revision=0,choices=[],target=null,selecting=false;
 const autoNext=el('huntAutoNext'),preferenceKey='lafoire-hunt-auto-next-v1';
 if(autoNext){autoNext.checked=true;try{autoNext.checked=localStorage.getItem(preferenceKey)!=='false'}catch{}}
 const minimap=window.DofusMinimap({position:()=>DofusRoutes.parseCoordinates(el('huntPosition').value),direction:()=>direction,selectPosition:position=>{el('huntPosition').value='['+position.x+','+position.y+']';minimap.clearLeg();invalidate()}});
 const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/œ/g,'oe').trim();
 const status=s=>{el('huntStatus').textContent=s};
 function clearResult(){target=null;el('huntDistance').hidden=true;el('huntResult').hidden=true;el('huntCommand').value='';el('huntCopyStatus').textContent=''}
 function invalidate(preserveResult=false){revision++;controller?.abort();choices=[];if(!preserveResult)clearResult();el('huntChoices').replaceChildren();el('huntClue').disabled=true;el('huntNext').disabled=true;el('huntForm').setAttribute('aria-busy','false');status('Choisis une direction pour charger les indices.');minimap.update();}
 function nextStep(preserveResult=false){if(!target)return;const destination=target;el('huntPosition').value='['+destination.x+','+destination.y+']';direction=null;document.querySelectorAll('[data-hunt-direction]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false')});el('huntClue').value='';invalidate(preserveResult);target=null;if(preserveResult)el('huntNext').hidden=true;el('huntPosition').focus();}
 async function copy(automatic=false){
  const value=el('huntCommand').value,id=revision;if(!value)return;
  try{await navigator.clipboard.writeText(value);if(id===revision){el('huntCopyStatus').textContent='Commande copiée !';if(autoNext?.checked&&target){nextStep(true);el('huntCopyStatus').textContent='Commande copiée ! Position mise à jour : choisis la direction suivante.'}}}
  catch{if(id!==revision)return;el('huntNext').hidden=false;el('huntCopyStatus').textContent=automatic?'Copie automatique indisponible : clique sur Copier.':'Utilise Ctrl+C pour copier la commande sélectionnée.';if(!automatic){el('huntCommand').focus();el('huntCommand').select()}}
 }
 async function choose(choice){if(selecting)return;selecting=true;revision++;clearResult();target=choice;el('huntResult').hidden=false;el('huntDestination').textContent=choice.name+' · ['+choice.x+','+choice.y+']';const heading={0:['→','est'],2:['↓','sud'],4:['←','ouest'],6:['↑','nord']}[direction];el('huntArrow').textContent=heading[0];el('huntMapCount').textContent=choice.distance+' map'+(choice.distance>1?'s':'');el('huntDistance').setAttribute('aria-label',choice.distance+' map'+(choice.distance>1?'s':'')+' vers le '+heading[1]);el('huntDistance').hidden=false;el('huntCommand').value='/travel '+choice.x+','+choice.y;el('huntNext').disabled=false;el('huntNext').hidden=!!autoNext?.checked;const from=DofusRoutes.parseCoordinates(el('huntPosition').value);if(from)minimap.setLeg(from,choice);try{await copy(true)}finally{selecting=false}}
 function render(){
  const query=normalize(el('huntClue').value),list=el('huntChoices');list.replaceChildren();
  const filtered=choices.filter(c=>normalize(c.name).includes(query));
  for(const c of filtered){const b=document.createElement('button');b.type='button';b.className='hunt-choice';const name=document.createElement('span'),distance=document.createElement('small');name.textContent=c.name;distance.textContent=c.distance+' map'+(c.distance>1?'s':'');b.append(name,distance);b.addEventListener('click',()=>choose(c));list.append(b)}
  if(!filtered.length){const p=document.createElement('p');p.textContent='Aucun indice correspondant. Vérifie le nom, la position et la direction.';list.append(p)}
 }
 async function load(event){
  event?.preventDefault();invalidate();
  const position=DofusRoutes.parseCoordinates(el('huntPosition').value);
  if(!position){status('Saisis une position entière, par exemple [-16,-24].');el('huntPosition').focus();return}
  if(direction===null){status('Choisis une direction sur la croix.');return}
  const id=revision;controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
  el('huntForm').setAttribute('aria-busy','true');status('Recherche des indices…');
  try{
   const rows=[];let skip=0;
   for(let page=0;page<20;page++){
    const params=new URLSearchParams({x:position.x,y:position.y,direction,$limit:50,$skip:skip});
    const response=await fetch('https://api.dofusdb.fr/treasure-hunt?'+params,{signal:controller.signal,headers:{Accept:'application/json'}});
    if(!response.ok)throw Error('HTTP '+response.status);
    const data=await response.json();if(!Array.isArray(data.data))throw Error('Réponse API invalide');rows.push(...data.data);skip+=data.data.length;
    if(!data.data.length||skip>=data.total)break;
    if(page===19)throw Error('Trop de résultats');
   }
   if(id!==revision)return;
   const nearest=new Map();
   for(const row of rows){const x=row.posX,y=row.posY,dx=x-position.x,dy=y-position.y,distance=Math.abs(dx)+Math.abs(dy);
    if(!Number.isSafeInteger(x)||!Number.isSafeInteger(y)||distance<1||distance>10||!(direction===0?dy===0&&dx>0:direction===2?dx===0&&dy>0:direction===4?dy===0&&dx<0:dx===0&&dy<0))continue;
    for(const poi of row.pois||[]){const name=poi.name?.fr;if(typeof name!=='string')continue;const old=nearest.get(poi.id);if(!old||distance<old.distance)nearest.set(poi.id,{name,x,y,distance})}
   }
   choices=[...nearest.values()].sort((a,b)=>a.name.localeCompare(b.name,'fr'));el('huntClue').value='';el('huntClue').disabled=false;render();status(choices.length+' indices disponibles dans cette direction.');el('huntClue').focus();
  }catch(error){if(id===revision)status('Impossible de charger les indices ('+(error.name==='AbortError'?'délai dépassé':error.message)+'). Clique à nouveau sur une flèche pour réessayer.');}
  finally{clearTimeout(timer);if(id===revision)el('huntForm').setAttribute('aria-busy','false')}
 }
 const compass=el('huntCompass'),secretSequence='6,6,2,2,4,0,4,0';
 let compassReady=false,compassInputs=[];
 if(compass)compass.disabled=true;
 function compassDirection(value){
  if(compassReady)return;
  compassInputs.push(value);compassInputs=compassInputs.slice(-8);
  if(compassInputs.join(',')!==secretSequence)return;
  compassReady=true;
  if(compass){compass.disabled=false;compass.classList.toggle('is-ready',true)}
 }
 compass?.addEventListener('click',()=>{if(compassReady)window.location.href='enquete.html'});
 el('huntForm').addEventListener('submit',load);
 document.querySelectorAll('[data-hunt-direction]').forEach(b=>b.addEventListener('click',()=>{direction=Number(b.dataset.huntDirection);compassDirection(direction);document.querySelectorAll('[data-hunt-direction]').forEach(a=>{a.classList.toggle('active',a===b);a.setAttribute('aria-pressed',String(a===b))});return load()}));
 el('huntPosition').addEventListener('input',()=>{minimap.clearLeg();invalidate()});
 el('huntClue').addEventListener('input',()=>{revision++;clearResult();el('huntNext').disabled=true;render()});
 el('huntClue').addEventListener('keydown',e=>{if(e.key!=='Enter')return;e.preventDefault();const q=normalize(el('huntClue').value),matches=choices.filter(c=>normalize(c.name).includes(q)),exact=matches.find(c=>normalize(c.name)===q);if(exact||matches.length===1)choose(exact||matches[0])});
 el('huntCopy').addEventListener('click',()=>copy());
 el('huntNext').addEventListener('click',()=>nextStep());
 autoNext?.addEventListener('change',()=>{try{localStorage.setItem(preferenceKey,String(autoNext.checked))}catch{}if(target)el('huntNext').hidden=autoNext.checked});


})();
