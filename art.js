/* Every play scene is drawn and animated here; no background screenshots. */
(function(){
'use strict';
const C={bg:'#11282c',ink:'#eef0d4',dim:'#8eaaa7',metal:'#334b50',edge:'#5b7678',orange:'#f59b51',teal:'#67d8c5',red:'#ec786b',paper:'#ead6ad'};
const wireColors=['#ee866e','#77c5dc','#82c78b','#f2ce6e'];
const caseColors=['#66c8b7','#e7a16f','#b0a5d1','#e3cd8e','#8eb8cf','#9bc375'];
let g,clock,H,targets;
function box(x,y,w,h,c,r=8,stroke){g.beginPath();g.roundRect(x,y,w,h,r);g.fillStyle=c;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=2;g.stroke()}}
function txt(t,x,y,size=26,c=C.ink,align='left',weight=700){g.font=weight+' '+size+'px ui-monospace,monospace';g.fillStyle=c;g.textAlign=align;g.textBaseline='middle';g.fillText(String(t),x,y)}
function line(x1,y1,x2,y2,c,w=3){g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.strokeStyle=c;g.lineWidth=w;g.stroke()}
function circle(x,y,r,c,stroke){g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fillStyle=c;g.fill();if(stroke){g.lineWidth=2;g.strokeStyle=stroke;g.stroke()}}
function screw(x,y){circle(x,y,5,'#647d7d');line(x-2,y+2,x+2,y-2,'#142c30',2)}
function plate(x,y,w,h,color=C.metal){box(x+3,y+5,w,h,'#0005');box(x,y,w,h,color,10,C.edge);for(const a of [[x+12,y+12],[x+w-12,y+12],[x+12,y+h-12],[x+w-12,y+h-12]])screw(...a)}
function target(cmd,label,x,y,w,h,disabled=false){targets.push({cmd,label,x,y,w,h,disabled})}
function fan(x,y,r,speed=1){
 circle(x,y,r,'#11282c',C.edge);g.save();g.translate(x,y);g.rotate(clock*speed);
 for(let i=0;i<5;i++){g.rotate(Math.PI*2/5);g.beginPath();g.moveTo(0,0);g.bezierCurveTo(r*.4,-r*.65,r*1.1,-r*.32,r*.74,r*.15);g.quadraticCurveTo(r*.3,r*.34,0,0);g.fillStyle='#708e8b';g.fill()}
 g.restore();for(let i=1;i<4;i++){g.beginPath();g.arc(x,y,r*i/4,0,Math.PI*2);g.strokeStyle='#a4c3b844';g.lineWidth=2;g.stroke()}circle(x,y,8,C.orange);
}
function progress(p,x,y,w,color=C.teal){box(x,y,w,12,'#061b20',4);box(x,y,Math.max(1,w*Math.max(0,Math.min(1,p))),12,color,4)}
function stage(){
 const bg=g.createLinearGradient(0,0,1000,H);bg.addColorStop(0,'#29474b');bg.addColorStop(.6,C.bg);bg.addColorStop(1,'#071b20');g.fillStyle=bg;g.fillRect(0,0,1000,H);
 g.strokeStyle='#bed8c708';g.lineWidth=1;for(let x=0;x<1000;x+=40){g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke()}for(let y=0;y<H;y+=40)line(0,y,1000,y,'#bed8c708',1);
 for(const [x,y]of [[18,18],[982,18],[18,H-18],[982,H-18]])screw(x,y);
}
function gridLayout(n){const size=Math.min(660,H-120),cell=size/n;return {cell,x:(1000-size)/2,y:(H-size)/2,size}}
function tilePipe(mask,x,y,cell,on,angle=0){
 box(x+3,y+3,cell-6,cell-6,'#263e43',7,'#496366');g.save();g.translate(x+cell/2,y+cell/2);g.rotate(angle);g.lineCap='round';
 for(const [bit,dx,dy]of [[1,0,-1],[2,1,0],[4,0,1],[8,-1,0]])if(mask&bit){line(0,0,dx*cell/2,dy*cell/2,'#091c20',cell*.26);line(0,0,dx*cell/2,dy*cell/2,on?'#5fa99b':'#a47e58',cell*.19);line(0,-cell*.035,dx*cell/2,dy*cell/2-cell*.035,on?'#a0e8d1':'#dfb27c',cell*.035);
 if(on){for(let k=0;k<3;k++){const p=(clock*.5+k/3)%1;circle(dx*cell*.49*p,dy*cell*.49*p,cell*.025,'#d3ffed')}}}
 circle(0,0,cell*.13,on?'#72d8bd':'#bf955d');circle(0,0,cell*.06,'#213b39');g.restore();
}
function pipe(s){const l=gridLayout(s.n);txt('IN',l.x-35,l.y+s.start*l.cell+l.cell/2,26,C.teal,'right');txt('OUT',l.x+l.size+20,l.y+s.exit*l.cell+l.cell/2,25,C.orange);s.tiles.forEach((m,i)=>{const x=l.x+i%s.n*l.cell,y=l.y+Math.floor(i/s.n)*l.cell;tilePipe(m,x,y,l.cell,s.flow[i]);target('tile-'+i,'Rotate pipe row '+(Math.floor(i/s.n)+1)+' column '+(i%s.n+1),x,y,l.cell,l.cell)})}
function wire(s){
 const top=Math.max(75,(H-500)/2),dy=Math.min(123,(H-110)/4),left=150,right=735;
 plate(85,top-44,830,dy*4+25);txt('WORK CARD',500,top-15,23,C.paper,'center');
 for(let i=0;i<4;i++){
 const y=top+dy*i+dy*.55,c=wireColors[i],j=s.links[i];
 txt(s.names[i]+' → '+s.codes[i],500,y,27,C.paper,'center');
 if(j>=0){g.beginPath();g.moveTo(left+95,y);g.bezierCurveTo(450,y+Math.sin(clock*2+i)*4,555,top+dy*j+dy*.55, right,top+dy*j+dy*.55);g.strokeStyle='#061b20';g.lineWidth=13;g.stroke();g.strokeStyle=c;g.lineWidth=7;g.stroke()}
 else{line(109,y,left,y,c,9);line(left+88,y,left+125,y+Math.sin(clock*2+i)*3,c,7)}
 box(left,y-32,95,64,j>=0?'#244b45':s.selected===i?'#546b57':'#182c31',9,s.selected===i?C.orange:c);txt(['A','B','C','D'][i],left+47,y,34,c,'center');target('lead-'+i,'Select '+s.names[i]+' wire',left-15,y-40,120,80,j>=0);
 box(right,y-32,115,64,'#12272c',7,C.edge);circle(right+22,y,11,'#050e11',C.orange);txt(s.codes[s.order[i]],right+77,y,36,C.ink,'center');target('port-'+i,'Connect to terminal '+s.codes[s.order[i]],right-10,y-40,145,80);
 }
}
function leak(s){const l=gridLayout(4);plate(l.x-30,l.y-30,l.size+60,l.size+60);for(let y=0;y<4;y++)for(let x=0;x<4;x++){const px=l.x+(x+.5)*l.cell,py=l.y+(y+.5)*l.cell;line(px,py,x<3?px+l.cell:px,py,'#92774f',15);line(px,py,px,y<3?py+l.cell:py,'#92774f',15)}
 for(let i=0;i<16;i++){const x=l.x+(i%4+.5)*l.cell,y=l.y+(Math.floor(i/4)+.5)*l.cell,known=s.probes[i]!==undefined;
 if(s.selected===i&&s.probePulse){g.beginPath();g.arc(x,y,(1-s.probePulse)*l.cell*.8+12,0,Math.PI*2);g.strokeStyle='rgba(102,218,198,'+s.probePulse+')';g.lineWidth=5;g.stroke()}
 circle(x,y,l.cell*.28,'#102c30',s.selected===i?C.orange:known?C.teal:'#7b9b97');txt(known?s.probes[i]:'?',x,y,l.cell*.28,known?C.teal:C.dim,'center');target('joint-'+i,'Probe joint '+(i+1)+(known?', '+s.probes[i]+' steps from leak':''),x-l.cell*.42,y-l.cell*.42,l.cell*.84,l.cell*.84);
 }txt('GRID STEPS TO LEAK',500,l.y+l.size+31,23,C.dim,'center')}
function truck(x,y,scale,s){g.save();g.translate(x,y);g.scale(scale,scale);const bounce=Math.sin(clock*29)*s.speed*2.2;g.translate(0,bounce);
 box(-228,-100,255,96,'#ded8bb',5,'#14262c');box(-228,-65,255,17,'#d46932',0);box(-228,-102,255,9,'#f4e6b9',1);box(17,-83,82,78,'#c66c38',5,'#14262c');
 g.fillStyle='#dd8d4d';g.beginPath();g.moveTo(20,-83);g.lineTo(70,-83);g.lineTo(110,-45);g.lineTo(146,-33);g.lineTo(151,-6);g.lineTo(14,-6);g.closePath();g.fill();
 g.fillStyle='#173d48';g.beginPath();g.moveTo(32,-74);g.lineTo(65,-74);g.lineTo(94,-45);g.lineTo(32,-45);g.closePath();g.fill();line(39,-72,72,-49,'#97c6c59c',4);
 box(102,-33,49,10,'#e9bc68',1);box(134,-20,21,15,'#e9e2c5',1);box(-235,-6,393,8,'#7f9793',1);
 for(const wx of [-170,80]){circle(wx,1,29,'#091619','#677b78');g.save();g.translate(wx,1);g.rotate(clock*(s.speed*24+.2));for(let i=0;i<5;i++){g.rotate(Math.PI*2/5);line(0,0,17,0,'#a6b5a7',5)}g.restore();circle(wx,1,6,'#303e3b')}
 line(-208,-113,45,-113,'#929e83',6);for(let i=0;i<8;i++)line(-200+i*31,-119,-200+i*31,-107,'#b8bfa8',3);line(-196,-112,-196,-99,'#757d69',4);line(0,-112,0,-99,'#757d69',4);
 txt('LAST RESORT',-102,-80,22,'#243b3a','center');txt('HEAT / AIR / BAD IDEAS',-102,-39,11,'#243b3a','center');box(35,-34,15,3,'#1e383b',1);g.restore();
}
function drive(s){
 const ground=H*.64,road=H-ground,travel=s.distance*4;
 const sky=g.createLinearGradient(0,0,0,ground);sky.addColorStop(0,'#264751');sky.addColorStop(1,'#efb46f');g.fillStyle=sky;g.fillRect(0,0,1000,ground);circle(775,H*.25,62,'#ffe1a0');
 for(let layer=0;layer<2;layer++){g.fillStyle=layer?'#264144':'#61736b';for(let i=0;i<10;i++){const x=((i*190-travel*(layer?.32:.12))%1900+1900)%1900-190;const h=65+(i*37%100);g.fillRect(x,ground-h,150,h);if(layer){for(let j=0;j<4;j++)box(x+12+j*32,ground-h+19,18,17,i%3?'#e6b56b88':'#17383c',1);line(x-4,ground-h,x+155,ground-h,'#9b8c67',5)}}}
 g.fillStyle='#22363a';g.fillRect(0,ground,1000,road);line(0,ground,1000,ground,'#bfa877',5);
 for(let i=0;i<11;i++){let x=((i*140-travel)%1540+1540)%1540-140;box(x,ground+road*.57,78,7,'#e5bd76',1);box(x+35,ground+20,110,2,'#9e9d8144',1)}
 for(let k=0;k<5;k++){const p=(clock*.9+k/5)%1;circle(205-p*100,ground+50-p*33,6+p*13,'rgba(154,172,161,'+(.16*(1-p))+')')}
 truck(440,ground+51,1.4,s);
 const tx=850,ty=Math.max(65,ground-265);plate(tx-36,ty,74,231,'#122b31');for(let i=0;i<4;i++){const green=s.phase==='tree'&&s.phaseTime>=s.delay||s.phase==='run';const lit=i===3?green:s.phase==='tree'&&s.phaseTime>=s.delay-1.5+i*.5&&!green;circle(tx,ty+38+i*50,18,lit?(i===3?C.teal:C.orange):'#31433e',lit?'#f9dca0':'#52615b')}
 const stageText=s.phase==='stage'?'READY TO ROLL?':s.phase==='tree'?(s.phaseTime>=s.delay?'GREEN. SEND IT.':'WAIT FOR IT…'):s.gear<4?'GEAR '+s.gear+' / SHIFT IN ORANGE':'KEEP IT TOGETHER';
 txt(stageText,500,45,35,s.phase==='tree'&&s.phaseTime>=s.delay?C.teal:C.ink,'center');
 if(s.phase==='run'&&s.gear<4){const x=185,w=630,y=H-65;box(x,y,w,26,'#101e23',4);box(x+w*.72,y,w*.18,26,C.orange,2);box(x+w*Math.min(1,s.rpm)-3,y-8,6,42,C.ink,1);txt('RPM',x-16,y+13,22,C.dim,'right')}
 else{txt(s.phase==='run'?'JUST ANOTHER “QUICK” CALL.':'A WORK VAN. A DRAG TREE. A TERRIBLE IDEA.',500,H-45,24,C.paper,'center')}
}
function braze(s){
 const pipeY=H*.53,seamX=500,hot=s.heat>=.4&&s.heat<=.74;
 plate(80,H*.16,840,H*.58,'#233a3e');
 for(const x of [130,510]){const grad=g.createLinearGradient(0,pipeY-52,0,pipeY+52);grad.addColorStop(0,'#5c3d28');grad.addColorStop(.35,'#edb874');grad.addColorStop(.52,'#aa6e3d');grad.addColorStop(1,'#503d2b');box(x,pipeY-52,360,104,grad,8);for(let k=0;k<8;k++)line(x+20+k*43,pipeY-47,x+20+k*43,pipeY-35,'#f4d19c66',2)}
 const torchY=pipeY+70-s.progress*130;
 line(seamX,pipeY+54,seamX,pipeY+54-s.progress*108,C.orange,17);
 if(s.heat>.2){g.save();g.globalAlpha=s.heat;g.shadowBlur=50*s.heat;g.shadowColor='#ff6a26';circle(seamX,torchY,25,'#ff9b4b88');g.restore()}
 if(s.held){g.save();g.translate(seamX+80,torchY+80);g.rotate(-.75);box(-13,-5,26,130,'#91a6a1',4);g.beginPath();g.moveTo(-18,-7);g.quadraticCurveTo(Math.sin(clock*50)*10,-100,18,-7);g.fillStyle='#6ec8e8aa';g.fill();g.beginPath();g.moveTo(-9,-4);g.lineTo(0,-70-Math.sin(clock*34)*12);g.lineTo(9,-4);g.fillStyle='#dbfaff';g.fill();g.restore();
 if(hot)for(let i=0;i<13;i++){const p=(clock*2.3+i/13)%1,ang=i*2.4;circle(seamX+Math.cos(ang)*p*95,torchY+Math.sin(ang)*p*80+p*p*40,2.5*(1-p),'#ffc676')}
 }
 txt('SEAM',175,H*.19+18,23,C.dim);txt(Math.round(s.progress*100)+'%',825,H*.19+18,30,hot?C.teal:C.paper,'right');
 const x=160,y=H-105,w=680;box(x,y,w,28,'#071d23',5);box(x+w*.4,y,w*.34,28,C.orange,2);box(x+w*s.heat-4,y-8,8,44,C.ink,2);txt('COLD',x,y+54,22,C.dim);txt('TOO FUCKING HOT',x+w,y+54,22,C.red,'right');txt(hot?'THAT’S THE SPOT.':s.heat<.4?'GIVE IT SOME HEAT.':'EASE OFF.',500,55,32,hot?C.teal:C.paper,'center');
}
function air(s){
 const flows=PS.airValues(s),top=Math.max(120,H*.26),w=240,gap=45,x0=(1000-(w*3+gap*2))/2;fan(500,top-75,49,6);
 line(500,top-16,500,top+45,'#a1c3b5',18);line(210,top+45,790,top+45,'#719188',18);
 for(let i=0;i<3;i++){const x=x0+i*(w+gap),cx=x+w/2,y=top+95,h=Math.min(250,H-top-180);line(cx,top+45,cx,y,'#829c86',14);
 for(let k=0;k<6;k++){const p=(clock*(flows[i]/60+.3)+k/6)%1;circle(cx,y-50+p*50,4,C.teal)}
 plate(x,y,w,h,'#223e41');txt(['LIVING','OFFICE','BONUS'][i],cx,y+38,29,C.ink,'center');txt(flows[i]+'%',cx,y+h*.5,58,Math.abs(flows[i]-s.targets[i])<=2?C.teal:C.orange,'center');txt('TARGET '+s.targets[i]+'%',cx,y+h-35,25,C.paper,'center');
 const by=y+h+18;box(cx-105,by,75,65,'#10262c',7,C.edge);box(cx+30,by,75,65,'#10262c',7,C.edge);txt('−',cx-68,by+33,42,C.ink,'center');txt('+',cx+68,by+33,38,C.ink,'center');txt(s.dampers[i],cx,by+33,30,C.orange,'center');target('damper-'+i+'--1','Decrease '+['living','office','bonus'][i]+' damper',cx-110,by,85,70);target('damper-'+i+'-1','Increase '+['living','office','bonus'][i]+' damper',cx+25,by,85,70);
 }
}
function memory(s){
 const sz=Math.min(270,(H-180)/2),gap=24,x0=500-sz-gap/2,y0=(H-(sz*2+gap))/2+25;const colors=[C.orange,C.teal,'#a6baed','#c59fca'];
 txt(s.phase==='watch'?'WATCH THE BOARD':'YOUR TURN',500,43,34,s.phase==='watch'?C.orange:C.teal,'center');txt('ROUND '+s.round+' / 3',500,H-30,24,C.dim,'center');
 for(let i=0;i<4;i++){const x=x0+(i%2)*(sz+gap),y=y0+Math.floor(i/2)*(sz+gap),on=s.phase==='watch'?s.flash===i:s.lit===i&&s.glow>0;plate(x,y,sz,sz,'#223b40');if(on){g.save();g.shadowBlur=34;g.shadowColor=colors[i];box(x+23,y+23,sz-46,sz-46,colors[i],10);g.restore()}else box(x+23,y+23,sz-46,sz-46,'#15292e',10,'#426167');circle(x+sz/2,y+sz*.43,sz*.17,on?'#ffffff88':colors[i]+'66',colors[i]);txt(['STAT','RELAY','FAN','RUN'][i],x+sz/2,y+sz*.78,30,on?'#142d30':colors[i],'center');target('pad-'+i,'Sequence pad '+(i+1)+' '+['stat','relay','fan','run'][i],x,y,sz,sz,s.phase!=='repeat')}
}
function pack(s){
 const n=s.map[0].length,rows=s.map.length,cell=Math.min(120,(H-245)/rows),x0=(1000-cell*n)/2,y0=56;
 plate(x0-24,y0-22,n*cell+48,rows*cell+44,'#536364');
 s.map.forEach((row,y)=>Array.from(row).forEach((v,x)=>{const px=x0+x*cell,py=y0+y*cell,id=PS.occupied(s,x,y);box(px+2,py+2,cell-4,cell-4,v==='#'?'#142a2d':'#32494b',4,'#69807a');if(v==='#'){for(let k=0;k<4;k++)line(px+12,py+12+k*cell/5,px+cell-12,py+12+k*cell/5,'#718278',5)}else{if(id>=0){box(px+7,py+7,cell-14,cell-14,caseColors[id],5,'#09282a');line(px+cell*.3,py+cell*.5,px+cell*.7,py+cell*.5,'#213b36',5)}else txt('·',px+cell/2,py+cell/2,25,'#9bb0a1','center');target('cell-'+x+'-'+y,'Van square row '+(y+1)+' column '+(x+1),px,py,cell,cell)}}));
 const bw=Math.min(130,800/s.count),gap=12,total=s.count*(bw+gap)-gap,by=y0+rows*cell+46;
 for(let i=0;i<s.count;i++){const x=(1000-total)/2+i*(bw+gap),form=PS.shape(s,i);box(x,by,bw,110,s.selected===i?'#617265':'#183338',8,s.selected===i?C.orange:C.edge);for(const [dx,dy]of form)box(x+14+dx*21,by+12+dy*21,18,18,caseColors[i],3);txt(String.fromCharCode(65+i)+(s.placed[i]?' ✓':''),x+bw/2,by+94,22,C.paper,'center');target('case-'+i,'Select cargo case '+String.fromCharCode(65+i),x,by,bw,110)}
}
function paint(ctx,s,time,height=650){g=ctx;clock=time;H=height;targets=[];g.clearRect(0,0,1000,H);g.save();stage();if(s.shake)g.translate(Math.sin(time*90)*s.shake*22,0);({drive,pipe,wire,leak,braze,air,memory,pack})[s.id](s);g.restore();return targets}
window.PSArt={paint};
})();
