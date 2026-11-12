const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../dofus-craft.html'),'utf8');
const js=html.slice(html.indexOf('function farmTotals('),html.indexOf('const farmItemIcon='));
function totals(activity,prices){const ctx={prices};vm.createContext(ctx);vm.runInContext(js,ctx);return ctx.farmTotals(activity)}
const activity={sessions:[{duration:1800000,counts:{'42':3,'43':2}},{duration:1800000,counts:{'42':1,'43':4}}]};
test('nouvel onglet et introduction',()=>{assert.match(html,/id="tabFarm"/);assert.match(html,/id="farmMode"/);assert.match(html,/farm:\{title:'Comparaison de farm'/)});
test('moyenne sur toutes les sessions en kamas par heure',()=>{const t=totals(activity,{'42':100,'43':200});assert.equal(t.ms,3600000);assert.equal(t.revenue,1600);assert.equal(t.kph,1600)});
test('prix manquant rend moyenne indisponible',()=>assert.equal(totals(activity,{'42':100}).kph,null));
test('zéro récompense ne nécessite aucun prix',()=>assert.equal(totals({sessions:[{duration:3600000,counts:{'42':0}}]},{}).kph,0));
test('aucune session = pas de kamas par heure',()=>assert.equal(totals({sessions:[]},{'42':100}).kph,null));
test('prix partagés avec les autres calculateurs',()=>assert.match(html,/localStorage\.setItem\('dofusdude-prices',JSON\.stringify\(prices\)\)/));
test('timer persistant en date absolue',()=>{assert.match(html,/startedAt:Date\.now\(\)/);assert.match(html,/FARM_TIMER_KEY/);assert.match(html,/farmElapsed\(farmRunning\)/)});
test('recherche DofusDude et récompenses sélectionnées',()=>{assert.match(html,/\/items\/search\?/);assert.match(html,/farmDraft\.push/);assert.match(html,/data-farm-count/)});
test('tri par kamas heure et sessions',()=>{assert.match(html,/value="profit"/);assert.match(html,/value="sessions"/);assert.match(html,/farmTotals\(b\)\.kph/)});
test('protection contre la suppression de la session active',()=>assert.match(html,/data-farm-delete="\$\{esc\(activity\.id\)\}" \$\{running\?'disabled'/));
