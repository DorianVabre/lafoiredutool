((global)=>{
 'use strict';

 function cumulative(level){return 10*level*(level-1)}
 function levelFromTotal(total){let level=1;while(level<200&&total>=cumulative(level+1))level++;return level}
 function craftXpAt(jobLevel,recipeLevel,ratio,bonus=100){
  const gap=jobLevel-recipeLevel;if(recipeLevel<1||gap<0||gap>100)return 0;
  let factor=ratio??1;if(factor>3)factor/=100;
  const recipeXp=Math.floor(20*recipeLevel/(Math.pow(gap,1.1)/10+1)*factor);
  return Math.max(0,Math.floor(recipeXp*(Number(bonus)||100)/100));
 }
 function craftsToTarget(item,target,startTotal,bonus=100){
  let total=startTotal,crafts=0;
  while(levelFromTotal(total)<target){
   const level=levelFromTotal(total),xp=craftXpAt(level,item.level,item.ratio,bonus);
   if(!xp)return null;
   const count=Math.ceil((cumulative(level+1)-total)/xp);
   crafts+=count;total+=count*xp;
   if(crafts>1000000)return null;
  }
  return crafts;
 }
 function knownPrice(value){return value!==undefined&&value!==null&&value!==''&&Number.isFinite(Number(value))&&Number(value)>=0}
 function priceAnalysis(components,sell,prices){
  const parts=Array.isArray(components)?components:[],complete=parts.length>0&&knownPrice(sell)&&parts.every(part=>Number(part.qty)>0&&knownPrice(prices?.[part.id]));
  if(!complete)return{complete:false};
  const cost=parts.reduce((sum,part)=>sum+Number(prices[part.id])*Number(part.qty),0),sale=Number(sell);
  return{complete:true,cost,margin:sale-cost,sell:sale};
 }
 function batchValues(components,quantity,sell,prices){
  const parts=Array.isArray(components)?components:[],count=Math.max(0,Number(quantity)||0),complete=parts.length>0&&parts.every(part=>Number(part.qty)>0&&knownPrice(prices?.[part.id]));
  const cost=parts.reduce((sum,part)=>sum+(knownPrice(prices?.[part.id])?Number(prices[part.id])*Number(part.qty)*count:0),0),revenue=knownPrice(sell)?Number(sell)*count:null;
  return{complete,cost,revenue,margin:complete&&revenue!==null?revenue-cost:null};
 }
 function gatheringEstimate(resourceLevel,professionLevel,neededXp,bonus=100,meanUnits=null){
  const xp=Math.floor((10+Math.floor(Number(resourceLevel)/5))*(Number(bonus)||100)/100),needed=Math.max(0,Number(neededXp)||0),eligible=Number(professionLevel)>=Number(resourceLevel),actions=!eligible||(!xp&&needed>0)?null:Math.ceil(needed/Math.max(1,xp)),hasMean=meanUnits!==null&&meanUnits!==undefined&&meanUnits!==''&&Number.isFinite(Number(meanUnits));
  return{xp,actions,units:actions!==null&&hasMean?Math.ceil(actions*Number(meanUnits)):null};
 }
 function gatheringGoals(resourceLevel,startTotal,bonus=100,meanUnits=null){
  const level=levelFromTotal(startTotal),firstTarget=Math.ceil((level+1)/10)*10;
  return[firstTarget,firstTarget+10].filter(target=>target<=200).map(target=>({target,...gatheringEstimate(resourceLevel,level,cumulative(target)-startTotal,bonus,meanUnits)}));
 }
 function breedingEstimate(neededXp,bonus=100){
  const multiplier=(Number(bonus)||100)/100,actions=baseXp=>{const xp=Math.floor(baseXp*multiplier);return xp>0?Math.ceil(Math.max(0,Number(neededXp)||0)/xp):null};
  return{capture:{xp:Math.floor(30*multiplier),actions:actions(30)},generations:Array.from({length:10},(_,index)=>{const generation=index+1,baseXp=30*generation;return{generation,xp:Math.floor(baseXp*multiplier),actions:actions(baseXp)}})};
 }
 function recipeXpRatio(item){
  const objectName=String(item.name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const type=item.type??item.item_fields?.type??item.fields?.type??{},label=typeof type==='string'?type:(type.name?.fr??type.name?.en??type.name??type.name_id??type.nameId??''),typeName=String(label).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const raw=item.experienceRatio??item.experience_ratio??item.xpRatio??item.xp_ratio??item.item_fields?.experienceRatio??item.item_fields?.experience_ratio??item.item_fields?.xpRatio??item.fields?.experienceRatio??item.fields?.experience_ratio??type.experienceRatio??type.experience_ratio??type.xpRatio;
  if(raw!==undefined&&raw!==null&&Number.isFinite(Number(raw))){const ratio=Number(raw);return ratio>3?ratio/100:ratio}
  // Le ratio explicite ou le type de l’objet priment sur son nom : « Planche de Gravure » reste une planche.
  if(objectName==='planche hatoufer')return 0;
  const level=Number(item.level??item.item_level??item.item_fields?.level??item.fields?.level);
  if(/gravure|engraving/.test(typeName)){if(level===20)return.3;if(level>=80)return 1}
  if(/percepteur|conquete/.test(typeName))return.1;
  if(/bouclier|shield/.test(typeName))return 1;
  if(/potion/.test(typeName)&&/teleport|rappel|bonta|brakmar/.test(typeName))return.2;
  if(/trophee|trophy/.test(typeName))return 3;
  if(/clef|cle|key/.test(typeName))return.6;
  if(/substrat|substrate/.test(typeName))return.2;
  if(/alliage|alloy/.test(typeName))return.3;
  if(/planche|board/.test(typeName))return.2;
  if(/viande|meat|pierre precieuse|gem/.test(typeName))return.1;
  if(/potion|pain|bread|poisson|fish|carburant/.test(typeName))return.05;
  return 0;
 }
 function goalQuantity(item,target,currentTotal,recipes,selected,bonus=100){
  const level=levelFromTotal(currentTotal),list=recipes||[],chosen=selected||{};
  const planned=list.reduce((sum,recipe)=>sum+(chosen[recipe.id]||0)*craftXpAt(level,recipe.level,recipe.ratio,bonus),0);
  const currentItem=(chosen[item.id]||0)*craftXpAt(level,item.level,item.ratio,bonus);
  return craftsToTarget(item,target,currentTotal+planned-currentItem,bonus);
 }

 const api=Object.freeze({cumulative,levelFromTotal,craftXpAt,craftsToTarget,priceAnalysis,batchValues,gatheringEstimate,gatheringGoals,breedingEstimate,recipeXpRatio,goalQuantity});
 global.JobsXpEngine=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(globalThis);
