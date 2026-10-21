import * as T from 'three';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import {ROOM_WORLD,roomWorldVertex} from './approvedRoomGeometry';
import {heroWorldProjection} from './initialCosmicHero';
import {createApprovedGamingRoom} from './ApprovedGamingRoom';
import {createStorySurface} from './storySurfaceV19';
import {cameraPose,clamp01,smoothRange,type FoldPose} from './poseSpaceV19';
export type WorldOptions={width:number;height:number;pixelRatio:number;portrait:string;portraitMask?:string;beforeRender?:(camera:T.PerspectiveCamera,progress:number,width:number,height:number)=>void;onFrame?:(data:Record<string,string>)=>void};

export function createFoldedWorld(canvas:HTMLCanvasElement,options:WorldOptions){
 let disposed=false,width=options.width,height=options.height,lastSignature='',stageProjectionKey='',renderSerial=0;
 const owned=new Set<{dispose:()=>void}>(),start=performance.now(),marks:Record<string,number>={};
 const keep=<A extends{dispose:()=>void}>(a:A)=>{if(disposed)a.dispose();else owned.add(a);return a;};
 const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(options.pixelRatio);renderer.setSize(width,height,false);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.AgXToneMapping;renderer.toneMappingExposure=1;renderer.info.autoReset=false;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.shadowMap.autoUpdate=false;
 const gl=renderer.getContext()as WebGL2RenderingContext;let pendingFence:WebGLSync|null=null,pendingFrameData:Record<string,string>|null=null,skippedWhilePending=0;
 const resetFence=()=>{pendingFence=null;pendingFrameData=null;lastSignature='';};canvas.addEventListener('webglcontextlost',resetFence);canvas.addEventListener('webglcontextrestored',resetFence);
 const scene=new T.Scene();scene.background=new T.Color('#120c14');const camera=new T.PerspectiveCamera(48,width/height,.1,400);
 const storySurface=createStorySurface(scene,keep),atrium=createApprovedGamingRoom(scene,keep);
 const portraitRig=new T.Group();portraitRig.name='APPROVED_FACE_FRONT_PORTRAIT';
 const heroStage=new T.Group();heroStage.name='APPROVED_HERO_NEAR_ROOM_STAGE';heroStage.matrixAutoUpdate=false;scene.add(heroStage);heroStage.add(portraitRig);
 const portraitMaterial=keep(new T.MeshBasicMaterial({transparent:true,alphaTest:.005,toneMapped:false,depthWrite:true}));
 const portrait=new T.Mesh(keep(new T.PlaneGeometry(options.portraitMask?6.2*1312/1199:5.9,options.portraitMask?6.2:5.9)),portraitMaterial);portrait.name='APPROVED_UNCHANGED_PORTRAIT';portrait.renderOrder=0;portrait.position.set(1.85,.03,.05);portraitRig.add(portrait);
 const loader=new T.TextureLoader();
 const skyReady=loader.loadAsync('/images/our-universe-scene.webp').then(texture=>{keep(texture);texture.colorSpace=T.SRGBColorSpace;storySurface.setHeroImage(texture);});
 const portraitReady=loader.loadAsync(options.portrait).then(texture=>{keep(texture);texture.colorSpace=T.SRGBColorSpace;portraitMaterial.map=texture;portraitMaterial.needsUpdate=true;});
 const maskReady=options.portraitMask?loader.loadAsync(options.portraitMask).then(texture=>{keep(texture);texture.colorSpace=T.NoColorSpace;portraitMaterial.alphaMap=texture;portraitMaterial.needsUpdate=true;}):Promise.resolve();
 let arrivalEnvironment:T.Texture|null=null;
 const pmrem=new T.PMREMGenerator(renderer);
 const environmentReady=new HDRLoader().loadAsync('/models/folded-chamber-r8-space-v6/arrival-environment.hdr').then(source=>{
  if(disposed){source.dispose();pmrem.dispose();return;}source.mapping=T.EquirectangularReflectionMapping;arrivalEnvironment=keep(pmrem.fromEquirectangular(source)).texture;source.dispose();pmrem.dispose();
 },error=>{pmrem.dispose();throw error;});
 const debug=gl.getExtension('WEBGL_debug_renderer_info'),rendererName=debug?String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)):'unreported';
 function publish(){if(!pendingFrameData||disposed)return;pendingFrameData.fenceCompletedAtMs=performance.now().toFixed(3);options.onFrame?.(pendingFrameData);pendingFrameData=null;}
 function finishPending(){if(!pendingFence)return true;const status=gl.clientWaitSync(pendingFence,0,0);if(status===gl.TIMEOUT_EXPIRED){skippedWhilePending++;return false;}gl.deleteSync(pendingFence);pendingFence=null;publish();return true;}
 function submit(){renderer.info.reset();renderer.render(scene,camera);pendingFence=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);gl.flush();}
 function render(pose:FoldPose){
  if(disposed||!finishPending())return;const signature=[pose.progress,pose.entrance,pose.pointerX,pose.pointerY,width,height].join(':');if(signature===lastSignature)return;lastSignature=signature;
  const p=clamp01(pose.progress),e=clamp01(pose.entrance),cam=cameraPose(p,e,width<760),pointer=1-smoothRange(.03,.06,p);
  storySurface.setProjection(width,height,e);atrium.updateFold(p);atrium.root.visible=true;atrium.setOpacity(width>=760?1:smoothRange(.27,.38,p));
  const stageKey=width+':'+height+':'+e.toFixed(4);if(stageKey!==stageProjectionKey){stageProjectionKey=stageKey;if(width>=760)heroStage.matrix.copy(heroWorldProjection(width,height,e));else heroStage.matrix.identity();heroStage.updateMatrixWorld(true);}
  const pointerScale=width>=760?.28*Math.tan(24*Math.PI/180)/Math.tan(19*Math.PI/180):1;
  camera.fov=width>=760?48:38+10*smoothRange(.27,.38,p);camera.position.set(cam.position[0]+pose.pointerX*.12*pointer*pointerScale,cam.position[1]-pose.pointerY*.06*pointer*pointerScale,cam.position[2]);camera.lookAt(...cam.target as[number,number,number]);
  portrait.renderOrder=width<760?4:0;portraitMaterial.depthWrite=width>=760;const mobileLeave=width<760?smoothRange(.06,.10,p):0;portraitRig.position.set(0,0,-1.4*mobileLeave);portraitRig.updateMatrix();portraitMaterial.opacity=1-mobileLeave;portraitRig.visible=portraitMaterial.opacity>0;
  options.beforeRender?.(camera,p,width,height);camera.updateProjectionMatrix();storySurface.update(p,e,pose.pointerX,pose.pointerY,camera);
  atrium.root.position.set(ROOM_WORLD.x,ROOM_WORLD.y,ROOM_WORLD.z);atrium.root.rotation.set(ROOM_WORLD.tilt,0,0);atrium.root.scale.setScalar(ROOM_WORLD.scale);
  const before=performance.now();submit();
  const corners=[[0,-58],[1672,-58],[1672,999],[0,999]].map(([x,y])=>new T.Vector3(...roomWorldVertex(x,y,0)).project(camera));
  Object.assign(canvas.dataset,{roomViewport:JSON.stringify({left:Math.min(...corners.map(v=>(v.x+1)*width/2)),right:Math.max(...corners.map(v=>(v.x+1)*width/2)),top:Math.min(...corners.map(v=>(1-v.y)*height/2)),bottom:Math.max(...corners.map(v=>(1-v.y)*height/2))}),roomMatrix:atrium.root.matrixWorld.toArray().join(','),heroStageMatrix:heroStage.matrixWorld.toArray().join(','),portraitRetreat:'0',portraitTurn:'0',portraitOpacity:String(portraitMaterial.opacity),surfaceVisible:String(storySurface.mesh.visible),fov:String(camera.fov)});
  pendingFrameData={frameSerial:String(++renderSerial),progress:p.toFixed(4),entrance:e.toFixed(4),pointerX:pose.pointerX.toFixed(4),pointerY:pose.pointerY.toFixed(4),camera:camera.position.toArray().map(n=>n.toFixed(3)).join(','),target:cam.target.map(n=>n.toFixed(3)).join(','),fold:storySurface.state.sink.toFixed(4),renderer:rendererName,drawCalls:String(renderer.info.render.calls),triangles:String(renderer.info.render.triangles),geometries:String(renderer.info.memory.geometries),textures:String(renderer.info.memory.textures),storySurface:JSON.stringify({id:storySurface.mesh.uuid,name:storySurface.mesh.name,vertices:storySurface.mesh.geometry.getAttribute('position').count,...storySurface.state}),cpuSubmitMs:(performance.now()-before).toFixed(2),initMarks:JSON.stringify(marks),bufferSize:canvas.width+'x'+canvas.height,portraitStageMatrix:portraitRig.matrix.toArray().join(','),gpuPendingSkips:String(skippedWhilePending),cosmicEnvironment:'original intact RGB on one continuous depth-writing media surface; no semantic extraction or global scenery alpha',storyAtrium:'unchanged approved rigid illustration; no reconstructed interior',portraitContinuity:'opaque rigid original printed figure; world-fixed while camera passes',allocationNote:'SwiftShader composition capture does not measure hardware GPU performance'};
 }
 const ready=Promise.all([portraitReady,maskReady,skyReady,atrium.ready,environmentReady]).then(async()=>{
  if(disposed)return;marks.assets=performance.now()-start;render({progress:0,entrance:0,pointerX:0,pointerY:0,time:0});
  const warmup=performance.now();await new Promise<void>((resolve,reject)=>{const poll=()=>{if(disposed){resolve();return;}if(performance.now()-warmup>120000){reject(Error('First-frame warmup timeout'));return;}if(!finishPending()){setTimeout(poll,16);return;}resolve();};poll();});
  if(!disposed&&gl.getError()!==gl.NO_ERROR)throw Error('First-frame WebGL failure');marks.firstFrameWarmup=performance.now()-warmup;
 });
 let postActive=false;
 function setPostActive(active:boolean){if(active===postActive)return;postActive=active;lastSignature='';heroStage.visible=!active;storySurface.mesh.visible=!active;atrium.setOpacity(1);scene.environment=active?arrivalEnvironment:null;scene.environmentIntensity=active?.8:0;}
 function renderExternal(){if(disposed||!finishPending())return false;lastSignature='';renderer.shadowMap.needsUpdate=true;const before=performance.now();submit();canvas.dataset.externalFrameSerial=String(++renderSerial);canvas.dataset.cpuSubmitMs=(performance.now()-before).toFixed(2);return true;}
 return{scene,camera,renderer,ready,render,setPostActive,renderExternal,updateRoomExit:atrium.updateExit,updateRoomDesk:atrium.updateDesk,resize(w:number,h:number,dpr:number){width=w;height=h;lastSignature='';renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();},dispose(){
  disposed=true;canvas.removeEventListener('webglcontextlost',resetFence);canvas.removeEventListener('webglcontextrestored',resetFence);if(pendingFence&&!gl.isContextLost())gl.deleteSync(pendingFence);owned.forEach(resource=>resource.dispose());renderer.dispose();
 }};
}
