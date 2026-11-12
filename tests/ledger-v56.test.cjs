const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');const html=fs.readFileSync(require('node:path').join(__dirname,'../dofus-craft.html'),'utf8');
test('site renommé',()=>{assert.match(html,/<title>La Foire du Tool/);assert.match(html,/◆ La Foire du Tool/);});
test('objet sélectionné via API et commentaire',()=>{assert.match(html,/id="ledgerItemId"/);assert.match(html,/id="ledgerComment"/);assert.match(html,/data-ledger-pick/);assert.match(html,/Sélectionne un objet dans les résultats/);});
test('archive fermée par défaut et lots entièrement vendus',()=>{assert.match(html,/<details id="ledgerArchive"/);assert.doesNotMatch(html,/<details id="ledgerArchive"[^>]*\bopen\b/);assert.match(html,/ledgerSold\(lot\)>=Number\(lot.qty\)/);});
test('compatibilité anciens lots sans id',()=>assert.match(html,/lot.itemId\?/));
