const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../js/games/concasseur.js'),'utf8');
function setup(){
 const hits=[],ctx=vm.createContext({heldKeys:new Set(),mode:'playing',strike:lane=>hits.push(lane),pause(){ctx.mode='paused'},resume(){ctx.mode='playing'}});
 const start=source.indexOf('function handleGameKey('),end=source.indexOf("document.addEventListener('keydown',handleGameKey)",start);vm.runInContext(source.slice(start,end),ctx);
 function press(code,extra={}){const event={code,target:{closest:()=>null},preventDefault(){this.prevented=true},...extra};ctx.handleGameKey(event);return event}
 return {ctx,hits,press};
}
test('les cinq touches restent prioritaires pendant la partie, même avec le focus sur le son',()=>{
 const a=setup();for(const code of ['KeyD','KeyF','Space','KeyJ','KeyK'])assert.equal(a.press(code,{target:{closest:()=>({id:'soundToggle'})}}).prevented,true);
 assert.deepEqual(a.hits,[0,1,2,3,4]);
});
test('Espace maintenu : empêcher le clic natif et le défilement sans multiplier les frappes',()=>{
 const a=setup();a.press('Space');assert.equal(a.press('Space',{repeat:true}).prevented,true);assert.deepEqual(a.hits,[2]);
 a.press('Escape');assert.equal(a.ctx.mode,'paused');assert.equal(a.press('Space').prevented,undefined);a.press('KeyP');assert.equal(a.ctx.mode,'playing');
});
test('cliquer sur le son rend le focus au jeu pendant la partie et le décompte',()=>{
 let click,focus=0;const button={addEventListener:(_,cb)=>click=cb,setAttribute(){}};
 const ctx=vm.createContext({$:()=>button,mode:'playing',muted:false,master:null,initAudio(){},board:{focus:options=>{assert.equal(options.preventScroll,true);focus++}}});
 vm.runInContext(source.split('\n').find(line=>line.includes("$('soundToggle').addEventListener('click'")),ctx);
 click();assert.equal(focus,1);assert.equal(ctx.muted,true);ctx.mode='countdown';click();assert.equal(focus,2);ctx.mode='paused';click();assert.equal(focus,2);
});
