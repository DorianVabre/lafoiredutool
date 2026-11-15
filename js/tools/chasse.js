// Chasse : API DofusDB, chargée uniquement à la demande.
(()=>{
 if(typeof document.getElementById!=='function')return;
 const el=id=>document.getElementById(id);if(!el('huntForm'))return;
 let direction=null,controller=null,revision=0,choices=[],target=null;
 const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const status=s=>{el('huntStatus').textContent=s};
 function clearResult(){target=null;el('huntResult').hidden=true;el('huntCommand').value='';el('huntCopyStatus').textContent=''}
 function invalidate(){revision++;controller?.abort();choices=[];clearResult();el('huntChoices').replaceChildren();el('huntClue').disabled=true;el('huntNext').disabled=true;el('huntLoad').disabled=false;status('Choisis une direction pour charger les indices.');}
 async function copy(automatic=false){
  const value=el('huntCommand').value,id=revision;if(!value)return;
  try{await navigator.clipboard.writeText(value);if(id===revision)el('huntCopyStatus').textContent='Commande copiée !'}
  catch{if(id!==revision)return;el('huntCopyStatus').textContent=automatic?'Copie automatique indisponible : clique sur Copier.':'Utilise Ctrl+C pour copier la commande sélectionnée.';if(!automatic){el('huntCommand').focus();el('huntCommand').select()}}
 }
 function choose(choice){clearResult();target=choice;el('huntResult').hidden=false;el('huntDestination').textContent=choice.name+' · ['+choice.x+','+choice.y+']';el('huntDistance').textContent=choice.distance+' map'+(choice.distance>1?'s':'')+' dans cette direction';el('huntCommand').value='/travel '+choice.x+','+choice.y;el('huntNext').disabled=false;void copy(true)}
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
  el('huntLoad').disabled=true;status('Recherche des indices…');
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
  }catch(error){if(id===revision)status('Impossible de charger les indices ('+(error.name==='AbortError'?'délai dépassé':error.message)+'). Réessaie ou consulte DofusDB.');}
  finally{clearTimeout(timer);if(id===revision)el('huntLoad').disabled=false}
 }
 el('huntForm').addEventListener('submit',load);
 document.querySelectorAll('[data-hunt-direction]').forEach(b=>b.addEventListener('click',()=>{direction=Number(b.dataset.huntDirection);document.querySelectorAll('[data-hunt-direction]').forEach(a=>{a.classList.toggle('active',a===b);a.setAttribute('aria-pressed',String(a===b))});return load()}));
 el('huntPosition').addEventListener('input',invalidate);
 el('huntClue').addEventListener('input',()=>{clearResult();el('huntNext').disabled=true;render()});
 el('huntClue').addEventListener('keydown',e=>{if(e.key!=='Enter')return;e.preventDefault();const q=normalize(el('huntClue').value),matches=choices.filter(c=>normalize(c.name).includes(q)),exact=matches.find(c=>normalize(c.name)===q);if(exact||matches.length===1)choose(exact||matches[0])});
 el('huntCopy').addEventListener('click',()=>copy());
 el('huntNext').addEventListener('click',()=>{if(!target)return;el('huntPosition').value='['+target.x+','+target.y+']';direction=null;document.querySelectorAll('[data-hunt-direction]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false')});el('huntClue').value='';invalidate();el('huntPosition').focus()});
})();
