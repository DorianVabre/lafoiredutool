const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../js/games/enquete-engine.js');
test('E5 : salles connexes, contours variés, indices nommés et déduction sans hypothèse',()=>{
 const layouts=new Set(),names=new Set();
 for(let i=0;i<100;i++){
  const seed=Math.imul(i,104729)>>>0,p=E.generate(seed,'E5');assert.match(p.key,/^E5-/);assert.equal(p.roomMap.length,36);layouts.add(p.roomMap.join(''));names.add(p.rooms.join('|'));
  let irregular=0;
  for(let id=0;id<4;id++){
   const cells=p.roomMap.flatMap((v,n)=>v===id?[n]:[]);assert.ok(cells.length>=5&&cells.length<=13);
   const seen=new Set([cells[0]]),queue=[cells[0]];
   for(let k=0;k<queue.length;k++){const n=queue[k],r=Math.floor(n/6),c=n%6;for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){const nr=r+dr,nc=c+dc,next=nr*6+nc;if(nr>=0&&nr<6&&nc>=0&&nc<6&&p.roomMap[next]===id&&!seen.has(next)){seen.add(next);queue.push(next)}}}
   assert.equal(seen.size,cells.length);
   const rs=cells.map(n=>Math.floor(n/6)),cs=cells.map(n=>n%6);if((Math.max(...rs)-Math.min(...rs)+1)*(Math.max(...cs)-Math.min(...cs)+1)!==cells.length)irregular++;
  }
  assert.ok(irregular>=2,'contours trop réguliers : '+seed);
  const inCrime=p.answer.filter(a=>E.room(a.r,a.c,p.roomMap)===p.crimeRoom);assert.equal(inCrime.length,1);assert.deepEqual(inCrime[0],p.answer[p.killer]);assert.equal(E.room(p.victim.r,p.victim.c,p.roomMap),p.crimeRoom);
  const roomClues=p.clues.filter(c=>c.kind==='room');assert.ok(roomClues.length>=1&&roomClues.length<=2);assert.ok(roomClues.every(c=>p.rooms.some(name=>c.text.includes(name))));assert.ok(p.clues.every(c=>c.test(p.answer)));
  const forward=E.deduce(p.clues),reverse=E.deduce(p.clues,{reverse:true});assert.ok(forward.solved&&reverse.solved);assert.deepEqual(reverse.domains,forward.domains);assert.deepEqual(forward.domains,p.answer.map(a=>[a.r*6+a.c]));
  const counts={};for(const c of p.clues)if(c.kind)counts[c.kind]=(counts[c.kind]||0)+1;assert.ok(Object.values(counts).every(n=>n<=2));
 }
 assert.ok(layouts.size>90);assert.ok(names.size>50);
});
test('la clé E5 reproduit salles, noms, contours, scène et témoignages ; les éditions précédentes restent disponibles',()=>{
 for(const seed of [0,42,4294967295]){
  const p=E.generate(seed,'E5'),q=E.generate(E.parse(p.key),'E5');assert.deepEqual(q.roomMap,p.roomMap);assert.deepEqual(q.rooms,p.rooms);assert.deepEqual(q.answer,p.answer);assert.deepEqual(q.clues.map(c=>c.text),p.clues.map(c=>c.text));
  for(const version of ['E1','E2','E3','E4']){const old=E.generate(seed,version);assert.equal(old.key,E.key(seed,version));assert.equal(old.roomMap,undefined)}
 }
});
