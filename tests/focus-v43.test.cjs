const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'../dofus-craft.html'),'utf8');
test('unitaire ne détruit pas le champ lors du passage au suivant',()=>assert.ok(html.includes("relatedTarget?.matches?.('#nodeList input')")));
test('multicraft ne détruit pas le champ lors du passage au suivant',()=>assert.ok(html.includes("relatedTarget?.matches?.('#multiSelected input')")));
test('pas de rerender sur change de prix multicraft',()=>assert.ok(!/el\.onblur=multiRender;el\.onchange=multiRender/.test(html)));
