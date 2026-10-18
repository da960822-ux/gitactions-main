import * as T from 'three';
import {gameCatalog} from '../../games/catalog';
import {createGameObject, normalizeSculpture, studioMaterials} from './studioObjects';

// Historical single focus and seven surrounding objects, from the approved caa6d31 gallery.
type Frame = {selected: string; time: number; paused: boolean; dt?: number; snap?: boolean; mobile?: boolean; storyFocus?:number; effect?:{name:string;value:number;nonce:number}};

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
    return {group, handles};
  });
  originalMaterials.forEach(material => material.dispose());
  let inputEnabled = true, previous = '',previousStoryFocus=0;
  const target = new T.Vector3(), size = new T.Vector3(),rootOrigin=new T.Vector3(),rootScale=new T.Vector3(),contactBounds=new T.Box3();
  return {
    root,
    update({selected, time, paused, dt = 1 / 60, snap = false, mobile = false, storyFocus = 0, effect}: Frame) {
      const changed = previous !== selected;
      const focus=T.MathUtils.clamp(storyFocus,0,1);
      root.getWorldPosition(rootOrigin);root.getWorldScale(rootScale);
      objects.forEach(({group, handles}, index) => {
        const chosen = gameCatalog[index].id === selected;
        const angle=index/8*Math.PI*2;
        const scale=chosen?T.MathUtils.lerp(mobile?1.9:2.1,2.5,focus):.45;
        target.set(chosen?5.1*focus:Math.cos(angle)*(mobile?3.35:5.8),chosen?0:Math.sin(angle)*3.8,chosen?T.MathUtils.lerp(1.3,7.5,focus):-3.2);
        if(!paused)target.y+=Math.sin(time*.7+index)*.055*(1-focus);
        if(!chosen)target.y-=10*focus;
        const game=gameCatalog[index].id;
        const event=effect?.name??'none',value=effect?.value??0;
        const balance=game==='jaipur'&&event==='balance'?T.MathUtils.clamp(value/8,-1,1)*.12:0;
        const domino=game==='domino'&&event==='domino-chain'?T.MathUtils.clamp(value,0,1)*1.15:0;
        const wind=game==='catchmind'&&event==='paper-wind'&&value?Math.sin(time*.8)*.045:0;
        const prism=game==='splendor'&&event==='prism-angle'?value*Math.PI*.35:0;
        const rhythm=game==='rhythm'&&event==='rhythm-bridge'&&value?Math.sin(time*2)*.04:0;
        let ry=T.MathUtils.lerp(chosen?-.2:Math.sin(angle)*.35,chosen?-.12:0,focus)+prism;
        if(!paused)ry+=Math.sin(time*.45+index)*.065;
        const amount = snap || paused || focus>0 || previousStoryFocus>0 ? 1 : 1 - Math.exp(-dt * 8);
        group.position.lerp(target, amount);
        group.scale.lerp(size.setScalar(scale), amount);
        group.rotation.x += (T.MathUtils.lerp(chosen?.15:.12,0,focus)+domino+wind - group.rotation.x) * amount;
        group.rotation.y += (ry - group.rotation.y) * amount;
        group.rotation.z += (T.MathUtils.lerp(chosen?-.1:Math.cos(angle)*.15,0,focus)+balance+rhythm - group.rotation.z) * amount;
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
