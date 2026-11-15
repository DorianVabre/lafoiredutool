const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const E=require('../js/games/concasseur-engine.js'),root=path.join(__dirname,'..');
function seed(initial=123){let value=initial;return ()=>{value=(value*1664525+1013904223)>>>0;return value/4294967296}}
function state(){const s=E.create(seed());s.notes=[];return s}
function note(id,item='strigide',at=1000,lane=0){return {id,item,cat:item==='chacha',at,lane,travel:1800,done:false}}
test('chaque équipement conserve sa colonne ; les Chachas restent possibles sur les cinq pistes',()=>{
 const notes=E.chart(seed());for(const n of notes)if(!n.cat)assert.equal(n.item,E.ITEMS[n.lane].id);
 assert.equal(new Set(notes.filter(n=>n.cat).map(n=>n.lane)).size,5);
 for(let lane=0;lane<5;lane++)assert.ok(notes.some(n=>!n.cat&&n.lane===lane));
});
test('partition dense : cinq pistes, accords, chats, progression et pas de doublon impossible sur une piste',()=>{
 const notes=E.chart(seed()),last=Array(5).fill(-Infinity);assert.ok(notes.length>250);assert.ok(notes.some(n=>n.cat));assert.ok(notes.some((n,i)=>i&&n.at===notes[i-1].at));
 for(const n of notes){assert.ok(n.lane>=0&&n.lane<5);assert.ok(n.at>=n.travel);assert.ok(n.at<=E.DURATION-1200);assert.ok(n.at-last[n.lane]>=400);last[n.lane]=n.at}
 assert.ok(notes.filter(n=>n.at>40000).length/20>notes.filter(n=>n.at<20000).length/20);
});
test('frappe parfaite : score, combo et consommation unique de l’objet',()=>{
 const s=state();s.notes=[note(1)];E.advance(s,1000);const result=E.hit(s,0);assert.equal(result.kind,'perfect');assert.equal(result.points,125);assert.equal(s.score,125);assert.equal(s.hits,1);assert.equal(s.combo,1);
 E.hit(s,0);assert.equal(s.hits,1);assert.equal(s.score,100);assert.equal(s.combo,0);
});
test('fenêtres de timing : parfait, bon, juste et hors zone, avant comme après le cercle',()=>{
 for(const [offset,quality] of [[0,'perfect'],[-45,'perfect'],[45,'perfect'],[-46,'good'],[95,'good'],[96,'late'],[-140,'late'],[140,'late'],[-141,'empty']]){
  const s=state();s.notes=[note(1)];E.advance(s,1000+offset);assert.equal(E.hit(s,0).kind,quality,offset);
 }
});
test('coefficients : répétition pénalisée, autres objets restaurés et score dépendant du coefficient au moment du coup',()=>{
 const s=state();s.notes=[note(1),note(2,'strigide',2000),note(3,'comte',3000)];E.advance(s,1000);E.hit(s,0);assert.equal(s.coefficients.strigide,76);assert.equal(s.coefficients.comte,107);
 E.advance(s,2000);const result=E.hit(s,0);assert.equal(result.coefficient,76);assert.equal(result.points,95);assert.equal(s.coefficients.strigide,52);
 E.advance(s,3000);E.hit(s,0);assert.equal(s.coefficients.strigide,59);assert.equal(s.coefficients.comte,90);
});
test('plancher et plafond des coefficients et multiplicateur plafonné',()=>{
 const s=state();for(let i=0;i<100;i++){s.notes=[note(i,'strigide',i*300+1000)];E.advance(s,i*300+1000);E.hit(s,0)}
 assert.equal(s.coefficients.strigide,20);assert.equal(s.coefficients.comte,220);assert.equal(s.maxCombo,100);assert.equal(s.combo,100);
 s.notes=[note(101,'comte',32000)];E.advance(s,32000);assert.equal(E.hit(s,0).multiplier,3);
});
test('Chacha : pénalité, série cassée, aucun coefficient modifié ; un chat évité ne pénalise pas',()=>{
 const s=state();s.score=1000;s.combo=15;s.notes=[note(1,'chacha')];E.advance(s,1000);const before={...s.coefficients};assert.equal(E.hit(s,0).kind,'cat');assert.equal(s.score,750);assert.equal(s.combo,0);assert.equal(s.cats,1);assert.deepEqual(s.coefficients,before);
 s.notes=[note(2,'chacha',2000)];E.advance(s,2200);assert.equal(s.score,750);assert.equal(s.avoided,1);
});
test('objets ratés : pénalité unique et invariance aux fréquences de rendu',()=>{
 const a=state(),b=state();a.score=b.score=500;a.notes=[note(1),note(2,'comte',2000)];b.notes=[note(1),note(2,'comte',2000)];
 for(let time=0;time<2500;time+=16)E.advance(a,time);E.advance(b,2500);assert.equal(a.score,380);assert.equal(a.score,b.score);assert.equal(a.misses,2);E.advance(a,3000);assert.equal(a.misses,2);
});
test('accords et choix de la note la plus proche sur la bonne piste',()=>{
 const s=state();s.notes=[note(1,'strigide',1000,0),note(2,'comte',1000,1),note(3,'frizz',1200,0)];E.advance(s,1110);
 assert.equal(E.hit(s,0).note.id,3);assert.equal(E.hit(s,1).note.id,2);assert.equal(s.notes[0].done,false);
});
test('fin de partie : plus aucune frappe, score jamais négatif et précision calculée sur les actions',()=>{
 const s=state();E.hit(s,0);assert.equal(s.score,0);assert.equal(s.empty,1);s.notes=[note(1)];E.advance(s,1000);E.hit(s,0);assert.equal(E.accuracy(s),50);E.advance(s,E.DURATION);assert.equal(s.phase,'finished');const score=s.score;assert.equal(E.hit(s,0),null);assert.equal(s.score,score);
});
test('redémarrage : toutes les statistiques et tous les coefficients repartent de zéro',()=>{
 const a=E.create(seed()),b=E.create(seed());a.coefficients.comte=20;a.score=999;a.notes[0].done=true;assert.equal(b.score,0);assert.equal(b.combo,0);assert.equal(b.coefficients.comte,100);assert.equal(b.notes[0].done,false);
});
test('page autonome : deux scripts, visuels locaux valides, commandes accessibles et retour au brisage',()=>{
 const html=fs.readFileSync(path.join(root,'concasseur.html'),'utf8');assert.equal((html.match(/data-lane="/g)||[]).length,5);assert.match(html,/href="index.html#break"/);
 for(const item of [...E.ITEMS,E.CAT])assert.equal(fs.readFileSync(path.join(root,E.image(item.id))).subarray(1,4).toString(),'PNG');
 for(const match of html.matchAll(/(?:src|href)="((?:js|css|data)\/[^\"]+)"/g))assert.ok(fs.existsSync(path.join(root,match[1])),match[1]);
});
