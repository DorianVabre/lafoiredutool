const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const engine=require('../js/games/gelano-engine.js'),root=path.join(__dirname,'..');
const empty=()=>({...engine.initial(),pa:false});
test('Gelano : départ avec un PA et taux exacts dans chaque état',()=>{
 const initial=engine.initial();assert.equal(initial.pa,true);assert.equal(initial.pm,false);assert.equal(engine.chance(initial,'pa'),null);assert.equal(engine.chance(initial,'pm'),.015);
 assert.equal(engine.chance(empty(),'pa'),.66);assert.equal(engine.chance(empty(),'pm'),.015);
 assert.equal(engine.chance({...empty(),pm:true},'pa'),.26);assert.equal(engine.chance({...empty(),pm:true},'pm'),null);
});
test('Gelano : seuils de réussite stricts pour les trois taux',()=>{
 for(const [state,rune,rate] of [[empty(),'pa',.66],[empty(),'pm',.015],[engine.initial(),'pm',.015],[{...empty(),pm:true},'pa',.26]]){
  assert.equal(engine.attempt(state,rune,()=>rate-Number.EPSILON)[rune],true);
  assert.equal(engine.attempt(state,rune,()=>rate)[rune],false);
 }
});
test('Gelano : un échec PM retire le PA, un échec PA retire le PM',()=>{
 const before=engine.initial(),failedPm=engine.attempt(before,'pm',()=>.99);
 assert.equal(failedPm.pa,false);assert.equal(failedPm.pm,false);assert.equal(failedPm.history[0].lost,'pa');assert.equal(before.pa,true);assert.equal(before.used.pm,0);
 const pmOnly=engine.attempt(failedPm,'pm',()=>0),failedPa=engine.attempt(pmOnly,'pa',()=>.27);
 assert.equal(pmOnly.pm,true);assert.equal(failedPa.pm,false);assert.equal(failedPa.pa,false);assert.equal(failedPa.history[0].lost,'pm');
});
test('Gelano : victoire par les deux chemins, une rune consommée par tentative',()=>{
 const direct=engine.attempt(engine.initial(),'pm',()=>0);assert.equal(direct.won,true);assert.deepEqual(direct.used,{pa:0,pm:1});
 let state=engine.attempt(engine.initial(),'pm',()=>.9);state=engine.attempt(state,'pm',()=>.01);state=engine.attempt(state,'pa',()=>.25);
 assert.equal(state.won,true);assert.equal(state.pa,true);assert.equal(state.pm,true);assert.deepEqual(state.used,{pa:1,pm:2});assert.deepEqual(state.history.map(x=>x.number),[3,2,1]);
});
test('Gelano : pas de consommation sur un bonus déjà présent ou après victoire ; journal borné',()=>{
 const state=engine.initial(),noDraw=()=>{throw Error('Ce tirage ne doit pas se produire')};
 assert.equal(engine.attempt(state,'pa',noDraw),state);assert.equal(engine.attempt(state,'other',noDraw),state);
 const win=engine.attempt(state,'pm',()=>0);assert.equal(engine.attempt(win,'pm',noDraw),win);assert.equal(engine.attempt(win,'pa',noDraw),win);
 let long=empty();for(let i=0;i<35;i++)long=engine.attempt(long,'pm',()=>.99);
 assert.equal(long.used.pm,35);assert.equal(long.history.length,20);assert.equal(long.history[0].number,35);assert.equal(long.history.at(-1).number,16);
 assert.throws(()=>engine.attempt(state,'pm',()=>1),/Tirage invalide/);
});
test('accès secret : Entrée uniquement dans la recherche de runes, casse et espaces tolérés',()=>{
 const code=fs.readFileSync(path.join(root,'js/tools/forgemagie.js'),'utf8'),handler=code.match(/function fmOpenGelano\(event\)\{[\s\S]*?\n\}/)[0],input={value:''},window={location:{href:'index.html'}},ctx=vm.createContext({window,$:selector=>{assert.equal(selector,'#fmSearch');return input},fmNorm:value=>value.toLowerCase()});
 vm.runInContext(handler,ctx);
 for(const value of ['Gelano','gelano',' GELANO ']){input.value=value;const e={key:'Enter',preventDefault(){this.prevented=true}};window.location.href='index.html';ctx.fmOpenGelano(e);assert.equal(window.location.href,'gelano.html');assert.equal(e.prevented,true)}
 for(const [value,extra] of [['Gelano',{key:'a'}],['gelano pm',{}],['Gelano',{isComposing:true}],['Gelano',{repeat:true}],['',{}]]){input.value=value;window.location.href='index.html';ctx.fmOpenGelano({key:'Enter',...extra,preventDefault(){throw Error('La recherche ordinaire doit rester libre')}});assert.equal(window.location.href,'index.html')}
});
function app(draws,bestValue){
 const elements=new Map(),store=new Map(bestValue==null?[]:[['la-foire-du-tool-gelano-best-v1',String(bestValue)]]);
 function el(id){if(!elements.has(id))elements.set(id,{textContent:'',innerHTML:'',hidden:false,disabled:false,dataset:{},listeners:{},classList:{toggle(){}},addEventListener:(type,cb)=>el(id).listeners[type]=cb,setAttribute(name,value){this[name]=value},focus(){this.focused=true}});return elements.get(id)}
 const ctx=vm.createContext({document:{getElementById:el},localStorage:{getItem:key=>store.get(key),setItem:(key,value)=>store.set(key,value)},GelanoEngine:{...engine,attempt:(state,rune)=>engine.attempt(state,rune,()=>draws.shift())}});
 vm.runInContext(fs.readFileSync(path.join(root,'js/games/gelano.js'),'utf8'),ctx);
 return {el,store,click:id=>el(id).listeners.click()};
}
test('interface : échecs, victoire et recommencer conservent les bons scores et taux',()=>{
 const a=app([.9,0,.25]);assert.equal(a.el('applyPa').disabled,true);assert.equal(a.el('pmChance').textContent,'1,5 % de réussite');
 a.click('applyPm');assert.equal(a.el('paValue').textContent,'0');assert.equal(a.el('paChance').textContent,'66 % de réussite');assert.equal(a.el('runeCount').textContent,'1');
 a.click('applyPm');assert.equal(a.el('pmValue').textContent,'1');assert.equal(a.el('paChance').textContent,'26 % de réussite');
 a.click('applyPa');assert.equal(a.el('forgeVictory').hidden,false);assert.equal(a.el('runeCount').textContent,'3');assert.match(a.el('victoryScore').textContent,/3 runes utilisées : 1 PA et 2 PM/);assert.equal(a.el('bestScore').textContent,'3');assert.equal(a.el('applyPa').disabled,true);assert.equal(a.el('applyPm').disabled,true);
 a.click('restartForge');assert.equal(a.el('forgeVictory').hidden,true);assert.equal(a.el('paValue').textContent,'1');assert.equal(a.el('pmValue').textContent,'0');assert.equal(a.el('runeCount').textContent,'0');assert.equal(a.el('bestScore').textContent,'3');assert.equal(a.el('forgeHistory').innerHTML,'');
});
test('meilleur score : un record déjà meilleur reste intact après une victoire',()=>{
 const a=app([.9,.6,0],1);a.click('applyPm');a.click('applyPa');a.click('applyPm');assert.equal(a.el('forgeVictory').hidden,false);assert.equal(a.el('runeCount').textContent,'3');assert.equal(a.el('bestScore').textContent,'1');assert.equal(a.store.get('la-foire-du-tool-gelano-best-v1'),'1');
});
test('mini-jeu autonome : images locales valides et ressources de page présentes',()=>{
 const html=fs.readFileSync(path.join(root,'gelano.html'),'utf8');
 for(const match of html.matchAll(/(?:src|href)="((?:css|js|data)\/[^\"]+)"/g))assert.ok(fs.existsSync(path.join(root,match[1])),match[1]);
 for(const name of ['gelano','ga-pa','ga-pme'])assert.equal(fs.readFileSync(path.join(root,'data/gelano',name+'.png')).subarray(1,4).toString(),'PNG');
 assert.match(html,/href="index.html#fm"/);
});
