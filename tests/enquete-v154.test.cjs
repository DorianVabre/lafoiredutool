const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../js/games/enquete-engine.js');
const cell=p=>p.r*6+p.c;
test('les possibilités de brouillon ne sont pas effacées simplement car elles diffèrent de la position finale',()=>{
 const p=E.generate(42),answer=cell(p.answer[0]),fixed=p.clues.find(c=>c.fixed),other=Array.from({length:36},(_,n)=>n).find(n=>n!==answer&&!fixed.blocked.has(n)),notes=Array.from({length:6},()=>[]);notes[0]=[answer,other];
 const plan=E.hintPlan({...p,clues:[fixed]},{notes});assert.equal(plan.correction,undefined);
 assert.ok(plan.steps.every(s=>s.suspect!==0));assert.deepEqual(notes[0],[answer,other]);
});
test('les indices exploitent les annotations, ne répètent aucune position marquée et justifient les corrections',()=>{
 for(const seed of [0,1,42,789,4294967295]){
  const p=E.generate(seed),answers=p.answer.map(cell),placements=p.answer.map((a,i)=>i===0?a:null),notes=p.answer.map((a,i)=>i===1?[cell(a)]:[]),excluded=Array.from({length:36},(_,n)=>n).filter(n=>!answers.includes(n)&&!p.clues[0].blocked.has(n)).slice(0,3);
  const plan=E.hintPlan(p,{placements,notes,excluded});assert.equal(plan.correction,undefined);
  for(const step of plan.steps){assert.notEqual(step.suspect,0);assert.notEqual(step.suspect,1);assert.ok(step.newPositions.length);assert.ok(step.newPositions.every(n=>!notes[step.suspect].includes(n)&&!excluded.includes(n)));assert.ok(step.text&&step.title)}
  const solved=E.hintPlan(p,{notes:p.answer.map(a=>[cell(a)])});assert.equal(solved.correction,undefined);assert.deepEqual(solved.steps,[]);
  const ko=E.hintPlan(p,{excluded:[answers[2]]});assert.equal(ko.correction.type,'ko');assert.deepEqual(ko.correction.cells,[answers[2]]);assert.ok(ko.correction.text.includes(p.names[2]));assert.deepEqual(ko.steps,[]);
 }
});
test('les brouillons faux sont retirés seulement par une élimination du parcours, sans retirer la bonne case',()=>{
 const p=E.generate(42),answers=p.answer.map(cell),free=Array.from({length:36},(_,n)=>n).filter(n=>!p.clues[0].blocked.has(n)),notes=Array.from({length:6},(_,i)=>free.filter(n=>n===answers[i]||n%3===i%3));
 for(let count=0;count<200;count++){
  const plan=E.hintPlan(p,{notes});if(!plan.correction){assert.ok(notes.every((ns,i)=>ns.includes(answers[i])));return}
  const correction=plan.correction;assert.equal(correction.type,'notes');assert.ok(correction.text&&correction.title);assert.ok(!correction.cells.includes(answers[correction.suspect]));
  notes[correction.suspect]=notes[correction.suspect].filter(n=>!correction.cells.includes(n));
 }
 assert.fail('Les corrections ne progressent pas');
});
