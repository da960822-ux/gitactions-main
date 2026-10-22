import * as T from 'three';
import {gameCatalog} from '../../games/catalog';
import {createGameObject, normalizeSculpture, studioMaterials} from './studioObjects';

// Historical single focus and seven surrounding objects, from the approved caa6d31 gallery.
type Frame = {selected: string; time: number; paused: boolean; dt?: number; snap?: boolean; mobile?: boolean; hovered?:{id:string;x:number;y:number}|null; storyFocus?:number; effect?:{name:string;value:number;nonce:number}};

/** Renderer-free: the landing host owns the camera, lighting, environment and animation loop. */
export function createGalleryCollection(onAssetReady = () => {}) {
  const root = new T.Group();
  root.name = 'GAME_COLLECTION';
  const sourceMaterials = studioMaterials();
  const originalMaterials = new Set<T.Material>(Object.values(sourceMaterials));
  const objects = gameCatalog.map(game => {
    const group = normalizeSculpture(createGameObject(game.id, sourceMaterials, onAssetReady));
    group.name = `GAME_${game.id.toUpperCase()}`;
    group.userData.game = game.id;
    const handles: T.MeshStandardMaterial[] = [];
    group.traverse(object => {
      if (!(object instanceof T.Mesh)) return;
      object.castShadow=true;object.receiveShadow=true;
      const originals = Array.isArray(object.material) ? object.material : [object.material];
      const copies = originals.map(original => {
        originalMaterials.add(original);
        const material = original.clone() as T.MeshStandardMaterial;
        material.userData.baseColor = material.color.clone();
        material.userData.baseEnvironment = material.envMapIntensity;
        handles.push(material);
        return material;
      });
      object.material = Array.isArray(object.material) ? copies : copies[0];
    });
    root.add(group);
    return {group, handles, fromPosition:new T.Vector3(), fromScale:1, fromRotation:new T.Euler()};
  });
  originalMaterials.forEach(material => material.dispose());
  let inputEnabled = true, previous = '',previousStoryFocus=0,exchange=1,departing='';
  const target = new T.Vector3(), size = new T.Vector3(),rootOrigin=new T.Vector3(),rootScale=new T.Vector3(),contactBounds=new T.Box3();
  return {
    root,
    update({selected, time, paused, dt = 1 / 60, snap = false, mobile = false, hovered, storyFocus = 0, effect}: Frame) {
      const changed = previous !== selected;
      const focus=T.MathUtils.clamp(storyFocus,0,1);
      if(changed&&previous&&!snap&&!paused&&focus===0&&previousStoryFocus===0){
        exchange=0;departing=previous;
        objects.forEach(object=>{object.fromPosition.copy(object.group.position);object.fromScale=object.group.scale.x;object.fromRotation.copy(object.group.rotation);});
      }
      if(snap||paused||focus>0||previousStoryFocus>0)exchange=1;
      const exchanging=exchange<1;
      exchange=Math.min(1,exchange+dt/.48);
      root.getWorldPosition(rootOrigin);root.getWorldScale(rootScale);
      objects.forEach(({group, handles,fromPosition,fromScale,fromRotation}, index) => {
        const chosen = gameCatalog[index].id === selected;
        const angle=index/8*Math.PI*2;
        const representative=focus>0?T.MathUtils.lerp(mobile?1.9:2.1,2.5,focus):mobile?1.9:2.6;
        const scale=chosen?representative:!mobile&&focus===0?.7:.45;
        const pitched=!mobile&&focus===0;
        const depth=pitched?-1.6-Math.sin(angle)*.8:-3.2;
        // Adapted from ThreeUI Community filmstrip focus/depth staging; keep peers beside the selected silhouette.
        const peerRadius=mobile&&focus===0?3.35+1.6*Math.abs(Math.sin(angle)):mobile?3.35:5.8;
        const peerX=pitched?Math.sign(Math.cos(angle))*(4.6+1.9*Math.abs(Math.cos(angle))):Math.cos(angle)*peerRadius;
        target.set(chosen?5.1*focus:peerX,chosen?0:Math.sin(angle)*(pitched?2.4:3.8),chosen?T.MathUtils.lerp(1.3,7.5,focus):depth);
        if(!paused&&focus>0)target.y+=Math.sin(time*.7+index)*.055*(1-focus);
        if(!chosen)target.y-=10*focus;
        const game=gameCatalog[index].id;
        const hovering=!paused&&inputEnabled&&focus===0&&hovered?.id===game;
        const tiltX=hovering?-T.MathUtils.clamp(hovered.y,-1,1)*T.MathUtils.degToRad(4):0;
        const tiltY=hovering?T.MathUtils.clamp(hovered.x,-1,1)*T.MathUtils.degToRad(4):0;
        if(hovering)target.y+=.12;
        const event=effect?.name??'none',value=effect?.value??0;
        const balance=game==='jaipur'&&event==='balance'?T.MathUtils.clamp(value/8,-1,1)*.12:0;
        const domino=game==='domino'&&event==='domino-chain'?T.MathUtils.clamp(value,0,1)*1.15:0;
        const wind=game==='catchmind'&&event==='paper-wind'&&value?Math.sin(time*.8)*.045:0;
        const prism=game==='splendor'&&event==='prism-angle'?value*Math.PI*.35:0;
        const rhythm=game==='rhythm'&&event==='rhythm-bridge'&&value?Math.sin(time*2)*.04:0;
        let ry=T.MathUtils.lerp(chosen?-.2:Math.sin(angle)*.35,chosen?-.12:0,focus)+prism;
        if(!paused&&focus>0)ry+=Math.sin(time*.45+index)*.065;
        const amount = snap || paused || focus>0 || previousStoryFocus>0 ? 1 : 1 - Math.exp(-dt * 8);
        const rx=T.MathUtils.lerp(chosen?.15:.12,0,focus)+domino+wind+tiltX,rz=T.MathUtils.lerp(chosen?-.1:Math.cos(angle)*.15,0,focus)+balance+rhythm;
        if(exchanging){
          const returning=game===departing;
          // Clear the large outgoing piece before the incoming piece expands at the center.
          const travel=T.MathUtils.smoothstep(exchange,returning?.2:0,chosen?.7:1);
          const growth=T.MathUtils.smoothstep(exchange,chosen?.55:0,returning?.2:1);
          group.position.lerpVectors(fromPosition,target,travel);
          group.scale.setScalar(T.MathUtils.lerp(fromScale,scale,growth));
          group.rotation.set(T.MathUtils.lerp(fromRotation.x,rx,travel),T.MathUtils.lerp(fromRotation.y,ry+tiltY,travel),T.MathUtils.lerp(fromRotation.z,rz,travel));
        }else{
          group.position.lerp(target, amount);
          group.scale.lerp(size.setScalar(scale), amount);
          group.rotation.x += (rx-group.rotation.x)*amount;
          group.rotation.y += (ry+tiltY-group.rotation.y)*amount;
          group.rotation.z += (rz-group.rotation.z)*amount;
        }
        const support=group.getObjectByName('CATCHMIND_EASEL_SUPPORT');if(support)support.scale.setScalar(focus);
        // Story props meet the sheet; the restored gallery retains its deliberate suspended composition.
        if(focus>0){group.updateWorldMatrix(true,true);contactBounds.setFromObject(group);group.position.y+=(rootOrigin.y-(chosen?0:10*focus*rootScale.y)-contactBounds.min.y)/rootScale.y;}
        group.traverse(object=>{if(object instanceof T.Mesh)object.castShadow=focus>0;});
        if (changed) handles.forEach(material => {
          material.color.copy(material.userData.baseColor).multiplyScalar(chosen || material instanceof T.MeshBasicMaterial ? 1 : .42);
          if (typeof material.userData.baseEnvironment === 'number') material.envMapIntensity = material.userData.baseEnvironment * (chosen ? 1 : .45);
        });
      });
      previous = selected;previousStoryFocus=focus;
      root.updateMatrixWorld(true);
    },
    pick(raycaster: T.Raycaster): string | null {
      if (!inputEnabled || !root.visible) return null;
      const hit = raycaster.intersectObjects(objects.map(({group}) => group), true)[0];
      if (!hit) return null;
      let object: T.Object3D = hit.object;
      while (object.parent && !object.userData.game) object = object.parent;
      return object.userData.game ?? null;
    },
    setInputEnabled(enabled: boolean) { inputEnabled = enabled; },
    dispose() {
      const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>(), textures = new Set<T.Texture>();
      root.traverse(object => {
        if (!(object instanceof T.Mesh)) return;
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
          materials.add(material);
          const map = (material as T.MeshStandardMaterial).map;
          if (map) textures.add(map);
        }
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      textures.forEach(texture => texture.dispose());
      root.removeFromParent();
    },
  };
}
