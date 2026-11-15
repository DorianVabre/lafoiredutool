/* Élevage 3.7 : simulation de lots, ticks de 10 s, hors Almanax. */
const Breeding = (() => {
 const keys=['down','up','endurance','maturity','love'];
 const labels={down:'Perte de sérénité',up:'Gain de sérénité',endurance:'Endurance',maturity:'Maturité',love:'Amour'};
 const caps=[80000,140000,180000,200000];
 const strategies={economy:{label:'Économie · minimum nécessaire',cap:null},tier1:{label:'Vitesse · palier 1 · 80 000',cap:80000},tier2:{label:'Vitesse · palier 2 · 140 000',cap:140000},tier3:{label:'Vitesse · palier 3 · 180 000',cap:180000},speed:{label:'Vitesse · palier 4 · 200 000',cap:200000}};
 const rate=q=>q>180000?40:q>140000?30:q>80000?20:q>0?10:0;
 const full=m=>['endurance','maturity','love'].every(k=>m[k]>=20000);
 function validate(pen){
  if(!pen.mounts.length||pen.mounts.length>10)throw Error('Ajoute entre 1 et 10 montures.');
  for(const m of pen.mounts){if(!m.name.trim())throw Error('Chaque monture doit avoir un nom.');
   for(const k of ['serenity','endurance','maturity','love'])if(!Number.isInteger(m[k])||m[k]<(k==='serenity'?-5000:0)||m[k]>(k==='serenity'?5000:20000))throw Error('Jauges invalides : sérénité −5 000 à 5 000, autres jauges 0 à 20 000.');
  }
  for(const k of keys)if(!Number.isInteger(pen.fuel[k])||pen.fuel[k]<0||pen.fuel[k]>200000)throw Error('Chaque réserve doit être comprise entre 0 et 200 000.');
 }
 // Exact cheapest path to the requested minimum charge, including quality caps.
 // A final consumable may be partially consumed at its cap, as in the client.
 function purchase(current,target,items,prices){
  if(current>=target)return {cost:0,items:[],end:current};
  const available=items.filter(x=>Number.isFinite(prices[x.id])&&prices[x.id]>=0);
  const costs=new Map([[current,0]]),prev=new Map(),pending=[current];
  // All edges strictly increase charge: sorted dynamic programming, integer units.
  while(pending.length){
   pending.sort((a,b)=>b-a);const q=pending.pop(),cost=costs.get(q);
   for(const item of available){const next=Math.min(q+item.charge,item.cap);if(next<=q||next>target)continue;
    const c=cost+prices[item.id];if(!costs.has(next)){pending.push(next);costs.set(next,Infinity)}
    if(c<costs.get(next)){costs.set(next,c);prev.set(next,{q,item})}
   }
  }
  if(!costs.has(target))throw Error('Prix manquants pour atteindre '+target.toLocaleString('fr-FR')+' de réserve. Renseigne notamment un carburant de la qualité requise.');
  const result=[];let q=target;while(q!==current){const edge=prev.get(q);result.push(edge.item);q=edge.q}
  result.reverse();return {cost:costs.get(target),items:result,end:target};
 }
 function plan(pen,catalog,prices,strategy='economy'){
  if(!Object.prototype.hasOwnProperty.call(strategies,strategy))throw Error('Stratégie inconnue.');
  validate(pen);const mounts=pen.mounts.map(m=>({...m})),fuel={...pen.fuel},events=[],shopping=new Map();let seconds=0,cost=0;
  const emit=(text,extra={})=>events.push({at:seconds,text,...extra});
  const ready=mounts.filter(full);if(ready.length)emit('Retirer les montures déjà fécondes : '+ready.map(m=>m.name).join(', '),{removeIds:ready.map(m=>m.id),removeNames:ready.map(m=>m.name)});
  const todo=mounts.filter(m=>!full(m));
  function phase(title,group,active,done,need){
   if(!group.length)return;
   const loads=[],recharges=[];
   for(const k of active){const demand=Math.ceil(Math.max(...group.map(m=>need(m,k))));if(!demand)continue;
    const target=strategies[strategy].cap??(fuel[k]+Math.max(0,Math.ceil((demand-fuel[k])/2000))*2000);
    const before=fuel[k],buy=purchase(before,target,catalog.filter(x=>x.gauge===k),prices);fuel[k]=buy.end;cost+=buy.cost;
    for(const x of buy.items){shopping.set(x.id,{...x,unitPrice:prices[x.id],qty:(shopping.get(x.id)?.qty||0)+1});}
    if(buy.items.length){const counts=new Map();for(const x of buy.items)counts.set(x.id,{...x,qty:(counts.get(x.id)?.qty||0)+1});const items=[...counts.values()];recharges.push({gauge:k,added:buy.end-before,items});loads.push(labels[k]+' : '+items.map(x=>x.qty+' × '+x.name).join(', '));}
   }
   emit(title+' — placer '+group.map(m=>m.name).join(', ')+'. Activer uniquement : '+active.map(k=>labels[k]).join(' + ')+'.', {loads,recharges,active:[...active],mountIds:group.map(m=>m.id),mountNames:group.map(m=>m.name)});
   let remaining=[...group],ticks=0;
   while(remaining.length){if(++ticks>50000)throw Error('Simulation interrompue : progression impossible.');seconds+=10;
    // Check eligibility at the start of the tick for deterministic simultaneous effects.
    const changes=remaining.map(m=>({m,serenity:m.serenity}));
    for(const k of active){const eligible=changes.filter(({m,serenity:s})=>k==='up'||k==='down'||(m[k]<20000&&(k==='endurance'?s<0:k==='love'?s>=0:Math.abs(s)<=2000)));
     if(!eligible.length)continue;const gain=Math.min(fuel[k],rate(fuel[k]));if(!gain)throw Error('Carburant insuffisant pour '+labels[k]);fuel[k]-=gain;
     for(const {m} of eligible){if(k==='up'||k==='down')m.serenity=Math.max(-5000,Math.min(5000,m.serenity+gain*(k==='up'?1:-1)));else m[k]=Math.min(20000,m[k]+gain*((k==='love'&&m.trait==='amoureuse')||(k==='endurance'&&m.trait==='endurante')?2:1));}
    }
    const finished=remaining.filter(done);if(finished.length){emit('Retirer '+finished.map(m=>m.name).join(', ')+(finished.every(full)?' : fécondes.':' et les garder à l’étable pour la prochaine phase.'),{removeIds:finished.map(m=>m.id),removeNames:finished.map(m=>m.name)});remaining=remaining.filter(m=>!done(m));}
   }
   emit('Désactiver '+active.map(k=>labels[k]).join(' + ')+'.',{active:[]});
  }
  // Normalize to the negative overlap, preserving mounts already in it.
  const preparation=todo.filter(m=>m.endurance<20000||m.maturity<20000);
  phase('Ramener la sérénité dans la zone négative utile',preparation.filter(m=>m.serenity<-2000),['up'],m=>m.serenity>=-2000,(m)=>-2000-m.serenity);
  phase('Ramener la sérénité dans la zone négative utile',preparation.filter(m=>m.serenity>=0&&(m.endurance<20000||m.serenity>2000)),['down'],m=>m.serenity<0,(m)=>m.serenity+1);
  phase('Préparer endurance et maturité',todo.filter(m=>m.endurance<20000||m.maturity<20000),['endurance','maturity'],m=>m.endurance>=20000&&m.maturity>=20000,(m,k)=>(20000-m[k])/(k==='endurance'&&m.trait==='endurante'?2:1));
  phase('Préparer la sérénité pour l’amour',todo.filter(m=>m.love<20000&&m.serenity<0),['up'],m=>m.serenity>=0,m=>-m.serenity);
  phase('Terminer l’amour',todo.filter(m=>m.love<20000),['love'],full,(m)=>(20000-m.love)/(m.trait==='amoureuse'?2:1));
  if(mounts.some(m=>!full(m)))throw Error('Le plan ne permet pas de rendre toutes les montures fécondes.');
  // Inactive gauges do not drain. Move their first load to departure without
  // changing simulated reserves. Merge later loads only if all stay in tier 1
  // and no consumable is clipped; otherwise preserve the optimized refill time.
  const upfront=[];
  for(const k of keys){const entries=events.flatMap(event=>(event.recharges||[]).filter(r=>r.gauge===k));if(!entries.length)continue;
   const added=entries.reduce((n,r)=>n+r.added,0),charge=entries.reduce((n,r)=>n+r.items.reduce((sum,x)=>sum+x.charge*x.qty,0),0);
   const move=strategy==='economy'&&pen.fuel[k]+added<=80000&&added===charge?entries:entries.slice(0,1);
   for(const r of move){upfront.push(r);for(const event of events)if(event.recharges)event.recharges=event.recharges.filter(x=>x!==r)}
  }
  const describe=r=>labels[r.gauge]+' : '+r.items.map(x=>x.qty+' × '+x.name).join(', ');
  for(const event of events)if(event.recharges)event.loads=event.recharges.map(describe);
  if(upfront.length)events.unshift({at:0,text:'Désactiver toutes les jauges. Recharger les jauges ci-dessous dès le départ. Les laisser désactivées jusqu’à l’étape qui les utilise.',recharges:upfront,loads:upfront.map(describe)});
  return {events,seconds,cost,shopping:[...shopping.values()],final:mounts,fuel,strategy};
 }
 function planMany(pens,catalog,prices,strategy='economy'){
  if(!pens.length)throw Error('Sélectionne au moins un enclos.');
  const initialPens=JSON.parse(JSON.stringify(pens)),eventsByTime=new Map(),shopping=new Map(),final=[];let cost=0,seconds=0;
  const ids=pens.flatMap(p=>p.mounts.map(m=>m.id));if(ids.some(x=>!x)||new Set(ids).size!==ids.length)throw Error('Identités de montures invalides.');
  for(const p of pens){let result;try{result=plan(p,catalog,prices,strategy)}catch(error){throw Error(p.name+' : '+error.message)}cost+=result.cost;seconds=Math.max(seconds,result.seconds);final.push(...result.final);for(const x of result.shopping)shopping.set(x.id,{...x,qty:x.qty+(shopping.get(x.id)?.qty||0)});
   let occupied=new Set(p.mounts.map(m=>m.id)),active=[];
   const grouped=new Map();for(const event of result.events){if(!grouped.has(event.at))grouped.set(event.at,[]);grouped.get(event.at).push(event)}
   for(const [at,source] of grouped){const before=new Set(occupied),prior=[...active],recharges=[];for(const event of source){recharges.push(...(event.recharges||[]));if(event.mountIds)occupied=new Set(event.mountIds);for(const id of event.removeIds||[])occupied.delete(id);if(event.active)active=[...event.active]}
    const removeIds=[...before].filter(x=>!occupied.has(x)),addIds=[...occupied].filter(x=>!before.has(x)),names=xs=>xs.map(id=>p.mounts.find(m=>m.id===id).name).join(', '),off=prior.filter(k=>!active.includes(k)),on=active.filter(k=>!prior.includes(k)),lines=[];
    if(removeIds.length)lines.push('Retirer '+names(removeIds));if(addIds.length)lines.push('Ajouter '+names(addIds));if(off.length)lines.push('Désactiver '+off.map(k=>labels[k]).join(' + '));if(on.length)lines.push('Activer '+on.map(k=>labels[k]).join(' + '));
    if(!eventsByTime.has(at))eventsByTime.set(at,[]);eventsByTime.get(at).push({penId:p.id,penName:p.name,removeIds,addIds,active:[...active],recharges,text:lines.join(' · ')});
   }
  }
  const events=[...eventsByTime].sort((a,b)=>a[0]-b[0]).map(([at,entries])=>({at,entries,text:entries.map(x=>x.penName+' : '+x.text).join('\n')}));
  return {multi:true,penIds:pens.map(p=>p.id),initialPens,events,shopping:[...shopping.values()],cost,seconds,final,strategy};
 }
 return {keys,labels,caps,strategies,rate,purchase,plan,planMany,validate};
})();
if(typeof module!=='undefined')module.exports=Breeding;
