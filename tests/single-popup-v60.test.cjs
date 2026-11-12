const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'../dofus-craft.html'),'utf8');
test('une seule entête de nom dans la popup',()=>{assert.doesNotMatch(html,/id="ledgerModalTitle"/);assert.doesNotMatch(html,/ledgerModalTitle'\)\.textContent/);assert.match(html,/id="ledgerModalContent"/);});
test('fermeture conservée et carte interne seule',()=>{assert.match(html,/class="ledger-modal-close"/);assert.match(html,/ledgerEntryHTML\(lot\)/);assert.match(html,/#ledgerLotDialog \.ledger-entry\{margin:0;border:0;background:transparent/);});
