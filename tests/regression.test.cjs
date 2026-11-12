const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../dofus-craft.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
if(!script)throw Error('Script principal introuvable');
function app(initial={}){
 const store=new Map(Object.entries(initial));
 const elements=new Map();
 function element(key){if(!elements.has(key))elements.set(key,{value:'',textContent:'',innerHTML:'',className:'',dataset:{},classList:{toggle(){},add(){},remove(){}},addEventListener(){},querySelectorAll(){return []},replaceWith(){}});return elements.get(key)}
 const document={querySelector:element,querySelectorAll(){return []},createElement(){return {innerHTML:'',firstElementChild:{}}}};
 const context=vm.createContext({document,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},URLSearchParams,AbortController,fetch:async()=>{throw Error('No network in tests')},setTimeout,clearTimeout,console,Date,Math});
 vm.runInContext(script,context,{filename:'dofus-craft.html'});
 return {run:expr=>vm.runInContext(expr,context),element,store};
}
const leaf=(id,qty=1)=>({id,qty,children:null,forced:null});
const composite=(id,children,qty=1)=>({id,qty,children,forced:null});
test('HTML autonome, onglets et champs clés conservés',()=>{for(const id of ['tabSingle','tabMulti','tabLedger','singleMode','multiMode','ledgerMode','search','multiSearch','multiShopping','statDaily','statDailyPercent'])assert.match(html,new RegExp(`id="${id}"`));});
test('prix absent, zéro et invalides',()=>{const a=app();assert.equal(a.run('isPrice("")'),false);assert.equal(a.run('isPrice(-1)'),false);assert.equal(a.run('isPrice("abc")'),false);assert.equal(a.run('isPrice(0)'),true)});
test('achat direct composite si moins cher',()=>{const a=app({'dofusdude-prices':JSON.stringify({10:50,11:40,12:30})});a.run('globalThis.fixture={id:10,qty:1,forced:null,children:[{id:11,qty:2,children:null},{id:12,qty:1,children:null}]}');assert.equal(a.run('nodeValue(fixture).best'),50);assert.equal(a.run('nodeValue(fixture).source'),'buy')});
test('craft composite si moins cher',()=>{const a=app({'dofusdude-prices':JSON.stringify({10:150,11:40,12:30})});a.run('globalThis.fixture={id:10,qty:1,forced:null,children:[{id:11,qty:2,children:null},{id:12,qty:1,children:null}]}');assert.equal(a.run('nodeValue(fixture).best'),110);assert.equal(a.run('nodeValue(fixture).source'),'craft')});
test('choix achat si égalité',()=>{const a=app({'dofusdude-prices':JSON.stringify({10:110,11:40,12:30})});a.run('globalThis.fixture={id:10,qty:1,children:[{id:11,qty:2},{id:12,qty:1}]}');assert.equal(a.run('nodeValue(fixture).source'),'buy')});
test('prix composites manquants : achat direct utilisable',()=>{const a=app({'dofusdude-prices':JSON.stringify({10:55})});a.run('globalThis.fixture={id:10,qty:1,children:[{id:11,qty:2}]}');assert.equal(a.run('nodeValue(fixture).best'),55)});
test('composite sans prix : coût inconnu',()=>{const a=app();a.run('globalThis.fixture={id:10,qty:1,children:[{id:11,qty:2}]}');assert.equal(a.run('nodeValue(fixture).best'),null)});
test('plusieurs niveaux de fabrication',()=>{const a=app({'dofusdude-prices':JSON.stringify({1:1000,2:500,3:10})});a.run('globalThis.fixture={id:1,qty:1,children:[{id:2,qty:2,children:[{id:3,qty:3}]}]}');assert.equal(a.run('nodeValue(fixture).best'),60)});
test('choix forcé unitaire achat ou craft',()=>{const a=app({'dofusdude-prices':JSON.stringify({1:100,2:20})});a.run('globalThis.fixture={id:1,qty:1,forced:"buy",children:[{id:2,qty:2}]}');assert.equal(a.run('nodeValue(fixture).best'),100);a.run('fixture.forced="craft"');assert.equal(a.run('nodeValue(fixture).best'),40)});
test('calcul multi achat direct et fusion',()=>{const a=app({'dofusdude-prices':JSON.stringify({10:40,11:20,12:5})});a.run('globalThis.fixture={id:10,qty:3,name:"Huile",image:"",children:[{id:11,qty:2,name:"Noix",children:null},{id:12,qty:1,name:"Eau",children:null}]}');a.run('globalThis.shopping=new Map();multiCollect(fixture,2,shopping)');assert.equal(a.run('shopping.get("10").qty'),6);assert.equal(a.run('shopping.has("11")'),false)});
test('calcul multi craft et fusion de ressources',()=>{const a=app({'dofusdude-prices':JSON.stringify({10:100,11:20,12:5})});a.run('globalThis.fixture={id:10,qty:3,name:"Huile",children:[{id:11,qty:2,name:"Noix",children:null},{id:12,qty:1,name:"Eau",children:null}]}');a.run('globalThis.shopping=new Map();multiCollect(fixture,2,shopping);multiCollect({id:11,qty:4,name:"Noix",children:null},1,shopping)');assert.equal(a.run('shopping.get("11").qty'),16);assert.equal(a.run('shopping.get("12").qty'),6);assert.equal(a.run('shopping.has("10")'),false)});
test('décision objet final craft ou HDV',()=>{const a=app({'dofusdude-prices':JSON.stringify({11:20}),'dofusdude-item-fields':JSON.stringify({1:{sell:'70'}})});a.run('globalThis.entry={id:1,qty:3,nodes:[{id:11,qty:2,children:null}],loading:false,error:""}');assert.equal(a.run('multiEntryDecision(entry).source'),'craft');a.run('itemFields[1].sell="30"');assert.equal(a.run('multiEntryDecision(entry).source'),'buy')});
test('prix et données HDV sauvegardés lus au démarrage',()=>{const a=app({'dofusdude-prices':'{"99":125}','dofusdude-item-fields':'{"44":{"sell":"400","monthlySales":"60"}}'});assert.equal(a.run('prices[99]'),125);assert.equal(a.run('itemFields[44].monthlySales'),'60')});
test('marge unitaire et journalière sur 30 jours',()=>{const a=app({'dofusdude-prices':'{"2":80}'});a.run('rootNodes=[{id:2,qty:1,children:null}];craftQty=2');a.element('#sell').value='100';a.element('#monthlySales').value='150';a.run('calculate()');assert.equal(a.element('#statDiff').textContent,'+40 K');assert.equal(a.element('#statPercent').textContent,'+25,0 %');assert.equal(a.element('#statDaily').textContent,'+100 K');assert.equal(a.element('#statDailyPercent').textContent,'+62,5 %')});
test('marge non affichée sans prix HDV',()=>{const a=app({'dofusdude-prices':'{"2":80}'});a.run('rootNodes=[{id:2,qty:1,children:null}]');a.run('calculate()');assert.equal(a.element('#statDiff').textContent,'—')});

test('historique : achats en attente sans ventes',()=>{const a=app();a.run('ledger=[{id:"a",name:"Huile",qty:10,buy:1000,sales:[]}]');assert.equal(a.run('ledgerTotals(ledger).pending'),10000);assert.equal(a.run('ledgerTotals(ledger).profit'),0);assert.equal(a.run('ledgerTotals(ledger).remaining'),10)});
test('historique : revente partielle rentable',()=>{const a=app();a.run('ledger=[{id:"a",qty:10,buy:1000,sales:[{qty:4,price:1500}]}]');assert.equal(a.run('ledgerTotals(ledger).pending'),6000);assert.equal(a.run('ledgerTotals(ledger).profit'),1880);assert.equal(a.run('ledgerTotals(ledger).remaining'),6)});
test('historique : perte et vente totale',()=>{const a=app();a.run('ledger=[{id:"a",qty:3,buy:1000,sales:[{qty:1,price:500},{qty:2,price:900}]}]');assert.equal(a.run('ledgerTotals(ledger).pending'),0);assert.equal(a.run('ledgerTotals(ledger).profit'),-746)});
test('historique : plusieurs lots indépendants',()=>{const a=app();a.run('ledger=[{id:"a",qty:2,buy:100,sales:[{qty:2,price:120}]},{id:"b",qty:3,buy:200,sales:[{qty:1,price:150}]}]');assert.ok(Math.abs(a.run('ledgerTotals(ledger).profit')+17.8)<1e-8);assert.equal(a.run('ledgerTotals(ledger).pending'),400)});
test('historique : restauration des achats sauvegardés',()=>{const a=app({'dofusdude-purchase-ledger-v1':'[{"id":"a","qty":2,"buy":100,"sales":[]}]'});assert.equal(a.run('ledgerTotals(ledger).pending'),200)});
