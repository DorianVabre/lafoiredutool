const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),E=require('../js/games/enquete-engine.js');
const cell=p=>p.r*6+p.c,point=n=>({r:Math.floor(n/6),c:n%6});
function contactDistance(p,start,decor){const blocked=new Set(p.decor.concat(p.victim).map(cell));if(blocked.has(start))return Infinity;const queue=[[start,0]],seen=new Set([start]);for(let i=0;i<queue.length;i++){const [n,d]=queue[i],r=Math.floor(n/6),c=n%6;if(Math.abs(r-decor.r)+Math.abs(c-decor.c)===1)return d;for(const [dr,dc] of [[0,1],[0,-1],[1,0],[-1,0]]){const nr=r+dr,nc=c+dc,next=nr*6+nc;if(nr>=0&&nr<6&&nc>=0&&nc<6&&!blocked.has(next)&&!seen.has(next)){seen.add(next);queue.push([next,d+1])}}}return Infinity}
test('V201 : les clés E1 à E6 reproduisent exactement les références figées avant modification',()=>{
 for(const r of require('./fixtures/enquete-e1-e6-v200.json')){const p=E.generate(r.seed,r.version),data={key:p.key,answer:p.answer,victim:p.victim,decor:p.decor,rooms:p.rooms,roomMap:p.roomMap,clues:p.clues.map(c=>({text:c.text,kind:c.kind,axis:c.axis,signature:c.signature}))};assert.equal(crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex'),r.sha256,r.version+' '+r.seed)}
 assert.equal(E.parse('E10-0000000-1WRBLU1'),null);assert.match(E.key(42,'E7'),/^E7-/);
});
test('E7 : nouvelles familles utiles, déduction confortable, variété, unicité et partage',()=>{
 const kinds=new Set();
 for(let i=0;i<40;i++){
  const seed=i===39?4294967295:Math.imul(i,104729)>>>0,p=E.generate(seed,'E7'),w=E.walkthrough(p),reverse=E.deduce(p.clues,{comfortable:true,reverse:true}),newClues=p.clues.filter(c=>['diagonal','closer','equidistant'].includes(c.kind));assert.match(p.key,/^E7-/);assert.equal(E.parse(p.key),seed);assert.ok(newClues.length);newClues.forEach(c=>kinds.add(c.kind));assert.ok(w.solved&&reverse.solved);assert.deepEqual(w.domains,p.answer.map(p=>[cell(p)]));assert.deepEqual(w.domains,reverse.domains);assert.deepEqual(E.solutions(p.clues),[p.answer]);assert.ok(w.steps.some(s=>newClues.some(c=>s.reason===c.text)));
  const counts={};for(const c of p.clues){assert.ok(c.test(p.answer));if(c.kind)counts[c.kind]=(counts[c.kind]||0)+1}assert.ok(Object.values(counts).every(n=>n<=2));assert.ok(counts.pm&&counts.los&&counts.room);assert.equal(new Set(p.clues.filter(c=>!c.fixed).map(c=>c.signature)).size,p.clues.length-1);
  for(const step of w.steps){assert.ok(!step.removed.includes(cell(p.answer[step.suspect])));if(['unary','pair'].includes(step.context.type))assert.ok(step.after.length<=6);if(step.context.type==='pair')assert.ok(step.context.otherDomain.length<=6)}
  if(i<3){const q=E.generate(E.parse(p.key),'E7');assert.deepEqual(q.answer,p.answer);assert.deepEqual(q.clues.map(c=>c.text),p.clues.map(c=>c.text))}
 }
 assert.deepEqual([...kinds].sort(),['closer','diagonal','equidistant']);
});
test('E7 : diagonales sans orientation et distances au contact vérifiées sur les cases candidates',()=>{
 const seen=new Set();for(let seed=0;seed<12;seed++){
  const p=E.generate(seed,'E7'),free=Array.from({length:36},(_,n)=>n).filter(n=>!p.clues[0].blocked.has(n)),dist=new Map(p.decor.map(d=>[d.name,Array.from({length:36},(_,n)=>contactDistance(p,n,d))]));
  for(const c of p.clues){if(c.kind==='diagonal'){seen.add(c.kind);assert.doesNotMatch(c.text,/nord|sud|est|ouest/);for(const a of free)for(const b of free){const x=point(a),y=point(b);assert.equal(c.pair(x,y),a!==b&&Math.abs(x.r-y.r)===Math.abs(x.c-y.c));assert.equal(c.pair(x,y),c.pair(y,x))}}
   if(c.kind==='equidistant'){seen.add(c.kind);const [a,b]=c.landmarks.map(d=>dist.get(d.name));for(const n of free)assert.equal(c.unary(point(n)),Number.isFinite(a[n])&&a[n]===b[n]);assert.ok(free.filter(n=>c.unary(point(n))).length<=6)}
   if(c.kind==='closer'){seen.add(c.kind);const d=dist.get(c.landmark.name),nearFirst=c.nearer===c.indices[0];for(const a of free)for(const b of free)assert.equal(c.pair(point(a),point(b)),Number.isFinite(d[a])&&Number.isFinite(d[b])&&(nearFirst?d[a]<d[b]:d[a]>d[b]))}
  }
  for(const d of p.decor)for(const n of free)if(Math.abs(point(n).r-d.r)+Math.abs(point(n).c-d.c)===1)assert.equal(dist.get(d.name)[n],0);
 }assert.equal(seen.size,3);
});
