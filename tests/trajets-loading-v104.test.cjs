const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
const code=fs.readFileSync(path.join(root,'js/tools/trajets-engine.js'),'utf8');
const payload=fs.readFileSync(path.join(root,'data/trajets-3.7.13.17.js'),'utf8');
function setup(){const ctx=vm.createContext({fetch(){throw Error('fetch must not be used for local data')}});vm.runInContext(code,ctx);return {ctx,api:vm.runInContext('DofusRoutes',ctx)}}
test('le script de données reproduit exactement le JSON de référence',()=>{const {ctx}=setup();vm.runInContext(payload,ctx);const actual=JSON.stringify(vm.runInContext('LAFOIRE_TRAVEL_DATA',ctx));const expected=JSON.stringify(JSON.parse(fs.readFileSync(path.join(root,'data/trajets-3.7.13.17.json'),'utf8')));assert.equal(actual,expected)});
test('chargement par script sans fetch, calcul réel et réutilisation sans nouvelle requête',async()=>{
 const {ctx,api}=setup();let requests=0,removed=0;
 const doc={createElement(tag){assert.equal(tag,'script');return {remove(){removed++}}},head:{append(script){requests++;assert.equal(script.src,'data/trajets-3.7.13.17.js');vm.runInContext(payload,ctx);script.onload()}}};
 const data=await api.loadData(doc);const engine=api.create(data);assert.equal(engine.search(engine.candidates(-4,0)[0]).options[0].steps,2);assert.equal(removed,1);
 assert.equal(await api.loadData(doc),data);assert.equal(requests,1);
});
test('fichier absent : erreur utile, suppression du script échoué, puis nouvel essai possible',async()=>{
 const {ctx,api}=setup();let fail=true,removed=0;
 const doc={createElement(){return {remove(){removed++}}},head:{append(script){if(fail)script.onerror();else{vm.runInContext(payload,ctx);script.onload()}}}};
 await assert.rejects(api.loadData(doc),/dossier data accompagne index.html/);fail=false;assert.equal((await api.loadData(doc)).version,'3.7.13.17');assert.equal(removed,2);
});
test('données incompatibles : refus explicite',async()=>{const {api}=setup();const doc={createElement(){return {remove(){}}},head:{append(script){script.onload()}}};await assert.rejects(api.loadData(doc),/incomplet ou incompatible/)});
