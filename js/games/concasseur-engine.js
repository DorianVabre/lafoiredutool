/* Règles du jeu et horloge absolue, indépendantes du rendu. */
(function(root){'use strict';
 const DURATION=60000,WINDOW=140,MIN_COEFF=20,MAX_COEFF=220;
 const ITEMS=[{id:'strigide',name:'Amulette du Strigide',level:200},{id:'comte',name:'Bottes du Comte Harebourg',level:200},{id:'frizz',name:'Casque de Missiz Frizz',level:196},{id:'granduk',name:'Épée du Granduk',level:200},{id:'ceinture',name:'Ceinture du Strigide',level:200}],CAT={id:'chacha',name:'Chacha'};
 const image=id=>'data/concasseur/'+id+'.png';
 function chart(random=Math.random){
  const notes=[],last=Array(5).fill(-Infinity);let seq=0;
  function spawn(at,lane){last[lane]=at;const cat=random()<.23,item=cat?CAT:ITEMS[lane];notes.push({id:++seq,lane,item:item.id,cat,at,travel:1900-400*at/DURATION,done:false})}
  for(let at=2400;at<=DURATION-1200;at+=200){
   const p=at/DURATION;if(random()>.70+.27*p)continue;
   const lanes=[0,1,2,3,4].filter(lane=>at-last[lane]>=400),count=1+(random()<.14+.18*p?1:0)+(p>.6&&random()<.08?1:0);
   for(let i=0;i<count&&lanes.length;i++){const index=Math.floor(random()*lanes.length);spawn(at,lanes.splice(index,1)[0])}
  }
  return notes.sort((a,b)=>a.at-b.at||a.lane-b.lane);
 }
 function create(random=Math.random){return {notes:chart(random),coefficients:Object.fromEntries(ITEMS.map(i=>[i.id,100])),elapsed:0,phase:'playing',score:0,combo:0,maxCombo:0,hits:0,perfects:0,cats:0,misses:0,avoided:0,empty:0}}
 function coefficientHit(state,id){for(const item of ITEMS)state.coefficients[item.id]=Math.min(MAX_COEFF,Math.max(MIN_COEFF,state.coefficients[item.id]+(item.id===id?-24:7)))}
 function advance(state,time){
  if(state.phase!=='playing')return [];
  state.elapsed=Math.max(state.elapsed,Math.min(DURATION,time));const events=[];
  for(const note of state.notes)if(!note.done&&state.elapsed>note.at+WINDOW){
   note.done=true;
   if(note.cat){state.avoided++;events.push({kind:'avoided',lane:note.lane,note})}
   else{state.misses++;state.combo=0;state.score=Math.max(0,state.score-60);events.push({kind:'miss',lane:note.lane,note,points:-60})}
  }
  if(state.elapsed>=DURATION)state.phase='finished';return events;
 }
 function hit(state,lane,inputTime=state.elapsed){
  if(state.phase!=='playing'||!Number.isInteger(lane)||lane<0||lane>4)return null;
  const judgedAt=Math.max(0,Math.min(state.elapsed,Number.isFinite(inputTime)?inputTime:state.elapsed));
  const note=state.notes.filter(n=>!n.done&&n.lane===lane&&Math.abs(n.at-judgedAt)<=WINDOW).sort((a,b)=>Math.abs(a.at-judgedAt)-Math.abs(b.at-judgedAt)||a.at-b.at)[0];
  if(!note){state.empty++;state.combo=0;state.score=Math.max(0,state.score-25);return {kind:'empty',lane,points:-25}}
  note.done=true;
  if(note.cat){state.cats++;state.combo=0;state.score=Math.max(0,state.score-250);return {kind:'cat',lane,note,points:-250}}
  const error=Math.abs(judgedAt-note.at),quality=error<=45?'perfect':error<=95?'good':'late',factor=quality==='perfect'?1.25:quality==='good'?1:.75,coefficient=state.coefficients[note.item];
  state.combo++;state.maxCombo=Math.max(state.maxCombo,state.combo);state.hits++;if(quality==='perfect')state.perfects++;
  const multiplier=Math.min(3,1+Math.floor(state.combo/10)*.25),points=Math.round(coefficient*factor*multiplier);
  state.score+=points;coefficientHit(state,note.item);return {kind:quality,lane,note,points,coefficient,multiplier};
 }
 function accuracy(state){const total=state.hits+state.misses+state.cats+state.empty;return total?Math.round(state.hits/total*100):0}
 const api={DURATION,WINDOW,MIN_COEFF,MAX_COEFF,ITEMS,CAT,image,chart,create,advance,hit,accuracy};
 if(typeof module==='object'&&module.exports)module.exports=api;root.ConcasseurEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
