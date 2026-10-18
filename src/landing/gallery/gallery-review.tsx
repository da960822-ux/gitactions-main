import {useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createApprovedGamingRoom} from '../cinematic/folded/ApprovedGamingRoom';
import {createGalleryCollection} from './GalleryCollection';
import {GameGallery} from './GameGallery';
import '../../styles/landing.css';

function Review(){
 const canvas=useRef<HTMLCanvasElement>(null),frame=useRef<()=>void>(()=>{});
 const [selected,setSelected]=useState('domino'),[language,setLanguage]=useState<'ko'|'es'>('ko');
 const current=useRef(selected);current.current=selected;
 useEffect(()=>{document.documentElement.lang=language==='es'?'es-DO':'ko';},[language]);
 useEffect(()=>{frame.current();},[selected]);
 useEffect(()=>{
  const element=canvas.current!,renderer=new THREE.WebGLRenderer({canvas:element,antialias:true});
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.AgXToneMapping;renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#21151d');
  const camera=new THREE.PerspectiveCamera(48,1,.1,200);
  const resources=new Set<{dispose:()=>void}>(),keep=<A extends{dispose:()=>void}>(value:A)=>{resources.add(value);return value;};
  const room=createApprovedGamingRoom(scene,keep);room.updateExit(0);room.updateDesk(1);
  const pmrem=new THREE.PMREMGenerator(renderer),environmentScene=new RoomEnvironment(),environment=pmrem.fromScene(environmentScene,.04);environmentScene.dispose();pmrem.dispose();scene.environment=environment.texture;scene.environmentIntensity=.8;
  const key=new THREE.DirectionalLight('#ffe3bf',2.1);key.position.set(-18,14,-45);key.target.position.set(-11,1.8,-58);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-14,right:14,top:12,bottom:-12,near:1,far:50});key.shadow.bias=-.00015;key.shadow.normalBias=.015;scene.add(key,key.target);
  const shadowSurface=new THREE.Mesh(keep(new THREE.PlaneGeometry(36,30)),keep(new THREE.ShadowMaterial({color:'#2e1820',opacity:.33,depthWrite:false})));shadowSurface.name='REAL_DESK_CONTACT_SHADOW';shadowSurface.rotation.x=-Math.PI/2;shadowSurface.position.set(-11,1.815,-59);shadowSurface.receiveShadow=true;scene.add(shadowSurface);
  scene.add(new THREE.HemisphereLight('#ffe5cd','#251321',.7));
  let disposed=false,ready=false;
  const collection=createGalleryCollection(()=>frame.current());collection.root.position.set(-11,1.82,-54);scene.add(collection.root);
  const draw=()=>{
   if(disposed||!ready)return;
   collection.update({selected:current.current,time:0,paused:true,snap:true,mobile:innerWidth<700});
   renderer.render(scene,camera);element.dataset.ready='true';
   const positions=Object.fromEntries(collection.root.children.map(group=>{const position=new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3()).project(camera);return[group.userData.game,{x:(position.x+1)*innerWidth/2,y:(1-position.y)*innerHeight/2}];}));
   element.dataset.picks=JSON.stringify(positions);
   element.dataset.contacts=JSON.stringify(Object.fromEntries(collection.root.children.map(group=>[group.userData.game,new THREE.Box3().setFromObject(group).min.y])));
  };
  frame.current=draw;
  const resize=()=>{renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.position.set(-11,6.7,-40.5);camera.lookAt(-11,4.7,-63);camera.fov=innerWidth<700?119:60;if(innerWidth<700)camera.setViewOffset(innerWidth,innerHeight,0,innerHeight*.15,innerWidth,innerHeight);else camera.clearViewOffset();camera.updateProjectionMatrix();draw();};
  const raycaster=new THREE.Raycaster();let press:{x:number;y:number}|null=null;
  const down=(event:PointerEvent)=>{if(!(event.target as Element).closest('a,button'))press={x:event.clientX,y:event.clientY};};
  const up=(event:PointerEvent)=>{if(!press||Math.hypot(event.clientX-press.x,event.clientY-press.y)>8)return;press=null;raycaster.setFromCamera(new THREE.Vector2(event.clientX/innerWidth*2-1,1-event.clientY/innerHeight*2),camera);const id=collection.pick(raycaster);if(id)setSelected(id);};
  addEventListener('resize',resize);addEventListener('pointerdown',down);addEventListener('pointerup',up);resize();
  void room.ready.then(()=>{ready=true;resize();});
  return()=>{disposed=true;frame.current=()=>{};removeEventListener('resize',resize);removeEventListener('pointerdown',down);removeEventListener('pointerup',up);collection.dispose();resources.forEach(resource=>resource.dispose());environment.dispose();renderer.dispose();};
 },[]);
 return <main className="landing gallery-room-review"><canvas ref={canvas} style={{position:'fixed',inset:0,width:'100%',height:'100svh',pointerEvents:'none'}}/><button id="language" style={{position:'fixed',right:12,top:10,zIndex:5}} onClick={()=>setLanguage(language==='ko'?'es':'ko')}>KO / ES</button><GameGallery language={language} selected={selected} onSelect={setSelected} sharedScene/></main>;
}
createRoot(document.getElementById('root')!).render(<Review/>);
