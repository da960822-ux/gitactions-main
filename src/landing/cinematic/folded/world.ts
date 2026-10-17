import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {cameraPose,clamp01,smoothRange,type FoldPose} from './pose';
import {foldPoint,shellGeometry,type Surface} from './shellGeometry';
export type WorldOptions={width:number;height:number;pixelRatio:number;portrait:string;surfaceFilm?:string;onFrame?:(data:Record<string,string>)=>void};
export type LandingSceneModule={root:T.Group;anchor:T.Vector3;setSelected?:(id:string)=>void;setInputEnabled?:(enabled:boolean)=>void;dispose:()=>void};

export function createFoldedWorld(canvas:HTMLCanvasElement,options:WorldOptions){
 const initStart=performance.now(),resources:{dispose:()=>void}[]=[],marks:Record<string,number>={};
 const geo=<G extends T.BufferGeometry>(g:G)=>{resources.push(g);return g;};
 const mat=<M extends T.Material>(m:M)=>{resources.push(m);return m;};
 const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(options.pixelRatio);renderer.setSize(options.width,options.height,false);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.shadowMap.autoUpdate=false;
 const scene=new T.Scene();scene.background=new T.Color('#19151b');scene.fog=new T.FogExp2('#19151b',.012);
 const camera=new T.PerspectiveCamera(38,options.width/options.height,.1,100);
 marks.renderer=performance.now()-initStart;
 // Small authored softbox cubemap. No six scene captures or temporary full-resolution reflection renderer.
 const cubeFaces=Array.from({length:6},(_,i)=>{const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d')!;ctx.fillStyle='#19141d';ctx.fillRect(0,0,128,128);const g=ctx.createLinearGradient(0,0,128,128);g.addColorStop(0,i===2?'#a9afc2':'#3d303c');g.addColorStop(1,'#17131c');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);ctx.fillStyle=i%2?'#c7a08a':'#e7d9c7';ctx.fillRect(i===0?40:12,10,i===2?96:22,106);ctx.fillStyle='#7892a7';ctx.fillRect(99,20,7,80);return c;});
 const cube=new T.CubeTexture(cubeFaces);cube.colorSpace=T.SRGBColorSpace;cube.needsUpdate=true;
 const pmrem=new T.PMREMGenerator(renderer),environment=pmrem.fromCubemap(cube);scene.environment=environment.texture;scene.environmentIntensity=.9;resources.push(environment);cube.dispose();pmrem.dispose();
 marks.environment=performance.now()-initStart-marks.renderer;
 const grainCanvas=document.createElement('canvas');grainCanvas.width=grainCanvas.height=128;const gc=grainCanvas.getContext('2d')!,image=gc.createImageData(128,128);
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4,n=Math.sin(x*1.73+y*.13)+Math.sin(x*2.61-y*.07)*.5;image.data[i]=128+n*5;image.data[i+1]=128+Math.sin(y*2.17+x*.3)*2;image.data[i+2]=255;image.data[i+3]=255;}gc.putImageData(image,0,0);
 const grain=new T.CanvasTexture(grainCanvas);grain.wrapS=grain.wrapT=T.RepeatWrapping;grain.repeat.set(18,8);resources.push(grain);
 const metal=mat(new T.MeshStandardMaterial({color:'#be927e',metalness:.93,roughness:.23,normalMap:grain,normalScale:new T.Vector2(.17,.17),envMapIntensity:1.5}));
 const satin=mat(new T.MeshStandardMaterial({color:'#64394a',metalness:.26,roughness:.43,normalMap:grain,normalScale:new T.Vector2(.1,.1),envMapIntensity:1.1}));
 const paper=mat(new T.MeshStandardMaterial({color:'#b6a89c',metalness:.04,roughness:.72,normalMap:grain,normalScale:new T.Vector2(.08,.08),envMapIntensity:.6}));
 const floor=mat(new T.MeshStandardMaterial({color:'#30242e',metalness:.42,roughness:.32,normalMap:grain,normalScale:new T.Vector2(.12,.12),envMapIntensity:.95}));
 const finishCanvas=document.createElement('canvas');finishCanvas.width=128;finishCanvas.height=2;const fc=finishCanvas.getContext('2d')!,finishGradient=fc.createLinearGradient(0,0,128,0);finishGradient.addColorStop(0,'#30242e');finishGradient.addColorStop(.35,'#30242e');finishGradient.addColorStop(.55,'#a99b90');finishGradient.addColorStop(1,'#a99b90');fc.fillStyle=finishGradient;fc.fillRect(0,0,128,2);const finishMap=new T.CanvasTexture(finishCanvas);finishMap.colorSpace=T.SRGBColorSpace;resources.push(finishMap);
 const rmCanvas=document.createElement('canvas');rmCanvas.width=128;rmCanvas.height=2;const rmc=rmCanvas.getContext('2d')!,rmImage=rmc.createImageData(128,2);for(let i=0;i<256;i++){const t=smoothRange(.35,.55,(i%128)/127);rmImage.data[i*4+1]=(.32+.40*t)*255;rmImage.data[i*4+2]=(.42-.38*t)*255;rmImage.data[i*4+3]=255;}rmc.putImageData(rmImage,0,0);const finishRM=new T.CanvasTexture(rmCanvas);resources.push(finishRM);
 const foregroundFinish=mat(new T.MeshStandardMaterial({color:'#ffffff',map:finishMap,metalness:1,roughness:1,roughnessMap:finishRM,metalnessMap:finishRM,normalMap:grain,normalScale:new T.Vector2(.1,.1)}));
 const ribMaterial=mat(new T.MeshStandardMaterial({color:'#776c67',metalness:.48,roughness:.38,normalMap:grain,normalScale:new T.Vector2(.12,.12)}));
 const ink=mat(new T.MeshStandardMaterial({color:'#24232f',metalness:.12,roughness:.65}));
 const warmWhite=mat(new T.MeshBasicMaterial({color:'#f3c89e',toneMapped:false}));
 const key=new T.DirectionalLight('#ffead1',3.2);key.position.set(-3.5,6.5,8);key.castShadow=true;key.shadow.mapSize.set(512,512);key.shadow.camera.left=-8;key.shadow.camera.right=9;key.shadow.camera.top=8;key.shadow.camera.bottom=-5;key.shadow.camera.far=28;key.shadow.bias=-.0006;key.shadow.normalBias=.025;key.target.position.set(1,-1,-1);scene.add(key,key.target);
 const fill=new T.HemisphereLight('#b3bccb','#261722',.85);scene.add(fill);
 const warm=new T.PointLight('#e3a68f',55,22,2);warm.position.set(5.5,1,2.5);scene.add(warm);
 const cool=new T.PointLight('#829ebc',85,28,2);cool.position.set(-4,4,-13);scene.add(cool);
 const bayLight=new T.PointLight('#ffd5a0',95,17,2);bayLight.position.set(4,1,-27);scene.add(bayLight);
 const canopyLight=new T.PointLight('#e6b899',48,20,2);canopyLight.position.set(0,.2,-17);scene.add(canopyLight);
 const folds=new T.Group();folds.name='SHARED_FOLD_SYSTEM';scene.add(folds);
 const dynamic:T.Mesh[]=[];
 for(let k=0;k<2;k++){
  const g=geo(shellGeometry((u,v,t)=>foldPoint(k,u,v,t),{nx:48,ny:36,thickness:k===0?.18:.16,morph:true,splitFront:k===1}));
  const mesh=new T.Mesh(g,k===0?[satin,paper,metal,paper]:[floor,ink,floor,foregroundFinish]);mesh.name=k===0?'FOLD_A_CURVED_WALL_TO_CEILING':'FOLD_B_FOREGROUND_LIP_TO_FLOOR';mesh.frustumCulled=false;mesh.castShadow=k===0;mesh.receiveShadow=true;folds.add(mesh);dynamic.push(mesh);
 }
 // An asymmetric, inhabited architectural section; outside boundaries continue beyond the frame.
 const room=new T.Group();room.name='NEXT_ROOM_BOUNDARY';scene.add(room);
 const solid=(name:string,surface:Surface,materials:T.Material[],thickness=.22,nx=28,ny=32,cutout?:((u:number,v:number)=>boolean))=>{const mesh=new T.Mesh(geo(shellGeometry(surface,{nx,ny,thickness,cutout})),materials);mesh.name=name;mesh.receiveShadow=true;room.add(mesh);return mesh;};
 solid('CONTINUOUS_FLOOR_COVE_AND_REAR_WALL',(u,v)=>{let y=-3.3,z=-20;if(v<.18)z=-20-v/.18*2;else if(v<.68){const angle=(v-.18)/.5*Math.PI/2;z=-22-3*Math.sin(angle);y=-3.3+3*(1-Math.cos(angle));}else{z=-25;y=-.3+(v-.68)/.32*7.8;}return new T.Vector3(-7.5+u*15,y,z);},[floor,ink,ink],.28,64,80,(u,v)=>u>(-5.95+7.5)/15&&u<(-4.05+7.5)/15&&v>.675&&v<.88);
 solid('RIGHT_RECESSED_BAY',(u,v)=>{const recess=2.0*Math.pow(Math.sin(Math.PI*smoothRange(.1,.9,v)),4);return new T.Vector3(6.0-.65*Math.sin(u*Math.PI)+recess,-3.3+u*9.0,-11-v*16);},[satin,ink,metal],.3,24,44);
 solid('LEFT_CURVED_SECTION',(u,v)=>new T.Vector3(-6.4-.9*Math.sin(u*Math.PI),-3.3+u*8.1,-7-v*20),[ink,ink,paper],.3,20,36);
 const canopySurface:Surface=(u,v)=>new T.Vector3(-4.5+u*9,3.1+.6*Math.sin(u*Math.PI)-1.2*Math.pow(v-.5,2)+.12*Math.cos(u*Math.PI*4),-13-v*10);
 solid('LARGE_FOLDED_CANOPY_UNDERSIDE',canopySurface,[paper,paper,metal],.2,48,32);
 // Structural ribs have bevelled cross-sections; they join roof and side-bay rather than floating as graphic lines.
 const ribShape=new T.Shape();[[-6.5,-3.2],[-6.5,2.9],[-4.5,4.8],[1.7,5.3],[6.1,3.5],[6.1,3.2],[1.65,4.96],[-4.38,4.47],[-6.17,2.76],[-6.17,-3.2]].forEach(([x,y],i)=>i?ribShape.lineTo(x,y):ribShape.moveTo(x,y));ribShape.closePath();
 const ribGeo=geo(new T.ExtrudeGeometry(ribShape,{depth:.24,bevelEnabled:true,bevelSegments:2,bevelThickness:.05,bevelSize:.035,steps:1}));const ribs=new T.InstancedMesh(ribGeo,ribMaterial,3);ribs.name='LOAD_BEARING_FOLDED_RIBS';const matrix=new T.Matrix4();for(let i=0;i<3;i++){matrix.makeTranslation(0,0,-8-i*6);ribs.setMatrixAt(i,matrix);}room.add(ribs);
 const boxGeo=geo(new RoundedBoxGeometry(1,1,1,2,.055));
 const box=(name:string,x:number,y:number,z:number,w:number,h:number,d:number,material:T.Material)=>{const mesh=new T.Mesh(boxGeo,material);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.name=name;room.add(mesh);return mesh;};
 for(let i=0;i<3;i++){
  box('BAY_STEPPED_FLOOR',5.45,-2.9+i*.17,-11-i*4,1.9,.4+i*.34,2.3,floor);
  box('RECESSED_CEILING_SOFTBOX',4.5,4.5,-10-i*5,1.6,.07,1.1,warmWhite);
 }
 box('WINDOW_RECESS_LEFT',-5.8,2,-26.4,.3,4.8,2.7,paper);box('WINDOW_RECESS_RIGHT',-4.2,2,-26.4,.3,4.8,2.7,paper);box('WINDOW_RECESS_CEILING',-5,4.4,-26.4,1.9,.3,2.7,paper);box('WINDOW_RECESS_SILL',-5,-.4,-26.4,1.9,.3,2.7,paper);box('ILLUMINATED_FAR_APERTURE',-5,2,-27.85,1.3,4.5,.05,warmWhite);bayLight.position.set(-5,2,-26);
 const joinGeo=geo(new T.BoxGeometry(.025,.018,18));const joins=new T.InstancedMesh(joinGeo,metal,3);for(let i=0;i<3;i++){matrix.makeTranslation(-3.6+i*3.6,-3.12,-12);joins.setMatrixAt(i,matrix);}joins.name='FLOOR_EXPANSION_JOINTS';room.add(joins);
 const portraitGroup=new T.Group();portraitGroup.name='PORTRAIT_STAGE';scene.add(portraitGroup);
 const portraitMaterial=mat(new T.MeshBasicMaterial({transparent:true,alphaTest:.025,toneMapped:false}));
 const portrait=new T.Mesh(geo(new T.PlaneGeometry(5.9,5.9)),portraitMaterial);portrait.position.set(1.85,.03,.05);portrait.name='PORTRAIT_01_UNCHANGED_RGBA';portrait.castShadow=true;portraitGroup.add(portrait);
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=256;shadowCanvas.height=128;const sc=shadowCanvas.getContext('2d')!,gradient=sc.createRadialGradient(128,64,2,128,64,115);gradient.addColorStop(0,'rgba(0,0,0,.7)');gradient.addColorStop(1,'rgba(0,0,0,0)');sc.fillStyle=gradient;sc.fillRect(0,0,256,128);const shadowTex=new T.CanvasTexture(shadowCanvas);resources.push(shadowTex);
 const shadow=new T.Mesh(geo(new T.PlaneGeometry(5.6,2.3)),mat(new T.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false})));shadow.rotation.x=-Math.PI/2;shadow.position.set(1.85,-3.08,.1);portraitGroup.add(shadow);
 const wrapMat=mat(new T.MeshBasicMaterial({transparent:true,opacity:.13,color:'#e2af9b',depthWrite:false}));const wrap=new T.Mesh(geo(new T.PlaneGeometry(5.92,5.92)),wrapMat);wrap.position.copy(portrait.position).add(new T.Vector3(.018,.012,-.025));portraitGroup.add(wrap);
 let film:HTMLVideoElement|undefined,filmTexture:T.VideoTexture|undefined;
 const filmMaterial=mat(new T.MeshStandardMaterial({color:'#a48c8a',metalness:.18,roughness:.47,emissive:'#a87b85',emissiveIntensity:.65,transparent:true,side:T.DoubleSide,depthWrite:false}));
 const filmGeo=geo(new T.PlaneGeometry(8.9,9.8,48,32)),filmBend={value:1};
 filmMaterial.onBeforeCompile=shader=>{shader.uniforms.uFoldBend=filmBend;shader.vertexShader='uniform float uFoldBend;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.z+=sin(uv.x*3.14159265)*cos(uv.y*3.14159265)*uFoldBend;');};
 const filmPanel=new T.Mesh(filmGeo,filmMaterial);filmPanel.name='HYPERFRAMES_CANOPY_SURFACE';filmPanel.rotation.x=-Math.PI/2;filmPanel.position.set(0,2.97,-18);room.add(filmPanel);
 if(options.surfaceFilm){film=document.createElement('video');film.src=options.surfaceFilm;film.muted=true;film.playsInline=true;film.preload='auto';filmTexture=new T.VideoTexture(film);filmTexture.colorSpace=T.SRGBColorSpace;resources.push(filmTexture);filmMaterial.map=filmTexture;filmMaterial.emissiveMap=filmTexture;}
 marks.geometry=performance.now()-initStart-marks.renderer-marks.environment;
 let width=options.width,height=options.height,disposed=false,lastFilmTime=-1,lastSignature='',lastShadowSignature='';
 const invalidate=()=>{lastSignature='';};film?.addEventListener('seeked',invalidate);film?.addEventListener('loadeddata',invalidate);
 const portraitReady=new T.TextureLoader().loadAsync(options.portrait).then(texture=>{if(disposed){texture.dispose();return;}texture.colorSpace=T.SRGBColorSpace;resources.push(texture);portraitMaterial.map=texture;portraitMaterial.needsUpdate=true;wrapMat.map=texture;wrapMat.needsUpdate=true;});
 const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info'),rendererName=ext?String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)):'unreported';
 const ready=portraitReady.then(()=>{if(!disposed){marks.assets=performance.now()-initStart;const t=performance.now();renderer.compile(scene,camera);marks.compile=performance.now()-t;}});
 function geometryBytes(){let bytes=0;const seen=new Set<T.BufferGeometry>();scene.traverse(o=>{if(o instanceof T.Mesh){const g=o.geometry as T.BufferGeometry;if(seen.has(g))return;seen.add(g);for(const a of Object.values(g.attributes))bytes+=a.array.byteLength;for(const list of Object.values(g.morphAttributes))for(const a of list??[])bytes+=a.array.byteLength;if(g.index)bytes+=g.index.array.byteLength;}});return bytes;}
 const cpuGeometryBytes=geometryBytes();
 function render(pose:FoldPose){
  if(disposed)return;const signature=[pose.progress,pose.entrance,pose.pointerX,pose.pointerY].map(n=>n.toFixed(4)).join(',');if(signature===lastSignature)return;lastSignature=signature;
  const p=clamp01(pose.progress),e=clamp01(pose.entrance),cam=cameraPose(p,e,width<760),pointer=1-smoothRange(.2,.5,p);
  camera.position.set(cam.position[0]+pose.pointerX*.14*pointer,cam.position[1]-pose.pointerY*.08*pointer,cam.position[2]);camera.lookAt(...cam.target as[number,number,number]);
  const first=smoothRange(.18,.58,p),second=smoothRange(.5,.85,p);
  for(const mesh of dynamic){mesh.morphTargetInfluences![0]=first*(1-second)*e;mesh.morphTargetInfluences![1]=second*e;mesh.morphTargetInfluences![2]=1-e;}
  room.position.x=3.9*(1-smoothRange(.18,.52,p));portraitGroup.position.y=(1-e)*-.25;portraitGroup.scale.setScalar(.97+e*.03);
  warm.position.x=5.5+pose.pointerX*.65;warm.position.y=1-pose.pointerY*.45;key.intensity=2.6+.6*e;canopyLight.intensity=35+35*smoothRange(.2,.8,p);
  filmPanel.visible=p>.3;filmMaterial.opacity=.48*smoothRange(.3,.65,p);filmBend.value=.2+.45*(1-smoothRange(.3,.9,p));
  if(film&&film.readyState>=2){const t=smoothRange(.35,1,p)*Math.max(0,(film.duration||4)-1/30);if(Math.abs(t-lastFilmTime)>1/30&&!film.seeking){film.currentTime=t;lastFilmTime=t;}}
  const shadowSignature=p.toFixed(4)+','+e.toFixed(4);if(shadowSignature!==lastShadowSignature){renderer.shadowMap.needsUpdate=true;lastShadowSignature=shadowSignature;}
  const before=performance.now();renderer.render(scene,camera);const submitMs=performance.now()-before;
  options.onFrame?.({progress:p.toFixed(4),entrance:e.toFixed(4),camera:camera.position.toArray().map(n=>n.toFixed(3)).join(','),target:cam.target.map(n=>n.toFixed(3)).join(','),fold:first.toFixed(4)+','+second.toFixed(4),renderer:rendererName,drawCalls:String(renderer.info.render.calls),triangles:String(renderer.info.render.triangles),geometries:String(renderer.info.memory.geometries),textures:String(renderer.info.memory.textures),filmTime:film?.currentTime.toFixed(3)||'0',filmReady:String(film?.readyState||0),cpuSubmitMs:submitMs.toFixed(2),initMarks:JSON.stringify(marks),geometryCpuBytes:String(cpuGeometryBytes),bufferSize:canvas.width+'x'+canvas.height,shadowMap:'512x512, single key',environmentMap:'authored cube128 PMREM',allocationNote:'VRAM not directly queried; separate diagnostics estimate targets, textures and buffers'});
 }
 return{scene,camera,renderer,ready,render,resize(w:number,h:number,dpr:number){width=w;height=h;lastSignature='';lastShadowSignature='';renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();},dispose(){disposed=true;film?.removeEventListener('seeked',invalidate);film?.removeEventListener('loadeddata',invalidate);film?.pause();if(film){film.removeAttribute('src');film.load();}key.shadow.map?.dispose();resources.forEach(r=>r.dispose());renderer.dispose();}};
}
