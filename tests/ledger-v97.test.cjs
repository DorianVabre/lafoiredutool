const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('js/tools/historique.js','utf8');
function setup(){const c={Date};vm.createContext(c);vm.runInContext(src.slice(src.indexOf('const ledgerSold='),src.indexOf('function ledgerEntryHTML'))+';this.api={ledgerRecord,ledgerTotals,ledgerSold}',c);return c.api}
test('achat 100, mise en vente 100, changement 200, vente : gain 96',()=>{const a=setup(),l={qty:1,buy:100,sales:[]};a.ledgerRecord(l,'listing',1,100);a.ledgerRecord(l,'reprice',1,200);assert.equal(a.ledgerSold(l),0);assert.equal(a.ledgerTotals([l]).profit,-4);a.ledgerRecord(l,'sale',1,200);assert.equal(a.ledgerTotals([l]).profit,96);assert.equal(l.sales.length,3)});
test('vente partielle et changement du prix sur le stock restant',()=>{const a=setup(),l={qty:3,buy:100,sales:[]};a.ledgerRecord(l,'listing',3,100);a.ledgerRecord(l,'sale',1,150);a.ledgerRecord(l,'reprice',2,200);a.ledgerRecord(l,'sale',2,200);assert.equal(l.sales[2].tax,4);assert.equal(a.ledgerTotals([l]).profit,240)});
test('mise en vente explicite et absence de double taxe',()=>{const a=setup(),l={qty:2,buy:100,sales:[]};a.ledgerRecord(l,'listing',2,200);a.ledgerRecord(l,'sale',1,200);a.ledgerRecord(l,'sale',1,200);assert.equal(l.sales.length,3);assert.equal(a.ledgerTotals([l]).profit,192)});
test('anciens lots et saisies invalides',()=>{const a=setup(),l={qty:1,buy:100,sales:[{qty:1,price:200}]};assert.equal(a.ledgerTotals([l]).profit,96);assert.equal(a.ledgerRecord(l,'reprice',1,200),false)});
