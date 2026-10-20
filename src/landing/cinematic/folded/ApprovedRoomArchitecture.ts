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
    float outerY=sourceY<0.?53.+sourceY*1536./1672.:915.+(sourceY-941.)*1536./1672.;
    // Unconditional samples preserve mip derivatives at the protected rectangle's boundaries.
    vec4 originalColor=texture2D(map,sourceUv);
    vec4 outerColor=texture2D(roomOuterRows,vec2(sourceUv.x,1.-outerY/1024.));
    float edgeY=sourceY<0.?0.:941.;
    float outpaintEdgeY=sourceY<0.?53.:915.;
    vec3 protectedEdge=texture2D(map,vec2(sourceUv.x,1.-edgeY/941.)).rgb;
    vec3 derivativeEdge=texture2D(roomOuterRows,vec2(sourceUv.x,1.-outpaintEdgeY/1024.)).rgb;
    outerColor.rgb=clamp(outerColor.rgb+(protectedEdge-derivativeEdge)*exp(-abs(sourceY-edgeY)/14.),0.,1.);
    float originalCenter=step(0.,sourceUv.y)*step(sourceUv.y,1.);
    vec4 sourceColor=mix(outerColor,originalColor,originalCenter);
    diffuseColor*=sourceColor;
   #endif
  `);
 };
 art.customProgramCacheKey=()=> 'approved-room-original-center-outer-rows-only-edge-registered-v3';
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
