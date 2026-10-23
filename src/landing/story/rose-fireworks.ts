import {nextRenderFrame} from '../framePacing';

export const ROSE_FIREWORK_PARTICLE_LIMIT=192;
export const ROSE_DRONE_COUNT=96;
const colors=['#ffe7b3','#ffd08b','#fff5d9','#f6a1be'];
const shells=[{x:20,y:210,scale:1.12},{x:1150,y:150,scale:1.08},{x:-45,y:480,scale:1.05},{x:1240,y:440,scale:1.1},{x:35,y:60,scale:.98},{x:1150,y:40,scale:1.04}];
const intervals=[1.65,2.1,1.85,2.35,1.8,2.2];
type Spark={x:number;y:number;vx:number;vy:number;life:number;color:number;born:number;shape:number};
type Rocket={x:number;y:number;startX:number;born:number;index:number};
const smooth=(a:number,b:number,value:number)=>{const t=Math.max(0,Math.min(1,(value-a)/(b-a)));return t*t*(3-2*t);};
function heart(angle:number){return{x:16*Math.sin(angle)**3,y:-(13*Math.cos(angle)-5*Math.cos(2*angle)-2*Math.cos(3*angle)-Math.cos(4*angle))};}
const heartPath=Array.from({length:385},(_,index)=>{const p=heart(index/384*Math.PI*2);return{x:600+p.x*18,y:-180+p.y*9.4};});
const heartDistances=heartPath.map((point,index)=>index?Math.hypot(point.x-heartPath[index-1].x,point.y-heartPath[index-1].y):0);
for(let index=1;index<heartDistances.length;index++)heartDistances[index]+=heartDistances[index-1];
const droneHearts=Array.from({length:ROSE_DRONE_COUNT},(_,index)=>{
 if(index===0)return heartPath[0];
 const distance=index/ROSE_DRONE_COUNT*heartDistances[384],end=heartDistances.findIndex(value=>value>=distance),start=heartPath[end-1],finish=heartPath[end],mix=(distance-heartDistances[end-1])/(heartDistances[end]-heartDistances[end-1]);
 return{x:start.x+(finish.x-start.x)*mix,y:start.y+(finish.y-start.y)*mix};
});
export function roseDronePosition(index:number,time:number){
 const t=((time%32)+32)%32,angle=(index+.5)/ROSE_DRONE_COUNT*Math.PI*2,heartPoint=droneHearts[index];
 const infinity={x:600+310*Math.cos(angle),y:-165+75*Math.sin(2*angle)};
 const morph=smooth(12,16,t)*(1-smooth(22,26,t)),flight=smooth(index%8*.06,3.5+index%8*.06,t)*(1-smooth(29,32,t));
 const target={x:heartPoint.x+(infinity.x-heartPoint.x)*morph,y:heartPoint.y+(infinity.y-heartPoint.y)*morph};
 const start={x:index<48?-270-index*3:1470+(index-48)*3,y:310+(index%12)*17};
 const breath=Math.sin(time*.8)*2,arc=Math.sin(flight*Math.PI)*(index<48?-70:70);
 return{x:start.x+(target.x-start.x)*flight,y:start.y+(target.y-start.y)*flight+arc+breath*flight,alpha:smooth(0,.8,t)*(1-smooth(31,32,t)),formation:t<4||t>=29?'flight':t<12||t>=26?'heart':t<16||t>=22?'morph':'infinity'};
}
export function roseFireworkSpark(index:number,shellIndex:number,born:number):Spark{
 const shell=shells[shellIndex%shells.length],shape=shellIndex%4,inner=index>=44,angle=(inner?index-44:index)*Math.PI*2/(inner?20:44);
 const speed=(inner?125:235)*( .78+((index*17+shellIndex*11)%29)/70)*shell.scale;
 let vx=Math.cos(angle)*speed,vy=Math.sin(angle)*speed*.86-32;
 if(shape===0){const p=heart(angle),size=(inner?9.5:18)*shell.scale;vx=p.x*size;vy=p.y*size;}
 if(shape===1){const x=Math.cos(angle)*(inner?100:300)*shell.scale,y=Math.sin(angle)*(inner?100:62)*shell.scale;vx=x*.94-y*.34;vy=x*.34+y*.94;}
 if(shape===3){vx=Math.cos(angle)*speed;vy=Math.sin(angle)*speed*.72-100;}
 return{x:shell.x,y:shell.y,vx,vy,life:(shape===3?5.1:shape<2?4.3:inner?2.5:3.7)+(index%7)*.12,color:inner?3:index%11===0?2:index%3,born,shape};
}
export function roseFireworkPosition(spark:Spark,age:number){
 const t=Math.max(0,age),travel=(1-Math.exp(-.55*t))/.55;
 const fall=Math.max(0,t-(spark.shape<2?.85:0));
 return{x:spark.x+spark.vx*travel,y:spark.y+spark.vy*travel+(spark.shape===3?38:28)*fall*fall};
}
export function createRoseFireworks(canvas:HTMLCanvasElement){
 const ctx=canvas.getContext('2d',{alpha:true});
 if(!ctx){canvas.hidden=true;return{setActive:(_active:boolean)=>{},reset:()=>{},dispose:()=>{}};}
 const sprites=colors.map(color=>{const sprite=document.createElement('canvas');sprite.width=sprite.height=20;const brush=sprite.getContext('2d')!;const glow=brush.createRadialGradient(10,10,0,10,10,10);glow.addColorStop(0,'#fff9e8');glow.addColorStop(.2,color);glow.addColorStop(1,`${color}00`);brush.fillStyle=glow;brush.fillRect(0,0,20,20);return sprite;});
 let active=false,disposed=false,frame=0,last=0,deadline:number|null=null,time=0,next=0,shellIndex=0,burstCount=0,ratio=1,scale=1,offsetX=0,offsetY=0;
 const sparks:Spark[]=[],rockets:Rocket[]=[];
 const clear=()=>{ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);};
 const resize=()=>{
  const scene=canvas.parentElement?.getBoundingClientRect(),box=canvas.getBoundingClientRect();if(!scene||!box.width||!box.height)return;
  ratio=Math.min(window.devicePixelRatio||1,1.25);canvas.width=Math.ceil(box.width*ratio);canvas.height=Math.ceil(box.height*ratio);
  scale=Math.min(scene.width/1199,scene.height/1312);offsetX=scene.left-box.left+(scene.width-1199*scale)/2;offsetY=scene.top-box.top+scene.height-1312*scale;
 };
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
 const tick=(now:number)=>{
  if(!active||disposed)return;
  frame=requestAnimationFrame(tick);const pacing=nextRenderFrame(now,deadline,1000/30);if(pacing===null)return;deadline=pacing;
  const dt=last?Math.min((now-last)/1000,.06):0;last=now;time+=dt;
  if(time>=next){const shell=shells[shellIndex%shells.length];rockets.push({x:shell.x,y:shell.y,startX:shell.x+(shellIndex%2?-150:150),born:time,index:shellIndex});next=time+intervals[shellIndex%intervals.length];shellIndex++;}
  clear();ctx.setTransform(ratio*scale,0,0,ratio*scale,ratio*offsetX,ratio*offsetY);ctx.globalCompositeOperation='lighter';ctx.lineCap='round';ctx.lineJoin='round';
  for(let i=rockets.length-1;i>=0;i--){
   const rocket=rockets[i],progress=(time-rocket.born)/.85;
   if(progress>=1){sparks.splice(0,Math.max(0,sparks.length+64-ROSE_FIREWORK_PARTICLE_LIMIT));for(let particle=0;particle<64;particle++)sparks.push(roseFireworkSpark(particle,rocket.index,time));rockets.splice(i,1);canvas.dataset.burstCount=String(++burstCount);canvas.dataset.burstShape=['heart','saturn','chrysanthemum','willow'][rocket.index%4];continue;}
   ctx.strokeStyle='#ffdfaa';ctx.lineWidth=2.4;ctx.globalAlpha=.85;ctx.beginPath();
   for(let tail=7;tail>=0;tail--){const p=Math.max(0,progress-tail*.018),e=1-(1-p)*(1-p),x=rocket.startX+(rocket.x-rocket.startX)*e+Math.sin(Math.PI*e)*25,y=1370+(rocket.y-1370)*e;if(tail===7)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();
  }
  for(let i=sparks.length-1;i>=0;i--){
   const spark=sparks[i],age=time-spark.born;if(age>=spark.life){sparks.splice(i,1);continue;}
   const fade=Math.pow(1-age/spark.life,.8)*Math.min(1,age/.08),head=roseFireworkPosition(spark,age),tailLength=spark.shape===3?9:5;
   ctx.strokeStyle=colors[spark.color];ctx.lineWidth=spark.color===3?2.1:2.7;ctx.globalAlpha=fade*.85;ctx.beginPath();
   for(let tail=tailLength;tail>=0;tail--){const point=roseFireworkPosition(spark,Math.max(0,age-tail*(spark.shape===3?.075:.045)));if(tail===tailLength)ctx.moveTo(point.x,point.y);else ctx.lineTo(point.x,point.y);}ctx.stroke();
   ctx.globalAlpha=fade;const size=spark.color===2?18:14;ctx.drawImage(sprites[spark.color],head.x-size/2,head.y-size/2,size,size);
  }
  for(let drone=0;drone<ROSE_DRONE_COUNT;drone++){
   const point=roseDronePosition(drone,time),size=drone%12===0?16:12;
   if(drone===0&&canvas.dataset.droneFormation!==point.formation)canvas.dataset.droneFormation=point.formation;
   ctx.globalAlpha=point.alpha;ctx.drawImage(sprites[drone%12===0?2:drone%3===0?0:3],point.x-size/2,point.y-size/2,size,size);
   ctx.fillStyle='#fff7eb';ctx.fillRect(point.x-1.4,point.y-1.4,2.8,2.8);
  }
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
 };
 return{
  setActive(value:boolean){if(disposed||value===active)return;active=value;canvas.dataset.running=String(active);if(active){resize();last=0;deadline=null;frame=requestAnimationFrame(tick);}else{cancelAnimationFrame(frame);last=0;deadline=null;clear();}},
  reset(){sparks.length=rockets.length=0;time=next=shellIndex=burstCount=0;last=0;deadline=null;canvas.dataset.burstCount='0';canvas.dataset.droneFormation='idle';canvas.dataset.burstShape='none';clear();},
  dispose(){disposed=true;active=false;cancelAnimationFrame(frame);observer.disconnect();sparks.length=rockets.length=0;clear();sprites.forEach(sprite=>{sprite.width=sprite.height=1;});},
 };
}
