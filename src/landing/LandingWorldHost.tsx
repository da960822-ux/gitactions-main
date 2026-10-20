import {useCallback, useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {AcrossHero} from './AcrossHero';
import {GameGallery} from './gallery/GameGallery';
import {createPostHeroComposition} from './PostHeroComposition';
import {PostHeroPreview} from '../../post-hero-preview/src/PostHeroPreview';
import type {PostHeroState} from '../../post-hero-preview/src/Scene';
import type {LocalEventId} from '../../post-hero-preview/src/LocalEventRig';
import {createLetterCollection} from '../../post-hero-preview/src/LetterCollection';
import {cameraPose as heroCameraPose,openingCameraPose,postConnectionPose} from './cinematic/folded/poseSpaceV19';
import {ROOM_WORLD,roomWorldVertex} from './cinematic/folded/approvedRoomGeometry';
import {pointerDecay} from './cinematic/folded/pointerResponse';
import {INTRO_SECONDS, introPose, smoothRange, type FoldPose} from './cinematic/folded/pose';
import '../../post-hero-preview/src/preview.css';
import './landing-world.css';

gsap.registerPlugin(ScrollTrigger);
gsap.ticker.lagSmoothing(0);
const PORTRAIT='/images/approved-couple-room/approved-character-reference.png';
const PORTRAIT_MASK='/images/approved-couple-room/character-opacity-mask.png';
const ROOM_EYE=new THREE.Vector3(...roomWorldVertex(836,470.5,24));
const ROOM_TARGET=new THREE.Vector3(ROOM_WORLD.x,ROOM_WORLD.y,ROOM_WORLD.z);
const ROOM_BACK=ROOM_EYE.clone().sub(ROOM_TARGET);
const ROOM_DISCOVERIES=[{id:'L04',x:1535,y:610,w:160,h:235,ko:'토끼에게 장난 걸기',es:'Tocar el conejito'},{id:'L09',x:109,y:713,w:126,h:168,ko:'우리 사진 가까이 보기',es:'Mirar nuestra foto'},{id:'L06',x:1320,y:656,w:190,h:145,ko:'노트북에 낙서해 보기',es:'Dejar un dibujito'}] as const;

type Props={language:'ko'|'es';onLanguageChange:(language:'ko'|'es')=>void;selected:string;onSelect:(game:string)=>void};
function hasSeenIntro(){try{return sessionStorage.getItem('folded-playhouse-seen')==='1';}catch{return false;}}
function rememberIntro(){try{sessionStorage.setItem('folded-playhouse-seen','1');}catch{/* Storage is optional. */}}

/** The shared world carries the journey; the protected game gallery owns its existing stage. */
export function LandingWorldHost({language,onLanguageChange,selected,onSelect}:Props){
 const host=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
 const first=useRef(!matchMedia('(prefers-reduced-motion: reduce)').matches&&!hasSeenIntro()&&!location.hash);
 const [ready,setReady]=useState(false),[postReady,setPostReady]=useState(false),[failed,setFailed]=useState(false),[introActive,setIntroActive]=useState(first.current);
 const [roomActive,setRoomActive]=useState(false),roomVisible=useRef(false),discoveryNonce=useRef(0);
 const [roomDiscovery,setRoomDiscovery]=useState<{id:LocalEventId;trigger:HTMLButtonElement;nonce:number}>();
 const selection=useRef({selected,onSelect});selection.current={selected,onSelect};
 const skip=useRef<()=>void>(()=>{}),dirty=useRef(true);
 const postState=useRef<PostHeroState>({progress:0,opening:0,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,effect:{name:'none',value:0,nonce:0},portraitSrc:PORTRAIT,portraitMaskSrc:PORTRAIT_MASK});
 const receivePostState=useCallback((state:PostHeroState)=>{postState.current=state;dirty.current=true;},[]);
 const externalTick=useRef<((now:number)=>void)|null>(null);
 const registerFrame=useCallback((tick:((now:number)=>void)|null)=>{externalTick.current=tick;},[]);

 useEffect(()=>{
  setReady(false);setPostReady(false);
  const root=host.current!,screen=canvas.current!,hero=root.querySelector<HTMLElement>('.across-hero')!;
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const pose:FoldPose={progress:0,entrance:first.current?0:1,pointerX:0,pointerY:0,time:0};
  let world:ReturnType<typeof import('./cinematic/folded/previewSpaceV19')['createFoldedWorld']>|undefined;
  let post:ReturnType<typeof createLetterCollection>|undefined;
  let composition:ReturnType<typeof createPostHeroComposition>|undefined,postStage:THREE.Group|undefined;
  const postTransform=new THREE.Matrix4().makeTranslation(-6,-4.3,6).multiply(new THREE.Matrix4().makeRotationY(Math.PI)).multiply(new THREE.Matrix4().makeTranslation(-9,4.3,10));
  let disposed=false,assetsReady=false,frame=0,clockStart=0,last=0,elapsed=0,inIntro=first.current,lost=false;
  let trigger:ScrollTrigger|undefined,heroEnd=innerHeight*2.6,previousPost=false,postNeedsFrame=false;
  let lastRenderSignature='';
  const pointer={x:0,y:0};
  const projectRoomDiscoveries=(active:boolean)=>{
   if(roomVisible.current!==active){roomVisible.current=active;setRoomActive(active);}
   if(!active||!world)return;
   const bounds=screen.getBoundingClientRect();
   for(const object of ROOM_DISCOVERIES){
    const button=root.querySelector<HTMLElement>(`[data-room-object="${object.id}"]`);if(!button)continue;
    const corners=[[-1,-1],[1,1]].map(([x,y])=>new THREE.Vector3(...roomWorldVertex(object.x+x*object.w/2,object.y+y*object.h/2,0)).project(world!.camera));
    const left=bounds.left+(corners[0].x+1)*bounds.width/2,top=bounds.top+(1-corners[0].y)*bounds.height/2;
    Object.assign(button.style,{left:`${left}px`,top:`${top}px`,width:`${(corners[1].x-corners[0].x)*bounds.width/2}px`,height:`${(corners[0].y-corners[1].y)*bounds.height/2}px`});
   }
  };
  const cameraPosition=new THREE.Vector3(),cameraTarget=new THREE.Vector3(),roomEye=ROOM_EYE.clone(),connectionBackground=new THREE.Color();
  let heroBackdrop:THREE.Scene['background']|undefined;
  const roomBackground=new THREE.Color('#21151d');
  const roomContain=(width:number,height:number)=>Math.max(1,(1672/941)/(width/height));
  const roomFov=(width:number,height:number)=>width<760?THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(24))*roomContain(width,height))):48;
  const frameFallback=()=>{
   const image=root.querySelector<HTMLImageElement>('.folded-portrait-fallback');if(!image)return;if(screen.clientWidth<761){image.style.cssText='';return;}
   const width=screen.clientWidth,height=screen.clientHeight,initial=openingCameraPose(first.current?0:1),camera=new THREE.PerspectiveCamera(38,width/height,.1,400);
   camera.position.fromArray(initial.position);camera.lookAt(...initial.target as [number,number,number]);camera.updateMatrixWorld();
   const portraitWidth=6.2*1312/1199;
   const imageToWorld=new THREE.Matrix4().set(portraitWidth/1312,0,0,1.85-portraitWidth/2,0,-6.2/1199,0,3.13,0,0,1,.05,0,0,0,1);
   const viewport=new THREE.Matrix4().set(width/2,0,0,width/2,0,-height/2,0,height/2,0,0,1,0,0,0,0,1);
   const transform=viewport.multiply(camera.projectionMatrix).multiply(camera.matrixWorldInverse).multiply(imageToWorld);
   // Preserve the full projected quad, including its small perspective taper.
   transform.elements[2]=transform.elements[6]=transform.elements[14]=0;transform.elements[10]=1;
   Object.assign(image.style,{left:'0',top:'0',width:'1312px',height:'1199px',maxWidth:'none',right:'auto',bottom:'auto',transformOrigin:'0 0',transform:`matrix3d(${transform.elements.join(',')})`});
  };
  const frameHero=(camera:THREE.PerspectiveCamera,p:number,width:number,height:number)=>{
   const room=smoothRange(.27,.38,p);camera.clearViewOffset();
   if(world){if(heroBackdrop===undefined)heroBackdrop=world.scene.background;world.scene.background=p>.72?roomBackground:heroBackdrop;}
   if(width<760){const base=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/.59));camera.fov=THREE.MathUtils.lerp(base,roomFov(width,height),room);camera.setViewOffset(width,height,0,-height*.195*(1-room),width,height);}
   else {const contain=roomContain(width,height)-1;camera.position.y+=(ROOM_EYE.y-ROOM_TARGET.y)*contain;camera.position.z+=(ROOM_EYE.z-ROOM_TARGET.z)*contain;const target=heroCameraPose(p,pose.entrance,false).target;camera.lookAt(...target as [number,number,number]);}
  };
  const titleLines=[...hero.querySelectorAll<HTMLElement>('.across-title-line')];
  const copy=hero.querySelector<HTMLElement>('.across-editorial')!,destination=hero.querySelector<HTMLElement>('.folded-destination')!;
  const endIntro=()=>{inIntro=false;pose.entrance=1;setIntroActive(false);rememberIntro();dirty.current=true;};skip.current=endIntro;
  const resetPointer=()=>{pointer.x=pointer.y=0;};
  const invalidate=()=>{dirty.current=true;};
  const resize=()=>{
   frameFallback();
   world?.resize(screen.clientWidth,screen.clientHeight,Math.min(devicePixelRatio,innerWidth<760?1.25:1.5));
   ScrollTrigger.refresh();heroEnd=trigger?.end??hero.offsetHeight-innerHeight;dirty.current=true;
  };
  const preference=()=>{postState.current={...postState.current,reducedMotion:media.matches};if(media.matches){endIntro();resetPointer();}dirty.current=true;};
  const move=(event:PointerEvent)=>{
   if(event.pointerType==='touch'||media.matches)return;
   pointer.x=Math.max(-1,Math.min(1,event.clientX/innerWidth*2-1));pointer.y=Math.max(-1,Math.min(1,event.clientY/innerHeight*2-1));
  };
  const contextLost=(event:Event)=>{event.preventDefault();lost=true;projectRoomDiscoveries(false);setReady(false);setPostReady(false);endIntro();};
  const contextRestored=()=>{lost=false;lastRenderSignature='';resize();setReady(true);setPostReady(true);};
  const visibility=()=>{last=0;dirty.current=true;};
  const mm=gsap.matchMedia();
  frameFallback();
  mm.add('(prefers-reduced-motion: no-preference)',()=>{
   const timeline=gsap.timeline({scrollTrigger:{trigger:hero,start:'top top',end:'+=260%',pin:hero.querySelector('.across-stage')!,scrub:.35,invalidateOnRefresh:true,onUpdate:self=>{if(self.progress>.015&&inIntro)endIntro();dirty.current=true;}}});
   timeline.to(pose,{progress:1,ease:'none',duration:1});trigger=timeline.scrollTrigger;heroEnd=trigger?.end??innerHeight*2.6;
   return()=>{pose.progress=0;};
  });
  const resizeObserver=new ResizeObserver(invalidate);resizeObserver.observe(root);
  const updateEditorial=(p:number,_entrance:number)=>{
   const exit=smoothRange(.06,.10,p),appear=smoothRange(.73,.94,p),focused=copy.querySelector(':focus-visible');
   const copyExit=focused?0:exit;
   hero.style.setProperty('--hero-atmosphere-opacity',String(1-copyExit));
   copy.style.opacity=String(1-copyExit);copy.style.setProperty('--hero-copy-opacity',String(1-copyExit));copy.style.transform='none';copy.style.pointerEvents=copyExit>.98?'none':'auto';copy.inert=copyExit>.98;
   titleLines.forEach(line=>{line.style.opacity='1';line.style.transform='none';});
   destination.style.opacity=String(appear);destination.inert=appear<.95;
   hero.dataset.roomActive=String(p>.18);hero.dataset.introOwner='live-space';hero.dataset.introTime=pose.time.toFixed(3);
  };
  const tick=(now:number)=>{
   if(disposed)return;frame=requestAnimationFrame(tick);
   const actualDt=last?Math.max(0,(now-last)/1000):0,dt=Math.min(actualDt,.08);last=now;
   if(document.hidden)return;
   externalTick.current?.(now);
   if(lost||!world||!assetsReady)return;
   elapsed+=dt;
   const width=screen.clientWidth,height=screen.clientHeight;
   if(media.matches)pose.progress=smoothRange(0,Math.max(1,hero.offsetHeight-height),scrollY);
   if(inIntro){pose.time=Math.max(0,(now-clockStart)/1000);pose.entrance=introPose(pose.time).entrance;if(pose.time>=INTRO_SECONDS-1/60&&Number(screen.dataset.entrance)>=.999)endIntro();}else pose.time=elapsed;
   const decay=pointerDecay(actualDt),input=inIntro||media.matches?0:1;
   pose.pointerX+=(pointer.x*input-pose.pointerX)*decay;pose.pointerY+=(pointer.y*input-pose.pointerY)*decay;
   const bridge=smoothRange(heroEnd,heroEnd+height*1.1,scrollY),postActive=bridge>0;
   const section=root.querySelector<HTMLElement>('#games');
   const galleryBounds=section?.getBoundingClientRect();
   const reveal=galleryBounds?smoothRange(0,height*.75,height-galleryBounds.top):0;
   const departure=galleryBounds?smoothRange(height*.2,height*.8,galleryBounds.bottom):1;
   const galleryWeight=reveal*departure;
   section?.style.setProperty('--gallery-presence',String(galleryWeight));
   root.dataset.scene=!postActive?'hero':galleryWeight>.5?'gallery':postState.current.progress<.56?'story':postState.current.progress<.9?'letter':'ending';
   root.dataset.bridge=bridge.toFixed(4);
   const signature=[pose.progress,pose.entrance,pose.pointerX,pose.pointerY,bridge,postState.current.progress,postState.current.opening,galleryWeight,selection.current.selected,scrollY,width,height].map(value=>typeof value==='number'?value.toFixed(4):value).join(':');
   const needsFrame=dirty.current||signature!==lastRenderSignature||postNeedsFrame||(!media.matches&&postState.current.effect.value!==0);
   if(!needsFrame){if(!postActive){world.render(pose);updateEditorial(Number(screen.dataset.progress??pose.progress),Number(screen.dataset.entrance??pose.entrance));projectRoomDiscoveries(Number(screen.dataset.progress??0)>.94);}return;}lastRenderSignature=signature;dirty.current=false;
   if(!postActive){
    if(previousPost){world.setPostActive(false);world.camera.clearViewOffset();lastRenderSignature='';}
    previousPost=false;if(post)post.root.visible=false;if(composition)composition.root.visible=false;
    world.updateRoomExit(0);world.updateRoomDesk(0);world.render(pose);
    updateEditorial(Number(screen.dataset.progress??pose.progress),Number(screen.dataset.entrance??pose.entrance));
    projectRoomDiscoveries(Number(screen.dataset.progress??0)>.94);
   }else if(post&&composition){
    projectRoomDiscoveries(false);
    if(!previousPost){world.render({...pose,progress:1,entrance:1});if(Number(screen.dataset.progress??0)<.999||Number(screen.dataset.entrance??0)<.999){dirty.current=true;return;}world.setPostActive(true);}
    previousPost=true;
    const progress=postState.current.progress;
    post.root.visible=true;
    composition.root.visible=true;
    world.updateRoomDesk(bridge);
    world.updateRoomExit(0);
    post.update({...postState.current,width,height,ownCamera:false});postNeedsFrame=false;
    roomEye.copy(ROOM_EYE);if(width>=760)roomEye.addScaledVector(ROOM_BACK,roomContain(width,height)-1);
    const composed=composition.update({progress,bridge,galleryWeight:0,opening:postState.current.opening,time:elapsed,reducedMotion:media.matches,width,height,roomEye,roomTarget:ROOM_TARGET,effect:postState.current.effect,localEvent:postState.current.localEvent});
    postNeedsFrame=composed.needsFrame;
    world.updateRoomExit(composed.roomExit);world.updateRoomDesk(composed.roomDesk);
    cameraPosition.copy(composed.eye).applyMatrix4(postTransform);cameraTarget.copy(composed.target).applyMatrix4(postTransform);
    // Keep the approved room behind its workstation story; leave for the letter during gallery traversal.
    const connectionProgress=Math.min(bridge,smoothRange(.45,.62,progress));
    const endingBounds=root.querySelector('#together-again')?.getBoundingClientRect();
    const endingCoversView=endingBounds&&endingBounds.top<=0&&endingBounds.bottom>=height;
    composition.root.visible=post.root.visible=connectionProgress>.001&&!endingCoversView;
    const connection=postConnectionPose(connectionProgress,{position:roomEye.toArray(),target:ROOM_TARGET.toArray(),fov:roomFov(width,height)},{position:cameraPosition.toArray(),target:cameraTarget.toArray(),fov:composed.fov},width>=760?Math.max(1,(16/9)/(width/height)):1);
    cameraPosition.fromArray(connection.position);cameraTarget.fromArray(connection.target);
    world.camera.position.copy(cameraPosition);world.camera.lookAt(cameraTarget);
    world.camera.clearViewOffset();world.camera.fov=connection.fov;world.camera.updateProjectionMatrix();
    world.scene.background=connectionBackground.copy(roomBackground).lerp(composed.background,connectionProgress);
    post.root.position.copy(composed.letterAnchor);post.root.scale.setScalar(composed.letterScale);
    if(!world.renderExternal()){dirty.current=true;return;}post.projectPaper();
    Object.assign(screen.dataset,{scene:root.dataset.scene,camera:world.camera.position.toArray().map(n=>n.toFixed(3)).join(','),target:cameraTarget.toArray().map(n=>n.toFixed(3)).join(','),drawCalls:String(world.renderer.info.render.calls),triangles:String(world.renderer.info.render.triangles),gallery:galleryWeight.toFixed(4),frameRenderingMode:'approved-room-direct',reflection:'Hero SSR inactive in this frame',contactShadow:'room art is rigid and unlit; post props use live contact shadows',geometries:String(world.renderer.info.memory.geometries),textures:String(world.renderer.info.memory.textures)});
    updateEditorial(1,1);destination.style.opacity=String(1-smoothRange(0,.2,bridge));destination.inert=bridge>.2;
   }
  };
  frame=requestAnimationFrame(tick);
  void import('./cinematic/folded/previewSpaceV19').then(async({createFoldedWorld})=>{
   if(disposed)return;
   world=createFoldedWorld(screen,{width:screen.clientWidth,height:screen.clientHeight,pixelRatio:Math.min(devicePixelRatio,innerWidth<760?1.25:1.5),portrait:PORTRAIT,portraitMask:PORTRAIT_MASK,beforeRender:frameHero,onFrame:data=>{Object.assign(screen.dataset,data,{frameRenderingMode:'hero-distance-separated-surfaces'});if(!disposed&&assetsReady&&(first.current||Number(data.entrance)>=.999))setReady(true);}});
   await world.ready;if(disposed)return;assetsReady=true;
   post=createLetterCollection({scene:world.scene,camera:world.camera,host:screen});post.root.visible=false;
   composition=createPostHeroComposition(world.scene,invalidate);
   postStage=new THREE.Group();postStage.name='POST_SHARED_FOREGROUND_STAGE';postStage.matrix.copy(postTransform);postStage.matrixAutoUpdate=false;postStage.add(composition.root,post.root);world.scene.add(postStage);
   setPostReady(true);clockStart=performance.now();world.render(pose);resize();
  }).catch(error=>{if(disposed)return;console.error('Landing world:',error);endIntro();post?.dispose();composition?.dispose();world?.dispose();world=undefined;setReady(false);setFailed(true);});
  root.addEventListener('pointermove',move);root.addEventListener('pointerleave',resetPointer);window.addEventListener('resize',resize);window.addEventListener('scroll',invalidate,{passive:true});media.addEventListener('change',preference);screen.addEventListener('webglcontextlost',contextLost);screen.addEventListener('webglcontextrestored',contextRestored);document.addEventListener('visibilitychange',visibility);
  return()=>{disposed=true;cancelAnimationFrame(frame);mm.revert();resizeObserver.disconnect();post?.dispose();composition?.dispose();postStage?.removeFromParent();world?.dispose();root.removeEventListener('pointermove',move);root.removeEventListener('pointerleave',resetPointer);window.removeEventListener('resize',resize);window.removeEventListener('scroll',invalidate);media.removeEventListener('change',preference);screen.removeEventListener('webglcontextlost',contextLost);screen.removeEventListener('webglcontextrestored',contextRestored);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 useEffect(()=>{dirty.current=true;},[selected,language]);
 return <div ref={host} className={`landing-world-host${ready?' is-world-ready':''}${failed?' world-unavailable':''}`}>
  <canvas ref={canvas} className="landing-world-canvas" role="img" aria-label={language==='ko'?'우주에서 게임방, 이야기와 게임 조각, 편지로 이어지는 우리 둘의 공간':'Nuestro espacio, desde el universo hasta la sala de juegos, las piezas y la carta'}/>
  <AcrossHero language={language} ready={ready} introActive={introActive} onSkip={()=>skip.current()}/>
  <div className="room-discoveries" hidden={!roomActive}>{ROOM_DISCOVERIES.map(object=><button key={object.id} type="button" data-room-object={object.id} aria-label={language==='ko'?object.ko:object.es} onClick={event=>setRoomDiscovery({id:object.id,trigger:event.currentTarget,nonce:++discoveryNonce.current})}><span>{language==='ko'?object.ko:object.es}</span></button>)}</div>
  <PostHeroPreview embedded language={language} onLanguageChange={onLanguageChange} portraitSrc={PORTRAIT} portraitMaskSrc={PORTRAIT_MASK} renderScene={false} externalSceneReady={postReady} onSceneState={receivePostState} onRegisterFrame={registerFrame} roomDiscovery={roomDiscovery} roomActive={roomActive} playHref={`/play?game=${selected}`} gallery={<GameGallery language={language} selected={selected} onSelect={onSelect}/>}/>
 </div>;
}
