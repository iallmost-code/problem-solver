(function(){
'use strict';
const $=id=>document.getElementById(id),key='problemSolverArcadeV2';
const empty=()=>({best:{},wins:0,runs:0,sound:false});let records;
try{const x=JSON.parse(localStorage.getItem(key)||'null');records={...empty(),...x,best:x&&typeof x.best==='object'&&!Array.isArray(x.best)?x.best:{}}}catch(e){records=empty()}
let state=null,paused=false,animation=0,last=0,shownResult=false,run=null,focusBeforePause=null,audio=null,targetsKey='',lastPhase='',lastNote='';
let seedCounter=Date.now()>>>0;const previews=[];let reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function save(){try{localStorage.setItem(key,JSON.stringify(records))}catch(e){}}
function sound(kind){if(!records.sound)return;try{if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const osc=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime;osc.connect(gain);gain.connect(audio.destination);const f=kind==='win'?660:kind==='bad'||kind==='lose'?130:kind==='probe'?470:330;osc.type=kind==='bad'?'sawtooth':'sine';osc.frequency.setValueAtTime(f,now);osc.frequency.exponentialRampToValueAtTime(kind==='win'?990:f*.7,now+.12);gain.gain.setValueAtTime(.045,now);gain.gain.exponentialRampToValueAtTime(.001,now+.18);osc.start();osc.stop(now+.2)}catch(e){}}
function syncSound(){$('sound').textContent=records.sound?'Sound on':'Sound off';$('sound').setAttribute('aria-label','Turn sound '+(records.sound?'off':'on'));$('sound').setAttribute('aria-pressed',String(!!records.sound))}
function seed(){seedCounter=(Math.imul(seedCounter,1664525)+1013904223)>>>0;return seedCounter}
function shuffledGames(){const ids=PS.catalog.map(g=>g.id);for(let i=ids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]]}return ids}
function renderCards(){
 const container=$('games');container.replaceChildren();previews.length=0;
 for(const spec of PS.catalog){const b=document.createElement('button');b.className='game-card';b.dataset.game=spec.id;b.setAttribute('aria-label','Play '+spec.name);const canvas=document.createElement('canvas');canvas.className='thumb';canvas.width=520;canvas.height=315;canvas.setAttribute('aria-hidden','true');b.append(canvas);const info=document.createElement('div');info.className='card-info';info.innerHTML='<small>'+spec.tag+'</small><h3>'+spec.name+'</h3><div class="card-bottom"><span>'+spec.time+'</span><b>'+(Number.isFinite(records.best[spec.id])?'BEST '+records.best[spec.id]:'PLAY ↗')+'</b></div>';b.append(info);container.append(b);const p=PS.make(spec.id,137);if(p.id==='drive'){p.phase='run';p.speed=.6;p.gear=2}previews.push({canvas,state:p})}
 $('homeRecord').textContent=records.wins?records.wins+' cleared · '+records.runs+' played':'8 games · zero meetings';
}
function showHome(){releaseTorch();state=null;run=null;paused=false;shownResult=false;$('home').hidden=false;$('play').hidden=true;$('result').hidden=true;$('paused').hidden=true;targetsKey='';renderCards();history.replaceState(null,'',location.pathname+location.search);window.scrollTo(0,0)}
function begin(id,keepRun=false){
 if(!keepRun)run=null;state=PS.make(id,seed());paused=false;shownResult=false;lastPhase='';lastNote='';targetsKey='';$('home').hidden=true;$('play').hidden=false;$('result').hidden=true;$('paused').hidden=true;
 $('play').dataset.seed=String(state.seed);const spec=PS.catalog.find(g=>g.id===id);$('gameName').textContent=spec.name;$('gameTag').textContent=spec.tag;$('instruction').textContent=spec.hint;$('gameBest').textContent=Number.isFinite(records.best[id])?'BEST '+records.best[id]:'BEST —';$('feedback').textContent=id==='memory'?'Watch the board. Then repeat it.':id==='pack'?'Pick a case. Make the van somebody else’s problem.':'Let’s see what the last guy did.';$('runLabel').textContent=run?'SHITSHOW '+(run.index+1)+' / 5':'FREE PLAY';
 $('actions').replaceChildren();
 if(id==='drive')addAction('go','STAGE THE TRUCK');
 if(id==='leak')addAction('seal','SEAL SELECTED JOINT');
 if(id==='braze')addAction('torch','HOLD TORCH');
 if(id==='air')addAction('test','TEST AIRFLOW');
 if(id==='pack')addAction('rotate','↻ ROTATE CASE');
 addAction('restart','↶ Fresh puzzle',true);
 sizeCanvas();syncScene(true);window.scrollTo(0,0);$('gameName').tabIndex=-1;$('gameName').focus({preventScroll:true});
}
function addAction(cmd,label,alt=false){const b=document.createElement('button');b.type='button';b.className='action'+(alt?' alt':'');b.dataset.action=cmd;b.textContent=label;$('actions').append(b)}
function beginRun(){run={ids:shuffledGames().slice(0,5),index:0,results:[]};begin(run.ids[0],true)}
function send(cmd){if(!state||paused||state.done)return;if(cmd==='restart'){begin(state.id,!!run);return}PS.action(state,cmd);if(state.event&&!state.done)sound(state.event);syncScene();if(state.done)finish()}
function releaseTorch(){if(state?.id==='braze')PS.action(state,'torch-off');$('actions').querySelector('[data-action="torch"]')?.classList.remove('held')}
function sizeCanvas(){if(!state)return;const canvas=$('scene'),rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;const d=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(rect.width*d);canvas.height=Math.round(rect.height*d);targetsKey=''}
function worldHeight(){const rect=$('scene').getBoundingClientRect();return Math.round(1000*rect.height/Math.max(1,rect.width))}
function syncScene(force=false){
 if(!state)return;const c=$('scene'),height=worldHeight(),ctx=c.getContext('2d');ctx.setTransform(c.width/1000,0,0,c.height/height,0,0);const hit=PSArt.paint(ctx,state,animation,height);
 const hitKey=JSON.stringify(hit);if(force||hitKey!==targetsKey){
 const active=document.activeElement?.dataset?.cmd;const overlay=$('hitTargets');overlay.replaceChildren();
 for(const t of hit){const b=document.createElement('button');b.type='button';b.dataset.cmd=t.cmd;b.setAttribute('aria-label',t.label);b.disabled=t.disabled;Object.assign(b.style,{left:t.x/10+'%',top:t.y/height*100+'%',width:t.w/10+'%',height:t.h/height*100+'%'});overlay.append(b)}
 targetsKey=hitKey;if(active){const b=Array.from(overlay.children).find(n=>n.dataset.cmd===active&&!n.disabled);if(b)b.focus({preventScroll:true})}
 }
 $('gameClock').textContent=Math.floor(state.elapsed/60)+':'+String(Math.floor(state.elapsed%60)).padStart(2,'0');
 if(state.note&&state.note!==lastNote){$('feedback').textContent=state.note;lastNote=state.note}
 const phase=state.phase+(state.id==='drive'&&state.phase==='tree'?(state.phaseTime>=state.delay?'green':'red'):'');
 if(phase!==lastPhase){lastPhase=phase;if(state.id==='drive'){const b=$('actions').querySelector('[data-action="go"]');if(b)b.textContent=state.phase==='stage'?'STAGE THE TRUCK':state.phase==='tree'?(state.phaseTime>=state.delay?'LAUNCH!':'WAIT FOR GREEN…'):state.gear>=4?'FOURTH GEAR — HOLD ON':'SHIFT GEAR';if(state.phase==='tree'&&state.phaseTime>=state.delay){$('feedback').textContent='GREEN. Send it.';sound('good')}}}
 if(state.id==='drive'&&state.phase==='run'){const b=$('actions').querySelector('[data-action="go"]');if(b)b.textContent=state.gear>=4?'FOURTH GEAR — HOLD ON':'SHIFT '+state.gear+' → '+(state.gear+1)}
}
function finish(){
 if(shownResult)return;shownResult=true;releaseTorch();records.runs++;if(state.won){records.wins++;records.best[state.id]=Math.max(Number(records.best[state.id])||0,state.score)}
 if(run)run.results.push(state.score);save();const completed=run&&run.index===4,total=run?run.results.reduce((n,s)=>n+s,0):0;
 $('resultKicker').textContent=completed?'FIVE PROBLEMS. ONE SURVIVOR.':state.won?'PROBLEM SOLVED':'WELL, SHIT.';$('resultTitle').textContent=completed?'BREAK’S OVER.':state.won?'FIXED IT.':'CALLBACK.';
 const lines=PS.jokes[state.id][state.won?'win':'lose'];$('joke').textContent=lines[Math.floor(Math.random()*lines.length)];
 $('resultNumbers').innerHTML=completed?'<span>FIVE-GAME SCORE</span><b>'+total+' / 500</b>':'<span>'+Math.round(state.elapsed)+' SEC · '+state.errors+' '+(state.errors===1?'MISTAKE':'MISTAKES')+'</span><b>'+state.score+' / 100</b>';
 $('nextGame').textContent=completed?'Another five →':run?'Next call '+(run.index+2)+' / 5 →':'Next problem →';$('again').hidden=!!run;$('result').hidden=false;$('nextGame').focus();sound(state.won?'win':'lose');
}
function next(){if(run){if(run.index>=4)beginRun();else{run.index++;begin(run.ids[run.index],true)}}else{const ids=PS.catalog.filter(g=>g.id!==state.id);begin(ids[Math.floor(Math.random()*ids.length)].id)}}
function pause(){if(!state||state.done||paused)return;releaseTorch();paused=true;focusBeforePause=document.activeElement;$('paused').hidden=false;$('resume').focus()}
function resume(){paused=false;$('paused').hidden=true;last=0;focusBeforePause?.focus?.({preventScroll:true})}
$('brand').addEventListener('click',e=>{e.preventDefault();showHome()});$('back').addEventListener('click',showHome);$('resultHome').addEventListener('click',showHome);$('pauseHome').addEventListener('click',showHome);$('pause').addEventListener('click',pause);$('resume').addEventListener('click',resume);$('sound').addEventListener('click',()=>{records.sound=!records.sound;syncSound();save();sound('good')});$('random').addEventListener('click',()=>begin(shuffledGames()[0]));$('five').addEventListener('click',beginRun);$('nextGame').addEventListener('click',next);$('again').addEventListener('click',()=>begin(state.id));
$('games').addEventListener('click',e=>{const button=e.target.closest('[data-game]');if(button)begin(button.dataset.game)});$('hitTargets').addEventListener('click',e=>{const b=e.target.closest('[data-cmd]');if(b)send(b.dataset.cmd)});
$('actions').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b&&b.dataset.action!=='torch')send(b.dataset.action)});
$('actions').addEventListener('pointerdown',e=>{const b=e.target.closest('[data-action="torch"]');if(!b||!state||paused)return;e.preventDefault();b.setPointerCapture(e.pointerId);b.classList.add('held');send('torch-on')});
window.addEventListener('pointerup',releaseTorch);window.addEventListener('pointercancel',releaseTorch);window.addEventListener('blur',()=>{releaseTorch();pause()});
window.addEventListener('keydown',e=>{
 if(e.key==='Escape'){e.preventDefault();if(paused)resume();else pause();return}
 const dialog=!$('paused').hidden?$('paused'):!$('result').hidden?$('result'):null;
 if(e.key==='Tab'&&dialog){const items=Array.from(dialog.querySelectorAll('button:not([hidden])'));const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}return}
 if(!state||state.done||paused)return;
 if(e.key===' '&&e.target.tagName!=='BUTTON'){e.preventDefault();if(e.repeat)return;if(state.id==='drive')send('go');if(state.id==='braze')send('torch-on')}
 if(state.id==='memory'&&/^[1-4]$/.test(e.key)&&!e.repeat){e.preventDefault();send('pad-'+(Number(e.key)-1))}
});
window.addEventListener('keyup',e=>{if(e.key===' ')releaseTorch()});
// Holding Space on the torch button uses the same press/release path as touch.
$('actions').addEventListener('keydown',e=>{if(e.key===' '&&e.target.dataset.action==='torch'){e.preventDefault();if(!e.repeat)send('torch-on')}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});window.addEventListener('resize',()=>{sizeCanvas();syncScene(true)});
function frame(time){const dt=Math.min(.05,last?(time-last)/1000:0);last=time;if(!paused)animation+=dt;
 if(state){if(!paused&&!state.done){const eventBefore=state.event;PS.tick(state,dt);if(state.event&&state.event!==eventBefore&&!state.done)sound(state.event);if(state.done)finish()}syncScene()}
 else if(!reduced||time%1000<60){for(const p of previews){if(p.state.id==='drive')p.state.distance=animation*45;if(p.state.id==='braze'){p.state.held=true;p.state.heat=.6;p.state.progress=(animation*.08)%1}if(p.state.id==='memory'){p.state.flash=Math.floor(animation*1.5)%4}const ctx=p.canvas.getContext('2d');ctx.setTransform(p.canvas.width/1000,0,0,p.canvas.height/650,0,0);PSArt.paint(ctx,p.state,animation,650)}}
 requestAnimationFrame(frame)
}
syncSound();renderCards();requestAnimationFrame(frame);
})();
