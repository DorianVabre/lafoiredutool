(()=>{'use strict';
 const E=EnqueteEngine,$=id=>document.getElementById(id),glyphs=['☽','⚔','♠','❀','⌛','➶'],colors=['#334842','#34434b','#3e4835','#4b3e38'],suspectColors=['#d6b9ff','#ffb9a3','#f2d773','#bde88e','#9ed8ff','#ffbadb'];
 let puzzle,placed=Array(6).fill(null),selected=0,history=[],won=false,notes=Array.from({length:6},()=>[]),hintState={signature:'',cursor:0},excluded=new Set(),gesture=null,suppressContext=false;
 let startedAt=null,finishedAt=null,solutionViewed=false;
 const elapsed=()=>startedAt===null?0:Math.max(0,(finishedAt??Date.now())-startedAt);
 function formatTime(ms){const seconds=Math.floor(ms/1000);return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0')}
 function updateTimer(){$('timer').textContent=formatTime(elapsed())}
 $('start').addEventListener('click',()=>{if(startedAt!==null)return;startedAt=Date.now();$('startPanel').hidden=true;$('investigation').hidden=false;updateTimer();save()});
 window.setInterval?.(updateTimer,250);
 const roomAt=(r,c)=>E.room(r,c,puzzle.roomMap);
 function randomSeed(){const n=new Uint32Array(1);crypto.getRandomValues(n);return n[0]}
 function message(s){$('gameStatus').textContent=s}
 function checkedClues(){const flags=Array(puzzle.clues.length).fill(false);$('clues').querySelectorAll('input').forEach(input=>{flags[Number(input.dataset.clue)]=input.checked===true});return flags}
 function save(){try{localStorage.setItem('corbac-case-v1',JSON.stringify({key:puzzle.key,placed,notes,excluded:[...excluded],checks:checkedClues(),startedAt,finishedAt,solutionViewed}))}catch{}}
 function snapshot(){history.push({placed:placed.map(p=>p?{...p}:null),notes:notes.map(a=>a.slice()),excluded:[...excluded]});if(history.length>100)history.shift()}
 function pruneNotes(){notes=notes.map((a,i)=>placed[i]?[]:a.filter(n=>!placed.some(p=>p&&(p.r===Math.floor(n/6)||p.c===n%6))))}
 function paint(){
  $('board').querySelectorAll('button').forEach(b=>{const r=Number(b.dataset.row),c=Number(b.dataset.col),who=placed.findIndex(p=>p?.r===r&&p.c===c),body=puzzle.victim.r===r&&puzzle.victim.c===c,decor=puzzle.decor?.find(p=>p.r===r&&p.c===c),cellNotes=notes.map((a,i)=>a.includes(r*6+c)?i:-1).filter(i=>i>=0);
   b.replaceChildren();const coord=document.createElement('span');coord.className='coord';coord.textContent=String.fromCharCode(65+c)+(r+1);b.append(coord);
   const symbol=document.createElement('span');symbol.className=who>=0?'glyph suspect-token':'glyph';b.classList.toggle('confirmed-suspect',who>=0);b.style.setProperty('--suspect',who>=0?suspectColors[who]:'');symbol.textContent=body?'☠':who>=0?glyphs[who]:['⌑','✧','♧','◇'][roomAt(r,c)];symbol.style.opacity=body||who>=0?'1':'.18';b.append(symbol);
   if(decor){symbol.textContent='';const image=document.createElement('img');image.src='data/enquete/'+decor.icon+'.svg';image.alt='';image.className='decor-icon';symbol.append(image);symbol.style.opacity='1';const label=document.createElement('span');label.className='decor-label';label.textContent=decor.name;b.append(label)}
   if(who<0&&!body&&!decor&&cellNotes.length){symbol.textContent='';const candidates=document.createElement('span');candidates.className='cell-notes';for(const i of cellNotes){const n=document.createElement('span');n.textContent=glyphs[i];n.style.setProperty('--suspect',suspectColors[i]);n.title=puzzle.names[i];candidates.append(n)}b.append(candidates)}
   if(who<0&&!body&&!decor&&excluded.has(r*6+c)){symbol.className='glyph empty-token';symbol.textContent='∅';symbol.style.opacity='1'}
   if(who>=0){const label=document.createElement('span');label.className='initial';label.textContent=puzzle.names[who].split(' ')[0];b.append(label)}
   b.setAttribute('aria-label',coord.textContent+' · '+puzzle.rooms[roomAt(r,c)]+(body?' · corps de Ruel':decor?' · '+decor.name+' · case bloquée':who>=0?' · '+puzzle.names[who]: ' · vide')+(excluded.has(r*6+c)?' · case marquée vide (KO)':'')+(cellNotes.length?' · brouillons : '+cellNotes.map(i=>puzzle.names[i]).join(', '):''));b.title=puzzle.rooms[roomAt(r,c)]+(decor?' · '+decor.name+' · case bloquée':'');b.classList.toggle('has-note',Boolean(notes[selected]?.includes(r*6+c)));b.setAttribute('aria-pressed',String(who===selected));
   b.classList.toggle('marked-empty',excluded.has(r*6+c));
   b.classList.toggle('line-taken',who<0&&placed.some(p=>p&&(p.r===r||p.c===c)));
   b.classList.toggle('conflict',who>=0&&placed.some((p,i)=>i!==who&&p&&(p.r===r||p.c===c)));b.disabled=won||body||Boolean(decor);
  });
  $('suspects').querySelectorAll('button').forEach((b,i)=>{const empty=i===6,active=empty?selected==='ko':i===selected;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));b.title=empty?'Marquer ou retirer une case vide (KO)':puzzle.names[i]+' · '+(placed[i]?'Placé en '+String.fromCharCode(65+placed[i].c)+(placed[i].r+1):'À placer')});
  $('noteHelp').textContent='Clic gauche : placer · clic droit : brouillon.';
  $('hint').disabled=won;$('undo').disabled=!history.length||won;$('reset').disabled=won;$('check').disabled=won;$('accuse').disabled=won;
 }
 function blocked(r,c){return (puzzle.victim.r===r&&puzzle.victim.c===c)||Boolean(puzzle.decor?.some(p=>p.r===r&&p.c===c))}
 function place(r,c,draft=false,options={}){
  if(startedAt===null||won||blocked(r,c))return;const who=placed.findIndex(p=>p?.r===r&&p.c===c),cell=r*6+c;
  const record=options.record||snapshot;
  if(selected==='ko'){
   if(who>=0){message('Retire le suspect de cette case avant de la marquer vide.');return}
   if(options.force==='add'&&excluded.has(cell)||options.force==='remove'&&!excluded.has(cell))return;
   record();if(excluded.has(cell))excluded.delete(cell);else{excluded.add(cell);notes=notes.map(a=>a.filter(n=>n!==cell))}
   $('hintPanel').hidden=true;message('');paint();save();return;
  }
  if(excluded.has(cell)){message('Cette case est marquée vide. Sélectionne ∅ Vide pour retirer le marqueur avant de placer un suspect ou un brouillon.');return}
  if(draft&&who>=0){message('Cette case contient un placement confirmé. Retire-le avec un clic gauche avant d’y noter des brouillons.');return}
  if(draft&&(placed[selected]||placed.some(p=>p&&(p.r===r||p.c===c)))){message('Cette ligne ou colonne est déjà occupée. Retire ou déplace le placement confirmé avant de noter ce brouillon.');return}
  if(draft&&(options.force==='add'&&notes[selected].includes(cell)||options.force==='remove'&&!notes[selected].includes(cell)))return;
  if(!draft&&options.force==='remove'&&who!==selected)return;
  record();
  if(draft){notes[selected]=notes[selected].includes(cell)?notes[selected].filter(n=>n!==cell):notes[selected].concat(cell)}
  else if(who===selected&&options.force!=='place')placed[selected]=null;
  else{if(who>=0)placed[who]=null;placed[selected]={r,c};notes[selected]=[]}
  if(!draft)pruneNotes();
  $('hintPanel').hidden=true;message('');paint();save();
 }
 function finishGesture(){gesture=null}
 function applyGesture(r,c){
  const g=gesture;if(!g||g.tool!==selected)return;const cell=r*6+c;if(g.visited.has(cell))return;g.visited.add(cell);
  if(blocked(r,c)||won)return;
  place(r,c,true,{force:g.force,record:()=>{if(!g.recorded){snapshot();g.recorded=true}}});
 }
 function startGesture(event,r,c){
  finishGesture();if(event.button!==2||won){if(event.button===0)suppressContext=false;return;}event.preventDefault();suppressContext=true;
  const cell=r*6+c,eraser=selected==='ko'?excluded.has(cell):notes[selected].includes(cell);
  gesture={button:2,tool:selected,force:eraser?'remove':'add',visited:new Set(),last:{r,c},recorded:false};applyGesture(r,c);
 }
 function continueGesture(event,r,c){
  const g=gesture;if(!g)return;if(!(event.buttons&2)){finishGesture();return}
  const last=g.last||{r,c},steps=Math.max(Math.abs(r-last.r),Math.abs(c-last.c));
  for(let i=1;i<=steps;i++)applyGesture(Math.round(last.r+(r-last.r)*i/steps),Math.round(last.c+(c-last.c)*i/steps));
  if(!steps)applyGesture(r,c);g.last={r,c};
 }
 document.addEventListener?.('mouseup',finishGesture);window.addEventListener?.('blur',finishGesture);
 $('board').addEventListener('mouseleave',()=>{if(gesture)gesture.last=null});
 $('board').addEventListener('dragstart',event=>event.preventDefault());
 function open(seed,restore,version='E6'){
  finishGesture();startedAt=Number.isFinite(restore?.startedAt)&&restore.startedAt>0?restore.startedAt:null;finishedAt=startedAt!==null&&Number.isFinite(restore?.finishedAt)&&restore.finishedAt>=startedAt?restore.finishedAt:null;solutionViewed=restore?.solutionViewed===true;$('startPanel').hidden=startedAt!==null;$('investigation').hidden=startedAt===null;updateTimer();suppressContext=false;puzzle=E.generate(seed,version);placed=Array(6).fill(null);selected=0;history=[];won=false;excluded=new Set();notes=Array.from({length:6},()=>[]);$('ending').hidden=true;$('hintPanel').hidden=true;$('solutionPanel').hidden=true;$('solution').textContent='Solution';hintState={signature:'',cursor:0};message('');$('shareStatus').textContent='';$('caseKey').value=puzzle.key;$('caseNumber').textContent=puzzle.key.slice(3,10);
  const url=new URL(location.href);url.hash=puzzle.key;historyReplace(url);
  $('board').replaceChildren();for(let r=0;r<6;r++)for(let c=0;c<6;c++){
   const b=document.createElement('button');b.type='button';b.className='cell';b.dataset.row=r;b.dataset.col=c;b.classList.toggle('room-edge-right',c<5&&roomAt(r,c)!==roomAt(r,c+1));b.classList.toggle('room-edge-bottom',r<5&&roomAt(r,c)!==roomAt(r+1,c));b.style.setProperty('--room',colors[roomAt(r,c)]);b.addEventListener('mousedown',event=>startGesture(event,r,c));b.addEventListener('mouseenter',event=>continueGesture(event,r,c));
   b.addEventListener('click',()=>place(r,c));
   b.addEventListener('contextmenu',event=>{event.preventDefault();if(suppressContext){suppressContext=false;return}place(r,c,true)});
   $('board').append(b)
  }
  $('roomLegend').replaceChildren();puzzle.rooms.forEach((name,i)=>{const s=document.createElement('span');s.textContent=name;s.style.setProperty('--room',colors[i]);$('roomLegend').append(s)});
  $('suspects').replaceChildren();$('accused').replaceChildren(new Option('Choisir un suspect…',''));
  puzzle.names.forEach((name,i)=>{const b=document.createElement('button');b.type='button';b.className='suspect';b.style.setProperty('--suspect',suspectColors[i]);const s=document.createElement('span');s.textContent=glyphs[i];b.setAttribute('aria-label',name);b.append(s,document.createTextNode(name.split(' ')[0]));b.addEventListener('click',()=>{finishGesture();selected=i;paint()});$('suspects').append(b);$('accused').append(new Option(name,String(i)))});
  const empty=document.createElement('button');empty.type='button';empty.className='suspect empty-tool';empty.style.setProperty('--suspect','#bfc8bd');empty.setAttribute('aria-label','Marquer une case vide (KO)');const emptySymbol=document.createElement('span');emptySymbol.textContent='∅';empty.append(emptySymbol,document.createTextNode('Vide'));empty.addEventListener('click',()=>{finishGesture();selected='ko';paint()});$('suspects').append(empty);
  $('clues').replaceChildren();puzzle.clues.forEach((clue,i)=>{if(clue.fixed)return;const li=document.createElement('li'),label=document.createElement('label'),input=document.createElement('input'),text=document.createElement('span');input.type='checkbox';input.dataset.clue=String(i);input.checked=restore?.checks?.[i]===true;input.addEventListener('change',save);text.textContent=clue.text;label.append(input,text);li.append(label);$('clues').append(li)});$('clueCount').textContent=puzzle.clues.filter(c=>!c.fixed).length+' pièces';$('caseGuarantee').textContent=puzzle.deduction?'Cette affaire se résout sans supposition : croise les témoignages et fais plusieurs passages sur les cases possibles.':'Affaire d’une édition précédente. Les nouvelles affaires se résolvent sans supposition.';
  if(Array.isArray(restore?.placed)&&restore.placed.length===6){const occupied=new Set();placed=restore.placed.map(p=>{if(!p||blocked(p.r,p.c)||!Number.isInteger(p.r)||!Number.isInteger(p.c)||p.r<0||p.r>5||p.c<0||p.c>5||p.r===puzzle.victim.r&&p.c===puzzle.victim.c||occupied.has(p.r+','+p.c))return null;occupied.add(p.r+','+p.c);return {r:p.r,c:p.c}})}
  if(Array.isArray(restore?.notes)&&restore.notes.length===6)notes=restore.notes.map(a=>Array.isArray(a)?[...new Set(a.filter(n=>Number.isInteger(n)&&n>=0&&n<36&&!blocked(Math.floor(n/6),n%6)&&!placed.some(p=>p&&p.r*6+p.c===n)))]:[]);
  if(Array.isArray(restore?.excluded))excluded=new Set(restore.excluded.filter(n=>Number.isInteger(n)&&n>=0&&n<36&&!blocked(Math.floor(n/6),n%6)&&!placed.some(p=>p&&p.r*6+p.c===n)));
  notes=notes.map(a=>a.filter(n=>!excluded.has(n)));pruneNotes();if(finishedAt!==null){won=true;showVictory()}paint();save();
 }
 function historyReplace(url){try{window.history.replaceState(null,'',url)}catch{}}
 function complete(){return placed.every(p=>p&&!blocked(p.r,p.c))&&new Set(placed.map(p=>p.r)).size===6&&new Set(placed.map(p=>p.c)).size===6&&puzzle.clues.every(c=>c.test(placed))}
 function paragraph(parent,text){const p=document.createElement('p');p.textContent=text;parent.append(p);return p}
 function showStep(list,step){const li=document.createElement('li'),title=document.createElement('strong');title.textContent=step.title;li.append(title);paragraph(li,step.text);paragraph(li,step.subject+' : cases éliminées → '+step.removedText+'.');paragraph(li,'Possibilités restantes → '+step.remainingText+'.');list.append(li)}
 $('hint').addEventListener('click',()=>{
  finishGesture();if(startedAt===null||won)return;const wrong=placed.map((p,i)=>p&&(p.r!==puzzle.answer[i].r||p.c!==puzzle.answer[i].c)?i:-1).filter(i=>i>=0);
  $('hintPanel').hidden=false;$('hintSteps').replaceChildren();
  if(wrong.length){snapshot();const errors=wrong.map(i=>({suspect:i,cell:placed[i].r*6+placed[i].c})),removed=wrong.map(i=>puzzle.names[i]+' en '+String.fromCharCode(65+placed[i].c)+(placed[i].r+1));wrong.forEach(i=>{placed[i]=null});const proof=E.walkthrough(puzzle,placed),reasons=errors.map(error=>proof.steps.find(s=>s.suspect===error.suspect&&s.removed.includes(error.cell))?.text||'Ce placement est incompatible avec la solution vérifiée de cette affaire.');pruneNotes();hintState={signature:'',cursor:0};$('hintMessage').textContent='Placement'+(wrong.length>1?'s incorrects retirés : ':' incorrect retiré : ')+removed.join(', ')+'. Pourquoi : '+reasons.join(' ')+' Aucun nouvel indice dévoilé. Clique à nouveau sur Indice pour continuer.';message('Tu peux annuler cette correction.');paint();save();return}
  const plan=E.hintPlan(puzzle,{placements:placed,notes,excluded:[...excluded]});
  if(plan.correction){
   const correction=plan.correction;snapshot();
   if(correction.type==='ko')correction.cells.forEach(n=>excluded.delete(n));else notes[correction.suspect]=notes[correction.suspect].filter(n=>!correction.cells.includes(n));
   hintState={signature:'',cursor:0};$('hintMessage').textContent='Marquage corrigé. Aucun nouvel indice dévoilé : clique à nouveau pour continuer.';
   const li=document.createElement('li'),title=document.createElement('strong');title.textContent=correction.title;li.append(title);paragraph(li,correction.text);paragraph(li,(correction.type==='ko'?'KO retiré : ':'Brouillon retiré pour '+correction.subject+' : ')+correction.cells.map(n=>String.fromCharCode(65+n%6)+(Math.floor(n/6)+1)).join(', ')+'.');$('hintSteps').append(li);message('Correction annulable avec Annuler.');paint();save();return;
  }
  const signature=JSON.stringify({placed,notes:notes.map(a=>a.slice().sort((a,b)=>a-b)),excluded:[...excluded].sort((a,b)=>a-b)});if(hintState.signature!==signature)hintState={signature,cursor:0};
  const step=plan.steps[hintState.cursor];
  if(step){hintState.cursor++;$('hintMessage').textContent='Une déduction nouvelle — étape '+hintState.cursor+'.';const li=document.createElement('li'),title=document.createElement('strong');title.textContent=step.title;li.append(title);paragraph(li,step.text);paragraph(li,'Nouvelles possibilités à marquer pour '+step.subject+' → '+step.newPositions.map(n=>String.fromCharCode(65+n%6)+(Math.floor(n/6)+1)).join(', ')+'.');$('hintSteps').append(li)}
  else $('hintMessage').textContent=placed.every(Boolean)?'Tous tes placements sont corrects. Regarde maintenant quel suspect est seul dans la salle du corps.':plan.solved?'Tes marquages couvrent déjà ces déductions. Tu peux confirmer tes brouillons lorsqu’il ne reste qu’une possibilité.':'Aucune nouvelle déduction simple à proposer depuis ces marquages. Tu peux consulter le walkthrough avec Solution.';

 });
 $('solution').addEventListener('click',()=>{
  if(startedAt===null||won)return;
  const panel=$('solutionPanel');panel.hidden=!panel.hidden;$('solution').textContent=panel.hidden?'Solution':'Masquer la solution';if(panel.hidden)return;solutionViewed=true;save();
  const guide=E.walkthrough(puzzle);$('solutionSteps').replaceChildren();$('solutionFinal').replaceChildren();
  const coord=p=>String.fromCharCode(65+p.c)+(p.r+1);
  $('solutionIntro').textContent='Départ : '+(puzzle.decor||[]).map(p=>p.name+' en '+coord(p)).concat('corps en '+coord(puzzle.victim)).join(' ; ')+'. Ces cases sont exclues. Les brouillons et marqueurs KO du joueur ne servent pas de preuves.';
  guide.steps.forEach(step=>showStep($('solutionSteps'),step));
  if(!guide.solved)paragraph($('solutionFinal'),'Cette ancienne édition ne fournit pas un parcours complet par éliminations simples. Les étapes ci-dessus expliquent les déductions obtenues ; voici les positions finales.');
  const positions=document.createElement('ul');puzzle.names.forEach((name,i)=>{const li=document.createElement('li');li.textContent=name+' : '+coord(puzzle.answer[i]);positions.append(li)});$('solutionFinal').append(positions);
  paragraph($('solutionFinal'),'Le corps est en '+coord(puzzle.victim)+', dans « '+puzzle.rooms[puzzle.crimeRoom]+' ». '+puzzle.names[puzzle.killer]+' est le seul suspect dans cette salle : c’est le coupable.');
 });
 $('check').addEventListener('click',()=>{if(startedAt===null||won)return;if(!placed.every(Boolean)){message('Place les six suspects avant de vérifier.');return}message(complete()?'Tous les témoignages concordent. À toi de désigner le coupable.':'Une contradiction subsiste. Vérifie les lignes, les colonnes et les témoignages.')});
 $('accuse').addEventListener('click',()=>{if(startedAt===null||won)return;if(!complete()){message('Reconstitue d’abord toutes les positions : une accusation exige des preuves.');return}if($('accused').value===''){message('Choisis le suspect que tu souhaites accuser.');return}if(Number($('accused').value)!==puzzle.killer){message('Ce suspect n’était pas seul avec Ruel. Observe les limites des salles.');return}won=true;finishedAt=Date.now();updateTimer();paint();save();showVictory()});
 function showVictory(){message('Affaire classée.');const ending=$('ending');ending.hidden=false;const title=document.createElement('h2'),text=document.createElement('p');title.textContent='Le silence valait un Dofus.';text.textContent=puzzle.names[puzzle.killer]+' était la seule personne dans la salle « '+puzzle.rooms[puzzle.crimeRoom]+' » avec Ruel. Le Corbac retrouve le Dofus dans une doublure du manteau du coupable. À Astrub, même les alibis ont un prix.';const result=document.createElement('p');result.className='victory-time';result.textContent=(solutionViewed?'Vous avez réussi.':'Vous avez réussi !')+' Temps : '+formatTime(elapsed())+'.';ending.replaceChildren(title,result,text);ending.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'})}
 $('undo').addEventListener('click',()=>{finishGesture();if(!history.length||won)return;const previous=history.pop();placed=previous.placed;notes=previous.notes;excluded=new Set(previous.excluded);$('hintPanel').hidden=true;message('Dernière action annulée.');paint();save()});
 $('reset').addEventListener('click',()=>{finishGesture();if(won)return;snapshot();placed=Array(6).fill(null);excluded.clear();notes=Array.from({length:6},()=>[]);$('hintPanel').hidden=true;message('Plan, brouillons et marqueurs KO effacés ; les témoignages cochés sont conservés.');paint();save()});
 $('newCase').addEventListener('click',()=>open(randomSeed()));
 $('keyForm').addEventListener('submit',event=>{event.preventDefault();const seed=E.parse($('caseKey').value);if(seed===null){$('shareStatus').textContent='Clé invalide ou version inconnue. Copie la clé complète E1-…, E2-…, E3-…, E4-…, E5-… ou E6-…';return}open(seed,null,$('caseKey').value.trim().slice(0,2).toUpperCase());$('shareStatus').textContent='Affaire ouverte. Cette clé reproduit le même plan et les mêmes témoignages.'});
 $('copyCase').addEventListener('click',async()=>{const key=puzzle.key;try{await navigator.clipboard.writeText(key);$('shareStatus').textContent='Clé copiée. Partage-la : tes amis joueront la même affaire, sans tes placements.'}catch{$('caseKey').value=key;$('caseKey').focus();$('caseKey').select();$('shareStatus').textContent='Utilise Ctrl+C pour copier la clé sélectionnée.'}});
 let saved;try{saved=JSON.parse(localStorage.getItem('corbac-case-v1')||'null')}catch{}
 const shared=E.parse(location.hash.slice(1)),stored=E.parse(saved?.key);const source=shared!==null?location.hash.slice(1):stored!==null?saved.key:null;open(shared??stored??randomSeed(),source?.trim().toUpperCase()===saved?.key?.trim().toUpperCase()?saved:null,source?.trim().slice(0,2).toUpperCase()||'E6');
})();
