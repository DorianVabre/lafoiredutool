const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../dofus-craft.html'),'utf8');
test('only minor runes selected for breaking',()=>assert.match(html,/breakRuneGroups\(detail\)\.map\(group=>\[group\[0\]\]\)/));
test('compact table has quantity and price columns',()=>{assert.match(html,/class="break-grid break-compact"/);assert.match(html,/<th>Obtenues<\/th><th>Prix unitaire \(K\)<\/th>/)});
test('no Pa/Ra columns in breaking table',()=>assert.doesNotMatch(html,/<th>Mineure<\/th><th>Moyenne<\/th>/));
test('icons are optional and loaded from resources',()=>{assert.match(html,/\/items\/resources\/search\?/);assert.match(html,/data-rune-icon/);assert.match(html,/breakIconCache/)});
test('per-rune cost and quantity remain',()=>{assert.match(html,/data-bqty/);assert.match(html,/data-bprice/);assert.match(html,/data-btotal/)});
