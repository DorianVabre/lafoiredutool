const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../js/tools/historique.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../css/style.css'),'utf8');
const segment=src.slice(src.indexOf('const ledgerSold='),src.indexOf('function ledgerOpenLot('));
function setup(){
 const context={fmt:n=>`${Math.round(n)} K`,fmtNum:n=>String(n),esc:s=>String(s),Intl};
 vm.createContext(context);
 vm.runInContext(segment+'\nthis.api={ledgerProfitPercent,ledgerSignedPercent,ledgerTileHTML,ledgerEntryHTML,ledgerTotals};',context);
 return context.api;
}
const profitable={id:'1',name:'Rune',qty:2,buy:100,image:'',sales:[{qty:2,price:150,date:'2026-11-13'}]};
const losing={id:'2',name:'Rune',qty:2,buy:100,image:'',sales:[{qty:2,price:80,date:'2026-11-13'}]};
test('lot terminé rentable : taux net après taxe et hachures vertes',()=>{
 const a=setup();assert.equal(a.ledgerProfitPercent(profitable),47);assert.match(a.ledgerEntryHTML(profitable),/\(\+47 %\)/);assert.match(a.ledgerTileHTML(profitable),/ledger-tile-profit/);
});
test('lot terminé déficitaire : taux négatif et hachures rouges',()=>{
 const a=setup();assert.ok(Math.abs(a.ledgerProfitPercent(losing)+21.6)<1e-9);assert.match(a.ledgerEntryHTML(losing),/\(−21,6 %\)/);assert.match(a.ledgerTileHTML(losing),/ledger-tile-loss/);
});
test('lot en cours : pas de rayures ni de pourcentage final',()=>{
 const a=setup(),lot={...profitable,sales:[{qty:1,price:150,date:'2026-11-13'}]};assert.doesNotMatch(a.ledgerTileHTML(lot),/ledger-tile-(profit|loss)/);assert.doesNotMatch(a.ledgerEntryHTML(lot),/\(\+\d+ %\)/);
});
test('lot gratuit : pas de division par zéro',()=>{
 const a=setup(),lot={...profitable,buy:0};assert.equal(a.ledgerProfitPercent(lot),null);assert.match(a.ledgerEntryHTML(lot),/\(—\)/);
});
test('styles rayés réservés aux lots archivés',()=>{
 assert.match(css,/#ledgerMode \.ledger-archived-panel \.ledger-tile-profit\{/);assert.match(css,/#ledgerMode \.ledger-archived-panel \.ledger-tile-loss\{/);
});
