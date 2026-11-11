const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
function boot(storage=new Map()){
 const elements=new Map(),events={},docEvents={}; let frame;
 const ctx=new Proxy({measureText:t=>({width:String(t).length*8}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})}, {get:(o,k)=>k in o?o[k]:()=>{}});
 const el=id=>{if(!elements.has(id))elements.set(id,{id,style:{},className:'',textContent:'',innerHTML:'',addEventListener(k,fn){this[k]=fn},getContext:()=>ctx,focus(){}});return elements.get(id)};
 const sandbox={console,Math,Set,Uint8Array,ArrayBuffer,JSON,innerWidth:1280,innerHeight:800,devicePixelRatio:1,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},document:{hidden:false,getElementById:el,addEventListener(k,fn){docEvents[k]=fn}},addEventListener(k,fn){(events[k]??=[]).push(fn)},requestAnimationFrame:fn=>{frame=fn},setTimeout:()=>0,clearTimeout(){}};
 sandbox.window=sandbox; sandbox.globalThis=sandbox;
 vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace('void {S,','globalThis.game={S,'),sandbox);
 return {game:sandbox.game,storage,el,sandbox,step(t){frame(t)},event(k,e={}){for(const f of events[k]||[])f(e)},visibility(){docEvents.visibilitychange?.()},click(id){el(id).click?.({target:el(id)})}};
}
test('saving captures the active job, clock and earnings',()=>{
 const b=boot(); b.game.close();b.game.S.min=125;b.game.S.rep=321;b.game.S.cash=212;b.game.go.job('line');
 b.event('pagehide'); const save=JSON.parse(b.storage.get('problemSolverSave'));
 assert.equal(save.S.min,125);assert.equal(save.S.rep,321);assert.equal(save.S.cash,212);assert.equal(save.S.scene,'puzzle');assert.ok(save.runtime.P);
 const reload=boot(b.storage);reload.game.close();assert.equal(reload.game.S.min,125);assert.equal(reload.game.S.rep,321);assert.equal(reload.game.S.scene,'puzzle');assert.equal(reload.game.P.kind,'line');
});
test('pause freezes the timer and resume continues it',()=>{
 const b=boot();b.game.close();b.game.go.job('charge');b.step(1000);b.step(1050);
 b.event('keydown',{key:'Escape',preventDefault(){}});const time=b.game.S.min;b.step(1100);b.step(1150);assert.equal(b.game.S.min,time);assert.equal(b.el('pausePanel').hidden,false);
 b.click('resumeGame');b.step(1200);assert.ok(b.game.S.min>time);
});
test('every repair puzzle survives reload and remains playable',()=>{
 for(const kind of ['line','wire','leak','charge','braze','duct','seq']){
  const b=boot();b.game.close();b.game.go.job(kind);b.event('pagehide');
  const r=boot(b.storage);r.game.close();assert.equal(r.game.P.kind,kind);r.step(1000);r.step(1050);
  if(kind==='line'){const l=r.game.lay();r.game.tap(l.gx+l.cs/2,l.gy+l.cs/2);r.step(1100)}
 }
});
test('coffee and garage micro-games restore their continuation',()=>{
 const b=boot();b.game.close();b.event('pagehide');let r=boot(b.storage);r.game.close();r.step(1000);for(let t=1050;t<=3000;t+=50)r.step(t);r.game.mdone(true);for(let t=3050;t<=6000;t+=50)r.step(t);assert.equal(r.game.S.scene,'radio');
 r.game.close();r.game.go.garage();r.event('pagehide');r=boot(r.storage);r.game.close();r.step(1000);for(let t=1050;t<=3000;t+=50)r.step(t);r.game.mdone(true);for(let t=3050;t<=6000;t+=50)r.step(t);assert.equal(r.game.S.gar.i,1);assert.equal(r.game.S.gar.w,1);
});
test('dialog choices and shop purchases survive reload without duplicate rewards',()=>{
 let b=boot();b.game.close();b.game.go.event(0);b.event('pagehide');b=boot(b.storage);b.game.close();assert.equal(b.game.S.scene,'event');b.game.close();const rep=b.game.S.rep;b.event('pagehide');b=boot(b.storage);b.game.close();assert.equal(b.game.S.rep,rep);b.game.close();assert.equal(b.game.S.scene,'radio');
 b.game.go.shop();b.game.buy('tires');const cash=b.game.S.cash;b.event('pagehide');b=boot(b.storage);b.game.close();assert.equal(b.game.U.tires,1);assert.equal(b.game.S.cash,cash);b.game.close();assert.equal(b.game.S.scene,'radio');
});
test('save and quit resumes the same activity and sound preferences persist',()=>{
 const b=boot();b.game.close();b.game.go.fish();b.game.F.t=33;b.event('keydown',{key:'Escape',preventDefault(){}});b.el('soundEnabled').checked=false;b.el('soundEnabled').change();b.el('soundVolume').value=25;b.el('soundVolume').input();b.click('saveQuit');assert.equal(b.game.S.scene,'title');b.game.close();assert.equal(b.game.S.scene,'fish');assert.equal(b.game.F.t,33);
 const r=boot(b.storage);r.game.close();r.event('keydown',{key:'Escape',preventDefault(){}});assert.equal(r.el('soundEnabled').checked,false);assert.equal(r.el('soundVolume').value,25);
});
test('legacy saves load and backgrounding pauses the current game',()=>{
 const storage=new Map([['problemSolverSave',JSON.stringify({S:{week:2,day:1,rep:800,cash:500},U:{tires:2}})]]);const b=boot(storage);b.game.close();assert.equal(b.game.S.week,2);assert.equal(b.game.S.rep,800);assert.equal(b.game.U.tires,2);b.sandbox.document.hidden=true;b.visibility();assert.equal(b.el('pausePanel').hidden,false);
});
test('autosave runs without pagehide and storage failures do not quit gameplay',()=>{
 const b=boot();b.game.close();b.game.go.game();b.game.S.cash=879;for(let t=1000;t<1800;t+=50)b.step(t);assert.equal(JSON.parse(b.storage.get('problemSolverSave')).S.cash,879);
 b.sandbox.localStorage.setItem=()=>{throw Error('Storage blocked')};b.event('keydown',{key:'Escape',preventDefault(){}});b.click('saveQuit');assert.equal(b.game.S.scene,'game');assert.match(b.el('saveStatus').textContent,/Could not save/);
});
test('a held micro-game waits for fresh input after pause or reload',()=>{
 let b=boot();b.game.close();b.game.go.micro('filter');b.game.M.ph='play';b.game.M.go=true;b.game.M.v=.4;b.game.hold(true);b.event('keydown',{key:'Escape',preventDefault(){}});b.click('resumeGame');b.step(1000);assert.equal(b.game.M.ph,'play');assert.equal(b.game.M.v,.4);
 b.event('pagehide');b=boot(b.storage);b.game.close();b.step(1000);assert.equal(b.game.M.ph,'play');assert.equal(b.game.M.v,.4);b.game.hold(true);b.step(1050);assert.ok(b.game.M.v>.4);
});
test('Friday payday, shopping and weekend callbacks resume without paying twice',()=>{
 let b=boot();b.game.close();b.game.S.day=4;b.game.go.payday();b.event('pagehide');let cash=b.game.S.cash;b=boot(b.storage);b.game.close();assert.equal(b.game.S.cash,cash);b.game.close();assert.equal(b.game.S.scene,'radio');
 b.game.close();b.game.go.endDay(false);b.game.close();b.game.F.t=0;b.step(1000);b.step(1050);b.game.close();assert.equal(b.game.S.scene,'payday');cash=b.game.S.cash;b.event('pagehide');b=boot(b.storage);b.game.close();assert.equal(b.game.S.cash,cash);b.game.close();assert.equal(b.game.S.scene,'shop');b.event('pagehide');b=boot(b.storage);b.game.close();b.game.close();assert.equal(b.game.M.kind,'smore');
});
module.exports={boot};
