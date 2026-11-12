const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const paths=[...html.matchAll(/<script src="(js\/[^"]+)" defer><\/script>/g)].map(x=>x[1]);
if(paths.length!==11)throw Error('Scripts manquants');
for(const file of paths){new vm.Script(fs.readFileSync(path.join(root,file),'utf8'),{filename:file});}
new vm.Script(paths.map(file=>fs.readFileSync(path.join(root,file),'utf8')).join('\n'));
console.log(`${paths.length} scripts valides, syntaxe combinée valide.`);
