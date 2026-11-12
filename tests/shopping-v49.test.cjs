const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../dofus-craft.html'),'utf8');
const code=html.slice(html.indexOf('function multiShoppingRows('),html.indexOf('function multiShoppingRender('));
function rows(owned,price=10){const ctx={multi:{inventory:{1:owned},items:[]},prices:{1:price},itemFields:{},isPrice:v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))&&Number(v)>=0};vm.createContext(ctx);vm.runInContext(code,ctx);return ctx.multiShoppingRows(new Map([['1',20]]),new Map([['1',{id:1,name:'Cuir de Bouftou'}]]))[0]}
test('stock only changes remaining shopping qty',()=>{assert.equal(rows(12).need,20);assert.equal(rows(12).remaining,8);assert.equal(rows(12).cost,80)});
test('stock cannot make negative shopping quantities',()=>{assert.equal(rows(30).remaining,0);assert.equal(rows(30).cost,0)});
test('shopping row with no stock pays all',()=>{assert.equal(rows(0).cost,200)});
test('plan no longer uses stock to choose craft/buy',()=>{const p=html.slice(html.indexOf('function multiPlan(){'),html.indexOf('function multiShoppingRows('));assert.doesNotMatch(p,/multi\.inventory/);assert.match(p,/multiEntryDecision\(e\)/)});
test('no separate inventory section',()=>assert.doesNotMatch(html,/id="multiInventory"/));
test('shopping list includes possessed input',()=>assert.match(html,/data-mowned-final/));
