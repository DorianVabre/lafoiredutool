// tools/parchotage.js — La Foire du Tool V90
// Parchotage : programmation dynamique, chaque parchemin est soumis au seuil avant utilisation.
const SCROLL_TYPES=[{name:'Petit',gain:1,limit:25},{name:'Moyen',gain:1,limit:50},{name:'Grand',gain:1,limit:80},{name:'Puissant',gain:2,limit:100}];
const SCROLL_KEY='la-foire-du-tool-parchotage-v1';
let scrollSaved={};
try{scrollSaved=JSON.parse(localStorage.getItem(SCROLL_KEY)||'{}')||{}}catch{}
function scrollOptimize(start,prices){
 if(!Number.isInteger(start)||start<0||start>100)return null;
 const best=Array(101).fill(Infinity),prev=Array(101).fill(null);
 best[start]=0;
 for(let at=start;at<100;at++){
  if(!Number.isFinite(best[at]))continue;
  SCROLL_TYPES.forEach((type,index)=>{
   const price=prices[index];
   if(price===null||!Number.isFinite(price)||price<0||at>=type.limit) return;
   const next=at+type.gain;
   if(next>100)return;
   const cost=best[at]+price;
   if(cost<best[next]){best[next]=cost;prev[next]={from:at,index};}
  });
 }
 if(!Number.isFinite(best[100]))return null;
 const counts=SCROLL_TYPES.map(()=>0),steps=[];
 for(let at=100;at>start;){const p=prev[at];if(!p)return null;counts[p.index]++;steps.push({index:p.index,from:p.from,to:at});at=p.from;}
 steps.reverse();
 const phases=[];
 for(const step of steps){const last=phases[phases.length-1];if(last&&last.index===step.index){last.count++;last.to=step.to;}else phases.push({...step,count:1});}
 return {total:best[100],counts,steps,phases};
}
function scrollRead(){
 const current=Number(document.querySelector('#scrollCurrent').value);
 const prices=SCROLL_TYPES.map((_,i)=>{const value=document.querySelector('#scrollPrice'+i).value.trim();return value===''?null:Number(value)});
 return {current,prices};
}
function scrollSave(){
 const stat=document.querySelector('#scrollStat').value;
 scrollSaved[stat]={current:document.querySelector('#scrollCurrent').value,prices:SCROLL_TYPES.map((_,i)=>document.querySelector('#scrollPrice'+i).value)};
 try{localStorage.setItem(SCROLL_KEY,JSON.stringify(scrollSaved))}catch{}
}
function scrollRender(){
 const {current,prices}=scrollRead(),result=scrollOptimize(current,prices);
 const valid=Number.isInteger(current)&&current>=0&&current<=100&&prices.every(p=>p===null||(Number.isSafeInteger(p)&&p>=0));
 const total=document.querySelector('#scrollTotal'),progress=document.querySelector('#scrollProgress');
 const message=document.querySelector('#scrollMessage'),breakdown=document.querySelector('#scrollBreakdown'),steps=document.querySelector('#scrollSteps');
 progress.textContent=valid?current+' → 100':'—';
 if(!valid){total.textContent='—';message.textContent='Indique un niveau entre 0 et 100 et des prix entiers positifs.';breakdown.innerHTML='';steps.innerHTML='';return;}
 if(!result){total.textContent='—';message.textContent='Aucune combinaison possible avec les prix renseignés. Complète les prix manquants.';breakdown.innerHTML='';steps.innerHTML='';return;}
 total.textContent=fmt(result.total);
 message.textContent=current===100?'Ton parchotage est déjà terminé.':'Combinaison optimale calculée en respectant les seuils de chaque parchemin.';
 breakdown.innerHTML='<table class="scroll-table"><thead><tr><th>Parchemin</th><th>Quantité</th><th>Coût</th></tr></thead><tbody>'+SCROLL_TYPES.map((t,i)=>'<tr><td>'+t.name+' (+'+t.gain+')</td><td>'+result.counts[i]+'</td><td>'+(result.counts[i]?fmt(result.counts[i]*prices[i]):'—')+'</td></tr>').join('')+'</tbody></table>';
 steps.innerHTML=result.phases.length?result.phases.map(p=>'<span class="scroll-step"><b>'+p.count+' × '+SCROLL_TYPES[p.index].name+'</b> · '+p.from+' → '+p.to+'</span>').join(''):'<span class="scroll-help">Aucun parchemin nécessaire.</span>';
}
function scrollLoad(){
 const stat=document.querySelector('#scrollStat').value,record=scrollSaved[stat]||{};
 document.querySelector('#scrollCurrent').value=record.current??'0';
 SCROLL_TYPES.forEach((_,i)=>document.querySelector('#scrollPrice'+i).value=record.prices?.[i]??'');
 scrollRender();
}
document.querySelector('#scrollStat').addEventListener('change',scrollLoad);
for(const field of ['#scrollCurrent',...SCROLL_TYPES.map((_,i)=>'#scrollPrice'+i)])document.querySelector(field).addEventListener('input',()=>{scrollSave();scrollRender()});
scrollLoad();

