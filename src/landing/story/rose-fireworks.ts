import {nextRenderFrame} from '../framePacing';

export const ROSE_FIREWORK_PARTICLE_LIMIT=192;
const colors=['#ffe7b3','#ffd08b','#fff5d9','#f6a1be'];
const shells=[{x:85,y:290,scale:1},{x:1110,y:225,scale:.95},{x:620,y:65,scale:.82},{x:-35,y:520,scale:.88},{x:1235,y:475,scale:.92},{x:680,y:25,scale:1.04}];
const intervals=[1.65,2.1,1.85,2.35,1.8,2.2];
type Spark={x:number;y:number;vx:number;vy:number;life:number;color:number;born:number};
type Rocket={x:number;y:number;startX:number;born:number;index:number};
export function roseFireworkSpark(index:number,shellIndex:number,born:number):Spark{
 const shell=shells[shellIndex%shells.length],inner=index>=44,angle=index*Math.PI*2/(inner?20:44)+Math.sin(index*12.7+shellIndex)*.065;
 const speed=(inner?125:235)*( .78+((index*17+shellIndex*11)%29)/70)*shell.scale;
 return{x:shell.x,y:shell.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed*.86-32,life:(inner?2.5:3.7)+(index%7)*.12,color:inner?3:index%11===0?2:index%3,born};
}
export function roseFireworkPosition(spark:Spark,age:number){
 const t=Math.max(0,age),travel=(1-Math.exp(-.55*t))/.55;
 return{x:spark.x+spark.vx*travel,y:spark.y+spark.vy*travel+28*t*t};
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
   if(progress>=1){sparks.splice(0,Math.max(0,sparks.length+64-ROSE_FIREWORK_PARTICLE_LIMIT));for(let particle=0;particle<64;particle++)sparks.push(roseFireworkSpark(particle,rocket.index,time));rockets.splice(i,1);canvas.dataset.burstCount=String(++burstCount);continue;}
   ctx.strokeStyle='#ffdfaa';ctx.lineWidth=2.4;ctx.globalAlpha=.85;ctx.beginPath();
   for(let tail=7;tail>=0;tail--){const p=Math.max(0,progress-tail*.018),e=1-(1-p)*(1-p),x=rocket.startX+(rocket.x-rocket.startX)*e+Math.sin(Math.PI*e)*25,y=1370+(rocket.y-1370)*e;if(tail===7)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();
  }
  for(let i=sparks.length-1;i>=0;i--){
   const spark=sparks[i],age=time-spark.born;if(age>=spark.life){sparks.splice(i,1);continue;}
   const fade=Math.pow(1-age/spark.life,1.15)*Math.min(1,age/.1),head=roseFireworkPosition(spark,age);
   ctx.strokeStyle=colors[spark.color];ctx.lineWidth=spark.color===3?1.55:2.1;ctx.globalAlpha=fade*.72;ctx.beginPath();
   for(let tail=5;tail>=0;tail--){const point=roseFireworkPosition(spark,Math.max(0,age-tail*.045));if(tail===5)ctx.moveTo(point.x,point.y);else ctx.lineTo(point.x,point.y);}ctx.stroke();
   ctx.globalAlpha=fade;const size=spark.color===2?13:10;ctx.drawImage(sprites[spark.color],head.x-size/2,head.y-size/2,size,size);
  }
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
 };
 return{
  setActive(value:boolean){if(disposed||value===active)return;active=value;canvas.dataset.running=String(active);if(active){resize();last=0;deadline=null;frame=requestAnimationFrame(tick);}else{cancelAnimationFrame(frame);last=0;deadline=null;clear();}},
  reset(){sparks.length=rockets.length=0;time=next=shellIndex=burstCount=0;last=0;deadline=null;canvas.dataset.burstCount='0';clear();},
  dispose(){disposed=true;active=false;cancelAnimationFrame(frame);observer.disconnect();sparks.length=rockets.length=0;clear();sprites.forEach(sprite=>{sprite.width=sprite.height=1;});},
 };
}
