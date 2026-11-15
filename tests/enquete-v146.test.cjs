const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../js/games/enquete-engine.js');
const p=(r,c)=>({r,c});
test('PM : un déplacement orthogonal coûte 1, diagonale à 2, détour et impasse',()=>{
 assert.equal(E.pmDistance(p(0,0),p(0,1)),1);assert.equal(E.pmDistance(p(0,0),p(1,1)),2);
 assert.equal(E.pmDistance(p(0,0),p(0,2),[p(0,1)]),4);
 assert.equal(E.pmDistance(p(0,0),p(1,1),[p(0,1),p(1,0)]),Infinity);
 assert.equal(E.pmDistance(p(0,0),p(0,0)),0);
});
test('vue : obstacles, personnages, diagonales et coins effleurés',()=>{
 assert.equal(E.lineOfSight(p(0,0),p(0,4)),true);
 assert.equal(E.lineOfSight(p(0,0),p(0,4),[p(0,2)]),false);
 assert.equal(E.lineOfSight(p(0,0),p(0,4),[],[p(0,0),p(0,4),p(0,2)]),false);
 assert.equal(E.lineOfSight(p(0,0),p(3,3),[p(1,1)]),false);
 assert.equal(E.lineOfSight(p(0,0),p(3,3),[p(0,1),p(1,0)]),true);
 assert.equal(E.lineOfSight(p(0,0),p(2,4),[p(1,2)]),false);
 assert.equal(E.lineOfSight(p(0,0),p(2,4),[p(0,3)]),true);
 for(let a=0;a<36;a++)for(let b=0;b<36;b++){const from=p(Math.floor(a/6),a%6),to=p(Math.floor(b/6),b%6),obstacles=[p(1,2),p(4,3)];assert.equal(E.lineOfSight(from,to,obstacles),E.lineOfSight(to,from,obstacles))}
});
test('E3 : mélange équilibré, PM et vues exacts, unicité et compatibilité des versions',()=>{
 for(const seed of [0,1,42,105,789,4294967295]){
  const level=E.generate(seed,'E3');assert.match(level.key,/^E3-/);assert.equal(E.parse(level.key),seed);
  assert.ok(level.clues.filter(c=>c.environment).length<=2);assert.ok(level.clues.filter(c=>c.kind==='pm').length>=2);assert.ok(level.clues.some(c=>c.kind==='los'));
  assert.ok(level.clues.every(c=>c.test(level.answer)));assert.deepEqual(E.solutions(level.clues),[level.answer]);
  assert.deepEqual(E.generate(seed,'E3').clues.map(c=>c.text),level.clues.map(c=>c.text));
  for(const version of ['E1','E2']){const old=E.generate(seed,version);assert.equal(old.key,E.key(seed,version));assert.equal(E.parse(old.key),seed);assert.equal(old.clues.filter(c=>c.kind).length,0)}
 }
});
