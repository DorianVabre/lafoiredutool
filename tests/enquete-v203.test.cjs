const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),E=require('../js/games/enquete-engine.js');
const cell=p=>p.r*6+p.c;

test('V203 : les clés E8 reproduisent exactement les enquêtes antérieures aux quotas',()=>{
 for(const r of require('./fixtures/enquete-e8-v202.json')){
  const p=E.generate(r.seed,r.version),data={key:p.key,answer:p.answer,victim:p.victim,decor:p.decor,rooms:p.rooms,roomMap:p.roomMap,clues:p.clues.map(c=>({text:c.text,kind:c.kind,axis:c.axis,signature:c.signature}))};
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex'),r.sha256,'E8 '+r.seed);assert.equal(E.parse(p.key),r.seed);
 }
 assert.match(E.key(42),/^E9-/);assert.equal(E.parse(E.key(4294967295)),4294967295);assert.equal(E.parse(E.key(0,'E10')),null);
});

test('E9 : un seul témoignage par type, deux distances chiffrées au plus, sans sacrifier la déduction',()=>{
 const seen=new Set();let numericPair=false;
 for(let i=0;i<60;i++){
  const seed=i===59?4294967295:Math.imul(i,2654435761)>>>0,p=E.generate(seed),w=E.walkthrough(p),reverse=E.deduce(p.clues,{comfortable:true,reverse:true}),clues=p.clues.filter(c=>!c.fixed),kinds=clues.map(c=>c.kind);
  assert.equal(new Set(kinds).size,clues.length,'Un seul indice par famille, seed '+seed);
  const numeric=clues.filter(c=>/\d+ (?:PM|PO|cases?)\b/.test(c.text));assert.ok(numeric.length<=2,'Deux distances au maximum, seed '+seed);numericPair||=numeric.length===2;
  assert.deepEqual(numeric.map(c=>c.kind).sort(),clues.filter(c=>['pm','range','decor'].includes(c.kind)).map(c=>c.kind).sort());
  kinds.forEach(k=>seen.add(k));assert.ok(kinds.includes('pm')&&kinds.includes('los')&&kinds.includes('room'));assert.ok(kinds.length>=4);assert.ok(clues.every(c=>c.test(p.answer)));
  assert.match(p.key,/^E9-/);assert.equal(E.parse(p.key),seed);assert.ok(w.solved&&reverse.solved,'Déduction sans supposition, seed '+seed);assert.deepEqual(w.domains,p.answer.map(p=>[cell(p)]));assert.deepEqual(w.domains,reverse.domains);assert.deepEqual(E.solutions(p.clues),[p.answer]);
  for(const s of w.steps){assert.ok(!s.removed.includes(cell(p.answer[s.suspect])));if(['unary','pair'].includes(s.context.type))assert.ok(s.after.length<=6);if(s.context.type==='pair')assert.ok(s.context.otherDomain.length<=6)}
  assert.ok(w.steps.some(s=>clues.some(c=>['diagonal','closer','equidistant','range'].includes(c.kind)&&c.text===s.reason)));
  if(i<3){const copy=E.generate(E.parse(p.key),'E9');assert.deepEqual(copy.answer,p.answer);assert.deepEqual(copy.clues.map(c=>c.text),p.clues.map(c=>c.text))}
 }
 assert.ok(numericPair);for(const kind of ['decor','pm','range','diagonal','closer','equidistant'])assert.ok(seen.has(kind),'Diversité conservée : '+kind);
});
