const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../js/tools/parchotage.js'),'utf8'),key='la-foire-du-tool-parchotage-v1';
function app(saved={}){
 const elements=new Map(),store=new Map([[key,JSON.stringify(saved)]]),pageEvents={};
 function el(id){if(!elements.has(id))elements.set(id,{value:id==='#scrollStat'?'Vitalité':id==='#scrollCurrent'?'0':'',textContent:'',innerHTML:'',listeners:{},addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)}});return elements.get(id)}
 const ctx=vm.createContext({document:{querySelector:el},window:{addEventListener(type,fn){pageEvents[type]=fn}},localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},fmt:n=>n+' K'});
 vm.runInContext(code,ctx);
 const fire=(id,type)=>{for(const listener of el(id).listeners[type]||[])listener()};
 return {el,fire,store,pageEvents};
}
test('Vitalité par défaut : les prix restaurés sans événement input sont recalculés à l’ouverture de l’onglet',()=>{
 const a=app();assert.equal(a.el('#scrollTotal').textContent,'—');
 ['100','200','300','400'].forEach((price,i)=>a.el('#scrollPrice'+i).value=price);
 a.fire('#tabScroll','click');assert.equal(a.el('#scrollStat').value,'Vitalité');assert.equal(a.el('#scrollTotal').textContent,'17500 K');
 assert.deepEqual(JSON.parse(a.store.get(key)).Vitalité.prices,['100','200','300','400']);
});
test('Vitalité par défaut : une validation change sans input déclenche aussi le calcul',()=>{
 const a=app();a.el('#scrollPrice3').value='150';a.fire('#scrollPrice3','change');assert.equal(a.el('#scrollTotal').textContent,'7500 K');
});
test('les données sauvegardées et les caractéristiques restent indépendantes',()=>{
 const a=app({'Vitalité':{current:'98',prices:['','','','200']},Force:{current:'90',prices:['','','','100']}});
 assert.equal(a.el('#scrollTotal').textContent,'200 K');a.el('#scrollStat').value='Force';a.fire('#scrollStat','change');assert.equal(a.el('#scrollTotal').textContent,'500 K');
 a.el('#scrollStat').value='Vitalité';a.fire('#scrollStat','change');a.fire('#tabScroll','click');assert.equal(a.el('#scrollCurrent').value,'98');assert.equal(a.el('#scrollPrice3').value,'200');assert.equal(a.el('#scrollTotal').textContent,'200 K');
});
