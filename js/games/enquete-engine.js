// Format E1 : le générateur et le PRNG restent figés pour préserver les clés partagées.
const EnqueteEngine=(()=>{
 const names=['Sélène la Sram','Bram le Iop','Mina l’Écaflip','Orme le Sadida','Nox le Xélor','Plume la Crâ'];
 const rooms=['Bibliothèque','Atelier des runes','Serre de kaliptus','Salle des coffres'];
 const room=(r,c,layout)=>layout?layout[r*6+c]:Math.floor(r/3)*2+Math.floor(c/3);
 function rng(seed){let n=seed>>>0;return()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
 function shuffle(a,random){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
 function checksum(seed){return (Math.imul(seed^0x8f42ac19,2654435761)>>>0).toString(36).toUpperCase().padStart(7,'0')}
 function key(seed,version='E9'){return version+'-'+(seed>>>0).toString(36).toUpperCase().padStart(7,'0')+'-'+checksum(seed>>>0)}
 function parse(value){const m=String(value).trim().toUpperCase().match(/^(E[123456789])-([0-9A-Z]{7})-([0-9A-Z]{7})$/);if(!m)return null;const seed=parseInt(m[2],36);return seed<=4294967295&&key(seed,m[1])===m[0]?seed:null}
 function permutations(a){if(!a.length)return [[]];return a.flatMap((x,i)=>permutations(a.filter((_,j)=>j!==i)).map(p=>[x,...p]))}
 const perms=permutations([0,1,2,3,4,5]);
 // Une solution est indexée par suspect : {r,c}. Les permutations imposent une personne par ligne et colonne.
 function solutions(clues,limit=2){
  const found=[],rowClues=clues.filter(c=>c.axis==='r'),colClues=clues.filter(c=>c.axis==='c'),environment=clues.filter(c=>c.environment),blocked=clues.find(c=>c.blocked)?.blocked;
  const columns=perms.filter(cols=>colClues.every(c=>c.test(cols.map(c=>({r:0,c})))));
  for(const rows of perms){
   const p=rows.map(r=>({r,c:0}));if(!rowClues.every(c=>c.test(p)))continue;
   if(!blocked){for(const cols of columns){const s=rows.map((r,i)=>({r,c:cols[i]}));if(clues.every(c=>c.test(s))){found.push(s);if(found.length>=limit)return found}}continue}
   const allowed=rows.map((r,i)=>[0,1,2,3,4,5].filter(c=>!blocked.has(r*6+c)&&environment.filter(e=>e.index===i).every(e=>Math.abs(r-e.landmark.r)+Math.abs(c-e.landmark.c)===e.distance)));
   function visit(i,used){
    if(i===6){if(clues.every(c=>c.test(p)))found.push(p.map(v=>({...v})));return found.length>=limit}
    for(const c of allowed[i]){if(used&(1<<c))continue;p[i].c=c;if(clues.some(k=>k.partial&&k.indices.every(j=>j<=i)&&!k.test(p)))continue;if(visit(i+1,used|(1<<c)))return true}return false;
   }
   if(visit(0,0))return found;
  }
  return found;
 }

 function legacy(seed){
  const random=rng(seed),rs=shuffle([0,1,2,3,4,5],random),cs=shuffle([0,1,2,3,4,5],random),answer=rs.map((r,i)=>({r,c:cs[i]}));
  // Répartition 3/3 sans isolé : déplacer deux colonnes pour créer deux salles occupées par une seule personne.
  let counts=rooms.map((_,k)=>answer.filter(p=>room(p.r,p.c)===k).length);
  if(!counts.includes(1)){const a=answer.findIndex(p=>p.r<3),b=answer.findIndex(p=>p.r>=3);[answer[a].c,answer[b].c]=[answer[b].c,answer[a].c];counts=rooms.map((_,k)=>answer.filter(p=>room(p.r,p.c)===k).length)}
  const lonely=counts.map((n,i)=>n===1?i:-1).filter(i=>i>=0),crimeRoom=lonely[Math.floor(random()*lonely.length)],killer=answer.findIndex(p=>room(p.r,p.c)===crimeRoom);
  const victimCells=[];for(let r=0;r<6;r++)for(let c=0;c<6;c++)if(room(r,c)===crimeRoom&&(r!==answer[killer].r||c!==answer[killer].c))victimCells.push({r,c});const victim=victimCells[Math.floor(random()*victimCells.length)];
  const candidates=[];
  const add=(text,axis,test)=>candidates.push({text,axis,test});
  for(let i=0;i<6;i++){
   const p=answer[i],n=names[i];
   add(n+' se trouve dans la moitié '+(p.r<3?'nord':'sud')+' du manoir.','r',s=>(s[i].r<3)===(p.r<3));
   add(n+' se trouve dans la moitié '+(p.c<3?'ouest':'est')+' du manoir.','c',s=>(s[i].c<3)===(p.c<3));
   add(n+' est dans : '+rooms[room(p.r,p.c)]+'.','both',s=>room(s[i].r,s[i].c)===room(p.r,p.c));
   for(let j=i+1;j<6;j++){
    const q=answer[j];add(n+' est '+(p.r<q.r?'au nord':'au sud')+' de '+names[j]+'.','r',s=>(s[i].r<s[j].r)===(p.r<q.r));
    add(n+' est '+(p.c<q.c?'à l’ouest':'à l’est')+' de '+names[j]+'.','c',s=>(s[i].c<s[j].c)===(p.c<q.c));
    if(Math.abs(p.r-q.r)===1)add(n+' et '+names[j]+' sont sur deux lignes consécutives.','r',s=>Math.abs(s[i].r-s[j].r)===1);
    if(Math.abs(p.c-q.c)===1)add(n+' et '+names[j]+' sont sur deux colonnes consécutives.','c',s=>Math.abs(s[i].c-s[j].c)===1);
   }
  }
  // Les lignes/colonnes exactes garantissent une génération terminante, puis suppression de tout indice superflu.
  for(let i=0;i<6;i++){add(names[i]+' est sur la ligne '+(answer[i].r+1)+'.','r',s=>s[i].r===answer[i].r);add(names[i]+' est dans la colonne '+String.fromCharCode(65+answer[i].c)+'.','c',s=>s[i].c===answer[i].c)}
  let clues=shuffle(candidates,random).slice(0,18);
  if(solutions(clues).length!==1)clues=candidates.slice(-12).concat(clues);
  for(const clue of shuffle(clues,random)){const next=clues.filter(c=>c!==clue);if(solutions(next).length===1)clues=next}
  return {seed,key:key(seed,'E1'),names,rooms,answer,clues,victim,killer,crimeRoom};
 }
 function decorated(seed,version='E2'){
  const base=legacy(seed);if(version==='E1')return base;
  if(version!=='E2')throw Error('Version inconnue');
  const random=rng(seed^0x54127a31),occupied=new Set(base.answer.concat(base.victim).map(p=>p.r*6+p.c));
  const objects=[['temple','Autel de Iop'],['zaap','Petit zaap'],['chest','Coffre de Ruel'],['fountain','Fontaine à souhaits'],['tree','Kaliptus en pot'],['anvil','Enclume du forgemage']];
  const decor=[];
  for(let i=0;i<objects.length;i++){
   const p=base.answer[i],near=[];for(let r=0;r<6;r++)for(let c=0;c<6;c++)if(!occupied.has(r*6+c)&&Math.abs(p.r-r)+Math.abs(p.c-c)===1)near.push({r,c});
   const free=[];for(let r=0;r<6;r++)for(let c=0;c<6;c++)if(!occupied.has(r*6+c))free.push({r,c});
   const cell=shuffle(near.length?near:free,random)[0];occupied.add(cell.r*6+cell.c);decor.push({...cell,icon:objects[i][0],name:objects[i][1]});
  }
  const blocked=new Set(decor.concat(base.victim).map(p=>p.r*6+p.c));
  const rule={text:'Le corps et les six éléments de décor occupent leurs cases : aucun suspect ne peut s’y trouver.',axis:'both',fixed:true,blocked,test:s=>s.every(p=>!blocked.has(p.r*6+p.c))};
  const environmental=[];
  base.answer.forEach((p,i)=>{
   const landmark=decor[i],distance=Math.abs(p.r-landmark.r)+Math.abs(p.c-landmark.c);
   environmental.push({text:names[i]+' se trouve à '+distance+' case'+(distance>1?'s':'')+' de « '+landmark.name+' » (horizontalement et verticalement, sans compter les diagonales).',axis:'both',environment:true,index:i,landmark,distance,test:s=>Math.abs(s[i].r-landmark.r)+Math.abs(s[i].c-landmark.c)===distance});
  });
  let clues=[rule,...base.clues,...environmental];
  // Retirer d’abord les anciens indices pour donner un véritable rôle aux repères du plan.
  for(const clue of [...base.clues,...shuffle(environmental,random)]){const next=clues.filter(c=>c!==clue);if(solutions(next).length===1)clues=next}
  return {...base,key:key(seed,'E2'),decor,clues};
 }
 // Segment de centre à centre : les cases seulement effleurées par un sommet ne coupent pas la vue.
 const rays=new Map();
 function ray(a,b){
  const cacheKey=(a.r*6+a.c)*36+b.r*6+b.c;if(rays.has(cacheKey))return rays.get(cacheKey);
  let r=a.r,c=a.c,ir=0,ic=0;const dr=Math.abs(b.r-r),dc=Math.abs(b.c-c),sr=Math.sign(b.r-r),sc=Math.sign(b.c-c),cells=[];
  while(r!==b.r||c!==b.c){const tr=(2*ir+1)*dc,tc=(2*ic+1)*dr;
   if(tr===tc){r+=sr;c+=sc;ir++;ic++}else if(tr<tc){r+=sr;ir++}else{c+=sc;ic++}
   if(r!==b.r||c!==b.c)cells.push(r*6+c);
  }
  rays.set(cacheKey,cells);return cells;
 }
 function lineOfSight(a,b,obstacles=[],people=[]){const cells=ray(a,b),blocked=new Set(obstacles.concat(people).filter(p=>(p.r!==a.r||p.c!==a.c)&&(p.r!==b.r||p.c!==b.c)).map(p=>p.r*6+p.c));return !cells.some(n=>blocked.has(n))}
 // Coût du plus court trajet sur le plan, hors tacle et autres suspects.
 function pmDistance(a,b,obstacles=[]){
  const blocked=new Set(obstacles.map(p=>p.r*6+p.c)),start=a.r*6+a.c,end=b.r*6+b.c;
  if(blocked.has(start)||blocked.has(end))return Infinity;
  const queue=[start],dist=Array(36).fill(-1);dist[start]=0;
  for(let i=0;i<queue.length;i++){const n=queue[i];if(n===end)return dist[n];const r=Math.floor(n/6),c=n%6;
   for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){const nr=r+dr,nc=c+dc,next=nr*6+nc;if(nr<0||nr>5||nc<0||nc>5||blocked.has(next)||dist[next]>=0)continue;dist[next]=dist[n]+1;queue.push(next)}
  }return Infinity;
 }
 function third(seed,version='E3'){
  if(version==='E1'||version==='E2')return decorated(seed,version);if(version!=='E3')throw Error('Version inconnue');
  const base=decorated(seed),original=legacy(seed),random=rng(seed^0x73cf0281),obstacles=base.decor.concat(base.victim),pm=[],los=[];
  const distances=Array.from({length:36},(_,a)=>Array.from({length:36},(_,b)=>pmDistance({r:Math.floor(a/6),c:a%6},{r:Math.floor(b/6),c:b%6},obstacles)));
  for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){
   const distance=distances[base.answer[i].r*6+base.answer[i].c][base.answer[j].r*6+base.answer[j].c];
   if(Number.isFinite(distance))pm.push({text:names[i]+' est à '+distance+' PM de '+names[j]+'.',axis:'both',kind:'pm',partial:true,indices:[i,j],test:s=>distances[s[i].r*6+s[i].c][s[j].r*6+s[j].c]===distance});
   const visible=lineOfSight(base.answer[i],base.answer[j],base.decor,base.answer);
   los.push({text:names[i]+(visible?' a une ligne de vue sur ':' n’a pas de ligne de vue sur ')+names[j]+'.',axis:'both',kind:'los',test:s=>lineOfSight(s[i],s[j],base.decor,s)===visible});
  }
  const environment=shuffle(base.clues.filter(c=>c.environment),random).slice(0,2),relations=[...shuffle(pm,random).slice(0,3),...shuffle(los,random).slice(0,2)];
  let clues=[base.clues.find(c=>c.fixed),...original.clues,...relations,...environment];
  // Donner la priorité aux relations entre suspects, en conservant un mélange de familles.
  for(const clue of [...environment,...shuffle(original.clues,random),...shuffle(relations,random)]){
   if(clue.environment&&clues.filter(c=>c.environment).length<=1)continue;
   if(clue.kind==='pm'&&clues.filter(c=>c.kind==='pm').length<=2)continue;
   if(clue.kind==='los'&&clues.filter(c=>c.kind==='los').length<=1)continue;
   const next=clues.filter(c=>c!==clue);if(solutions(next).length===1)clues=next;
  }
  return {...base,key:key(seed,'E3'),clues};
 }
 // Propagation seulement : aucun branchement, aucun accès à la solution attendue.
 function deduce(clues,{reverse=false,explain=false,placements=[],comfortable=false,candidates=null,excluded=[]}={}){
  const blocked=new Set([...(clues.find(c=>c.blocked)?.blocked||[]),...excluded]),initial=Array.from({length:36},(_,n)=>n).filter(n=>!blocked.has(n));
  let domains=Array.from({length:6},(_,i)=>placements[i]?[placements[i].r*6+placements[i].c].filter(n=>!blocked.has(n)):initial.filter(n=>!candidates?.[i]||candidates[i].includes(n)));const trace=[];
  const point=n=>({r:Math.floor(n/6),c:n%6}),different=(a,b)=>Math.floor(a/6)!==Math.floor(b/6)&&a%6!==b%6;
  function restrict(i,keep,reason,context,max=36){const next=domains[i].filter(keep);if(next.length===domains[i].length||next.length>max)return false;const step={suspect:i,removed:domains[i].filter(n=>!next.includes(n)),reason};if(comfortable)step.remaining=next.length;if(explain)Object.assign(step,{before:domains[i].slice(),after:next.slice(),context});trace.push(step);domains[i]=next;return true}
  const ordered=reverse?clues.slice().reverse():clues;
  let changed=true,passes=0;
  while(changed&&domains.every(d=>d.length)&&passes++<300){changed=false;
   for(const clue of ordered){
    if(clue.unary)changed=restrict(clue.index,n=>clue.unary(point(n)),clue.text,explain?{type:'unary',clue:clues.indexOf(clue)}:null,comfortable?6:36)||changed;
    if(clue.pair){const [i,j]=clue.indices;
     if(!comfortable||domains[j].length<=6)changed=restrict(i,a=>domains[j].some(b=>different(a,b)&&clue.pair(point(a),point(b),domains)),clue.text,explain?{type:'pair',clue:clues.indexOf(clue),other:j,otherDomain:domains[j].slice()}:null,comfortable?6:36)||changed;
     if(!comfortable||domains[i].length<=6)changed=restrict(j,b=>domains[i].some(a=>different(a,b)&&clue.pair(point(a),point(b),domains)),clue.text,explain?{type:'pair',clue:clues.indexOf(clue),other:i,otherDomain:domains[i].slice()}:null,comfortable?6:36)||changed;
    }
   }
   // Une ligne et une colonne par suspect : élimination par compatibilité, puis places uniques.
   for(let i=0;i<6;i++)for(let j=0;j<6;j++)if(i!==j&&(!comfortable||domains[j].length<=6))changed=restrict(i,a=>domains[j].some(b=>different(a,b)),'Une personne par ligne et colonne',explain?{type:'distinct',other:j,otherDomain:domains[j].slice()}:null)||changed;
   for(const axis of [n=>Math.floor(n/6),n=>n%6])for(let value=0;value<6;value++){
    const possible=domains.map((d,i)=>d.some(n=>axis(n)===value)?i:-1).filter(i=>i>=0);
    if(possible.length===1)changed=restrict(possible[0],n=>axis(n)===value,'Seul suspect possible dans cette ligne ou colonne',explain?{type:'only',axis:axis(6)===1?'ligne':'colonne',value}:null)||changed;
   }
  }
  return {solved:domains.every(d=>d.length===1),domains,trace,passes};
 }
 function irregular(seed){
  const base=decorated(seed),random=rng(seed^0x6258a714),layout=Array.from({length:36},(_,n)=>room(Math.floor(n/6),n%6));
  const protectedCells=new Set(base.answer.concat(base.victim).map(p=>p.r*6+p.c));
  const neighbors=n=>[n%6>0?n-1:-1,n%6<5?n+1:-1,n>=6?n-6:-1,n<30?n+6:-1].filter(n=>n>=0);
  function connected(id,skip){const cells=layout.map((v,n)=>v===id&&n!==skip?n:-1).filter(n=>n>=0);if(!cells.length)return false;const seen=new Set([cells[0]]),queue=[cells[0]];for(let i=0;i<queue.length;i++)for(const n of neighbors(queue[i]))if(n!==skip&&layout[n]===id&&!seen.has(n)){seen.add(n);queue.push(n)}return seen.size===cells.length}
  // Déplacer une case de frontière sans couper une salle ni déplacer les personnes du scénario.
  for(let step=0;step<240;step++){
   const cell=Math.floor(random()*36);if(protectedCells.has(cell))continue;const from=layout[cell],to=layout[neighbors(cell)[Math.floor(random()*neighbors(cell).length)]];
   if(from===to||layout.filter(v=>v===from).length<=5||layout.filter(v=>v===to).length>=13||!connected(from,cell))continue;layout[cell]=to;
  }
  const roomNames=shuffle(['Bibliothèque des songes','Atelier des runes','Serre de kaliptus','Salle des coffres','Oratoire de Iop','Salon du Chacha','Observatoire du Xélor','Réserve de potions'],random).slice(0,4);
  return {...base,rooms:roomNames,roomMap:layout};
 }
 function fourth(seed,attempt=0,edition='E4'){
  const source=(seed+Math.imul(attempt,0x9e3779b9))>>>0;
  const base=['E5','E6','E7','E8','E9'].includes(edition)?irregular(source):decorated(source),random=rng(source^0x478ace91),blocked=base.clues.find(c=>c.fixed),pool=[];
  const roomAt=(r,c)=>room(r,c,base.roomMap),roomNames=base.rooms;
  const solve=clues=>deduce(clues,{comfortable:['E6','E7','E8','E9'].includes(edition)});
  if(['E5','E6','E7','E8','E9'].includes(edition)){
   const irregularCount=base.rooms.filter((_,id)=>{const cells=base.roomMap.flatMap((v,n)=>v===id?[n]:[]),rows=cells.map(n=>Math.floor(n/6)),cols=cells.map(n=>n%6);return (Math.max(...rows)-Math.min(...rows)+1)*(Math.max(...cols)-Math.min(...cols)+1)!==cells.length}).length;
   if(irregularCount<2){if(attempt<63)return fourth(seed,attempt+1,edition);throw Error('Contours de salles insuffisamment variés')}
  }
  const point=n=>({r:Math.floor(n/6),c:n%6}),cell=p=>p.r*6+p.c;
  const distances=Array.from({length:36},(_,a)=>Array.from({length:36},(_,b)=>pmDistance(point(a),point(b),base.decor.concat(base.victim))));
  function unary(i,text,test,kind='position',extra={}){
   const signature='u:'+i+':'+Array.from({length:36},(_,n)=>test(point(n))?'1':'0').join('');
   pool.push({text,axis:'both',index:i,unary:test,kind,signature,...extra,test:s=>test(s[i])});
  }
  function pair(i,j,text,test,kind,extra={}){
   const signature='b:'+i+':'+j+':'+Array.from({length:1296},(_,n)=>test(point(Math.floor(n/36)),point(n%36))?'1':'0').join('');
   pool.push({text,axis:'both',indices:[i,j],pair:test,kind,signature,partial:true,...extra,test:s=>test(s[i],s[j])});
  }
  // Les décors bloquent leur case : distance jusqu'à une case libre voisine.
  const contact=['E7','E8','E9'].includes(edition)?base.decor.map(d=>{const adjacent=Array.from({length:36},(_,n)=>n).filter(n=>!blocked.blocked.has(n)&&Math.abs(Math.floor(n/6)-d.r)+Math.abs(n%6-d.c)===1);return distances.map(row=>Math.min(...adjacent.map(n=>row[n])))}):null;
  const newKinds=['E8','E9'].includes(edition)?['diagonal','closer','equidistant','range']:['diagonal','closer','equidistant'];
  for(let i=0;i<6;i++){
   const p=base.answer[i],name=names[i];
   unary(i,name+' se trouve dans la moitié '+(p.r<3?'nord':'sud')+' du manoir.',a=>(a.r<3)===(p.r<3),'half');
   unary(i,name+' se trouve dans la moitié '+(p.c<3?'ouest':'est')+' du manoir.',a=>(a.c<3)===(p.c<3),'half');
   unary(i,name+' est dans : '+roomNames[roomAt(p.r,p.c)]+'.',a=>roomAt(a.r,a.c)===roomAt(p.r,p.c),'room');
   if(['E5','E6','E7','E8','E9'].includes(edition)){const excluded=(roomAt(p.r,p.c)+1+Math.floor(random()*3))%4;unary(i,name+' ne se trouve pas dans : '+roomNames[excluded]+'.',a=>roomAt(a.r,a.c)!==excluded,'room')}
   unary(i,name+' est sur la ligne '+(p.r+1)+'.',a=>a.r===p.r,'row');
   unary(i,name+' est dans la colonne '+String.fromCharCode(65+p.c)+'.',a=>a.c===p.c,'column');
   const landmark=base.decor[i],distance=Math.abs(p.r-landmark.r)+Math.abs(p.c-landmark.c);
   unary(i,(distance===1?name+' est au contact du décor « '+landmark.name+' ».':name+' est à '+distance+' PO du décor « '+landmark.name+' ».'),a=>Math.abs(a.r-landmark.r)+Math.abs(a.c-landmark.c)===distance,'decor');
   if(['E7','E8','E9'].includes(edition))for(let a=0;a<base.decor.length;a++)for(let b=a+1;b<base.decor.length;b++){
    const da=contact[a][cell(p)],db=contact[b][cell(p)];if(Number.isFinite(da)&&da===db)unary(i,name+' est à autant de PM du contact de « '+base.decor[a].name+' » que de « '+base.decor[b].name+' ».',q=>Number.isFinite(contact[a][cell(q)])&&contact[a][cell(q)]===contact[b][cell(q)],'equidistant',{landmarks:[base.decor[a],base.decor[b]]});
   }
   for(let j=i+1;j<6;j++){
    const q=base.answer[j],other=names[j];
    pair(i,j,name+' est '+(p.r<q.r?'au nord':'au sud')+' de '+other+'.',(a,b)=>(a.r<b.r)===(p.r<q.r),'direction');
    pair(i,j,name+' est '+(p.c<q.c?'à l’ouest':'à l’est')+' de '+other+'.',(a,b)=>(a.c<b.c)===(p.c<q.c),'direction');
    if(Math.abs(p.r-q.r)===1)pair(i,j,name+' et '+other+' sont sur deux lignes consécutives.',(a,b)=>Math.abs(a.r-b.r)===1,'adjacent');
    if(Math.abs(p.c-q.c)===1)pair(i,j,name+' et '+other+' sont sur deux colonnes consécutives.',(a,b)=>Math.abs(a.c-b.c)===1,'adjacent');
    const distance=distances[cell(p)][cell(q)];if(Number.isFinite(distance))pair(i,j,name+' est à '+distance+' PM de '+other+'.',(a,b)=>distances[cell(a)][cell(b)]===distance,'pm');
    if(['E7','E8','E9'].includes(edition)){
     if(Math.abs(p.r-q.r)===Math.abs(p.c-q.c))pair(i,j,name+' et '+other+' sont sur une même diagonale.',(a,b)=>a.r!==b.r&&Math.abs(a.r-b.r)===Math.abs(a.c-b.c),'diagonal');
     for(let a=0;a<base.decor.length;a++){const dp=contact[a][cell(p)],dq=contact[a][cell(q)];if(!Number.isFinite(dp)||!Number.isFinite(dq)||dp===dq)continue;const near=dp<dq;
      pair(i,j,(near?name:other)+' est plus proche du contact de « '+base.decor[a].name+' » que '+(near?other:name)+' (en PM).',(p,q)=>Number.isFinite(contact[a][cell(p)])&&Number.isFinite(contact[a][cell(q)])&&(near?contact[a][cell(p)]<contact[a][cell(q)]:contact[a][cell(p)]>contact[a][cell(q)]),'closer',{landmark:base.decor[a],nearer:near?i:j});
     }
    }
    if(['E8','E9'].includes(edition)){
     const po=Math.abs(p.r-q.r)+Math.abs(p.c-q.c);
     // Bornes incluses et toutes deux restrictives sur une grille où deux suspects sont à 2–10 PO.
     for(let minRange=3;minRange<9;minRange++)for(let maxRange=minRange+1;maxRange<=Math.min(minRange+3,9);maxRange++)if(po>=minRange&&po<=maxRange){
      pair(i,j,name+' est entre '+minRange+' et '+maxRange+' PO de '+other+'.',(a,b)=>{const distance=Math.abs(a.r-b.r)+Math.abs(a.c-b.c);return distance>=minRange&&distance<=maxRange},'range',{minRange,maxRange});
     }
    }

    const visible=lineOfSight(p,q,base.decor,base.answer);
    const los={text:name+(visible?' a une ligne de vue sur ':' n’a pas de ligne de vue sur ')+other+'.',axis:'both',kind:'los',indices:[i,j],signature:'los:'+i+':'+j+':'+visible,test:s=>lineOfSight(s[i],s[j],base.decor,s)===visible};
    // Support prudent : vue positive impossible si un tiers bloque forcément ; vue négative possible si un tiers peut bloquer.
    los.pair=(a,b,domains)=>{
     if(!lineOfSight(a,b,base.decor))return !visible;
     const crossed=new Set(ray(a,b));const others=domains.filter((_,k)=>k!==i&&k!==j);
     return visible?!others.some(d=>d.length&&d.every(n=>crossed.has(n))):others.some(d=>d.some(n=>crossed.has(n)));
    };pool.push(los);
   }
  }
  const unique=[...new Map(pool.map(c=>[c.signature,c])).values()].filter(c=>!['E6','E7','E8','E9'].includes(edition)||!c.unary||Array.from({length:36},(_,n)=>n).filter(n=>!blocked.blocked.has(n)&&c.unary(point(n))).length<=6),ordered=shuffle(unique,random);
  let clues=[blocked];
  const numericalKinds=['pm','range','decor'];
  const canAdd=c=>!clues.includes(c)&&clues.filter(v=>v.kind===c.kind).length<(edition==='E9'?1:2)&&(edition!=='E9'||!numericalKinds.includes(c.kind)||clues.filter(v=>numericalKinds.includes(v.kind)).length<2);
  // Semer des familles différentes ; compléter seulement par des faits qui font progresser la propagation.
  const initialKinds=edition==='E9'?['pm','los','room',source%2?'range':'decor']:['E5','E6','E7','E8'].includes(edition)?['pm','pm','los','decor','room']:['pm','pm','los','decor'];
  for(const kind of initialKinds){const c=ordered.find(c=>c.kind===kind&&canAdd(c));if(c)clues.push(c)}
  let proof=solve(clues);
  if(['E7','E8','E9'].includes(edition)){
   const preferred=newKinds[source%newKinds.length],candidates=ordered.filter(c=>newKinds.includes(c.kind)&&(edition!=='E9'||canAdd(c))).sort((a,b)=>Number(b.kind===preferred)-Number(a.kind===preferred));
   for(const c of candidates){const next=solve(clues.concat(c));if(next.domains.reduce((n,d)=>n+d.length,0)<proof.domains.reduce((n,d)=>n+d.length,0)){clues.push(c);proof=next;break}}
  }
  while(!proof.solved){
   const before=proof.domains.reduce((n,d)=>n+d.length,0);
   let chosen=null,nextProof=null;
   for(const candidate of [...ordered.filter(c=>c.kind!=='row'&&c.kind!=='column'),...ordered.filter(c=>c.kind==='row'||c.kind==='column')]){
    if(!canAdd(candidate))continue;
    const next=solve(clues.concat(candidate));if(next.domains.reduce((n,d)=>n+d.length,0)<before){chosen=candidate;nextProof=next;break}
   }
   if(!chosen){if(attempt<63)return fourth(seed,attempt+1,edition);throw Error('Aucune combinaison de déduction disponible')}clues.push(chosen);proof=nextProof;
  }
  // Un indice retiré uniquement si les règles de déduction résolvent encore le niveau, sans supposition.
  for(const c of shuffle(clues.filter(c=>!c.fixed),random)){if(['E7','E8','E9'].includes(edition)&&newKinds.includes(c.kind)&&clues.filter(c=>newKinds.includes(c.kind)).length===1)continue;const next=clues.filter(v=>v!==c);if(solve(next).solved)clues=next}
  const families=new Set(clues.filter(c=>c.kind).map(c=>c.kind));
  if(families.size<4||!families.has('pm')||!families.has('los')||['E5','E6','E7','E8','E9'].includes(edition)&&!families.has('room')){if(attempt<63)return fourth(seed,attempt+1,edition);throw Error('Diversité des indices insuffisante')}
  proof=solve(clues);
  const resolved=proof.domains.map(d=>point(d[0]));
  if(!proof.solved||!clues.every(c=>c.test(resolved)))throw Error('Preuve de déduction invalide');
  if(['E6','E7','E8','E9'].includes(edition)){const size=c=>Array.from({length:36},(_,n)=>n).filter(n=>!blocked.blocked.has(n)&&c.unary(point(n))).length;clues=clues.filter(c=>c.fixed).concat(clues.filter(c=>c.unary).sort((a,b)=>size(a)-size(b)),clues.filter(c=>!c.fixed&&!c.unary))}
  proof=solve(clues);
  if(['E7','E8','E9'].includes(edition)&&!proof.trace.some(step=>clues.some(c=>newKinds.includes(c.kind)&&c.text===step.reason))){if(attempt<63)return fourth(seed,attempt+1,edition);throw Error('Aucun nouveau témoignage utile')}
  return {...base,seed,key:key(seed,edition),clues,deduction:proof};
 }
 function generate(seed,version='E9'){return version==='E9'?fourth(seed,0,'E9'):version==='E8'?fourth(seed,0,'E8'):version==='E7'?fourth(seed,0,'E7'):version==='E6'?fourth(seed,0,'E6'):version==='E5'?fourth(seed,0,'E5'):version==='E4'?fourth(seed):third(seed,version)}
 // Adaptation des témoignages des anciennes éditions, sans modifier leurs niveaux ni leurs clés.
 function explanationClues(puzzle){
  const point=n=>({r:Math.floor(n/6),c:n%6}),blocked=new Set((puzzle.decor||[]).concat(puzzle.victim).map(p=>p.r*6+p.c));
  return puzzle.clues.map(c=>{
   if(c.fixed||c.blocked)return {...c,blocked};if(c.unary||c.pair)return c;
   const indices=puzzle.names.map((name,i)=>c.text.includes(name)?i:-1).filter(i=>i>=0);
   const state=()=>Array.from({length:6},()=>({r:0,c:0}));
   if(indices.length===1){const index=indices[0];return {...c,index,unary:a=>{const s=state();s[index]=a;return c.test(s)}}}
   if(indices.length===2){const [i,j]=indices;
    if(c.kind==='los'||c.text.includes('ligne de vue')){const visible=!c.text.includes('n’a pas');return {...c,indices,pair:(a,b,domains)=>{
     if(!lineOfSight(a,b,puzzle.decor||[]))return !visible;
     const crossed=new Set(ray(a,b)),others=domains.filter((_,k)=>k!==i&&k!==j);
     return visible?!others.some(d=>d.length&&d.every(n=>crossed.has(n))):others.some(d=>d.some(n=>crossed.has(n)));
    }}}
    return {...c,indices,pair:(a,b)=>{const s=state();s[i]=a;s[j]=b;return c.test(s)}};
   }return c;
  }).concat(puzzle.clues.some(c=>c.blocked)?[]:[{fixed:true,blocked,text:'Les cases occupées par le corps et le décor sont exclues.',test:s=>s.every(p=>!blocked.has(p.r*6+p.c))}]);
 }
 function walkthrough(puzzle,placements=[],{candidates=null,excluded=[]}={}){
  const clues=explanationClues(puzzle),proof=deduce(clues,{explain:true,placements,comfortable:/^E[6789]-/.test(puzzle.key),candidates,excluded}),coordinate=n=>String.fromCharCode(65+n%6)+(Math.floor(n/6)+1),list=ns=>ns.map(coordinate).join(', ');
  let number=0;const visibleNumbers=clues.map(c=>c.fixed?null:++number);
  const steps=proof.trace.map(step=>{
   const name=puzzle.names[step.suspect],ctx=step.context;let title,text;
   if(ctx.type==='only'){const location=ctx.axis==='ligne'?String(ctx.value+1):String.fromCharCode(65+ctx.value);title='La '+ctx.axis+' '+location+' impose '+name;text='Chaque '+ctx.axis+' doit contenir un suspect. '+name+' est le seul à avoir encore une possibilité dans cette '+ctx.axis+'.'}
   else if(ctx.type==='distinct'){title='Croiser les lignes et colonnes';text=puzzle.names[ctx.other]+' ne peut être qu’en '+list(ctx.otherDomain)+'. Chacune des cases éliminées de '+name+' occuperait la même ligne ou la même colonne que toutes ces possibilités : l’autre suspect n’aurait plus de place.'}
   else{title='Témoignage n°'+visibleNumbers[ctx.clue];text='« '+clues[ctx.clue].text+' »';if(ctx.type==='pair')text+=' '+puzzle.names[ctx.other]+' a encore les possibilités suivantes : '+list(ctx.otherDomain)+'. En croisant ce témoignage avec ces possibilités et les lignes / colonnes distinctes, on élimine les cases sans correspondance pour '+name+'.';else text+=' On conserve uniquement les cases possibles pour '+name+' qui respectent ce témoignage.'}
   return {...step,title,text,subject:name,removedText:list(step.removed),remainingText:list(step.after)};
  });
  return {steps,solved:proof.solved,domains:proof.domains};
 }
 return {generate,solutions,key,parse,room,pmDistance,lineOfSight,deduce,walkthrough};




})();
if(typeof module!=='undefined')module.exports=EnqueteEngine;
