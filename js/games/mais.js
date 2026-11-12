(()=>{'use strict';
const {SPEED,distance,moveTowards,clampPoint}=MaisEngine;
const arena=document.getElementById('arena'),playerEl=document.getElementById('player'),enemyEl=document.getElementById('enemy'),cornEl=document.getElementById('corn'),status=document.getElementById('status');
const scoreEls={player:document.getElementById('playerScore'),enemy:document.getElementById('enemyScore')};
let player,enemy,target,corn,enemyReadyAt,spawnAt,scores,lastFrame,frameId,round=0;
const size=()=>({w:arena.clientWidth,h:arena.clientHeight});
const position=(el,p)=>{el.style.left=p.x+'px';el.style.top=p.y+'px'};
function randomPoint(){const {w,h}=size();return {x:30+Math.random()*Math.max(0,w-60),y:30+Math.random()*Math.max(0,h-60)}}
function spawn(now){corn=randomPoint();position(cornEl,corn);cornEl.hidden=false;enemyReadyAt=now+250;status.textContent='🌽 Un maïs a poussé !';}
function reset(){cancelAnimationFrame(frameId);const {w,h}=size();player={x:w*.22,y:h*.5};enemy={x:w*.78,y:h*.5};target={...player};corn=null;enemyReadyAt=Infinity;spawnAt=performance.now()+750;scores={player:0,enemy:0};round++;scoreEls.player.textContent='0';scoreEls.enemy.textContent='0';cornEl.hidden=true;status.textContent='Le prochain maïs arrive…';position(playerEl,player);position(enemyEl,enemy);lastFrame=performance.now();frameId=requestAnimationFrame(tick)}
function collect(who,now){scores[who]++;scoreEls[who].textContent=scores[who];status.textContent=who==='player'?'🌽 Tu as ramassé le maïs !':'🤖 Le rival a ramassé le maïs !';corn=null;cornEl.hidden=true;enemyReadyAt=Infinity;spawnAt=now+650+Math.random()*950;}
function tick(now){const dt=Math.min((now-lastFrame)/1000,.05);lastFrame=now;const step=SPEED*dt;
if(!corn&&now>=spawnAt)spawn(now);
player=moveTowards(player,target,step);
if(corn&&now>=enemyReadyAt)enemy=moveTowards(enemy,corn,step); // le rival attend 250 ms avant de partir
position(playerEl,player);position(enemyEl,enemy);
if(corn){const pHit=distance(player,corn)<=22,eHit=distance(enemy,corn)<=22;if(pHit||eHit){const winner=pHit&&eHit?(distance(player,corn)<=distance(enemy,corn)?'player':'enemy'):pHit?'player':'enemy';collect(winner,now)}}
frameId=requestAnimationFrame(tick)}
arena.addEventListener('pointerdown',event=>{if(event.button!==0&&event.pointerType==='mouse')return;const rect=arena.getBoundingClientRect();const {w,h}=size();const point=clampPoint({x:event.clientX-rect.left,y:event.clientY-rect.top},w,h);target=point;});
document.getElementById('restart').addEventListener('click',reset);
window.addEventListener('resize',()=>{const {w,h}=size();player=clampPoint(player,w,h);enemy=clampPoint(enemy,w,h);target=clampPoint(target,w,h);if(corn){corn=clampPoint(corn,w,h);position(cornEl,corn)}});
reset();
})();
