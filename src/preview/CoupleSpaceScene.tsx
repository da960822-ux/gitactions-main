import {useEffect, useRef, useState} from 'react';
import * as T from 'three';
import {createHeartGeometry} from './heartGeometry';
import {createHeroMaterials} from './heroMaterials';
import {createPaperGeometry, createPetalGeometry, createRibbonGeometry, updatePaper, updateRibbon} from './spaceGeometry';
import {SPACE_PLAN, advanceLetter, balloonPlan, clamp, randomAt, smooth, stepSpring} from './spaceMotion';

type Props = {paused: boolean; reduced: boolean; open: boolean; onUnavailable: () => void};
type Balloon = {mesh: T.InstancedMesh; slot: number; index: number; base: T.Vector3; position: T.Vector3;
  rotation: number; scale: number; offset: T.Vector2; velocity: T.Vector2; twist: number; target: T.Vector2};

function universeTexture(cloudOnly = false) {
  const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 512;
  const ctx = canvas.getContext('2d')!, image = ctx.createImageData(canvas.width, canvas.height);
  const noise = (x: number, y: number) => {
    const ix = Math.floor(x), iy = Math.floor(y), fx = smooth(0,1,x-ix), fy = smooth(0,1,y-iy);
    const hash = (a: number,b: number) => randomAt(a*23.7+b*71.4);
    return T.MathUtils.lerp(T.MathUtils.lerp(hash(ix,iy),hash(ix+1,iy),fx),T.MathUtils.lerp(hash(ix,iy+1),hash(ix+1,iy+1),fx),fy);
  };
  for(let y=0;y<512;y++) for(let x=0;x<768;x++) {
    const u=x/767,v=y/511,dx=(u-.56)*1.55,dy=(v-.51)*1.9,r=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);
    const n=noise(u*9,v*9)*.55+noise(u*23,v*23)*.28+noise(u*61,v*61)*.17;
    const arms=(.5+.5*Math.cos(angle*2-r*15+n*.9))**5 * Math.exp(-r*1.8);
    const dust=smooth(.34,.78,n)*Math.exp(-Math.abs(dy-dx*.36)*2.4),core=Math.exp(-r*r*65);
    const density=clamp(arms*(.25+n)*.85+dust*.28+core*.35),edge=smooth(0,.12,u)*smooth(0,.12,1-u)*smooth(0,.12,v)*smooth(0,.12,1-v);
    const i=(y*768+x)*4;
    image.data[i]=8+density*(108+54*n)+core*95;
    image.data[i+1]=6+density*(46+38*n)+core*104;
    image.data[i+2]=17+density*(114+52*(1-n))+core*125;
    image.data[i+3]=cloudOnly?Math.round(density*edge*145):255;
  }
  ctx.putImageData(image,0,0);
  const texture = new T.CanvasTexture(canvas); texture.colorSpace=T.SRGBColorSpace;
  return texture;
}
function triangle(points: number[], material: T.Material) {
  const geometry=new T.BufferGeometry(); geometry.setAttribute('position',new T.Float32BufferAttribute(points,3)); geometry.computeVertexNormals();
  const mesh=new T.Mesh(geometry,material); mesh.castShadow=mesh.receiveShadow=true; return mesh;
}

export default function CoupleSpaceScene(props: Props) {
  const host=useRef<HTMLDivElement>(null),control=useRef(props),redraw=useRef<()=>void>(()=>{}),[ready,setReady]=useState(false);
  control.current=props;
  useEffect(()=>redraw.current(),[props.open,props.paused,props.reduced]);
  useEffect(()=>{
    const node=host.current!,page=node.closest<HTMLElement>('.cs-page')!,hero=page.querySelector<HTMLElement>('.cs-hero')!,stage=page.querySelector<HTMLElement>('.cs-stage')!;
    const figure=page.querySelector<HTMLElement>('.cs-portrait')!,copy=page.querySelector<HTMLElement>('.cs-hero-copy')!,letterStage=page.querySelector<HTMLElement>('.cs-letter-stage')!,paperDOM=page.querySelector<HTMLElement>('.cs-letter-paper')!;
    let renderer:T.WebGLRenderer;
    try {renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});} catch {control.current.onUnavailable();return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<760?1:1.25)); renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=1.08;
    renderer.shadowMap.enabled=true; renderer.shadowMap.type=T.PCFShadowMap;
    const canvas=renderer.domElement;canvas.setAttribute('aria-hidden','true');node.append(canvas);
    const scene=new T.Scene(),camera=new T.PerspectiveCamera(38,1,.1,150);camera.position.z=SPACE_PLAN.cameraRest;
    const heroGroup=new T.Group(),letterGroup=new T.Group();scene.add(heroGroup,letterGroup);
    const key=new T.DirectionalLight('#ffe1c6',3.4);key.position.set(-4,6,8);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-10;key.shadow.camera.right=10;key.shadow.camera.top=10;key.shadow.camera.bottom=-10;key.shadow.normalBias=.03;
    const rim=new T.DirectionalLight('#b3a1f4',1.8);rim.position.set(5,2,-3);scene.add(key,rim,new T.HemisphereLight('#dbc5e0','#190919',.85));
    const environmentScene=new T.Scene();environmentScene.background=new T.Color('#24141f');
    for(const [x,y,z,w,h,color] of [[-5,4,5,4,7,'#fff2de'],[5,1,2,2,6,'#d8c7f9'],[0,6,-2,7,2,'#fddac8'],[0,-3,4,5,1,'#e098a4']] as const) {
      const panel=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color,side:T.DoubleSide}));panel.position.set(x,y,z);panel.lookAt(0,0,0);environmentScene.add(panel);
    }
    const pmrem=new T.PMREMGenerator(renderer),environment=pmrem.fromScene(environmentScene,.06);scene.environment=environment.texture;pmrem.dispose();
    const textures:T.Texture[]=[],galaxy=universeTexture(),cloud=universeTexture(true);textures.push(galaxy,cloud);
    const universe=new T.Mesh(new T.PlaneGeometry(140,86),new T.MeshBasicMaterial({map:galaxy,toneMapped:false}));universe.position.set(0,0,-48);scene.add(universe);
    const clouds=[[-12,4,-32,82,48,.28],[10,-4,-21,60,38,.20]].map(([x,y,z,w,h,opacity],i)=>{
      const mesh=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:cloud,transparent:true,opacity,depthWrite:false,toneMapped:false,color:i?'#d8b1ff':'#ffb8bb'}));mesh.position.set(x,y,z);mesh.rotation.z=i?-.32:.17;scene.add(mesh);return mesh;
    });
    const starPositions:number[]=[],starColors:number[]=[];
    for(let i=0;i<SPACE_PLAN.stars;i++) {
      const angle=randomAt(i+8)*Math.PI*2,r=.4+randomAt(i+500)*12,cluster=i<460;
      const x=cluster?Math.cos(angle+r*.13)*r*1.3:(randomAt(i+740)-.5)*90;
      const y=cluster?Math.sin(angle+r*.13)*r*.54:(randomAt(i+941)-.5)*60;
      starPositions.push(x,y,[-19,-28,-42][i%3]);const c=new T.Color(i%5===0?'#f7b3a7':i%3===0?'#b7a6ed':'#f7e9dd');starColors.push(c.r,c.g,c.b);
    }
    const starsGeometry=new T.BufferGeometry();starsGeometry.setAttribute('position',new T.Float32BufferAttribute(starPositions,3));starsGeometry.setAttribute('color',new T.Float32BufferAttribute(starColors,3));
    const stars=new T.Points(starsGeometry,new T.PointsMaterial({size:.092,vertexColors:true,transparent:true,opacity:.87,depthWrite:false}));scene.add(stars);
    const lightCanvas=document.createElement('canvas');lightCanvas.width=lightCanvas.height=64;const lightCtx=lightCanvas.getContext('2d')!,glow=lightCtx.createRadialGradient(32,32,0,32,32,31);glow.addColorStop(0,'#fff');glow.addColorStop(.12,'#fff5e4');glow.addColorStop(.35,'#fcd9c555');glow.addColorStop(1,'#ffffff00');lightCtx.fillStyle=glow;lightCtx.fillRect(0,0,64,64);lightCtx.fillStyle='#ffe7d5aa';lightCtx.fillRect(31,10,2,44);lightCtx.fillRect(10,31,44,2);
    const starMap=new T.CanvasTexture(lightCanvas);textures.push(starMap);
    const bright=Array.from({length:SPACE_PLAN.brightStars},(_,i)=>{const sprite=new T.Sprite(new T.SpriteMaterial({map:starMap,transparent:true,depthWrite:false,opacity:.75}));sprite.position.set((randomAt(i+33)-.5)*26,(randomAt(i+60)-.5)*17,-15-i%3*5);sprite.scale.setScalar(.23+randomAt(i+20)*.18);scene.add(sprite);return sprite;});
    const heartGeometry=createHeartGeometry(48,12),materials=createHeroMaterials(),batches=materials.map(material=>{const mesh=new T.InstancedMesh(heartGeometry,material,SPACE_PLAN.balloons/3);mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;heroGroup.add(mesh);return mesh;});
    const balloons:Balloon[]=Array.from({length:SPACE_PLAN.balloons},(_,index)=>({mesh:batches[index%3],slot:Math.floor(index/3),index,base:new T.Vector3(),position:new T.Vector3(),rotation:0,scale:1,offset:new T.Vector2(),velocity:new T.Vector2(),twist:0,target:new T.Vector2()}));
    const petalGeometry=createPetalGeometry(),roseMaterials=[new T.MeshPhysicalMaterial({color:'#a64368',metalness:.03,roughness:.58,side:T.DoubleSide,sheen:.7,sheenColor:'#ffc0cb'}),new T.MeshPhysicalMaterial({color:'#ce8298',metalness:.08,roughness:.52,side:T.DoubleSide,sheen:.65,sheenColor:'#ffd2ce'})];
    const roses=[0,1].map(i=>{const group=new T.Group();for(let j=0;j<5;j++){const petal=new T.Mesh(petalGeometry,roseMaterials[i]);const angle=j/5*Math.PI*2;petal.position.set(Math.sin(angle)*.65,Math.cos(angle)*.65,0);petal.rotation.set(.38*Math.cos(angle),-.38*Math.sin(angle),-angle);group.add(petal);}heroGroup.add(group);return group;});
    const ribbonGeometry=createRibbonGeometry(),ribbonMaterial=new T.MeshPhysicalMaterial({color:'#e2ae98',metalness:.75,roughness:.3,side:T.DoubleSide,clearcoat:.6}),ribbon=new T.Mesh(ribbonGeometry,ribbonMaterial);heroGroup.add(ribbon);
    const knot=new T.Mesh(new T.SphereGeometry(.26,24,16),ribbonMaterial);knot.scale.set(1,.8,.65);heroGroup.add(knot);
    let disposed=false,lost=false,textureReady=false,published=false,entryBegan=0,width=0,height=0,mobile=false,scroll=scrollY,time=0,last=0,entry=0,letterPhase=0,frames=0,docTop=0,letterTop=0,letterHeight=0,letterX=0,letterY=0,paperWidth=0,paperHeight=0,lastRibbon=-1,lastPaper=-1;
    const pointer=new T.Vector2(),targetPointer=new T.Vector2(),raycaster=new T.Raycaster(),dummy=new T.Object3D();let selected:Balloon|null=null,drag:{id:number;x:number;y:number;lastX:number;lastY:number}|null=null;
    const portraitMap=new T.TextureLoader().load('/images/yeonseok-lisbeth-cutout.webp',()=>{if(disposed)return;textureReady=true;entryBegan=performance.now();redraw.current();},undefined,()=>{if(!disposed)control.current.onUnavailable();});portraitMap.colorSpace=T.SRGBColorSpace;textures.push(portraitMap);
    const portraitMaterial=new T.MeshBasicMaterial({map:portraitMap,transparent:true,alphaTest:.03,depthWrite:true,toneMapped:false});
    portraitMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <alphamap_fragment>','#include <alphamap_fragment>\ndiffuseColor.a *= smoothstep(0.0,0.22,vMapUv.y);');};
    const portrait=new T.Mesh(new T.PlaneGeometry(1,1),portraitMaterial);heroGroup.add(portrait);
    const paperGeometry=createPaperGeometry(),paperMaterial=new T.MeshPhysicalMaterial({color:'#eedcc2',roughness:.88,metalness:0,side:T.DoubleSide});
    const paper=new T.Mesh(paperGeometry,paperMaterial);paper.castShadow=paper.receiveShadow=true;letterGroup.add(paper);
    const envelope=new T.Group();letterGroup.add(envelope);
    const envelopeMaterial=new T.MeshStandardMaterial({color:'#783d51',roughness:.76,side:T.DoubleSide});
    const envelopeBody=new T.Mesh(new T.BoxGeometry(1,1,.035),envelopeMaterial);envelopeBody.castShadow=envelopeBody.receiveShadow=true;envelope.add(envelopeBody);
    const flapPivot=new T.Group(),flap=triangle([-.5,0,0,.5,0,0,0,-.68,0],new T.MeshStandardMaterial({color:'#aa695e',roughness:.64,side:T.DoubleSide}));flapPivot.add(flap);envelope.add(flapPivot);
    const pocket=triangle([-.5,-.5,.027,.5,-.5,.027,0,.1,.027],new T.MeshStandardMaterial({color:'#984f62',roughness:.67,side:T.DoubleSide}));envelope.add(pocket);
    const wax=new T.Group(),seal=new T.Mesh(new T.CylinderGeometry(.13,.14,.04,48),new T.MeshPhysicalMaterial({color:'#d79d77',metalness:.55,roughness:.3,clearcoat:.65}));seal.rotation.x=Math.PI/2;wax.add(seal);const mark=new T.Mesh(heartGeometry,materials[0]);mark.scale.setScalar(.09);mark.position.z=.025;wax.add(mark);envelope.add(wax);
    const receiver=new T.Mesh(new T.PlaneGeometry(1,1),new T.ShadowMaterial({opacity:.25}));receiver.receiveShadow=true;letterGroup.add(receiver);
    const project=(point:T.Vector3)=>{const p=point.clone().project(camera);return{x:(p.x+1)*width/2,y:(1-p.y)*height/2};};
    const pixelUnit=(depth:number)=>2*Math.tan(T.MathUtils.degToRad(19))*depth/height;
    const atPixel=(x:number,y:number,depth:number)=>camera.localToWorld(new T.Vector3((x-width/2)*pixelUnit(depth),-(y-height/2)*pixelUnit(depth),-depth));
    const heroBoxes:{x:number;y:number;right:number;bottom:number}[]=[];
    const measure=()=>{
      width=innerWidth;height=innerHeight;mobile=width<760;docTop=page.getBoundingClientRect().top+scrollY;
      renderer.setSize(width,height);camera.aspect=width/height;camera.position.set(0,0,SPACE_PLAN.cameraRest);camera.lookAt(0,0,0);camera.updateProjectionMatrix();camera.updateMatrixWorld();
      const lb=letterStage.getBoundingClientRect(),pb=paperDOM.getBoundingClientRect();letterTop=lb.top+scrollY;letterHeight=lb.height;letterX=lb.left+lb.width/2;letterY=letterTop+lb.height/2;paperWidth=pb.width;paperHeight=pb.height;
      heroBoxes.length=0;for(const text of copy.querySelectorAll<HTMLElement>('h1,p,.cs-actions')){const b=text.getBoundingClientRect();heroBoxes.push({x:b.left,y:b.top+scrollY,right:b.right,bottom:b.bottom+scrollY});}
      for(const balloon of balloons){const plan=balloonPlan(balloon.index,mobile);balloon.base.copy(atPixel(plan.x*width,plan.y*height,plan.depth));balloon.scale=plan.pixels*pixelUnit(plan.depth)/2.0;balloon.rotation=plan.rotation;}
      roses[0].position.copy(atPixel(mobile?-40:width*.06,height*.43,14));roses[0].scale.setScalar((mobile?230:350)*pixelUnit(14)/3.9);roses[0].rotation.set(.15,.3,-.1);
      roses[1].position.copy(atPixel(mobile?width+45:width*.96,height*.73,15));roses[1].scale.setScalar((mobile?230:340)*pixelUnit(15)/3.9);roses[1].rotation.set(-.15,-.25,.3);
      render(0,true);sync();
    };
    const render=(dt:number,snap=false)=>{
      if(!width||disposed||lost)return;
      const stop=control.current.paused||control.current.reduced,progress=clamp((scroll-docTop)/(mobile?650:SPACE_PLAN.scrollDistance));
      if(textureReady&&!stop)entry=clamp((performance.now()-entryBegan)/1000/SPACE_PLAN.entranceSeconds);else if(stop)entry=1;
      pointer.lerp(stop?new T.Vector2():targetPointer,snap?1:1-Math.exp(-dt*8));
      letterPhase=advanceLetter(letterPhase,control.current.open,dt,stop);
      const nearLetter=letterTop-scroll<height+120&&letterTop+letterHeight-scroll>-120;
      camera.position.set(nearLetter?0:progress*2.4+pointer.x*.45,nearLetter?0:pointer.y*.2,nearLetter?10:T.MathUtils.lerp(SPACE_PLAN.cameraStart,SPACE_PLAN.cameraRest,smooth(0,1,entry))-progress*4);
      camera.lookAt(nearLetter?0:progress*.8,nearLetter?0:-progress*.25,nearLetter?0:-progress*2);camera.updateMatrixWorld();
      node.style.transform=`translate3d(0,${scroll-docTop}px,0)`;
      heroGroup.visible=!nearLetter&&scroll-docTop<height+1000;letterGroup.visible=nearLetter;
      const photoPixels=mobile?Math.min(310,width*.78):Math.min(560,width*.385),photoDepth=T.MathUtils.lerp(9.4,14.8,progress);
      const photoCenter={x:width*T.MathUtils.lerp(.5,.34,progress),y:height*T.MathUtils.lerp(mobile?.405:.535,.40,progress)};
      portrait.position.copy(atPixel(photoCenter.x,photoCenter.y,photoDepth));portrait.quaternion.copy(camera.quaternion);portrait.scale.setScalar(photoPixels*pixelUnit(9.4));portrait.visible=textureReady;
      const actualPhoto=photoPixels*9.4/photoDepth,subject={x:photoCenter.x-actualPhoto/2,right:photoCenter.x+actualPhoto/2,y:photoCenter.y-actualPhoto/2,bottom:photoCenter.y+actualPhoto/2};
      figure.style.transform=`translate3d(${photoCenter.x-width*.5}px,${photoCenter.y-height*(mobile?.405:.535)}px,0) scale(${9.4/photoDepth})`;
      copy.style.opacity=String(1-smooth(.20,.60,progress));copy.style.visibility=progress>.65?'hidden':'visible';
      const entryAmount=smooth(0,.9,entry);
      for(const balloon of balloons) {
        const plan=balloonPlan(balloon.index,mobile),pulse=stop?0:Math.sin(time*.43+balloon.index)*.035;
        const baseScreen=project(balloon.base),cursorX=(targetPointer.x+1)*width/2,cursorY=(1-targetPointer.y)*height/2,dx=baseScreen.x-cursorX,dy=baseScreen.y-cursorY,distance=Math.hypot(dx,dy);
        const target=drag&&selected===balloon?balloon.target:new T.Vector2();
        if(!stop&&!drag&&distance<180&&targetPointer.length()>0)target.set(dx,dy).normalize().multiplyScalar((1-distance/180)*(mobile?55:140));
        for(const axis of ['x','y'] as const){const state=stepSpring(balloon.offset[axis],balloon.velocity[axis],stop?0:target[axis],dt);balloon.offset[axis]=state.position;balloon.velocity[axis]=state.velocity;}
        const depth=-camera.worldToLocal(balloon.base.clone()).z;
        let x=baseScreen.x+balloon.offset.x+(1-entryAmount)*(plan.x<.5?-1:1)*(plan.depth<10?300:150),y=baseScreen.y+balloon.offset.y+(1-entryAmount)*(plan.depth<10?80:25);
        const radius=plan.pixels*plan.depth/depth*.58;
        // Foreground paths go around the complete source portrait, retaining balloon size and count.
        if(depth<photoDepth&&x+radius>subject.x-10&&x-radius<subject.right+10&&y+radius>subject.y&&y-radius<subject.bottom) x=plan.x<.5?subject.x-radius-12:subject.right+radius+12;
        for(const box of heroBoxes) if(progress<.5&&x+radius>box.x-14&&x-radius<box.right+14&&y+radius>box.y-scroll-14&&y-radius<box.bottom-scroll+14) x=plan.x<.5?box.x-radius-16:box.right+radius+16;
        balloon.position.copy(atPixel(x,y,depth));dummy.position.copy(balloon.position);dummy.scale.setScalar(balloon.scale*(1+pulse));
        dummy.rotation.set(.13+Math.sin(time*.25+balloon.index)*.12+balloon.offset.y*.003,
          balloon.rotation+Math.sin(time*.3+balloon.index*.7)*.33+balloon.offset.x*.004,balloon.rotation+balloon.offset.x*.0015);
        dummy.updateMatrix();balloon.mesh.setMatrixAt(balloon.slot,dummy.matrix);
      }
      batches.forEach(mesh=>mesh.instanceMatrix.needsUpdate=true);
      const reveal=smooth(0,.75,entry),unfold=smooth(.55,1,progress);
      if(Math.abs(unfold-lastRibbon)>.0005){updateRibbon(ribbonGeometry,unfold);lastRibbon=unfold;}
      const ribbonDepth=T.MathUtils.lerp(12,7.4,unfold),ribbonX=T.MathUtils.lerp(mobile?width*.15:width*.26,width*.5,unfold),ribbonY=T.MathUtils.lerp(height*(mobile?.52:.63),height*1.14,unfold);
      ribbon.position.copy(atPixel(ribbonX-(1-reveal)*(mobile?130:330),ribbonY,ribbonDepth));ribbon.quaternion.copy(camera.quaternion);ribbon.rotateZ(T.MathUtils.lerp(-.12,0,unfold));ribbon.rotateY((1-unfold)*(.22+pointer.x*.16));ribbon.scale.setScalar(mobile?T.MathUtils.lerp(.64,.72,unfold):1.0);
      knot.position.copy(ribbon.position);knot.quaternion.copy(ribbon.quaternion);knot.visible=unfold<.8;knot.scale.setScalar((mobile?.64:1)*(.24+.06*unfold));
      ribbonMaterial.color.set('#e2ae98').lerp(new T.Color('#361724'),unfold);ribbonMaterial.metalness=T.MathUtils.lerp(.75,.08,unfold);ribbonMaterial.roughness=T.MathUtils.lerp(.3,.85,unfold);
      clouds.forEach((mesh,i)=>{mesh.rotation.z=(i?-.32:.17)+Math.sin(time/22*Math.PI*2+i)*.045;});
      bright.forEach((sprite,i)=>{sprite.material.opacity=.45+Math.sin(time*(.6+i*.02)+i)**2*.45;});
      if(nearLetter) {
        const phase=smooth(0,1,letterPhase),paperUnfold=smooth(.24,.95,letterPhase),unit=pixelUnit(10),centerY=letterY-scroll;
        paper.position.copy(atPixel(letterX,centerY+(1-paperUnfold)*60,10));paper.quaternion.copy(camera.quaternion);paper.visible=letterPhase>.20;
        if(Math.abs(letterPhase-lastPaper)>.0005||snap){updatePaper(paperGeometry,paperUnfold,paperWidth*unit,paperHeight*unit);lastPaper=letterPhase;}
        const envelopeX=mobile?letterX:T.MathUtils.lerp(letterX,letterX-paperWidth/2-190,phase),envelopeY=centerY+phase*(mobile?paperHeight/2+260:paperHeight*.3);
        envelope.position.copy(atPixel(envelopeX,envelopeY,9.8));envelope.quaternion.copy(camera.quaternion);envelope.scale.set((mobile?260:320)*unit,(mobile?170:200)*unit,1);
        flapPivot.position.set(0,.5,.03);flapPivot.rotation.x=-smooth(.08,.5,letterPhase)*2.705;
        wax.position.set(smooth(0,.25,letterPhase)*.6,-smooth(0,.25,letterPhase)*.75,.07+smooth(0,.25,letterPhase)*.5);wax.rotation.z=phase*.7;wax.visible=letterPhase<.5;
        receiver.position.copy(paper.position).add(new T.Vector3(0,0,-.20));receiver.quaternion.copy(camera.quaternion);receiver.scale.set(paperWidth*unit,paperHeight*unit,1);
      }
      page.dataset.letterReady=String(control.current.open&&letterPhase>.97||control.current.open&&stop);
      page.dataset.letterPhase=letterPhase.toFixed(4);page.dataset.spaceProgress=progress.toFixed(4);
      renderer.render(scene,camera);frames++;
      if(textureReady&&!published){published=true;page.dataset.spaceReady='true';setReady(true);}
      canvas.dataset.plan=JSON.stringify(SPACE_PLAN);canvas.dataset.camera=JSON.stringify(camera.position.toArray());canvas.dataset.entry=entry.toFixed(4);canvas.dataset.frames=String(frames);canvas.dataset.phase=nearLetter?'letter':'hero';
      canvas.dataset.balloonBounds=JSON.stringify(balloons.map(b=>{const p=project(b.position);return{i:b.index,x:p.x,y:p.y,depth:-camera.worldToLocal(b.position.clone()).z,offset:b.offset.toArray(),pixels:balloonPlan(b.index,mobile).pixels};}));
      canvas.dataset.materials=JSON.stringify(materials.map(m=>({color:m.color.getHexString(),metalness:m.metalness,roughness:m.roughness})));canvas.dataset.subject=JSON.stringify(subject);canvas.dataset.renderer=renderer.getContext().getParameter(renderer.getContext().RENDERER);
    };
    const frame=(now:number)=>{const dt=last?Math.min(.25,(now-last)/1000):1/60;last=now;time+=dt;render(dt);};
    const sync=()=>{const visible=scroll-docTop<height+1000||letterTop-scroll<height+120&&letterTop+letterHeight-scroll>-120;
      const run=visible&&!document.hidden&&!control.current.paused&&!control.current.reduced&&!lost&&!disposed;
      renderer.setAnimationLoop(run?frame:null);canvas.dataset.loop=run?'running':'stopped';if(!run)last=0;};
    redraw.current=()=>{render(0,true);sync();};
    const pick=(event:PointerEvent)=>{raycaster.setFromCamera(new T.Vector2(event.clientX/width*2-1,1-event.clientY/height*2),camera);const hit=raycaster.intersectObjects(batches)[0];return hit?.instanceId===undefined?null:balloons.find(b=>b.mesh===hit.object&&b.slot===hit.instanceId)||null;};
    const move=(event:PointerEvent)=>{
      if(control.current.paused||control.current.reduced)return;
      targetPointer.set(event.clientX/width*2-1,1-event.clientY/height*2);
      if(drag&&selected&&event.pointerId===drag.id){selected.target.set(clamp(event.clientX-drag.x,-240,240),clamp(event.clientY-drag.y,-180,180));drag.lastX=event.clientX;drag.lastY=event.clientY;}
    };
    const down=(event:PointerEvent)=>{
      if(control.current.paused||control.current.reduced||(event.target as HTMLElement).closest('button,a'))return;
      selected=pick(event);if(!selected)return;
      drag={id:event.pointerId,x:event.clientX-selected.offset.x,y:event.clientY-selected.offset.y,lastX:event.clientX,lastY:event.clientY};stage.setPointerCapture(event.pointerId);stage.dataset.dragging='true';
    };
    const up=(event:PointerEvent)=>{if(drag?.id!==event.pointerId)return;drag=null;selected=null;delete stage.dataset.dragging;if(stage.hasPointerCapture(event.pointerId))stage.releasePointerCapture(event.pointerId);};
    const leave=()=>{if(!drag)targetPointer.set(0,0);};
    let scrollFrame=0;const onScroll=()=>{scroll=scrollY;if(!scrollFrame)scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;if(control.current.paused||control.current.reduced)render(0,true);sync();});};
    const loss=(event:Event)=>{event.preventDefault();lost=true;renderer.setAnimationLoop(null);control.current.onUnavailable();};
    const observer=new ResizeObserver(measure);observer.observe(stage);observer.observe(letterStage);observer.observe(paperDOM);observer.observe(copy);
    const changes=new MutationObserver(measure);changes.observe(copy,{childList:true,subtree:true,characterData:true});changes.observe(paperDOM,{childList:true,subtree:true,characterData:true});
    document.fonts.ready.then(()=>{if(!disposed)measure();});window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',measure);document.addEventListener('visibilitychange',sync);
    stage.addEventListener('pointermove',move);stage.addEventListener('pointerdown',down);stage.addEventListener('pointerup',up);stage.addEventListener('pointercancel',up);stage.addEventListener('pointerleave',leave);canvas.addEventListener('webglcontextlost',loss);measure();
    return()=>{disposed=true;renderer.setAnimationLoop(null);cancelAnimationFrame(scrollFrame);observer.disconnect();changes.disconnect();window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',measure);document.removeEventListener('visibilitychange',sync);stage.removeEventListener('pointermove',move);stage.removeEventListener('pointerdown',down);stage.removeEventListener('pointerup',up);stage.removeEventListener('pointercancel',up);stage.removeEventListener('pointerleave',leave);canvas.removeEventListener('webglcontextlost',loss);redraw.current=()=>{};
      const geometries=new Set<T.BufferGeometry>(),ownedMaterials=new Set<T.Material>();scene.traverse(object=>{if(object instanceof T.Mesh||object instanceof T.Points){geometries.add(object.geometry);(Array.isArray(object.material)?object.material:[object.material]).forEach(m=>ownedMaterials.add(m));}else if(object instanceof T.Sprite)ownedMaterials.add(object.material);});geometries.forEach(g=>g.dispose());ownedMaterials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());environment.dispose();environmentScene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();o.material.dispose();}});renderer.dispose();canvas.remove();delete page.dataset.spaceReady;delete page.dataset.letterReady;};
  },[]);
  return <div className="cs-canvas" ref={host} data-ready={ready}/>;
}
