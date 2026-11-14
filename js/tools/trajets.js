// Interface indépendante : les données de déplacement sont chargées au premier calcul.
(()=>{
 if(typeof document.getElementById!=='function')return;
 const form=document.getElementById('travelForm');if(!form)return;
 const el=id=>document.getElementById(id),key='la-foire-du-tool-trajets-v1';
 let engine=null,pending=null,current=null,target=null,request=0,copyRequest=0,zaapCommand='',excluded=new Set();
 try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(Array.isArray(saved?.excluded))excluded=new Set(saved.excluded.filter(Number.isSafeInteger));if(typeof saved?.destination==='string')el('travelCoordinates').value=saved.destination}catch{}
 const coord=n=>'['+n[3]+','+n[4]+']';
 const area=n=>engine.data.areas[n[5]]||'Zone inconnue';
 function message(text){el('travelStatus').textContent=text}
 function save(){try{localStorage.setItem(key,JSON.stringify({destination:el('travelCoordinates').value,excluded:[...excluded]}))}catch{}}
 function clear(){target=null;current=null;copyRequest++;zaapCommand='';el('travelCopyZaapOnly').hidden=true;el('travelCombinedCommand').value='';el('travelResult').hidden=true;el('travelCopyStatus').textContent=''}
 async function copyCommand(automatic=false,zaapOnly=false){
  const input=el('travelCombinedCommand'),value=zaapOnly?zaapCommand:input.value,id=++copyRequest;
  if(!value||el('travelCommands').hidden)return;
  try{await navigator.clipboard.writeText(value);if(id===copyRequest)el('travelCopyStatus').textContent=zaapOnly?'Commande /zaap copiée.':'Commande combinée copiée.'}
  catch{if(id!==copyRequest)return;if(automatic)el('travelCopyStatus').textContent='Copie automatique indisponible. Clique sur Copier la commande.';else{input.focus();if(zaapOnly)input.setSelectionRange(0,value.length);else input.select();el('travelCopyStatus').textContent='Commande'+(zaapOnly?' /zaap':'')+' sélectionnée : utilise Ctrl+C pour la copier.'}}
 }
 function button(text,action){const b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',action);return b}
 function settings(){
  const list=el('travelZaaps');list.replaceChildren();
  engine.data.zaaps.forEach(z=>{const n=engine.data.nodes[z.node],label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=!excluded.has(n[0]);input.dataset.map=n[0];input.addEventListener('change',()=>{if(input.checked)excluded.delete(n[0]);else excluded.add(n[0]);save();if(target!==null)render(target)});label.append(input,document.createTextNode(z.name+' '+coord(n)));list.append(label)});
 }
 async function load(){
  if(engine)return engine;
  if(!pending)pending=(async()=>{const data=await DofusRoutes.loadData(document);engine=DofusRoutes.create(data);settings();el('travelDataVersion').textContent='Données Dofus '+data.version+' · '+data.zaaps.length+' zaaps pris en compte.';return engine})().catch(error=>{pending=null;engine=null;throw error});
  return pending;
 }
 function render(indices,chosen){
  target=indices;current=engine.search(indices,excluded);
  copyRequest++;zaapCommand='';el('travelCopyZaapOnly').hidden=true;el('travelCombinedCommand').value='';el('travelResult').hidden=false;el('travelCommands').hidden=true;el('travelAlternatives').replaceChildren();el('travelCopyStatus').textContent='';
  el('travelTargetLabel').textContent=coord(engine.data.nodes[indices[0]]);
  if(!current.options.length){el('travelBestZaap').textContent='Aucun trajet trouvé';el('travelSteps').textContent='—';message(engine.data.zaaps.every(z=>excluded.has(engine.data.nodes[z.node][0]))?'Sélectionne au moins un zaap dans « Zaaps à utiliser ».':'Aucun des zaaps sélectionnés ne rejoint cette destination avec les accès pris en compte. Un passage particulier peut être nécessaire.');el('travelInteractionNote').textContent='';return}
  const option=current.options.find(z=>z.node===chosen)||current.options[0],zn=engine.data.nodes[option.node],route=current.route(option.node),n=engine.data.nodes[route.path[route.path.length-1]];
  el('travelTargetLabel').textContent=area(n)+' '+coord(n);
  el('travelBestZaap').textContent=option.name+' '+coord(zn);el('travelSteps').textContent=option.steps+' changement'+(option.steps>1?'s':'')+' de map';
  zaapCommand='/zaap '+zn[3]+','+zn[4];el('travelCopyZaapOnly').hidden=false;
  el('travelCombinedCommand').value=zaapCommand+' ; /travel '+n[3]+','+n[4];el('travelCommands').hidden=false;
  el('travelInteractionNote').textContent=route.interactions?'Ce parcours comprend '+route.interactions+' passage'+(route.interactions>1?'s':'')+' par un élément interactif (porte, entrée…). Une action manuelle peut être nécessaire.':'';
  message('');
  for(const alternative of current.options.slice(0,3)){const an=engine.data.nodes[alternative.node],b=button(alternative.name+' '+coord(an)+' · '+alternative.steps+' map'+(alternative.steps>1?'s':''),()=>render(indices,alternative.node));b.classList.toggle('active',alternative.node===option.node);el('travelAlternatives').append(b)}
  void copyCommand(true);
 }
 async function calculate(event){
  event.preventDefault();const id=++request;clear();
  const position=DofusRoutes.parseCoordinates(el('travelCoordinates').value);
  if(!position){message('Saisis deux coordonnées entières, par exemple [-6,-3], -6,-3 ou -6 -3.');el('travelCoordinates').focus();return}
  el('travelSubmit').disabled=true;message('Recherche du meilleur trajet…');
  try{
   await load();if(id!==request)return;save();
   const candidates=engine.candidates(position.x,position.y,Number(el('travelWorld').value));
   if(!candidates.length){message('Aucune carte trouvée ici dans le monde choisi. Vérifie les coordonnées ou choisis un autre monde. Certaines cartes ne disposent pas de trajet connu.');return}
   render(candidates);
  }catch(error){message('Impossible de calculer le trajet. '+error.message+' Réessaie dans un instant.')}finally{if(id===request)el('travelSubmit').disabled=false}
 }
 form.addEventListener('submit',calculate);
 function invalidate(){request++;clear();message('');el('travelSubmit').disabled=false}
 el('travelCoordinates').addEventListener('input',invalidate);el('travelWorld').addEventListener('change',invalidate);
 el('travelAllZaaps').addEventListener('click',()=>{if(!engine)return;excluded.clear();settings();save();if(target!==null)render(target)});
 el('travelNoZaaps').addEventListener('click',()=>{if(!engine)return;excluded=new Set(engine.data.zaaps.map(z=>engine.data.nodes[z.node][0]));settings();save();if(target!==null)render(target)});
 el('travelCopyCommand').addEventListener('click',()=>copyCommand());
 el('travelCopyZaapOnly').addEventListener('click',()=>copyCommand(false,true));
 // Les mondes restent disponibles sans charger le graphe au démarrage du site.
 el('travelZaapSettings').addEventListener('toggle',async()=>{if(!el('travelZaapSettings').open||engine)return;try{await load()}catch(error){message('Impossible de charger les zaaps. '+error.message)}});
})();
