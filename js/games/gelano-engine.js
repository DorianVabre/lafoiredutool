/* Mini-jeu volontairement simplifié : deux bonus, un tirage par rune consommée. */
(function(root){'use strict';
 function initial(){return {pa:true,pm:false,used:{pa:0,pm:0},won:false,history:[]}}
 function chance(state,rune){
  if(state.won||!['pa','pm'].includes(rune)||state[rune])return null;
  return rune==='pm'?.015:state.pm?.26:.66;
 }
 function attempt(state,rune,random=Math.random){
  const rate=chance(state,rune);if(rate===null)return state;
  const draw=random();if(!Number.isFinite(draw)||draw<0||draw>=1)throw Error('Tirage invalide.');
  const success=draw<rate,other=rune==='pa'?'pm':'pa',lost=!success&&state[other]?other:null;
  const next={...state,used:{...state.used,[rune]:state.used[rune]+1},[rune]:success};
  if(lost)next[lost]=false;
  next.won=next.pa&&next.pm;
  next.history=[{number:next.used.pa+next.used.pm,rune,success,lost,rate},...state.history].slice(0,20);
  return next;
 }
 const api={initial,chance,attempt};if(typeof module==='object'&&module.exports)module.exports=api;root.GelanoEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
