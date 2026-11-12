/* Pure game rules. Rendering and device input live in art.js and app.js. */
(function (root) {
  'use strict';
  const catalog = [
    {id:'drive',name:'Truck It',tag:'REACTION + TIMING',hint:'Tap to stage. Launch on green, then shift in the orange band.',time:'20 sec',color:'#e7813d'},
    {id:'pipe',name:'Pipe Dreams',tag:'ROTATION PUZZLE',hint:'Turn the pipe tiles. Connect the blue inlet to the outlet on the right.',time:'30–90 sec',color:'#51bcae'},
    {id:'wire',name:'Crossed Wires',tag:'MATCH + DEDUCE',hint:'Select a wire, then its matching terminal. Follow the work card.',time:'20–45 sec',color:'#e5bb55'},
    {id:'leak',name:'Sniff Test',tag:'HIDDEN-LEAK LOGIC',hint:'Probe a joint. Its number is the leak’s distance in grid steps. Tap SEAL on the joint you suspect.',time:'30–60 sec',color:'#76b8ce'},
    {id:'braze',name:'Hot Enough?',tag:'HEAT CONTROL',hint:'Hold the torch to heat. Release to cool. Keep the needle in orange to finish the seam.',time:'20 sec',color:'#e6886d'},
    {id:'air',name:'Airflow Politics',tag:'BALANCE PUZZLE',hint:'Adjust the three dampers until every room matches its target. Then test the system.',time:'30–60 sec',color:'#95b875'},
    {id:'memory',name:'Board Meeting',tag:'SEQUENCE MEMORY',hint:'Watch the board flash, then tap the pads in the same order. Three rounds.',time:'30 sec',color:'#b29acb'},
    {id:'pack',name:'Shut the Damn Doors',tag:'SPATIAL PUZZLE',hint:'Pick a case, rotate it, then place its top-left corner on the van floor. Tap cargo to retrieve it.',time:'30–90 sec',color:'#d9ab73'}
  ];
  const jokes={
    drive:{win:['Truck survived. The coffee filed a fucking complaint.','Perfect commute. Dispatch has added three stops.','You shifted better than management shifts blame.'],lose:['That light was red, you impatient bastard.','The gearbox just updated its résumé.','The van is fine. Your dignity left at the second shift.']},
    pipe:{win:['Water has a route. Your helper still doesn’t.','Connected. Try not to sound so fucking surprised.','Look at that. A pipe dream with an actual exit.'],lose:['That’s a closed loop of poor decisions.']},
    wire:{win:['The magic smoke remains inside. Excellent.','You followed the card. That already puts you in management.','Connected. The thermostat has run out of people to blame.'],lose:['Congratulations. You made a very small toaster.']},
    leak:{win:['Found it. Your helper says he was just about to.','One leak sealed. The group chat remains a lost cause.','The hiss is gone. The bullshit continues.'],lose:['You sealed the wrong joint. Very confidently, though.']},
    braze:{win:['Nice joint. Don’t let it go to your fucking head.','Held together by skill. A refreshing change.','That’ll hold. The apprentice wants to know which app did it.'],lose:['You’ve invented copper soup. Gordon fucking Furnace over here.','That’s a blob with career aspirations.']},
    air:{win:['Every room is happy. This has never happened before.','Balanced. Somebody will touch a damper in twelve minutes.','The air is distributed more fairly than the overtime.'],lose:['The bonus room remains a fucking weather event.']},
    memory:{win:['Board meeting complete. No emails could have replaced this one.','You remembered more than the entire install crew.','Three clean starts. The board is frankly suspicious.'],lose:['Board says no. You may appeal to the shop cat.','That order came straight out of your ass.']},
    pack:{win:['The doors close. Nobody breathe near the fucking van.','Everything fits. Dispatch asks about a piano.','Packed properly. You are now banned from lending it out.'],lose:['The van declines to stretch. Have you tried a smaller ego?']}
  };
  const PACKS=[['AABB','A#CB','ADCB','DDCC'],['AAABB','A#CBB','DCCEE','DDDEE'],['AABBB','A#BC#','AECCC','DEEEF','DDFFF']];
  function rng(seed){let n=seed>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}}
  function shuffle(a,r){for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  function rotate(mask){return ((mask<<1)|(mask>>3))&15}
  function finish(s,won){if(s.done)return;s.done=true;s.won=won;s.score=won?Math.max(20,Math.round(100-s.errors*12-Math.max(0,s.elapsed-30)*.4)):0;s.event=won?'win':'lose'}
  function checkPipe(s){
    const on=Array(s.n*s.n).fill(false),stack=[];
    if(s.tiles[s.start*s.n]&8){on[s.start*s.n]=true;stack.push(s.start*s.n)}
    while(stack.length){const k=stack.pop(),x=k%s.n,y=Math.floor(k/s.n);
      for(const [dx,dy,b,opp] of [[0,-1,1,4],[1,0,2,8],[0,1,4,1],[-1,0,8,2]]){
        const nx=x+dx,ny=y+dy,j=ny*s.n+nx;
        if(nx<0||ny<0||nx>=s.n||ny>=s.n||on[j]||!(s.tiles[k]&b)||!(s.tiles[j]&opp))continue;
        on[j]=true;stack.push(j);
      }
    }
    s.flow=on;return on[s.exit*s.n+s.n-1]&&!!(s.tiles[s.exit*s.n+s.n-1]&2);
  }
  function norm(cells){const x=Math.min(...cells.map(p=>p[0])),y=Math.min(...cells.map(p=>p[1]));return cells.map(p=>[p[0]-x,p[1]-y])}
  function shape(s,id,turn=s.turns[id]){let cells=[];s.map.forEach((row,y)=>Array.from(row).forEach((v,x)=>{if(v===String.fromCharCode(65+id))cells.push([x,y])}));cells=norm(cells);for(let i=0;i<turn;i++)cells=norm(cells.map(([x,y])=>[-y,x]));return cells}
  function occupied(s,x,y){return s.placed.findIndex((p,id)=>p&&shape(s,id,p[2]).some(([dx,dy])=>p[0]+dx===x&&p[1]+dy===y))}
  function airValues(s){const total=s.dampers.reduce((a,n,i)=>a+n*s.weights[i],0);return s.dampers.map((n,i)=>Math.round(100*n*s.weights[i]/total))}
  function make(id,seed=1){
    if(!catalog.some(g=>g.id===id))throw Error('Unknown game');
    const r=rng(seed),s={id,seed,elapsed:0,errors:0,moves:0,done:false,won:false,score:0,event:'',note:'',shake:0};
    if(id==='drive')Object.assign(s,{phase:'stage',delay:1.8+r()*1.2,phaseTime:0,rpm:.12,gear:1,distance:0,speed:0,quality:0,reaction:null,shifts:[]});
    if(id==='pipe'){
      const n=4;s.n=n;s.start=Math.floor(r()*n);s.exit=Math.floor(r()*n);s.tiles=Array.from({length:n*n},()=>[3,5,6,9,10,12][Math.floor(r()*6)]);
      const path=[];let y=s.start;for(let x=0;x<n;x++){path.push([x,y]);if(x<n-1){const next=x===n-2?s.exit:Math.floor(r()*n);while(y!==next){y+=Math.sign(next-y);path.push([x,y])}}}
      s.solution=s.tiles.slice();path.forEach(([x,y],i)=>{const bit=(dx,dy)=>dx<0?8:dx>0?2:dy<0?1:4;const prev=i?path[i-1]:[-1,y],next=i<path.length-1?path[i+1]:[n,y];s.solution[y*n+x]=bit(prev[0]-x,prev[1]-y)|bit(next[0]-x,next[1]-y)});
      s.tiles=s.solution.map(m=>{for(let i=0,k=Math.floor(r()*4);i<k;i++)m=rotate(m);return m});s.turns=Array(n*n).fill(0);if(checkPipe(s)){for(let tries=0;tries<4&&checkPipe(s);tries++)s.tiles[s.start*n]=rotate(s.tiles[s.start*n]);checkPipe(s)}
    }
    if(id==='wire'){
      const codes=['R','C','G','Y'];s.order=shuffle([0,1,2,3],r);s.codes=codes;s.links=[-1,-1,-1,-1];s.selected=-1;s.names=['POWER','COMMON','FAN','COOL'];
    }
    if(id==='leak'){s.n=4;s.target=Math.floor(r()*16);s.probes={};s.selected=-1;s.probePulse=0}
    if(id==='braze')Object.assign(s,{heat:.12,progress:0,held:false,overheat:0});
    if(id==='air'){
      s.weights=[1,2,3];s.answer=[1+Math.floor(r()*4),1+Math.floor(r()*4),1+Math.floor(r()*4)];s.dampers=[2,2,2];const total=s.answer.reduce((n,v,i)=>n+v*s.weights[i],0);s.targets=s.answer.map((v,i)=>Math.round(100*v*s.weights[i]/total));if(airValues(s).every((v,i)=>Math.abs(v-s.targets[i])<=2))s.dampers[0]=5;
    }
    if(id==='memory'){s.sequence=Array.from({length:5},()=>Math.floor(r()*4));s.round=1;s.input=0;s.phase='watch';s.phaseTime=-.65;s.flash=-1;s.lit=-1;s.glow=0}
    if(id==='pack'){s.map=PACKS[Math.abs(seed)%3];s.count=new Set(s.map.join('').replaceAll('#','')).size;s.turns=Array.from({length:s.count},(_,i)=>(i+1)%4);s.placed=Array(s.count).fill(null);s.selected=0}
    return s;
  }
  function action(s,cmd){
    if(s.done||typeof cmd!=='string')return false;s.event='';let m;
    if(s.id==='drive'&&cmd==='go'){
      if(s.phase==='stage'){s.phase='tree';s.phaseTime=0;s.note='Wait for green.'}
      else if(s.phase==='tree'){s.reaction=s.phaseTime-s.delay;if(s.reaction<0){s.errors++;finish(s,false)}else {s.phase='run';s.phaseTime=0;s.quality=s.reaction<.22?3:s.reaction<.6?2:1;s.note=s.reaction<.22?'Clean launch. Coffee still airborne.':'We will call that a launch.'}}
      else if(s.phase==='run'&&s.gear<4){const clean=s.rpm>=.72&&s.rpm<=.9;s.shifts.push(clean);s.quality+=clean?2:0;if(!clean)s.errors++;s.note=clean?'Good shift. The van almost respects you.':s.rpm<.72?'Early. Like your helper at lunch.':'Late. Like every fucking part delivery.';s.gear++;s.rpm=.12;s.event=clean?'good':'bad'}
    }
    if(s.id==='pipe'&&(m=/^tile-(\d+)$/.exec(cmd))&&+m[1]<s.tiles.length){const i=+m[1];s.tiles[i]=rotate(s.tiles[i]);s.turns[i]++;s.moves++;if(checkPipe(s))finish(s,true);else s.event='tap'}
    if(s.id==='wire'){
      if((m=/^lead-([0-3])$/.exec(cmd)))s.selected=+m[1];
      if((m=/^port-([0-3])$/.exec(cmd))&&s.selected>=0){const j=+m[1],i=s.selected;if(s.order[j]===i){s.links[i]=j;s.selected=-1;s.event='good';s.note='Connected. Still no smoke.';if(s.links.every(n=>n>=0))finish(s,true)}else{s.errors++;s.shake=.3;s.event='bad';s.note='Wrong circuit. The fuse would like a fucking word.'}}
    }
    if(s.id==='leak'){
      if((m=/^joint-(\d+)$/.exec(cmd))&&+m[1]<16){s.selected=+m[1];s.probePulse=1;if(s.probes[s.selected]===undefined){s.probes[s.selected]=Math.abs(s.selected%4-s.target%4)+Math.abs(Math.floor(s.selected/4)-Math.floor(s.target/4));s.moves++}s.note=s.probes[s.selected]===0?'Zero steps away. Hit SEAL.':s.probes[s.selected]+' grid steps away. Narrow it down.';s.event='probe'}
      if(cmd==='seal'&&s.selected>=0){if(s.selected===s.target)finish(s,true);else{s.errors++;s.event='bad';s.note='Wrong joint. Confidence is not a leak detector.';s.shake=.2}}
    }
    if(s.id==='braze'&&cmd==='torch-on')s.held=true;
    if(s.id==='braze'&&cmd==='torch-off')s.held=false;
    if(s.id==='air'){
      if((m=/^damper-([0-2])-(-?1)$/.exec(cmd))){const i=+m[1];s.dampers[i]=Math.max(1,Math.min(5,s.dampers[i]+Number(m[2])));s.moves++;s.event='tap'}
      if(cmd==='test'){if(airValues(s).every((v,i)=>Math.abs(v-s.targets[i])<=2))finish(s,true);else{s.errors++;s.event='bad';s.note='Somebody’s room is still a fucking terrarium.';s.shake=.2}}
    }
    if(s.id==='memory'&&(m=/^pad-([0-3])$/.exec(cmd))&&s.phase==='repeat'){
      const i=+m[1];s.lit=i;s.glow=.25;
      if(i!==s.sequence[s.input]){s.errors++;s.event='bad';s.note='Wrong order. Board is giving you another shot.';s.phase='watch';s.phaseTime=-.8;s.input=0}
      else {s.input++;s.event='good';if(s.input>=s.round+2){if(s.round===3)finish(s,true);else{s.round++;s.input=0;s.phase='watch';s.phaseTime=-.9;s.note='Next round. Pretend you were listening.'}}}
    }
    if(s.id==='pack'){
      if((m=/^case-(\d+)$/.exec(cmd))&&+m[1]<s.count){s.selected=+m[1];s.placed[s.selected]=null;s.event='tap'}
      if(cmd==='rotate')s.turns[s.selected]=(s.turns[s.selected]+1)%4;
      if((m=/^cell-(\d+)-(\d+)$/.exec(cmd))){const x=+m[1],y=+m[2],hit=occupied(s,x,y);{const i=s.selected,form=shape(s,i);if(form.some(([dx,dy])=>!s.map[y+dy]?.[x+dx]||s.map[y+dy][x+dx]==='#'||occupied(s,x+dx,y+dy)>=0)){if(hit>=0){s.placed[hit]=null;s.selected=hit;return true}s.note='That doesn’t fit. The van is not made of fucking wishes.';s.event='bad';s.shake=.18}else{s.placed[i]=[x,y,s.turns[i]];s.moves++;s.event='good';const next=s.placed.indexOf(null);if(next<0)finish(s,true);else s.selected=next}}}
    }
    return true;
  }
  function tick(s,dt){
    if(s.done)return;dt=Math.min(.05,Math.max(0,dt));s.elapsed+=dt;s.shake=Math.max(0,s.shake-dt);
    if(s.id==='drive'){
      s.phaseTime+=dt;
      if(s.phase==='tree'&&s.phaseTime>s.delay+2){s.errors++;finish(s,false)}
      if(s.phase==='run'){
        s.speed=Math.min(1,s.speed+dt*.22);s.distance+=s.speed*dt*180;
        if(s.gear<4){s.rpm+=dt*.33;if(s.rpm>1.12){s.errors++;s.note='Limiter. That sound is expensive.';s.gear++;s.rpm=.12;s.event='bad'}}
        if(s.distance>=1000){if(s.shifts.length<3)s.errors+=3-s.shifts.length;finish(s,s.quality>=4)}
      }
    }
    if(s.id==='leak')s.probePulse=Math.max(0,s.probePulse-dt*1.6);
    if(s.id==='braze'){
      s.heat=Math.max(0,Math.min(1,s.heat+dt*(s.held?.24:-.18)));
      if(s.heat>=.4&&s.heat<=.74)s.progress+=dt*.17;
      s.overheat=s.heat>.94?s.overheat+dt:0;
      if(s.progress>=1)finish(s,true);else if(s.overheat>.6||s.elapsed>35)finish(s,false);
    }
    if(s.id==='memory'){
      s.glow=Math.max(0,s.glow-dt);s.phaseTime+=dt;
      if(s.phase==='watch'){const k=Math.floor(s.phaseTime/.72),part=s.phaseTime/.72-k;s.flash=k>=0&&k<s.round+2&&part<.65?s.sequence[k]:-1;if(k>=s.round+2){s.phase='repeat';s.input=0;s.flash=-1;s.note='Your turn. Same order.'}}
      if(s.elapsed>65)finish(s,false);
    }
  }
  const api={catalog,jokes,make,action,tick,rotate,shape,occupied,airValues,checkPipe};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PS=api;
})(typeof globalThis!=='undefined'?globalThis:this);
