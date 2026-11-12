const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'../dofus-craft.html'),'utf8');
test('prix/u dans les deux vues',()=>assert.equal((html.match(/placeholder="Prix\/u"/g)||[]).length,2));
test('ancien libellé supprimé',()=>assert.doesNotMatch(html,/placeholder="Achat\/u"/));
test('colonne de prix multicraft élargie',()=>assert.match(html,/\.multi-row\{grid-template-columns:36px minmax\(0,1fr\) minmax\(118px,132px\) 105px\}/));
test('prix multicraft largeur complète',()=>assert.match(html,/\.multi-row input\[data-mprice\]\{[^}]*width:100%/));
