// Chasse : API DofusDB, chargée uniquement à la demande.
(()=>{
 if(typeof document.getElementById!=='function')return;
 const el=id=>document.getElementById(id);if(!el('huntForm'))return;
 let direction=null,controller=null,revision=0,choices=[],target=null,selecting=false;
 const autoNext=el('huntAutoNext'),preferenceKey='lafoire-hunt-auto-next-v1';
 if(autoNext){autoNext.checked=true;try{autoNext.checked=localStorage.getItem(preferenceKey)!=='false'}catch{}}
 const minimap=createMinimap(position=>{el('huntPosition').value='['+position.x+','+position.y+']';minimap.clearLeg();invalidate()});
 const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
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

 function createMinimap(selectPosition){
  const svg=el('huntMinimap'),caption=el('huntMapCaption');
  if(!svg||typeof document.createElementNS!=='function')return {update(){},setLeg(){},clearLeg(){}};
  // Géométrie publique DofusDB du monde 1, relevée le 16/11/2026 ; data/chasse-minimap.json.
  const world={x:6480,y:4944,cellX:69.5,cellY:49.70000076293945,width:10000,height:9664},W=640,H=360,tileSize=250,scales=[.2,.4,.6,.8,1],cache=new Map(),failed=new Set();
  let zoom=3,center=null,leg=null,drag=null,generation=0;
  const node=(tag,attributes={},text)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value] of Object.entries(attributes))n.setAttribute(key,String(value));if(text!==undefined)n.textContent=text;return n};
  const hoverLayer=node('g',{'pointer-events':'none','data-map-hover':'true'});
  const pixel=pos=>({x:world.x+(pos.x+.5)*world.cellX,y:world.y+(pos.y+.5)*world.cellY});
  const position=()=>DofusRoutes.parseCoordinates(el('huntPosition').value);
  function fit(){const pos=position();if(leg){const a=pixel(leg.from),b=pixel(leg.to);center={x:(a.x+b.x)/2,y:(a.y+b.y)/2}}else center=pixel(pos||{x:0,y:0});}
  function cellAt(p){if(!center)fit();if(p.x<0||p.y<0||p.x>W||p.y>H)return null;const x=center.x+(p.x-W/2)/scales[zoom],y=center.y+(p.y-H/2)/scales[zoom];return x>=0&&y>=0&&x<world.width&&y<world.height?{x:Math.floor((x-world.x)/world.cellX),y:Math.floor((y-world.y)/world.cellY)}:null}
  function cellRect(cell,attributes={}){const scale=scales[zoom];return node('rect',{x:(world.x+cell.x*world.cellX-center.x)*scale+W/2,y:(world.y+cell.y*world.cellY-center.y)*scale+H/2,width:world.cellX*scale,height:world.cellY*scale,'vector-effect':'non-scaling-stroke','pointer-events':'none','data-map-x':cell.x,'data-map-y':cell.y,...attributes})}
  function clearHover(){hoverLayer.replaceChildren()}
  function hover(event){const p=point(event),cell=cellAt(p);if(!cell){clearHover();return}const text='['+cell.x+','+cell.y+']',width=text.length*14+20,height=40,x=Math.max(4,Math.min(W-width-4,p.x+14)),y=Math.max(4,Math.min(H-height-4,p.y>=54?p.y-height-14:p.y+14));hoverLayer.replaceChildren(cellRect(cell,{'data-map-cell':'hover',fill:'#f7da79','fill-opacity':'.2',stroke:'#ffe6a0','stroke-width':1.5}),node('rect',{x,y,width,height,rx:6,fill:'#0c1711','fill-opacity':'.96',stroke:'#f7da79','stroke-width':1,'vector-effect':'non-scaling-stroke'}),node('text',{x:x+10,y:y+28,fill:'#fff5d7','font-size':24,'font-family':'system-ui, sans-serif','data-map-tooltip':'true'},text))}
  function draw(){
   if(!center)fit();const scale=scales[zoom],left=center.x*scale-W/2,top=center.y*scale-H/2,id=++generation,tiles=[],overlays=[],pos=position();
   let failures=0;const columns=Math.ceil(world.width*scale/tileSize),rows=Math.ceil(world.height*scale/tileSize);
   for(let y=Math.max(0,Math.floor(top/tileSize));y<=Math.min(rows-1,Math.floor((top+H)/tileSize));y++)for(let x=Math.max(0,Math.floor(left/tileSize));x<=Math.min(columns-1,Math.floor((left+W)/tileSize));x++){
    const url='https://api.dofusdb.fr/img/worlds/1/'+scale+'/'+(y*columns+x+1)+'.jpg';let tile=cache.get(url);
    if(!tile){tile=node('image',{href:url,width:tileSize,height:tileSize,'aria-hidden':'true'});cache.set(url,tile)}
    tile.setAttribute('x',x*tileSize-left);tile.setAttribute('y',y*tileSize-top);tile.onerror=()=>{failed.add(url);if(id===generation&&++failures===tiles.length)caption.textContent='Fond de carte indisponible. Les coordonnées et la recherche restent utilisables.'};if(failed.has(url))failures++;tiles.push(tile);
   }
   while(cache.size>60)cache.delete(cache.keys().next().value);
   const screen=p=>{const point=pixel(p);return {x:point.x*scale-left,y:point.y*scale-top}};
   const line=(a,b,attributes={})=>node('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,...attributes});
   const stepX=world.cellX*scale,stepY=world.cellY*scale;let grid='';for(let x=((world.x*scale-left)%stepX+stepX)%stepX;x<W;x+=stepX)grid+=`M ${x} 0 V ${H} `;for(let y=((world.y*scale-top)%stepY+stepY)%stepY;y<H;y+=stepY)grid+=`M 0 ${y} H ${W} `;
   overlays.push(node('path',{d:grid,fill:'none',stroke:'#08150e','stroke-opacity':'.75','stroke-width':scale>=.4?2:1.4,'vector-effect':'non-scaling-stroke','pointer-events':'none','data-map-grid':'outline'}),node('path',{d:grid,fill:'none',stroke:'#f6edcd','stroke-opacity':scale>=.4?'.5':'.35','stroke-width':.75,'vector-effect':'non-scaling-stroke','pointer-events':'none','data-map-grid':'lines'}));
   if(pos)overlays.push(cellRect(pos,{'data-map-cell':'current',fill:'#a8e87d','fill-opacity':'.18',stroke:'#c5ff98','stroke-width':2}));
   if(leg)overlays.push(cellRect(leg.to,{'data-map-cell':'destination',fill:'#f7da79','fill-opacity':'.12',stroke:'#f7da79','stroke-width':1.5}));
   if(pos&&direction!==null){const to={x:pos.x+(direction===0?10:direction===4?-10:0),y:pos.y+(direction===2?10:direction===6?-10:0)};overlays.push(line(screen(pos),screen(to),{stroke:'#e4c579','stroke-width':3,'stroke-dasharray':'8 6'}));}
   if(leg){const a=screen(leg.from),b=screen(leg.to);overlays.push(line(a,b,{stroke:'#f7da79','stroke-width':4}),node('circle',{cx:a.x,cy:a.y,r:7,fill:'#5aa7ff',stroke:'#102118','stroke-width':2}),node('path',{d:`M ${b.x} ${b.y-12} l 10 12 -10 12 -10 -12 Z`,fill:'#f7da79',stroke:'#102118','stroke-width':2}));}
   if(pos){const p=screen(pos);overlays.push(node('circle',{cx:p.x,cy:p.y,r:5,fill:'#fff',stroke:'#28482e','stroke-width':3}));}
   clearHover();svg.replaceChildren(node('rect',{width:W,height:H,fill:'#142019'}),...tiles,...overlays,hoverLayer);
   caption.textContent=(pos?'Position ['+pos.x+','+pos.y+']. ':'')+(leg?'Trajet ['+leg.from.x+','+leg.from.y+'] → ['+leg.to.x+','+leg.to.y+']. ':'')+'Clic : position · glisser : déplacer la carte.';
   if(tiles.length&&failures===tiles.length)caption.textContent='Fond de carte indisponible. Les coordonnées et la recherche restent utilisables.';
   el('huntMapZoomOut').disabled=zoom===0;el('huntMapZoomIn').disabled=zoom===scales.length-1;
  }
  function point(event){const rect=svg.getBoundingClientRect();return {x:(event.clientX-rect.left)*W/rect.width,y:(event.clientY-rect.top)*H/rect.height}}
  el('huntMapZoomOut').addEventListener('click',()=>{zoom=Math.max(0,zoom-1);draw()});el('huntMapZoomIn').addEventListener('click',()=>{zoom=Math.min(scales.length-1,zoom+1);draw()});el('huntMapCenter').addEventListener('click',()=>{fit();draw()});
  svg.addEventListener('pointerdown',event=>{if(event.button!==0)return;clearHover();if(!center)fit();drag={point:point(event),center:{...center},moved:false};svg.setPointerCapture?.(event.pointerId)});
  svg.addEventListener('pointermove',event=>{if(!drag){hover(event);return}const p=point(event),dx=p.x-drag.point.x,dy=p.y-drag.point.y;if(Math.abs(dx)+Math.abs(dy)>8)drag.moved=true;if(drag.moved){center={x:drag.center.x-dx/scales[zoom],y:drag.center.y-dy/scales[zoom]};draw()}});
  svg.addEventListener('pointerup',event=>{if(!drag)return;const previous=drag;drag=null;if(previous.moved)return;const cell=cellAt(point(event));if(cell)selectPosition(cell)});
  svg.addEventListener('pointerleave',clearHover);svg.addEventListener('pointercancel',()=>{drag=null;clearHover()});svg.addEventListener('lostpointercapture',()=>{drag=null;clearHover()});
  if(typeof IntersectionObserver==='function'){const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){draw();observer.disconnect()}});observer.observe(svg)}
  return {update(){fit();draw()},setLeg(from,to){leg={from:{...from},to:{...to}};fit();draw()},clearLeg(){leg=null}};
 }
})();
