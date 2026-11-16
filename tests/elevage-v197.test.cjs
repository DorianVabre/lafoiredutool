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

const draft=(extra={})=>({name:'Test',serenity:-100,endurance:1000,maturity:2000,love:3000,trait:'none',xp:0,...extra});
test('lot atomique : réserve, identités uniques, jauges et limites de destination',()=>{
 const a=app();a.api.createMany([draft(),draft({name:'Deux',trait:'sage'})]);let s=a.api.read();assert.equal(s.reserve.length,2);assert.notEqual(s.reserve[0].id,s.reserve[1].id);assert.equal(s.reserve[0].serenity,-100);assert.equal(s.reserve[1].trait,'sage');
 assert.throws(()=>a.api.createMany([draft()],'pen-1'),/débloqué/);assert.equal(a.api.read().pens[1].mounts.length,0);
 a.api.createMany(Array.from({length:9},()=>draft()),'pen-0');const before=JSON.stringify(a.api.read());assert.throws(()=>a.api.createMany([draft(),draft()],'pen-0'),/places/);assert.equal(JSON.stringify(a.api.read()),before);assert.throws(()=>a.api.createMany([draft(),draft({love:20001})]),/invalides/);assert.equal(JSON.stringify(a.api.read()),before);
 a.api.edit(s=>{s.session={completed:false,paused:true,waiting:true,plan:{penIds:['pen-0']}}});assert.throws(()=>a.api.createMany([draft()],'pen-0'),/suivi/);
});
test('interface : continuer ouvre une autre fiche, terminer enregistre le lot entier',async()=>{
 const a=app();a.boot();assert.match(a.host.innerHTML,/Gestion des montures/);assert.ok(a.host.innerHTML.indexOf('id="breedBatchAdd"')<a.host.innerHTML.indexOf('class="breed-workspace"'));
 await a.click('breedBatchAdd');assert.equal(a.node('#breedBatchDialog').open,true);assert.equal(a.node('#breedBatch-endurance').focused,true);
 const fill=()=>{for(const [id,value] of Object.entries({'breedBatch-endurance':'1000','breedBatch-maturity':'2000','breedBatch-love':'3000',breedBatchType:'',breedBatchName:'',breedBatchSerenity:'0',breedBatchTrait:'none',breedBatchLevel:'1',breedBatchDestination:'reserve'}))a.node('#'+id).value=value};
 const submit=value=>a.handlers.submit({target:{id:'breedBatchForm',reportValidity:()=>true},preventDefault(){},submitter:{value}});
 fill();submit('continue');assert.match(a.node('#breedBatchDialog').innerHTML,/monture 2/);assert.equal(a.api.read().reserve.length,0);fill();submit('finish');assert.equal(a.api.read().reserve.length,2);assert.equal(a.api.read().reserve[1].maturity,2000);assert.equal(a.node('#breedBatchDialog').open,false);
});

test('V198 : sélecteur illustré par-dessus la saisie multiple sans perdre les jauges',async()=>{
 const a=app();a.boot();await a.click('breedBatchAdd');a.node('#breedBatch-endurance').value='1234';await a.click('breedBatchPickType');assert.equal(a.node('#breedMountPicker').open,true);assert.equal(a.node('#breedBatchDialog').open,true);
 const t=vm.runInContext('BREEDING_MOUNTS[0]',a.ctx);await a.handlers.click({target:{closest:()=>({dataset:{mountType:String(t.id)}})}});assert.equal(a.node('#breedMountPicker').open,false);assert.equal(a.node('#breedBatchDialog').open,true);assert.equal(a.node('#breedBatchType').value,String(t.id));assert.match(a.node('#breedBatchPickType').innerHTML,/<img/);assert.equal(a.node('#breedBatch-endurance').value,'1234');
});
test('V198 : saisie et collage ramenés aux bornes, vide autorisé pendant édition',()=>{
 const a=app();a.boot();for(const [min,max] of [[0,20000],[-5000,5000],[0,200000],[1,200],[0,867582]])for(const [value,expected] of [[max+1,max],[min-1,min],[min,min],[max,max]]){const t={type:'number',id:'batchField',dataset:{},min:String(min),max:String(max),step:'1',value:String(value)};a.handlers.input({target:t});assert.equal(Number(t.value),expected)}
 const field={type:'number',id:'batchField',dataset:{},min:'0',max:'20000',step:'1',value:''};a.handlers.input({target:field});assert.equal(field.value,'');
 const fuel={type:'number',id:'',dataset:{fuel:'down'},min:'0',max:'200000',step:'1',value:'999999'};a.handlers.input({target:fuel});assert.equal(a.api.read().pens[0].fuel.down,200000);
});

test('V198 : destination conservée, avertissement et validation du lot selon sa taille finale',async()=>{
 for(const includeCurrent of [false,true]){
 const a=app();a.api.createMany(Array.from({length:8},()=>draft()),'pen-0');a.boot();await a.click('breedBatchAdd');
 const fill=()=>{for(const [id,value] of Object.entries({'breedBatch-endurance':'1000','breedBatch-maturity':'2000','breedBatch-love':'3000',breedBatchType:'',breedBatchName:'',breedBatchSerenity:'0',breedBatchTrait:'none',breedBatchLevel:'1',breedBatchDestination:'pen-0'}))a.node('#'+id).value=value};
 const submit=value=>a.handlers.submit({target:{id:'breedBatchForm',reportValidity:()=>true},preventDefault(){},submitter:{value}});
 fill();submit('continue');fill();submit('continue');assert.equal(a.node('#breedBatchDestination').value,'pen-0');assert.equal(a.node('#breedBatchCapacityWarning').hidden,false);assert.equal(a.node('#breedBatchFinishWarning').hidden,false);assert.match(a.node('#breedBatchFinish').title,/fera basculer sur la réserve/);assert.match(a.node('#breedBatchDialog').innerHTML,/<option value="pen-0" selected/);
 if(includeCurrent){fill();submit('finish');assert.equal(a.api.read().pens[0].mounts.length,8);assert.equal(a.api.read().reserve.length,3)}else{await a.click('breedBatchFinishPending');assert.equal(a.api.read().pens[0].mounts.length,10);assert.equal(a.api.read().reserve.length,0)}
 }
});
test('V198 : Ctrl+clic dans la réserve conserve sa position de défilement',async()=>{
 const a=app();a.api.createMany([draft()]);a.boot();const id=a.api.read().reserve[0].id;a.node('.breed-reserve').scrollTop=450;
 await a.handlers.click({ctrlKey:true,preventDefault(){},stopPropagation(){},target:{closest:selector=>selector==='[data-card-mount]'?{dataset:{cardMount:id}}:null}});assert.equal(a.node('.breed-reserve').scrollTop,450);
});

test('V198 : quatrième fiche après trois saisies pour deux places bascule sur la réserve',async()=>{
 const a=app();a.api.createMany(Array.from({length:8},()=>draft()),'pen-0');a.boot();await a.click('breedBatchAdd');
 for(let i=0;i<3;i++){
 for(const [id,value] of Object.entries({'breedBatch-endurance':'1000','breedBatch-maturity':'2000','breedBatch-love':'3000',breedBatchType:'',breedBatchName:'',breedBatchSerenity:'0',breedBatchTrait:'none',breedBatchLevel:'1',breedBatchDestination:'pen-0'}))a.node('#'+id).value=value;
 a.handlers.submit({target:{id:'breedBatchForm',reportValidity:()=>true},preventDefault(){},submitter:{value:'continue'}});
 if(i===1){assert.equal(a.node('#breedBatchDestination').value,'pen-0');assert.equal(a.node('#breedBatchCapacityWarning').hidden,false)}
 }
 assert.match(a.node('#breedBatchDialog').innerHTML,/monture 4/);assert.equal(a.node('#breedBatchDestination').value,'reserve');assert.equal(a.node('#breedBatchCapacityWarning').hidden,true);assert.equal(a.node('#breedBatchFinishWarning').hidden,true);assert.equal(a.node('#breedBatchFinish').title,'');assert.match(a.node('#breedBatchDialog').innerHTML,/<option value="pen-0"\s+disabled>/);
});
