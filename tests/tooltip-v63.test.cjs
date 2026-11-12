const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'../dofus-craft.html'),'utf8');
const fn=html.slice(html.indexOf('function ledgerTileHTML('),html.indexOf('function ledgerOpenLot('));
test('tooltip uses original total cost',()=>assert.match(fn,/buyPrice=fmt\(Number\(lot.qty\)\*Number\(lot.buy\)\)/));
test('tooltip and native title display K not K/u',()=>{assert.match(fn,/Prix d’achat : \$\{buyPrice\}/);assert.doesNotMatch(fn,/K\/u/)});
