const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const html=fs.readFileSync(require('node:path').join(__dirname,'../dofus-craft.html'),'utf8');
test('gain est vert si le choix est le moins cher',()=>assert.match(html,/selected===cheaper\?\{label:'Gain',value:difference,css:'craft-saving'\}/));
test('gain nul est neutre',()=>assert.match(html,/\.multi-choice-pill\.multi-difference\.even\{color:#d4e2d1\}/));
test('ancienne couleur orange absente du gain',()=>assert.doesNotMatch(html,/multi-difference\.buy-saving\{color:#ffd3a2/));
