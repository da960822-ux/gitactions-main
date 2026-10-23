import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import {expect,it,vi} from 'vitest';
import {RoseGiftFinale,roseGiftCanCelebrate,roseGiftClosingLine,roseGiftPose} from './story/RoseGiftFinale';
import {ROSE_FIREWORK_PARTICLE_LIMIT,ROSE_DRONE_COUNT,createRoseFireworks,roseDronePosition,roseFireworkSpark,roseFireworkPosition,roseDroneStage} from './story/rose-fireworks';
import {ROSE_DRONE_CYCLE,ROSE_DRONE_FORMATIONS,ROSE_DRONE_PALETTE,ROSE_DRONE_SOURCE_COUNTS,ROSE_DRONE_FINAL_MESSAGE,ROSE_DRONE_PROVENANCE,roseDroneFormations} from './story/rose-drone-formations';

it('gates fireworks on the fully settled handover while visible, never on initial contact or transfer',()=>{
 for(const seconds of [-1,0,1.2,1.65,2.85,2.999,NaN,Infinity])expect(roseGiftCanCelebrate(seconds,true)).toBe(false);
 expect(roseGiftCanCelebrate(3,true)).toBe(true);expect(roseGiftCanCelebrate(3,false)).toBe(false);
 expect(roseGiftCanCelebrate(0,true)).toBe(false);expect(roseGiftCanCelebrate(3,true)).toBe(true);
});

it('registers repeating canvas fireworks behind the unchanged single rose and uses borderless reduced-motion light clouds',()=>{
 const html=renderToStaticMarkup(<RoseGiftFinale language="ko"/>),reduced=renderToStaticMarkup(<RoseGiftFinale language="ko" reducedMotion/>);
 expect(html).toContain('data-celebration="idle"');expect(html).toContain('data-trigger="handover-complete"');
 expect(html).toContain('<canvas class="rg-celebration"');expect(html).toContain('data-running="false"');expect(html).toContain('data-burst-count="0"');
 expect(html).toContain('data-drone-formation="idle"');expect(html).toContain('data-burst-shape="none"');
 expect(html).not.toContain('rg-firework-ray');expect(html).not.toContain('<ellipse');
 expect(html.indexOf('class="rg-celebration"')).toBeLessThan(html.indexOf('class="rg-live"'));
 expect(reduced).toContain('data-celebration="static"');expect(reduced).toContain('rg-celebration-glow');
 expect(html.match(/data-flower-instance="single"/g)).toHaveLength(1);
});

it('uses layered golden and rose sparks with gravity-curved tails instead of rigid sunburst rays',()=>{
 const sparks=Array.from({length:64},(_,i)=>roseFireworkSpark(i,0,0));
 expect(new Set(sparks.map(spark=>spark.color)).size).toBe(4);
 expect(sparks.slice(0,44).every(spark=>spark.life>=3.7)).toBe(true);
 expect(sparks.slice(44).every(spark=>spark.color===3)).toBe(true);
 for(const spark of sparks){
  expect(roseFireworkPosition(spark,0)).toEqual({x:spark.x,y:spark.y});
  const end=roseFireworkPosition(spark,spark.life),late=roseFireworkPosition(spark,spark.life-.2);
  expect([end.x,end.y,late.x,late.y].every(Number.isFinite)).toBe(true);expect(end.y).toBeGreaterThan(late.y);
 }
});

it('keeps firing past ten seconds, pauses without backlog, bounds particles, and disposes its single frame loop',()=>{
 let nextId=0,draws=0,maxDraws=0;const frames=new Map<number,FrameRequestCallback>();
 const noop=()=>{},disconnect=vi.fn(),context={save:noop,restore:noop,rect:noop,clip:noop,setTransform:noop,clearRect:noop,beginPath:noop,moveTo:noop,lineTo:noop,stroke:noop,drawImage:()=>{draws++;},fillRect:noop,createRadialGradient:()=>({addColorStop:noop})};
 const canvas={width:0,height:0,dataset:{burstCount:'0'},parentElement:{getBoundingClientRect:()=>({left:0,top:0,width:600,height:656})},getBoundingClientRect:()=>({left:-150,top:-118.08,width:900,height:892.16}),getContext:()=>context} as unknown as HTMLCanvasElement;
 class Observer{observe=noop;disconnect=disconnect;}
 vi.stubGlobal('window',{devicePixelRatio:2});vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>context})});vi.stubGlobal('ResizeObserver',Observer);
 vi.stubGlobal('requestAnimationFrame',(callback:FrameRequestCallback)=>{frames.set(++nextId,callback);return nextId;});vi.stubGlobal('cancelAnimationFrame',(id:number)=>frames.delete(id));
 const step=(time:number)=>{const scheduled=[...frames.values()];frames.clear();const before=draws;scheduled.forEach(callback=>callback(time));maxDraws=Math.max(maxDraws,draws-before);};
 try{
  const controller=createRoseFireworks(canvas);expect(frames.size).toBe(0);controller.setActive(true);
  const seen=new Set<string|undefined>();for(let frame=0;frame<3960;frame++){step(frame*1000/60);seen.add(canvas.dataset.droneFormation);}
  for(const formation of [...ROSE_DRONE_FORMATIONS,'morph','flight'])expect(seen.has(formation)).toBe(true);
  expect(Number(canvas.dataset.burstCount)).toBeGreaterThan(4);expect(maxDraws).toBeGreaterThan(64+ROSE_DRONE_COUNT);expect(maxDraws).toBeLessThanOrEqual(ROSE_FIREWORK_PARTICLE_LIMIT+2*ROSE_DRONE_COUNT);expect(canvas.width).toBe(1125);
  expect(canvas.dataset.droneFormation).toBe('flight');expect(['heart','saturn','chrysanthemum','willow']).toContain(canvas.dataset.burstShape);
  const bursts=canvas.dataset.burstCount,formation=canvas.dataset.droneFormation;controller.setActive(false);expect(frames.size).toBe(0);expect(canvas.dataset.running).toBe('false');step(90000);expect(canvas.dataset.burstCount).toBe(bursts);expect(canvas.dataset.droneFormation).toBe(formation);
  controller.setActive(true);step(90016);expect(canvas.dataset.burstCount).toBe(bursts);expect(frames.size).toBe(1);
  controller.reset();step(100000);
  for(const [at,formation] of [[108000,'pokeball'],[120000,'magikarp'],[132000,'gyarados'],[144000,'pikachu'],[156000,'message'],[164000,'flight']] as const){
   const previous=Number(canvas.dataset.burstCount);step(at);expect(canvas.dataset.droneFormation).toBe(formation);expect(Number(canvas.dataset.burstCount)-previous).toBeLessThanOrEqual(1);expect(frames.size).toBe(1);
  }
  controller.setActive(false);const stopped=canvas.dataset.burstCount;controller.setActive(true);step(900000);expect(canvas.dataset.droneFormation).toBe('flight');expect(canvas.dataset.burstCount).toBe(stopped);
  controller.reset();expect(canvas.dataset.burstCount).toBe('0');expect(canvas.dataset.droneFormation).toBe('idle');expect(canvas.dataset.burstShape).toBe('none');controller.dispose();expect(frames.size).toBe(0);expect(disconnect).toHaveBeenCalled();controller.setActive(true);expect(frames.size).toBe(0);
 }finally{vi.unstubAllGlobals();}
});

it('alternates a symmetric heart, tilted Saturn ring, chrysanthemum and long falling willow',()=>{
 const heart=Array.from({length:44},(_,index)=>roseFireworkSpark(index,0,0));
 expect(heart[0].vx).toBeCloseTo(0);expect(heart[0].vy).toBeLessThan(0);expect(heart[22].vy).toBeGreaterThan(300);
 for(let index=1;index<22;index++){expect(heart[index].vx).toBeCloseTo(-heart[44-index].vx,8);expect(heart[index].vy).toBeCloseTo(heart[44-index].vy,8);}
 const ring=Array.from({length:44},(_,index)=>roseFireworkSpark(index,1,0));
 const axes=ring.map(p=>({x:p.vx*.94+p.vy*.34,y:-p.vx*.34+p.vy*.94}));
 expect(Math.max(...axes.map(p=>Math.abs(p.x)))/Math.max(...axes.map(p=>Math.abs(p.y)))).toBeGreaterThan(4.7);
 const flower=roseFireworkSpark(0,2,0),willow=roseFireworkSpark(0,3,0);
 expect(new Set([heart[0].shape,ring[0].shape,flower.shape,willow.shape]).size).toBe(4);
 expect(willow.life).toBeGreaterThan(5);expect(willow.life).toBeGreaterThan(flower.life);
 expect(roseFireworkPosition(willow,4).y).toBeGreaterThan(roseFireworkPosition(willow,3).y);
});

it('keeps the measured photographic dots, individual brightness and RGB palette, with invisible padding rather than invented lights',()=>{
 expect(ROSE_DRONE_COUNT).toBe(1280);expect(ROSE_DRONE_CYCLE).toBe(64);
 expect(ROSE_DRONE_FORMATIONS).toEqual(['pokeball','magikarp','gyarados','pikachu','message']);
 expect(ROSE_DRONE_SOURCE_COUNTS).toEqual([492,801,1049,795,577]);
 expect(ROSE_DRONE_PALETTE.length).toBeGreaterThan(40);expect(ROSE_DRONE_PALETTE.length).toBeLessThan(128);
 for(let scene=0;scene<roseDroneFormations.length;scene++){
  const lights=roseDroneFormations[scene],visible=lights.filter(p=>p.alpha>0);
  expect(lights).toHaveLength(ROSE_DRONE_COUNT);expect(visible).toHaveLength(ROSE_DRONE_SOURCE_COUNTS[scene]);
  expect(new Set(visible.map(p=>`${p.x},${p.y}`)).size).toBe(visible.length);
  for(const p of visible){expect(p.x).toBeGreaterThanOrEqual(290);expect(p.x).toBeLessThanOrEqual(910);expect(p.y).toBeGreaterThanOrEqual(-380);expect(p.y).toBeLessThanOrEqual(-20);expect(p.alpha).toBeGreaterThan(0);expect(p.alpha).toBeLessThanOrEqual(1);expect(ROSE_DRONE_PALETTE[p.color]).toMatch(/^#[0-9a-f]{6}$/);}
  if(scene<4){
   expect(visible.some(p=>p.alpha<.9)).toBe(true);
   const source=ROSE_DRONE_PROVENANCE[scene],xs=visible.map(p=>p.x),ys=visible.map(p=>p.y),[x0,y0,x1,y1]=source.bounds;
   expect(source.pointCount).toBe(visible.length);expect(source.sha256).toMatch(/^[0-9a-f]{64}$/);expect(source.crop).toHaveLength(4);
   expect(Math.max(...xs)-Math.min(...xs)).toBeCloseTo((x1-x0)*source.normalization.scale,1);
   expect(Math.max(...ys)-Math.min(...ys)).toBeCloseTo((y1-y0)*source.normalization.scale,1);
   expect(source.url).toMatch(/^https:\/\//);
  }
 }
 expect(ROSE_DRONE_PROVENANCE[0].url).toContain('Screenshot-2026-07-31-130136.png');
 for(const source of ROSE_DRONE_PROVENANCE.slice(1))expect(source.url).toContain('youtube.com/watch?v=t-2KJGqc3OI');
});

it('preserves photographed position and premultiplied light color across eight-second holds, four-second morphs and the repeated flight',()=>{
 const times=[8,20,32,44,56],rgb=(color:number)=>ROSE_DRONE_PALETTE[color].slice(1).match(/../g)!.map(hex=>parseInt(hex,16));
 const colorAt=(p:ReturnType<typeof roseDronePosition>)=>rgb(p.fromColor).map((value,channel)=>(value+(rgb(p.color)[channel]-value)*p.colorMix)*p.alpha);
 for(let scene=0;scene<times.length;scene++)for(let index=0;index<ROSE_DRONE_COUNT;index++){
  const p=roseDronePosition(index,times[scene]),target=roseDroneFormations[scene][index];expect(p.formation).toBe(ROSE_DRONE_FORMATIONS[scene]);expect(p.alpha).toBe(target.alpha);expect(p.colorMix).toBe(0);
  expect(p.x).toBeCloseTo(target.x,8);expect(Math.abs(p.y-target.y)).toBeLessThan(2.01);
  expect(roseDronePosition(index,times[scene]-3).formation).toBe(ROSE_DRONE_FORMATIONS[scene]);expect(roseDronePosition(index,times[scene]+3).formation).toBe(ROSE_DRONE_FORMATIONS[scene]);
 }
 for(let index=0;index<ROSE_DRONE_COUNT;index+=7){
  for(const boundary of [4,12,16,24,28,36,40,48,52,60,64]){
   const before=roseDronePosition(index,boundary-1e-4),after=roseDronePosition(index,boundary+1e-4);
   expect(Math.hypot(before.x-after.x,before.y-after.y)).toBeLessThan(.02);
   colorAt(before).forEach((value,channel)=>expect(Math.abs(value-colorAt(after)[channel])).toBeLessThan(.01));
  }
  const middle=roseDronePosition(index,26);expect(middle.formation).toBe('morph');expect(middle.colorMix).toBeGreaterThanOrEqual(0);expect(middle.colorMix).toBeLessThanOrEqual(1);
  expect(roseDronePosition(index,26+ROSE_DRONE_CYCLE)).toEqual(middle);
  expect(roseDronePosition(index,64-1e-5).alpha).toBeLessThan(.001);expect(roseDronePosition(index,64+1e-5).alpha).toBeLessThan(.001);
 }
 expect(roseDronePosition(0,1).formation).toBe('flight');expect(roseDronePosition(0,0).alpha).toBe(0);
});

it('ends with the three-line I LOVE YOU / LISBETH / heart message and confines shots to the old center and right',()=>{
 expect(ROSE_DRONE_FINAL_MESSAGE).toEqual(['I LOVE YOU','LISBETH']);
 const message=roseDroneFormations[4].filter(p=>p.alpha>0),first=message.filter(p=>p.y<-280),second=message.filter(p=>p.y>-280&&p.y<-175),heart=message.filter(p=>p.y>-150);
 expect(first.length).toBeGreaterThan(150);expect(second.length).toBeGreaterThan(150);expect(heart).toHaveLength(160);
 for(const row of [first,second])expect(Math.max(...row.map(p=>p.x))-Math.min(...row.map(p=>p.x))).toBeGreaterThan(340);
 expect(new Set(Array.from({length:12},(_,shell)=>{const p=roseFireworkSpark(0,shell,0);return `${p.x},${p.y}`;}))).toEqual(new Set(['600,-200','1235,60']));
});

it('contains the larger desktop show between the visible navigation and live copy with its expanded canvas, retaining the mobile footprint',()=>{
 const css=readFileSync(new URL('./story/rose-gift-finale.css',import.meta.url),'utf8');
 expect(css).toContain('inset:-36% -25% -18% -100%;width:225%');expect(css).toContain('.rg-celebration{left:-25%;width:150%}');
 for(const [width,height,copyTop,navBottom] of [[1440,900,393,64],[1920,1080,530,96],[1280,720,320,96],[1440,900,340,96]]){
  const artHeight=Math.max(420,Math.min(760,height*.66)),artWidth=width*(.85-.04)*1.35/2,scale=Math.min(artWidth/1199,artHeight/1312),stage=roseDroneStage({left:0,top:63,width:width-15},copyTop,scale,navBottom);
  expect(stage.scale).toBeLessThanOrEqual(scale*1.8);expect(stage.top).toBeGreaterThanOrEqual(navBottom+12);expect(stage.top+stage.height).toBeLessThanOrEqual(copyTop-28+.001);
  expect(stage.left).toBeGreaterThan(0);expect(stage.left+stage.width).toBeLessThan(width*.45);
  expect(stage.padding).toBeGreaterThan((18+2+4.75)*stage.scale);expect(stage.top+stage.height+stage.padding).toBeLessThan(copyTop);
  for(let step=0;step<=40;step++){const point=roseDronePosition(399,36+step/10);expect(stage.top+(point.y+380-4.75)*stage.scale).toBeGreaterThanOrEqual(stage.top-stage.padding);}
 }
 const large=roseDroneStage({left:0,top:63,width:1425},393,594/1312,64);expect(large.scale/(594/1312)).toBeGreaterThan(1.7);
});

it('keeps the static light-cloud fallback when a 2D canvas is unavailable',()=>{
 const canvas={hidden:false,getContext:()=>null} as unknown as HTMLCanvasElement,controller=createRoseFireworks(canvas);
 expect(canvas.hidden).toBe(true);expect(()=>{controller.setActive(true);controller.reset();controller.dispose();}).not.toThrow();
});

it('keeps the full photographed headroom and glow inside the desktop section and below mobile copy',()=>{
 const css=readFileSync(new URL('./story/rose-gift-finale.css',import.meta.url),'utf8');
 expect(css).toContain('min-height:420px;margin-top:160px');expect(css).toContain('min-height:380px;margin-top:32px');
 for(const [width,height] of [[1440,900],[1920,1080],[1280,720]]){
  const artHeight=Math.max(420,Math.min(760,height*.66)),artWidth=width*(.85-.04)*1.35/2,scale=Math.min(artWidth/1199,artHeight/1312);
  expect(height*.06+160+artHeight-1312*scale-(380+4.75)*scale).toBeGreaterThan(0);
 }
 for(const [width,height] of [[390,844],[360,740]]){
  const artHeight=Math.max(380,height*.65),scale=Math.min((width-48)/1199,artHeight/1312);
  expect(28+32+artHeight-1312*scale-(380+4.75)*scale).toBeGreaterThan(0);
 }
});

it('uses the playful lifetime-partner line only after receiving and an actual pact answer',()=>{
 for(const language of ['ko','es'] as const){
  const normal=roseGiftClosingLine(language,true,false);
  expect(roseGiftClosingLine(language,false,true)).toBe(normal);
  const signed=roseGiftClosingLine(language,true,true);
  expect(signed.startsWith(language==='ko'?'네가 사인했으니까, 이제 우리는 평생 함께야, Baby.':'Como firmaste, ahora vamos a estar juntos toda la vida, Baby.')).toBe(true);
  expect(signed).toContain(language==='ko'?'내가 제일 좋아하는 내 편':'Mi persona favorita');
  expect(normal).not.toContain(language==='ko'?'네가 사인했으니까':'Como firmaste');
 }
});

it('renders one live layered cutout and preserves semantics, loading and the approved static fallback',()=>{
 const html=renderToStaticMarkup(<RoseGiftFinale language="es" pactAccepted/>);
 expect(html).toContain('aria-labelledby="rose-gift-title"');
 expect(html).toContain('role="img"');
 expect(html).toContain('Yeonseok le ofrece una rosa roja a Lisbeth');
 for(const asset of ['received','offer','body-clean','rose-single','limb-atlas','hand-pose-atlas'])expect(html).toContain(`/images/rose-gift/${asset}.png`);
 for(const retired of ['contact.png','rg-pose'])expect(html).not.toContain(retired);
 expect(html.match(/data-flower-instance="single"/g)).toHaveLength(1);
 expect(html).toContain('data-rig="complete-limb-handover"');
 expect(html).toMatch(/href="\/images\/rose-gift\/body-clean.png"[^>]*mask="url\(#[^"]+-body-underlay\)"/);
 expect(html.match(/href="\/images\/rose-gift\/limb-atlas.png"/g)).toHaveLength(3);
 expect(html.match(/href="\/images\/rose-gift\/hand-pose-atlas.png"/g)).toHaveLength(2);
 for(const hand of ['donor-closed','donor-open','recipient-open','recipient-closed'])expect(html).toContain(`data-rg-joint="${hand}"`);
 expect(html).toContain('data-rg-joint="donor-arm"');
 expect(html).not.toContain('data-rg-joint="donor-lower"');
 expect(html).toContain('data-rg-joint="recipient-lower"');
 expect(html).not.toContain('data-rg-joint="donor-grip"');
 expect(html).not.toContain('data-rg-joint="recipient-reach"');
 expect(html).toMatch(/class="rg-replay" disabled=""/);
 expect(html).not.toContain('Ya firmaste');
 expect(html.match(/<canvas /g)).toHaveLength(1);
 expect(html).not.toContain('<filter');
 expect(html).not.toContain('wrist-skin');
 expect(html).toMatch(/href="\/images\/rose-gift\/offer.png"[^>]*clip-path="url\(#[^"]+-recipient-upper\)"/);
 expect(html).not.toContain('opacity=');
 expect(html.indexOf('data-rg-joint="recipient-open"')).toBeLessThan(html.indexOf('data-flower-instance="single"'));
 expect(html.indexOf('data-rg-joint="donor-hands"')).toBeGreaterThan(html.indexOf('data-flower-instance="single"'));
 expect(html.indexOf('data-rg-joint="donor-closed"')).toBeGreaterThan(html.indexOf('data-rg-joint="recipient-closed"'));
 expect(html).not.toContain('recipient-open-window');
 expect(html).toContain('data-rg-joint="recipient-closed" visibility="hidden"');
 expect(html).toContain('data-rg-joint="recipient-lower"');
});

it('holds distinct contacts before transfer, then retreats after acceptance',()=>{
 const contact=roseGiftPose(1.2);
 for(const seconds of [1.2,1.5,1.65,1.85]){
  const p=roseGiftPose(seconds);
  expect(p.donorGrip).toEqual(contact.donorGrip);
  expect(p.recipientGrip).toEqual(contact.recipientGrip);
 }
 expect(roseGiftPose(1.6).owner).toBe('donor');
 expect(roseGiftPose(1.7).owner).toBe('recipient');
 expect(roseGiftPose(2.4).donorGrip).not.toEqual(contact.donorGrip);
});

it('starts with a gripping donor and separated open recipient, closes her hand before he releases',()=>{
 const start=roseGiftPose(0);
 expect(start.donorOpen).toBe(0);expect(start.recipientClosed).toBe(false);
 expect(Math.hypot(start.donorGrip.x-start.recipientGrip.x,start.donorGrip.y-start.recipientGrip.y)).toBeGreaterThan(100);
 expect(roseGiftPose(1.2).recipientTurn).toBeGreaterThan(0);
 expect(roseGiftPose(1.35).recipientTurn).toBe(30);
 expect(roseGiftPose(1.35).recipientClosed).toBe(false);
 expect(roseGiftPose(1.379).recipientClosed).toBe(false);
 expect(roseGiftPose(1.38).recipientClosed).toBe(true);
 expect(roseGiftPose(1.5).recipientClosed).toBe(true);
 expect(roseGiftPose(1.5).donorOpen).toBe(0);
 expect(roseGiftPose(1.65).recipientClosed).toBe(true);
 expect(roseGiftPose(1.65).donorOpen).toBeGreaterThan(0);
 expect(roseGiftPose(3).donorOpen).toBe(1);expect(roseGiftPose(3).recipientClosed).toBe(true);
});

it('registers both receiving poses to the same wrist projection while the donor still covers the switch',()=>{
 const before=roseGiftPose(1.38-1e-6),after=roseGiftPose(1.38+1e-6);
 expect(before.recipientClosed).toBe(false);expect(after.recipientClosed).toBe(true);
 expect(before.recipientWristWorld).toEqual(after.recipientWristWorld);
 expect(before.recipientTurn).toBe(after.recipientClosedTurn);
 expect(before.recipientForeshorten).toBeCloseTo(after.recipientClosedForeshorten,10);
 expect(before.recipientForeshorten).toBeGreaterThan(0);
 expect(before.recipientForeshorten).toBeLessThan(.4);
 expect(before.donorOpen).toBe(0);expect(after.donorOpen).toBe(0);
 for(const time of [1.6,1.75,1.85,1.95]){
  const p=roseGiftPose(time),previous=roseGiftPose(time-.01);
  expect(p.recipientClosedForeshorten).toBeGreaterThanOrEqual(previous.recipientClosedForeshorten);
  expect(p.recipientClosedForeshorten).toBeLessThanOrEqual(1);
 }
 expect(roseGiftPose(3).recipientClosedForeshorten).toBe(1);
});

it('keeps the received original and localized replay semantics for reduced motion',()=>{
 for(const language of ['ko','es'] as const){
  const html=renderToStaticMarkup(<RoseGiftFinale language={language} reducedMotion pactAccepted/>);
  expect(html).toContain('data-static="true"');
  expect(html).toContain('data-phase="received"');
  expect(html).toMatch(/class="rg-static" src="\/images\/rose-gift\/received.png"/);
  expect(html).toMatch(/type="button" class="rg-replay" disabled=""/);
  expect(html).toContain(language==='ko'?'한 번 더 보기':'Ver otra vez');
  expect(html).toContain(roseGiftClosingLine(language,true,true));
 }
});

it('has continuous flower position and direction at the ownership change in both seek directions',()=>{
 const before=roseGiftPose(1.65-1e-6),contact=roseGiftPose(1.65),after=roseGiftPose(1.65+1e-6);
 expect(before.owner).toBe('donor');expect(contact.owner).toBe('recipient');
 for(const pose of [before,after]){
  expect(Math.hypot(pose.rose.x-contact.rose.x,pose.rose.y-contact.rose.y)).toBeLessThan(.001);
  expect(Math.abs(pose.roseAngle-contact.roseAngle)).toBeLessThan(.001);
 }
});

it('keeps the rose rigidly attached to the carrying hand instead of independently sliding between sprites',()=>{

 for(let frame=0;frame<=180;frame++){
  const pose=roseGiftPose(frame/60),grip=pose.owner==='donor'?pose.donorGrip:{x:pose.recipientGrip.x+pose.stemOffset.x,y:pose.recipientGrip.y+pose.stemOffset.y};
  expect(Math.hypot(pose.rose.x-grip.x,pose.rose.y-grip.y)).toBeCloseTo(0,8);
  expect([pose.donor,pose.elbow,pose.recipient,pose.rose.x,pose.rose.y,pose.roseAngle].every(Number.isFinite)).toBe(true);
 }
 expect(roseGiftPose(-1)).toEqual(roseGiftPose(0));
 expect(roseGiftPose(9)).toEqual(roseGiftPose(3));
 expect(roseGiftPose(3).phase).toBe('received');
});


it('keeps two separate hand contacts on the same rigid stem throughout the hold',()=>{
 for(let frame=144;frame<=204;frame++){
  const p=roseGiftPose(frame/120),separation=Math.hypot(p.donorGrip.x-p.recipientGrip.x,p.donorGrip.y-p.recipientGrip.y);
  expect(separation).toBeGreaterThan(30);expect(separation).toBeLessThan(45);
  expect(Math.hypot(p.rose.x-p.donorGrip.x,p.rose.y-p.donorGrip.y)).toBeLessThan(1e-8);
  expect(Math.hypot(p.rose.x-p.stemOffset.x-p.recipientGrip.x,p.rose.y-p.stemOffset.y-p.recipientGrip.y)).toBeLessThan(1e-8);
 }
});

it('preserves articulated limb lengths and continuous wrists through reach, acceptance and settling',()=>{
 let previous=roseGiftPose(0);
 for(let frame=0;frame<=360;frame++){
  const p=roseGiftPose(frame/120),distance=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y);
  expect(distance({x:522,y:620},p.donorElbow)).toBeCloseTo(Math.hypot(13,43),8);
  expect(distance(p.donorElbow,p.donorWrist)).toBeCloseTo(Math.hypot(81,7),8);
  expect(distance(p.recipientElbow,p.recipientWristWorld)).toBeCloseTo(78,8);
  for(const key of ['donorWrist','recipientWristWorld'] as const)expect(distance(p[key],previous[key])).toBeLessThan(3);
  previous=p;
 }
 const final=roseGiftPose(3);
 expect(final.donorWrist.x).toBeCloseTo(616,8);expect(final.donorWrist.y).toBeCloseTo(656,8);
 expect(final.recipientWristWorld).toEqual({x:735,y:610});
});
