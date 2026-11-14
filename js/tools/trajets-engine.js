// Coût uniforme : un parcours en largeur donne les mêmes distances que Dijkstra.
// Les identifiants de zone restent distincts, même sur une seule carte.
const DofusRoutes=(()=>{
 // Un script classique se charge aussi depuis file://, contrairement à fetch(JSON).
 function loadData(doc,host=globalThis){
  if(host.LAFOIRE_TRAVEL_DATA?.version==='3.7.13.17')return Promise.resolve(host.LAFOIRE_TRAVEL_DATA);
  return new Promise((resolve,reject)=>{
   const script=doc.createElement('script');script.src='data/trajets-3.7.13.17.js';script.async=true;
   script.onload=()=>{script.remove();if(host.LAFOIRE_TRAVEL_DATA?.version==='3.7.13.17')resolve(host.LAFOIRE_TRAVEL_DATA);else reject(Error('Le fichier des trajets est incomplet ou incompatible.'))};
   script.onerror=()=>{script.remove();reject(Error('Le fichier des trajets est introuvable. Vérifie que le dossier data accompagne index.html.'))};
   doc.head.append(script);
  });
 }
 function parseCoordinates(value){
  const match=String(value).trim().replace(/[−–]/g,'-').match(/^(?:\[\s*(-?\d+)\s*[,;]\s*(-?\d+)\s*\]|(-?\d+)\s*[,;\s]\s*(-?\d+))$/);
  if(!match)return null;
  const x=Number(match[1]??match[3]),y=Number(match[2]??match[4]);
  return Number.isSafeInteger(x)&&Number.isSafeInteger(y)?{x,y}:null;
 }
 function create(data){
  if(data.schema!==1||!Array.isArray(data.nodes)||!Array.isArray(data.links)||data.links.length%2||!Array.isArray(data.zaaps))throw Error('Données de trajet incompatibles.');
  const nodes=data.nodes,reverse=Array.from({length:nodes.length},()=>[]),coordinates=new Map();
  const manual=new Set();
  for(let i=0;i<data.links.length;i+=2){
   const from=data.links[i],to=data.links[i+1];
   if(!Number.isInteger(from)||!Number.isInteger(to)||!nodes[from]||!nodes[to])throw Error('Passage de carte invalide.');
   reverse[to].push(from);
  }
  for(let i=0;i<(data.interactive||[]).length;i+=2)manual.add(data.interactive[i]+':'+data.interactive[i+1]);
  nodes.forEach((n,i)=>{if(n[0]===0)return;const key=n[2]+':'+n[3]+':'+n[4];if(!coordinates.has(key))coordinates.set(key,[]);coordinates.get(key).push(i)});
  for(const z of data.zaaps)if(!nodes[z.node])throw Error('Zaap invalide.');
  function candidates(x,y,world=1){return (coordinates.get(world+':'+x+':'+y)||[]).slice()}
  function search(target,excluded=new Set()){
   const targets=Array.isArray(target)?target:[target];
   if(!targets.length||targets.some(t=>!Number.isInteger(t)||!nodes[t]))throw Error('Destination invalide.');
   const distance=new Int32Array(nodes.length).fill(-1),next=new Int32Array(nodes.length).fill(-1),queue=new Int32Array(nodes.length);
   let head=0,tail=0;
   for(const t of targets)if(distance[t]===-1){queue[tail++]=t;distance[t]=0}
   while(head<tail){const u=queue[head++];for(const v of reverse[u])if(distance[v]===-1){distance[v]=distance[u]+1;next[v]=u;queue[tail++]=v}}
   const options=data.zaaps.filter(z=>!excluded.has(nodes[z.node][0])&&distance[z.node]>=0).map(z=>({...z,steps:distance[z.node]})).sort((a,b)=>a.steps-b.steps||a.name.localeCompare(b.name,'fr')||a.node-b.node);
   function route(start){
    if(!Number.isInteger(start)||!nodes[start]||distance[start]<0)return null;
    const path=[start];let interactions=0;
    while(distance[path[path.length-1]]!==0){const from=path[path.length-1],to=next[from];if(to<0||path.length>nodes.length)throw Error('Trajet invalide.');if(manual.has(from+':'+to))interactions++;path.push(to)}
    return {path,interactions};
   }
   return {options,route};
  }
  return {data,candidates,search};
 }
 return {parseCoordinates,create,loadData};
})();
