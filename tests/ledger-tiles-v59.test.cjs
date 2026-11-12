const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');const html=fs.readFileSync(require('node:path').join(__dirname,'../dofus-craft.html'),'utf8');
test('galerie compacte dans les deux sections',()=>{assert.match(html,/filteredActive\.slice\(\)\.reverse\(\)\.map\(ledgerTileHTML\)/);assert.match(html,/filteredArchived\.slice\(\)\.reverse\(\)\.map\(ledgerTileHTML\)/)});
test('commentaire au survol',()=>{assert.match(html,/ledger-tile-tip/);assert.match(html,/lot\.comment\|\|/)});
test('popup accessible et refermable',()=>{assert.match(html,/<dialog id="ledgerLotDialog"/);assert.match(html,/dialog\.showModal\(\)/);assert.match(html,/ledger-modal-close/)});
test('actions vente et suppression conservées dans la popup',()=>{assert.match(html,/ledgerBindActions\(dialog\)/);assert.match(html,/\[data-lsale\]/);assert.match(html,/\[data-ldel\]/)});
