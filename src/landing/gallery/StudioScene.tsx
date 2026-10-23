import {useEffect,useRef,useState} from 'react';
import * as T from 'three';
import {createHeartGeometry} from './heartGeometry';
import {createGalleryAttraction,studioMaterials} from './studioObjects';
import {createGalleryCollection} from './GalleryCollection';

export type GameHover={id:string;x:number;y:number};
type Props={mode:'hearts'|'games';selected?:string;focused?:string;paused:boolean;snapSelection?:boolean;loadingLabel?:string;impulse?:number;onSelect?:(id:string)=>void;onHover?:(hover:GameHover|null)=>void};
const heartLayout=[[1.2,.25,1.1,1.82,-.25],[3.55,-1.55,.2,1.2,.3],[3.45,2.18,-1.8,1.12,.35],[-.1,2.3,-1,.68,-.5],[5.1,.55,-1,.7,.1],[.15,-2.4,-1.8,.67,.3]];
export default function StudioScene(props:Props){
 const host=useRef<HTMLDivElement>(null),controls=useRef(props),redraw=useRef<()=>void>(()=>{}),[ready,setReady]=useState(false),[failed,setFailed]=useState(false),[mounted,setMounted]=useState(props.mode==='hearts');
 controls.current=props;
 useEffect(()=>{if(mounted)return;const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){setMounted(true);observer.disconnect();}},{rootMargin:'250px'});observer.observe(host.current!);return()=>observer.disconnect();},[mounted]);
 useEffect(()=>{redraw.current();},[props.paused,props.selected,props.focused,props.impulse,props.snapSelection]);
 useEffect(()=>{
  if(!mounted)return;
  const node=host.current!;let renderer:T.WebGLRenderer;
  try{renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{setFailed(true);return;}
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(38,1,.1,50),materials=studioMaterials();
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  const environmentScene=new T.Scene();environmentScene.background=new T.Color('#121016');
  // Wide emissive panels create the broad softbox reflections used throughout the family.
  for(const [x,y,z,w,h] of [[-5,4,5,4,7],[5,1,2,2,6],[0,6,-2,7,2],[0,-3,4,5,1]]){
   const panel=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:'#fff2e8',side:T.DoubleSide}));panel.position.set(x,y,z);panel.lookAt(0,0,0);environmentScene.add(panel);
  }
  const pmrem=new T.PMREMGenerator(renderer),environment=pmrem.fromScene(environmentScene,.06);scene.environment=environment.texture;pmrem.dispose();
  const key=new T.DirectionalLight('#ffe5d1',3);key.position.set(-4,6,8);scene.add(key);const rim=new T.DirectionalLight('#c6caff',1.7);rim.position.set(5,2,-3);scene.add(rim);scene.add(new T.HemisphereLight('#d5cbd6','#110d13',.55));
  const objects:T.Group[]=[];
  if(props.mode==='hearts')heartLayout.forEach((_,i)=>{const g=new T.Group();g.add(new T.Mesh(createHeartGeometry(),i===1||i===3?materials.gold:materials.chrome));scene.add(g);objects.push(g);});
  const collection=props.mode==='games'?createGalleryCollection(()=>redraw.current()):null;
  if(collection){scene.add(collection.root);objects.push(...collection.root.children as T.Group[]);}
  const attraction=collection?createGalleryAttraction(objects):null;
  if(attraction)scene.add(attraction.root);
  const canvas=renderer.domElement;node.appendChild(canvas);canvas.setAttribute('aria-hidden','true');
  let width=0,height=0,mobile=false,time=0,last=0,visible=true,disposed=false,loaded=false,impulse=props.impulse??0,energy=0,needsFrame=true,dirty=true,looping=false,contextLost=false,renderCount=0;
  let entryStarted=0,selectionStarted=0;
  const pointer=new T.Vector2(),ray=new T.Raycaster(),hoverCenter=new T.Vector3(),boundsBox=new T.Box3(),boundsPoint=new T.Vector3(),selectedMatrix=new T.Matrix4();
  let boundsSelection='',boundsWidth=0,boundsHeight=0;
  const hoverMedia=window.matchMedia('(hover: hover) and (pointer: fine)');
  let hovered:{id:string;x:number;y:number}|null=null,hoverId:string|null=null,selection=props.selected,focusLabel:GameHover|null=null;
  const clearHover=()=>{hovered=null;hoverId=null;canvas.style.cursor='';canvas.dataset.hovered='';controls.current.onHover?.(null);};
  const resize=()=>{clearHover();const box=node.getBoundingClientRect();width=box.width;height=box.height;mobile=width<700;renderer.setSize(width,height);camera.aspect=width/height;camera.position.set(0,0,props.mode==='hearts'?(mobile?10.5:11.8):(mobile?10.2:9.6));camera.fov=props.mode==='hearts'&&mobile?43:38;camera.updateProjectionMatrix();invalidate(true);};
  const render=(snap=false,dt=1/60)=>{
   if(!width||!height||disposed||contextLost)return;const active=!controls.current.paused&&!document.hidden;
   objects.forEach((g,i)=>{
    let x=0,y=0,z=0,size=1,rx=.13,ry=-.2,rz=0;
    if(props.mode==='hearts'){
     const base=heartLayout[i];[x,y,z,size,rz]=base;if(mobile){x=(x-2.15)*.65;y*=.9;size*=1.05;}
     if(active){y+=Math.sin(time*.6+i)*.13;x+=Math.sin(time*.5+i*.8)*.08;ry+=Math.sin(time*.35+i)*.19;rz+=Math.sin(time*.5+i)*.06;}
     x+=pointer.x*.13*(i%2?1:-1);y+=pointer.y*.1;z+=energy*Math.sin(i*1.8);size*=1+energy*.055;
    }else{return;}
    const lerp=snap||controls.current.paused?1:1-Math.exp(-dt*8);
    g.position.lerp(new T.Vector3(x,y,z),lerp);g.scale.lerp(new T.Vector3(size,size,size),lerp);
    g.rotation.x+= (rx-g.rotation.x)*lerp;g.rotation.y+=(ry-g.rotation.y)*lerp;g.rotation.z+=(rz-g.rotation.z)*lerp;
   });
   needsFrame=collection?.update({selected:controls.current.selected??'domino',time,paused:controls.current.paused,dt,snap,mobile,hovered})??active;
   if(attraction){
    if(controls.current.paused)entryStarted=selectionStarted=-Infinity;
    else if(!loaded)entryStarted=selectionStarted=time;
    const entryAge=time-entryStarted,selectionAge=time-selectionStarted;
    const ambient=active&&visible&&!controls.current.snapSelection;
    needsFrame=attraction.update({entryAge,selectionAge,selected:controls.current.selected??'domino',paused:controls.current.paused,mobile,time,ambient})||needsFrame;
    collection!.root.updateMatrixWorld(true);
    canvas.dataset.galleryEntry=controls.current.paused?'paused':entryAge<1.25?'entering':'settled';canvas.dataset.galleryMaterial=controls.current.paused||controls.current.snapSelection?'static':selectionAge<1.8?'turning':ambient?'breathing':'settled';canvas.dataset.galleryAmbient=String(ambient);
   }
   canvas.dataset.hovered=hoverId??'';
   renderer.render(scene,camera);canvas.dataset.renderCount=String(++renderCount);
   if(!loaded){let assetsReady=true;scene.traverse(o=>{if(o instanceof T.Mesh){for(const m of Array.isArray(o.material)?o.material:[o.material]){const image=(m as T.MeshStandardMaterial).map?.image;if((m as T.MeshStandardMaterial).map?.userData.pending||(image instanceof HTMLImageElement&&!image.complete))assetsReady=false;}}});if(assetsReady){loaded=true;setReady(true);}canvas.dataset.ready=String(loaded);}
   if(collection){
    const id=controls.current.selected??'domino',chosen=objects.find(g=>g.userData.game===id)!;
    if(boundsSelection!==id||boundsWidth!==width||boundsHeight!==height||!selectedMatrix.equals(chosen.matrixWorld)){
     boundsBox.setFromObject(chosen);let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
     for(let corner=0;corner<8;corner++){
      boundsPoint.set(corner&1?boundsBox.max.x:boundsBox.min.x,corner&2?boundsBox.max.y:boundsBox.min.y,corner&4?boundsBox.max.z:boundsBox.min.z).project(camera);
      const x=(boundsPoint.x+1)*width/2,y=(1-boundsPoint.y)*height/2;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
     }
     canvas.dataset.selectedBounds=JSON.stringify({left,right,top,bottom,width,height});
     selectedMatrix.copy(chosen.matrixWorld);boundsSelection=id;boundsWidth=width;boundsHeight=height;
    }
    const focused=objects.find(group=>group.userData.game===controls.current.focused);
    if(focused&&!hoverId){
     focused.getWorldPosition(boundsPoint);const radius=focused.scale.x/(camera.position.z-boundsPoint.z)/Math.tan(T.MathUtils.degToRad(camera.fov/2))*height/2;boundsPoint.project(camera);
     const x=(boundsPoint.x+1)*width/2,y=(1-boundsPoint.y)*height/2-radius;
     if(!focusLabel||focusLabel.id!==focused.userData.game||Math.abs(focusLabel.x-x)>1||Math.abs(focusLabel.y-y)>1){focusLabel={id:focused.userData.game,x,y};controls.current.onHover?.(focusLabel);}
    }else if(focusLabel){focusLabel=null;if(!hoverId)controls.current.onHover?.(null);}
   }
   canvas.dataset.motion=!active||!visible?'paused':needsFrame?'running':'settled';
  };
  const stop=()=>{renderer.setAnimationLoop(null);looping=false;last=0;canvas.dataset.galleryAmbient='false';};
  const frame=(now:number)=>{
   if(!visible||document.hidden||controls.current.paused||contextLost){stop();return;}
   if(last&&now-last<1000/30)return;
   const dt=last?Math.min((now-last)/1000,.25):0;last=now;
   if(dirty||needsFrame){dirty=false;time+=dt;energy*=Math.exp(-dt*2);render(false,dt);}
   if(!needsFrame&&!dirty)stop();
  };
  const start=()=>{if(!looping&&!disposed&&visible&&!document.hidden&&!controls.current.paused&&!contextLost){looping=true;renderer.setAnimationLoop(frame);}};
  const invalidate=(snap=false)=>{
   dirty=true;if(disposed||!visible||document.hidden||contextLost)return;
   if(snap||controls.current.paused){dirty=false;render(true);if(needsFrame&&!controls.current.paused)start();else stop();}else start();
  };
  const sync=()=>{if(controls.current.paused||selection!==controls.current.selected)clearHover();if(selection!==controls.current.selected)selectionStarted=controls.current.paused||controls.current.snapSelection?-Infinity:time;selection=controls.current.selected;if(impulse!==(controls.current.impulse??0)){impulse=controls.current.impulse??0;energy=.85;}invalidate(controls.current.paused||controls.current.snapSelection);};redraw.current=sync;
  const move=(event:PointerEvent)=>{
   const box=canvas.getBoundingClientRect();pointer.set((event.clientX-box.left)/box.width*2-1,-(event.clientY-box.top)/box.height*2+1);
   if(collection){
    ray.setFromCamera(pointer,camera);const id=collection.pick(ray);
    const mouse=event.pointerType==='mouse'&&hoverMedia.matches&&visible&&!document.hidden;
    hoverId=mouse?id:null;canvas.style.cursor=hoverId?'pointer':'';canvas.dataset.hovered=hoverId??'';hovered=null;
    controls.current.onHover?.(hoverId?{id:hoverId,x:event.clientX-box.left,y:event.clientY-box.top}:null);
    if(id&&mouse&&!controls.current.paused){
     const group=objects.find(g=>g.userData.game===id)!;
     group.getWorldPosition(hoverCenter);const radius=group.scale.x/(camera.position.z-hoverCenter.z)/Math.tan(T.MathUtils.degToRad(camera.fov/2));hoverCenter.project(camera);
     hovered={id,x:T.MathUtils.clamp((pointer.x-hoverCenter.x)*camera.aspect/radius,-1,1),y:T.MathUtils.clamp((pointer.y-hoverCenter.y)/radius,-1,1)};
    }
    invalidate();
   }else if(!controls.current.paused){energy=Math.max(energy,.06);invalidate();}
  };
  let pressed:{x:number;y:number;id:number}|null=null;
  const down=(event:PointerEvent)=>{if(event.pointerType!=='mouse')clearHover();if(event.isPrimary&&event.button===0)pressed={x:event.clientX,y:event.clientY,id:event.pointerId};};
  const cancel=()=>{pressed=null;clearHover();invalidate();};
  const click=(event:PointerEvent)=>{const start=pressed;pressed=null;if(!start||start.id!==event.pointerId||Math.hypot(event.clientX-start.x,event.clientY-start.y)>8)return;move(event);if(props.mode==='hearts'){if(!controls.current.paused)energy=.6;return;}ray.setFromCamera(pointer,camera);const id=collection?.pick(ray);if(id){clearHover();controls.current.onSelect?.(id);}};
  const leave=()=>{pointer.set(0,0);cancel();};
  const reset=()=>{leave();if(document.hidden)stop();else invalidate(true);};
  const lost=(event:Event)=>{event.preventDefault();contextLost=true;leave();stop();loaded=false;canvas.dataset.ready='false';setReady(false);};
  const restored=()=>{contextLost=false;loaded=false;invalidate(true);};
  const observer=new ResizeObserver(resize);observer.observe(node);const intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(!visible){leave();stop();}else invalidate(true);});intersection.observe(node);
  document.addEventListener('visibilitychange',reset);window.addEventListener('blur',reset);window.addEventListener('resize',reset);hoverMedia.addEventListener('change',reset);
  canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointerup',click);canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('pointerleave',leave);canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('webglcontextrestored',restored);
  resize();
  return()=>{disposed=true;clearHover();redraw.current=()=>{};renderer.setAnimationLoop(null);observer.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',reset);window.removeEventListener('blur',reset);window.removeEventListener('resize',reset);hoverMedia.removeEventListener('change',reset);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointerup',click);canvas.removeEventListener('pointercancel',cancel);canvas.removeEventListener('pointerleave',leave);canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',restored);canvas.remove();
   attraction?.dispose();collection?.dispose();
   const geometries=new Set<T.BufferGeometry>(),mats=new Set<T.Material>();scene.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>mats.add(m));}});geometries.forEach(g=>g.dispose());Object.values(materials).forEach(m=>m.dispose());mats.forEach(m=>{const map=(m as T.MeshStandardMaterial).map;map?.dispose();m.dispose();});environment.dispose();environmentScene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();o.material.dispose();}});renderer.dispose();renderer.forceContextLoss();};
 },[props.mode,mounted]);
 return <div ref={host} className={`rd-studio rd-studio-${props.mode}`} data-ready={ready||failed}>{failed&&props.mode==='games'?<img className="rd-gallery-fallback" src={`/images/landing-preview/games/${props.selected||'domino'}.png`} alt="" aria-hidden="true"/>:!ready&&<span className="rd-render-fallback" role="status">{props.loadingLabel??'PREPARING YOUR GIFT'}</span>}</div>;
}
