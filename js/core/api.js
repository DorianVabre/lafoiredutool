// core/api.js — La Foire du Tool V90
async function get(path){
 const customMatch=path.match(/^\/items\/(equipment|consumables|resources)\/(-\d+)$/);if(customMatch){const d=customDetail(customMatch[2]);if(d)return d;throw Error('Recette personnalisée introuvable')}const controller=new AbortController(),t=setTimeout(()=>controller.abort(),12000);try{const r=await fetch(BASE+path,{signal:controller.signal,headers:{Accept:'application/json'}});if(!r.ok)throw Error('HTTP '+r.status+' : '+path);return await r.json()}finally{clearTimeout(t)}}
function subtype(s){s=String(s||'').toLowerCase();if(s.includes('equipment')||s.includes('weapon'))return 'equipment';if(s.includes('consumable'))return 'consumables';return 'resources'}
