import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

type Props = {
  progress: number; opening: number; reducedMotion: boolean;
  effect: { name: string; value: number; nonce: number };
  portraitSrc: string; onReady?: () => void; onFailure?: (message: string) => void;
};
const ease = (a: number, b: number, v: number) => {
  const t = THREE.MathUtils.clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export function PostHeroScene(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const redraw = useRef<() => void>(() => {});
  useEffect(() => { redraw.current(); }, [props.progress, props.opening, props.effect, props.reducedMotion]);
  useEffect(() => {
    if (!host.current) return;
    const element = host.current;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); }
    catch { latest.current.onFailure?.('WebGL is unavailable. The complete letter remains available below.'); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .9;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x150f19, 0.035);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 60);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, .04);
    scene.environment = environment.texture;
    scene.environmentIntensity = .45;
    room.dispose(); pmrem.dispose();
    const hemisphere=new THREE.HemisphereLight(0xffe8d9, 0x3c1b30, .7);scene.add(hemisphere);
    const key = new THREE.DirectionalLight(0xffe7cd, 2.5);
    key.position.set(-3, 7, 5); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: .5, far: 20 });
    key.shadow.bias = -.0004; key.shadow.normalBias = .025; scene.add(key);
    const rose = new THREE.PointLight(0xe39ca9, 3, 15); rose.position.set(4, 3, -2); scene.add(rose);
    const paper = new THREE.MeshStandardMaterial({ color: 0xf4e8d2, roughness: .85, side: THREE.DoubleSide });
    const cream = new THREE.MeshStandardMaterial({ color: 0xdfc9ad, roughness: .92, side: THREE.DoubleSide });
    const gold = new THREE.MeshStandardMaterial({ color: 0xd7a18f, metalness: .8, roughness: .3 });
    const burgundy = new THREE.MeshStandardMaterial({ color: 0x35101f, roughness: .85, metalness: .08, side: THREE.DoubleSide });
    const waxMat = new THREE.MeshStandardMaterial({ color: 0x8c253f, roughness: .34, metalness: .12 });
    const ink = new THREE.MeshStandardMaterial({ color: 0x35232d, roughness: .8 });
    function mesh(g: THREE.BufferGeometry, m: THREE.Material, parent: THREE.Object3D, x=0, y=0, z=0) {
      const object = new THREE.Mesh(g,m); object.position.set(x,y,z);
      object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
    }
    function box(w:number,h:number,d:number,m:THREE.Material,parent:THREE.Object3D,x=0,y=0,z=0) {
      return mesh(new THREE.BoxGeometry(w,h,d),m,parent,x,y,z);
    }
    function polygon(points:number[][], m:THREE.Material, parent:THREE.Object3D,z:number) {
      const shape = new THREE.Shape(); points.forEach(([x,y],i)=>i ? shape.lineTo(x,y) : shape.moveTo(x,y)); shape.closePath();
      return mesh(new THREE.ExtrudeGeometry(shape,{depth:.012,bevelEnabled:false}),m,parent,0,0,z);
    }
    const surfaceGeo = new THREE.PlaneGeometry(16, 11, 64, 40); surfaceGeo.rotateX(-Math.PI/2);
    const floorMaterial=burgundy.clone();
    const surface = mesh(surfaceGeo,floorMaterial,scene,0,-.09,-1);
    const original = Float32Array.from(surfaceGeo.attributes.position.array);
    const envelope = new THREE.Group(); envelope.position.set(1.15,.21,.3); scene.add(envelope);
    box(2.05,1.35,.025,paper,envelope,0,.675,-.055);
    box(1.96,1.28,.012,burgundy,envelope,0,.68,-.035);
    box(.035,1.35,.11,cream,envelope,-1.01,.675,0);
    box(.035,1.35,.11,cream,envelope,1.01,.675,0);
    box(2.05,.04,.11,cream,envelope,0,.02,0);
    // The front folds sit in front of the insert, so extraction reveals real depth.
    polygon([[-1.025,0],[-1.025,1.35],[.22,.42]],paper,envelope,.055);
    polygon([[1.025,0],[1.025,1.35],[-.22,.42]],paper,envelope,.06);
    polygon([[-1.025,0],[1.025,0],[1.025,.12],[0,.91],[-1.025,.12]],cream,envelope,.075);
    const flap = new THREE.Group(); flap.position.set(0,1.35,-.035); envelope.add(flap);
    polygon([[-1.025,0],[1.025,0],[0,-.96]],paper,flap,.12);
    polygon([[-.95,-.04],[.95,-.04],[0,-.88]],cream,flap,.105);
    const foilCanvas=document.createElement('canvas'); foilCanvas.width=1024;foilCanvas.height=256;
    const foilContext=foilCanvas.getContext('2d');
    if(foilContext) {
      foilContext.clearRect(0,0,1024,256);
      foilContext.fillStyle='#bd8872';foilContext.font='italic 72px Georgia, serif';foilContext.textAlign='center';foilContext.textBaseline='middle';
      foilContext.fillText('For Lisbeth',512,128);
    }
    const foilTexture=new THREE.CanvasTexture(foilCanvas);foilTexture.colorSpace=THREE.SRGBColorSpace;
    const foilLabel=mesh(new THREE.PlaneGeometry(1.12,.28),new THREE.MeshBasicMaterial({map:foilTexture,transparent:true,depthWrite:false,toneMapped:false}),envelope,0,.24,.093);
    foilLabel.castShadow=false;
    const seal = new THREE.Group(); seal.position.set(0,.48,.235); envelope.add(seal);
    const wax = mesh(new THREE.CylinderGeometry(.155,.16,.035,40),waxMat,seal); wax.rotation.x=Math.PI/2;
    mesh(new THREE.TorusGeometry(.118,.008,6,40),gold,seal,0,0,.021);
    const heart = new THREE.Shape(); heart.moveTo(0,-.055); heart.bezierCurveTo(-.13,.025,-.06,.10,0,.045); heart.bezierCurveTo(.06,.10,.13,.025,0,-.055);
    mesh(new THREE.ShapeGeometry(heart),gold,seal,0,0,.024);
    const insert = new THREE.Group(); insert.position.set(0,.55,0); envelope.add(insert);
    const panelH=.62;
    box(1.76,panelH,.018,paper,insert,0,0,0);
    const topFold=new THREE.Group(); topFold.position.y=panelH/2; insert.add(topFold);
    box(1.76,panelH,.018,paper,topFold,0,panelH/2,0);
    const bottomFold=new THREE.Group(); bottomFold.position.y=-panelH/2; insert.add(bottomFold);
    box(1.76,panelH,.018,paper,bottomFold,0,-panelH/2,0);
    for (const x of [-.81,.81]) box(.009,.51,.003,gold,insert,x,0,.012);
    box(1.62,.009,.003,gold,topFold,0,.55,.012);
    box(1.62,.009,.003,gold,bottomFold,0,-.55,.012);
    const portraitGroup=new THREE.Group(); portraitGroup.position.set(-1.4,.04,-1.9); scene.add(portraitGroup);
    let disposed=false;
    const portraitTexture = new THREE.TextureLoader().load(props.portraitSrc, texture => {
      if(disposed) {texture.dispose();return;}
      texture.colorSpace=THREE.SRGBColorSpace;
      const ratio=texture.image.width/texture.image.height;
      const height=2.05, width=height*ratio;
      const portrait=mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.05,toneMapped:false,fog:false,side:THREE.DoubleSide}),portraitGroup,0,height/2,0);
      portrait.castShadow=false; draw();
    });
    const dominoes:THREE.Group[]=[];
    const dotPositions = [[],[[0,0]],[[-1,-1],[1,1]],[[-1,-1],[0,0],[1,1]],[[-1,-1],[1,-1],[-1,1],[1,1]],[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],[[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]]];
    for(let i=0;i<4;i++) {
      const d=new THREE.Group(); d.position.set(-2.6+i*.42,.03,1.45-i*.1); d.rotation.y=.3; scene.add(d);dominoes.push(d);
      box(.32,.085,.68,paper,d,0,.045,0); box(.27,.004,.012,gold,d,0,.09,0);
      for(let half=0;half<2;half++) for(const [x,z] of dotPositions[(i+half+2)%7]) {
        const dot=mesh(new THREE.CylinderGeometry(.024,.024,.006,10),ink,d,x*.075,.093,(half? .175:-.175)+z*.075); dot.castShadow=false;
      }
    }
    const drawer=new THREE.Group();drawer.position.set(-.95,.055,1.05);scene.add(drawer);
    box(.56,.16,.48,burgundy,drawer,0,.08,0);
    const drawerSlide=new THREE.Group();drawer.add(drawerSlide);
    box(.48,.025,.4,cream,drawerSlide,0,.025,0);box(.48,.15,.025,gold,drawerSlide,0,.08,.21);
    mesh(new THREE.OctahedronGeometry(.09),gold,drawerSlide,0,.12,0);
    const pencil=new THREE.Group(); pencil.position.set(2.8,.05,.9);pencil.rotation.y=-.6;scene.add(pencil);
    const shaft=mesh(new THREE.CylinderGeometry(.037,.037,1.65,6),gold,pencil); shaft.rotation.z=Math.PI/2;
    const tip=mesh(new THREE.ConeGeometry(.038,.16,6),cream,pencil,.9,0,0);tip.rotation.z=-Math.PI/2;
    const graphite=mesh(new THREE.ConeGeometry(.012,.055,6),ink,pencil,.99,0,0);graphite.rotation.z=-Math.PI/2;
    for(let i=0;i<2;i++) {const r=mesh(new THREE.TorusGeometry(.22,.025,10,48),gold,scene,2.8+i*.25,.04,-.6+i*.15);r.rotation.x=Math.PI/2;}
    const balance=new THREE.Group();balance.position.set(-2.8,.3,-.65);scene.add(balance);
    box(.035,.6,.035,gold,balance,0,0,0);
    const tray=new THREE.Group();balance.add(tray); box(.9,.035,.27,gold,tray,0,.32,0);
    const ball=mesh(new THREE.SphereGeometry(.085,16,12),waxMat,tray,-.25,.42,0);
    const pocket=new THREE.Group();pocket.position.set(3.1,.02,-1.55);scene.add(pocket);
    box(1.05,.025,.8,gold,pocket);
    const roomWalls:THREE.Group[]=[];
    for(let i=0;i<3;i++) {
      const hinge=new THREE.Group();pocket.add(hinge);roomWalls.push(hinge);
      if(i===0){hinge.position.set(0,.025,-.4);box(1.05,.66,.018,paper,hinge,0,.33,0);}
      else {hinge.position.set(i===1?-.525:.525,.025,0);box(.018,.66,.8,cream,hinge,0,.33,0);}
    }
    const tinyRoom=new THREE.Group();pocket.add(tinyRoom);
    box(.4,.025,.27,paper,tinyRoom,0,.25,0);
    for(const x of [-.15,.15])box(.025,.24,.025,gold,tinyRoom,x,.12,0);
    for(const x of [-.35,.35]){box(.17,.02,.18,cream,tinyRoom,x,.12,0);box(.02,.22,.18,gold,tinyRoom,x,.11,-.08);}
    const lensRig=new THREE.Group();lensRig.position.set(-3,.35,-1.9);scene.add(lensRig);
    const gem=mesh(new THREE.OctahedronGeometry(.21),new THREE.MeshPhysicalMaterial({color:0xf0afbb,metalness:.2,roughness:.13,clearcoat:1}),lensRig);
    const lensRing=mesh(new THREE.TorusGeometry(.3,.025,8,40),gold,lensRig,0,0,.08);
    const icon=new THREE.Group();icon.position.set(0,0,-.22);lensRig.add(icon);
    box(.33,.42,.025,paper,icon);box(.25,.009,.028,gold,icon,0,.13,.02);
    for(const x of [-.07,.07])for(const y of [-.07,.04])mesh(new THREE.SphereGeometry(.025,8,6),waxMat,icon,x,y,.03);
    const shutters=[box(.22,.48,.035,burgundy,lensRig,-.11,0,-.13),box(.22,.48,.035,burgundy,lensRig,.11,0,-.13)];
    const waxSample=mesh(new THREE.CylinderGeometry(.23,.25,.09,40),waxMat,scene,2.7,.07,1.9);
    const imprint=mesh(new THREE.TorusGeometry(.12,.012,6,32),gold,scene,2.7,.12,1.9);imprint.rotation.x=-Math.PI/2;
    const stamp=new THREE.Group();stamp.position.set(2.7,.45,1.9);scene.add(stamp);box(.35,.08,.35,gold,stamp);
    mesh(new THREE.CylinderGeometry(.08,.06,.35,16),waxMat,stamp,0,.25,0);
    const strip=new THREE.Group();strip.position.set(-.8,.05,-.75);scene.add(strip);
    const stripPanels:THREE.Mesh[]=[];
    for(let i=0;i<12;i++)stripPanels.push(box(.12,.012,.2,i%2?cream:paper,strip,i*.12,0,0));
    const bars:THREE.Mesh[]=[];
    for(let i=0;i<3;i++)bars.push(box(.16,.08,.7,i===1?gold:cream,scene,.1+i*.32,.04,-1.15));
    const bridge=new THREE.Group();bridge.position.set(-.3,.03,1.4);scene.add(bridge);
    const bridgeHinges:THREE.Group[]=[];
    for(let i=0;i<3;i++) {
      const hinge=new THREE.Group();hinge.position.x=-.48+i*.32;bridge.add(hinge);bridgeHinges.push(hinge);
      box(.32,.025,.3,i%2?gold:paper,hinge,.16,0,0);
      box(.012,.008,.28,gold,hinge,0,.02,0);
    }
    box(.04,.16,.3,gold,bridge,-.46,-.07,0);box(.04,.16,.3,gold,bridge,.46,-.07,0);
    const inlay=new THREE.EllipseCurve(0,0,3.7,2.3,0,Math.PI*2,false,0).getPoints(128);
    const lineGeo=new THREE.BufferGeometry().setFromPoints(inlay.map(v=>new THREE.Vector3(v.x,-.03,v.y)));
    scene.add(new THREE.LineLoop(lineGeo,new THREE.LineBasicMaterial({color:0xb47770,transparent:true,opacity:.5})));
    const playProps=new THREE.Group();scene.add(playProps);
    [...dominoes,drawer,pencil,balance,pocket,lensRig,waxSample,imprint,stamp,strip,...bars,bridge].forEach(object=>playProps.attach(object));
    const architecture=new THREE.Group();architecture.position.z=-4.1;scene.add(architecture);
    const architectureMaterial=new THREE.MeshStandardMaterial({color:0x311e2a,roughness:.8,metalness:.1,side:THREE.DoubleSide});
    const doors:THREE.Group[]=[];
    for(const side of [-1,1]) {
      const door=new THREE.Group();door.position.set(side*3.65,0,0);architecture.add(door);doors.push(door);
      box(3.5,3.25,.16,architectureMaterial,door,-side*1.75,1.625,0);
      box(.025,3.15,.025,gold,door,-side*3.42,1.625,.1);
      for(let i=0;i<5;i++)box(3.25,.012,.025,gold,door,-side*1.75,.3+i*.6,.105);
    }
    const terrace=new THREE.Group();terrace.position.set(0,0,-4.45);scene.add(terrace);
    for(let i=0;i<15;i++) {
      const x=-6+i*.85,z=-Math.sqrt(Math.max(0,36-x*x))*.28;
      box(.045,.74,.045,gold,terrace,x,.37,z);
    }
    const railPoints=Array.from({length:49},(_,i)=>{const x=-6+i*.25;return new THREE.Vector3(x,.74,-Math.sqrt(Math.max(0,36-x*x))*.28);});
    const railCurve=new THREE.CatmullRomCurve3(railPoints);
    mesh(new THREE.TubeGeometry(railCurve,64,.025,6,false),gold,terrace);
    const letterLight=new THREE.SpotLight(0xffe4b7,0,14,.42,.8,1.5);letterLight.position.set(1,5,3);letterLight.target=envelope;scene.add(letterLight);
    const storyFloor=new THREE.Color(0x190c18),playFloor=new THREE.Color(0x293128),letterFloor=new THREE.Color(0x281a20),dawnFloor=new THREE.Color(0xb5747c);
    const darkArchitecture=new THREE.Color(0x311e2a),dawnArchitecture=new THREE.Color(0xe4b6ac);
    let width=1,height=1, animationFrame=0, effectNonce=-1, effectStart=0;
    function draw() {
      if(disposed)return;
      const {progress:rawProgress,opening:q,effect,reducedMotion}=latest.current;
      const p=reducedMotion?(rawProgress<.35?.15:rawProgress<.56?.47:rawProgress<.9?.85:1):rawProgress;
      insert.visible=rawProgress<.80;
      if(effectNonce!==effect.nonce){effectNonce=effect.nonce;effectStart=performance.now();}
      const phase=reducedMotion?1:Math.min(1,(performance.now()-effectStart)/850);
      const table=ease(.23,.48,p), story=1-ease(.27,.48,p);
      const letterFocus=ease(.54,.70,p)*(1-ease(.90,1,p));
      const dawn=ease(.90,1,p);
      floorMaterial.color.copy(storyFloor).lerp(playFloor,table).lerp(letterFloor,letterFocus).lerp(dawnFloor,dawn);
      floorMaterial.roughness=.9-table*.2+dawn*.15;
      floorMaterial.metalness=.04+table*.13-dawn*.12;
      architectureMaterial.color.copy(darkArchitecture).lerp(dawnArchitecture,dawn);
      doors.forEach((door,i)=>{door.rotation.y=(i===0?-1:1)*(table*.20+dawn*1.18);});
      terrace.visible=dawn>.02;terrace.scale.y=Math.max(.01,dawn);
      const propPresence=table*(1-letterFocus*.97)*(1-dawn);
      playProps.scale.setScalar(Math.max(.001,propPresence));playProps.position.y=-(1-propPresence)*.65;
      key.position.set(-3+letterFocus*3+dawn*7,7-letterFocus*2,5-dawn*8);
      key.color.set(0xffd4ae).lerp(new THREE.Color(0xffefdd),letterFocus).lerp(new THREE.Color(0xffc7ae),dawn);
      key.intensity=1.35+table*.9+letterFocus*.3+dawn*.7;
      hemisphere.intensity=.35+table*.25-letterFocus*.2+dawn*.8;
      hemisphere.color.set(0xc5b6d1).lerp(new THREE.Color(0xffdfc6),dawn);
      rose.position.set(story*.1+4*table,1.8+table, -3+letterFocus*3);
      rose.color.set(0xc98b72).lerp(new THREE.Color(0xffe7cc),dawn);
      rose.intensity=6*story+2*table+dawn*4;
      letterLight.intensity=letterFocus*11;
      renderer.toneMappingExposure=.78+table*.12+letterFocus*.04+dawn*.18;
      (scene.fog as THREE.FogExp2).color.set(0x150f19).lerp(new THREE.Color(0xc6989c),dawn);
      (scene.fog as THREE.FogExp2).density=.045-letterFocus*.01+dawn*.005;
      const positions=surfaceGeo.attributes.position;
      for(let i=0;i<positions.count;i++) {
        const x=original[i*3],z=original[i*3+2];
        const fold=Math.exp(-Math.pow((Math.abs(x)-2.7)/.95,2))*(.16+story*2.3)*(1-table*.92);
        positions.setY(i,fold+.06*Math.sin(z*1.4+x*.4)*(1-table)+dawn*.035*x*x);
      }
      positions.needsUpdate=true;surfaceGeo.computeVertexNormals();
      const approach=ease(.53,.68,p), ending=ease(.9,1,p);
      envelope.position.x=THREE.MathUtils.lerp(1.15,.65,approach)+(width>=600?ending*2.35:0);
      envelope.position.z=.3-story*1.15;
      envelope.rotation.set(-.18+approach*.09, -.13*(1-approach), -.06*(1-approach));
      flap.rotation.x=-ease(.12,.36,q)*THREE.MathUtils.degToRad(165);
      seal.position.y=.48-ease(.12,.34,q)*.35;
      seal.position.z=.235+ease(0,.12,q)*.08;
      seal.rotation.z=ease(0,.2,q)*.18;
      insert.position.y=.55+ease(.36,.62,q)*1.05;
      insert.position.z=-.005+ease(.62,.84,q)*.16;
      topFold.rotation.x=(1-ease(.62,.75,q))*Math.PI*.94;
      bottomFold.rotation.x=-(1-ease(.73,.86,q))*Math.PI*.94;
      const mobile=width<600;
      const distance=(mobile?8.5:7.1)-approach*(mobile?.3:1.15)+ending*2.6;
      camera.position.set((mobile?0:-.5)+Math.sin(p*Math.PI*2)*.35,3.15-approach*.8+ending*1.0+table*(1-approach)*1.05,distance);
      const targetX=mobile?.45:THREE.MathUtils.lerp(-1.1,.65,ease(.70,.84,p));
      camera.lookAt(targetX,.65+approach*.65-ending*.3,-.2);
      portraitGroup.position.x=mobile?-.9:THREE.MathUtils.lerp(-1.4,1.0,ending);
      portraitGroup.rotation.y=.08;
      const aliases:Record<string,string> = { 'balance-settled':'balance', 'domino-chain':'domino', 'paper-bridge':'bridge', 'rhythm-bridge':'rhythm', 'wax-stamp':'wax', 'wax-press':'wax', 'paper-pocket':'pocket', 'paper-wind':'wind', 'prism-angle':'prism' };
      const effectName=aliases[effect.name]||effect.name;
      const v=effectName==='balance' ? (effect.name==='balance-settled'?0:THREE.MathUtils.clamp(effect.value/8,-1,1)) : THREE.MathUtils.clamp(effect.value/(effectName==='prism'?2:1),0,1);
      const active=(name:string)=>effectName===name?v:0;
      dominoes.forEach((d,i)=>{
        const fall=active('domino')*ease(i*.16,i*.16+.4,phase);
        d.rotation.x=(1-fall)*Math.PI/2;d.rotation.z=0;d.position.y=.03+(1-fall)*.32;
      });
      drawerSlide.position.z=active('domino')*ease(.7,1,phase)*.38;
      tray.rotation.z=active('balance')*.14;ball.position.x=active('balance')*.25;
      const pocketOpen=active('pocket')*ease(0,1,phase);
      roomWalls[0].rotation.x=(1-pocketOpen)*Math.PI/2;
      roomWalls[1].rotation.z=-(1-pocketOpen)*Math.PI/2;
      roomWalls[2].rotation.z=(1-pocketOpen)*Math.PI/2;
      tinyRoom.scale.y=.05+pocketOpen*.95;
      const angle=active('prism');gem.rotation.set(angle*1.8,.3+angle*2.5,.4);
      const aligned=effectName==='prism'&&Math.abs(angle-.5)<.1;
      icon.visible=aligned;gem.visible=!aligned;
      shutters.forEach((shutter,i)=>{shutter.position.x=(i?1:-1)*(.11+(aligned?.26:0));});
      lensRing.rotation.z=angle*Math.PI;
      const waxActive=active('wax');
      const press=waxActive*Math.sin(ease(0,1,phase)*Math.PI);
      stamp.position.y=.4-press*.24;stamp.rotation.z=0;
      waxSample.scale.set(1+press*.12,1-press*.45,1+press*.12);
      imprint.visible=waxActive>0&&phase>.45;
      const gust=active('wind')*(.18+Math.sin(phase*Math.PI)*.45);
      stripPanels.forEach((panel,i)=>{
        const t=i/11;panel.position.y=Math.sin(t*Math.PI)*gust;
        panel.rotation.z=Math.atan(Math.cos(t*Math.PI)*gust*Math.PI/1.32);
      });
      bars.forEach((bar,i)=>{bar.rotation.x=active('rhythm')*ease(i*.15,.5+i*.15,phase)*Math.PI/2;bar.position.y=.04+active('rhythm')*.08;});
      bridgeHinges.forEach((hinge,i)=>{hinge.rotation.z=(1-active('bridge')*ease(i*.13,.65+i*.13,phase))*(i%2?-.8:.8);});
      // Idle is deliberately absent: unchanged poses do not need GPU frames.
      Object.assign(element.dataset, {
        flapAngle: String(flap.rotation.x), insertY: String(insert.position.y),
        topFoldAngle: String(topFold.rotation.x), bottomFoldAngle: String(bottomFold.rotation.x),
        cameraZ: String(camera.position.z), paperVisible: String(insert.visible),
        stage: rawProgress<.35?'story':rawProgress<.56?'play':rawProgress<.90?'letter':'ending',
        lightSignature: `${key.color.getHexString()}:${key.intensity.toFixed(3)}:${key.position.toArray().join(',')}:${letterLight.intensity.toFixed(3)}`,
        floorColor: floorMaterial.color.getHexString(),
      });
      renderer.render(scene,camera);
      if(!reducedMotion&&phase<1&&effect.value!==0&&!animationFrame) animationFrame=requestAnimationFrame(()=>{animationFrame=0;draw();});

    }
    redraw.current=draw;
    const observer=new ResizeObserver(()=>{width=element.clientWidth||1;height=element.clientHeight||700;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();draw();});observer.observe(element);
    const contextLost=(event:Event)=>{event.preventDefault();latest.current.onFailure?.('The 3D view was interrupted. The letter is still available below.');};
    renderer.domElement.addEventListener('webglcontextlost',contextLost);
    draw(); latest.current.onReady?.();
    return ()=>{
      disposed=true;cancelAnimationFrame(animationFrame);redraw.current=()=>{};observer.disconnect();renderer.setAnimationLoop(null);
      renderer.domElement.removeEventListener('webglcontextlost',contextLost);
      const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
      scene.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.Line){geometries.add(object.geometry);(Array.isArray(object.material)?object.material:[object.material]).forEach(m=>materials.add(m));}});
      geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());portraitTexture.dispose();foilTexture.dispose();environment.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();
    };
  }, [props.portraitSrc]);
  return <div ref={host} className="post-hero-scene" style={{width:'100%',height:'100%',minHeight:400}} />;
}
