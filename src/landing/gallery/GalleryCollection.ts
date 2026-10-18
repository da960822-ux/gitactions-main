import * as T from 'three';
import {gameCatalog} from '../../games/catalog';
import {createGameObject, normalizeSculpture, studioMaterials} from './studioObjects';

const DESK_X=[-7.8,-5.7,-3.3,-1.7,3.3,5.7,7.8];
const DESK_Z=[-.7,-2,-3.2,-3.6,-3.2,-2,-.7];
const MOBILE_X=[-8,-3,3,8,-7,-3.5,6];
const MOBILE_Z=[2.8,2.8,2.8,2.8,7,7,7];

type Frame = {selected: string; time: number; paused: boolean; dt?: number; snap?: boolean; mobile?: boolean; effect?:{name:string;value:number;nonce:number}};

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
    const contactY=-new T.Box3().setFromObject(group).min.y;
    return {group, handles, contactY};
  });
  originalMaterials.forEach(material => material.dispose());
  let inputEnabled = true, previous = '';
  const target = new T.Vector3(), size = new T.Vector3(),rootOrigin=new T.Vector3(),rootScale=new T.Vector3(),contactBounds=new T.Box3();
  return {
    root,
    update({selected, time, paused, dt = 1 / 60, snap = false, mobile = false, effect}: Frame) {
      const changed = previous !== selected;
      const selectedIndex=gameCatalog.findIndex(game=>game.id===selected);
      root.getWorldPosition(rootOrigin);root.getWorldScale(rootScale);
      objects.forEach(({group, handles, contactY}, index) => {
        const chosen = gameCatalog[index].id === selected;
        const slot=index<selectedIndex?index:index-1;
        const scale=chosen?(mobile?1.55:1.9):mobile?1.2:1.12;
        target.set(chosen?0:(mobile?MOBILE_X[slot]:DESK_X[slot]),contactY*scale,chosen?(mobile?7:3.2):(mobile?MOBILE_Z[slot]:DESK_Z[slot]));
        const game=gameCatalog[index].id;
        const event=effect?.name??'none',value=effect?.value??0;
        const balance=game==='jaipur'&&event==='balance'?T.MathUtils.clamp(value/8,-1,1)*.12:0;
        const domino=game==='domino'&&event==='domino-chain'?T.MathUtils.clamp(value,0,1)*1.15:0;
        const wind=game==='catchmind'&&event==='paper-wind'&&value?Math.sin(time*.8)*.045:0;
        const prism=game==='splendor'&&event==='prism-angle'?value*Math.PI*.35:0;
        const rhythm=game==='rhythm'&&event==='rhythm-bridge'&&value?Math.sin(time*2)*.04:0;
        let ry=(chosen?-.12:-(target.x/6.4)*.14)+prism;
        if(!paused)ry+=Math.sin(time*.45+index)*.018;
        const amount = snap || paused ? 1 : 1 - Math.exp(-dt * 8);
        group.position.lerp(target, amount);
        group.scale.lerp(size.setScalar(scale), amount);
        group.rotation.x += ((chosen ? .08 : .06)+domino+wind - group.rotation.x) * amount;
        group.rotation.y += (ry - group.rotation.y) * amount;
        group.rotation.z += ((chosen ? -.025 : 0)+balance+rhythm - group.rotation.z) * amount;
        // Rotation changes the lowest point: settle each object after its final pose.
        group.updateWorldMatrix(true,true);
        contactBounds.setFromObject(group);
        group.position.y+=(rootOrigin.y-contactBounds.min.y)/rootScale.y;
        if (changed) handles.forEach(material => {
          material.color.copy(material.userData.baseColor).multiplyScalar(chosen ? 1 : .9);
          if (typeof material.userData.baseEnvironment === 'number') material.envMapIntensity = material.userData.baseEnvironment * (chosen ? 1 : .9);
        });
      });
      previous = selected;
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
