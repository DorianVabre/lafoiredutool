const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'../dofus-craft.html'),'utf8');
test('onglet brisage avant historique',()=>assert.ok(html.indexOf('id="tabBreak"')<html.indexOf('id="tabLedger"')));
test('recherche uniquement équipements',()=>assert.match(html,/get\('\/items\/equipment\/search\?/));
test('les runes sont dérivées des effets',()=>assert.match(html,/function breakRuneNames\(d\)/));
test('variantes vi pa vi ra vi',()=>assert.match(html,/\['Vi','Pa Vi','Ra Vi'\]/));
test('formule bénéfice brisage',()=>assert.match(html,/profit=revenue-expense/));
test('sauvegarde locale indépendante',()=>assert.match(html,/dofus-craft-breaking-v1/));
test('saisie des quantités et prix',()=>{assert.match(html,/data-bqty/);assert.match(html,/data-bprice/)});
