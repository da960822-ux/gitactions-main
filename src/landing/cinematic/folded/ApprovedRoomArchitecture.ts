import * as T from 'three';
import { ROOM_REFERENCE, ROOM_WORLD, roomVertex } from './approvedRoomGeometry';

type Keep = <A extends { dispose: () => void }>(asset: A) => A;

const W = ROOM_REFERENCE.width, H = ROOM_REFERENCE.height, D = ROOM_REFERENCE.distance;

/** Source-colour surfaces remain registered even when their vertices have different depths. */
export function setApprovedRoomProjection(material: T.MeshBasicMaterial, sourceMask?: { value: T.Texture | null }, chairVacancy?: { value: T.Texture | null }) {
  material.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec3 vApprovedProjection;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float sourceDistance = ${D.toFixed(1)} - position.z;
      vApprovedProjection = vec3(uv * sourceDistance, sourceDistance);
    `);
    shader.fragmentShader = 'varying vec3 vApprovedProjection;\n' + shader.fragmentShader;
    if (sourceMask) {
      shader.uniforms.approvedForegroundMask = sourceMask;
      shader.fragmentShader = 'uniform sampler2D approvedForegroundMask;\n' + shader.fragmentShader;
      if (chairVacancy) {
        shader.uniforms.approvedChairVacancy = chairVacancy;
        shader.fragmentShader = 'uniform sampler2D approvedChairVacancy;\n' + shader.fragmentShader;
      }
    }
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      #ifdef USE_MAP
        vec2 sourceUv = vApprovedProjection.xy / vApprovedProjection.z;
        vec4 sourceColor = texture2D(map, sourceUv);
        ${sourceMask && chairVacancy ? `vec3 sourceClass = texture2D(approvedForegroundMask, sourceUv).rgb;
        bool vacancy=max(max(sourceClass.r,sourceClass.g),sourceClass.b)>.4;
        vec2 inkStep=vec2(2./1672.,2./941.);
        float seamH=min(texture2D(approvedForegroundMask,sourceUv-vec2(inkStep.x,0.)).b,texture2D(approvedForegroundMask,sourceUv+vec2(inkStep.x,0.)).b);
        float seamV=min(texture2D(approvedForegroundMask,sourceUv-vec2(0.,inkStep.y)).b,texture2D(approvedForegroundMask,sourceUv+vec2(0.,inkStep.y)).b);
        if(vacancy || max(seamH,seamV)>.6) sourceColor=texture2D(approvedChairVacancy,sourceUv);` : ''}
        diffuseColor *= sourceColor;
      #endif
    `);
  };
  material.customProgramCacheKey = () => 'approved-room-opaque-source-v3' + (chairVacancy ? '-foreground-vacancies-only' : '');
  material.transparent = false;
  material.depthWrite = true;
  material.toneMapped = false;
  material.side = T.DoubleSide;
  material.needsUpdate = true;
}

/** The two illustrated perspectives stay registered as a nearby, shallow room. */
export function createApprovedRoomArchitecture(roomRoot:T.Group,environment:T.MeshBasicMaterial,keep:Keep,sourceMask?:{value:T.Texture|null},chairVacancy?:{value:T.Texture|null}){
 const root=new T.Group();root.name='CONTINUOUS_DUAL_ROOM_ARCHITECTURE';roomRoot.add(root);
 setApprovedRoomProjection(environment,sourceMask,chairVacancy);
 const geometry=keep(new T.PlaneGeometry(W,H,96,64)),position=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');
 const depths=new Float32Array(position.count);
 for(let i=0;i<position.count;i++){
  const u=uv.getX(i),x=u*W,y=(1-uv.getY(i))*H;
  const depth=-1.2+1.2*Math.pow(Math.abs(u-.5)*2,4);
  depths[i]=depth;position.setXYZ(i,...roomVertex(x,y,depth));
 }
 geometry.computeVertexNormals();
 const relief=new T.Mesh(geometry,environment);relief.name='APPROVED_ENVIRONMENT_CONTINUOUS_RELIEF';relief.userData.projectedRoomSurface=true;relief.frustumCulled=false;roomRoot.add(relief);
 const timber=keep(new T.MeshStandardMaterial({color:'#a47a58',roughness:.9,side:T.DoubleSide}));
 const floor=new T.Mesh(keep(new T.PlaneGeometry(22,18)),timber);floor.name='NEAR_ROOM_CONTINUING_FLOOR';floor.rotation.x=-Math.PI/2;floor.position.set(ROOM_WORLD.x,ROOM_WORLD.floor,ROOM_WORLD.z-1);floor.receiveShadow=true;roomRoot.parent!.add(floor);
 const ready=new T.TextureLoader().loadAsync('/images/approved-couple-room/honeywood-material.png').then(texture=>{keep(texture);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.MirroredRepeatWrapping;texture.repeat.set(2,2);timber.map=texture;timber.needsUpdate=true;});
 const anchor=new T.Vector3(ROOM_WORLD.x,ROOM_WORLD.floor,ROOM_WORLD.z);
 let previous=-1;
 return{root,floor,sourceFloor:relief,floorAnchor:anchor,ready,updateFold(progress:number){
  const q=T.MathUtils.smoothstep(progress,.18,.36);floor.visible=progress>.30;if(Math.abs(q-previous)<.00001)return;previous=q;
  for(let i=0;i<position.count;i++){
   const x=uv.getX(i)*W,y=(1-uv.getY(i))*H,edge=Math.pow(Math.abs(uv.getX(i)-.5)*2,4);
   position.setXYZ(i,...roomVertex(x,y,depths[i]-.8*edge*(1-q)));
  }
  position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
 }};
}
