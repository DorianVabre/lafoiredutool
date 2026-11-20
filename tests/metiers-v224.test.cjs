const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const XP=require('../js/tools/metiers-engine.js');

const root=path.join(__dirname,'..');
const jobsSource=fs.readFileSync(path.join(root,'js/tools/metiers.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');

test('XP métier : bornes exactes de cumul et conversion de niveau',()=>{
 for(let level=1;level<200;level++){
  assert.equal(XP.levelFromTotal(XP.cumulative(level)),level);
  assert.equal(XP.levelFromTotal(XP.cumulative(level+1)-1),level);
  assert.equal(XP.levelFromTotal(XP.cumulative(level+1)),level+1);
 }
 assert.equal(XP.levelFromTotal(0),1);
 assert.equal(XP.levelFromTotal(XP.cumulative(200)),200);
});

test('XP métier : les ratios API en fraction ou pourcentage donnent la même XP',()=>{
 assert.equal(XP.craftXpAt(161,161,.1),322);
 assert.equal(XP.craftXpAt(161,161,10),322);
 assert.equal(XP.craftXpAt(161,161,.05),161);
 assert.equal(XP.craftXpAt(145,145,.1),290);
 assert.equal(XP.craftXpAt(145,145,.05),145);
 assert.equal(XP.craftXpAt(161,161,.1,90),289);
 assert.equal(XP.craftXpAt(160,161,.1),0);
 assert.equal(XP.craftXpAt(201,100,1),0);
});

test('XP métier : ratios connus déduits du type d’objet',()=>{
 const ratio=type=>XP.recipeXpRatio({type:{name:{fr:type}}});
 assert.equal(ratio('Potion de conquête'),.1);
 assert.equal(ratio('Potion de téléportation'),.2);
 assert.equal(ratio('Trophée'),3);
 assert.equal(ratio('Clé'),.6);
 assert.equal(ratio('Alliage'),.3);
 assert.equal(ratio('Planche'),.2);
 assert.equal(ratio('Viande'),.1);
 assert.equal(ratio('Potion'),.05);
});

test('XP métier : ratio API prioritaire, type inconnu à zéro, sans exception par nom',()=>{
 assert.equal(XP.recipeXpRatio({experience_ratio:.12,type:'Inconnu'}),.12);
 assert.equal(XP.recipeXpRatio({experience_ratio:12,type:'Inconnu'}),.12);
 for(const [name,type] of [
  ['Philtre de longévité','Préparation'],
  ['Teinture orange sanguine','Teinture'],
  ['Bouteille de Gloutoburg','Boisson'],
  ["Larme d’Eniripsa",'Type inconnu']
 ])assert.equal(XP.recipeXpRatio({name,type:{name:{fr:type}}}),0,name);
 assert.equal(XP.craftXpAt(161,161,0),0);
 assert.equal(XP.craftsToTarget({level:161,ratio:0},170,XP.cumulative(161)),null);
});

test('objectif métier : 170, puis 180, puis 170 remplace le nombre de crafts',()=>{
 const item={id:42,level:160,ratio:1},recipes=[item],selected={},start=XP.cumulative(160);
 const to170=XP.goalQuantity(item,170,start,recipes,selected);
 assert.ok(to170>0);
 selected[item.id]=to170;
 const to180=XP.goalQuantity(item,180,start,recipes,selected);
 assert.ok(to180>to170);
 selected[item.id]=to180;
 const backTo170=XP.goalQuantity(item,170,start,recipes,selected);
 assert.equal(backTo170,to170);
 selected[item.id]=backTo170;
 assert.equal(selected[item.id],to170);
});

test('objectif métier : un autre batch sélectionné est conservé dans le calcul',()=>{
 const first={id:1,level:160,ratio:1},second={id:2,level:160,ratio:1},recipes=[first,second],selected={};
 selected[second.id]=3;
 const expectedStart=XP.cumulative(160)+3*XP.craftXpAt(160,160,1);
 assert.equal(XP.goalQuantity(first,170,XP.cumulative(160),recipes,selected),XP.craftsToTarget(first,170,expectedStart));
});

test('rentabilité métier : coût, marge, batch, prix manquants et prix nul',()=>{
 const parts=[{id:1,qty:2},{id:2,qty:3}],prices={1:100,2:200};
 assert.deepEqual(XP.priceAnalysis(parts,1000,prices),{complete:true,cost:800,margin:200,sell:1000});
 assert.equal(XP.priceAnalysis(parts,700,prices).margin,-100);
 assert.deepEqual(XP.batchValues(parts,4,1000,prices),{complete:true,cost:3200,revenue:4000,margin:800});
 assert.deepEqual(XP.priceAnalysis(parts,1000,{1:100}),{complete:false});
 assert.equal(XP.batchValues(parts,4,1000,{1:100}).margin,null);
 assert.equal(XP.priceAnalysis([{id:1,qty:1}],0,{1:0}).margin,0);
 assert.equal(XP.priceAnalysis([{id:1,qty:0}],100,{1:10}).complete,false);
});

test('pratique de récolte : XP par action, verrouillage et rendement moyen',()=>{
 assert.deepEqual(XP.gatheringEstimate(50,49,230,100,10),{xp:20,actions:null,units:null});
 assert.deepEqual(XP.gatheringEstimate(50,50,230,100,10),{xp:20,actions:12,units:120});
 assert.deepEqual(XP.gatheringEstimate(50,50,230,150,10),{xp:30,actions:8,units:80});
 assert.deepEqual(XP.gatheringEstimate(50,50,230,100),{xp:20,actions:12,units:null});
 assert.deepEqual(XP.gatheringEstimate(50,50,230,1,10),{xp:0,actions:null,units:null});
});

test('pratique d’élevage : captures fixes et reproductions selon la génération',()=>{
 const estimate=XP.breedingEstimate(1000);
 assert.deepEqual(estimate.capture,{xp:30,actions:34});
 assert.deepEqual(estimate.generations.slice(0,3),[
  {generation:1,xp:30,actions:34},{generation:2,xp:60,actions:17},{generation:3,xp:90,actions:12}
 ]);
 assert.deepEqual(XP.breedingEstimate(1000,150).generations[1],{generation:2,xp:90,actions:12});
 assert.deepEqual(XP.breedingEstimate(1000,1).capture,{xp:0,actions:null});
});

test('interface métier : XP totale par défaut, à gauche, et raccourcis recalculables',()=>{
 assert.match(jobsSource,/xpMode='total'/);
 assert.ok(jobsSource.indexOf('data-xp-card="total"')<jobsSource.indexOf('data-xp-card="level"'));
 assert.match(jobsSource,/goalQuantity\(item,target,currentTotal\(\),recipeLists\.get\(job\)\|\|\[\],selected/);
 assert.match(jobsSource,/if\(qty!==null\)\{selected\[item\.id\]=qty;drawRecipes\(\)\}/);
 assert.match(jobsSource,/goal\.qty!==null\?'':'disabled'/);
 assert.doesNotMatch(jobsSource,/selected\[item\.id\]\s*\+=\s*qty/);
 assert.match(jobsSource,/jobs-combine">Nombre<input/);
 assert.match(jobsSource,/JobsXpEngine\.gatheringEstimate\(/);
 assert.match(jobsSource,/JobsXpEngine\.breedingEstimate\(/);
 assert.match(jobsSource,/30 XP fixes par capture/);
 assert.match(jobsSource,/30 XP par niveau de génération/);
});

test('copie métier : nom de recette et ingrédients de la liste copiables, aperçu non copiable',()=>{
 assert.ok(index.indexOf('js/core/copy-names.js')<index.indexOf('js/tools/metiers-engine.js'));
 assert.match(jobsSource,/<b>'\+itemNameHTML\(item\.name\)\+'<\/b>/);
 assert.match(jobsSource,/<strong>'\+itemNameHTML\(part\.name\)\+'<\/strong>/);
 const previewStart=jobsSource.indexOf('const parts=recipeComponents(item),preview=');
 const previewEnd=jobsSource.indexOf(',profit=priceAnalysis(item)',previewStart);
 const preview=jobsSource.slice(previewStart,previewEnd);
 assert.match(preview,/esc\(part\.name\)/);
 assert.doesNotMatch(preview,/itemNameHTML/);
 assert.match(fs.readFileSync(path.join(root,'css/style.css'),'utf8'),/\.copy-name\{[^}]*text-decoration-style:dotted/);
});

test('catalogue recettes : demande seulement le champ recipe autorisé',()=>{
 assert.match(jobsSource,/fields\[item\]':'recipe'/);
 assert.doesNotMatch(jobsSource,/fields\[item\]':'recipe,type'/);
});
