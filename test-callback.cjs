// Regression coverage for local casefiles. The shared helper also registers the
// original campaign save tests, deliberately keeping both suites in the run.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./test-save.cjs');
const plain=v=>JSON.parse(JSON.stringify(v));
function opened(storage){const b=boot(storage);b.game.close();assert.ok(b.game.files,'game.files test seam must be exposed');return b;}
const locker=(f,digits)=>{for(const n of digits)f.input('key-'+n);f.input('test');};
const PACK=[['0-0','2-0','2-1','1-2'],['0-0','3-0','2-1','0-2','3-2'],['0-0','2-0','3-1','0-3','1-2','4-3']];
const ROUTES=[[4,0,1,2,6,7,11,15],[5,10,15,16,17,12,7,8,9,4],[1,0,5,10,11,16,11,12,7,8,9,4]];
const LAMPS=[[0,8],[0,5,10,15],[0,4,7,10,13,16]];
const PUSH=['urrdru','uldlurrrdru','uruldlurrrddurudddl'];
function solution(id,level,v){
 if(id==='lockbox')return v.code.map(n=>'key-'+n).concat('test');
 if(id==='alibi')return v.rows.flatMap((row,r)=>row.flatMap((n,c)=>['cell-'+(r*2+c),'tag-'+n])).concat('file');
 if(id==='switchboard')return LAMPS[level].map(n=>'lamp-'+n);
 if(id==='recovery')return Array.from(PUSH[level],d=>({u:'up',r:'right',d:'down',l:'left'})[d]);
 if(id==='dispatch')return ROUTES[level].map(n=>'drive-'+n);
 if(id==='vanpack')return PACK[level].flatMap((cell,i)=>['pick-'+i,...Array((-i-1+8)%4).fill('rotate'),'cell-'+cell]);
 throw Error('Add explicit regression fixture for case '+id);
}
function solve(f,pick){for(const c of solution(pick.id,pick.level,f.catalog[pick.id].versions[pick.level]))f.input(c);}
function savedCampaign(b){b.event('pagehide');return b.storage.get('problemSolverSave');}

test('catalog has six distinct case types and three independently solvable versions each',()=>{
 const f=opened().game.files;assert.equal(Object.keys(f.catalog).length,6);
 for(const [id,spec] of Object.entries(f.catalog)){
  assert.ok(spec.versions.length>=3,id);assert.equal(new Set(spec.versions.map(v=>JSON.stringify(v))).size,spec.versions.length,id+' versions must differ');
  for(let level=0;level<3;level++){
   const v=spec.versions[level],s=spec.init(v);assert.ok(spec.render(v,s).length>0,id);let result;
   for(const cmd of solution(id,level,v)){result=spec.act(v,s,cmd);assert.notEqual(result.status,'mistake',id+' '+level+' '+cmd);}
   assert.equal(result?.status,'won',id+' version '+level+' must be solvable from fresh state');
  }
 }
});
test('daily selection is stable across boots, date-seeded and contains three unique valid cases',()=>{
 const f=opened().game.files,g=opened().game.files;const dates=Array.from({length:28},(_,i)=>'2026-11-'+String(i+1).padStart(2,'0'));const seen=new Set();
 for(const date of dates){const picks=plain(f.dailyPicks(date));assert.deepEqual(picks,plain(g.dailyPicks(date)));assert.equal(picks.length,3);assert.equal(new Set(picks.map(p=>p.id)).size,3);for(const p of picks){assert.ok(f.catalog[p.id]);assert.ok(Number.isInteger(p.level)&&p.level>=0&&p.level<f.catalog[p.id].versions.length);}seen.add(JSON.stringify(picks));}
 assert.ok(seen.size>1,'different dates must produce varied shifts');
});
test('practice mistakes and hint survive restart and boot without laundering the score',()=>{
 let b=opened(),f=b.game.files;f.start('lockbox',0);locker(f,[2,2,2]);f.hint();assert.equal(f.run.misses,1);assert.equal(f.run.hinted,true);f.restart();assert.equal(f.run.misses,1);assert.equal(f.run.hinted,true);assert.deepEqual(plain(f.board.draft),[]);b.event('pagehide');
 b=opened(b.storage);f=b.game.files;f.start('lockbox',0);assert.equal(f.run.misses,1);assert.equal(f.run.hinted,true);assert.deepEqual(plain(f.board.draft),[]);locker(f,[1,3,0]);assert.equal(f.run.closed,true);assert.equal(f.records.best['lockbox:0'],75);
 const records=plain(f.records),run=plain(f.run);f.input('test');f.input('key-1');assert.deepEqual(plain(f.records),records);assert.deepEqual(plain(f.run),run,'closed case cannot award twice');
});
test('practice bests never fall and score has a floor of twenty',()=>{
 const f=opened().game.files;f.start('lockbox',0);locker(f,[1,3,0]);assert.equal(f.records.best['lockbox:0'],100);
 f.start('lockbox',1);f.hint();for(let n=0;n<9;n++){const digits=[Math.floor(n/16),Math.floor(n/4)%4,n%4];locker(f,digits);}
 locker(f,[2,2,1]);assert.equal(f.records.best['lockbox:1'],20);f.start('lockbox',0);f.hint();locker(f,[1,3,0]);assert.equal(f.records.best['lockbox:0'],100);
});
test('partial daily board, hints and sequence survive boot and same-date resume',()=>{
 const date='2026-11-11';let b=opened(),f=b.game.files;f.daily(date);f.hint();const run=plain(f.run),board=plain(f.board);assert.equal(run.mode,'daily');assert.equal(run.day,date);assert.equal(run.sequence.length,3);assert.equal(f.records.shifts[date].best,null);b.event('pagehide');
 b=opened(b.storage);f=b.game.files;f.resumeDaily(date);assert.deepEqual(plain(f.run),run);assert.deepEqual(plain(f.board),board);f.daily(date);assert.deepEqual(plain(f.run),run,'opening same daily does not reset it');
 solve(f,run.sequence[0]);assert.equal(f.run.closed,true);f.next();assert.equal(f.run.index,1);const second=plain(f.run);b.event('pagehide');b=opened(b.storage);b.game.files.daily(date);assert.deepEqual(plain(b.game.files.run),second);
});
test('daily closes exactly three cases, records once and has no clock penalty',()=>{
 const b=opened(),f=b.game.files,date='2026-11-12';f.daily(date);const sequence=plain(f.run.sequence),campaignTime=b.game.S.min;
 for(let t=1000;t<=20000;t+=250)b.step(t);assert.equal(b.game.S.min,campaignTime);
 for(let i=0;i<3;i++){assert.equal(f.run.index,i);solve(f,sequence[i]);assert.equal(f.run.closed,true);const score=f.run.points;f.input('test');assert.equal(f.run.points,score);f.next();}
 assert.equal(f.run.complete,true);assert.equal(f.run.results.length,3);assert.equal(f.records.shifts[date].best,300);const records=plain(f.records);f.next();f.daily(date);assert.deepEqual(plain(f.records),records);assert.equal(f.run.complete,true);
});
test('practice and daily activity preserve the exact campaign save and earnings',()=>{
 const b=opened();b.game.S.cash=1234;b.game.S.rep=987;b.game.S.min=127;const before=savedCampaign(b),state=plain(b.game.S),f=b.game.files;
 f.desk();f.folder('lockbox');f.start('lockbox',0);f.hint();locker(f,[2,2,2]);f.restart();locker(f,[1,3,0]);assert.equal(savedCampaign(b),before);
 f.daily('2026-11-13');f.hint();f.restart();assert.equal(savedCampaign(b),before);for(const key of ['cash','rep','min','day','week','streak','done'])assert.equal(b.game.S[key],state[key],key+' must remain isolated');
});

test('a work callback restores its board, pays once and resets on a new campaign',()=>{
 let b=opened();b.game.S.day=1;b.game.S.skitsSeen=[0];b.game.S.today={};b.game.go.between();
 assert.equal(b.game.S.scene,'caseOffer');b.game.close();assert.equal(b.game.files.run.mode,'work');
 b.game.files.input('key-1');b.event('pagehide');
 b=opened(b.storage);assert.deepEqual(plain(b.game.files.board.draft),[1]);const cash=b.game.S.cash,rep=b.game.S.rep;
 b.game.files.input('key-3');b.game.files.input('key-0');b.game.files.input('test');
 assert.equal(b.game.S.cash,cash+100);assert.equal(b.game.S.rep,rep+100);
 b.event('pagehide');b=opened(b.storage);b.game.files.input('test');
 assert.equal(b.game.S.cash,cash+100);assert.equal(b.game.S.rep,rep+100);
 b.game.go.title();b.game.close(true);b.event('pagehide');
 assert.equal(b.game.S.scene,'micro');assert.equal(JSON.parse(b.storage.get('problemSolverSave')).S.fieldFile,undefined);
});
