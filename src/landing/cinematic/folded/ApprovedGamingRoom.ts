import * as T from 'three';
import {ROOM_WORLD} from './approvedRoomGeometry';
import {createApprovedRoomArchitecture} from './ApprovedRoomArchitecture';

type Keep=<A extends{dispose:()=>void}>(asset:A)=>A;

export function createApprovedGamingRoom(scene:T.Scene,keep:Keep){
 const root=new T.Group();root.name='APPROVED_COUPLE_GAMING_ROOM';root.position.set(ROOM_WORLD.x,ROOM_WORLD.y,ROOM_WORLD.z);root.rotation.x=ROOM_WORLD.tilt;root.scale.setScalar(ROOM_WORLD.scale);scene.add(root);
 const art=keep(new T.MeshBasicMaterial({toneMapped:false,side:T.DoubleSide}));
 const architecture=createApprovedRoomArchitecture(root,art,keep);
 const sourceReady=new T.TextureLoader().loadAsync('/images/approved-couple-room/approved-couple-gaming-room.png').then(texture=>{keep(texture);texture.colorSpace=T.SRGBColorSpace;art.map=texture;art.needsUpdate=true;});
 // shortcut: this beauty-first room is an illustration, so entry choreography must respect its rigid original plane.
 return{root,floor:architecture.floor,anchor:architecture.floorAnchor,ready:Promise.all([sourceReady,architecture.ready]).then(()=>{}),updateExit(_progress:number){},updateDesk(_progress:number){},updateFold(progress:number){root.visible=progress>.18;architecture.updateFold(progress);}};
}
