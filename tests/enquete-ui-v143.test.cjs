const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),E=require('../js/games/enquete-engine.js');
function app({initial=null,hash=E.key(42),start=true}={}){
 const elements=new Map(),saved=new Map(),documentEvents={},windowEvents={};if(initial)saved.set('corbac-case-v1',JSON.stringify(initial));
 function node(tag='div'){return {tag,children:[],dataset:{},value:'',hidden:false,disabled:false,style:{setProperty(){}},classList:{values:new Set(),toggle(k,on){if(on)this.values.add(k);else this.values.delete(k)}},listeners:{},setAttribute(){},addEventListener(t,f){this.listeners[t]=f},append(...x){this.children.push(...x)},replaceChildren(...x){this.children=x},querySelectorAll(tag){return this.children.flatMap(c=>typeof c==='object'?[...(c.tag===tag?[c]:[]),...(c.querySelectorAll?.(tag)||[])]:[])},focus(){},select(){},scrollIntoView(){}}}
 const el=id=>{if(!elements.has(id))elements.set(id,node());return elements.get(id)};
 const ctx=vm.createContext({EnqueteEngine:E,document:{getElementById:el,createElement:node,createTextNode:s=>s,addEventListener(t,f){documentEvents[t]=f}},crypto:{getRandomValues(a){a[0]=42}},Uint32Array,URL,location:{href:'https://example.org/enquete.html',hash:'#'+hash},window:{history:{replaceState(){}},addEventListener(t,f){windowEvents[t]=f}},localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},Option:function(text,value){return Object.assign(node('option'),{textContent:text,value})},navigator:{clipboard:{async writeText(){}}},matchMedia:()=>({matches:true})});
 vm.runInContext(fs.readFileSync('js/games/enquete.js','utf8'),ctx);if(start)el('start').listeners.click();return {el,saved,documentEvents,windowEvents};
}
test('interface : placement, annulation, accusation, sauvegarde et clé invalide',()=>{
 const a=app(),p=E.generate(42);assert.equal(a.el('board').children.length,36);assert.equal(a.el('clues').children.length,p.clues.filter(c=>!c.fixed).length);
 a.el('accuse').listeners.click();assert.match(a.el('gameStatus').textContent,/Reconstitue/);
 p.answer.forEach((pos,i)=>{a.el('suspects').children[i].listeners.click();a.el('board').children[pos.r*6+pos.c].listeners.click()});
 a.el('check').listeners.click();assert.match(a.el('gameStatus').textContent,/concordent/);
 a.el('undo').listeners.click();a.el('check').listeners.click();assert.match(a.el('gameStatus').textContent,/six suspects/);
 const pos=p.answer[5];a.el('board').children[pos.r*6+pos.c].listeners.click();
 a.el('accused').value=String(p.killer);a.el('accuse').listeners.click();assert.equal(a.el('ending').hidden,false);assert.equal(a.el('accuse').disabled,true);assert.equal(JSON.parse(a.saved.get('corbac-case-v1')).key,p.key);
 a.el('caseKey').value='invalid';a.el('keyForm').listeners.submit({preventDefault(){}});assert.match(a.el('shareStatus').textContent,/invalide/);
 a.el('caseKey').value=E.key(7);a.el('keyForm').listeners.submit({preventDefault(){}});assert.equal(a.el('caseKey').value,E.key(7));assert.equal(a.el('ending').hidden,true);
});


test('V145 : brouillons multiples, cases bloquées, confirmation, annulation et reprise',()=>{
 const a=app(),p=E.generate(42),free=[];
 for(let n=0;n<36;n++)if(!p.decor.some(d=>d.r*6+d.c===n)&&p.victim.r*6+p.victim.c!==n)free.push(n);
 const state=()=>JSON.parse(a.saved.get('corbac-case-v1'));

 a.el('board').children[free[0]].listeners.contextmenu({preventDefault(){}});a.el('board').children[free[1]].listeners.contextmenu({preventDefault(){}});
 a.el('suspects').children[1].listeners.click();a.el('board').children[free[0]].listeners.contextmenu({preventDefault(){}});
 assert.deepEqual(state().notes[0],[free[0],free[1]]);assert.deepEqual(state().notes[1],[free[0]]);assert.ok(state().placed.every(p=>p===null));
 const decorCell=p.decor[0].r*6+p.decor[0].c;assert.equal(a.el('board').children[decorCell].disabled,true);a.el('board').children[decorCell].listeners.contextmenu({preventDefault(){}});assert.deepEqual(state().notes[1],[free[0]]);
 const b=app({initial:state()});assert.deepEqual(JSON.parse(b.saved.get('corbac-case-v1')).notes,state().notes);
a.el('board').children[free[0]].listeners.click();assert.deepEqual(state().notes[1],[]);assert.deepEqual(state().notes[0],[]);assert.ok(state().placed[1]);
 a.el('undo').listeners.click();assert.deepEqual(state().notes[0],[free[0],free[1]]);assert.deepEqual(state().notes[1],[free[0]]);assert.equal(state().placed[1],null);
 a.el('reset').listeners.click();assert.ok(state().notes.every(n=>n.length===0));a.el('undo').listeners.click();assert.deepEqual(state().notes[0],[free[0],free[1]]);
});

test('V145 : une ancienne clé E1 conserve son niveau et recharge ses placements',()=>{
 const key=E.key(42,'E1'),p=E.generate(42,'E1'),initial={key,placed:p.answer,notes:Array.from({length:6},()=>[]),checks:[]};
 const a=app({initial,hash:key});assert.equal(a.el('caseKey').value,key);assert.equal(a.el('board').children.filter(c=>c.disabled).length,1);a.el('check').listeners.click();assert.match(a.el('gameStatus').textContent,/concordent/);
});


test('V150 : clic droit brouillon, clic gauche placement et consigne sans clavier',()=>{
 const a=app(),p=E.generate(42),pos=p.answer[0],cell=a.el('board').children[pos.r*6+pos.c];
 const state=()=>JSON.parse(a.saved.get('corbac-case-v1'));let prevented=false;
 cell.listeners.contextmenu({preventDefault(){prevented=true}});assert.ok(prevented);assert.equal(state().placed[0],null);assert.deepEqual(state().notes[0],[pos.r*6+pos.c]);
 cell.listeners.contextmenu({preventDefault(){}});assert.deepEqual(state().notes[0],[]);assert.equal(cell.listeners.keydown,undefined);
 cell.listeners.click({shiftKey:true});assert.deepEqual(state().placed[0],pos);assert.equal(state().notes[0].length,0);
 assert.equal(a.el('noteHelp').textContent,'Clic gauche : placer · clic droit : brouillon.');
 assert.ok(cell.children.some(n=>n.className==='glyph suspect-token'));
});

test('V148 : noms et bordures du plan suivent la carte des salles, y compris en important E4',()=>{
 const a=app(),p=E.generate(42);
 function check(p){
  for(let r=0;r<6;r++)for(let c=0;c<6;c++){
   const cell=a.el('board').children[r*6+c],room=E.room(r,c,p.roomMap);assert.ok(cell.title.startsWith(p.rooms[room]));
   assert.equal(cell.classList.values.has('room-edge-right'),c<5&&room!==E.room(r,c+1,p.roomMap));
   assert.equal(cell.classList.values.has('room-edge-bottom'),r<5&&room!==E.room(r+1,c,p.roomMap));
  }
 }
 check(p);a.el('caseKey').value=E.key(42,'E4');a.el('keyForm').listeners.submit({preventDefault(){}});check(E.generate(42,'E4'));
});


test('V150 : ligne/colonne grisées, brouillons incompatibles nettoyés et annulation intégrale',()=>{
 const a=app(),p=E.generate(42),anchor=p.answer[0],free=[];
 for(let n=0;n<36;n++){const r=Math.floor(n/6),c=n%6;if(!p.decor.some(d=>d.r===r&&d.c===c)&&!(p.victim.r===r&&p.victim.c===c))free.push(n)}
 a.el('suspects').children[1].listeners.click();for(const n of free)a.el('board').children[n].listeners.contextmenu({preventDefault(){}});
 const before=JSON.parse(a.saved.get('corbac-case-v1'));
 a.el('suspects').children[0].listeners.click();a.el('board').children[anchor.r*6+anchor.c].listeners.click();
 const after=JSON.parse(a.saved.get('corbac-case-v1'));assert.deepEqual(after.notes[1],free.filter(n=>Math.floor(n/6)!==anchor.r&&n%6!==anchor.c));
 for(let n=0;n<36;n++)assert.equal(a.el('board').children[n].classList.values.has('line-taken'),n!==anchor.r*6+anchor.c&&(Math.floor(n/6)===anchor.r||n%6===anchor.c));
 a.el('suspects').children[1].listeners.click();const blockedNote=free.find(n=>n!==anchor.r*6+anchor.c&&(Math.floor(n/6)===anchor.r||n%6===anchor.c));a.el('board').children[blockedNote].listeners.contextmenu({preventDefault(){}});assert.deepEqual(JSON.parse(a.saved.get('corbac-case-v1')),after);
 a.el('undo').listeners.click();assert.deepEqual(JSON.parse(a.saved.get('corbac-case-v1')),before);assert.ok(a.el('board').children.every(b=>!b.classList.values.has('line-taken')));
});

test('Solution : déroulé complet, consultation mémorisée et fermeture au changement de clé',()=>{
 const a=app(),p=E.generate(42),before=a.saved.get('corbac-case-v1');a.el('solution').listeners.click();assert.equal(a.el('solutionPanel').hidden,false);assert.equal(a.el('solutionSteps').children.length,E.walkthrough(p).steps.length);assert.equal(a.el('solutionFinal').children[0].children.length,6);assert.deepEqual(JSON.parse(a.saved.get('corbac-case-v1')),{...JSON.parse(before),solutionViewed:true});
 a.el('solution').listeners.click();assert.equal(a.el('solutionPanel').hidden,true);a.el('caseKey').value=E.key(7);a.el('keyForm').listeners.submit({preventDefault(){}});assert.equal(a.el('solutionPanel').hidden,true);
});

test('V150 : walkthrough complet du niveau E4 demandé, avec le raisonnement pour B1',()=>{
 const key='E4-05LLJ0E-18U5KQF',a=app({hash:key}),p=E.generate(E.parse(key),'E4');a.el('solution').listeners.click();const guide=E.walkthrough(p);
 assert.ok(guide.solved);assert.equal(a.el('solutionSteps').children.length,32);const step=guide.steps.find(s=>s.subject==='Orme le Sadida'&&s.removedText==='B1');assert.ok(step);assert.match(step.text,/Sélène la Sram ne peut être qu’en A1, B2/);assert.deepEqual(guide.domains,p.answer.map(p=>[p.r*6+p.c]));
});


test('V152 : KO indépendant du suspect, brouillons retirés, sauvegarde et annulation complète',()=>{
 const a=app(),p=E.generate(42),pos=p.answer[0],n=pos.r*6+pos.c,state=()=>JSON.parse(a.saved.get('corbac-case-v1'));
 a.el('suspects').children[1].listeners.click();a.el('board').children[n].listeners.contextmenu({preventDefault(){}});
 a.el('suspects').children[2].listeners.click();a.el('board').children[n].listeners.contextmenu({preventDefault(){}});const before=state();
 assert.equal(a.el('suspects').children.length,7);a.el('suspects').children[6].listeners.click();a.el('board').children[n].listeners.click();
 assert.deepEqual(state().excluded,[n]);assert.ok(state().placed.every(v=>v===null));assert.ok(state().notes.every(notes=>!notes.includes(n)));assert.ok(a.el('board').children[n].classList.values.has('marked-empty'));
 const restored=app({initial:state()});assert.ok(restored.el('board').children[n].classList.values.has('marked-empty'));
 a.el('suspects').children[0].listeners.click();a.el('board').children[n].listeners.click();assert.equal(state().placed[0],null);assert.match(a.el('gameStatus').textContent,/marquée vide/);
 a.el('undo').listeners.click();assert.deepEqual(state(),before);assert.equal(a.el('board').children[n].classList.values.has('marked-empty'),false);
 a.el('suspects').children[6].listeners.click();a.el('board').children[n].listeners.click();a.el('board').children[n].listeners.click();assert.deepEqual(state().excluded,[]);
 a.el('undo').listeners.click();assert.deepEqual(state().excluded,[n]);a.el('reset').listeners.click();assert.deepEqual(state().excluded,[]);a.el('undo').listeners.click();assert.deepEqual(state().excluded,[n]);
 a.el('caseKey').value=E.key(7);a.el('keyForm').listeners.submit({preventDefault(){}});assert.deepEqual(state().excluded,[]);
});

test('V152 : pas de KO sur un suspect, un décor ou le corps ; annotations sans effet sur Solution',()=>{
 const a=app(),p=E.generate(42),pos=p.answer[0],n=pos.r*6+pos.c,state=()=>JSON.parse(a.saved.get('corbac-case-v1'));
 a.el('board').children[n].listeners.click();a.el('suspects').children[6].listeners.click();a.el('board').children[n].listeners.click();assert.deepEqual(state().excluded,[]);assert.deepEqual(state().placed[0],pos);
 const d=p.decor[0];a.el('board').children[d.r*6+d.c].listeners.click();a.el('board').children[p.victim.r*6+p.victim.c].listeners.click();assert.deepEqual(state().excluded,[]);
 const free=p.answer[1];a.el('board').children[free.r*6+free.c].listeners.click();const before=state();a.el('solution').listeners.click();assert.deepEqual(state(),{...before,solutionViewed:true});
 const markup=fs.readFileSync('enquete.html','utf8');assert.match(markup,/<div class="map-controls"><div id="suspects"[^>]+><\/div><div id="board"/);
});


function mouse(button,buttons){return {button,buttons,preventDefault(){}}}
function freeCells(p){return Array.from({length:36},(_,n)=>n).filter(n=>!p.decor.some(d=>d.r*6+d.c===n)&&p.victim.r*6+p.victim.c!==n)}
test('V153 : glisser les KO, interpoler les cases, repasser sans basculer et annuler tout le geste',()=>{
 const a=app(),p=E.generate(42),free=freeCells(p),row=Math.floor(free[0]/6),cells=free.filter(n=>Math.floor(n/6)===row),start=cells[0],end=cells.at(-1),state=()=>JSON.parse(a.saved.get('corbac-case-v1'));
 a.el('suspects').children[6].listeners.click();a.el('board').children[start].listeners.mousedown(mouse(2,2));a.el('board').children[end].listeners.mouseenter(mouse(2,2));a.el('board').children[start].listeners.mouseenter(mouse(2,2));assert.deepEqual(state().excluded.slice().sort((a,b)=>a-b),cells);
 a.documentEvents.mouseup();a.el('board').children[start].listeners.contextmenu({preventDefault(){}});assert.deepEqual(state().excluded.slice().sort((a,b)=>a-b),cells);
 a.el('undo').listeners.click();assert.deepEqual(state().excluded,[]);
});
test('V153 : brouillons au clic droit, ajout uniforme puis effacement uniforme',()=>{
 const a=app(),p=E.generate(42),free=freeCells(p),row=Math.floor(free[0]/6),cells=free.filter(n=>Math.floor(n/6)===row),state=()=>JSON.parse(a.saved.get('corbac-case-v1'));
 a.el('board').children[cells[1]].listeners.contextmenu({preventDefault(){}});const before=state();
 a.el('board').children[cells[0]].listeners.mousedown(mouse(2,2));a.el('board').children[cells.at(-1)].listeners.mouseenter(mouse(2,2));a.documentEvents.mouseup();a.el('board').children[cells.at(-1)].listeners.contextmenu({preventDefault(){}});assert.deepEqual(state().notes[0].slice().sort((a,b)=>a-b),cells);
 a.el('undo').listeners.click();assert.deepEqual(state(),before);
 a.el('board').children[cells[1]].listeners.mousedown(mouse(2,2));a.el('board').children[cells.at(-1)].listeners.mouseenter(mouse(2,2));a.documentEvents.mouseup();a.el('board').children[cells.at(-1)].listeners.contextmenu({preventDefault(){}});assert.deepEqual(state().notes[0],[]);a.el('undo').listeners.click();assert.deepEqual(state(),before);
});
test('V153 : arrêt après relâchement ou perte de focus, sans nouveau marquage',()=>{
 const a=app(),p=E.generate(42),cells=freeCells(p),state=()=>JSON.parse(a.saved.get('corbac-case-v1'));a.el('suspects').children[6].listeners.click();
 a.el('board').children[cells[0]].listeners.mousedown(mouse(2,2));a.documentEvents.mouseup();a.el('board').children[cells[1]].listeners.mouseenter(mouse(2,2));assert.deepEqual(state().excluded,[cells[0]]);
 a.el('board').children[cells[2]].listeners.mousedown(mouse(2,2));a.windowEvents.blur();a.el('board').children[cells[3]].listeners.mouseenter(mouse(2,2));assert.deepEqual(state().excluded,[cells[0],cells[2]]);
});
test('V154 : le maintien gauche ne déplace rien et ne nettoie pas les brouillons',()=>{
 const a=app(),p=E.generate(42),free=freeCells(p),start=free[0],end=free.at(-1),state=()=>JSON.parse(a.saved.get('corbac-case-v1'));
 a.el('suspects').children[1].listeners.click();a.el('board').children[end].listeners.contextmenu({preventDefault(){}});a.el('suspects').children[0].listeners.click();a.el('board').children[start].listeners.click();const before=state();
 a.el('board').children[start].listeners.mousedown(mouse(0,1));a.el('board').children[end].listeners.mouseenter(mouse(0,1));a.documentEvents.mouseup();assert.deepEqual(state(),before);
 a.el('suspects').children[6].listeners.click();a.el('board').children[end].listeners.mousedown(mouse(0,1));a.el('board').children[start].listeners.mouseenter(mouse(0,1));a.documentEvents.mouseup();assert.deepEqual(state(),before);
});

test('V153 : rappel masqué, cases cochées stables au rechargement et aides renumérotées',()=>{
 const a=app(),p=E.generate(42),input=a.el('clues').children[0].querySelectorAll('input')[0];input.checked=true;input.listeners.change();const saved=JSON.parse(a.saved.get('corbac-case-v1'));
 assert.equal(saved.checks[0],false);assert.equal(saved.checks[1],true);const restored=app({initial:saved});assert.equal(restored.el('clues').children[0].querySelectorAll('input')[0].checked,true);
 assert.equal(a.el('clues').children.length,p.clues.length-1);
 for(const step of E.walkthrough(p).steps)if(step.context.type==='unary'||step.context.type==='pair')assert.equal(step.title,'Témoignage n°'+p.clues.slice(0,step.context.clue+1).filter(c=>!c.fixed).length);
});


test('V154 : glisser hors du plan puis revenir ne relie pas les cases au clic droit',()=>{
 const a=app(),p=E.generate(42),free=freeCells(p),start=free[0],end=free.at(-1),state=()=>JSON.parse(a.saved.get('corbac-case-v1'));
 a.el('suspects').children[6].listeners.click();a.el('board').children[start].listeners.mousedown(mouse(2,2));a.el('board').listeners.mouseleave();a.el('board').children[end].listeners.mouseenter(mouse(2,2));a.documentEvents.mouseup();assert.deepEqual(state().excluded,[start,end]);
});


function nodeText(node){return (node.textContent||'')+(node.children||[]).map(n=>typeof n==='object'?nodeText(n):n).join(' ')}
 test('départ masqué, temps figé et ponctuation persistante après Solution',()=>{
 const a=app({start:false}),p=E.generate(42);assert.equal(a.el('investigation').hidden,true);assert.equal(a.el('timer').textContent,'00:00');a.el('solution').listeners.click();assert.equal(JSON.parse(a.saved.get('corbac-case-v1')).solutionViewed,false);a.el('start').listeners.click();assert.equal(a.el('investigation').hidden,false);
 a.el('solution').listeners.click();a.el('solution').listeners.click();
 p.answer.forEach((pos,i)=>{a.el('suspects').children[i].listeners.click();a.el('board').children[pos.r*6+pos.c].listeners.click()});a.el('accused').value=String(p.killer);a.el('accuse').listeners.click();
 assert.match(a.el('ending').children[1].textContent,/Vous avez réussi\. Temps : \d+:\d{2}\./);const saved=JSON.parse(a.saved.get('corbac-case-v1'));assert.ok(saved.finishedAt>=saved.startedAt);
 const b=app({initial:saved,start:false});assert.equal(b.el('ending').hidden,false);assert.equal(b.el('ending').children[1].textContent,a.el('ending').children[1].textContent);
 });

