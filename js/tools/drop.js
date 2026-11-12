// Calculateur de multiplicateur de butin — Dofus 3.
const DROP_KEY='la-foire-du-tool-drop-v1';
function dropProspectionMultiplier(pp){
 if(!Number.isFinite(pp)||pp<0)return NaN;
 return Math.max(1,0.74+1.755/(1+Math.exp((250-pp)/85)));
}
function dropCalculate({pp,challenge=0,almanax=0,shield=false,base=null}){
 if(![pp,challenge,almanax].every(Number.isFinite)||pp<0||challenge<0||almanax<0||
   (base!==null&&(!Number.isFinite(base)||base<0||base>100)))return null;
 const prospection=dropProspectionMultiplier(pp);
 const challengeFactor=1+challenge/100,almanaxFactor=1+almanax/100,shieldFactor=shield?1.05:1;
 const multiplier=prospection*challengeFactor*almanaxFactor*shieldFactor;
 return {prospection,challengeFactor,almanaxFactor,shieldFactor,multiplier,
   final:base===null?null:Math.min(100,base*multiplier)};
}
const dropIds=['dropPp','dropChallenge','dropAlmanax','dropShield','dropBase'];
function dropRead(){
 const raw=id=>document.getElementById(id).value.trim().replace(',','.');
 const parse=id=>raw(id)===''?NaN:Number(raw(id));
 return {pp:parse('dropPp'),challenge:parse('dropChallenge'),almanax:parse('dropAlmanax'),
   shield:document.getElementById('dropShield').checked,base:raw('dropBase')===''?null:parse('dropBase')};
}
function dropFormat(n,digits=2){return n.toLocaleString('fr-FR',{maximumFractionDigits:digits,minimumFractionDigits:digits})}
function dropRender(){
 const data=dropRead(),result=dropCalculate(data);
 const error=document.getElementById('dropError'),mult=document.getElementById('dropMultiplier'),final=document.getElementById('dropFinal'),detail=document.getElementById('dropBreakdown');
 if(!result){error.textContent='Renseigne des valeurs positives (taux de base entre 0 et 100 %).';mult.textContent='—';final.textContent='—';detail.textContent='';return;}
 error.textContent='';mult.textContent='× '+dropFormat(result.multiplier);
 final.textContent=result.final===null?'Renseigne un taux de base':dropFormat(result.final,Math.abs(result.final)<1?4:2)+' %';
 detail.innerHTML='<div>Prospection <b>× '+dropFormat(result.prospection)+'</b></div>'+
 '<div>Challenge <b>× '+dropFormat(result.challengeFactor)+'</b></div>'+
 '<div>Almanax <b>× '+dropFormat(result.almanaxFactor)+'</b></div>'+
 '<div>Ankama Shield <b>× '+dropFormat(result.shieldFactor)+'</b></div>';
 try{localStorage.setItem(DROP_KEY,JSON.stringify({pp:data.pp,challenge:data.challenge,almanax:data.almanax,shield:data.shield,base:data.base}))}catch{}
}
if(typeof document.getElementById==='function'){
try{
 const saved=JSON.parse(localStorage.getItem(DROP_KEY)||'null');
 if(saved&&typeof saved==='object'){
  for(const [id,key] of [['dropPp','pp'],['dropChallenge','challenge'],['dropAlmanax','almanax']])
   if(typeof saved[key]==='number'&&Number.isFinite(saved[key]))document.getElementById(id).value=saved[key];
  document.getElementById('dropShield').checked=saved.shield===true;
  if(typeof saved.base==='number'&&Number.isFinite(saved.base))document.getElementById('dropBase').value=saved.base;
 }
}catch{}
for(const id of dropIds)document.getElementById(id).addEventListener('input',dropRender);
document.getElementById('dropShield').addEventListener('change',dropRender);
dropRender();
}
