const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../dofus-craft.html'),'utf8');
const code=html.slice(html.indexOf('function multiSelectionGain('),html.indexOf('function multiDecisionHTML('));
function gain(entries,choices){const ctx={multiEntryDecision:e=>e.d,multiDecisionDisplay:(d,choice,qty)=>{if(d.craft===null||d.buy===null)return {value:null,label:'Gain'};const cheaper=d.craft<=d.buy?'craft':'buy';return {value:Math.abs(d.craft-d.buy)*qty,label:choice===cheaper?'Gain':'Perte'}}};vm.createContext(ctx);vm.runInContext(code,ctx);return ctx.multiSelectionGain(entries,new Map(choices))}
test('somme des gains et pertes pondérée par quantités',()=>assert.equal(gain([{id:1,qty:2,d:{craft:100,buy:150}},{id:2,qty:3,d:{craft:100,buy:80}}],[['1','craft'],['2','craft']]),40));
test('perte nette négative',()=>assert.equal(gain([{id:1,qty:2,d:{craft:100,buy:150}}],[['1','buy']]),-100));
test('choix le moins cher donne gain positif',()=>assert.equal(gain([{id:1,qty:2,d:{craft:100,buy:150}}],[['1','craft']]),100));
test('égalité donne zéro',()=>assert.equal(gain([{id:1,qty:2,d:{craft:100,buy:100}}],[['1','buy']]),0));
test('prix manquant rend le bilan indisponible',()=>assert.equal(gain([{id:1,qty:1,d:{craft:null,buy:100}}],[['1','buy']]),null));
test('nouvelle case et suppression de la phrase',()=>{assert.match(html,/id="multiSelectionGain"/);assert.doesNotMatch(html,/Les choix craft\/achat dépendent uniquement des prix\. Indique tes possessions ici/);});
