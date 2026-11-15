const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../js/games/enquete-engine.js');
test('E4 : déduction sans branchement, indépendante de l’ordre, sans indice doublon et deux par famille au maximum',()=>{
 for(let i=0;i<100;i++){
  const seed=Math.imul(i,104729)>>>0,p=E.generate(seed,'E4'),forward=E.deduce(p.clues),reverse=E.deduce(p.clues,{reverse:true});
  assert.match(p.key,/^E4-/);assert.equal(E.parse(p.key),seed);assert.ok(forward.solved);assert.ok(reverse.solved);assert.deepEqual(reverse.domains,forward.domains);
  assert.deepEqual(forward.domains,p.answer.map(p=>[p.r*6+p.c]));
  for(const step of forward.trace)assert.ok(!step.removed.includes(p.answer[step.suspect].r*6+p.answer[step.suspect].c));
  const clues=p.clues.filter(c=>!c.fixed),counts={};assert.equal(new Set(clues.map(c=>c.text)).size,clues.length);assert.equal(new Set(clues.map(c=>c.signature)).size,clues.length);
  for(const c of clues)counts[c.kind]=(counts[c.kind]||0)+1;
  assert.ok(Object.values(counts).every(n=>n<=2));assert.ok(Object.keys(counts).length>=4);assert.ok(counts.pm);assert.ok(counts.los);
  // Aucun témoignage conservé n'est dispensable dans ce raisonnement sans hypothèse.
  for(const c of clues)assert.equal(E.deduce(p.clues.filter(x=>x!==c)).solved,false,'indice inutile : '+c.text);
 }
});
test('le vérificateur ne devine pas une solution unique en utilisant une recherche cachée',()=>{
 const clue={axis:'both',test:s=>s.every((p,i)=>p.r===i&&p.c===i)};
 assert.equal(E.solutions([clue]).length,1);
 assert.equal(E.deduce([clue]).solved,false);
 assert.equal(E.deduce([]).trace.length,0);
});
test('clés E4 reproductibles ; E1 à E3 gardent leur format et leurs niveaux',()=>{
 for(const seed of [0,42,4294967295]){
  const p=E.generate(seed,'E4'),copy=E.generate(E.parse(p.key),'E4');assert.deepEqual(copy.answer,p.answer);assert.deepEqual(copy.decor,p.decor);assert.deepEqual(copy.clues.map(c=>c.text),p.clues.map(c=>c.text));
  for(const version of ['E1','E2','E3']){const old=E.generate(seed,version);assert.equal(old.key,E.key(seed,version));assert.equal(old.deduction,undefined)}
 }
});
