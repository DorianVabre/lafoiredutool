const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),ctx=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'js/tools/trajets-engine.js'),'utf8'),ctx);
const api=vm.runInContext('DofusRoutes',ctx),data=JSON.parse(fs.readFileSync(path.join(root,'data/trajets-3.7.13.17.json'),'utf8')),engine=api.create(data);
test('coordonnées collées : crochets, virgule, espaces, signes et point-virgule',()=>{for(const s of ['[-6,-3]','-6,-3','-6 -3',' -6   -3 ','−6;−3'])assert.equal(JSON.stringify(api.parseCoordinates(s)),'{"x":-6,"y":-3}');for(const s of ['','1','1.5,2','[1,2','1,2]','1,2,3','/travel 1,2','1e3,2','9007199254740993,2'])assert.equal(api.parseCoordinates(s),null,s)});
test('graphe orienté : pas de passage inventé, filtre des zaaps et destination déjà atteinte',()=>{
 const tiny=api.create({schema:1,nodes:[[10,1,1,0,0,0],[20,1,1,1,0,0],[30,1,1,2,0,0],[40,1,1,0,0,0]],links:[0,1,1,2],zaaps:[{node:0,name:'Départ'},{node:2,name:'Arrivée'}]});
 assert.equal(tiny.candidates(0,0).length,2);assert.equal(tiny.search(2).options[0].steps,0);
 assert.equal(tiny.search(2,new Set([30])).options[0].steps,2);assert.deepEqual(Array.from(tiny.search(2).route(0).path),[0,1,2]);
 assert.equal(tiny.search(0,new Set([10])).options.length,0);assert.equal(tiny.search(3).options.length,0);
});
test('trajets réels précédemment essayés : distances et commandes attendues',()=>{
 for(const [x,y,zx,zy,steps] of [[-4,0,-2,0,2],[5,-20,5,-18,4],[10,10,5,7,8],[-29,-54,-31,-56,4]]){
  const ids=engine.candidates(x,y);assert.equal(ids.length,1);const r=engine.search(ids[0]),best=r.options[0],node=data.nodes[best.node];assert.equal(best.steps,steps);assert.deepEqual(node.slice(3,5),[zx,zy]);assert.equal(r.route(best.node).path.length,steps+1);
 }
});
test('[-6,-3] conserve deux portions avec les distances du prototype',()=>{
 const ids=engine.candidates(-6,-3);assert.equal(ids.length,2);assert.deepEqual(Array.from(ids,i=>engine.search(i).options[0].steps).sort((a,b)=>a-b),[16,20]);
 for(const i of ids){const best=engine.search(i).options[0];assert.deepEqual(data.nodes[best.node].slice(3,5),[-16,1])}
});
test('plusieurs destinations : chaque zaap rejoint son accès le plus court, même si le premier est inaccessible',()=>{
 const tiny=api.create({schema:1,nodes:Array.from({length:7},(_,i)=>[i+10,1,1,i,0,0]),links:[0,2,2,3,3,4,0,5,1,4],zaaps:[{node:0,name:'A'},{node:1,name:'B'}]});
 const result=tiny.search([6,4,5,5]);
 assert.deepEqual(Array.from(result.options,z=>[z.name,z.steps]),[['A',1],['B',1]]);
 assert.deepEqual(Array.from(result.route(0).path),[0,5]);assert.deepEqual(Array.from(result.route(1).path),[1,4]);
 assert.equal(tiny.search([4,5],new Set([10])).options[0].name,'B');
 assert.throws(()=>tiny.search([]),/Destination invalide/);assert.throws(()=>tiny.search([4,-1]),/Destination invalide/);
});
test('coordonnées ambiguës réelles : chaque alternative conserve la distance minimale de tous les accès',()=>{
 for(const [x,y] of [[-6,-3],[-54,16]]){
  const ids=engine.candidates(x,y),result=engine.search(ids),individual=ids.map(i=>engine.search(i));
  const minima=new Map();
  for(const r of individual)for(const z of r.options)minima.set(z.node,Math.min(minima.get(z.node)??Infinity,z.steps));
  assert.equal(result.options.length,minima.size);
  for(const z of result.options){assert.equal(z.steps,minima.get(z.node));const route=result.route(z.node);assert.equal(route.path.length,z.steps+1);assert.ok(ids.includes(route.path.at(-1)))}
  if(x===-6)assert.equal(result.options[0].steps,16);
 }
});
test('plusieurs cartes, monde différent, destination absente et tous les zaaps exclus',()=>{
 assert.equal(engine.candidates(-54,16).length,7);assert.equal(engine.candidates(-4,0,999).length,0);assert.equal(engine.candidates(99999,99999).length,0);
 const blocked=new Set(data.zaaps.map(z=>data.nodes[z.node][0]));assert.equal(engine.search(engine.candidates(-4,0)[0],blocked).options.length,0);
});
test('distances vérifiées contre un BFS indépendant depuis les 46 zaaps et chemins orientés',()=>{
 const fwd=Array.from({length:data.nodes.length},()=>[]);for(let i=0;i<data.links.length;i+=2)fwd[data.links[i]].push(data.links[i+1]);
 const distance=new Map(),queue=[];for(const z of data.zaaps){distance.set(z.node,0);queue.push(z.node)}
 for(let head=0;head<queue.length;head++)for(const v of fwd[queue[head]])if(!distance.has(v)){distance.set(v,distance.get(queue[head])+1);queue.push(v)}
 for(let target=0;target<data.nodes.length;target+=113){const result=engine.search(target),best=result.options[0];assert.equal(Boolean(best),distance.has(target));if(best){assert.equal(best.steps,distance.get(target));const route=result.route(best.node).path;assert.equal(route.at(-1),target);for(let i=1;i<route.length;i++)assert.ok(fwd[route[i-1]].includes(route[i]))}}
});
test('les passages interactifs sont signalés et les zaaps absents du graphe refusés',()=>{
 const tiny=api.create({schema:1,nodes:[[1,1,1,0,0,0],[2,1,1,1,0,0]],links:[0,1],interactive:[0,1],zaaps:[{node:0,name:'Zaap'}]});assert.equal(tiny.search(1).route(0).interactions,1);
 assert.throws(()=>api.create({schema:1,nodes:[],links:[],zaaps:[{node:1}]}));
});
test('navigation : historique dans Rentabilité, ordre demandé, trajet dans Autres',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),groups=[...html.matchAll(/<div class="mode-group"><div class="mode-group-title">([^<]+)<\/div><div class="mode-group-links">([\s\S]*?)<\/div><\/div>/g)];
 const ids=name=>[...groups.find(g=>g[1]===name)[2].matchAll(/id="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(ids('Rentabilité'),['tabFarm','tabLedger','tabBreak']);assert.deepEqual(ids('Autres'),['tabTravel','tabDrop']);
 assert.equal((html.match(/id="tabLedger"/g)||[]).length,1);
});
