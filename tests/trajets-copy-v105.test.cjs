const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
function app({deny=false,minimap=false}={}){
 const elements=new Map(),copies=[];
 function element(id=''){
  return {id,attributes:{},setAttribute(k,v){this.attributes[k]=String(v)},getBoundingClientRect(){return {left:0,top:0,width:640,height:360}},value:id==='travelWorld'?'1':'',hidden:false,textContent:'',children:[],dataset:{},listeners:{},classList:{toggle(){}},
   addEventListener(type,fn){this.listeners[type]=fn},replaceChildren(...items){this.children=items},append(...items){this.children.push(...items)},focus(){this.focused=true},select(){this.selected=true},setSelectionRange(start,end){this.selection=[start,end]}};
 }
 const document={getElementById(id){if(!elements.has(id))elements.set(id,element(id));return elements.get(id)},createElement(){return element()},createTextNode(text){return {textContent:text}}};
 if(minimap)document.createElementNS=(_,tag)=>element(tag);
 const ctx=vm.createContext({window:{},document,navigator:{clipboard:{async writeText(value){if(deny)throw Error('Denied');copies.push(value)}}},localStorage:{getItem(){return null},setItem(){}}});
 for(const file of ['data/trajets-3.7.13.17.js','js/tools/trajets-engine.js','js/tools/minimap.js','js/tools/trajets.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
 const el=id=>document.getElementById(id);
 async function calculate(value){el('travelCoordinates').value=value;await el('travelForm').listeners.submit({preventDefault(){}});await Promise.resolve()}
 return {el,copies,calculate};
}
test('un calcul copie automatiquement la commande combinée, sans clic supplémentaire',async()=>{
 const a=app();await a.calculate('-4 0');assert.deepEqual(a.copies,['/zaap -2,0 ; /travel -4,0']);assert.equal(a.el('travelCombinedCommand').value,a.copies[0]);assert.equal(a.el('travelCopyStatus').textContent,'Commande combinée copiée.');assert.equal(a.el('travelStatus').textContent,'');
 await a.el('travelCopyCommand').listeners.click();assert.equal(a.copies.length,2);
});
test('plusieurs portions : copie immédiate du trajet le plus court sans demander de choix',async()=>{
 const a=app();await a.calculate('-6,-3');assert.deepEqual(a.copies,['/zaap -16,1 ; /travel -6,-3']);assert.equal(a.el('travelSteps').textContent,'16 changements de map');assert.doesNotMatch(a.el('travelTargetLabel').textContent,/portion/i);
});
test('un autre zaap recopie sa commande ; une saisie invalide ne recopie pas le trajet précédent',async()=>{
 const a=app();await a.calculate('[-4,0]');a.el('travelAlternatives').children[1].listeners.click();await Promise.resolve();assert.equal(a.copies.at(-1),'/zaap 13,26 ; /travel -4,0');
 const count=a.copies.length;await a.calculate('abc');assert.equal(a.copies.length,count);assert.equal(a.el('travelCombinedCommand').value,'');assert.equal(a.el('travelResult').hidden,true);
});
test('presse-papier refusé : résultat conservé, message utile et sélection manuelle possible',async()=>{
 const a=app({deny:true});await a.calculate('-4,0');assert.equal(a.el('travelCombinedCommand').value,'/zaap -2,0 ; /travel -4,0');assert.equal(a.el('travelCommands').hidden,false);assert.match(a.el('travelCopyStatus').textContent,/Copie automatique indisponible/);
 await a.el('travelCopyCommand').listeners.click();assert.equal(a.el('travelCombinedCommand').selected,true);assert.match(a.el('travelCopyStatus').textContent,/Ctrl\+C/);
});
test('icône du zaap : copie seulement /zaap, suit le zaap sélectionné et garde la commande combinée',async()=>{
 const a=app();await a.calculate('-4,0');assert.equal(a.el('travelCopyZaapOnly').hidden,false);
 await a.el('travelCopyZaapOnly').listeners.click();assert.equal(a.copies.at(-1),'/zaap -2,0');assert.equal(a.el('travelCombinedCommand').value,'/zaap -2,0 ; /travel -4,0');
 a.el('travelAlternatives').children[1].listeners.click();await Promise.resolve();await a.el('travelCopyZaapOnly').listeners.click();assert.equal(a.copies.at(-1),'/zaap 13,26');
 await a.calculate('abc');assert.equal(a.el('travelCopyZaapOnly').hidden,true);
});
test('copie /zaap refusée : sélectionne uniquement le préfixe /zaap pour Ctrl+C',async()=>{
 const a=app({deny:true});await a.calculate('-4,0');await a.el('travelCopyZaapOnly').listeners.click();const input=a.el('travelCombinedCommand');assert.equal(input.value.slice(...input.selection),'/zaap -2,0');assert.match(a.el('travelCopyStatus').textContent,/\/zaap sélectionnée/);
});

test('V189 : minimap partagée, destination au clic et carte masquée dans les autres mondes',async()=>{
 const a=app({minimap:true});await a.calculate('[-6,-3]');const map=a.el('travelMinimap');assert.ok(map.children.some(n=>n.id==='image'));assert.ok(map.children.some(n=>n.attributes['data-map-cell']==='destination'));assert.ok(map.children.some(n=>n.attributes['data-map-grid']==='lines'));a.el('travelMapZoomIn').listeners.click();a.el('travelCoordinates').value='[-6,-3]';a.el('travelCoordinates').listeners.input();a.el('travelMapCenter').listeners.click();const e={button:0,pointerId:1,clientX:320,clientY:180};map.listeners.pointermove(e);const hover=map.children.find(n=>n.attributes['data-map-hover']==='true');assert.equal(hover.children.find(n=>n.attributes['data-map-tooltip']==='true').textContent,'[-6,-3]');map.listeners.pointerdown(e);map.listeners.pointerup(e);assert.equal(a.el('travelCoordinates').value,'[-6,-3]');assert.equal(a.el('travelResult').hidden,true);a.el('travelWorld').value='2';a.el('travelWorld').listeners.change();assert.equal(a.el('travelMapPanel').hidden,true);a.el('travelWorld').value='1';a.el('travelWorld').listeners.change();assert.equal(a.el('travelMapPanel').hidden,false);
});
