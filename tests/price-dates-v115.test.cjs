const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../js/core/prices.js'),'utf8'),KEY='la-foire-du-tool-price-dates-v1',DAY=86400000,NOW=1800000000000;
function app(initial){
 const store=new Map(initial||[]),ctx=vm.createContext({localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)}});
 vm.runInContext(code,ctx);return {api:vm.runInContext('PriceDates',ctx),store};
}
test('prix hérités sans date : restent inconnus sans être datés au chargement',()=>{
 const a=app([['dofusdude-prices','{"123":100}']]);assert.equal(a.api.describe('item:123','100',NOW).at,null);assert.equal(a.api.describe('item:123','100',NOW).old,true);assert.equal(a.store.has(KEY),false);
 assert.equal(a.store.get('dofusdude-prices'),'{"123":100}');assert.equal(a.api.describe('item:123','',NOW),null);
});
test('ancienneté en jours révolus et avertissement à partir de sept jours',()=>{
 const a=app();a.api.record('item:123',100,NOW);
 for(const [elapsed,text,old] of [[0,'Prix daté d’aujourd’hui',false],[DAY-1,'Prix daté d’aujourd’hui',false],[DAY,'Prix daté de 1 jour',false],[6*DAY,'Prix daté de 6 jours',false],[7*DAY,'Prix daté de 7 jours',true],[31*DAY,'Prix daté de 31 jours',true]]){
  const info=a.api.describe('item:123',100,NOW+elapsed);assert.equal(info.text,text);assert.equal(info.old,old);assert.equal(info.at,NOW);
 }
});
test('la date persiste après rechargement et ne dépend pas du format numérique',()=>{
 const a=app();a.api.record('item:123','0100',NOW);const b=app(a.store);
 assert.equal(b.api.describe('item:123',100,NOW+10*DAY).at,NOW);assert.equal(b.api.describe('item:123','100',NOW+10*DAY).old,true);
 assert.equal(b.api.describe('item:123',101,NOW+10*DAY).at,null);
});
test('saisir à nouveau le même prix remet sa date à zéro ; effacer retire la date',()=>{
 const a=app();a.api.record('item:123',100,NOW);a.api.record('item:123',100,NOW+9*DAY);
 assert.equal(a.api.describe('item:123',100,NOW+9*DAY).old,false);assert.equal(a.api.describe('item:123',100,NOW+9*DAY).at,NOW+9*DAY);
 a.api.record('item:123','',NOW+10*DAY);assert.equal(a.api.describe('item:123',100,NOW+10*DAY).at,null);assert.equal(Object.hasOwn(JSON.parse(a.store.get(KEY)),'item:123'),false);
});
test('prix nul accepté ; outils, caractéristiques et équipements de brisage indépendants',()=>{
 const a=app(),keys=['item:123','sell:123','scroll:Vitalité:0','scroll:Force:0','scroll:Vitalité:1','fm:Vi','break:123:cost','break:123:rune:Vi','break:456:rune:Vi'];
 keys.forEach((key,i)=>a.api.record(key,0,NOW+i));keys.forEach((key,i)=>assert.equal(a.api.describe(key,'0',NOW+DAY).at,NOW+i));
 a.api.record('item:123',200,NOW+DAY);assert.equal(a.api.describe('sell:123',0,NOW+DAY).at,NOW+1);
});
test('stockage indisponible, corrompu et dates futures : calcul utilisable sans date fictive',()=>{
 for(const saved of ['null','[]','invalid','{"item:123":{"value":100,"at":"hier"}}'])assert.equal(app([[KEY,saved]]).api.describe('item:123',100,NOW).at,null);
 const a=app();a.api.record('item:123',100,NOW+DAY);assert.equal(a.api.describe('item:123',100,NOW).at,null);
 const ctx=vm.createContext({localStorage:{getItem(){throw Error('denied')},setItem(){throw Error('denied')}}});vm.runInContext(code,ctx);
 assert.equal(vm.runInContext('PriceDates.record("item:123",100,1800000000000);PriceDates.describe("item:123",100,1800000000000).at',ctx),NOW);
});
