const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../js/games/enquete-engine.js');
test('clés : reproduction exacte et rejet des clés altérées',()=>{
 for(const seed of [0,1,42,123456789,4294967295]){assert.equal(E.parse(E.key(seed)),seed);const a=E.generate(seed),b=E.generate(E.parse(a.key));assert.deepEqual(a.answer,b.answer);assert.deepEqual(a.clues.map(c=>c.text),b.clues.map(c=>c.text));assert.deepEqual(a.victim,b.victim)}
 for(const key of ['',null,'E2-0000001-0000001','E1-ZZZZZZZ-ZZZZZZZ',E.key(1).slice(0,-1)+'!'])assert.equal(E.parse(key),null);
});
test('80 niveaux : solution unique, grille légale et seul coupable avec la victime',()=>{
 for(let i=0;i<80;i++){
  const p=E.generate(Math.imul(i,104729)>>>0),solutions=E.solutions(p.clues);
  assert.equal(solutions.length,1,'seed '+p.seed);assert.deepEqual(solutions[0],p.answer);assert.equal(new Set(p.answer.map(x=>x.r)).size,6);assert.equal(new Set(p.answer.map(x=>x.c)).size,6);
  assert.equal(p.answer.filter(x=>E.room(x.r,x.c,p.roomMap)===p.crimeRoom).length,1);assert.equal(E.room(p.victim.r,p.victim.c,p.roomMap),p.crimeRoom);assert.notDeepEqual(p.victim,p.answer[p.killer]);assert.ok(p.clues.length>=6&&p.clues.length<=24);
 }
});
test('des clés distinctes proposent des affaires variées',()=>{
 const signatures=new Set(Array.from({length:20},(_,i)=>JSON.stringify(E.generate(i).answer)));assert.equal(signatures.size,20);
});


test('V145 : les repères bloquent six cases, sont illustrés et participent aux énigmes',()=>{
 for(const seed of [0,7,42,104729,4294967295]){
  const p=E.generate(seed,'E2');assert.match(p.key,/^E2-/);assert.equal(p.decor.length,6);assert.equal(new Set(p.decor.map(d=>d.r*6+d.c)).size,6);assert.ok(p.clues.filter(c=>c.environment).length>=1);
  for(const d of p.decor){assert.ok(!p.answer.some(a=>a.r===d.r&&a.c===d.c));assert.notDeepEqual({r:d.r,c:d.c},p.victim);assert.ok(require('node:fs').existsSync('data/enquete/'+d.icon+'.svg'))}
  const q=E.generate(E.parse(p.key),'E2');assert.deepEqual(q.decor,p.decor);assert.deepEqual(q.clues.map(c=>c.text),p.clues.map(c=>c.text));
  const legacy=E.generate(seed,'E1');assert.match(legacy.key,/^E1-/);assert.equal(legacy.decor,undefined);assert.equal(E.parse(legacy.key),seed);assert.deepEqual(p.answer,legacy.answer);
 }
});
