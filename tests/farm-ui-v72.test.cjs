const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'../dofus-craft.html'),'utf8');
const manual=html.slice(html.indexOf('function farmRenderManualSession(){'),html.indexOf('function farmRenderSession(){'));
test('description textarea themed',()=>assert.match(html,/\.farm-create textarea\{background:#101b14/));
test('manual session has no date picker',()=>assert.doesNotMatch(manual,/name="date"/));
test('manual session defaults to 1h',()=>{assert.match(manual,/name="hours"[^>]*value="1"/);assert.match(manual,/name="minutes"[^>]*value="0"/)});
test('manual session uses current date',()=>assert.match(manual,/date:new Date\(\)\.toISOString\(\)/));
test('history displays date only',()=>assert.match(html,/new Date\(session\.date\)\.toLocaleDateString\('fr-FR'\)/));
test('manual duration has three columns',()=>assert.match(html,/\.farm-manual-duration\{display:grid;grid-template-columns:repeat\(3/));
