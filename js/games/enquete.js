(()=>{'use strict';
 const E=EnqueteEngine,$=id=>document.getElementById(id),glyphs=['☽','⚔','♠','❀','⌛','➶'],colors=['#334842','#34434b','#3e4835','#4b3e38'],suspectColors=['#d6b9ff','#ffb9a3','#f2d773','#bde88e','#9ed8ff','#ffbadb'];
 let puzzle,placed=Array(6).fill(null),selected=0,history=[],won=false,notes=Array.from({length:6},()=>[]),hintState={signature:'',cursor:0};
 const roomAt=(r,c)=>E.room(r,c,puzzle.roomMap);
 function randomSeed(){const n=new Uint32Array(1);crypto.getRandomValues(n);return n[0]}
 function message(s){$('gameStatus').textContent=s}
 function save(){try{localStorage.setItem('corbac-case-v1',JSON.stringify({key:puzzle.key,placed,notes,checks:[...$('clues').querySelectorAll('input')].map(x=>x.checked)}))}catch{}}
 function snapshot(){history.push({placed:placed.map(p=>p?{...p}:null),notes:notes.map(a=>a.slice())});if(history.length>100)history.shift()}
 function pruneNotes(){notes=notes.map((a,i)=>placed[i]?[]:a.filter(n=>!placed.some(p=>p&&(p.r===Math.floor(n/6)||p.c===n%6))))}
 function paint(){
  $('board').querySelectorAll('button').forEach(b=>{const r=Number(b.dataset.row),c=Number(b.dataset.col),who=placed.findIndex(p=>p?.r===r&&p.c===c),body=puzzle.victim.r===r&&puzzle.victim.c===c,decor=puzzle.decor?.find(p=>p.r===r&&p.c===c),cellNotes=notes.map((a,i)=>a.includes(r*6+c)?i:-1).filter(i=>i>=0);
   b.replaceChildren();const coord=document.createElement('span');coord.className='coord';coord.textContent=String.fromCharCode(65+c)+(r+1);b.append(coord);
   const symbol=document.createElement('span');symbol.className=who>=0?'glyph suspect-token':'glyph';b.classList.toggle('confirmed-suspect',who>=0);b.style.setProperty('--suspect',who>=0?suspectColors[who]:'');symbol.textContent=body?'☠':who>=0?glyphs[who]:['⌑','✧','♧','◇'][roomAt(r,c)];symbol.style.opacity=body||who>=0?'1':'.18';b.append(symbol);
   if(decor){symbol.textContent='';const image=document.createElement('img');image.src='data/enquete/'+decor.icon+'.svg';image.alt='';image.className='decor-icon';symbol.append(image);symbol.style.opacity='1';const label=document.createElement('span');label.className='decor-label';label.textContent=decor.name;b.append(label)}
   if(who<0&&!body&&!decor&&cellNotes.length){symbol.textContent='';const candidates=document.createElement('span');candidates.className='cell-notes';for(const i of cellNotes){const n=document.createElement('span');n.textContent=glyphs[i];n.style.setProperty('--suspect',suspectColors[i]);n.title=puzzle.names[i];candidates.append(n)}b.append(candidates)}
   if(who>=0){const label=document.createElement('span');label.className='initial';label.textContent=puzzle.names[who].split(' ')[0];b.append(label)}
   b.setAttribute('aria-label',coord.textContent+' · '+puzzle.rooms[roomAt(r,c)]+(body?' · corps de Ruel':decor?' · '+decor.name+' · case bloquée':who>=0?' · '+puzzle.names[who]: ' · vide')+(cellNotes.length?' · brouillons : '+cellNotes.map(i=>puzzle.names[i]).join(', '):''));b.title=puzzle.rooms[roomAt(r,c)]+(decor?' · '+decor.name+' · case bloquée':'');b.classList.toggle('has-note',notes[selected].includes(r*6+c));b.setAttribute('aria-pressed',String(who===selected));
   b.classList.toggle('line-taken',who<0&&placed.some(p=>p&&(p.r===r||p.c===c)));
   b.classList.toggle('conflict',who>=0&&placed.some((p,i)=>i!==who&&p&&(p.r===r||p.c===c)));b.disabled=won||body||Boolean(decor);
  });
  $('suspects').querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('active',i===selected);b.setAttribute('aria-pressed',String(i===selected));b.title=placed[i]?'Placé en '+String.fromCharCode(65+placed[i].c)+(placed[i].r+1):'À placer'});
  $('noteHelp').textContent='Clic gauche : placer · clic droit : brouillon.';
  $('hint').disabled=won;$('undo').disabled=!history.length||won;$('reset').disabled=won;$('check').disabled=won;$('accuse').disabled=won;
 }
 function blocked(r,c){return (puzzle.victim.r===r&&puzzle.victim.c===c)||Boolean(puzzle.decor?.some(p=>p.r===r&&p.c===c))}
 function place(r,c,draft=false){
  if(won||blocked(r,c))return;const who=placed.findIndex(p=>p?.r===r&&p.c===c),cell=r*6+c;
  if(draft&&who>=0){message('Cette case contient un placement confirmé. Retire-le avec un clic gauche avant d’y noter des brouillons.');return}
  if(draft&&(placed[selected]||placed.some(p=>p&&(p.r===r||p.c===c)))){message('Cette ligne ou colonne est déjà occupée. Retire ou déplace le placement confirmé avant de noter ce brouillon.');return}
  snapshot();
  if(draft){notes[selected]=notes[selected].includes(cell)?notes[selected].filter(n=>n!==cell):notes[selected].concat(cell)}
  else if(who===selected)placed[selected]=null;
  else{if(who>=0)placed[who]=null;placed[selected]={r,c};notes[selected]=[]}
  if(!draft)pruneNotes();
  $('hintPanel').hidden=true;message('');paint();save();
 }
 function open(seed,restore,version='E5'){
  puzzle=E.generate(seed,version);placed=Array(6).fill(null);selected=0;history=[];won=false;notes=Array.from({length:6},()=>[]);$('ending').hidden=true;$('hintPanel').hidden=true;$('solutionPanel').hidden=true;$('solution').textContent='Solution';hintState={signature:'',cursor:0};message('');$('shareStatus').textContent='';$('caseKey').value=puzzle.key;$('caseNumber').textContent=puzzle.key.slice(3,10);
  const url=new URL(location.href);url.hash=puzzle.key;historyReplace(url);
  $('board').replaceChildren();for(let r=0;r<6;r++)for(let c=0;c<6;c++){
   const b=document.createElement('button');b.type='button';b.className='cell';b.dataset.row=r;b.dataset.col=c;b.classList.toggle('room-edge-right',c<5&&roomAt(r,c)!==roomAt(r,c+1));b.classList.toggle('room-edge-bottom',r<5&&roomAt(r,c)!==roomAt(r+1,c));b.style.setProperty('--room',colors[roomAt(r,c)]);b.addEventListener('click',()=>place(r,c));
   b.addEventListener('contextmenu',event=>{event.preventDefault();place(r,c,true)});
   $('board').append(b)
  }
  $('roomLegend').replaceChildren();puzzle.rooms.forEach((name,i)=>{const s=document.createElement('span');s.textContent=name;s.style.setProperty('--room',colors[i]);$('roomLegend').append(s)});
  $('suspects').replaceChildren();$('accused').replaceChildren(new Option('Choisir un suspect…',''));
  puzzle.names.forEach((name,i)=>{const b=document.createElement('button');b.type='button';b.className='suspect';b.style.setProperty('--suspect',suspectColors[i]);const s=document.createElement('span');s.textContent=glyphs[i];b.append(s,document.createTextNode(name));b.addEventListener('click',()=>{selected=i;paint()});$('suspects').append(b);$('accused').append(new Option(name,String(i)))});
  $('clues').replaceChildren();puzzle.clues.forEach((clue,i)=>{const li=document.createElement('li'),label=document.createElement('label'),input=document.createElement('input'),text=document.createElement('span');input.type='checkbox';input.checked=restore?.checks?.[i]===true;input.addEventListener('change',save);text.textContent=clue.text;label.append(input,text);li.append(label);$('clues').append(li)});$('clueCount').textContent=puzzle.clues.length+' pièces';$('caseGuarantee').textContent=puzzle.deduction?'Cette affaire se résout sans supposition : croise les témoignages et fais plusieurs passages sur les cases possibles.':'Affaire d’une édition précédente. Les nouvelles affaires se résolvent sans supposition.';
  if(Array.isArray(restore?.placed)&&restore.placed.length===6){const occupied=new Set();placed=restore.placed.map(p=>{if(!p||blocked(p.r,p.c)||!Number.isInteger(p.r)||!Number.isInteger(p.c)||p.r<0||p.r>5||p.c<0||p.c>5||p.r===puzzle.victim.r&&p.c===puzzle.victim.c||occupied.has(p.r+','+p.c))return null;occupied.add(p.r+','+p.c);return {r:p.r,c:p.c}})}
  if(Array.isArray(restore?.notes)&&restore.notes.length===6)notes=restore.notes.map(a=>Array.isArray(a)?[...new Set(a.filter(n=>Number.isInteger(n)&&n>=0&&n<36&&!blocked(Math.floor(n/6),n%6)&&!placed.some(p=>p&&p.r*6+p.c===n)))]:[]);
  pruneNotes();paint();save();
 }
 function historyReplace(url){try{window.history.replaceState(null,'',url)}catch{}}
 function complete(){return placed.every(p=>p&&!blocked(p.r,p.c))&&new Set(placed.map(p=>p.r)).size===6&&new Set(placed.map(p=>p.c)).size===6&&puzzle.clues.every(c=>c.test(placed))}
 function paragraph(parent,text){const p=document.createElement('p');p.textContent=text;parent.append(p);return p}
 function showStep(list,step){const li=document.createElement('li'),title=document.createElement('strong');title.textContent=step.title;li.append(title);paragraph(li,step.text);paragraph(li,step.subject+' : cases éliminées → '+step.removedText+'.');paragraph(li,'Possibilités restantes → '+step.remainingText+'.');list.append(li)}
 $('hint').addEventListener('click',()=>{
  if(won)return;const wrong=placed.map((p,i)=>p&&(p.r!==puzzle.answer[i].r||p.c!==puzzle.answer[i].c)?i:-1).filter(i=>i>=0);
  $('hintPanel').hidden=false;$('hintSteps').replaceChildren();
  if(wrong.length){snapshot();const removed=wrong.map(i=>puzzle.names[i]+' en '+String.fromCharCode(65+placed[i].c)+(placed[i].r+1));wrong.forEach(i=>{placed[i]=null});pruneNotes();hintState={signature:'',cursor:0};$('hintMessage').textContent='Placement'+(wrong.length>1?'s incorrects retirés : ':' incorrect retiré : ')+removed.join(', ')+'. Aucun nouvel indice dévoilé. Clique à nouveau sur Indice pour continuer.';message('Tu peux annuler cette correction.');paint();save();return}
  const signature=JSON.stringify(placed);if(hintState.signature!==signature)hintState={signature,cursor:0};
  const guide=E.walkthrough(puzzle,placed),step=guide.steps[hintState.cursor];
  if(step){hintState.cursor++;$('hintMessage').textContent='Une déduction à la fois — étape '+hintState.cursor+'.';showStep($('hintSteps'),step)}
  else $('hintMessage').textContent=placed.every(Boolean)?'Tous tes placements sont corrects. Regarde maintenant quel suspect est seul dans la salle du corps.':guide.solved?'Les déductions ont toutes été présentées. Place les suspects à partir des possibilités restantes ; tu peux revoir le parcours avec Solution.':'Cette ancienne affaire demande des déductions supplémentaires que cette aide ne sait pas expliquer. Le bouton Solution affiche aussi les positions finales.';
 });
 $('solution').addEventListener('click',()=>{
  const panel=$('solutionPanel');panel.hidden=!panel.hidden;$('solution').textContent=panel.hidden?'Solution':'Masquer la solution';if(panel.hidden)return;
  const guide=E.walkthrough(puzzle);$('solutionSteps').replaceChildren();$('solutionFinal').replaceChildren();
  const coord=p=>String.fromCharCode(65+p.c)+(p.r+1);
  $('solutionIntro').textContent='Départ : '+(puzzle.decor||[]).map(p=>p.name+' en '+coord(p)).concat('corps en '+coord(puzzle.victim)).join(' ; ')+'. Ces cases sont exclues. Les brouillons du joueur ne servent pas de preuves.';
  guide.steps.forEach(step=>showStep($('solutionSteps'),step));
  if(!guide.solved)paragraph($('solutionFinal'),'Cette ancienne édition ne fournit pas un parcours complet par éliminations simples. Les étapes ci-dessus expliquent les déductions obtenues ; voici les positions finales.');
  const positions=document.createElement('ul');puzzle.names.forEach((name,i)=>{const li=document.createElement('li');li.textContent=name+' : '+coord(puzzle.answer[i]);positions.append(li)});$('solutionFinal').append(positions);
  paragraph($('solutionFinal'),'Le corps est en '+coord(puzzle.victim)+', dans « '+puzzle.rooms[puzzle.crimeRoom]+' ». '+puzzle.names[puzzle.killer]+' est le seul suspect dans cette salle : c’est le coupable.');
 });
 $('check').addEventListener('click',()=>{if(!placed.every(Boolean)){message('Place les six suspects avant de vérifier.');return}message(complete()?'Tous les témoignages concordent. À toi de désigner le coupable.':'Une contradiction subsiste. Vérifie les lignes, les colonnes et les témoignages. Aucun suspect ne sera déplacé.')});
 $('accuse').addEventListener('click',()=>{if(!complete()){message('Reconstitue d’abord toutes les positions : une accusation exige des preuves.');return}if($('accused').value===''){message('Choisis le suspect que tu souhaites accuser.');return}if(Number($('accused').value)!==puzzle.killer){message('Ce suspect n’était pas seul avec Ruel. Observe les limites des salles.');return}won=true;paint();message('Affaire classée.');const ending=$('ending');ending.hidden=false;const title=document.createElement('h2'),text=document.createElement('p');title.textContent='Le silence valait un Dofus.';text.textContent=puzzle.names[puzzle.killer]+' était la seule personne dans la salle « '+puzzle.rooms[puzzle.crimeRoom]+' » avec Ruel. Le Corbac retrouve le Dofus dans une doublure du manteau du coupable. À Astrub, même les alibis ont un prix.';ending.replaceChildren(title,text);ending.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'})});
 $('undo').addEventListener('click',()=>{if(!history.length||won)return;const previous=history.pop();placed=previous.placed;notes=previous.notes;$('hintPanel').hidden=true;message('Dernière action annulée.');paint();save()});
 $('reset').addEventListener('click',()=>{if(won)return;snapshot();placed=Array(6).fill(null);notes=Array.from({length:6},()=>[]);$('hintPanel').hidden=true;message('Plan et brouillons effacés ; les témoignages cochés sont conservés.');paint();save()});
 $('newCase').addEventListener('click',()=>open(randomSeed()));
 $('keyForm').addEventListener('submit',event=>{event.preventDefault();const seed=E.parse($('caseKey').value);if(seed===null){$('shareStatus').textContent='Clé invalide ou version inconnue. Copie la clé complète E1-…, E2-…, E3-…, E4-… ou E5-…';return}open(seed,null,$('caseKey').value.trim().slice(0,2).toUpperCase());$('shareStatus').textContent='Affaire ouverte. Cette clé reproduit le même plan et les mêmes témoignages.'});
 $('copyCase').addEventListener('click',async()=>{const key=puzzle.key;try{await navigator.clipboard.writeText(key);$('shareStatus').textContent='Clé copiée. Partage-la : tes amis joueront la même affaire, sans tes placements.'}catch{$('caseKey').value=key;$('caseKey').focus();$('caseKey').select();$('shareStatus').textContent='Utilise Ctrl+C pour copier la clé sélectionnée.'}});
 let saved;try{saved=JSON.parse(localStorage.getItem('corbac-case-v1')||'null')}catch{}
 const shared=E.parse(location.hash.slice(1)),stored=E.parse(saved?.key);const source=shared!==null?location.hash.slice(1):stored!==null?saved.key:null;open(shared??stored??randomSeed(),source?.trim().toUpperCase()===saved?.key?.trim().toUpperCase()?saved:null,source?.trim().slice(0,2).toUpperCase()||'E5');
})();
