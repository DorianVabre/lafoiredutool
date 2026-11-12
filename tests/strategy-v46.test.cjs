const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../dofus-craft.html'),'utf8');
const functions=html.slice(html.indexOf('function multiChoiceFor('),html.indexOf('function multiDecisionHTML('));
function setup(){const multi={strategy:'auto',overrides:{},items:[{id:1},{id:2}]};const radios=['auto','manual','craft','buy'].map(value=>({value,checked:false}));const ctx={multi,document:{querySelectorAll:()=>radios},multiCalculate:()=>{}};vm.createContext(ctx);vm.runInContext(functions,ctx);return {ctx,multi,radios}}
test('radio manuel entre auto et craft',()=>assert.match(html,/value="auto" checked>[\s\S]*?value="manual"[\s\S]*?value="craft"/));
test('tout crafter force tous les choix',()=>{const {ctx}=setup();ctx.multiSetStrategy('craft');assert.equal(ctx.multiChoiceFor(1),'craft');assert.equal(ctx.multiChoiceFor(2),'craft')});
test('tout acheter force tous les choix',()=>{const {ctx}=setup();ctx.multiSetStrategy('buy');assert.equal(ctx.multiChoiceFor(1),'buy');assert.equal(ctx.multiChoiceFor(2),'buy')});
test('changement individuel passe en manuel en conservant les autres choix',()=>{const {ctx,multi,radios}=setup();ctx.multiSetStrategy('craft');ctx.multiSetItemChoice('1','buy');assert.equal(multi.strategy,'manual');assert.equal(ctx.multiChoiceFor(1),'buy');assert.equal(ctx.multiChoiceFor(2),'craft');assert.equal(radios.find(r=>r.value==='manual').checked,true)});
test('choix auto en mode manuel possible',()=>{const {ctx}=setup();ctx.multiSetStrategy('buy');ctx.multiSetItemChoice('1','auto');assert.equal(ctx.multiChoiceFor(1),'auto');assert.equal(ctx.multiChoiceFor(2),'buy')});
test('retour optimisation efface les choix forcés',()=>{const {ctx}=setup();ctx.multiSetStrategy('craft');ctx.multiSetItemChoice('1','buy');ctx.multiSetStrategy('auto');assert.equal(ctx.multiChoiceFor(1),'auto');assert.equal(ctx.multiChoiceFor(2),'auto')});
