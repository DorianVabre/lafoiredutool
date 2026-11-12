/* Logique de déplacement partagée et testable, coordonnées en pixels. */
(function(root){'use strict';
const SPEED=240; // vitesse identique en pixels par seconde pour les deux personnages
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function moveTowards(from,to,step){const d=distance(from,to);if(d<=step||d===0)return {x:to.x,y:to.y};const t=step/d;return {x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t}}
function clampPoint(point,w,h,pad=25){return {x:Math.max(pad,Math.min(w-pad,point.x)),y:Math.max(pad,Math.min(h-pad,point.y))}}
const api={SPEED,distance,moveTowards,clampPoint};if(typeof module==='object'&&module.exports)module.exports=api;root.MaisEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
