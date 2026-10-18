import {useCallback, useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {AcrossHero} from './AcrossHero';
import {GameGallery} from './gallery/GameGallery';
import {createGalleryCollection} from './gallery/GalleryCollection';
import {PostHeroPreview} from '../../post-hero-preview/src/PostHeroPreview';
import type {PostHeroState} from '../../post-hero-preview/src/Scene';
import {createLetterCollection} from '../../post-hero-preview/src/LetterCollection';
import {cameraPose as heroCameraPose} from './cinematic/folded/poseSpaceV19';
import {pointerDecay} from './cinematic/folded/pointerResponse';
import {INTRO_SECONDS, introPose, smoothRange, type FoldPose} from './cinematic/folded/pose';
import '../../post-hero-preview/src/preview.css';
import './landing-world.css';

gsap.registerPlugin(ScrollTrigger);
gsap.ticker.lagSmoothing(0);
const PORTRAIT='/images/approved-couple-room/approved-character-reference.png';
const PORTRAIT_MASK='/images/approved-couple-room/character-opacity-mask.png';
const LETTER_ANCHOR=new THREE.Vector3(-11,1.82,-54);
const GALLERY_ANCHOR=new THREE.Vector3(-11,1.82,-54);
const ROOM_EYE=new THREE.Vector3(-11,7.6,-40);
const ROOM_TARGET=new THREE.Vector3(-11,7.6,-64);
const GALLERY_EYE=new THREE.Vector3(-11,6.7,-40.5);
const GALLERY_TARGET=new THREE.Vector3(-11,4.7,-63);

type Props={language:'ko'|'es';onLanguageChange:(language:'ko'|'es')=>void;selected:string;onSelect:(game:string)=>void};
function hasSeenIntro(){try{return sessionStorage.getItem('folded-playhouse-seen')==='1';}catch{return false;}}
function rememberIntro(){try{sessionStorage.setItem('folded-playhouse-seen','1');}catch{/* Storage is optional. */}}

/** One canvas and one render clock, from the approved Hero through the open letter. */
export function LandingWorldHost({language,onLanguageChange,selected,onSelect}:Props){
 const host=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
 const first=useRef(!matchMedia('(prefers-reduced-motion: reduce)').matches&&!hasSeenIntro()&&!location.hash);
 const [ready,setReady]=useState(false),[postReady,setPostReady]=useState(false),[failed,setFailed]=useState(false),[introActive,setIntroActive]=useState(first.current);
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
  let post:ReturnType<typeof createLetterCollection>|undefined,gallery:ReturnType<typeof createGalleryCollection>|undefined;
  let disposed=false,frame=0,clockStart=0,last=0,elapsed=0,inIntro=first.current,lost=false;
  let trigger:ScrollTrigger|undefined,heroEnd=innerHeight*2.6,previousPost=false,galleryInput=false,postNeedsFrame=false;
  let lastRenderSignature='',pressed:{x:number;y:number;id:number}|null=null;
  const pointer={x:0,y:0},raycaster=new THREE.Raycaster(),ndc=new THREE.Vector2();
  const cameraPosition=new THREE.Vector3(),cameraTarget=new THREE.Vector3(),roomEye=ROOM_EYE.clone();
  let heroBackdrop:THREE.Scene['background']|undefined;
  const roomBackground=new THREE.Color('#21151d');
  const postBackground=new THREE.Color('#21151d');
  const roomContain=(width:number,height:number)=>Math.max(1,(1672/941)/(width/height));
  const roomFov=(width:number,height:number)=>width<760?THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(24))*roomContain(width,height))):48;
  const frameFallback=()=>{
   const image=root.querySelector<HTMLImageElement>('.folded-portrait-fallback');if(!image)return;if(screen.clientWidth<761){image.style.cssText='';return;}
   const width=screen.clientWidth,height=screen.clientHeight,initial=heroCameraPose(0,first.current?0:1,false),camera=new THREE.PerspectiveCamera(38,width/height,.1,400);
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
   const room=smoothRange(.65,1,p);camera.clearViewOffset();
   if(world){if(heroBackdrop===undefined)heroBackdrop=world.scene.background;world.scene.background=p>.72?roomBackground:heroBackdrop;}
   if(width<760){const base=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/.59));camera.fov=THREE.MathUtils.lerp(base,roomFov(width,height),room);camera.setViewOffset(width,height,0,-height*.195*(1-room),width,height);}
   else {camera.position.z+=(24*roomContain(width,height)-24)*room;const target=heroCameraPose(p,pose.entrance,false).target;camera.lookAt(...target as [number,number,number]);}
  };
  const titleLines=[...hero.querySelectorAll<HTMLElement>('.across-title-line')];
  const copy=hero.querySelector<HTMLElement>('.across-editorial')!,destination=hero.querySelector<HTMLElement>('.folded-destination')!;
  const endIntro=()=>{inIntro=false;pose.entrance=1;setIntroActive(false);rememberIntro();dirty.current=true;};skip.current=endIntro;
  const resetPointer=()=>{pointer.x=pointer.y=0;pressed=null;};
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
  const down=(event:PointerEvent)=>{
   if(!galleryInput||!event.isPrimary||event.button!==0||(event.target as Element)?.closest('a,button,input,textarea,summary'))return;
   pressed={x:event.clientX,y:event.clientY,id:event.pointerId};
  };
  const up=(event:PointerEvent)=>{
   const start=pressed;pressed=null;
   if(!start||!world||!galleryInput||start.id!==event.pointerId||Math.hypot(event.clientX-start.x,event.clientY-start.y)>8)return;
   ndc.set(event.clientX/screen.clientWidth*2-1,1-event.clientY/screen.clientHeight*2);raycaster.setFromCamera(ndc,world.camera);
   const id=gallery?.pick(raycaster);if(id){selection.current.onSelect(id);dirty.current=true;}
  };
  const contextLost=(event:Event)=>{event.preventDefault();lost=true;setReady(false);setPostReady(false);endIntro();};
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
   const exit=smoothRange(.15,.46,p),appear=smoothRange(.73,.94,p),focused=copy.querySelector(':focus-visible');
   const copyExit=focused?0:exit;
   hero.style.setProperty('--hero-atmosphere-opacity',String(1-copyExit));
   copy.style.opacity=String(1-copyExit);copy.style.setProperty('--hero-copy-opacity',String(1-copyExit));copy.style.transform=`translate3d(${-copyExit*90}px,${-copyExit*65}px,${copyExit*320}px)`;copy.style.pointerEvents=copyExit>.98?'none':'auto';copy.inert=copyExit>.98;
   titleLines.forEach(line=>{line.style.opacity='1';line.style.transform='none';});
   destination.style.opacity=String(appear);destination.inert=appear<.95;
   hero.dataset.roomActive=String(p>.18);hero.dataset.introOwner=inIntro?'live-space+remotion-surface':'live';hero.dataset.introTime=pose.time.toFixed(3);
  };
  const tick=(now:number)=>{
   if(disposed)return;frame=requestAnimationFrame(tick);
   const actualDt=last?Math.max(0,(now-last)/1000):0,dt=Math.min(actualDt,.08);last=now;
   if(document.hidden||lost||!world)return;
   externalTick.current?.(now);elapsed+=dt;
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
   if(!galleryInput&&galleryWeight>=.92)galleryInput=true;else if(galleryInput&&galleryWeight<.88)galleryInput=false;
   gallery?.setInputEnabled(galleryInput);
   root.dataset.scene=!postActive?'hero':galleryWeight>.5?'gallery':postState.current.progress<.56?'story':postState.current.progress<.9?'letter':'ending';
   root.dataset.galleryInput=String(galleryInput);root.dataset.bridge=bridge.toFixed(4);
   const signature=[pose.progress,pose.entrance,pose.pointerX,pose.pointerY,bridge,postState.current.progress,postState.current.opening,galleryWeight,selection.current.selected,scrollY,width,height].map(value=>typeof value==='number'?value.toFixed(4):value).join(':');
   const needsFrame=dirty.current||signature!==lastRenderSignature||postNeedsFrame||(!media.matches&&(galleryWeight>.01||postState.current.effect.value!==0));
   if(!needsFrame){if(!postActive){world.render(pose);updateEditorial(Number(screen.dataset.progress??pose.progress),Number(screen.dataset.entrance??pose.entrance));}return;}lastRenderSignature=signature;dirty.current=false;
   if(!postActive){
    if(previousPost){world.setPostActive(false);world.camera.clearViewOffset();lastRenderSignature='';}
    previousPost=false;if(post)post.root.visible=false;if(gallery)gallery.root.visible=false;
    world.updateRoomExit(0);world.updateRoomDesk(0);world.render(pose);
    updateEditorial(Number(screen.dataset.progress??pose.progress),Number(screen.dataset.entrance??pose.entrance));
   }else if(post&&gallery){
    if(!previousPost){world.render({...pose,progress:1,entrance:1});if(Number(screen.dataset.progress??0)<.999||Number(screen.dataset.entrance??0)<.999){dirty.current=true;return;}world.setPostActive(true);}
    previousPost=true;
    const progress=postState.current.progress;
    const letterWeight=smoothRange(.48,.61,progress)*(1-smoothRange(.88,.99,progress))*(1-galleryWeight);
    post.root.visible=true;
    const collectionPresence=Math.max(galleryWeight,smoothRange(.43,.49,progress)*(1-smoothRange(.86,.98,progress)));
    gallery.root.visible=collectionPresence>.001;
    world.updateRoomDesk(bridge);
    world.updateRoomExit(.035*galleryWeight);
    post.root.position.lerpVectors(new THREE.Vector3(-13.5,1.82,-55.5),LETTER_ANCHOR,letterWeight);post.root.scale.setScalar(.5+.5*letterWeight);
    post.update({...postState.current,width,height,ownCamera:false});postNeedsFrame=false;
    world.scene.background=postBackground;
    roomEye.copy(ROOM_EYE);if(width>=760)roomEye.z+=24*roomContain(width,height)-24;
    cameraPosition.copy(roomEye).lerp(GALLERY_EYE,galleryWeight*bridge);
    cameraTarget.copy(ROOM_TARGET).lerp(GALLERY_TARGET,galleryWeight*bridge);
    const letterFocus=smoothRange(.52,.72,progress)*(1-smoothRange(.88,1,progress))*(1-galleryWeight);
    cameraPosition.lerp(new THREE.Vector3(-11,5,-44.5),letterFocus);
    cameraTarget.lerp(new THREE.Vector3(-11,3,-54),letterFocus);
    const ending=smoothRange(.9,1,progress);
    cameraPosition.lerp(new THREE.Vector3(-11,8.1,-37),ending);
    cameraTarget.lerp(new THREE.Vector3(-11,7.2,-64),ending);
    world.camera.position.copy(cameraPosition);world.camera.lookAt(cameraTarget);
    world.camera.clearViewOffset();
    let fov=THREE.MathUtils.lerp(roomFov(width,height),60,galleryWeight*bridge);
    if(width<760){
     const mobileFov=roomFov(width,height);
     fov=THREE.MathUtils.lerp(roomFov(width,height),mobileFov,bridge);
     fov=THREE.MathUtils.lerp(fov,60,letterFocus);
     fov=THREE.MathUtils.lerp(fov,roomFov(width,height),ending);
     const shift=THREE.MathUtils.lerp(-.07,.15,galleryWeight);
     world.camera.setViewOffset(width,height,0,height*shift*bridge*(1-letterFocus)*(1-ending),width,height);
    }
    world.camera.fov=fov;world.camera.updateProjectionMatrix();
    gallery.root.position.copy(GALLERY_ANCHOR);gallery.root.position.y-=(1-collectionPresence)*8.5;gallery.root.position.z-=letterFocus*4;
    gallery.root.rotation.y=0;
    gallery.update({selected:selection.current.selected,time:elapsed,paused:media.matches,dt,snap:media.matches,mobile:width<700,effect:postState.current.effect});
    if(!world.renderExternal()){dirty.current=true;return;}post.projectPaper();
    Object.assign(screen.dataset,{scene:root.dataset.scene,camera:world.camera.position.toArray().map(n=>n.toFixed(3)).join(','),target:cameraTarget.toArray().map(n=>n.toFixed(3)).join(','),drawCalls:String(world.renderer.info.render.calls),triangles:String(world.renderer.info.render.triangles),gallery:galleryWeight.toFixed(4),frameRenderingMode:'approved-room-direct',reflection:'Hero SSR inactive in this frame',contactShadow:'1024 PCF from room key on desk contact receiver',geometries:String(world.renderer.info.memory.geometries),textures:String(world.renderer.info.memory.textures)});
    updateEditorial(1,1);
   }
  };
  void import('./cinematic/folded/previewSpaceV19').then(async({createFoldedWorld})=>{
   if(disposed)return;
   world=createFoldedWorld(screen,{width:screen.clientWidth,height:screen.clientHeight,pixelRatio:Math.min(devicePixelRatio,innerWidth<760?1.25:1.5),portrait:PORTRAIT,portraitMask:PORTRAIT_MASK,beforeRender:frameHero,surfaceFilm:'/motion/folded-playhouse-lightwell.mp4',introSurfaceFilm:'/motion/folded-playhouse-gift-edge-v18.mp4',onFrame:data=>{Object.assign(screen.dataset,data,{frameRenderingMode:'hero-curved-SSR'});if(!disposed&&(first.current||Number(data.entrance)>=.999))setReady(true);}});
   await world.ready;if(disposed)return;
   post=createLetterCollection({scene:world.scene,camera:world.camera,host:screen});post.root.position.copy(LETTER_ANCHOR);post.root.visible=false;
   gallery=createGalleryCollection(invalidate);gallery.root.position.copy(GALLERY_ANCHOR);gallery.root.visible=false;world.scene.add(gallery.root);
   setPostReady(true);clockStart=performance.now();world.render(pose);frame=requestAnimationFrame(tick);resize();
  }).catch(error=>{if(disposed)return;console.error('Landing world:',error);endIntro();post?.dispose();gallery?.dispose();world?.dispose();world=undefined;setReady(false);setFailed(true);});
  root.addEventListener('pointermove',move);root.addEventListener('pointerleave',resetPointer);root.addEventListener('pointerdown',down);root.addEventListener('pointerup',up);root.addEventListener('pointercancel',resetPointer);window.addEventListener('resize',resize);window.addEventListener('scroll',invalidate,{passive:true});media.addEventListener('change',preference);screen.addEventListener('webglcontextlost',contextLost);screen.addEventListener('webglcontextrestored',contextRestored);document.addEventListener('visibilitychange',visibility);
  return()=>{disposed=true;cancelAnimationFrame(frame);mm.revert();resizeObserver.disconnect();post?.dispose();gallery?.dispose();world?.dispose();root.removeEventListener('pointermove',move);root.removeEventListener('pointerleave',resetPointer);root.removeEventListener('pointerdown',down);root.removeEventListener('pointerup',up);root.removeEventListener('pointercancel',resetPointer);window.removeEventListener('resize',resize);window.removeEventListener('scroll',invalidate);media.removeEventListener('change',preference);screen.removeEventListener('webglcontextlost',contextLost);screen.removeEventListener('webglcontextrestored',contextRestored);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 useEffect(()=>{dirty.current=true;},[selected,language]);
 return <div ref={host} className={`landing-world-host${ready?' is-world-ready':''}${failed?' world-unavailable':''}`}>
  <canvas ref={canvas} className="landing-world-canvas" role="img" aria-label={language==='ko'?'우주에서 게임방, 이야기와 게임 조각, 편지로 이어지는 우리 둘의 공간':'Nuestro espacio, desde el universo hasta la sala de juegos, las piezas y la carta'}/>
  <AcrossHero language={language} ready={ready} introActive={introActive} onSkip={()=>skip.current()}/>
  <PostHeroPreview embedded language={language} onLanguageChange={onLanguageChange} portraitSrc={PORTRAIT} portraitMaskSrc={PORTRAIT_MASK} renderScene={false} externalSceneReady={postReady} onSceneState={receivePostState} onRegisterFrame={registerFrame} playHref={`/play?game=${selected}`} gallery={<GameGallery language={language} selected={selected} onSelect={onSelect} sharedScene={!failed}/>}/>
 </div>;
}
