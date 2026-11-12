const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'../dofus-craft.html'),'utf8');
test('selected loss uses red glow',()=>assert.match(html,/\.multi-choice-pill\.selected-loss\{[^}]*border:2px solid #f06a70[^}]*box-shadow:/));
test('initial decision pill uses loss class',()=>assert.match(html,/multiDecisionDisplay\(d,selected,e\.qty\)\.label==='Perte'\?'selected-loss':'winner'/));
test('live update colors selected craft loss red',()=>assert.match(html,/pills\[0\]\.classList\.toggle\('selected-loss',choice==='craft'&&isLoss\)/));
test('live update colors selected HDV loss red',()=>assert.match(html,/pills\[1\]\.classList\.toggle\('selected-loss',choice==='buy'&&isLoss\)/));
test('green only when selected choice is profitable',()=>assert.match(html,/pills\[0\]\.classList\.toggle\('winner',choice==='craft'&&!isLoss\)/));
