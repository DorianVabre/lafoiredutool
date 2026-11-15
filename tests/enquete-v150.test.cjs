const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../js/games/enquete-engine.js');
test('walkthrough : chaque élimination est expliquée et ne retire jamais la solution',()=>{
 for(const version of ['E1','E2','E3','E4','E5'])for(const seed of [0,1,42,789,4294967295]){
  const p=E.generate(seed,version),w=E.walkthrough(p);
  for(const step of w.steps){
   assert.ok(step.title&&step.text&&step.subject&&step.remainingText&&step.removedText);assert.ok(step.removed.length>0);assert.equal(step.before.length-step.after.length,step.removed.length);
   assert.ok(!step.removed.includes(p.answer[step.suspect].r*6+p.answer[step.suspect].c));assert.ok(step.after.includes(p.answer[step.suspect].r*6+p.answer[step.suspect].c));
   if(step.context.type==='pair'||step.context.type==='unary')assert.ok(p.clues[step.context.clue]);
  }
  if(version==='E4'||version==='E5'){assert.ok(w.solved);assert.deepEqual(w.domains,p.answer.map(a=>[a.r*6+a.c]))}
 }
});
test('les placements corrects servent de points de départ aux indices ; les brouillons ne sont pas des preuves',()=>{
 const p=E.generate(42),placements=Array(6).fill(null);placements[0]=p.answer[0];const w=E.walkthrough(p,placements);assert.ok(w.solved);assert.ok(w.steps.every(s=>s.suspect!==0));
 assert.deepEqual(w.domains,p.answer.map(a=>[a.r*6+a.c]));assert.deepEqual(E.walkthrough(p,p.answer).steps,[]);
});
