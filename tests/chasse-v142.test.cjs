const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function app(fetch,options={}){
 const elements=new Map(),copies=[];
 const element=(tag='div')=>({tag,value:'',hidden:false,disabled:false,dataset:{},attributes:{},children:[],listeners:{},classList:{toggle(){},remove(){}},setAttribute(k,v){this.attributes[k]=String(v)},addEventListener(t,f){this.listeners[t]=f},replaceChildren(...children){this.children=children},append(...v){this.children.push(...v)},getBoundingClientRect(){return options.rect||{left:0,top:0,width:640,height:360}},focus(){},select(){this.selected=true}});
 const el=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id)};
 const arrows=[0,2,4,6].map(n=>Object.assign(element(),{dataset:{huntDirection:String(n)}}));
 const document={getElementById:el,querySelectorAll:()=>arrows,createElement:element};
 if(options.minimap)document.createElementNS=(_,tag)=>element(tag);
 const window={location:{href:"index.html"}};
 const storage=options.storage||new Map();
 const ctx=vm.createContext({window,document,fetch,URLSearchParams,AbortController,setTimeout,clearTimeout,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},navigator:{clipboard:{async writeText(v){if(options.writeText)await options.writeText(v);copies.push(v)}}}});
 vm.runInContext(fs.readFileSync('js/tools/trajets-engine.js','utf8'),ctx);vm.runInContext(fs.readFileSync('js/tools/chasse.js','utf8'),ctx);
 return {el,copies,arrows,window,storage,async load(){el('huntPosition').value='[-16,-24]';await arrows[0].listeners.click()}};
}
const row=(x,y,id,name)=>({posX:x,posY:y,pois:[{id,name:{fr:name}}]});
test('indices : plus proche, filtre direction/distance, accents, copie et étape suivante',async()=>{
 const a=app(async()=>({ok:true,json:async()=>({total:5,data:[row(-14,-24,1,'Étoile'),row(-15,-24,1,'Étoile'),row(-16,-25,2,'Nord'),row(-5,-24,3,'Trop loin'),row(-13,-24,4,'Crâne')]})}));
 a.el('huntAutoNext').checked=false;
 await a.load();assert.equal(a.el('huntChoices').children.length,2);
 a.el('huntClue').value='etoile';a.el('huntClue').listeners.input();assert.equal(a.el('huntChoices').children.length,1);
 a.el('huntChoices').children[0].listeners.click();await Promise.resolve();assert.equal(a.copies.at(-1),'/travel -15,-24');
 a.el('huntNext').listeners.click();assert.equal(a.el('huntPosition').value,'[-15,-24]');assert.equal(a.el('huntResult').hidden,true);
});

test('V174 : enchaînement coché par défaut, copie puis nouvelle position, nouvelle recherche depuis cette position',async()=>{const requests=[],a=app(async url=>{requests.push(url);const south=new URL(url).searchParams.get('direction')==='2';return {ok:true,json:async()=>({total:1,data:[south?row(-15,-23,2,'Arbre'):row(-15,-24,1,'Étoile')]})}});assert.equal(a.el('huntAutoNext').checked,true);await a.load();await a.el('huntChoices').children[0].listeners.click();assert.equal(a.el('huntPosition').value,'[-15,-24]');assert.equal(a.copies.at(-1),'/travel -15,-24');assert.equal(a.el('huntCommand').value,'/travel -15,-24');assert.equal(a.el('huntChoices').children.length,0);assert.equal(a.el('huntClue').disabled,true);assert.equal(a.el('huntNext').hidden,true);await a.arrows[1].listeners.click();assert.match(requests.at(-1),/x=-15&y=-24&direction=2/);await a.el('huntChoices').children[0].listeners.click();assert.equal(a.el('huntPosition').value,'[-15,-23]');assert.equal(a.copies.at(-1),'/travel -15,-23')});

test('V174 : refus de presse-papier sans avancer, puis copie manuelle réussie',async()=>{let blocked=true;const a=app(async()=>({ok:true,json:async()=>({total:1,data:[row(-15,-24,1,'Étoile')]})}),{writeText:async()=>{if(blocked)throw Error('Refus')}});await a.load();await a.el('huntChoices').children[0].listeners.click();assert.equal(a.el('huntPosition').value,'[-16,-24]');assert.equal(a.el('huntNext').hidden,false);assert.match(a.el('huntCopyStatus').textContent,/indisponible/);blocked=false;await a.el('huntCopy').listeners.click();assert.equal(a.el('huntPosition').value,'[-15,-24]');assert.equal(a.copies.length,1)});

test('V174 : une copie retardée ne remplace pas une position saisie entre-temps et préférence mémorisée',async()=>{let finish;const a=app(async()=>({ok:true,json:async()=>({total:1,data:[row(-15,-24,1,'Étoile')]})}),{writeText:()=>new Promise(resolve=>finish=resolve)});await a.load();const choosing=a.el('huntChoices').children[0].listeners.click();a.el('huntPosition').value='[1,2]';a.el('huntPosition').listeners.input();finish();await choosing;assert.equal(a.el('huntPosition').value,'[1,2]');assert.equal(a.el('huntResult').hidden,true);a.el('huntAutoNext').checked=false;a.el('huntAutoNext').listeners.change();assert.equal(app(async()=>{}, {storage:a.storage}).el('huntAutoNext').checked,false)});

test('V174 : tuiles géoréférencées, zoom, clic sur une case, glisser sans modifier la position',async()=>{const a=app(async()=>({ok:true,json:async()=>({total:1,data:[row(-15,-24,1,'Étoile')]})}),{minimap:true});await a.load();const map=a.el('huntMinimap'),tiles=()=>map.children.filter(n=>n.tag==='image');assert.equal(tiles()[0].attributes.href,'https://api.dofusdb.fr/img/worlds/1/0.8/369.jpg');assert.ok(tiles().every(t=>Number.isFinite(Number(t.attributes.x))&&Number.isFinite(Number(t.attributes.y))));a.el('huntMapZoomIn').listeners.click();assert.match(tiles()[0].attributes.href,/\/1\//);const event=(x,y)=>({button:0,pointerId:1,clientX:x,clientY:y});map.listeners.pointerdown(event(320+69.5,180));map.listeners.pointerup(event(320+69.5,180));assert.equal(a.el('huntPosition').value,'[-15,-24]');map.listeners.pointerdown(event(320,180));map.listeners.pointermove(event(380,180));map.listeners.pointerup(event(380,180));assert.equal(a.el('huntPosition').value,'[-15,-24]');a.el('huntMapCenter').listeners.click();assert.match(a.el('huntMapCaption').textContent,/Position \[-15,-24\]/)});

test('V174 : le dernier trajet reste visible après l’enchaînement, une panne du fond ne bloque pas la copie',async()=>{const a=app(async()=>({ok:true,json:async()=>({total:1,data:[row(-15,-24,1,'Étoile')]})}),{minimap:true});await a.load();for(const tile of a.el('huntMinimap').children.filter(n=>n.tag==='image'))tile.onerror();assert.match(a.el('huntMapCaption').textContent,/indisponible/);await a.el('huntChoices').children[0].listeners.click();assert.equal(a.el('huntPosition').value,'[-15,-24]');assert.equal(a.copies[0],'/travel -15,-24');assert.ok(a.el('huntMinimap').children.some(n=>n.tag==='path'));const snapshot=JSON.parse(fs.readFileSync('data/chasse-minimap.json','utf8'));assert.equal(snapshot.world.mapWidth,69.5);assert.equal(snapshot.world.totalWidth,10000)});

test('V175 : survol et clic désignent la même map, tooltip sans recharger les tuiles et sélection persistante',async()=>{let requests=0;const a=app(async()=>{requests++;return {ok:true,json:async()=>({total:0,data:[]})}},{minimap:true,rect:{left:10,top:20,width:320,height:180}});await a.load();const map=a.el('huntMinimap'),children=map.children,hoverLayer=()=>map.children.find(n=>n.attributes['data-map-hover']==='true'),cell=kind=>map.children.find(n=>n.attributes['data-map-cell']===kind),event={button:0,pointerId:1,clientX:185,clientY:110};assert.equal(cell('current').attributes['data-map-x'],'-16');assert.equal(Number(cell('current').attributes.width),69.5*.8);map.listeners.pointermove(event);assert.equal(map.children,children);assert.equal(requests,1);assert.equal(hoverLayer().children.find(n=>n.attributes['data-map-tooltip']==='true').textContent,'[-15,-24]');assert.equal(hoverLayer().children[0].attributes['data-map-x'],'-15');assert.equal(a.el('huntPosition').value,'[-16,-24]');map.listeners.pointerdown(event);map.listeners.pointerup(event);assert.equal(a.el('huntPosition').value,'[-15,-24]');assert.equal(cell('current').attributes['data-map-x'],'-15');map.listeners.pointermove(event);map.listeners.pointerleave();assert.equal(hoverLayer().children.length,0);assert.equal(cell('current').attributes['data-map-x'],'-15');assert.doesNotMatch(fs.readFileSync('index.html','utf8'),/id="huntLoad"/)});

test('V175 : grille à chaque zoom, pas de tooltip pendant le glissement ni hors de la carte',async()=>{const a=app(async()=>({ok:true,json:async()=>({total:0,data:[]})}),{minimap:true});await a.load();const map=a.el('huntMinimap'),hover=()=>map.children.find(n=>n.attributes['data-map-hover']==='true'),event=(x,y)=>({button:0,pointerId:1,clientX:x,clientY:y});for(let i=0;i<3;i++)a.el('huntMapZoomOut').listeners.click();assert.ok(map.children.some(n=>n.attributes['data-map-grid']==='lines'));map.listeners.pointermove(event(320,180));assert.equal(hover().children.find(n=>n.tag==='text').textContent,'[-16,-24]');map.listeners.pointerdown(event(320,180));map.listeners.pointermove(event(380,180));assert.equal(hover().children.length,0);map.listeners.pointerup(event(380,180));assert.equal(a.el('huntPosition').value,'[-16,-24]');map.listeners.pointermove(event(-10,180));assert.equal(hover().children.length,0)});
test('une réponse arrivée après modification de position ne doit pas afficher de commande',async()=>{
 let resolve;const a=app(()=>new Promise(r=>{resolve=r}));const pending=a.load();await Promise.resolve();a.el('huntPosition').listeners.input();resolve({ok:true,json:async()=>({total:1,data:[row(-15,-24,1,'Étoile')]})});await pending;assert.equal(a.el('huntResult').hidden,true);assert.deepEqual(a.copies,[]);
});
test('erreur API : nouvelle tentative sur la flèche et état de chargement rétabli',async()=>{
 let requests=0;const a=app(async()=>{requests++;return {ok:false,status:403}});await a.load();assert.match(a.el('huntStatus').textContent,/HTTP 403/);assert.equal(a.el('huntForm').attributes['aria-busy'],'false');await a.arrows[0].listeners.click();assert.equal(requests,2);assert.deepEqual(a.copies,[]);
});


test('V144 : rose inerte avant le code complet, erreur puis nouvelle séquence, accès en un clic',async()=>{
 const a=app(async()=>{throw Error('Aucun appel attendu sans position')});
 const rose=a.el('huntCompass');assert.equal(rose.disabled,true);
 rose.listeners.click();rose.listeners.click();rose.listeners.click();assert.equal(a.window.location.href,'index.html');
 async function press(values){for(const value of values)await a.arrows.find(b=>Number(b.dataset.huntDirection)===value).listeners.click()}
 await press([6,6,2,2,4,0,4]);assert.equal(rose.disabled,true);
 await press([6,0]);assert.equal(rose.disabled,true);
 await press([6,6,2,2,4,0,4]);assert.equal(rose.disabled,true);
 await press([0]);assert.equal(rose.disabled,false);assert.equal(a.window.location.href,'index.html');
 await press([6]);assert.equal(rose.disabled,false);
 rose.listeners.click();assert.equal(a.window.location.href,'enquete.html');
});
