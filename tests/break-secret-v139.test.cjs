const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),full=fs.readFileSync(path.join(root,'js/tools/brisage.js'),'utf8'),source=full.slice(full.indexOf('\n',full.indexOf('// Entrée du mini-jeu :'))+1);
function app(){
 const events={},windowEvents={},timers=new Map();let sequence=0,shakes=0;
 function classes(){const values=new Set();return {add:v=>values.add(v),remove:v=>values.delete(v),contains:v=>values.has(v)}}
 const pickup={tagName:'BUTTON',attrs:{},setAttribute(k,v){this.attrs[k]=v},getBoundingClientRect(){return {left:10,top:20,width:20,height:20}}},mode={classList:classes()},body={classList:classes(),append(el){this.hammer=el},animate(){shakes++;return {cancel(){}}}};
 const document={body,getElementById:id=>id==='breakHammerPickup'?pickup:mode,createElement:()=>({style:{},setAttribute(){}}),addEventListener:(name,fn)=>events[name]=fn};
 const window={location:{href:'index.html'},addEventListener:(name,fn)=>windowEvents[name]=fn};
 vm.runInNewContext(source,{document,window,setTimeout:fn=>{timers.set(++sequence,fn);return sequence},clearTimeout:id=>timers.delete(id)});
 function click(id){events.click({target:{closest:selector=>selector==='#'+id?{}:null},clientX:100,clientY:120})}
 function finish(){for(const fn of [...timers.values()])fn();timers.clear()}
 return {click,finish,events,windowEvents,pickup,mode,body,window,shakes:()=>shakes};
}
test('sans marteau, cliquer le vase ne fait rien ; le marteau suit le pointeur',()=>{
 const a=app();a.click('breakSecretVase');assert.equal(a.shakes(),0);a.click('breakHammerPickup');assert.equal(a.body.hammer.hidden,false);assert.equal(a.pickup.attrs['aria-pressed'],'true');
 a.events.pointermove({clientX:250,clientY:300});assert.equal(a.body.hammer.style.left,'250px');assert.equal(a.body.hammer.style.top,'300px');
});
test('trois coups, trois secousses et une seule ouverture après la dernière secousse',()=>{
 const a=app();a.click('breakHammerPickup');a.click('breakSecretVase');a.click('breakSecretVase');a.finish();assert.equal(a.window.location.href,'index.html');
 a.click('breakSecretVase');a.click('breakSecretVase');assert.equal(a.shakes(),3);assert.equal(a.window.location.href,'index.html');a.finish();assert.equal(a.window.location.href,'concasseur.html');
});
test('Échap repose le marteau et remet les coups à zéro',()=>{
 const a=app();a.click('breakHammerPickup');a.click('breakSecretVase');a.click('breakSecretVase');a.events.keydown({key:'Escape'});assert.equal(a.body.hammer.hidden,true);assert.equal(a.pickup.attrs['aria-pressed'],'false');
 a.click('breakHammerPickup');a.click('breakSecretVase');a.finish();assert.equal(a.window.location.href,'index.html');
});
test('quitter l’outil annule la redirection en attente et rend le curseur normal',()=>{
 const a=app();a.click('breakHammerPickup');for(let i=0;i<3;i++)a.click('breakSecretVase');a.mode.classList.add('mode-hidden');a.click('tabSingle');a.finish();assert.equal(a.window.location.href,'index.html');assert.equal(a.body.classList.contains('holding-break-hammer'),false);
});
test('le troisième coup conduit à la page du concasseur',()=>{const html=fs.readFileSync(path.join(root,'concasseur.html'),'utf8');assert.match(html,/id="gameBoard"/);assert.match(html,/js\/games\/concasseur-engine\.js/)});
