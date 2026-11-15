(()=>{'use strict';
 const E=ConcasseurEngine,$=id=>document.getElementById(id),board=$('gameBoard'),lanes=[...board.querySelectorAll('.lane')],rendered=new Map(),flashes=Array(5).fill(0),KEY='la-foire-du-tool-concasseur-best-v1';
 let game=null,mode='ready',origin=0,pausedAt=0,frame=0,best=0,hitY=0,lastBeat=-1,muted=false,audio=null,master=null,inside=false;
 try{const value=Number(localStorage.getItem(KEY));if(Number.isSafeInteger(value)&&value>=0)best=value}catch{}
 const heldKeys=new Set(),hudValues=new Map();let hammerPending=false;
 const fmt=n=>Math.round(n).toLocaleString('fr-FR');$('gameBest').textContent=best?fmt(best):'—';
 E.ITEMS.forEach((item,index)=>{const label=document.createElement('div');label.title=item.name;label.innerHTML='<img src="'+E.image(item.id)+'" width="26" height="26" alt=""><span>'+item.name+'</span>';$('laneLegend').append(label);lanes[index].setAttribute('aria-label','Frapper '+item.name+', touche '+['D','F','Espace','J','K'][index])});
 for(const item of E.ITEMS){const row=document.createElement('div');row.className='coefficient-item';row.innerHTML='<img src="'+E.image(item.id)+'" alt=""><div><span class="coefficient-name">'+item.name+'</span><small>Niveau '+item.level+'</small><div class="coefficient-meter"><i></i></div></div><strong data-coeff="'+item.id+'">100 %</strong>';$('coefficientList').append(row)}
 const coefficientCells=[...document.querySelectorAll('[data-coeff]')];
 function measure(){const ring=lanes[0].querySelector('.target-ring');hitY=ring.offsetTop+ring.offsetHeight/2}
 function initAudio(){
  try{if(!audio){const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;audio=new Context();master=audio.createGain();master.gain.value=muted?0:.22;master.connect(audio.destination)}void audio.resume().catch(()=>{})}catch{}
 }
 function tone(frequency,end,duration,volume=.3,type='sine',delay=0){
  if(!audio||muted||audio.state!=='running')return;
  const t=audio.currentTime+delay,osc=audio.createOscillator(),gain=audio.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,t);osc.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.008);gain.gain.exponentialRampToValueAtTime(.001,t+duration);osc.connect(gain);gain.connect(master);osc.start(t);osc.stop(t+duration+.02);
 }
 function meow(){
  if(!audio||muted||audio.state!=='running')return;
  const t=audio.currentTime,voice=audio.createOscillator(),filter=audio.createBiquadFilter(),gain=audio.createGain();
  voice.type='sawtooth';voice.frequency.setValueAtTime(520,t);voice.frequency.exponentialRampToValueAtTime(940,t+.10);voice.frequency.exponentialRampToValueAtTime(650,t+.28);voice.frequency.exponentialRampToValueAtTime(330,t+.57);
  filter.type='bandpass';filter.Q.value=2.5;filter.frequency.setValueAtTime(1700,t);filter.frequency.linearRampToValueAtTime(900,t+.55);
  gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(.6,t+.04);gain.gain.setValueAtTime(.45,t+.25);gain.gain.exponentialRampToValueAtTime(.001,t+.6);
  voice.connect(filter);filter.connect(gain);gain.connect(master);voice.start(t);voice.stop(t+.62);tone(490,290,.5,.12,'sine',.07);
 }
 function hudText(id,value){if(hudValues.get(id)===value)return;hudValues.set(id,value);$(id).textContent=value}
 function hud(){
  if(!game)return;
  hudText('gameScore',fmt(game.score));
  if(hudValues.get('combo')!==game.combo){hudValues.set('combo',game.combo);$('gameCombo').innerHTML=game.combo+' <span>×'+Math.min(3,1+Math.floor(game.combo/10)*.25).toLocaleString('fr-FR')+'</span>'}
  hudText('gameTime',Math.max(0,Math.ceil((E.DURATION-game.elapsed)/1000))+' s');
  hudText('paceLabel',game.elapsed<20000?'Ça descend…':game.elapsed<40000?'La cadence monte':'Surchauffe du concasseur');
  for(const cell of coefficientCells){const value=game.coefficients[cell.dataset.coeff],key='coefficient:'+cell.dataset.coeff;if(hudValues.get(key)===value)continue;hudValues.set(key,value);cell.textContent=value+' %';cell.classList.toggle('is-low',value<70);cell.classList.toggle('is-high',value>120);cell.parentElement.querySelector('i').style.width=value/E.MAX_COEFF*100+'%'}
 }
 function animateHammer(){
  if(!hammerPending)return;hammerPending=false;
  if(inside&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)$('hammerCursor').animate?.([{transform:'translate(-50%,-50%) rotate(-20deg)'},{transform:'translate(-50%,-50%) rotate(-65deg)'},{transform:'translate(-50%,-50%) rotate(-20deg)'}],{duration:140});
 }
 function feedback(event,now){
  if(event.kind==='avoided')return;
  const lane=lanes[event.lane],good=['perfect','good','late'].includes(event.kind);flashes[event.lane]=now+270;lane.classList.toggle('is-good',good);lane.classList.toggle('is-bad',!good);
  const labels={perfect:'PARFAIT',good:'BIEN',late:'DE JUSTESSE',cat:'MIAOU !',miss:'RATÉ',empty:'À VIDE'};
  lane.querySelector('.lane-feedback').textContent=labels[event.kind]+(event.points?' '+(event.points>0?'+':'−')+Math.abs(event.points):'');
  if(event.kind==='cat'){meow();$('gameStatus').textContent='Miaou ! Un Chacha touché : −250 points, série cassée.'}
  else if(good){tone(230,90,.10,.35,'triangle');tone(1200,370,.055,.08,'square');$('gameStatus').textContent=labels[event.kind]+' · '+event.coefficient+' % · +'+event.points+' points'}
  else if(event.kind==='empty')tone(90,45,.06,.15,'triangle');
 }
 function draw(now){
  if(!game)return;
  for(const [id,node] of rendered)if(node.note.done){node.el.remove();rendered.delete(id)}
  for(const note of game.notes){
   if(note.done||game.elapsed<note.at-note.travel||game.elapsed>note.at+E.WINDOW)continue;
   let view=rendered.get(note.id);
   if(!view){const el=document.createElement('span');el.className='falling-item'+(note.cat?' is-cat':'');el.setAttribute('aria-hidden','true');el.dataset.note=note.id;el.dataset.item=note.item;el.innerHTML='<img src="'+E.image(note.item)+'" alt=""><span class="note-coefficient"></span>';lanes[note.lane].querySelector('.note-layer').append(el);view={el,note};rendered.set(note.id,view)}
   const y=-42+(game.elapsed-note.at+note.travel)/note.travel*(hitY+42);view.el.style.top=y+'px';view.el.querySelector('.note-coefficient').textContent=note.cat?'MIAOU':game.coefficients[note.item]+' %';
  }
  for(let i=0;i<5;i++)if(now>flashes[i])lanes[i].classList.remove('is-good','is-bad');
 }
 function overlay(which){$('gameOverlay').hidden=false;$('introContent').hidden=which!=='intro';$('resultsContent').hidden=which!=='results';$('pauseContent').hidden=which!=='pause';$('startGame').hidden=which==='pause';$('resumeGame').hidden=which!=='pause'}
 function finish(){
  heldKeys.clear();hammerPending=false;mode='finished';board.classList.remove('is-playing');$('hammerCursor').hidden=true;$('pauseGame').disabled=true;overlay('results');$('startGame').textContent='Rejouer';$('finalScore').textContent=fmt(game.score);
  const record=game.score>best;if(record){best=game.score;try{localStorage.setItem(KEY,String(best))}catch{}}$('gameBest').textContent=best?fmt(best):'—';$('resultBadge').textContent=record?'Nouveau record !':'Partie terminée';
  $('resultStats').innerHTML=[[game.hits,'Objets brisés'],[E.accuracy(game)+' %','Précision'],[game.maxCombo,'Meilleure série'],[game.perfects,'Parfaits'],[game.cats,'Chachas touchés'],[game.avoided,'Chachas épargnés']].map(([value,label])=>'<div><strong>'+value+'</strong><small>'+label+'</small></div>').join('');$('gameStatus').textContent='Partie terminée : '+fmt(game.score)+' points.';$('startGame').focus({preventScroll:true});
 }
 function tick(now){
  if(mode!=='playing'&&mode!=='countdown')return;
  if(mode==='countdown'){
   const left=Math.ceil((origin-now)/1000),count=String(Math.max(1,left));if($('countdown').textContent!==count)$('countdown').textContent=count;
   if(left>0){frame=requestAnimationFrame(tick);return}
   mode='playing';$('countdown').hidden=true;$('pauseGame').disabled=false;board.classList.add('is-playing');$('hammerCursor').hidden=!inside;$('gameStatus').textContent='Visez les cercles. Épargnez les Chachas !';
  }
  for(const event of E.advance(game,now-origin))feedback(event,now);
  if(game.phase==='finished'){hud();finish();return}
  const beat=Math.floor(game.elapsed/400);if(beat!==lastBeat){lastBeat=beat;tone(125,40,.10,.16,'sine');if(beat%2)tone(2300,1200,.022,.035,'square')}
  draw(now);hud();animateHammer();frame=requestAnimationFrame(tick);
 }
 function start(){
  cancelAnimationFrame(frame);heldKeys.clear();hudValues.clear();hammerPending=false;initAudio();game=E.create();mode='countdown';origin=performance.now()+3000;lastBeat=-1;rendered.clear();for(const lane of lanes){lane.querySelector('.note-layer').replaceChildren();lane.classList.remove('is-good','is-bad')}
  $('gameOverlay').hidden=true;$('countdown').hidden=false;$('countdown').textContent='3';$('pauseGame').disabled=true;$('pauseGame').textContent='Pause';$('gameStatus').textContent='Préparez votre marteau…';measure();hud();board.focus({preventScroll:true});frame=requestAnimationFrame(tick);
 }
 function pause(){
  heldKeys.clear();hammerPending=false;
  if(mode!=='playing'&&mode!=='countdown')return;
  const wasCountdown=mode==='countdown';mode=wasCountdown?'paused-countdown':'paused';pausedAt=performance.now();cancelAnimationFrame(frame);board.classList.remove('is-playing');$('hammerCursor').hidden=true;$('countdown').hidden=true;overlay('pause');$('pauseGame').disabled=false;$('pauseGame').textContent='Reprendre';$('gameStatus').textContent='Partie en pause.';
 }
 function resume(){
  if(mode!=='paused'&&mode!=='paused-countdown')return;
  heldKeys.clear();origin+=performance.now()-pausedAt;mode=mode==='paused-countdown'?'countdown':'playing';$('countdown').hidden=mode!=='countdown';$('gameOverlay').hidden=true;$('pauseGame').textContent='Pause';$('pauseGame').disabled=mode==='countdown';board.classList.toggle('is-playing',mode==='playing');$('hammerCursor').hidden=mode!=='playing'||!inside;$('gameStatus').textContent=mode==='countdown'?'Préparez votre marteau…':'La cadence reprend !';initAudio();board.focus({preventScroll:true});frame=requestAnimationFrame(tick);
 }
 function strike(lane,timeStamp){
  if(mode!=='playing')return;
  const now=performance.now();let inputAt=Number.isFinite(timeStamp)?timeStamp:now;
  // Accepter aussi les navigateurs qui datent les événements depuis l’époque Unix.
  if(inputAt>now&&Number.isFinite(performance.timeOrigin))inputAt-=performance.timeOrigin;
  if(inputAt<origin||inputAt>now)inputAt=now;
  const elapsed=inputAt-origin;for(const event of E.advance(game,elapsed))feedback(event,now);if(game.phase==='finished'){hud();finish();return}
  const event=E.hit(game,lane,elapsed);if(event)feedback(event,now);
  // Le prochain tick partage un seul rendu/HUD/animation entre toutes les frappes reçues.
  hammerPending=true;
 }
 lanes.forEach((lane,index)=>lane.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();strike(index,event.timeStamp)}));
 board.addEventListener('pointerenter',()=>inside=true);board.addEventListener('pointerleave',()=>{inside=false;$('hammerCursor').hidden=true});board.addEventListener('pointermove',event=>{const cursor=$('hammerCursor');cursor.hidden=mode!=='playing';cursor.style.left=event.clientX+'px';cursor.style.top=event.clientY+'px'});
 function handleGameKey(event){
  if(event.isComposing)return;
  const keys=['KeyD','KeyF','Space','KeyJ','KeyK'],index=keys.indexOf(event.code);
  if(mode==='playing'&&index>=0){event.preventDefault();if(event.repeat||heldKeys.has(event.code))return;heldKeys.add(event.code);strike(index,event.timeStamp);return}
  if(event.repeat)return;
  if(event.code==='KeyP'||event.code==='Escape'){if(['playing','countdown','paused','paused-countdown'].includes(mode)){event.preventDefault();mode.startsWith('paused')?resume():pause()}return}
  if(mode!=='playing')return;
  if(event.code==='Enter'){const lane=event.target.closest?.('[data-lane]');if(lane){event.preventDefault();strike(Number(lane.dataset.lane),event.timeStamp)}}
 }
 function releaseGameKey(event){heldKeys.delete(event.code)}
 document.addEventListener('keydown',handleGameKey);document.addEventListener('keyup',releaseGameKey);
 $('startGame').addEventListener('click',start);$('resumeGame').addEventListener('click',resume);$('pauseGame').addEventListener('click',()=>mode.startsWith('paused')?resume():pause());
 $('soundToggle').addEventListener('click',()=>{muted=!muted;$('soundToggle').setAttribute('aria-pressed',String(!muted));$('soundToggle').textContent=muted?'Son coupé':'Son activé';if(master)master.gain.value=muted?0:.22;if(!muted)initAudio();if(mode==='playing'||mode==='countdown')board.focus({preventScroll:true})});
 window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});window.addEventListener('resize',()=>{measure();if(game)draw(performance.now())});measure();
})();
