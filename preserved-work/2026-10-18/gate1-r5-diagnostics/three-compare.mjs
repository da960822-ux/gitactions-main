import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const out='/workspace/gate1-r5-diagnostics';
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try {
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('**/__render_diagnostic__',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><style>html,body{margin:0;width:100%;height:100%;overflow:hidden}canvas{display:block}</style><canvas></canvas>'}));
 await page.goto('http://localhost:5195/__render_diagnostic__');
 const metadata=await page.evaluate(async()=>{
  const T=await import('/node_modules/.vite/deps/three.js');
  const {createFoldedWorld}=await import('/src/landing/cinematic/folded/world.ts');
  const w=createFoldedWorld(document.querySelector('canvas'),{width:1920,height:1080,pixelRatio:1,portrait:'/images/yeonseok-lisbeth-cutout.webp',surfaceFilm:'/motion/folded-playhouse-lightwell.mp4',onFrame:data=>window.frame=data});
  await w.ready;
  let film;w.scene.traverse(o=>{if(o.isMesh)for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m.emissiveMap?.image instanceof HTMLVideoElement)film=m.emissiveMap.image;});
  if(film&&film.readyState<2)await new Promise(resolve=>{film.addEventListener('loadeddata',resolve,{once:true});setTimeout(resolve,8000);});
  w.render({progress:0,entrance:1,pointerX:0,pointerY:0});
  window.w=w;window.T=T;
  window.redraw=()=>{w.renderer.shadowMap.needsUpdate=true;w.renderer.render(w.scene,w.camera);w.renderer.getContext().finish();};
  const meshes=[],mats=new Map(),lights=[];
  w.scene.traverse(o=>{
   if(o.isLight)lights.push({name:o.name,type:o.type,color:o.color.toArray(),intensity:o.intensity,position:o.position.toArray(),width:o.width,height:o.height});
   if(!o.isMesh)return;
   meshes.push({name:o.name,attributes:Object.keys(o.geometry.attributes),morph:o.morphTargetInfluences,materials:(Array.isArray(o.material)?o.material:[o.material]).map(m=>m.uuid)});
   for(const m of(Array.isArray(o.material)?o.material:[o.material]))mats.set(m.uuid,m);
  });
  window.original={tone:w.renderer.toneMapping,env:w.scene.environment,envIntensity:w.scene.environmentIntensity,fog:w.scene.fog,lights:[],mats:[]};
  w.scene.traverse(o=>{if(o.isLight)window.original.lights.push([o,o.visible]);});
  for(const m of mats.values())window.original.mats.push([m,m.lightMapIntensity,m.envMapIntensity,m.normalMap]);
  const texture=t=>t?{name:t.name,src:t.image?.src?.split('/').pop(),colorSpace:t.colorSpace,flipY:t.flipY,channel:t.channel,repeat:t.repeat.toArray(),width:t.image?.width,height:t.image?.height}:null;
  window.redraw();
  return{camera:{position:w.camera.position.toArray(),quaternion:w.camera.quaternion.toArray(),matrixWorld:w.camera.matrixWorld.toArray(),projection:w.camera.projectionMatrix.toArray(),fov:w.camera.fov},toneMapping:w.renderer.toneMapping,exposure:w.renderer.toneMappingExposure,environmentIntensity:w.scene.environmentIntensity,lights,meshes,materials:[...mats.values()].map(m=>({uuid:m.uuid,name:m.name,type:m.type,color:m.color?.toArray(),roughness:m.roughness,metalness:m.metalness,lightMapIntensity:m.lightMapIntensity,envMapIntensity:m.envMapIntensity,lightmap:texture(m.lightMap),normal:texture(m.normalMap)})),frame:window.frame};
 });
 await page.screenshot({path:out+'/three-current.png'});
 await page.evaluate(()=>{window.w.renderer.toneMapping=window.T.AgXToneMapping;window.redraw();});
 await page.screenshot({path:out+'/three-tone-agx.png'});
 await page.evaluate(()=>{const{w,original}=window;w.renderer.toneMapping=original.tone;for(const[m]of original.mats){if(m.lightMap)m.lightMap.channel=1;m.needsUpdate=true;}w.scene.traverse(o=>{if(o.isMesh&&o.geometry.getAttribute('uv'))o.geometry.setAttribute('uv1',o.geometry.getAttribute('uv').clone());});window.redraw();});
 await page.screenshot({path:out+'/three-uv1.png'});
 await page.evaluate(()=>{const{w,original,T}=window;for(const[m]of original.mats){if(m.lightMap)m.lightMap.channel=0;m.needsUpdate=true;}for(const[o]of original.lights)o.visible=false;w.scene.environment=null;w.scene.fog=null;w.scene.getObjectByName('LIVE_ROUGH_FLOOR_REFLECTION').visible=false;w.renderer.shadowMap.enabled=false;w.renderer.toneMapping=T.NoToneMapping;for(const[m]of original.mats){m.normalMap=null;m.envMapIntensity=0;m.needsUpdate=true;}window.redraw();});
 await page.screenshot({path:out+'/three-bakeonly-scale3.png'});
 await page.evaluate(()=>{for(const[m,i]of window.original.mats){if(m.lightMap)m.lightMapIntensity=i*Math.PI;}window.redraw();});
 await page.screenshot({path:out+'/three-bakeonly-scale3pi.png'});
 await page.evaluate(()=>{window.w.renderer.toneMapping=window.T.AgXToneMapping;window.redraw();});
 await page.screenshot({path:out+'/three-bakeonly-scale3pi-agx.png'});
 metadata.errors=errors;
 fs.writeFileSync(out+'/three-metadata.json',JSON.stringify(metadata,null,2));
 console.log(JSON.stringify({complete:true,errors,frame:metadata.frame}));
 await page.evaluate(()=>window.w.dispose());
}finally{await browser.close();}
