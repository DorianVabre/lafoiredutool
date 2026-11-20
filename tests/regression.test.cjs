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
 const document={getElementById(id){return id.startsWith('drop')?element('#'+id):null},querySelector:element,querySelectorAll(){return []},createElement(){return {innerHTML:'',firstElementChild:{}}}};
 const context=vm.createContext({document,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},URLSearchParams,AbortController,fetch:async()=>{throw Error('No network in tests')},setTimeout,clearTimeout,console,Date,Math});
 vm.runInContext(script,context,{filename:'dofus-craft.html'});
 return {run:expr=>vm.runInContext(expr,context),element,store};
}
const leaf=(id,qty=1)=>({id,qty,children:null,forced:null});
const composite=(id,children,qty=1)=>({id,qty,children,forced:null});
test('unitaire : quantité à acheter actualisée et plafonnée à zéro entre prix et montant',()=>{
 const a=app();a.run('rootNodes=[{uid:1,id:2,name:"Graine",qty:3,children:null}];craftQty=2;prices={2:10};ownedSingle.set(1,2);calculate()');
 assert.equal(a.element('[data-single-remaining="1"]').textContent,'4');assert.equal(a.element('[data-single-need="1"]').textContent,'× 6 nécessaires');assert.equal(a.element('[data-single-line="1"]').textContent,'40 K');
 const markup=a.run('renderNode(rootNodes[0])');assert.ok(markup.indexOf('data-price-node=')<markup.indexOf('data-single-remaining='));assert.ok(markup.indexOf('data-single-remaining=')<markup.indexOf('data-single-line='));assert.doesNotMatch(markup,/à acheter \/ fabriquer/);
 a.run('ownedSingle.set(1,99);calculate()');assert.equal(a.element('[data-single-remaining="1"]').textContent,'0');assert.equal(a.element('[data-single-line="1"]').textContent,'0 K');
});
test('unitaire : besoins des sous-composants multipliés par les composites manquants',()=>{
 const a=app();a.run('prices={2:100,3:10};rootNodes=[{uid:1,id:2,qty:3,children:[{uid:2,id:3,qty:4,children:null}]}];ownedSingle.set(1,1);ownedSingle.set(2,2);calculate()');
 assert.equal(a.element('[data-single-remaining="1"]').textContent,'2');assert.equal(a.element('[data-single-need="2"]').textContent,'× 8 nécessaires');assert.equal(a.element('[data-single-remaining="2"]').textContent,'6');assert.equal(a.element('[data-single-line="2"]').textContent,'60 K');
});
test('stocks partagés : deux sens, rechargement et absence de double comptage des branches',()=>{
 const a=app({'dofusdude-prices':'{"3":10}'});
 a.run('selected={ankama_id:397};rootNodes=[makeNode({id:3,qty:3},"397/0:3"),makeNode({id:3,qty:3},"397/1:3")];singleSetStock(rootNodes[0].uid,5);SharedStocks.set(99,7)');
 assert.equal(a.run('multi.inventory[3]'),5);assert.equal(a.run('ownedQty(ownedSingle,rootNodes[0].uid)'),3);assert.equal(a.run('ownedQty(ownedSingle,rootNodes[1].uid)'),2);
 const b=app(Object.fromEntries(a.store));b.run('selected={ankama_id:397};rootNodes=[makeNode({id:3,qty:3},"397/0:3"),makeNode({id:3,qty:3},"397/1:3")];singleSyncStocks();multi.inventory[3]=4;multiSaveInventory()');
 assert.equal(b.run('SharedStocks.get(3)'),4);assert.equal(b.run('ownedQty(ownedSingle,rootNodes[1].uid)'),1);
 b.run('singleResetStocks()');assert.equal(b.run('SharedStocks.get(3)'),0);assert.equal(b.run('multi.inventory[3]||0'),0);assert.equal(b.run('SharedStocks.get(99)'),7);assert.equal(b.run('prices[3]'),10);
});
test('migration : priorité au multicraft, maximum des anciennes vues unitaires, un reset ne ressuscite pas les valeurs',()=>{
 const a=app({'dofus-craft-multi-inventory-v1':'{"3":4,"5":0}','la-foire-du-tool-single-stock-v1':'{"397/0:3":9,"397/1:4":2,"999/1:4":5,"397/2:5":8}'});
 assert.equal(a.run('SharedStocks.get(3)'),4);assert.equal(a.run('SharedStocks.get(4)'),5);assert.equal(a.run('SharedStocks.get(5)'),0);
 a.run('multiResetStocks()');const b=app(Object.fromEntries(a.store));assert.equal(b.run('SharedStocks.get(4)'),0);
});
test('répartition : les stocks de sous-composants non utilisés restent disponibles pour une autre branche',()=>{
 const a=app();a.run('selected={ankama_id:1};prices={10:1,2:10};rootNodes=[makeNode({id:10,qty:1},"1/0:10"),makeNode({id:2,qty:5},"1/1:2")];rootNodes[0].children=[makeNode({id:2,qty:10},"1/0:10/0:2")];singleSetStock(rootNodes[1].uid,5)');
 assert.equal(a.run('ownedQty(ownedSingle,rootNodes[0].children[0].uid)'),0);assert.equal(a.run('ownedQty(ownedSingle,rootNodes[1].uid)'),5);
 assert.equal(a.run('stockCost(rootNodes[0],1,ownedSingle).cost+stockCost(rootNodes[1],5,ownedSingle).cost'),1);
});
test('multicraft : remise à zéro persistante sans effacer les sessions ni les prix',()=>{
 const a=app({'dofus-craft-multi-inventory-v1':'{"3":9}','dofusdude-prices':'{"3":10}','la-foire-du-tool-multicraft-sessions-v1':'[]'});
 a.run('multiResetStocks()');assert.equal(a.store.get('dofus-craft-multi-inventory-v1'),'{}');assert.equal(a.run('prices[3]'),10);assert.equal(a.store.get('la-foire-du-tool-multicraft-sessions-v1'),'[]');
});
test('revente + achat : ligne permanente, achat direct sans stock même si le prix des composants manque',()=>{
 const a=app();a.run('selected={ankama_id:1,name:"Recette"};rootNodes=[{uid:1,id:2,qty:3,children:null}];renderDetail()');
 assert.doesNotMatch(a.element('#detail').innerHTML,/<div id="resellBuyRow"[^>]*hidden/);assert.equal(a.element('#statResellBuy').textContent,'—');
 a.element('#sell').value='100';a.run('calculate()');assert.equal(a.element('#statResellBuy').textContent,'100 K');
 a.run('prices[2]=10;calculate()');assert.equal(a.element('#statResellBuy').textContent,'100 K');assert.match(a.element('#grossConclusion').innerHTML,/achat\/revente sans stock à la chaine/);
});
test('gain après revente : les deux coûts alternatifs sont rouges, le gain est vert',()=>{
 const a=app();a.run('rootNodes=[{uid:1,id:2,qty:3,children:null}];prices={2:500};ownedSingle.set(1,2)');a.element('#sell').value='30';a.run('calculate()');
 assert.equal(a.element('#statResellBuy').textContent,'Gain de 970 K');assert.equal(a.element('#statResellBuy').className,'green');assert.equal(a.element('#statCost').className,'red');assert.equal(a.element('#statBuy').className,'red');
 a.element('#sell').value='1200';a.run('calculate()');assert.equal(a.element('#statResellBuy').textContent,'200 K');assert.equal(a.element('#statCost').className,'neutral');assert.equal(a.element('#statBuy').className,'red');
});
const koodeScenarios=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/craft-scenarios-v124.json'),'utf8'));
for(const scenario of koodeScenarios.cases)test('Huile de Koode : '+scenario.name,()=>{
 const a=app();a.run('rootNodes='+JSON.stringify(koodeScenarios.recipe.map(r=>({uid:r.id,id:r.id,qty:r.quantity,children:null})))+';prices='+JSON.stringify(scenario.prices));
 for(const [id,qty] of Object.entries(scenario.owned))a.run('ownedSingle.set('+id+','+qty+')');
 const decision=JSON.parse(a.run('JSON.stringify(singleKeepDecision(rootNodes,1,'+scenario.sell+',ownedSingle))'));
 for(const key of ['craft','buy','stockValue','resellBuy','best'])assert.deepEqual(decision[key],scenario.expected[key],key);
 a.element('#sell').value=String(scenario.sell);a.run('calculate()');const trade=a.element('#grossConclusion').innerHTML;
 assert.equal(trade.includes('class="green">est rentable'),scenario.expected.tradeProfitable);a.run('ownedSingle.clear();calculate()');assert.equal(a.element('#grossConclusion').innerHTML,trade);
});
test('exemple des blés : revendre deux blés et acheter l’huile coûte zéro ; plafonner les surplus',()=>{
 const a=app();a.run('rootNodes=[{uid:1,id:2,qty:3,children:null}];prices={2:1};ownedSingle.set(1,2)');
 assert.equal(a.run('singleKeepDecision(rootNodes,1,2,ownedSingle).craft'),1);assert.equal(a.run('singleKeepDecision(rootNodes,1,2,ownedSingle).resellBuy'),0);assert.equal(a.run('singleKeepDecision(rootNodes,1,2,ownedSingle).best[0]'),'resellBuy');
 a.run('ownedSingle.set(1,99)');assert.equal(a.run('singleKeepDecision(rootNodes,1,2,ownedSingle).stockValue'),3);assert.equal(a.run('singleKeepDecision(rootNodes,1,2,ownedSingle).resellBuy'),-1);
 a.run('delete prices[2]');assert.equal(a.run('singleKeepDecision(rootNodes,1,2,ownedSingle)'),null);
});
test('valoriser le stock des composites sans compter les sous-composants inutilisés',()=>{
 const a=app();a.run('rootNodes=[{uid:1,id:2,qty:2,children:[{uid:2,id:3,qty:3,children:null}]}];prices={2:100,3:10};ownedSingle.set(1,1);ownedSingle.set(2,99)');
 assert.equal(a.run('singleKeepDecision(rootNodes,1,150,ownedSingle).stockValue'),130);
 a.run('ownedSingle.set(1,2)');assert.equal(a.run('singleKeepDecision(rootNodes,1,150,ownedSingle).stockValue'),200);
});
test('conclusions : distinguer le choix selon le stock de la valeur brute, gérer égalités et prix effacés',()=>{
 const a=app();a.run('prices={2:100};rootNodes=[{uid:1,id:2,qty:2,children:null}];craftQty=1;ownedSingle.set(1,1)');a.element('#sell').value='150';a.run('calculate()');
 assert.match(a.element('#stockConclusion').innerHTML,/revendre votre stock puis acheter/);assert.match(a.element('#grossConclusion').innerHTML,/<strong class="red">n’est pas rentable/);
 a.run('ownedSingle.clear();calculate()');assert.match(a.element('#stockConclusion').innerHTML,/<strong class="green">l’acheter/);assert.match(a.element('#grossConclusion').innerHTML,/<strong class="red">n’est pas rentable/);
 a.element('#sell').value='300';a.run('calculate()');assert.match(a.element('#grossConclusion').innerHTML,/<strong class="green">est rentable/);
 a.element('#sell').value='200';a.run('calculate()');assert.match(a.element('#stockConclusion').innerHTML,/même coût/);assert.match(a.element('#grossConclusion').innerHTML,/<strong class="red">n’est pas rentable/);
 a.element('#sell').value='';a.run('calculate()');assert.equal(a.element('#craftConclusions').hidden,true);assert.equal(a.element('#stockConclusion').innerHTML,'');assert.equal(a.element('#grossConclusion').innerHTML,'');
});
test('différence des coûts : quantité totale, couleurs, égalité et prix incomplets',()=>{
 const a=app();a.run('rootNodes=[{uid:1,id:2,qty:2,children:null}];craftQty=2;prices={2:100};ownedSingle.set(1,1)');
 a.element('#sell').value='200';a.run('calculate()');assert.equal(a.element('#statCost').textContent,'300 K');assert.equal(a.element('#statBuy').textContent,'400 K');assert.equal(a.element('#statCost').className,'green');assert.equal(a.element('#statBuy').className,'red');
 a.element('#sell').value='50';a.run('calculate()');assert.equal(a.element('#statCost').className,'red');assert.equal(a.element('#statBuy').className,'neutral');assert.equal(a.element('#statResellBuy').className,'green');
 a.element('#sell').value='150';a.run('calculate()');assert.equal(a.element('#statCost').className,'red');assert.equal(a.element('#statBuy').className,'red');assert.equal(a.element('#statResellBuy').className,'green');
 a.element('#sell').value='';a.run('calculate()');assert.equal(a.element('#statBuy').textContent,'—');assert.equal(a.element('#statCost').className,'neutral');
 a.element('#sell').value='200';a.run('prices={};calculate()');assert.match(a.element('#statCost').textContent,/partiel/);assert.equal(a.element('#statBuy').className,'neutral');
});
test('quatre cartes : montants et pourcentages regroupés avec une aide unique',()=>{
 const a=app();a.run('selected={ankama_id:1,name:"Recette"};rootNodes=[];renderDetail()');const markup=a.element('#detail').innerHTML;
 assert.equal((markup.match(/class="stat-heading"/g)||[]).length,4);assert.equal((markup.match(/data-craft-help=/g)||[]).length,4);
 assert.match(markup,/Valeurs brutes totales/);assert.match(markup,/Articles vendus par jour x Marge brute/);assert.match(markup,/composants possédés/);
 assert.doesNotMatch(markup,/statResaleNote/);assert.match(markup,/<strong id="statDiff">—<\/strong><strong[^>]*id="statPercent"/);assert.match(markup,/<strong id="statDaily">—<\/strong><strong[^>]*id="statDailyPercent"/);assert.doesNotMatch(markup,/Économies en craftant ÷ coût de fabrication × 100/);
});
test('valeurs brutes : prix HDV des composants et quantité, sans déduction des possessions',()=>{
 const a=app();a.run('prices={2:100};rootNodes=[{uid:1,id:2,qty:10,children:null}];ownedSingle.set(1,999)');
 assert.equal(a.run('singleGrossValues(rootNodes,1).components'),1000);assert.equal(a.run('singleGrossValues(rootNodes,2).components'),2000);assert.equal(a.run('singleGrossValues(rootNodes,1).craft'),1000);
 a.element('#sell').value='1500';a.run('calculate()');assert.equal(a.element('#statResale').textContent,'1 000 K');assert.equal(a.element('#statResale').className,'green');assert.equal(a.element('#statGrossBuy').className,'red');
 a.element('#sell').value='500';a.run('calculate()');assert.equal(a.element('#statResale').className,'red');assert.equal(a.element('#statGrossBuy').className,'green');
 a.element('#sell').value='1000';a.run('calculate()');assert.equal(a.element('#statResale').className,'neutral');assert.equal(a.element('#statGrossBuy').className,'neutral');
});
test('valeurs brutes : distinguer la valeur HDV des composites de leur fabrication sans stock',()=>{
 const a=app();a.run('prices={2:100,3:10};rootNodes=[{uid:1,id:2,qty:2,children:[{uid:2,id:3,qty:3,children:null}]}];ownedSingle.set(1,2);ownedSingle.set(2,99)');
 assert.equal(a.run('singleGrossValues(rootNodes,1).components'),200);assert.equal(a.run('singleGrossValues(rootNodes,1).craft'),60);
 a.run('delete prices[2]');assert.equal(a.run('singleGrossValues(rootNodes,1).components'),null);assert.equal(a.run('singleGrossValues(rootNodes,1).craft'),60);
});
test('marges journalières : invariantes au stock et à la quantité du lot, économies personnelles conservées',()=>{
 const a=app();a.run('prices={2:80};rootNodes=[{uid:1,id:2,qty:1,children:null}];craftQty=2;ownedSingle.set(1,2)');a.element('#sell').value='100';a.element('#monthlySales').value='150';a.run('calculate()');
 assert.equal(a.element('#statDiff').textContent,'+200 K');assert.equal(a.element('#statDaily').textContent,'+100 K');assert.equal(a.element('#statDailyPercent').textContent,'+125,0 %');
 a.run('ownedSingle.clear();craftQty=1;calculate()');assert.equal(a.element('#statDiff').textContent,'+20 K');assert.equal(a.element('#statDaily').textContent,'+100 K');assert.equal(a.element('#statDailyPercent').textContent,'+125,0 %');
 a.run('ownedSingle.set(1,1);delete prices[2];calculate()');assert.equal(a.element('#statDiff').textContent,'+100 K');assert.equal(a.element('#statDaily').textContent,'—');assert.equal(a.element('#statResale').textContent,'—');
 a.run('prices[2]=0;calculate()');assert.equal(a.element('#statDaily').textContent,'+500 K');assert.equal(a.element('#statDailyPercent').textContent,'N/A');
});
test('carte de comparaison avant les marges et prix HDV sans pointillés',()=>{
 const a=app();a.run('selected={ankama_id:1,name:"Recette"};rootNodes=[];renderDetail()');const markup=a.element('#detail').innerHTML;
 assert.ok(markup.indexOf('id="statPercent"')<markup.indexOf('id="statResale"'));assert.ok(markup.indexOf('id="statResale"')<markup.indexOf('id="statDaily"'));
 assert.doesNotMatch(markup.match(/<input id="sell"[^>]*>/)[0],/optional-field/);
});
test('HTML autonome, onglets et champs clés conservés',()=>{for(const id of ['tabSingle','tabMulti','tabLedger','singleMode','multiMode','ledgerMode','search','multiSearch','multiShopping','statDaily','statDailyPercent'])assert.match(html,new RegExp(`id="${id}"`));});
test('prix absent, zéro et invalides',()=>{const a=app();assert.equal(a.run('isPrice("")'),false);assert.equal(a.run('isPrice(-1)'),false);assert.equal(a.run('isPrice("abc")'),false);assert.equal(a.run('isPrice(0)'),true)});
test('craft unitaire : pas d’explication Fabriquer pour une recette sans composite',()=>{const a=app();a.run('selected={ankama_id:1,name:"Recette"};rootNodes=[{uid:1,id:2,name:"Ressource",qty:1,detail:{recipe:[]},children:null}];renderDetail()');assert.doesNotMatch(a.element('#detail').innerHTML,/Ouvrir "Fabriquer"/)});
test('craft unitaire : aide sur le bouton du composite, sans paragraphe au-dessus',()=>{const a=app();a.run('selected={ankama_id:1,name:"Recette"};rootNodes=[{uid:1,id:2,name:"Composite",qty:1,detail:{recipe:[{item_ankama_id:3,quantity:1}]},children:null,expanded:false}];renderDetail()');assert.doesNotMatch(a.element('#detail').innerHTML,/Ouvrir "Fabriquer"/);assert.match(a.element('#nodeList').innerHTML,/data-craft-help="Ouvrir &quot;Fabriquer&quot;/)});
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
test('marge unitaire et journalière sur 30 jours',()=>{const a=app({'dofusdude-prices':'{"2":80}'});a.run('rootNodes=[{id:2,qty:1,children:null}];craftQty=2');a.element('#sell').value='100';a.element('#monthlySales').value='150';a.run('calculate()');assert.equal(a.element('#statDiff').textContent,'+40 K');assert.equal(a.element('#statPercent').textContent,'+25,0 %');assert.equal(a.element('#statDaily').textContent,'+100 K');assert.equal(a.element('#statDailyPercent').textContent,'+125,0 %')});
test('marge non affichée sans prix HDV',()=>{const a=app({'dofusdude-prices':'{"2":80}'});a.run('rootNodes=[{id:2,qty:1,children:null}]');a.run('calculate()');assert.equal(a.element('#statDiff').textContent,'—')});

test('historique : achats en attente sans ventes',()=>{const a=app();a.run('ledger=[{id:"a",name:"Huile",qty:10,buy:1000,sales:[]}]');assert.equal(a.run('ledgerTotals(ledger).pending'),10000);assert.equal(a.run('ledgerTotals(ledger).profit'),0);assert.equal(a.run('ledgerTotals(ledger).remaining'),10)});
test('historique : revente partielle rentable',()=>{const a=app();a.run('ledger=[{id:"a",qty:10,buy:1000,sales:[{qty:4,price:1500}]}]');assert.equal(a.run('ledgerTotals(ledger).pending'),6000);assert.equal(a.run('ledgerTotals(ledger).profit'),1880);assert.equal(a.run('ledgerTotals(ledger).remaining'),6)});
test('historique : perte et vente totale',()=>{const a=app();a.run('ledger=[{id:"a",qty:3,buy:1000,sales:[{qty:1,price:500},{qty:2,price:900}]}]');assert.equal(a.run('ledgerTotals(ledger).pending'),0);assert.equal(a.run('ledgerTotals(ledger).profit'),-746)});
test('historique : plusieurs lots indépendants',()=>{const a=app();a.run('ledger=[{id:"a",qty:2,buy:100,sales:[{qty:2,price:120}]},{id:"b",qty:3,buy:200,sales:[{qty:1,price:150}]}]');assert.ok(Math.abs(a.run('ledgerTotals(ledger).profit')+17.8)<1e-8);assert.equal(a.run('ledgerTotals(ledger).pending'),400)});
test('historique : restauration des achats sauvegardés',()=>{const a=app({'dofusdude-purchase-ledger-v1':'[{"id":"a","qty":2,"buy":100,"sales":[]}]'});assert.equal(a.run('ledgerTotals(ledger).pending'),200)});
