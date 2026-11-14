(()=>{'use strict';
 const el=id=>document.getElementById(id),BEST_KEY='la-foire-du-tool-gelano-best-v1',engine=GelanoEngine;
 let state=engine.initial(),best=null;
 try{const saved=Number(localStorage.getItem(BEST_KEY));if(Number.isSafeInteger(saved)&&saved>0)best=saved}catch{}
 const number=value=>value.toLocaleString('fr-FR'),label=rune=>rune==='pa'?'PA':'PM',image=rune=>'data/gelano/'+(rune==='pa'?'ga-pa':'ga-pme')+'.png';
 function render(message){
  const total=state.used.pa+state.used.pm;
  el('runeCount').textContent=number(total);el('bestScore').textContent=best===null?'—':number(best);
  for(const rune of ['pa','pm']){
   const rate=engine.chance(state,rune),button=el(rune==='pa'?'applyPa':'applyPm');
   el(rune+'Value').textContent=state[rune]?'1':'0';el(rune+'Used').textContent=number(state.used[rune]);el(rune+'Row').classList.toggle('is-present',state[rune]);
   button.disabled=rate===null;button.setAttribute('aria-label',rate===null?label(rune)+' déjà présent':'Tenter le '+label(rune)+' · '+(rate*100).toLocaleString('fr-FR')+' % de réussite');
   el(rune+'Chance').textContent=rate===null?'Déjà présent':(rate*100).toLocaleString('fr-FR')+' % de réussite';
  }
  el('itemProgress').textContent=Number(state.pa)+Number(state.pm)+' / 2 bonus';
  el('historyCount').textContent=number(total)+' tentative'+(total>1?'s':'');el('historyEmpty').hidden=total>0;
  el('forgeHistory').innerHTML=state.history.map(entry=>'<li class="history-entry'+(entry.success?' is-success':'')+'"><div><img src="'+image(entry.rune)+'" alt=""><strong>Rune Ga '+(entry.rune==='pa'?'Pa':'Pme')+'</strong><span class="attempt-number">#'+number(entry.number)+'</span></div><p>'+(entry.success?'Réussite · +1 '+label(entry.rune):'Échec'+(entry.lost?' · −1 '+label(entry.lost):' · aucun bonus perdu'))+'</p></li>').join('');el('forgeHistory').scrollTop=0;
  const last=state.history[0];el('forgeStatus').dataset.outcome=last?(last.success?'success':'failure'):'';
  el('forgeStatus').textContent=message||(state.won?'Le miracle est arrivé !':state.pm?'Le PM est en place. Plus qu’un PA !':state.pa?'Le PA est en place. Tente le PM !':'Gelano vide. Remets le PA… ou tente directement le PM.');
  el('workbench').classList.toggle('is-won',state.won);el('forgeVictory').hidden=!state.won;
  if(state.won)el('victoryScore').textContent=number(total)+' rune'+(total>1?'s':'')+' utilisée'+(total>1?'s':'')+' : '+number(state.used.pa)+' PA et '+number(state.used.pm)+' PM.';
 }
 function apply(rune){
  const next=engine.attempt(state,rune);if(next===state)return;state=next;
  if(state.won){const total=state.used.pa+state.used.pm;if(best===null||total<best){best=total;try{localStorage.setItem(BEST_KEY,String(best))}catch{}}}
  const last=state.history[0],message=state.won?'Bravo ! Ton Gelano est PA/PM.':last.success?'Réussite ! +1 '+label(rune)+'. '+(state.pm?'Plus qu’un PA !':'Le PM t’attend.'):'Échec… '+(last.lost?'Le '+label(last.lost)+' a sauté.':'Le Gelano reste vide.');
  render(message);if(state.won)el('restartForge').focus({preventScroll:true});
 }
 function reset(){state=engine.initial();render();el('applyPm').focus({preventScroll:true})}
 el('applyPa').addEventListener('click',()=>apply('pa'));el('applyPm').addEventListener('click',()=>apply('pm'));
 el('resetForge').addEventListener('click',reset);el('restartForge').addEventListener('click',reset);
 render();
})();
