const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const paths=[...html.matchAll(/<script src="(js\/[^"]+)" defer><\/script>/g)].map(x=>x[1]);
if(paths.length!==14)throw Error('Scripts manquants');
for(const file of paths){new vm.Script(fs.readFileSync(path.join(root,file),'utf8'),{filename:file});}
new vm.Script(paths.map(file=>fs.readFileSync(path.join(root,file),'utf8')).join('\n'));
console.log(`${paths.length} scripts valides, syntaxe combinée valide.`);
for(const page of ['mais.html','gelano.html']){
 const markup=fs.readFileSync(path.join(root,page),'utf8');
 const games=[...markup.matchAll(/<script src="(js\/games\/[^\"]+)"(?: defer)?><\/script>/g)].map(m=>m[1]);
 if(games.length!==2)throw Error(`Scripts du mini-jeu manquants : ${page}`);
 for(const file of games)new vm.Script(fs.readFileSync(path.join(root,file),'utf8'),{filename:file});
 new vm.Script(games.map(file=>fs.readFileSync(path.join(root,file),'utf8')).join('\n'));
 console.log(`${page} : ${games.length} scripts valides.`);
}
