const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'js/tools/drop.js'),'utf8');
function calc(x){const context=vm.createContext({});vm.runInContext(src.split('const dropIds=')[0],context);return vm.runInContext('dropCalculate('+JSON.stringify(x)+')',context)}
test('100 PP = multiplicateur 1',()=>assert.equal(calc({pp:100}).prospection,1));
test('200 PP = courbe non linéaire ~1.367',()=>assert.ok(Math.abs(calc({pp:200}).prospection-1.367)<.003));
test('bonus combinés sont multiplicatifs',()=>{const r=calc({pp:100,challenge:50,almanax:20,shield:true,base:10});assert.ok(Math.abs(r.multiplier-1.89)<1e-10);assert.ok(Math.abs(r.final-18.9)<1e-10)});
test('taux final plafonné à 100',()=>assert.equal(calc({pp:600,challenge:200,almanax:100,shield:true,base:90}).final,100));
test('sans taux de base, seul le multiplicateur est calculé',()=>assert.equal(calc({pp:250}).final,null));
test('zéro pourcentage de base est autorisé',()=>assert.equal(calc({pp:300,base:0}).final,0));
test('valeurs négatives refusées',()=>assert.equal(calc({pp:100,challenge:-1}),null));
test('base > 100 refusée',()=>assert.equal(calc({pp:100,base:101}),null));
test('PP sous 100 ne réduit pas le drop',()=>assert.equal(calc({pp:0}).prospection,1));
test('onglet accessible depuis Autres',()=>{const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert.match(html,/id="tabDrop"/);assert.match(html,/id="dropMode"/);assert.match(html,/js\/tools\/drop.js/)});
