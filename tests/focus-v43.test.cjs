const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(require('node:path').join(__dirname,'../dofus-craft.html'),'utf8');
for(const [name,file,fn,scope,selector] of [['unitaire','craft.js','updateNodes','#nodeList','[data-price-node]'],['multicraft','multicraft.js','multiRender','#multiSelected','[data-mprice]']]){
 test(name+' : passer à un autre prix ou à une horloge conserve le champ et le clic',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../js/tools',file),'utf8').replace(/\r\n/g,'\n'),start=source.indexOf('function '+fn+'()'),end=source.indexOf(file==='craft.js'?'\nfunction renderDetail(':'\n\n',start);
  const listeners={},input={addEventListener:(type,cb)=>listeners[type]=cb},area={querySelectorAll:s=>s===selector?[input]:[]};let renders=0;
  const ctx=vm.createContext({$:()=>area,rootNodes:[],multi:{items:[]},calculate(){},multiCalculate(){}});
  vm.runInContext(source.slice(start,end),ctx);ctx[fn]();ctx[fn]=()=>renders++;
  const blur=listeners.blur||input.onblur;
  for(const target of [scope+' input',scope+' .price-age'])blur({relatedTarget:{matches:selector=>selector.split(',').includes(target)}});
  assert.equal(renders,0);blur({relatedTarget:{matches:()=>false}});assert.equal(renders,1);blur({relatedTarget:null});assert.equal(renders,2);
 });
}
test('pas de rerender sur change de prix multicraft',()=>assert.ok(!/el\.onblur=multiRender;el\.onchange=multiRender/.test(html)));
test('farm : cliquer sur l’horloge du prix ne supprime pas son infobulle',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../js/tools/farm.js'),'utf8'),line=source.split('\n').find(s=>s.includes("addEventListener('focusout'"));let handler,renders=0;
 const ctx=vm.createContext({$:()=>({addEventListener:(_,cb)=>handler=cb}),farmRender:()=>renders++});vm.runInContext(line,ctx);
 const wrap={},target={matches:()=>true,parentElement:wrap};handler({target,relatedTarget:{closest:()=>wrap}});assert.equal(renders,0);
 handler({target,relatedTarget:{closest:()=>null}});assert.equal(renders,1);
});
