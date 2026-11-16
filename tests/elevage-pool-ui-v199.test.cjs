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
function change(a,t){a.handlers.change({target:{dataset:{},...t}})}
test('sélection de la réserve indépendante des enclos, recherche et plan de plus de 10 montures',async()=>{
 const a=app();seed(a);assert.match(a.host.innerHTML,/data-plan-mount=/);await a.click('breedPoolAll');assert.equal(a.api.read().planMounts.length,25);assert.match(a.host.innerHTML,/25 sélectionnées \/ 10 places/);
 a.handlers.input({target:{id:'breedPoolSearch',value:'Monture 24',dataset:{}}});assert.match(a.node('#breedPoolMounts').innerHTML,/Monture 24/);assert.doesNotMatch(a.node('#breedPoolMounts').innerHTML,/<b>Monture 1<\/b>/);await a.click('breedCalculate');assert.match(a.node('#breedResult').innerHTML,/25 montures fécondes/);assert.match(a.node('#breedResult').innerHTML,/10 places simultanées/);await a.click('breedStart');assert.equal(a.api.read().session.plan.pool,true);assert.equal(a.api.read().session.plan.mountIds.length,25);assert.ok(a.api.read().session.waiting);assert.equal(a.api.read().pens[0].mounts.length,0);
 await a.click('breedConfirm');assert.ok(a.api.read().pens[0].mounts.length>0);assert.match(a.node('#breedResult').innerHTML,/en attente/);const restored=app(a.storage);restored.boot();assert.equal(restored.api.read().session.plan.mountIds.length,25);assert.equal(restored.api.read().planMounts.length,25);
});
test('sélections distinctes XP/fécondité et modification après pause sans toucher à l’autre suivi',async()=>{
 const a=app();seed(a,24);const ids=a.api.read().reserve.map(m=>m.id);await a.click('breedPoolClear');for(const id of ids.slice(0,12))change(a,{dataset:{planMount:id},checked:true});await a.click('breedCalculate');await a.click('breedStart');
 change(a,{id:'breedGoal',checked:true});await a.handlers.click({target:{closest:()=>({dataset:{penAssignment:'pen-1',assignment:'xp'}})}});assert.equal(a.api.read().xpPlanPens[0],'pen-1');await a.click('breedPoolAll');assert.equal(a.api.read().xpPlanMounts.length,12);assert.ok(a.api.read().xpPlanMounts.every(id=>!ids.slice(0,12).includes(id)));assert.match(a.host.innerHTML,/Réservée par le suivi fécondité/);await a.click('breedCalculate');await a.click('breedStart');assert.ok(a.api.read().xpSession&&a.api.read().session);
 await a.click('breedPause');assert.match(a.host.innerHTML,/breedEditSelection/);await a.click('breedEditSelection');assert.equal(a.api.read().xpSession,null);assert.ok(a.api.read().session);assert.equal(a.api.read().xpPlanMounts.length,12);change(a,{dataset:{planMount:ids[23]},checked:false});assert.equal(a.api.read().xpPlanMounts.length,11);assert.equal(a.api.read().planMounts.length,12);
});

test('V200 : recherche de réserve par nom, insensible aux accents, conservée au tri sans modifier les montures',async()=>{
 const a=app();seed(a,3);a.api.edit(s=>{s.reserve[0].name='Émeraude';s.reserve[1].name='Rousse';s.reserve[2].name='Prune'});a.boot();assert.match(a.host.innerHTML,/id="breedReserveSearch"/);assert.doesNotMatch(a.host.innerHTML,/data-pen-name/);
 a.handlers.input({target:{id:'breedReserveSearch',value:'emeraude',dataset:{}}});assert.match(a.node('.breed-reserve-list').innerHTML,/Émeraude/);assert.doesNotMatch(a.node('.breed-reserve-list').innerHTML,/Rousse/);await a.click('breedReserveSortDirection');assert.match(a.host.innerHTML,/id="breedReserveSearch"[^>]*value="emeraude"/);assert.equal(a.api.read().reserve.length,3);
 a.handlers.input({target:{id:'breedReserveSearch',value:'inconnu',dataset:{}}});assert.match(a.node('.breed-reserve-list').innerHTML,/Aucune monture/);a.handlers.input({target:{id:'breedReserveSearch',value:'',dataset:{}}});assert.match(a.node('.breed-reserve-list').innerHTML,/Émeraude/);assert.match(a.node('.breed-reserve-list').innerHTML,/Rousse/);
});

test('V200 : DD non sélectionnée pour la fécondité signalée dans un enclos occupé, puis disponible pour XP après retrait',async()=>{
 const a=app();seed(a,2);a.api.edit(s=>{const xp=s.reserve.pop();s.pens[0].mounts=[xp];s.planMounts=[s.reserve[0].id];s.xpPlanMounts=[xp.id];s.xpPlanPens=['pen-1']});a.boot();await a.click('breedCalculate');await a.click('breedStart');const id=a.api.read().xpPlanMounts[0];assert.equal(a.api.ownsMount(a.api.read().session,id),false);a.handlers.change({target:{id:'breedGoal',checked:true,dataset:{}}});assert.match(a.host.innerHTML,/Enclos utilisé par le suivi fécondité/);await a.click('breedCalculate');assert.match(a.node('#breedMessage').textContent,/Monture 1 se trouve encore dans Enclos 1/);assert.doesNotMatch(a.node('#breedMessage').textContent,/Monture 1 est réservée/);a.api.ack(0);await a.click('breedCalculate');await a.click('breedStart');assert.deepEqual(Array.from(a.api.read().xpSession.plan.mountIds),[id]);assert.ok(a.api.read().session);
});
