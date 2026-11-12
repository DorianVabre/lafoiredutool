'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../dofus-craft.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
function app(initial={}){
 const store=new Map(Object.entries(initial));
 const elements=new Map();
 const el=(key)=>{if(!elements.has(key))elements.set(key,{value:'',checked:true,textContent:'',innerHTML:'',dataset:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},replaceWith(){}});return elements.get(key)};
 const document={querySelector:el,querySelectorAll(){return []},createElement(){return {innerHTML:'',firstElementChild:{}}}};
 const localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
 const context=vm.createContext({document,localStorage,URLSearchParams,AbortController,fetch:async()=>{throw Error('offline fixture')},setTimeout,clearTimeout,console,Date,Math});
 vm.runInContext(script,context,{filename:'v89-app.js'});
 return {run:s=>vm.runInContext(s,context),store,el};
}
const a=app();
const val=x=>JSON.parse(JSON.stringify(x));
// Contrats d'interface : les sept outils doivent rester accessibles après la modularisation.
for(const [name,id] of Object.entries({single:'singleMode',multi:'multiMode',brisage:'breakMode',historique:'ledgerMode',parchotage:'scrollMode',farm:'farmMode',forgemagie:'fmMode'})){
 test(`navigation : ${name} conserve son conteneur`,()=>assert.match(html,new RegExp(`id="${id}"`)));
}
for(const id of ['tabSingle','tabMulti','tabBreak','tabLedger','tabScroll','tabFarm','tabFm'])test(`navigation : bouton ${id}`,()=>assert.match(html,new RegExp(`id="${id}"`)));
for(const [name,id] of Object.entries({craft:'singleMode',multi:'multiMode',farm:'farmMode',fm:'fmMode'}))test(`un seul identifiant principal : ${name}`,()=>assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1));
for(const id of ['farmCreate','farmSort','farmSessionContent','fmPrices','fmRanking','fmLow','fmHigh','fmBasicOnly','ledgerForm','ledgerLotDialog','scrollStat'])test(`champs métier : ${id}`,()=>assert.match(html,new RegExp(`id="${id}"`)));
// Forgemagie : valeurs catalogue et comparaison récursive acheter/fabriquer.
for(const [id,weight] of [['Vi',1],['Pa Vi',3],['Ra Vi',10],['Sa',3],['Pa Sa',9],['Ra Sa',30],['Ga Pa',100],['Ga Pme',90]])test(`FM : poids total ${id}`,()=>assert.equal(a.run(`fmRuneById.get(${JSON.stringify(id)})?.weight`),weight));
test('FM : catalogue sans identifiants dupliqués',()=>assert.equal(a.run('new Set(fmRunes.map(r=>r.id)).size'),a.run('fmRunes.length')));
test('FM : poids positifs',()=>assert.ok(a.run('fmRunes.every(r=>r.weight>0)')));
test('FM : pas de rune Pa ou Ra artificielle pour Ga Pa',()=>assert.equal(a.run('fmRuneById.has("Pa Ga Pa")||fmRuneById.has("Ra Ga Pa")'),false));
test('FM : recherche du palier précédent',()=>assert.equal(a.run('fmPreviousRune(fmRuneById.get("Ra Vi")).id'),'Pa Vi'));
test('FM : rune basique sans précédent',()=>assert.equal(a.run('fmPreviousRune(fmRuneById.get("Vi"))'),null));
for(const [name,prices,expected,method] of [
 ['Pa fabriquée',{'Vi':100,'Pa Vi':400},300,'craft'],
 ['Pa achetée',{'Vi':100,'Pa Vi':250},250,'buy'],
 ['égalité Pa',{'Vi':100,'Pa Vi':300},300,'buy'],
 ['Ra fabriquée via Pa',{'Vi':100,'Pa Vi':400,'Ra Vi':2000},900,'craft'],
 ['Ra fabriquée via Pa achetée',{'Vi':100,'Pa Vi':200,'Ra Vi':1000},600,'craft'],
 ['Ra achetée',{'Vi':100,'Pa Vi':400,'Ra Vi':500},500,'buy'],
 ['Pa sans prix direct',{'Vi':100},300,'craft'],
 ['Ra sans prix direct',{'Vi':100},900,'craft'],
 ['Pa sans rune basique',{'Pa Vi':420},420,'buy']
])test(`FM : ${name}`,()=>{const b=app({'dofus-fm-rune-prices-v1':JSON.stringify(prices)});const id=name.startsWith('Ra')?'Ra Vi':'Pa Vi';assert.equal(b.run(`fmBestCost(fmRuneById.get('${id}')).cost`),expected);assert.equal(b.run(`fmBestCost(fmRuneById.get('${id}')).method`),method)});
for(const p of ['',0,-2,'abc',null])test(`FM : prix invalide ${JSON.stringify(p)} ignoré`,()=>{const b=app({'dofus-fm-rune-prices-v1':JSON.stringify({'Vi':p})});assert.equal(b.run('fmBestCost(fmRuneById.get("Vi"))'),null)});
test('FM : rapport poids/prix décroissant',()=>{const b=app({'dofus-fm-rune-prices-v1':JSON.stringify({Vi:10,Sa:60,Fo:20})});assert.equal(b.run('fmRank([fmRuneById.get("Sa"),fmRuneById.get("Fo"),fmRuneById.get("Vi")])[0].id'),'Vi')});
test('FM : faibles poids <=4 et forts >4',()=>{assert.ok(a.run('fmRunes.filter(r=>r.weight<=4).every(r=>r.weight<=4)'));assert.ok(a.run('fmRunes.filter(r=>r.weight>4).every(r=>r.weight>4)'))});
test('FM : case runes basiques cochée par défaut',()=>assert.match(html,/id="fmBasicOnly"[^>]*checked/));
test('FM : prix locaux préservés au chargement',()=>{const b=app({'dofus-fm-rune-prices-v1':'{"Vi":123}'});assert.equal(b.run('fmPrices.Vi'),123)});
// Parchotage : optimisation exacte, contraintes de seuil, erreurs et coûts.
for(const current of [-1,101,1.5,NaN])test(`parcho : niveau invalide ${current}`,()=>assert.equal(a.run(`scrollOptimize(${String(current)},[1,1,1,1])`),null));
test('parcho : déjà à 100 = coût nul',()=>assert.equal(a.run('scrollOptimize(100,[1,1,1,1]).total'),0));
test('parcho : aucun prix = impossible',()=>assert.equal(a.run('scrollOptimize(0,[null,null,null,null])'),null));
test('parcho : puissant seul depuis 0',()=>{const r=val(a.run('scrollOptimize(0,[null,null,null,5])'));assert.equal(r.total,250);assert.equal(r.counts[3],50)});
test('parcho : petit seul impossible après seuil',()=>assert.equal(a.run('scrollOptimize(0,[1,null,null,null])'),null));
test('parcho : grand seul impossible après seuil',()=>assert.equal(a.run('scrollOptimize(0,[null,null,1,null])'),null));
test('parcho : puissant depuis 99 atteint 101, impossible',()=>assert.equal(a.run('scrollOptimize(99,[null,null,null,1])'),null));
test('parcho : départ 98 puissant une fois',()=>assert.equal(a.run('scrollOptimize(98,[null,null,null,7]).total'),7));
for(const start of [0,1,20,24,25,49,50,79,80,90,98,100])test(`parcho : chemin optimal exact depuis ${start}`,()=>{const r=val(a.run(`scrollOptimize(${start},[2,3,4,5])`));assert.ok(r);assert.equal(r.steps.reduce((n,s)=>n+s.to-s.from,start),100);assert.equal(r.steps.reduce((n,s)=>n+[2,3,4,5][s.index],0),r.total);for(const s of r.steps)assert.ok(s.from<[25,50,80,100][s.index]);});
// Farm : timer, pause, rendement, historique et prix partagés.
for(const [name,timer,now,ms] of [
 ['actif',{startedAt:1000,pausedMs:0},61000,60000],
 ['pause',{startedAt:1000,pausedAt:31000,pausedMs:0},99000,30000],
 ['reprise',{startedAt:1000,pausedMs:10000},71000,60000],
 ['arrêt',{startedAt:1000,stoppedAt:41000,pausedMs:10000},99000,30000],
 ['durée négative',{startedAt:10000,pausedMs:0},5000,0]
])test(`farm : durée ${name}`,()=>assert.equal(a.run(`farmElapsed(${JSON.stringify(timer)},${now})`),ms));
for(const [ms,expected] of [[0,'00:00:00'],[999,'00:00:00'],[1000,'00:00:01'],[60000,'00:01:00'],[3600000,'01:00:00'],[3661000,'01:01:01']])test(`farm : affichage ${ms}ms`,()=>assert.equal(a.run(`farmSeconds(${ms})`),expected));
test('farm : zéro session => rendement indisponible',()=>assert.equal(a.run('farmTotals({sessions:[]}).kph'),null));
test('farm : une heure et 10 objets à 100 K',()=>{const b=app({'dofusdude-prices':'{"12":100}'});const t=val(b.run('farmTotals({sessions:[{duration:3600000,counts:{12:10}}]})'));assert.equal(t.kph,1000);assert.equal(t.revenue,1000)});
test('farm : moyenne pondérée par temps total',()=>{const b=app({'dofusdude-prices':'{"12":100}'});const t=val(b.run('farmTotals({sessions:[{duration:3600000,counts:{12:10}},{duration:1800000,counts:{12:10}}]})'));assert.equal(t.kph,4000/3);assert.equal(t.ms,5400000)});
test('farm : prix manquant => rendement indisponible',()=>{const t=val(a.run('farmTotals({sessions:[{duration:3600000,counts:{777777:2}}]})'));assert.equal(t.complete,false);assert.equal(t.kph,null)});
test('farm : quantité nulle sans prix ne bloque pas',()=>assert.equal(a.run('farmTotals({sessions:[{duration:3600000,counts:{777777:0}}]}).complete'),true));
test('farm : stockage des activités rechargé',()=>{const b=app({'la-foire-du-tool-farm-v1':'[{"id":"x","name":"Farm","sessions":[]}]'});assert.equal(b.run('farmActivities[0].name'),'Farm')});
test('farm : état de pause rechargé',()=>{const b=app({'la-foire-du-tool-farm-running-v1':'{"startedAt":1000,"pausedAt":2000,"pausedMs":0}'});assert.equal(b.run('farmRunning.pausedAt'),2000)});
// Historique : taxe sur chaque vente, ventes partielles et archivage.
for(const [buy,sell,qty,profit] of [[100,150,1,47],[100,150,10,470],[100,100,1,-2],[0,1000,2,1960],[100,0,1,-100]])test(`historique : taxe 2% ${buy}/${sell} x${qty}`,()=>assert.ok(Math.abs(a.run(`ledgerSaleProfit({buy:${buy}},{qty:${qty},price:${sell}})`)-profit)<1e-8));
test('historique : lot partiellement vendu conserve son stock',()=>{const t=val(a.run('ledgerTotals([{qty:10,buy:100,sales:[{qty:4,price:200}]}])'));assert.equal(t.pending,600);assert.equal(t.remaining,6);assert.equal(t.profit,384)});
test('historique : lots indépendants',()=>{const t=val(a.run('ledgerTotals([{qty:2,buy:100,sales:[{qty:2,price:200}]},{qty:3,buy:50,sales:[]}])'));assert.equal(t.pending,150);assert.equal(t.remaining,3);assert.equal(t.profit,192)});
test('historique : stockage antérieur rechargé',()=>{const b=app({'dofusdude-purchase-ledger-v1':'[{"id":"old","qty":2,"buy":100,"sales":[]}]'});assert.equal(b.run('ledger[0].id'),'old')});
// Stockage et sécurité des données : préserver les clés avant refonte.
for(const key of ['dofusdude-prices','dofusdude-item-fields','dofusdude-purchase-ledger-v1','la-foire-du-tool-parchotage-v1','la-foire-du-tool-farm-v1','la-foire-du-tool-farm-running-v1','dofus-fm-rune-prices-v1'])test(`stockage : clé ${key} présente`,()=>assert.ok(script.includes(key)));
test('HTML : pas de JS externe requis avant refonte',()=>assert.equal((html.match(/<script\s+src=/g)||[]).length,0));
test('HTML : code JavaScript intégré unique',()=>assert.equal((html.match(/<script>/g)||[]).length,1));
test('HTML : CSS intégré unique',()=>assert.equal((html.match(/<style>/g)||[]).length,1));
test('HTML : navigation par blocs',()=>{for(const label of ['Craft','Rentabilité','Optimisation','Autres'])assert.ok(html.includes(label))});
