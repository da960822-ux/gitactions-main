import * as T from 'three';
import {cameraPose,clamp01,smoothRange,type FoldPose} from './pose';
import {foldPoint,shellGeometry} from './shellGeometry';
export type WorldOptions={width:number;height:number;pixelRatio:number;portrait:string;surfaceFilm?:string;onFrame?:(data:Record<string,string>)=>void};
export type LandingSceneModule={root:T.Group;anchor:T.Vector3;setSelected?:(id:string)=>void;setInputEnabled?:(enabled:boolean)=>void;dispose:()=>void};

export function createFoldedWorld(canvas:HTMLCanvasElement,options:WorldOptions){
 const initStart=performance.now(),resources:{dispose:()=>void}[]=[],marks:Record<string,number>={};
 const geo=<G extends T.BufferGeometry>(g:G)=>{resources.push(g);return g;};
 const mat=<M extends T.Material>(m:M)=>{resources.push(m);return m;};
 const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(options.pixelRatio);renderer.setSize(options.width,options.height,false);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.shadowMap.autoUpdate=false;
 const scene=new T.Scene();scene.background=new T.Color('#12181f');scene.fog=new T.FogExp2('#12181f',.008);
 const camera=new T.PerspectiveCamera(38,options.width/options.height,.1,100);
 marks.renderer=performance.now()-initStart;
 // Small authored softbox cubemap. No six scene captures or temporary full-resolution reflection renderer.
 const cubeFaces=Array.from({length:6},(_,i)=>{const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d')!;const g=ctx.createLinearGradient(0,0,128,128);g.addColorStop(0,i===2?'#b6c3d5':'#384557');g.addColorStop(1,'#111820');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);ctx.fillStyle='#f3f6f7';ctx.fillRect(i===0?34:9,8,i===2?108:27,110);ctx.fillStyle='#b8d9f3';ctx.fillRect(102,17,12,94);return c;});
 const cube=new T.CubeTexture(cubeFaces);cube.colorSpace=T.SRGBColorSpace;cube.needsUpdate=true;
 const pmrem=new T.PMREMGenerator(renderer),environment=pmrem.fromCubemap(cube);scene.environment=environment.texture;scene.environmentIntensity=.65;resources.push(environment);cube.dispose();pmrem.dispose();
 marks.environment=performance.now()-initStart-marks.renderer;
 const grainCanvas=document.createElement('canvas');grainCanvas.width=grainCanvas.height=128;const gc=grainCanvas.getContext('2d')!,image=gc.createImageData(128,128);
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4,n=Math.sin(x*1.73+y*.13)+Math.sin(x*2.61-y*.07)*.5;image.data[i]=128+n*5;image.data[i+1]=128+Math.sin(y*2.17+x*.3)*2;image.data[i+2]=255;image.data[i+3]=255;}gc.putImageData(image,0,0);
 const grain=new T.CanvasTexture(grainCanvas);grain.wrapS=grain.wrapT=T.RepeatWrapping;grain.repeat.set(18,8);resources.push(grain);
 const metal=mat(new T.MeshStandardMaterial({color:'#d5b7a8',metalness:1,roughness:.19,normalMap:grain,normalScale:new T.Vector2(.08,.08),envMapIntensity:1.65}));
 const sculpturalMetal=mat(new T.MeshStandardMaterial({color:'#d8c4b9',metalness:.95,roughness:.3,normalMap:grain,normalScale:new T.Vector2(.04,.04),envMapIntensity:1.15}));
 const satin=mat(new T.MeshStandardMaterial({color:'#3c152a',metalness:.3,roughness:.32,envMapIntensity:.8}));
 const paper=mat(new T.MeshStandardMaterial({color:'#dce0dc',metalness:.02,roughness:.62,envMapIntensity:.65}));
 const floor=mat(new T.MeshStandardMaterial({color:'#0a141e',metalness:.1,roughness:.51,envMapIntensity:1.0}));
 const ink=mat(new T.MeshStandardMaterial({color:'#0e1720',metalness:.12,roughness:.65}));
 const key=new T.DirectionalLight('#f4f0e7',3.0);key.position.set(-4,7,8);key.castShadow=true;key.shadow.mapSize.set(512,512);key.shadow.camera.left=-8;key.shadow.camera.right=10;key.shadow.camera.top=9;key.shadow.camera.bottom=-5;key.shadow.camera.far=55;key.shadow.bias=-.0006;key.shadow.normalBias=.025;key.target.position.set(2,-1,-2);scene.add(key,key.target);
 const fill=new T.HemisphereLight('#c4d8ec','#13131a',.45);scene.add(fill);
 const warm=new T.PointLight('#efbca6',45,22,2);warm.position.set(5,1,3);scene.add(warm);
 const apertureLight=new T.PointLight('#d8edff',240,32,2);apertureLight.position.set(4,2,-27);scene.add(apertureLight);
 let film:HTMLVideoElement|undefined,filmTexture:T.VideoTexture|undefined;
 // The movie is a material region of the real morphing skin, so its geometry and normals cannot diverge.
 const filmMaterial=mat(new T.MeshStandardMaterial({color:'#dce0dc',metalness:.02,roughness:.62}));
 if(options.surfaceFilm){film=document.createElement('video');film.src=options.surfaceFilm;film.muted=true;film.playsInline=true;film.preload='auto';filmTexture=new T.VideoTexture(film);filmTexture.colorSpace=T.SRGBColorSpace;filmTexture.repeat.set(1/.23,1/.23);filmTexture.offset.set(-.45/.23,-.55/.23);resources.push(filmTexture);filmMaterial.emissiveMap=filmTexture;filmMaterial.emissive.set('#ffffff');filmMaterial.emissiveIntensity=.17;}
 const folds=new T.Group();folds.name='CONTINUOUS_ATRIUM_SHELL';scene.add(folds);
 const dynamic:T.Mesh[]=[];
 for(let k=0;k<3;k++){
  const g=geo(shellGeometry((u,v,t)=>foldPoint(k,u,v,t),{nx:k===0?72:k===1?32:24,ny:k===0?28:k===1?16:48,thickness:k===0?.16:k===1?.09:.08,morph:true,frontMaterial:k===0?(u,v)=>u<.22?3:options.surfaceFilm&&u>.45&&u<.68&&v>.55&&v<.78?4:0:undefined}));
  const mesh=new T.Mesh(g,k===0?[paper,satin,metal,floor,filmMaterial]:k===1?[floor,ink,floor]:[sculpturalMetal,satin,metal]);mesh.name=k===0?'FOLD_A_FLOOR_WALL_VAULT':k===1?'FOLD_B_LOCAL_PORTRAIT_THRESHOLD':'FOLD_C_DUET_CREASE';mesh.frustumCulled=false;mesh.castShadow=k!==1;mesh.receiveShadow=true;folds.add(mesh);dynamic.push(mesh);
 }
 const room=new T.Group();room.name='NEXT_ROOM_BOUNDARY';scene.add(room);
 const roomFloor=new T.Mesh(geo(new T.PlaneGeometry(40,45)),floor);roomFloor.rotation.x=-Math.PI/2;roomFloor.position.set(0,-3.55,-16);roomFloor.receiveShadow=true;roomFloor.name='CONTINUOUS_GRAPHITE_FLOOR';room.add(roomFloor);
 // A single carved lightwell terminates the vault. Its deep, open reveal replaces decorative boxes and ribs.
 const wallShape=new T.Shape();wallShape.moveTo(-60,-3.55);wallShape.lineTo(60,-3.55);wallShape.lineTo(60,50);wallShape.lineTo(-60,50);wallShape.closePath();
 const opening=new T.Path();opening.moveTo(-2.4,-3.2);opening.bezierCurveTo(-3.6,0,-2.8,5.0,.1,5.9);opening.bezierCurveTo(3,5.8,4.2,1.5,2.4,-3.2);opening.lineTo(-2.4,-3.2);wallShape.holes.push(opening);
 const wallGeometry=geo(new T.ExtrudeGeometry(wallShape,{depth:1.2,steps:1,curveSegments:48,bevelEnabled:true,bevelSegments:3,bevelSize:.08,bevelThickness:.08}));
 const wall=new T.Mesh(wallGeometry,[ink,paper]);wall.name='CARVED_DAYLIGHT_APERTURE';wall.position.set(4,0,-31.5);wall.receiveShadow=true;room.add(wall);
 const skyCanvas=document.createElement('canvas');skyCanvas.width=4;skyCanvas.height=128;const skyContext=skyCanvas.getContext('2d')!,skyGradient=skyContext.createLinearGradient(0,0,0,128);skyGradient.addColorStop(0,'#f5f8ff');skyGradient.addColorStop(.5,'#d5edff');skyGradient.addColorStop(1,'#709db8');skyContext.fillStyle=skyGradient;skyContext.fillRect(0,0,4,128);const skyTexture=new T.CanvasTexture(skyCanvas);skyTexture.colorSpace=T.SRGBColorSpace;resources.push(skyTexture);
 const sky=new T.Mesh(geo(new T.PlaneGeometry(25,25)),mat(new T.MeshBasicMaterial({map:skyTexture,color:'#ffffff',toneMapped:false})));sky.name='DISTANT_DAYLIGHT_BEYOND_OPENING';sky.position.set(0,4,-42);room.add(sky);
 // The reveal is an actual tunnel with a tapering curved interior, not a coloured luminous rectangle.
 const revealSurface=(u:number,v:number)=>{const a=opening.getPoint(T.MathUtils.clamp(u,0,1));return new T.Vector3(a.x*(1+.08*v),-3.2+(a.y+3.2)*(1+.04*v),-31.55-v*9);};
 const reveal=new T.Mesh(geo(shellGeometry(revealSurface,{nx:64,ny:16,thickness:.1,wrapU:true})),[paper,paper,metal]);reveal.position.x=4;reveal.name='SCULPTED_LIGHTWELL_REVEAL';room.add(reveal);
 const portraitGroup=new T.Group();portraitGroup.name='PORTRAIT_STAGE';scene.add(portraitGroup);
 const portraitMaterial=mat(new T.MeshBasicMaterial({transparent:true,alphaTest:.025,toneMapped:false}));
 const portrait=new T.Mesh(geo(new T.PlaneGeometry(5.9,5.9)),portraitMaterial);portrait.position.set(1.85,.03,.05);portrait.name='PORTRAIT_01_UNCHANGED_RGBA';portrait.castShadow=true;portraitGroup.add(portrait);
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=256;shadowCanvas.height=128;const sc=shadowCanvas.getContext('2d')!,gradient=sc.createRadialGradient(128,64,2,128,64,115);gradient.addColorStop(0,'rgba(0,0,0,.7)');gradient.addColorStop(1,'rgba(0,0,0,0)');sc.fillStyle=gradient;sc.fillRect(0,0,256,128);const shadowTex=new T.CanvasTexture(shadowCanvas);resources.push(shadowTex);
 const shadow=new T.Mesh(geo(new T.PlaneGeometry(5.6,2.3)),mat(new T.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false})));shadow.rotation.x=-Math.PI/2;shadow.position.set(1.85,-3.08,.1);portraitGroup.add(shadow);
 const creaseContact=new T.Mesh(geo(new T.PlaneGeometry(3.5,2.0)),mat(new T.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false,opacity:.55})));creaseContact.rotation.x=-Math.PI/2;creaseContact.name='DUET_CREASE_FLOOR_CONTACT';scene.add(creaseContact);
 const wrapMat=mat(new T.MeshBasicMaterial({transparent:true,opacity:.13,color:'#e2af9b',depthWrite:false}));const wrap=new T.Mesh(geo(new T.PlaneGeometry(5.92,5.92)),wrapMat);wrap.position.copy(portrait.position).add(new T.Vector3(.018,.012,-.025));portraitGroup.add(wrap);
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
  portraitGroup.position.y=(1-e)*-.25;portraitGroup.scale.setScalar(.97+e*.03);
  const creaseUnfold=(first*(1-second)*.8+second)*e;creaseContact.position.set(T.MathUtils.lerp(3.2,3.8+.8*Math.sin(-.7),creaseUnfold),-3.215,T.MathUtils.lerp(-4,-22,creaseUnfold));
  warm.position.x=5+pose.pointerX*.65;warm.position.y=1-pose.pointerY*.45;key.intensity=1.8+.35*e;
  if(film&&film.readyState>=2){const t=smoothRange(.35,1,p)*Math.max(0,(film.duration||4)-1/30);if(Math.abs(t-lastFilmTime)>1/30&&!film.seeking){film.currentTime=t;lastFilmTime=t;}}
  const shadowSignature=p.toFixed(4)+','+e.toFixed(4);if(shadowSignature!==lastShadowSignature){renderer.shadowMap.needsUpdate=true;lastShadowSignature=shadowSignature;}
  const before=performance.now();renderer.render(scene,camera);const submitMs=performance.now()-before;
  options.onFrame?.({progress:p.toFixed(4),entrance:e.toFixed(4),camera:camera.position.toArray().map(n=>n.toFixed(3)).join(','),target:cam.target.map(n=>n.toFixed(3)).join(','),fold:first.toFixed(4)+','+second.toFixed(4),renderer:rendererName,drawCalls:String(renderer.info.render.calls),triangles:String(renderer.info.render.triangles),geometries:String(renderer.info.memory.geometries),textures:String(renderer.info.memory.textures),filmTime:film?.currentTime.toFixed(3)||'0',filmReady:String(film?.readyState||0),cpuSubmitMs:submitMs.toFixed(2),initMarks:JSON.stringify(marks),geometryCpuBytes:String(cpuGeometryBytes),bufferSize:canvas.width+'x'+canvas.height,shadowMap:'512x512, single key',environmentMap:'authored cube128 PMREM',allocationNote:'VRAM not directly queried; separate diagnostics estimate targets, textures and buffers'});
 }
 return{scene,camera,renderer,ready,render,resize(w:number,h:number,dpr:number){width=w;height=h;lastSignature='';lastShadowSignature='';renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();},dispose(){disposed=true;film?.removeEventListener('seeked',invalidate);film?.removeEventListener('loadeddata',invalidate);film?.pause();if(film){film.removeAttribute('src');film.load();}key.shadow.map?.dispose();resources.forEach(r=>r.dispose());renderer.dispose();}};
}
