const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../js/games/enquete-engine.js');
test('E6 : parcours à six candidats maximum par témoignage, sans supposition et avec des indices variés',()=>{
 for(let i=0;i<100;i++){
  const seed=Math.imul(i,104729)>>>0,p=E.generate(seed,'E6'),w=E.walkthrough(p),reverse=E.deduce(p.clues,{comfortable:true,reverse:true});
  assert.match(p.key,/^E6-/);assert.equal(E.parse(p.key),seed);assert.ok(w.solved&&reverse.solved);assert.deepEqual(w.domains,reverse.domains);assert.deepEqual(w.domains,p.answer.map(a=>[a.r*6+a.c]));
  const facts=w.steps.filter(s=>s.context.type==='unary'||s.context.type==='pair');assert.ok(facts.length>0);
  for(const step of facts){assert.ok(step.after.length<=6);if(step.context.type==='pair')assert.ok(step.context.otherDomain.length<=6)}
  const counts={},clues=p.clues.filter(c=>c.kind);for(const c of clues)counts[c.kind]=(counts[c.kind]||0)+1;
  assert.ok(Object.values(counts).every(n=>n<=2));assert.ok(Object.keys(counts).length>=4);assert.ok(counts.pm&&counts.los&&counts.room);assert.equal(new Set(clues.map(c=>c.signature)).size,clues.length);
  for(const c of p.clues.filter(c=>c.unary))assert.ok(Array.from({length:36},(_,n)=>n).filter(n=>!p.clues[0].blocked.has(n)&&c.unary({r:Math.floor(n/6),c:n%6})).length<=6);
  const firstRelation=p.clues.findIndex(c=>c.pair);assert.ok(p.clues.slice(firstRelation).every(c=>!c.unary));
 }
});
test('E6 : moins de grandes listes à croiser, tout en conservant les recoupements',()=>{
 let broadOld=0,relations=0;
 for(let seed=0;seed<10;seed++){
  const old=E.walkthrough(E.generate(seed,'E5')),current=E.walkthrough(E.generate(seed,'E6'));
  broadOld+=old.steps.filter(s=>(s.context.type==='unary'||s.context.type==='pair')&&(s.after.length>6||s.context.otherDomain?.length>6)).length;
  assert.equal(current.steps.filter(s=>(s.context.type==='unary'||s.context.type==='pair')&&(s.after.length>6||s.context.otherDomain?.length>6)).length,0);
  relations+=current.steps.filter(s=>s.context.type==='pair').length;
 }
 assert.ok(broadOld>0);assert.ok(relations>=10);
});
test('E6 partageable ; E1 à E5 conservent leur édition',()=>{
 for(const seed of [0,42,4294967295]){
  const p=E.generate(seed,'E6'),q=E.generate(E.parse(p.key),'E6');assert.deepEqual(q.clues.map(c=>c.text),p.clues.map(c=>c.text));assert.deepEqual(q.roomMap,p.roomMap);
  for(const version of ['E1','E2','E3','E4','E5'])assert.equal(E.generate(seed,version).key,E.key(seed,version));
 }
});
