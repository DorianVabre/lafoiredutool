const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../dofus-craft.html'),'utf8');
const js=html.slice(html.indexOf('function multiOptimalGain('),html.indexOf('function multiDecisionHTML('));
function gain(items){const ctx={multiEntryDecision:e=>e.d,multiDecisionDifference:(d,q)=>d.craft===null||d.buy===null?null:Math.abs(d.buy-d.craft)*q};vm.createContext(ctx);vm.runInContext(js,ctx);return ctx.multiOptimalGain(items)}
test('gain optimal = somme des meilleurs écarts pondérés',()=>assert.equal(gain([{qty:2,d:{craft:100,buy:150}},{qty:3,d:{craft:120,buy:80}}]),220));
test('gain optimal identique même si sélection manuelle plus chère',()=>assert.equal(gain([{qty:2,d:{craft:100,buy:150},choice:'buy'}]),100));
test('gain optimal 0 si égalité',()=>assert.equal(gain([{qty:1,d:{craft:50,buy:50}}]),0));
test('gain optimal indisponible si prix manquant',()=>assert.equal(gain([{qty:1,d:{craft:null,buy:50}}]),null));
test('dropdown auto ne se remplace pas par le choix calculé',()=>assert.doesNotMatch(html,/select\.value=choice/));
test('gain optimisation indépendant des possessions',()=>{const block=html.slice(html.indexOf('function multiOptimalGain('),html.indexOf('function multiDecisionHTML('));assert.doesNotMatch(block,/inventory|shopping|multiChoiceFor/);});
