const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../js/tools/multicraft.js'),'utf8').split('const MultiSessions=')[1];
function app(store=new Map()){
 const ctx=vm.createContext({document:{},localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)}});vm.runInContext('const MultiSessions='+code,ctx);return {api:vm.runInContext('MultiSessions',ctx),store};
}
function state(){return {seq:50,items:[{id:-123,name:'Recette manuelle',image:'',qty:3,collapsed:true,nodes:[{uid:1,id:315,name:'Diamant',qty:2,detail:{recipe:[{item_ankama_id:314,quantity:3}]},expanded:true,children:[{uid:2,id:314,qty:3,name:'Pierre',detail:{recipe:[]},children:null}]}]}],strategy:'manual',overrides:{'-123':'craft'},inventory:{315:5},prices:{315:100}}}
test('session : instantané indépendant avec recettes composites, quantité, stratégie et possessions',()=>{
 const {api}=app(),original=state(),saved=api.capture(original);original.items[0].qty=9;original.items[0].nodes[0].children[0].qty=99;
 assert.equal(saved.items[0].qty,3);assert.equal(saved.items[0].nodes[0].children[0].qty,3);assert.equal(saved.items[0].nodes[0].expanded,true);assert.equal(saved.items[0].collapsed,true);assert.equal(saved.overrides[-123],'craft');assert.equal(saved.inventory[315],5);assert.equal('prices' in saved,false);
});
test('chargement hors ligne : identifiants renouvelés et prix actuels conservés',()=>{
 const {api}=app(),saved=api.capture(state()),current={...state(),seq:100,prices:{315:999}};
 api.restore(saved,current);assert.equal(current.items[0].nodes[0].uid,101);assert.equal(current.items[0].nodes[0].children[0].uid,102);assert.equal(current.prices[315],999);assert.equal(current.items[0].loading,false);assert.equal(current.items[0].nodes[0].detail.recipe[0].item_ankama_id,314);
 current.inventory[315]=1;assert.equal(saved.inventory[315],5);
});
test('recettes en chargement, erreurs et données invalides : session en cours protégée',()=>{
 const {api}=app();for(const kind of ['loading','error']){const s=state();s.items[0].nodes[0][kind]=true;assert.throws(()=>api.capture(s),/chargés/)}
 const current=state(),saved=api.capture(current);saved.items[0].qty=0;assert.throws(()=>api.restore(saved,current));assert.equal(current.items[0].qty,3);assert.equal(current.seq,50);
});
test('plusieurs sessions rechargées depuis le stockage ; une session corrompue ne masque pas les autres',()=>{
 const a=app(),records=[{id:'one',title:'Mon projet <test>',at:123,data:a.api.capture(state())},{id:'bad',title:'Corrompue',at:123,data:null}];a.api.write(records);const b=app(a.store),saved=b.api.read();assert.equal(saved.length,1);assert.equal(saved[0].title,'Mon projet <test>');assert.equal(saved[0].data.items[0].qty,3);
});
test('un refus du stockage est signalé sans faux succès de sauvegarde',()=>{
 const a=app();a.store.set=()=>{throw Error('QuotaExceeded')};assert.throws(()=>a.api.write([{id:'one'}]),/QuotaExceeded/);assert.equal(a.api.read().length,0);
});
