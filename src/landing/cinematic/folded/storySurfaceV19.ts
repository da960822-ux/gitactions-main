import * as T from 'three';
import {openingCameraPose,smoothRange,heroDepartureMotion} from './poseSpaceV19';
import {cosmicOpeningPose,deformInitialCosmicVertex,heroContain} from './initialCosmicHero';

/** One authored media surface carrying original RGB; B is revealed by actual depth. */
export function createStorySurface(scene:T.Scene,keep:<A extends{dispose:()=>void}>(a:A)=>A){
 const columns=192,rows=128,geometry=keep(new T.PlaneGeometry(1,1,columns,rows)),position=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');
 const material=keep(new T.MeshBasicMaterial({toneMapped:false,side:T.DoubleSide,depthWrite:true,depthTest:true}));
 const mesh=new T.Mesh(geometry,material);mesh.name='ORIGINAL_CONTINUOUS_COSMIC_SURFACE';mesh.frustumCulled=false;scene.add(mesh);
 const reference=new T.PerspectiveCamera(38,16/9,.1,400),point=new T.Vector3(),rest=new Float32Array(position.count*3);
 const state={progress:0,sink:0,boundary:1.3,clearance:0};let key='',signature='',width=1920,height=1080;
 return{mesh,material,state,ready:Promise.resolve(),setHeroImage(texture:T.Texture){material.map=texture;material.needsUpdate=true;},setProjection(w:number,h:number,entrance:number){
  width=w;height=h;const next=w+':'+h+':'+entrance.toFixed(4);if(next===key)return;key=next;signature='';
  const mobile=w<760;if(material.transparent!==mobile){material.transparent=mobile;material.depthTest=material.depthWrite=!mobile;material.needsUpdate=true;}mesh.renderOrder=mobile?1:0;
  if(!mobile){for(let i=0;i<uv.count;i++)uv.setXY(i,i%(columns+1)/columns,1-Math.floor(i/(columns+1))/rows);uv.needsUpdate=true;return;}
  reference.aspect=w/h;reference.fov=T.MathUtils.radToDeg(2*Math.atan(Math.tan(T.MathUtils.degToRad(19))/.59));reference.setViewOffset(w,h,0,-h*.195,w,h);const c=openingCameraPose(entrance);reference.position.fromArray(c.position);reference.lookAt(...c.target as[number,number,number]);reference.updateProjectionMatrix();reference.updateMatrixWorld();
  const aspect=w/h,rx=aspect<1.5?aspect/1.5:1,ry=aspect>1.5?1.5/aspect:1;
  for(let i=0;i<position.count;i++){const u=i%(columns+1)/columns,v=1-Math.floor(i/(columns+1))/rows,wideU=(u-.5)*1.2+.5,wideV=(v-.5)*1.2+.5;point.set((wideU-.5)*2,(wideV-.5)*2,.5).unproject(reference).sub(reference.position);point.multiplyScalar((-4-reference.position.z)/point.z).add(reference.position);rest.set(point.toArray(),i*3);uv.setXY(i,wideU*rx+(1-rx)*.58,wideV*ry+(1-ry)*.5);}uv.needsUpdate=true;
 },update(p:number,e:number,pointerX=0,pointerY=0,_camera?:T.PerspectiveCamera){
  const next=[p,e,pointerX,pointerY].join(':');if(next===signature)return;signature=next;state.progress=p;const mobile=width<760,opening=cosmicOpeningPose(p,e,pointerX,pointerY);
  material.opacity=mobile?1-smoothRange(.27,.38,p):1;mesh.visible=mobile?material.opacity>0:true;
  const aspect=width/height,tan=Math.tan(24*Math.PI/180),rx=aspect<1.5?aspect/1.5:1,ry=aspect>1.5?1.5/aspect:1,contain=heroContain(width,height);
  state.sink=22*smoothRange(.38,.42,p);state.boundary=1.3-2.2*smoothRange(.39,.65,p);state.clearance=12*smoothRange(.56,.70,p);
  const motion=heroDepartureMotion(p),frontSpan=8-motion.advance;
  for(let i=0;i<position.count;i++){
   const u=i%(columns+1)/columns,v=1-Math.floor(i/(columns+1))/rows;
   if(mobile){point.fromArray(rest,i*3);deformInitialCosmicVertex(point,u,v,opening);point.sub(reference.position).multiplyScalar(4.5).add(reference.position);}
   else{
    const nx=(u*2-1)/rx,ny=(v*2-1)/ry;
    // Strictly monotone in u: every exposed interval reaches the same outer edge.
    // The broad S follows the artwork's diagonal orbital flow; no closed hole or face contour.
    const bend=.11*Math.sin(Math.PI*(v-.5)),atLeft=1/(1+Math.exp(-6*(bend-state.boundary))),atU=1/(1+Math.exp(-6*(u+bend-state.boundary)));
    const weight=(atU-atLeft)/(1-atLeft),depth=8+state.sink*weight+state.clearance;
    // The far front contracts coherently during approach. Its left edge remains anchored until final retirement.
    const turn=smoothRange(8,13.1+contain,depth);
    point.set(nx*tan*aspect*frontSpan+motion.side*(1-u)**4-2*turn-8*smoothRange(.56,.70,p),ny*tan*frontSpan,-depth);
    deformInitialCosmicVertex(point,u,v,{entry:opening.entry*.373333,pointerX:opening.pointerX*.373333,pointerY:opening.pointerY*.373333});
    point.x+=Math.sign(nx)*.10*Math.abs(opening.pointerX)*Math.abs(u*2-1)**24;
    point.x-=6;point.y+=.5;point.z+=3.1+contain;
   }
   position.setXYZ(i,point.x,point.y,point.z);
  }
  position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();mesh.updateMatrixWorld();
 }};
}
