const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'../dofus-craft.html'),'utf8');
test('three distinct panels in requested order',()=>{const i=html.indexOf('class="multi-workspace"'),s=html.slice(i,html.indexOf('id="breakMode"',i));const a=s.indexOf('multi-strategy-panel'),b=s.indexOf('multi-items-panel'),c=s.indexOf('multi-shopping-panel');assert.ok(a>=0&&a<b&&b<c)});
test('strategy panel contains both gains',()=>{const s=html.split('multi-strategy-panel"')[1].split('</section>')[0];assert.match(s,/name="multiStrategy"/);assert.match(s,/id="multiProfit"/);assert.match(s,/id="multiSelectionGain"/)});
test('items and shopping remain in own panels',()=>{assert.match(html,/multi-items-panel[^>]*><h2>Recettes sélectionnées<\/h2><div id="multiSelected"/);assert.match(html,/multi-shopping-panel[^>]*><h2>Liste d'achats et possessions<\/h2><div id="multiShopping"/)});
