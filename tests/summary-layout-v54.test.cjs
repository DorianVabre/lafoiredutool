const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'../dofus-craft.html'),'utf8');
const summary=html.match(/<div class="multi-summary">([\s\S]*?)<\/div><\/section>/)[1];
test('seulement les deux gains dans le bilan',()=>{assert.match(summary,/Gain si optimisation automatique/);assert.match(summary,/Gain via sélection actuelle/);assert.doesNotMatch(summary,/Coût total|Valeur HDV totale/);});
test('total achat sous la liste',()=>assert.match(html,/id="multiShopping"[^>]*>[^<]*<\/div><div class="multi-shopping-total">/));
test('total achat mis à jour par le calcul',()=>assert.match(html,/multiPurchaseTotal'\)\.textContent=multi\.items\.length&&complete\?fmt\(total\)/));
test('anciennes cases retirées',()=>{assert.doesNotMatch(html,/id="multiCost"/);assert.doesNotMatch(html,/id="multiSellTotal"/);});
