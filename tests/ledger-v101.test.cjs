const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('js/tools/historique.js','utf8');
function setup(){const context={Date,Intl,fmt:String,fmtNum:String,esc:String};vm.createContext(context);vm.runInContext(src.slice(src.indexOf('const ledgerSold='),src.indexOf('function ledgerOpenLot('))+';this.api={ledgerRecord,ledgerTileHTML}',context);return context.api}
test('hachures orange durant la mise en vente, jusqu’au retrait ou à la vente complète',()=>{
 const a=setup(),lot={id:'status',name:'Rune',qty:3,buy:100,sales:[]};
 assert.doesNotMatch(a.ledgerTileHTML(lot),/ledger-tile-listed/);
 a.ledgerRecord(lot,'listing',3,200);
 assert.match(a.ledgerTileHTML(lot),/ledger-tile-listed/);
 assert.match(a.ledgerTileHTML(lot),/aria-label="Voir le lot : Rune — En vente en HDV"/);
 a.ledgerRecord(lot,'reprice',3,250);
 a.ledgerRecord(lot,'sale',1,NaN);
 assert.match(a.ledgerTileHTML(lot),/ledger-tile-listed/);
 a.ledgerRecord(lot,'withdrawal',NaN,NaN);
 assert.doesNotMatch(a.ledgerTileHTML(lot),/ledger-tile-listed|En vente en HDV/);
 a.ledgerRecord(lot,'listing',2,200);
 a.ledgerRecord(lot,'sale',2,NaN);
 assert.doesNotMatch(a.ledgerTileHTML(lot),/ledger-tile-listed/);
 assert.match(a.ledgerTileHTML(lot),/ledger-tile-profit/);
});
test('ancien lot et lot terminé en perte gardent leur aspect',()=>{
 const a=setup();
 assert.doesNotMatch(a.ledgerTileHTML({id:'old',name:'Ancien',qty:2,buy:100,sales:[{qty:1,price:50}]}),/ledger-tile-listed/);
 const lot={id:'loss',name:'Perte',qty:1,buy:100,sales:[]};
 a.ledgerRecord(lot,'listing',1,50);a.ledgerRecord(lot,'sale',1,NaN);
 assert.match(a.ledgerTileHTML(lot),/ledger-tile-loss/);
 assert.doesNotMatch(a.ledgerTileHTML(lot),/ledger-tile-listed/);
});
