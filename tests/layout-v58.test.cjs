const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');const html=fs.readFileSync(require('node:path').join(__dirname,'../dofus-craft.html'),'utf8');
test('trois panneaux dans la même grille',()=>{assert.match(html,/#ledgerMode \.ledger-workspace\{display:contents\}/);assert.match(html,/grid-template-columns:minmax\(260px,0\.85fr\)/);});
test('statistique articles restants supprimée',()=>{assert.doesNotMatch(html,/id="ledgerRemaining"/);assert.doesNotMatch(html,/Articles restant à vendre/);});
test('deux statistiques conservées',()=>{assert.match(html,/id="ledgerProfit"/);assert.match(html,/id="ledgerPending"/);});
test('repli sur mobile',()=>assert.match(html,/@media\(max-width:700px\)/));
