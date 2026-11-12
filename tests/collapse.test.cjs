const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const s=fs.readFileSync(require('node:path').join(__dirname,'..','dofus-craft.html'),'utf8');
test('multicraft: bouton de repli et état accessible',()=>{assert.match(s,/data-mcollapse/);assert.match(s,/aria-expanded/);assert.match(s,/function multiToggleCollapse/)});
test('multicraft: seul le détail des ingrédients est masqué',()=>{assert.match(s,/\.multi-entry\.is-collapsed \.multi-rows\{display:none\}/);assert.doesNotMatch(s,/\.multi-entry\.is-collapsed \.multi-choice\{display:none\}/)});
test('multicraft: footer de comparaison conservé',()=>{assert.match(s,/multiDecisionHTML\(e\)/);assert.match(s,/class=\"multi-rows\"/)});
test('multicraft: état de repli persiste entre les recalculs',()=>{assert.match(s,/e\.collapsed=!e\.collapsed/);assert.match(s,/e\.collapsed\?'is-collapsed'/)});
