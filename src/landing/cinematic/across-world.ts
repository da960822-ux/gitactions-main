import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export type WorldPose = { progress: number; entrance: number };

// One pose owns the camera and world. ScrollTrigger writes progress; pointer input only offsets the rig.
export function createAcrossWorld(canvas: HTMLCanvasElement, portraitSrc: string, pose: WorldPose, _reduced: boolean, onReady: () => void) {
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  const gl=renderer.getContext();
  const debug=gl.getExtension('WEBGL_debug_renderer_info');
  const software=debug&&/swiftshader|llvmpipe|software/i.test(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL));
  renderer.setPixelRatio(software ? .65 : Math.min(window.devicePixelRatio,window.innerWidth<800?1.25:1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#091b20', 0.035);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 70);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();
  const root = new THREE.Group();
  scene.add(root);
  const resources: { dispose: () => void }[] = [environment];
  const geometry = <T extends THREE.BufferGeometry>(g: T) => { resources.push(g); return g; };
  const material = <T extends THREE.Material>(m: T) => { resources.push(m); return m; };

  scene.add(new THREE.HemisphereLight('#d3ffff', '#22211d', 0.65));
  const cyan = new THREE.PointLight('#80f0ff', 18, 20, 2);
  cyan.position.set(-4, 3, 4); scene.add(cyan);
  const peach = new THREE.PointLight('#ffba88', 24, 20, 2);
  peach.position.set(5, 1.5, 3); scene.add(peach);
  const top = new THREE.DirectionalLight('#fff6dd', 1.4);
  top.position.set(0, 6, 5); scene.add(top);
  const pointerLight = new THREE.PointLight('#e0ffff', 8, 15);
  pointerLight.position.set(1, 1, 5); scene.add(pointerLight);

  // Software WebGL uses the same geometry with a smaller, light-responsive reflection shader.
  // The hardware path retains full physical iridescence; both paths respond to camera, normals and pointer light.
  function reflectedMaterial(color:string,warm:boolean){
    if(!software)return material(new THREE.MeshPhysicalMaterial({color,metalness:.8,roughness:.2,clearcoat:1,iridescence:1,iridescenceIOR:1.45,iridescenceThicknessRange:[150,550],side:THREE.DoubleSide}));
    return material(new THREE.ShaderMaterial({side:THREE.DoubleSide,uniforms:{uTint:{value:new THREE.Color(color)},uLight:{value:pointerLight.position},uWarm:{value:warm?1:0}},
      vertexShader:`varying vec3 vNormal; varying vec3 vWorld;
        #include <morphtarget_pars_vertex>
        void main(){
          #include <morphinstance_vertex>
          #include <begin_vertex>
          #include <morphtarget_vertex>
          vec4 world=modelMatrix*vec4(transformed,1.);vWorld=world.xyz;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*world;}`,
      fragmentShader:`uniform vec3 uTint;uniform vec3 uLight;uniform float uWarm;varying vec3 vNormal;varying vec3 vWorld;
        void main(){vec3 N=normalize(vNormal);if(!gl_FrontFacing)N=-N;vec3 V=normalize(cameraPosition-vWorld);vec3 R=reflect(-V,N);vec3 L=normalize(uLight-vWorld);float ndv=abs(dot(N,V));float fresnel=pow(1.-ndv,3.);float strip=pow(max(0.,1.-abs(R.y-.35)*2.2),14.);float key=pow(max(dot(reflect(-L,N),V),0.),32.);float fill=.22+max(dot(N,normalize(vec3(-.4,.8,1.))),0.)*.28;vec3 cold=vec3(.42,.72,.64);vec3 warm=vec3(.82,.57,.35);vec3 tint=mix(cold,warm,uWarm);vec3 col=uTint*fill+tint*(.14+fresnel*.34)+vec3(.74,.88,.72)*strip*.9+vec3(.8,.9,.8)*key*.42;col+=vec3(.22,.08,.3)*pow(max(R.x,0.),4.)*.28;gl_FragColor=vec4(col,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`
    }));
  }
  const glass=reflectedMaterial('#486f70',false);
  const warmGlass=reflectedMaterial('#a7805f',true);
  const silver = software ? reflectedMaterial('#233e37',false) : material(new THREE.MeshPhysicalMaterial({ color:'#183b37', metalness:0.82, roughness:0.28, clearcoat:1 }));

  const stage = new THREE.Mesh(geometry(new THREE.CylinderGeometry(2.95, 3.05, 0.12, 96)), silver);
  stage.position.set(1.6, -2.72, 0); root.add(stage);
  const stageInner = new THREE.Mesh(geometry(new THREE.CylinderGeometry(2.88,2.88,0.02,96)), material(software ? new THREE.MeshBasicMaterial({color:'#233c3c'}) : new THREE.MeshStandardMaterial({color:'#233c3c',metalness:0.55,roughness:0.25})));
  stageInner.position.set(1.6,-2.59,0);root.add(stageInner);

  const portal = new THREE.Group(); portal.position.set(1.6, 0.05, -0.9); root.add(portal);
  const frame = new THREE.Mesh(geometry(new RoundedBoxGeometry(4.8, 5.4, 0.28, 5, 0.4)), glass);
  portal.add(frame);
  const uniforms = { uTime:{value:0}, uProgress:{value:0}, uFilm:{value:null as THREE.Texture | null}, uFilmReady:{value:0} };
  const surfaceMaterial = material(new THREE.ShaderMaterial({
    uniforms, side:THREE.DoubleSide,
    vertexShader:`varying vec2 vUv; uniform float uTime; uniform float uProgress;
      void main(){vUv=uv; vec3 p=position; p.z+=sin(p.x*1.5+uTime*.25)*cos(p.y*.8+uTime*.18)*(.08+uProgress*.3); gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader:`varying vec2 vUv; uniform float uTime; uniform float uProgress; uniform sampler2D uFilm; uniform float uFilmReady;
      void main(){vec2 p=vUv-.5; float wave=sin(p.x*4.+p.y*3.+sin(p.y*5.+uTime*.2)*.7+uTime*.1); vec3 a=vec3(.025,.13,.16);vec3 b=vec3(.30,.57,.51);vec3 c=vec3(.73,.39,.22);vec3 col=mix(a,b,smoothstep(-.7,.8,wave));col=mix(col,c,smoothstep(.18,.7,p.x+sin(p.y*2.+uTime*.16)*.25));float light=exp(-length(p-vec2(.05,.25))*2.9);col+=vec3(.12,.18,.14)*light;vec3 film=texture2D(uFilm,vUv).rgb;col=mix(col,film,.42*uFilmReady);col*=(.6+light*.7)*(1.-uProgress*.45);gl_FragColor=vec4(col,1.);}`
  }));
  const surface = new THREE.Mesh(geometry(new THREE.PlaneGeometry(4.45,5.05,48,48)),surfaceMaterial);
  surface.position.z=.16;portal.add(surface);

  // A continuous ribbon changes from a folded arch into the walls of the next space.
  function ribbon(points: THREE.Vector3[], width: number, m: THREE.Material) {
    const curve = new THREE.CatmullRomCurve3(points);
    const positions:number[]=[];const indices:number[]=[];const morph:number[]=[];
    const columns=12;
    for(let i=0;i<=180;i++){
      const t=i/180;const p=curve.getPoint(t);const tangent=curve.getTangent(t);
      const side=new THREE.Vector3(-tangent.y,tangent.x,Math.sin(t*Math.PI*2)*.7).normalize();
      side.applyAxisAngle(tangent,Math.sin(t*Math.PI)*.65);
      const normal=new THREE.Vector3().crossVectors(tangent,side).normalize();
      for(let j=0;j<=columns;j++){
        const cross=j/columns*2-1;
        const v=p.clone().addScaledVector(side,width*cross*.5).addScaledVector(normal,(1-cross*cross)*width*.18);
        positions.push(v.x,v.y,v.z);
        morph.push(v.x*1.5,v.y*1.15,-7+t*14+cross*.12);
        if(i<180&&j<columns){const n=i*(columns+1)+j;indices.push(n,n+1,n+columns+1,n+1,n+columns+2,n+columns+1);}
      }
    }
    const g=geometry(new THREE.BufferGeometry());g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
    g.morphAttributes.position=[new THREE.Float32BufferAttribute(morph,3)];
    const mesh=new THREE.Mesh(g,m);root.add(mesh);return mesh;
  }
  const foldA=ribbon([new THREE.Vector3(-5,-3,2.1),new THREE.Vector3(-3.8,-.4,.6),new THREE.Vector3(-2.6,2.7,-1.1),new THREE.Vector3(.1,3.4,-2.1),new THREE.Vector3(3.4,2.8,-1.5),new THREE.Vector3(5.5,-1,1)],.85,glass);
  const foldB=ribbon([new THREE.Vector3(-4.8,-2.4,-2),new THREE.Vector3(-2,-1.7,-1.1),new THREE.Vector3(.1,-2.1,1.4),new THREE.Vector3(3,-2.45,2),new THREE.Vector3(5.7,.3,-.3),new THREE.Vector3(4.4,3.4,-3)],.55,warmGlass);
  const orbit = new THREE.Group();root.add(orbit);
  const shardGeometry=geometry(new RoundedBoxGeometry(.48,.85,.12,3,.09));
  for(let i=0;i<7;i++){
    const shard=new THREE.Mesh(shardGeometry,i%2?warmGlass:glass);
    shard.position.set(-4+i*1.65,Math.sin(i*2.2)*2.6,-2.4-(i%3));shard.rotation.set(i*.31,i*.77,i*.4);orbit.add(shard);
  }
  const portraitTexture=new THREE.TextureLoader().load(portraitSrc,()=>onReady());
  portraitTexture.colorSpace=THREE.SRGBColorSpace;resources.push(portraitTexture);
  const portrait=new THREE.Mesh(geometry(new THREE.PlaneGeometry(5.05,5.05)),material(new THREE.MeshBasicMaterial({map:portraitTexture,transparent:true,alphaTest:.035,side:THREE.DoubleSide,toneMapped:false})));
  portrait.position.set(1.7,-.02,.6);root.add(portrait);

  const haloTexture=document.createElement('canvas');haloTexture.width=128;haloTexture.height=128;
  const ctx=haloTexture.getContext('2d')!;const gradient=ctx.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(172,240,222,.32)');gradient.addColorStop(1,'rgba(172,240,222,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
  const glowTexture=new THREE.CanvasTexture(haloTexture);resources.push(glowTexture);
  const glow=new THREE.Sprite(material(new THREE.SpriteMaterial({map:glowTexture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));glow.position.set(1.7,1,-.1);glow.scale.set(7,7,1);root.add(glow);

  const film=document.createElement('video');film.src='/motion/folded-light-hyperframes.mp4';film.muted=true;film.loop=true;film.playsInline=true;film.preload='none';
  const filmTexture=new THREE.VideoTexture(film);filmTexture.colorSpace=THREE.SRGBColorSpace;resources.push(filmTexture);uniforms.uFilm.value=filmTexture;
  const filmLoaded=()=>{uniforms.uFilmReady.value=1;};film.addEventListener('loadeddata',filmLoaded);
  const beginFilm=()=>{if(!preference.matches)film.play().catch(()=>{});};
  // Keep the portrait and controls usable before the decorative movie has loaded.
  const loadFilm=window.setTimeout(beginFilm,1200);
  let width=0,height=0;let visible=true;let elapsed=0;let last=0;
  const pointer=new THREE.Vector2();const smooth=new THREE.Vector2();
  const resize=()=>{width=canvas.clientWidth;height=canvas.clientHeight;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();};
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  const move=(e:PointerEvent)=>{if(preference.matches||e.pointerType==='touch')return;const bounds=canvas.getBoundingClientRect();pointer.set((e.clientX-bounds.left)/bounds.width*2-1,(e.clientY-bounds.top)/bounds.height*2-1);};
  const leave=()=>pointer.set(0,0);
  const motionChange=()=>{if(preference.matches){leave();smooth.set(0,0);film.pause();}else if(visible)beginFilm();};preference.addEventListener('change',motionChange);
  canvas.parentElement?.addEventListener('pointermove',move);canvas.parentElement?.addEventListener('pointerleave',leave);
  const visibility=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible&&!document.hidden)beginFilm();else film.pause();});visibility.observe(canvas);
  const onVisibility=()=>{if(document.hidden)film.pause();else if(visible)beginFilm();};document.addEventListener('visibilitychange',onVisibility);

  renderer.setAnimationLoop((time)=>{
    const dt=last?Math.min((time-last)/1000,.05):0;last=time;if(!visible||document.hidden)return;elapsed+=dt;
    const p=pose.progress;const entrance=pose.entrance;const mobile=width<760;
    smooth.lerp(pointer,1-Math.exp(-dt*4));
    const drift=preference.matches?0:elapsed;
    root.rotation.y=smooth.x*.035;root.rotation.x=smooth.y*.018;
    camera.position.set((mobile?1.4:0)+p*1.7+smooth.x*.16, .1+p*.38-smooth.y*.1, (mobile?12:9.6)-p*7.5+(1-entrance)*1.8);
    camera.lookAt(mobile?1.55:0.15+p*1.5,p*.15, -p*2.5);
    portrait.position.set(1.7-p*2.1,-.02-p*.4,.6-p*6.5);portrait.scale.setScalar(1-p*.14);portrait.rotation.y=-p*.22;
    portal.scale.setScalar(1+p*1.65);portal.rotation.y=-p*.23;portal.position.z=-.9-p*.9;
    foldA.morphTargetInfluences![0]=p*.92;foldB.morphTargetInfluences![0]=p*.85;
    foldA.rotation.z=Math.sin(drift*.15)*.025;foldB.rotation.y=Math.sin(drift*.18)*.04;
    orbit.children.forEach((shard,i)=>{shard.rotation.y=i*.77+drift*(i%2?-.13:.11);shard.rotation.x=i*.31+Math.sin(drift*.3+i)*.15;shard.position.z=-2.4-(i%3)+p*5;});
    pointerLight.position.set(smooth.x*5,2-smooth.y*3,4);
    cyan.position.x=-4+Math.sin(drift*.3)*1.5;peach.position.y=1.5+Math.cos(drift*.23)*.7;
    uniforms.uTime.value=drift;uniforms.uProgress.value=p;
    stage.position.z=p*2;stageInner.position.z=p*2;
    renderer.render(scene,camera);
    canvas.dataset.progress=p.toFixed(3);canvas.dataset.pointer=smooth.x.toFixed(3);canvas.dataset.camera=camera.position.toArray().map(v=>v.toFixed(2)).join(',');
  });
  return ()=>{
    window.clearTimeout(loadFilm);renderer.setAnimationLoop(null);observer.disconnect();visibility.disconnect();document.removeEventListener('visibilitychange',onVisibility);preference.removeEventListener('change',motionChange);
    canvas.parentElement?.removeEventListener('pointermove',move);canvas.parentElement?.removeEventListener('pointerleave',leave);
    film.removeEventListener('loadeddata',filmLoaded);film.pause();film.removeAttribute('src');film.load();resources.forEach(r=>r.dispose());renderer.dispose();
  };
}
