const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./test-save.cjs');
test('six new games have playable instructions and JSON-safe state',()=>{
 for(const kind of ['drift','pcbuild','blame','backlash','pressure','toolmath']){
  const b=boot();b.game.close();b.game.go.micro(kind);assert.equal(b.game.M.kind,kind);b.event('pagehide');const saved=JSON.parse(b.storage.get('problemSolverSave'));assert.equal(saved.runtime.M.kind,kind);const r=boot(b.storage);r.game.close();for(let t=1000;t<4000;t+=50)r.step(t);assert.equal(r.game.M.kind,kind);
 }
});
test('skits survive reload without advancing or paying twice',()=>{
 let b=boot();b.game.close();b.game.go.skit(0);b.game.close();b.event('pagehide');let beat=b.game.S.skit.beat;b=boot(b.storage);b.game.close();assert.equal(b.game.S.skit.beat,beat);b.game.close();assert.equal(b.game.S.skit.beat,beat+1);
});
test('arcade sessions preserve the saved workweek',()=>{
 const b=boot();b.game.close();b.game.S.rep=998;b.event('pagehide');const before=b.storage.get('problemSolverSave');b.game.go.title();b.game.go.arcade();b.game.go.arcadePlay('blame');b.event('pagehide');assert.equal(b.storage.get('problemSolverSave'),before);
});
test('old saved dialogs and locations migrate to fictional names',()=>{
 const b=boot();b.game.close();b.game.go.event(0);b.event('pagehide');const saved=JSON.parse(b.storage.get('problemSolverSave'));saved.runtime.dialog.html='<p>Alpine0_0 in Dacula, headed to COLLINS HILL PARK with a Curado.</p>';saved.runtime.job={town:'Lawrenceville'};b.storage.set('problemSolverSave',JSON.stringify(saved));const r=boot(b.storage);r.game.close();assert.doesNotMatch(r.el('body').innerHTML,/Alpine0_0|Dacula|COLLINS HILL PARK|Curado/);assert.match(r.el('body').innerHTML,/THE FIXER.*Bent Pines.*BACKLASH LAKE.*baitcaster/);
});
test('short screens pause new games until controls have enough room',()=>{
 const b=boot();b.game.close();b.game.go.micro('pressure');b.sandbox.innerWidth=667;b.sandbox.innerHeight=375;b.event('resize');b.step(1000);assert.equal(b.el('rotatePanel').hidden,false);assert.equal(b.el('pausePanel').hidden,false);const time=b.game.M.t;b.step(1050);assert.equal(b.game.M.t,time);b.sandbox.innerWidth=390;b.sandbox.innerHeight=844;b.event('resize');b.step(1100);assert.equal(b.el('rotatePanel').hidden,true);b.click('resumeGame');
});
test('all comic skits can finish without changing a saved campaign in the archive',()=>{
 const b=boot();b.game.close();b.game.S.cash=1234;b.event('pagehide');const campaign=b.storage.get('problemSolverSave');b.game.go.title();b.game.go.arcade();for(let i=0;i<8;i++){b.game.go.skit(i);for(let beat=0;beat<7&&b.game.S.scene==='skit';beat++)b.game.close();assert.equal(b.game.S.scene,'skitgallery')}b.event('pagehide');assert.equal(b.storage.get('problemSolverSave'),campaign);
});

// Drive the actual frame/input path, including drawing, instead of calling game
// implementations directly. Coordinates follow the responsive control geometry.
function newGame(kind,width=360,height=740){
 const b=boot();b.game.close();b.sandbox.innerWidth=width;b.sandbox.innerHeight=height;b.event('resize');b.game.go.micro(kind);b.game.M.ph='play';b.clock=1000;b.step(b.clock);return b;
}
function layout(b){const W=b.sandbox.innerWidth,H=b.sandbox.innerHeight;return{W,H,x:Math.max(14,(W-640)/2),y:158,w:Math.min(W-28,640),h:Math.max(260,H-268)}}
function tapGame(b,x,y){b.game.tap(x,y);b.clock+=50;b.step(b.clock)}
function resumeGame(b){
 const before=JSON.parse(JSON.stringify(b.game.M));b.event('pagehide');const r=boot(b.storage);r.game.close();r.sandbox.innerWidth=b.sandbox.innerWidth;r.sandbox.innerHeight=b.sandbox.innerHeight;r.event('resize');r.clock=1000;r.step(r.clock);
 assert.equal(r.game.M.kind,before.kind);assert.equal(r.game.M.ph,before.ph);return r;
}
function assertWonOnce(b){
 assert.equal(b.game.M.ph,'done');assert.equal(b.game.M.won,true);const rep=b.game.S.rep,micros=b.game.S.micros;
 b.game.mdone(true);assert.equal(b.game.S.rep,rep);assert.equal(b.game.S.micros,micros);
 const r=resumeGame(b);assert.equal(r.game.S.rep,rep);assert.equal(r.game.S.micros,micros);r.game.mdone(true);assert.equal(r.game.S.rep,rep);assert.equal(r.game.S.micros,micros);
}
function driftArrow(b,dx,dy){const l=layout(b),s=Math.min(54,l.w/5),cx=l.W/2,cy=l.y+l.h*.71;const p=dx<0?[-1.6,0]:dx>0?[.6,0]:dy<0?[-.5,-1.1]:[-.5,1.1];tapGame(b,cx+s*(p[0]+.5),cy+s*(p[1]+.5))}
function driftSave(b){const l=layout(b);tapGame(b,l.x+l.w*.88,l.y+l.h*.72+27)}
function lead(b,j,right=false){const l=layout(b);tapGame(b,l.x+l.w*(right?.84:.16),l.y+30+j*l.h*.22+l.h*.22*.36)}
function diagnosis(b,j){const l=layout(b),h=l.h*.12;tapGame(b,l.x+l.w/2,l.y+l.h*.56+j*(h+8)+h/2)}
function loop(b,j){const l=layout(b);tapGame(b,l.x+l.w*(j%2?.73:.27),l.y+l.h*(j<2?.3:.7))}
function valve(b,j){const l=layout(b);tapGame(b,l.x+l.w*.53,l.y+25+j*l.h*.22+l.h*.22*.325)}
function flowTest(b){const l=layout(b);tapGame(b,l.x+l.w/2,l.y+l.h*.8+24)}
function offer(b,j){const l=layout(b),h=l.h*.24;tapGame(b,l.x+l.w/2,l.y+28+j*(h+10)+h/2)}

for(const [width,height]of [[360,740],[1280,800]]){
 test(`drift rejects nonzero center, restores trim and rewards once (${width}px)`,()=>{
  let b=newGame('drift',width,height);const initial={ox:b.game.M.ox,oy:b.game.M.oy};driftSave(b);assert.equal(b.game.M.ph,'play');assert.equal(b.game.M.bad,true);
  driftArrow(b,-Math.sign(initial.ox),0);const tx=b.game.M.tx;b=resumeGame(b);assert.equal(b.game.M.tx,tx);assert.equal(b.game.M.ox,initial.ox);assert.equal(b.game.M.oy,initial.oy);
  while(b.game.M.ox+b.game.M.tx)driftArrow(b,-Math.sign(b.game.M.ox+b.game.M.tx),0);
  while(b.game.M.oy+b.game.M.ty)driftArrow(b,0,-Math.sign(b.game.M.oy+b.game.M.ty));
  assert.equal(b.game.M.ph,'play');driftSave(b);assertWonOnce(b);
 });
 test(`GPU rejects incompatible lead, restores links and solves (${width}px)`,()=>{
  let b=newGame('pcbuild',width,height);const order=Array.from(b.game.M.order),correct=order.indexOf(0);lead(b,0);lead(b,(correct+1)%3,true);assert.equal(b.game.M.bad,true);assert.deepEqual(Array.from(b.game.M.links),[-1,-1,-1]);assert.equal(b.game.M.sel,0);
  lead(b,correct,true);b=resumeGame(b);assert.deepEqual(Array.from(b.game.M.order),order);assert.equal(b.game.M.links[0],correct);lead(b,0);assert.equal(b.game.M.sel,-1);
  for(let j=1;j<3;j++){lead(b,j);lead(b,order.indexOf(j),true)}assertWonOnce(b);
 });
 test(`thermostat evidence rejects contradictions and survives reload (${width}px)`,()=>{
  for(let scenario=0;scenario<3;scenario++){
   let b=newGame('blame',width,height);b.game.M.case=scenario;const wrong=(scenario+1)%3;diagnosis(b,wrong);assert.equal(b.game.M.ph,'play');assert.equal(b.game.M.bad,true);assert.deepEqual(Array.from(b.game.M.badChoices),[wrong]);b=resumeGame(b);assert.equal(b.game.M.case,scenario);assert.deepEqual(Array.from(b.game.M.badChoices),[wrong]);diagnosis(b,scenario);assertWonOnce(b);
  }
 });
 test(`backlash enforces dependencies and restores cleared loops (${width}px)`,()=>{
  let b=newGame('backlash',width,height);loop(b,3);assert.equal(b.game.M.done.length,0);assert.match(b.game.M.msg,/A \+ C/);loop(b,1);assert.equal(b.game.M.done.length,0);assert.match(b.game.M.msg,/A first/);loop(b,0);loop(b,0);assert.deepEqual(Array.from(b.game.M.done),[0]);b=resumeGame(b);assert.deepEqual(Array.from(b.game.M.done),[0]);loop(b,3);assert.match(b.game.M.msg,/C first/);for(const j of [1,2,3])loop(b,j);assertWonOnce(b);
 });
 test(`duct routing requires exact additive flow after reload (${width}px)`,()=>{
  for(const target of [3,5,6]){
   let b=newGame('pressure',width,height);b.game.M.target=target;flowTest(b);assert.equal(b.game.M.ph,'play');assert.equal(b.game.M.bad,true);assert.match(b.game.M.msg,/0 units/);valve(b,0);valve(b,0);assert.deepEqual(Array.from(b.game.M.valves),[false,false,false]);
   const required=[0,1,2].filter(j=>target&(1<<j));valve(b,required[0]);b=resumeGame(b);assert.equal(b.game.M.target,target);assert.equal(b.game.M.valves[required[0]],true);for(const j of required.slice(1))valve(b,j);assert.equal(b.game.M.ph,'play');flowTest(b);assertWonOnce(b);
  }
 });
 test(`tool math counts all fees and restores rejected offers (${width}px)`,()=>{
  for(let variant=0;variant<2;variant++){
   let b=newGame('toolmath',width,height);b.game.M.variant=variant;const totals=variant?[210,4*45+10,8*25+20]:[180,4*45+15,10*20+10];const answer=totals.indexOf(Math.min(...totals)),wrong=(answer+1)%3;
   offer(b,wrong);assert.equal(b.game.M.ph,'play');assert.equal(b.game.M.bad,true);assert.deepEqual(Array.from(b.game.M.badChoices),[wrong]);b=resumeGame(b);assert.equal(b.game.M.variant,variant);assert.deepEqual(Array.from(b.game.M.badChoices),[wrong]);offer(b,answer);assertWonOnce(b);
  }
 });
}
