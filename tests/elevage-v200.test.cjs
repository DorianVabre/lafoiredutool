const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function app(storage=new Map()){
 let now=0;const events={},handlers={},nodes=new Map();
 const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',checked:false,innerHTML:'',textContent:'',querySelector:node,replaceChildren(){this.innerHTML=''},showModal(){this.open=true},close(){this.open=false},focus(){this.focused=true}});return nodes.get(id)};
 const host={innerHTML:'',querySelector:node,querySelectorAll:()=>[],insertAdjacentHTML(_,html){this.innerHTML+=html},addEventListener:(name,fn)=>handlers[name]=fn};
 const ctx=vm.createContext({localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},Date:class extends Date{constructor(...args){super(...(args.length?args:[now]))}static now(){return now}},document:{getElementById:id=>id==='breedingMode'?host:null,addEventListener(){}},window:{addEventListener:(key,fn)=>(events[key]??=[]).push(fn),dispatchEvent:event=>(events[event.type]||[]).forEach(fn=>fn(event))},CustomEvent:class{constructor(type){this.type=type}},esc:s=>String(s),setTimeout:()=>0});
 for(const file of ['data/elevage-carburants.js','js/tools/elevage-engine.js','js/core/elevage-store.js','js/core/copy-names.js','js/core/elevage-alarms.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
 const api=vm.runInContext('BreedingStore',ctx),alarms=vm.runInContext('BreedingAlarms',ctx);
 return {api,alarms,ctx,storage,host,node,handlers,time:n=>now=n,boot:()=>vm.runInContext(fs.readFileSync('js/tools/elevage.js','utf8'),ctx),click:async id=>handlers.click({target:{closest:()=>({id,dataset:{}})}})};
}


const draft=(i)=>({name:'Monture '+i,serenity:-100,endurance:19900,maturity:19900,love:19900,trait:'none',xp:0});
function seed(a,count=25){a.api.edit(s=>{s.level=200;s.prices=vm.runInContext('Object.fromEntries(BREEDING_FUELS.map(x=>[x.id,1]))',a.ctx)});a.api.createMany(Array.from({length:count},(_,i)=>draft(i)));a.boot()}

const assign=(a,id,value)=>a.handlers.click({target:{closest:()=>({dataset:{penAssignment:id,assignment:value}})}});
const change=(a,id,value)=>a.handlers.change({target:{id,value,dataset:{}}});
test('V200 : affectations exclusives et persistantes, verrouillage par niveau et migration des anciennes sélections',()=>{
 const a=app();assert.throws(()=>a.api.assignPen('pen-1','xp'),/verrouillé/);a.api.assignPen('pen-0','xp');assert.deepEqual(Array.from(a.api.read().planPens),[]);assert.deepEqual(Array.from(a.api.read().xpPlanPens),['pen-0']);a.api.assignPen('pen-0','none');assert.equal(a.api.read().xpPlanPens.length,0);a.api.edit(s=>{s.level=200;s.planPens=['pen-0','pen-1'];s.xpPlanPens=['pen-1','pen-2']});let s=a.api.read();assert.deepEqual(Array.from(s.planPens),['pen-0']);assert.deepEqual(Array.from(s.xpPlanPens),['pen-1','pen-2']);s=app(a.storage).api.read();assert.deepEqual(Array.from(s.xpPlanPens),['pen-1','pen-2']);
});
test('V200 : commande sur un onglet sans changer la vue, niveau visible uniquement si verrouillé',async()=>{
 const a=app();a.boot();let tabs=a.host.innerHTML.split('class="breed-tabs">')[1].split('<section')[0];assert.match(tabs,/data-pen="0"[^]*?<small>0\/10<\/small>/);assert.match(tabs,/data-pen="1" disabled[^]*?<small>0\/10 · niv. 40<\/small>/);assert.doesNotMatch(a.host.innerHTML,/data-plan-pen/);
 seed(a,12);await assign(a,'pen-1','xp');assert.equal(a.api.read().selected,0);assert.deepEqual(Array.from(a.api.read().xpPlanPens),['pen-1']);tabs=a.host.innerHTML.split('class="breed-tabs">')[1].split('<section')[0];assert.doesNotMatch(tabs,/niv\./);assert.match(tabs,/data-pen-assignment="pen-1" data-assignment="xp" aria-pressed="true"/);await assign(a,'pen-1','none');assert.equal(a.api.read().xpPlanPens.length,0);
});
test('V200 : calcul utilisant seulement les enclos affectés, protection du suivi et autre affectation disponible',async()=>{
 const a=app();seed(a,15);await assign(a,'pen-0','none');await assign(a,'pen-1','fertility');await a.click('breedPoolAll');await a.click('breedCalculate');await a.click('breedStart');assert.deepEqual(Array.from(a.api.read().session.plan.penIds),['pen-1']);assert.throws(()=>a.api.assignPen('pen-1','xp'),/réservé/);assert.throws(()=>a.api.assignPen('pen-2','fertility'),/pause/);a.api.assignPen('pen-2','xp');assert.deepEqual(Array.from(a.api.read().xpPlanPens),['pen-2']);
 const b=app();seed(b,2);await assign(b,'pen-0','none');await b.click('breedPoolAll');await b.click('breedCalculate');assert.match(b.node('#breedMessage').textContent,/Affecte au moins un enclos/);assert.equal(b.api.read().session,null);
});
test('V200 : tri des jauges et XP, inversion et préférences indépendantes par objectif',async()=>{
 const a=app();seed(a,3);a.api.edit(s=>{s.reserve.forEach((m,i)=>{m.name=['A','B','C'][i];m.love=[19900,19999,19950][i];m.xp=[100,300,200][i]})});a.boot();change(a,'breedPoolSort','love');a.handlers.input({target:{id:'breedPoolSearch',value:'',dataset:{}}});let html=a.node('#breedPoolMounts').innerHTML;assert.ok(html.indexOf('<b>B</b>')<html.indexOf('<b>C</b>'));assert.ok(html.indexOf('<b>C</b>')<html.indexOf('<b>A</b>'));await a.click('breedPoolSortDirection');a.handlers.input({target:{id:'breedPoolSearch',value:'',dataset:{}}});html=a.node('#breedPoolMounts').innerHTML;assert.ok(html.indexOf('<b>A</b>')<html.indexOf('<b>C</b>'));
 a.handlers.change({target:{id:'breedGoal',checked:true,dataset:{}}});change(a,'breedPoolSort','xp');a.handlers.input({target:{id:'breedPoolSearch',value:'',dataset:{}}});html=a.node('#breedPoolMounts').innerHTML;assert.ok(html.indexOf('<b>B</b>')<html.indexOf('<b>C</b>'));assert.equal(a.api.read().poolSort,'love');assert.equal(a.api.read().poolSortDirection,'asc');assert.equal(a.api.read().xpPoolSort,'xp');assert.equal(a.api.read().xpPoolSortDirection,'desc');
});
