/* Persistent identities and live enclosure state, shared by every site page. */
const BreedingStore=(()=>{
 const KEY='lafoire-elevage-v1',keys=['down','up','endurance','maturity','love'];let seq=0;
 const id=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'mount-'+Date.now().toString(36)+'-'+(++seq)+'-'+Math.random().toString(36).slice(2);
 const initial=()=>({level:1,selected:0,goal:'fertility',strategy:'economy',xpStrategy:'economy',xpTargetValue:100,xpTargetUnit:'level',prices:{},reserve:[],planPens:['pen-0'],xpPlanPens:[],planMounts:null,xpPlanMounts:null,session:null,xpSession:null,pens:Array.from({length:6},(_,i)=>({id:'pen-'+i,name:'Enclos '+(i+1),fuel:Object.fromEntries([...keys,'xp'].map(k=>[k,0])),active:[],mounts:[]}))});
 const runKey=mode=>mode==='xp'?'xpSession':'session';
 const running=s=>['session','xpSession'].filter(key=>s[key]&&!s[key].completed).map(key=>({key,run:s[key]}));
 function ownsMount(run,mountId){
  if(!run||run.completed)return false;
  if(!run.plan.pool)return run.plan.initialPens.some(p=>p.mounts.some(m=>m.id===mountId));
  return run.plan.mountIds.includes(mountId)&&!(run.releasedIds||[]).includes(mountId);
 }
 // Un occupant non sélectionné peut encore devoir sortir à la première action.
 // Il est protégé contre les modifications, sans être membre du lot sélectionné.
 function protectsMount(run,mountId){return ownsMount(run,mountId)||!!(run&&!run.completed&&run.plan.pool&&run.index===0&&run.plan.initialPens.some(p=>p.mounts.some(m=>m.id===mountId)))}
 function stopState(s,mode='fertility'){const key=runKey(mode),run=s[key];if(run)for(const p of s.pens)if(run.plan.penIds.includes(p.id))p.active=[];s[key]=null}
 function unlock(s,affected){if(affected.some(({run})=>!run.paused))throw Error('Mets le suivi concerné en pause avant de modifier une monture.');for(const {key} of affected)stopState(s,key==='xpSession'?'xp':'fertility')}
 function read(){let s;try{s=JSON.parse(localStorage.getItem(KEY)||'null')}catch{}if(!s?.pens||s.pens.length!==6)s=initial();let changed=false;
  if(!s.reserve){s.reserve=[];changed=true}if(!s.planPens){s.planPens=[s.pens[s.selected||0].id];changed=true}
  if(s.planMounts===undefined){s.planMounts=null;changed=true}if(s.xpPlanMounts===undefined){s.xpPlanMounts=null;changed=true}
  if(!s.goal){s.goal='fertility';changed=true}if(!s.xpStrategy){s.xpStrategy='economy';changed=true}if(!s.xpPlanPens){s.xpPlanPens=[];changed=true}
  if(s.xpTargetValue===undefined){s.xpTargetValue=100;changed=true}if(!s.xpTargetUnit){s.xpTargetUnit='level';changed=true}
  // Une affectation par enclos ; les suivis déjà lancés conservent leurs enclos.
  const assigned=Object.fromEntries(s.pens.map(p=>[p.id,running(s).find(({run})=>run.plan.penIds.includes(p.id))?.run.plan.mode||(s.xpPlanPens.includes(p.id)?'xp':s.planPens.includes(p.id)?'fertility':'none')]));
  for(const [key,mode] of [['planPens','fertility'],['xpPlanPens','xp']]){const ids=s.pens.filter(p=>assigned[p.id]===mode).map(p=>p.id);if(JSON.stringify(s[key])!==JSON.stringify(ids)){s[key]=ids;changed=true}}
  const seen=new Set();for(const p of [...s.pens,{mounts:s.reserve}]){if(p.fuel&&p.fuel.xp===undefined){p.fuel.xp=0;changed=true}if(p.fuel&&!p.active){p.active=[];changed=true}for(const m of p.mounts){if(!m.id||seen.has(m.id)){m.id=id();changed=true}seen.add(m.id);if(!m.species){m.species='dragodinde';changed=true}if(m.xp===undefined){m.xp=0;changed=true}if(m.targetLevel===undefined){m.targetLevel=100;changed=true}}}
  if(changed)localStorage.setItem(KEY,JSON.stringify(s));return s;
 }
 function write(s){localStorage.setItem(KEY,JSON.stringify(s));if(typeof window!=='undefined'&&typeof CustomEvent==='function')window.dispatchEvent(new CustomEvent('breeding:state'));return s}
 const all=s=>[...s.reserve,...s.pens.flatMap(p=>p.mounts)];
 function locate(s,mountId){if(s.reserve.some(m=>m.id===mountId))return s.reserve;return s.pens.find(p=>p.mounts.some(m=>m.id===mountId))?.mounts}
 function transfer(s,mountId,target){const source=locate(s,mountId),destination=target==='reserve'?s.reserve:s.pens.find(p=>p.id===target)?.mounts;if(!source||!destination)throw Error('Monture ou destination introuvable.');if(source===destination)return;if(target!=='reserve'&&destination.length>=10)throw Error('Cet enclos contient déjà 10 montures.');const index=source.findIndex(m=>m.id===mountId);destination.push(source.splice(index,1)[0])}
 function tick(pen){if(typeof Breeding!=='undefined'&&Breeding.tickPen){Breeding.tickPen(pen);return}const snapshot=pen.mounts.map(m=>({m,s:m.serenity}));for(const k of pen.active||[]){const eligible=snapshot.filter(({m,s})=>k==='xp'?m.xp<Breeding.xpForLevel(200):k==='up'||k==='down'||(m[k]<20000&&(k==='endurance'?s<0:k==='love'?s>=0:Math.abs(s)<=2000)));if(!eligible.length)continue;const q=pen.fuel[k],gain=Math.min(q,q>180000?40:q>140000?30:q>80000?20:q>0?10:0);pen.fuel[k]-=gain;for(const {m} of eligible){if(k==='up'||k==='down')m.serenity=Math.max(-5000,Math.min(5000,m.serenity+gain*(k==='up'?1:-1)));else if(k==='xp')m.xp=Math.min(Breeding.xpForLevel(200),m.xp+gain*(m.trait==='sage'?2:1));else m[k]=Math.min(20000,m[k]+gain*((k==='love'&&m.trait==='amoureuse')||(k==='endurance'&&m.trait==='endurante')?2:1))}}}
 function advanceState(s,now){let changed=false;for(const {run} of running(s)){if(run.paused||run.waiting)continue;const next=run.plan.events[run.index];if(!next)continue;const elapsed=Math.min(next.at,run.elapsed+Math.max(0,now-run.lastAt)/1000),ticks=Math.floor(elapsed/10)-Math.floor(run.elapsed/10);for(let i=0;i<ticks;i++)for(const p of s.pens)if(run.plan.penIds.includes(p.id))tick(p);run.elapsed=elapsed;run.lastAt=now;if(elapsed>=next.at)run.waiting=true;changed=true}return changed}
 function advance(now=Date.now()){const s=read();if(advanceState(s,now))return write(s);return s}
 function edit(fn,now=Date.now()){const s=read();advanceState(s,now);fn(s);return write(s)}
 function moveMany(mountIds,target){return edit(s=>{const ids=[...new Set(mountIds)],destination=target==='reserve'?s.reserve:s.pens.find(p=>p.id===target)?.mounts;if(!ids.length||!destination)throw Error('Monture ou destination introuvable.');for(const id of ids)if(!locate(s,id))throw Error('Une monture à déplacer est introuvable.');const incoming=ids.filter(id=>!destination.some(m=>m.id===id));if(target!=='reserve'&&destination.length+incoming.length>10)throw Error('Cet enclos ne peut pas dépasser 10 montures.');if(!incoming.length)return;unlock(s,running(s).filter(({run})=>run.plan.penIds.includes(target)||incoming.some(id=>protectsMount(run,id))));for(const id of incoming)transfer(s,id,target)})}
 function move(mountId,target){return moveMany([mountId],target)}
 function create(target='reserve'){return edit(s=>{const destination=target==='reserve'?s.reserve:s.pens.find(p=>p.id===target)?.mounts;if(!destination)throw Error('Destination inconnue.');if(target!=='reserve'&&destination.length>=10)throw Error('Enclos plein.');if(running(s).some(({run})=>run.plan.penIds.includes(target)))throw Error('Arrête le suivi de cet enclos avant d’ajouter une monture.');destination.push({id:id(),species:'dragodinde',name:'Monture '+(all(s).length+1),serenity:0,endurance:0,maturity:0,love:0,trait:'none',xp:0,targetLevel:100})})}
 function createMany(mounts,target='reserve'){return edit(s=>{
  if(!Array.isArray(mounts)||!mounts.length)throw Error('Aucune monture à enregistrer.');
  const index=s.pens.findIndex(p=>p.id===target),destination=target==='reserve'?s.reserve:s.pens[index]?.mounts;
  if(!destination)throw Error('Destination inconnue.');
  if(target!=='reserve'){
   if(s.level<[1,40,80,120,160,200][index])throw Error('Cet enclos n’est pas encore débloqué.');
   if(destination.length+mounts.length>10)throw Error('Pas assez de places dans cet enclos pour toutes les montures.');
   if(running(s).some(({run})=>run.plan.penIds.includes(target)))throw Error('Arrête le suivi de cet enclos avant d’ajouter des montures.');
  }
  const additions=mounts.map((m,i)=>{
   for(const k of ['endurance','maturity','love','serenity'])if(!Number.isInteger(m[k])||m[k]<(k==='serenity'?-5000:0)||m[k]>(k==='serenity'?5000:20000))throw Error('Jauges de monture invalides.');
   if(!Number.isInteger(m.xp??0)||(m.xp??0)<0||(m.xp??0)>867582)throw Error('XP de monture invalide.');
   if(!['none','amoureuse','endurante','sage'].includes(m.trait??'none'))throw Error('Capacité invalide.');
   return {id:id(),species:['dragodinde','muldo','volkorne'].includes(m.species)?m.species:'dragodinde',mountId:m.mountId,name:String(m.name||'Monture '+(all(s).length+i+1)).trim().slice(0,60),serenity:m.serenity,endurance:m.endurance,maturity:m.maturity,love:m.love,trait:m.trait||'none',xp:m.xp||0,targetLevel:100};
  });destination.push(...additions);
 })}
 function assignPen(penId,mode){return edit(s=>{
  if(!['fertility','xp','none'].includes(mode))throw Error('Affectation d’enclos inconnue.');
  const index=s.pens.findIndex(p=>p.id===penId);if(index<0)throw Error('Enclos introuvable.');
  if(mode!=='none'&&s.level<[1,40,80,120,160,200][index])throw Error('Cet enclos est verrouillé.');
  const owner=running(s).find(({run})=>run.plan.penIds.includes(penId));if(owner){if(owner.run.plan.mode===mode)return;throw Error('Cet enclos est réservé : mets le suivi en pause puis modifie sa sélection.');}
  if(mode!=='none'&&running(s).some(({run})=>run.plan.mode===mode))throw Error('Mets ce suivi en pause puis modifie sa sélection avant d’y affecter un enclos.');
  s.planPens=s.planPens.filter(id=>id!==penId);s.xpPlanPens=s.xpPlanPens.filter(id=>id!==penId);if(mode!=='none')s[mode==='xp'?'xpPlanPens':'planPens'].push(penId);
 })}
 function start(plan,now=Date.now()){return edit(s=>{
   const key=runKey(plan.mode),others=running(s).filter(x=>x.key!==key);
   if(s[key]&&!s[key].completed)throw Error('Arrête ce suivi avant d’en lancer un autre du même mode.');
   if(others.some(({run})=>run.plan.penIds.some(id=>plan.penIds.includes(id))))throw Error('Un enclos sélectionné est déjà utilisé par l’autre suivi.');
   const participants=plan.pool?plan.mountIds:plan.initialPens.flatMap(p=>p.mounts.map(m=>m.id));
   for(const {run} of others){const conflicts=participants.filter(id=>ownsMount(run,id));if(conflicts.length)throw Error('Monture(s) sélectionnée(s) déjà réservée(s) par le suivi '+(run.plan.mode==='xp'?'XP':'fécondité')+' : '+conflicts.map(id=>all(s).find(m=>m.id===id)?.name||id).join(', ')+'.');}
   if(plan.pool)for(const p of plan.initialPens)for(const {run} of others){const occupants=p.mounts.filter(m=>ownsMount(run,m.id));if(occupants.length)throw Error(p.name+' contient encore '+occupants.map(m=>m.name).join(', ')+' du suivi '+(run.plan.mode==='xp'?'XP':'fécondité')+'. Confirme leur transfert dans ce suivi puis recalcule le nouveau plan.');}

   if(plan.pool){
    for(const m of plan.initialMounts){const actual=all(s).find(x=>x.id===m.id),location=s.pens.find(p=>p.mounts.some(x=>x.id===m.id))?.id||'reserve';if(!actual||JSON.stringify(actual)!==JSON.stringify(m)||location!==plan.initialLocations[m.id])throw Error('Montures ou emplacements modifiés : recalcule le plan.');if(others.some(({run})=>run.plan.penIds.includes(location)))throw Error(m.name+' se trouve encore dans '+(s.pens.find(p=>p.id===location)?.name||location)+', utilisé par l’autre suivi. Confirme d’abord son retrait vers la réserve puis recalcule le plan.');}
   }
   for(const p of plan.initialPens){const actual=s.pens.find(x=>x.id===p.id),index=s.pens.indexOf(actual);const clean=x=>JSON.stringify({fuel:x.fuel,mounts:x.mounts});if(!actual||clean(actual)!==clean(p))throw Error('Jauges ou montures modifiées : recalcule le plan.');if(s.level<[1,40,80,120,160,200][index])throw Error('Un enclos sélectionné est verrouillé.');}
   s[key]={plan,index:0,elapsed:0,lastAt:now,paused:false,waiting:true,completed:false,releasedIds:[]};for(const p of s.pens)if(plan.penIds.includes(p.id))p.active=[];
  },now)}
 function ack(now=Date.now(),mode='fertility'){return edit(s=>{const run=s[runKey(mode)];if(!run||run.completed||run.paused||!run.waiting)throw Error('Cette action n’est pas encore disponible.');const event=run.plan.events[run.index];
   if(run.plan.pool){
    const removals=new Set(event.entries.flatMap(e=>e.removeIds||[]));
    for(const entry of event.entries){const p=s.pens.find(x=>x.id===entry.penId);if(!p)throw Error('Enclos introuvable.');if(entry.expectedIds&&JSON.stringify(p.mounts.map(m=>m.id).sort())!==JSON.stringify([...entry.expectedIds].sort()))throw Error('Les emplacements ont changé : mets en pause et recalcule le plan.');for(const id of entry.removeIds||[])if(!p.mounts.some(m=>m.id===id))throw Error('Une monture à retirer a changé d’emplacement.');const retained=p.mounts.filter(m=>!removals.has(m.id)),added=(entry.addIds||[]).filter(id=>!retained.some(m=>m.id===id));if(retained.length+added.length>10)throw Error('Cet enclos ne peut pas dépasser 10 montures.');for(const id of added)if(!all(s).some(m=>m.id===id))throw Error('Une monture à ajouter est introuvable.');}
   }
   // Remove first across all pens, then add: identities are transferred, never copied.
   for(const entry of event.entries)for(const mountId of entry.removeIds||[])transfer(s,mountId,'reserve');
   for(const entry of event.entries){const p=s.pens.find(x=>x.id===entry.penId);for(const r of entry.recharges||[])for(const item of r.items)for(let n=0;n<item.qty;n++)p.fuel[r.gauge]=Math.min(item.cap,p.fuel[r.gauge]+item.charge);for(const mountId of entry.addIds||[])transfer(s,mountId,p.id);p.active=[...entry.active]}
   if(run.plan.pool)run.releasedIds=[...new Set([...(run.releasedIds||[]),...(event.completedIds||[])])];
   run.index++;run.lastAt=now;run.waiting=false;if(run.index>=run.plan.events.length){run.completed=true;for(const p of s.pens)if(run.plan.penIds.includes(p.id))p.active=[]}
  },now)}
 function pause(now=Date.now(),mode='fertility'){return edit(s=>{const run=s[runKey(mode)];if(!run||run.completed)return;run.paused=!run.paused;run.lastAt=now},now)}
 function removeMany(mountIds){return edit(s=>{const ids=new Set(mountIds);if(!ids.size)throw Error('Sélectionne au moins une monture.');const removed=[...ids].map(id=>all(s).find(m=>m.id===id));if(removed.some(m=>!m))throw Error('Une monture sélectionnée est introuvable.');unlock(s,running(s).filter(({run})=>[...ids].some(id=>protectsMount(run,id))));s.reserve=s.reserve.filter(m=>!ids.has(m.id));for(const p of s.pens)p.mounts=p.mounts.filter(m=>!ids.has(m.id));delete s.lastDeleted;delete s.lastDeletedBatch;if(removed.length===1)s.lastDeleted=removed[0];else s.lastDeletedBatch=removed})}
 function remove(mountId){return removeMany([mountId])}
 function restore(){return edit(s=>{const removed=s.lastDeletedBatch||(s.lastDeleted?[s.lastDeleted]:[]);const existing=new Set(all(s).map(m=>m.id));for(const m of removed)if(!existing.has(m.id)){s.reserve.push(m);existing.add(m.id)}delete s.lastDeleted;delete s.lastDeletedBatch})}
 return {KEY,keys,read,write,edit,all,ownsMount,protectsMount,tick,advance,move,moveMany,create,createMany,assignPen,start,ack,pause,remove,removeMany,restore,stop:(mode='fertility')=>edit(s=>stopState(s,mode))};
})();
