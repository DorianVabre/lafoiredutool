const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),E=require('../js/games/enquete-engine.js');
const cell=p=>p.r*6+p.c,point=n=>({r:Math.floor(n/6),c:n%6});
const legacyDecorText=text=>text.includes(' est au contact du décor « ')?text.replace(' est au contact du décor « ',' est à 1 case de « ').replace(' ».', ' » à vol de tofu (sans diagonale, obstacles ignorés).'):text.includes(' PO du décor « ')?text.replace(' PO du décor « ',' cases de « ').replace(' ».', ' » à vol de tofu (sans diagonale, obstacles ignorés).'):text;

test('V202 : les clés E7 conservent leur plan et tous leurs témoignages',()=>{
 for(const r of require('./fixtures/enquete-e7-v201.json')){
  const p=E.generate(r.seed,r.version),data={key:p.key,answer:p.answer,victim:p.victim,decor:p.decor,rooms:p.rooms,roomMap:p.roomMap,clues:p.clues.map(c=>({text:c.kind==='decor'?legacyDecorText(c.text):c.text,kind:c.kind,axis:c.axis,signature:c.signature}))};
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex'),r.sha256,'E7 '+r.seed);assert.equal(E.parse(p.key),r.seed);
 }
 assert.match(E.key(42,'E8'),/^E8-/);assert.equal(E.parse(E.key(4294967295)),4294967295);assert.equal(E.parse(E.key(0,'E10')),null);
});

test('E8 : les deux bornes de PO sont incluses, indépendantes des obstacles et de la ligne de vue',()=>{
 let tested=0,detour=false,hidden=false;const bounds=new Set();
 for(let seed=0;seed<12;seed++){
  const p=E.generate(seed,'E8'),free=Array.from({length:36},(_,n)=>n).filter(n=>!p.clues[0].blocked.has(n));
  for(const c of p.clues.filter(c=>c.kind==='range')){
   tested++;assert.ok(c.minRange>=3&&c.minRange<c.maxRange&&c.maxRange<=9);assert.match(c.text,new RegExp('entre '+c.minRange+' et '+c.maxRange+' PO'));
   for(let a=0;a<36;a++)for(let b=0;b<36;b++){
    const x=point(a),y=point(b),po=Math.abs(x.r-y.r)+Math.abs(x.c-y.c),expected=po>=c.minRange&&po<=c.maxRange;
    assert.equal(c.pair(x,y),expected);assert.equal(c.pair(y,x),expected);
    if(po===c.minRange||po===c.maxRange)bounds.add('inclusive');
    if(po===c.minRange-1)bounds.add('below');if(po===c.maxRange+1)bounds.add('above');
    if(expected&&free.includes(a)&&free.includes(b)&&x.r!==y.r&&x.c!==y.c){
     if(!detour&&E.pmDistance(x,y,p.decor.concat(p.victim))>c.maxRange)detour=true;
     if(!hidden&&!E.lineOfSight(x,y,p.decor))hidden=true;
    }
   }
  }
 }
 assert.ok(tested>0);assert.deepEqual([...bounds].sort(),['above','below','inclusive']);assert.ok(detour,'Une portée valide peut demander plus de PM pour contourner un obstacle');assert.ok(hidden,'Une portée valide peut être sans ligne de vue');
});

test('E8 : portée utile dans le raisonnement, familles variées, solution unique et reproductible sans supposition',()=>{
 const seen=new Set();let usefulRange=0;
 for(let i=0;i<40;i++){
  const seed=i===39?4294967295:Math.imul(i,104729)>>>0,p=E.generate(seed,'E8'),w=E.walkthrough(p),reverse=E.deduce(p.clues,{comfortable:true,reverse:true});
  assert.equal(p.key,E.key(seed,'E8'));assert.equal(E.parse(p.key),seed);assert.ok(w.solved&&reverse.solved,'seed '+seed);assert.deepEqual(w.domains,p.answer.map(p=>[cell(p)]));assert.deepEqual(w.domains,reverse.domains);assert.deepEqual(E.solutions(p.clues),[p.answer]);
  const counts={};for(const c of p.clues){assert.ok(c.test(p.answer));if(c.kind){counts[c.kind]=(counts[c.kind]||0)+1;seen.add(c.kind)}}
  assert.ok(Object.values(counts).every(n=>n<=2));assert.ok(counts.pm&&counts.los&&counts.room);assert.ok(Object.keys(counts).length>=4);assert.equal(new Set(p.clues.filter(c=>!c.fixed).map(c=>c.signature)).size,p.clues.length-1);
  assert.ok(w.steps.some(s=>p.clues.some(c=>['diagonal','closer','equidistant','range'].includes(c.kind)&&s.reason===c.text)));
  if(w.steps.some(s=>p.clues.some(c=>c.kind==='range'&&s.reason===c.text)))usefulRange++;
  for(const s of w.steps){assert.ok(!s.removed.includes(cell(p.answer[s.suspect])));if(['unary','pair'].includes(s.context.type))assert.ok(s.after.length<=6);if(s.context.type==='pair')assert.ok(s.context.otherDomain.length<=6)}
  if(i<3){const q=E.generate(E.parse(p.key),'E8');assert.deepEqual(q.answer,p.answer);assert.deepEqual(q.clues.map(c=>c.text),p.clues.map(c=>c.text))}
 }
 for(const kind of ['diagonal','closer','equidistant','range'])assert.ok(seen.has(kind),kind);assert.ok(usefulRange>=10,'Les portées doivent guider réellement la déduction sur plusieurs affaires');
});
