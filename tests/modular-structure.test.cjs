const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script src="(js\/[^"]+)" defer><\/script>/g)].map(m=>m[1]);
test('onze scripts chargés dans un ordre stable',()=>assert.deepEqual(scripts,['js/core/state.js','js/core/api.js','js/core/prices.js','js/tools/craft.js','js/tools/multicraft.js','js/tools/historique.js','js/tools/brisage.js','js/tools/parchotage.js','js/tools/farm.js','js/tools/forgemagie.js','js/tools/drop.js']));
test('ressources locales présentes et HTML sans script monolithique',()=>{assert.match(html,/href="css\/style.css"/);assert.doesNotMatch(html,/<script>\s*const BASE/);for(const file of ['css/style.css',...scripts])assert.ok(fs.statSync(path.join(root,file)).size>0,file)});
test('clés de sauvegarde historiques préservées',()=>{const code=scripts.map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');for(const key of ['dofusdude-prices','dofusdude-item-fields','dofusdude-purchase-ledger-v1','la-foire-du-tool-farm-v1','dofus-fm-rune-prices-v1'])assert.ok(code.includes(key),key)});
test('mutualisation des helpers sans doublons',()=>{const code=scripts.map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');for(const name of ['get','subtype','isPrice'])assert.equal((code.match(new RegExp('(?:async )?function '+name+'\\(','g'))||[]).length,1,name)});
