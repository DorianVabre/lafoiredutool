const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../dofus-craft.html'),'utf8');
const src=html.slice(html.indexOf('function ledgerTileHTML('),html.indexOf('function ledgerOpenLot('));
const ctx={ledgerSold:()=>0,esc:String,fmt:n=>String(n)+' K',fmtNum:n=>String(n)};vm.createContext(ctx);vm.runInContext(src,ctx);
test('hover affiche prix achat total initial sous commentaire',()=>{const result=ctx.ledgerTileHTML({id:'1',name:'Objet',comment:'Note',qty:3,buy:1200});assert.match(result,/<strong>Objet<\/strong><br>Note<br><span class="ledger-tile-buy">Prix d’achat : 3600 K<\/span>/)});
test('prix affiché aussi sans commentaire',()=>assert.match(ctx.ledgerTileHTML({id:'2',name:'Objet',qty:1,buy:0}),/<strong>Objet<\/strong><br><span class="ledger-tile-buy">Prix d’achat : 0 K/));
