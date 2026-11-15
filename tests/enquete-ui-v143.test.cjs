const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),E=require('../js/games/enquete-engine.js');
function app({initial=null,hash=E.key(42)}={}){
 const elements=new Map(),saved=new Map();if(initial)saved.set('corbac-case-v1',JSON.stringify(initial));
 function node(tag='div'){return {tag,children:[],dataset:{},value:'',hidden:false,disabled:false,style:{setProperty(){}},classList:{values:new Set(),toggle(k,on){if(on)this.values.add(k);else this.values.delete(k)}},listeners:{},setAttribute(){},addEventListener(t,f){this.listeners[t]=f},append(...x){this.children.push(...x)},replaceChildren(...x){this.children=x},querySelectorAll(tag){return this.children.flatMap(c=>typeof c==='object'?[...(c.tag===tag?[c]:[]),...(c.querySelectorAll?.(tag)||[])]:[])},focus(){},select(){},scrollIntoView(){}}}
 const el=id=>{if(!elements.has(id))elements.set(id,node());return elements.get(id)};
 const ctx=vm.createContext({EnqueteEngine:E,document:{getElementById:el,createElement:node,createTextNode:s=>s},crypto:{getRandomValues(a){a[0]=42}},Uint32Array,URL,location:{href:'https://example.org/enquete.html',hash:'#'+hash},window:{history:{replaceState(){}}},localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},Option:function(text,value){return Object.assign(node('option'),{textContent:text,value})},navigator:{clipboard:{async writeText(){}}},matchMedia:()=>({matches:true})});
 vm.runInContext(fs.readFileSync('js/games/enquete.js','utf8'),ctx);return {el,saved};
}
test('interface : placement, annulation, accusation, sauvegarde et clé invalide',()=>{
 const a=app(),p=E.generate(42);assert.equal(a.el('board').children.length,36);assert.equal(a.el('clues').children.length,p.clues.length);
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

test('V150 : Indice retire les erreurs sans déduction, correction annulable puis indice au clic suivant',()=>{
 const a=app(),p=E.generate(42),wrong=p.answer[1];a.el('board').children[wrong.r*6+wrong.c].listeners.click();
 a.el('hint').listeners.click();let state=JSON.parse(a.saved.get('corbac-case-v1'));assert.equal(state.placed[0],null);assert.match(a.el('hintMessage').textContent,/incorrect retiré/);assert.equal(a.el('hintSteps').children.length,0);
 a.el('undo').listeners.click();state=JSON.parse(a.saved.get('corbac-case-v1'));assert.deepEqual(state.placed[0],wrong);
 a.el('hint').listeners.click();assert.equal(a.el('hintSteps').children.length,0);a.el('hint').listeners.click();assert.equal(a.el('hintSteps').children.length,1);assert.match(a.el('hintMessage').textContent,/étape 1/);
 const before=a.saved.get('corbac-case-v1');a.el('solution').listeners.click();assert.equal(a.el('solutionPanel').hidden,false);assert.equal(a.el('solutionSteps').children.length,E.walkthrough(p).steps.length);assert.equal(a.el('solutionFinal').children[0].children.length,6);assert.equal(a.saved.get('corbac-case-v1'),before);
 a.el('solution').listeners.click();assert.equal(a.el('solutionPanel').hidden,true);
 a.el('caseKey').value=E.key(7);a.el('keyForm').listeners.submit({preventDefault(){}});assert.equal(a.el('solutionPanel').hidden,true);assert.equal(a.el('hintPanel').hidden,true);
});

test('V150 : walkthrough complet du niveau E4 demandé, avec le raisonnement pour B1',()=>{
 const key='E4-05LLJ0E-18U5KQF',a=app({hash:key}),p=E.generate(E.parse(key),'E4');a.el('solution').listeners.click();const guide=E.walkthrough(p);
 assert.ok(guide.solved);assert.equal(a.el('solutionSteps').children.length,32);const step=guide.steps.find(s=>s.subject==='Orme le Sadida'&&s.removedText==='B1');assert.ok(step);assert.match(step.text,/Sélène la Sram ne peut être qu’en A1, B2/);assert.deepEqual(guide.domains,p.answer.map(p=>[p.r*6+p.c]));
});
