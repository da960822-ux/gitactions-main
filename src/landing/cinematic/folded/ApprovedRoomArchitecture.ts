import * as T from 'three';
import {ROOM_REFERENCE,ROOM_WORLD,roomUV,roomVertex} from './approvedRoomGeometry';

type Keep=<A extends{dispose:()=>void}>(asset:A)=>A;

/** The complete approved illustration stays one rigid surface; only its new outer rows use outpaint. */
export function createApprovedRoomArchitecture(roomRoot:T.Group,art:T.MeshBasicMaterial,keep:Keep){
 const root=new T.Group();root.name='APPROVED_ILLUSTRATED_ROOM';roomRoot.add(root);
 const extension={value:null as T.Texture|null};
 art.onBeforeCompile=shader=>{
  shader.uniforms.roomOuterRows=extension;
  shader.fragmentShader='uniform sampler2D roomOuterRows;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
   #ifdef USE_MAP
    vec2 sourceUv=vMapUv;
    float sourceY=(1.-sourceUv.y)*941.;
    // Each texture lookup has continuous coordinates across the protected edge.
    // Selecting top/bottom coordinates before texture2D corrupts implicit mip derivatives.
    vec4 originalColor=texture2D(map,sourceUv);
    vec4 topColor=texture2D(roomOuterRows,vec2(sourceUv.x,1.-(53.+sourceY*1536./1672.)/1024.));
    vec4 bottomColor=texture2D(roomOuterRows,vec2(sourceUv.x,1.-(915.+(sourceY-941.)*1536./1672.)/1024.));
    vec3 protectedTop=texture2D(map,vec2(sourceUv.x,1.)).rgb;
    vec3 protectedBottom=texture2D(map,vec2(sourceUv.x,0.)).rgb;
    vec3 derivativeTop=texture2D(roomOuterRows,vec2(sourceUv.x,1.-53./1024.)).rgb;
    vec3 derivativeBottom=texture2D(roomOuterRows,vec2(sourceUv.x,1.-915./1024.)).rgb;
    topColor.rgb=clamp(topColor.rgb+(protectedTop-derivativeTop)*exp(-abs(sourceY)/14.),0.,1.);
    bottomColor.rgb=clamp(bottomColor.rgb+(protectedBottom-derivativeBottom)*exp(-abs(sourceY-941.)/14.),0.,1.);
    vec4 outerColor=mix(bottomColor,topColor,1.-step(0.,sourceY));
    float originalCenter=step(0.,sourceUv.y)*step(sourceUv.y,1.);
    vec4 sourceColor=mix(outerColor,originalColor,originalCenter);
    diffuseColor*=sourceColor;
   #endif
  `);
 };
 art.customProgramCacheKey=()=> 'approved-room-original-center-outer-rows-only-continuous-edge-derivatives-v4';
 const geometry=keep(new T.PlaneGeometry(ROOM_REFERENCE.width,1057,1,1));
 const position=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');
 for(let i=0;i<position.count;i++){
  const x=uv.getX(i)*1672,y=(1-uv.getY(i))*1057-58;
  position.setXYZ(i,...roomVertex(x,y,0));uv.setXY(i,...roomUV(x,y));
 }
 geometry.computeVertexNormals();
 const illustration=new T.Mesh(geometry,art);illustration.name='BYTE_UNTOUCHED_APPROVED_ROOM_WITH_OUTER_ROWS';root.add(illustration);
 // No synthetic floor is visible beneath the illustrated desk; the shared renderer still owns its receiver contract.
 const floor=new T.Mesh(keep(new T.PlaneGeometry(1,1)),keep(new T.MeshBasicMaterial()));floor.name='ILLUSTRATED_ROOM_INACTIVE_FLOOR_RECEIVER';floor.visible=false;root.add(floor);
 const ready=new T.TextureLoader().loadAsync('/images/approved-couple-room/room-vertical-outpaint.png').then(texture=>{keep(texture);if(texture.image.width!==1536||texture.image.height!==1024)throw new Error('Room outpaint dimensions do not match the protected source boundary.');texture.colorSpace=T.SRGBColorSpace;extension.value=texture;});
 return{root,floor,sourceFloor:illustration,floorAnchor:new T.Vector3(ROOM_WORLD.x,ROOM_WORLD.floor,ROOM_WORLD.z),ready,updateFold(_progress:number){}};
}
