const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function app(fetch){
 const elements=new Map(),copies=[];
 const element=()=>({value:'',hidden:false,disabled:false,dataset:{},children:[],listeners:{},classList:{toggle(){},remove(){}},setAttribute(){},addEventListener(t,f){this.listeners[t]=f},replaceChildren(){this.children=[]},append(...v){this.children.push(...v)},focus(){},select(){this.selected=true}});
 const el=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id)};
 const arrows=[0,2,4,6].map(n=>Object.assign(element(),{dataset:{huntDirection:String(n)}}));
 const document={getElementById:el,querySelectorAll:()=>arrows,createElement:element};
 const ctx=vm.createContext({document,fetch,URLSearchParams,AbortController,setTimeout,clearTimeout,navigator:{clipboard:{async writeText(v){copies.push(v)}}}});
 vm.runInContext(fs.readFileSync('js/tools/trajets-engine.js','utf8'),ctx);vm.runInContext(fs.readFileSync('js/tools/chasse.js','utf8'),ctx);
 return {el,copies,async load(){el('huntPosition').value='[-16,-24]';await arrows[0].listeners.click()}};
}
const row=(x,y,id,name)=>({posX:x,posY:y,pois:[{id,name:{fr:name}}]});
test('indices : plus proche, filtre direction/distance, accents, copie et étape suivante',async()=>{
 const a=app(async()=>({ok:true,json:async()=>({total:5,data:[row(-14,-24,1,'Étoile'),row(-15,-24,1,'Étoile'),row(-16,-25,2,'Nord'),row(-5,-24,3,'Trop loin'),row(-13,-24,4,'Crâne')]})}));
 await a.load();assert.equal(a.el('huntChoices').children.length,2);
 a.el('huntClue').value='etoile';a.el('huntClue').listeners.input();assert.equal(a.el('huntChoices').children.length,1);
 a.el('huntChoices').children[0].listeners.click();await Promise.resolve();assert.equal(a.copies.at(-1),'/travel -15,-24');
 a.el('huntNext').listeners.click();assert.equal(a.el('huntPosition').value,'[-15,-24]');assert.equal(a.el('huntResult').hidden,true);
});
test('une réponse arrivée après modification de position ne doit pas afficher de commande',async()=>{
 let resolve;const a=app(()=>new Promise(r=>{resolve=r}));const pending=a.load();await Promise.resolve();a.el('huntPosition').listeners.input();resolve({ok:true,json:async()=>({total:1,data:[row(-15,-24,1,'Étoile')]})});await pending;assert.equal(a.el('huntResult').hidden,true);assert.deepEqual(a.copies,[]);
});
test('erreur API : message et bouton de nouvelle tentative',async()=>{
 const a=app(async()=>({ok:false,status:403}));await a.load();assert.match(a.el('huntStatus').textContent,/HTTP 403/);assert.equal(a.el('huntLoad').disabled,false);assert.deepEqual(a.copies,[]);
});
