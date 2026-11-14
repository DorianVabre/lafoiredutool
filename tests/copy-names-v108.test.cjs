const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),helper=fs.readFileSync(path.join(root,'js/core/copy-names.js'),'utf8');
function setup({denied=false,fallback=false,dialog=false}={}){
 const copied=[],listeners=[],timers=[],parent={append(field){this.field=field}},focused={focus(){this.restored=true}};
 const document={body:parent,activeElement:focused,addEventListener(...args){listeners.push(args)},createElement(){return {style:{},setAttribute(){},select(){this.selected=true},remove(){this.removed=true}}}};
 if(fallback)document.execCommand=action=>{assert.equal(action,'copy');copied.push(parent.field.value);return true};
 const ctx=vm.createContext({document,navigator:{clipboard:{async writeText(value){if(denied)throw Error('denied');copied.push(value)}}},esc:s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),setTimeout:fn=>timers.push(fn)});
 vm.runInContext(helper,ctx);
 function button(name){return {dataset:{copyName:name},title:'Copier le nom',setAttribute(key,value){this[key]=value},closest(){return dialog?parent:null}}}
 return {ctx,copied,listeners,timers,parent,focused,button};
}
test('les noms avec accents, apostrophes et balises sont échappés pour le HTML mais copiés exactement',async()=>{
 const a=setup(),name='Épée d’"Amakna" <rare> & Co';a.ctx.name=name;
 const html=vm.runInContext('itemNameHTML(name)',a.ctx);assert.ok(html.includes('&lt;rare&gt; &amp; Co'));assert.ok(html.includes('&quot;Amakna&quot;'));assert.ok(!html.includes('<rare>'));assert.equal(vm.runInContext('itemNameHTML("")',a.ctx),'');assert.doesNotMatch(html,/<button|<svg|item-name-with-copy/);
 const b=a.button(name);assert.equal(await a.ctx.copyItemName(b),true);assert.deepEqual(a.copied,[name]);assert.equal(b.dataset.copyState,'copied');assert.match(b['aria-label'],/Nom copié/);
 const rune=vm.runInContext('itemNameHTML("Fo","Rune Fo")',a.ctx);assert.match(rune,/>Fo<\/span>/);assert.match(rune,/data-copy-name="Rune Fo"/);
});
test('délégation en capture : un nom ajouté après un rendu ne déclenche pas la sélection de son objet',async()=>{
 const a=setup(),[type,handler,capture]=a.listeners[0],b=a.button('Cuir de Bouftou');assert.equal(type,'click');assert.equal(capture,true);
 const event={target:{closest(){return b}},preventDefault(){this.prevented=true},stopPropagation(){this.stopped=true}};handler(event);await Promise.resolve();assert.equal(event.prevented,true);assert.equal(event.stopped,true);assert.deepEqual(a.copied,['Cuir de Bouftou']);
 const ordinary={target:{closest(){return null}},preventDefault(){throw Error('ordinary click prevented')},stopPropagation(){throw Error('ordinary click stopped')}};handler(ordinary);
});
test('Entrée et Espace copient le nom sans activer la sélection parente ; les autres touches restent libres',async()=>{
 const a=setup(),handler=a.listeners.find(([type])=>type==='keydown')[1],b=a.button('Rune Fo');
 for(const key of ['Enter',' ']){const e={type:'keydown',key,target:{closest(){return b}},preventDefault(){this.prevented=true},stopPropagation(){this.stopped=true}};handler(e);await Promise.resolve();assert.equal(e.prevented,true);assert.equal(e.stopped,true)}
 assert.deepEqual(a.copied,['Rune Fo','Rune Fo']);handler({type:'keydown',key:'ArrowDown',target:{closest(){return b}}});assert.equal(a.copied.length,2);
});
test('copie dans une modale : repli local, champ temporaire retiré et focus restauré',async()=>{
 const a=setup({denied:true,fallback:true,dialog:true});assert.equal(await a.ctx.copyItemName(a.button('Rune Pa Fo')),true);assert.deepEqual(a.copied,['Rune Pa Fo']);assert.equal(a.parent.field.selected,true);assert.equal(a.parent.field.removed,true);assert.equal(a.focused.restored,true);
});
test('refus du presse-papiers : pas de faux succès, et un ancien délai ne masque pas une nouvelle confirmation',async()=>{
 const failure=setup({denied:true}),bad=failure.button('Rune Fo');assert.equal(await failure.ctx.copyItemName(bad),false);assert.equal(bad.dataset.copyState,'error');
 const a=setup(),b=a.button('Rune Fo');await a.ctx.copyItemName(b);await a.ctx.copyItemName(b);a.timers[0]();assert.equal(b.dataset.copyState,'copied');a.timers[1]();assert.equal(b.dataset.copyState,undefined);
});
