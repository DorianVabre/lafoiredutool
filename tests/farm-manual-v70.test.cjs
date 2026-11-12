const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');const html=fs.readFileSync(require('node:path').join(__dirname,'../dofus-craft.html'),'utf8');
test('boutons déclaration manuelle',()=>{assert.doesNotMatch(html,/data-farm-manual/);assert.match(html,/id="farmManualHere"/)});
test('formulaire date et durée',()=>{assert.match(html,/id="farmManualForm"/);for(const n of ['hours','minutes','seconds'])assert.match(html,new RegExp('name="'+n+'"'))});
test('durée positive et quantités entières',()=>{assert.match(html,/duration<=0/);assert.match(html,/Number.isSafeInteger\(n\)/)});
test('sessions manuelles sauvegardées',()=>{assert.match(html,/activity.sessions.push\(\{id:farmId\(\),date:new Date\(\).toISOString\(\),duration,counts\}\)/);assert.match(html,/farmSave\(\);farmManualOpen=false;farmRender\(\)/)});
test('annulation',()=>assert.match(html,/farmManualCancel.*onclick/));
