import * as T from 'three';
import { cameraPose, clamp01, smoothRange, type FoldPose } from './pose';

export type WorldOptions = { width: number; height: number; pixelRatio: number; portrait: string; surfaceFilm?: string; onFrame?: (data: Record<string,string>)=>void };
export type LandingSceneModule = { root: T.Group; anchor: T.Vector3; setSelected?: (id:string)=>void; setInputEnabled?: (enabled:boolean)=>void; dispose:()=>void };

// The host owns the only renderer, camera and fold surfaces. Later scene modules supply groups, never render loops.
export function createFoldedWorld(canvas: HTMLCanvasElement, options: WorldOptions) {
  const renderer = new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(options.pixelRatio);renderer.setSize(options.width,options.height,false);
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  const scene=new T.Scene();scene.background=new T.Color('#100e14');scene.fog=new T.FogExp2('#100e14',.018);
  const camera=new T.PerspectiveCamera(38,options.width/options.height,.1,90);
  const resources:{dispose:()=>void}[]=[];
  const geo=<G extends T.BufferGeometry>(g:G)=>{resources.push(g);return g;};
  const mat=<M extends T.Material>(m:M)=>{resources.push(m);return m;};
  const studio=new T.Scene();studio.background=new T.Color('#09070f');
  for(const [x,y,z,w,h,c,power]of [[-5,4,5,2,8,'#f6dfcb',3],[6,1,2,1.4,7,'#dba8a9',2.5],[0,7,-4,8,1,'#e3d5f1',3],[0,-4,4,6,1,'#9d6c73',.8]] as const){
    const panel=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color(c).multiplyScalar(power),side:T.DoubleSide}));panel.position.set(x,y,z);panel.lookAt(0,0,0);studio.add(panel);
  }
  const pmrem=new T.PMREMGenerator(renderer);const env=pmrem.fromScene(studio,.045);scene.environment=env.texture;resources.push(env);studio.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();o.material.dispose();}});pmrem.dispose();
  scene.environmentIntensity=.8;
  scene.add(new T.HemisphereLight('#f1dfd5','#27122d',.42));
  const key=new T.DirectionalLight('#fff0dc',2.3);key.position.set(-3,6,8);scene.add(key);
  const rim=new T.DirectionalLight('#9caad7',2);rim.position.set(5,3,-6);scene.add(rim);
  const warm=new T.PointLight('#c66b85',55,24,2);warm.position.set(6,1.2,2);scene.add(warm);
  const soft=new T.PointLight('#e6b79a',15,18,2);soft.position.set(-3,-.3,4);scene.add(soft);
  // Analytic softbox reflections keep the same camera/normal-dependent metal on hardware and software renderers.
  // No per-frame cubemap or multi-pass refraction is needed for the deliberately abstract studio.
  function studioMetal(color:string,roughness:number){return mat(new T.ShaderMaterial({side:T.DoubleSide,uniforms:{uColor:{value:new T.Color(color)},uRoughness:{value:roughness},uPointer:{value:soft.position}},
   vertexShader:`varying vec3 vWorld;varying vec3 vN;
   #include <morphtarget_pars_vertex>
   void main(){
    #include <morphinstance_vertex>
    #include <beginnormal_vertex>
    #include <morphnormal_vertex>
    #include <begin_vertex>
    #include <morphtarget_vertex>
    vec4 world=modelMatrix*vec4(transformed,1.);vWorld=world.xyz;vN=normalize(mat3(modelMatrix)*objectNormal);gl_Position=projectionMatrix*viewMatrix*world;
   }`,
   fragmentShader:`uniform vec3 uColor;uniform float uRoughness;uniform vec3 uPointer;varying vec3 vWorld;varying vec3 vN;
   void main(){vec3 N=normalize(vN);if(!gl_FrontFacing)N=-N;vec3 V=normalize(cameraPosition-vWorld);vec3 R=reflect(-V,N);
    float fresnel=pow(1.-abs(dot(N,V)),4.);float spread=3.5-uRoughness*3.;
    float left=exp(-pow((R.x+.43)*spread,2.))*pow(max(R.z,0.),2.);
    float upper=exp(-pow((R.y-.7)*12.,2.))*.72;
    float right=exp(-pow((R.x-.67)*7.,2.))*max(R.z*.5+.5,0.);
    vec3 L=normalize(uPointer-vWorld);float pointer=pow(max(dot(reflect(-L,N),V),0.),24.);
    float bounce=.42+.24*max(dot(N,normalize(vec3(-.4,.7,.6))),0.);
    vec3 tint=uColor*(bounce+left*.32+right*.24);
    vec3 light=vec3(.88,.65,.49)*left*.72+vec3(.56,.61,.8)*upper*.64+vec3(.62,.24,.35)*right*.5;
    float pool=exp(-dot(vWorld.xz-vec2(1.8,0.),vWorld.xz-vec2(1.8,0.))*.045)*pow(abs(N.y),6.);
    vec3 col=tint+light*(.4+fresnel*.6)+vec3(.82,.51,.39)*pointer*.12+vec3(.065,.031,.038)*pool;
    gl_FragColor=vec4(col,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`
  }));}
  const gold=studioMetal('#d1a48b',.18);
  const burgundy=studioMetal('#733549',.3);
  const graphite=studioMetal('#211823',.46);
  // Equal topology and UVs across the stage, opening and inner-room targets. The same edges travel with the sheet.
  function point(which:number,u:number,v:number,target:number):T.Vector3 {
    if(target===3){
      const p=point(which,u,v,0),hinge=new T.Vector3(which===0?0:-2,-2.95,-1.8);
      return p.sub(hinge).applyAxisAngle(new T.Vector3(1,0,0),which===0?1.05:-.18).add(hinge);
    }
    if(target===0){
      if(which===0)return new T.Vector3(3.6+(u-.5)*(7.6-3.1*Math.sin(v*Math.PI))+Math.sin(v*Math.PI)*.65,-2.95+v*7+Math.sin(u*Math.PI)*v*.5,-3.6+Math.sin(v*Math.PI)*1.6+Math.sin(u*Math.PI)*.8+(u-.5)*v*1.8);
      return new T.Vector3(-1.6+u*10,-3.08+Math.sin(u*Math.PI)*.09+Math.pow(Math.abs(u-.5)*2,4)*Math.pow(v,2)*.8,3-v*8.5);
    }
    if(target===1){
      if(which===0)return new T.Vector3(4.8+Math.sin(v*Math.PI)*.8,-3+u*8,1-v*15);
      return new T.Vector3(-7+u*14,-3+Math.sin(v*Math.PI)*.22,3-v*19);
    }
    if(which===0)return new T.Vector3(-4.6-Math.sin(v*Math.PI)*.35,-3+u*8,-3-v*15);
    return new T.Vector3(-5.1+u*10.2,-3+Math.sin(u*Math.PI)*.13,-3-v*15);
  }
  function sheet(which:number,u0=0,u1=1,v0=0,v1=1,isEdge=false){
    const nx=isEdge?48:64,ny=isEdge?2:32,indices:number[]=[],uv:number[]=[];
    const shapes:T.Float32BufferAttribute[]=[],normals:T.Float32BufferAttribute[]=[];
    for(let target=0;target<4;target++){
      const pos:number[]=[],normal:number[]=[];
      for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
        const u=u0+(u1-u0)*i/nx,v=v0+(v1-v0)*j/ny,p=point(which,u,v,target);
        const du=point(which,u+.001,v,target).sub(p),dv=point(which,u,v+.001,target).sub(p),n=du.cross(dv).normalize();
        if(isEdge)p.addScaledVector(n,.014);
        pos.push(p.x,p.y,p.z);normal.push(n.x,n.y,n.z);
        if(target===0)uv.push(u,v);
      }
      shapes.push(new T.Float32BufferAttribute(pos,3));normals.push(new T.Float32BufferAttribute(normal,3));
    }
    for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const n=j*(nx+1)+i;indices.push(n,n+1,n+nx+1,n+1,n+nx+2,n+nx+1);}
    const g=geo(new T.BufferGeometry());g.setAttribute('position',shapes[0]);g.setAttribute('normal',normals[0]);g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.morphAttributes.position=shapes.slice(1);g.morphAttributes.normal=normals.slice(1);g.computeBoundingSphere();
    const m=new T.Mesh(g,isEdge?gold:which===0?burgundy:graphite);m.frustumCulled=false;return m;
  }
  const folds=new T.Group();folds.name='SHARED_FOLD_SYSTEM';scene.add(folds);
  const surfaces:T.Mesh[]=[];
  for(let k=0;k<2;k++){
    const body=sheet(k);body.name=k===0?'FOLD_A':'FOLD_B';folds.add(body);surfaces.push(body);
    for(const [u0,u1,v0,v1]of [[0,1,0,.012],[0,1,.988,1],[0,.008,0,1],[.992,1,0,1]]){const e=sheet(k,u0,u1,v0,v1,true);folds.add(e);surfaces.push(e);}
  }
  // Actual next room already exists behind the opening, rather than a scaled hero surface.
  const room=new T.Group();room.name='NEXT_ROOM_BOUNDARY';scene.add(room);
  const wallMaterial=mat(new T.MeshLambertMaterial({color:'#1a111e',emissive:'#100d14',emissiveIntensity:.65,side:T.DoubleSide}));
  const wall=new T.Mesh(geo(new T.PlaneGeometry(10,8)),wallMaterial);wall.position.set(0,1,-16);room.add(wall);
  const rightWall=new T.Mesh(geo(new T.PlaneGeometry(13,8)),wallMaterial);rightWall.rotation.y=-Math.PI/2;rightWall.position.set(5,1,-11.5);room.add(rightWall);
  const ceiling=new T.Mesh(geo(new T.PlaneGeometry(10,13)),graphite);ceiling.rotation.x=Math.PI/2;ceiling.position.set(0,5,-11.5);room.add(ceiling);
  for(let i=0;i<5;i++){
    const seam=new T.Mesh(geo(new T.BoxGeometry(.024,6.6,.018)),gold);seam.position.set(-4.8+i*2.4,.3,-15.96);room.add(seam);
    const light=new T.Mesh(geo(new T.PlaneGeometry(.035,5)),mat(new T.MeshBasicMaterial({color:i%2?'#bb697a':'#e0b299'})));light.position.set(-4.8+i*2.4,1,-15.9);room.add(light);
  }
  const roomLight=new T.PointLight('#e5a7b6',23,14,2);roomLight.position.set(0,2,-10);scene.add(roomLight);
  const portraitGroup=new T.Group();portraitGroup.name='PORTRAIT_STAGE';scene.add(portraitGroup);
  const stageLip=new T.Mesh(geo(new T.CylinderGeometry(3.35,3.35,.09,96)),[gold,graphite,graphite]);stageLip.position.set(1.85,-2.92,.08);stageLip.scale.z=.48;stageLip.name='PORTRAIT_STAGE_LIP';portraitGroup.add(stageLip);
  const portraitMaterial=mat(new T.MeshBasicMaterial({transparent:true,alphaTest:.025,side:T.DoubleSide,depthWrite:true,toneMapped:false}));
  const portrait=new T.Mesh(geo(new T.PlaneGeometry(5.9,5.9)),portraitMaterial);portrait.position.set(1.85,.03,.05);portrait.name='PORTRAIT_01';portraitGroup.add(portrait);
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=256;shadowCanvas.height=128;const ctx=shadowCanvas.getContext('2d')!;const gradient=ctx.createRadialGradient(128,64,3,128,64,115);gradient.addColorStop(0,'rgba(0,0,0,.86)');gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,256,128);
  const shadowTex=new T.CanvasTexture(shadowCanvas);resources.push(shadowTex);
  const shadow=new T.Mesh(geo(new T.PlaneGeometry(6.2,2.5)),mat(new T.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false})));shadow.rotation.x=-Math.PI/2;shadow.position.set(1.85,-2.87,.1);portraitGroup.add(shadow);
  const reflectMat=mat(new T.MeshBasicMaterial({transparent:true,opacity:.075,depthWrite:false,toneMapped:false,color:'#ad7b88'}));
  const reflection=new T.Mesh(geo(new T.PlaneGeometry(5.9,5.9)),reflectMat);reflection.position.set(1.85,-5.84,-.06);reflection.scale.y=-1;portraitGroup.add(reflection);
  // A barely-lit silhouette behind the original supplies edge light without regenerating face pixels.
  const wrapMat=mat(new T.MeshBasicMaterial({transparent:true,opacity:.2,color:'#e2af9b',depthWrite:false}));const wrap=new T.Mesh(geo(new T.PlaneGeometry(5.92,5.92)),wrapMat);wrap.position.copy(portrait.position).add(new T.Vector3(.018,.012,-.022));portraitGroup.add(wrap);
  let film:HTMLVideoElement|undefined,filmTexture:T.VideoTexture|undefined;
  const filmMaterial=mat(new T.MeshStandardMaterial({color:'#733348',roughness:.3,metalness:.55,emissive:'#421e2e',emissiveIntensity:.35,side:T.DoubleSide,transparent:true}));
  const filmPanel=new T.Mesh(geo(new T.PlaneGeometry(4.8,3.8,48,32)),filmMaterial);filmPanel.name='SURFACE_FILM_01';filmPanel.position.set(0,.2,-15.85);room.add(filmPanel);
  const filmBend={value:1};
  filmMaterial.onBeforeCompile=shader=>{
    shader.uniforms.uFoldBend=filmBend;
    shader.vertexShader='uniform float uFoldBend;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nobjectNormal=normalize(vec3(-cos(uv.x*3.14159265)*cos(uv.y*3.14159265)*uFoldBend*3.14159265/4.8,sin(uv.x*3.14159265)*sin(uv.y*3.14159265)*uFoldBend*3.14159265/3.8,1.));');
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.z += sin(uv.x * 3.14159265) * cos(uv.y * 3.14159265) * uFoldBend;');
  };
  if(options.surfaceFilm){film=document.createElement('video');film.src=options.surfaceFilm;film.muted=true;film.playsInline=true;film.preload='auto';filmTexture=new T.VideoTexture(film);filmTexture.colorSpace=T.SRGBColorSpace;resources.push(filmTexture);filmMaterial.map=filmTexture;filmMaterial.emissiveMap=filmTexture;}
  let width=options.width,height=options.height,disposed=false,lastFilmTime=-1,lastSignature='';
  const invalidate=()=>{lastSignature='';};film?.addEventListener('seeked',invalidate);film?.addEventListener('loadeddata',invalidate);
  const portraitReady=new T.TextureLoader().loadAsync(options.portrait).then(texture=>{if(disposed){texture.dispose();return;}texture.colorSpace=T.SRGBColorSpace;resources.push(texture);portraitMaterial.map=texture;portraitMaterial.needsUpdate=true;reflectMat.map=texture;reflectMat.needsUpdate=true;wrapMat.alphaMap=texture;wrapMat.map=texture;wrapMat.needsUpdate=true;});
  const gl=renderer.getContext();const ext=gl.getExtension('WEBGL_debug_renderer_info');const rendererName=ext?String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)):'unreported';
  const ready=portraitReady.then(()=>{if(!disposed){renderer.compile(scene,camera);}});
  function render(pose:FoldPose){
    if(disposed)return;
    const signature=[pose.progress,pose.entrance,pose.pointerX,pose.pointerY].map(n=>n.toFixed(4)).join(',');
    if(signature===lastSignature)return;lastSignature=signature;
    const p=clamp01(pose.progress),e=clamp01(pose.entrance),mobile=width<760,cam=cameraPose(p,e,mobile);const pointer=1-smoothRange(.2,.6,p);
    camera.position.set(cam.position[0]+pose.pointerX*.14*pointer,cam.position[1]-pose.pointerY*.08*pointer,cam.position[2]);camera.lookAt(...cam.target as [number,number,number]);
    const first=smoothRange(.16,.52,p),second=smoothRange(.47,.82,p);
    for(const m of surfaces){m.morphTargetInfluences![0]=first*(1-second)*e;m.morphTargetInfluences![1]=second*e;m.morphTargetInfluences![2]=1-e;}
    portraitGroup.position.y=(1-e)*-.7;portraitGroup.scale.setScalar(.94+e*.06);
    key.intensity=1.6+e*.7;warm.position.x=6+pose.pointerX*.65;warm.position.y=1.2-pose.pointerY*.5;soft.position.x=-3+pose.pointerX*.8;
    roomLight.intensity=2+21*smoothRange(.35,.85,p);
    filmPanel.scale.setScalar(.25+.75*smoothRange(.4,.83,p));filmPanel.rotation.y=(1-smoothRange(.4,.85,p))*.75;
    filmPanel.visible=p>.3;filmMaterial.opacity=smoothRange(.3,.42,p);
    filmBend.value=(1-smoothRange(.4,.93,p))*.9;
    if(film&&film.readyState>=2){const target=smoothRange(.43,1,p)*Math.max(0,(film.duration||4)-1/30);if(Math.abs(target-lastFilmTime)>1/30&&!film.seeking){film.currentTime=target;lastFilmTime=target;}}
    renderer.render(scene,camera);
    options.onFrame?.({progress:p.toFixed(4),entrance:e.toFixed(4),camera:camera.position.toArray().map(n=>n.toFixed(3)).join(','),target:cam.target.map(n=>n.toFixed(3)).join(','),fold:first.toFixed(4)+','+second.toFixed(4),renderer:rendererName,drawCalls:String(renderer.info.render.calls),triangles:String(renderer.info.render.triangles),geometries:String(renderer.info.memory.geometries),textures:String(renderer.info.memory.textures),filmTime:film?.currentTime.toFixed(3)||'0',filmReady:String(film?.readyState||0)});
  }
  return {scene,camera,renderer,ready,render,resize(w:number,h:number,dpr:number){width=w;height=h;lastSignature='';renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();},dispose(){disposed=true;film?.removeEventListener('seeked',invalidate);film?.removeEventListener('loadeddata',invalidate);film?.pause();if(film){film.removeAttribute('src');film.load();}resources.forEach(r=>r.dispose());renderer.dispose();}};
}
