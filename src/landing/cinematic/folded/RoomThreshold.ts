import * as T from 'three';

/** The nearby scene has no oversized corridor or foreground door frame. */
export function createRoomThreshold(scene:T.Scene,_keep:<A extends{dispose:()=>void}>(value:A)=>A){
 const root=new T.Group();root.name='ROOM_PHYSICAL_THRESHOLD';scene.add(root);
 return {root};
}
