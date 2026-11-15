const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),E=require('../js/games/concasseur-engine.js');
function app(){
 const nodes=new Map(),documentEvents={},windowEvents={},frames=new Map();let now=0,frameId=0,state,animations=0;
 function node(){const parts=new Map();return {children:[],dataset:{},style:{},hidden:false,disabled:false,textContent:'',innerHTML:'',listeners:{},offsetTop:400,offsetHeight:40,classList:{values:new Set(),add(...keys){keys.forEach(k=>this.values.add(k))},remove(...keys){keys.forEach(k=>this.values.delete(k))},toggle(k,on){if(on)this.values.add(k);else this.values.delete(k)}},setAttribute(){},addEventListener(type,fn){this.listeners[type]=fn},append(el){this.children.push(el)},replaceChildren(){this.children=[]},remove(){},focus(){},animate(){animations++},querySelector(selector){if(!parts.has(selector))parts.set(selector,node());return parts.get(selector)}}}
 const el=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)},lanes=Array.from({length:5},()=>node()),cells=E.ITEMS.map(item=>Object.assign(node(),{dataset:{coeff:item.id},parentElement:node()}));el('gameBoard').querySelectorAll=()=>lanes;
 const engine={...E,create(){state=E.create(()=>.5);state.notes=[...E.ITEMS.map((item,lane)=>({id:lane+1,item:item.id,lane,cat:false,at:1000,travel:1800,done:false})),{id:6,item:'strigide',lane:0,cat:false,at:1500,travel:1800,done:false}];return state}};
 const ctx=vm.createContext({ConcasseurEngine:engine,document:{getElementById:el,querySelectorAll:()=>cells,createElement:node,addEventListener(t,f){documentEvents[t]=f},hidden:false},window:{addEventListener(t,f){windowEvents[t]=f},matchMedia:()=>({matches:false})},performance:{now:()=>now,timeOrigin:1700000000000},localStorage:{getItem(){return null},setItem(){}},requestAnimationFrame(fn){frames.set(++frameId,fn);return frameId},cancelAnimationFrame(id){frames.delete(id)}});
 vm.runInContext(fs.readFileSync('js/games/concasseur.js','utf8'),ctx);
 function render(at){now=at;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(at))}
 function press(code,stamp=now,extra={}){const event={code,timeStamp:stamp,repeat:false,target:{closest:()=>null},preventDefault(){this.prevented=true},...extra};documentEvents.keydown(event);return event}
 return {el,lanes,press,render,documentEvents,windowEvents,clock(at){now=at},state:()=>state,animations:()=>animations,start(){el('startGame').listeners.click();render(now+3000)}};
}
test('accord de cinq touches : toutes les frappes gardent leur instant d’entrée ; rendu et animation partagés',()=>{
 const a=app();a.start();a.el('gameBoard').listeners.pointerenter();a.render(4030);assert.equal(a.el('gameScore').textContent,'0');
 for(const [i,code] of ['KeyD','KeyF','Space','KeyJ','KeyK'].entries()){a.clock(4100+i*3);assert.equal(a.press(code,4000).prevented,true)}
 assert.equal(a.state().hits,5);assert.equal(a.state().perfects,5);assert.equal(a.state().empty,0);assert.equal(a.state().elapsed,1030);assert.equal(a.el('gameScore').textContent,'0');assert.equal(a.animations(),0);
 a.render(4120);assert.notEqual(a.el('gameScore').textContent,'0');assert.equal(a.animations(),1);
});
test('touches indépendantes : D maintenu ne bloque pas F/J ; pas de double frappe avant relâchement',()=>{
 const a=app();a.start();a.clock(4000);a.press('KeyD');a.press('KeyD');a.press('KeyD',4000,{repeat:true});a.press('KeyF');a.press('KeyJ');assert.equal(a.state().hits,3);assert.equal(a.state().empty,0);
 a.documentEvents.keyup({code:'KeyD'});a.clock(4500);a.press('KeyD');assert.equal(a.state().hits,4);assert.equal(a.state().perfects,4);
});
test('pause, perte de focus et redémarrage ne laissent aucune touche bloquée',()=>{
 const a=app();a.start();a.clock(4000);a.press('KeyD');a.windowEvents.blur();a.clock(5000);a.el('resumeGame').listeners.click();a.clock(5500);a.press('KeyD');assert.equal(a.state().hits,2);
 a.el('startGame').listeners.click();a.render(8500);a.clock(9500);a.press('KeyD');assert.equal(a.state().hits,1);assert.equal(a.state().empty,0);
});
test('clics et horodatages Unix suivent la même précision que le clavier',()=>{
 const a=app();a.start();a.render(4030);a.clock(4100);a.lanes[0].listeners.pointerdown({button:0,timeStamp:4000,preventDefault(){}});a.press('KeyF',1700000004000);assert.equal(a.state().perfects,2);assert.equal(a.state().hits,2);
});
test('jugement horodaté : choisir la note visée sans remonter l’horloge ni ressusciter une note ratée',()=>{
 const s=E.create(()=>.5);s.notes=[{id:1,item:'strigide',lane:0,cat:false,at:1000,done:false},{id:2,item:'strigide',lane:0,cat:false,at:1200,done:false}];E.advance(s,1130);
 const hit=E.hit(s,0,1000);assert.equal(hit.note.id,1);assert.equal(hit.kind,'perfect');assert.equal(s.elapsed,1130);
 E.advance(s,1400);assert.equal(s.misses,1);assert.equal(E.hit(s,0,1200).kind,'empty');assert.equal(s.hits,1);
});
