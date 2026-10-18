import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { approvedPawns, createLocalEventRig, createLocalEventState, jokerSources, localEventIds, nobleSources, pawnSource, stepBalance, restoreLocalEventState, LOCAL_EVENT_PREF_KEY, serializeLocalEventPreferences } from './LocalEventRig';

const context = {
  clearRect() {}, fillText() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {},
  set fillStyle(_value: string) {}, set font(_value: string) {}, set textAlign(_value: CanvasTextAlign) {}, set textBaseline(_value: CanvasTextBaseline) {},
};
const canvas = { width: 1, height: 1, getContext: () => context } as unknown as HTMLCanvasElement;
const originalLoad = THREE.TextureLoader.prototype.load;
THREE.TextureLoader.prototype.load = function (_url, onLoad) {
  const texture = new THREE.Texture<HTMLImageElement>({ width: 1024, height: 1024 } as HTMLImageElement);
  onLoad?.(texture);
  return texture;
};
Object.defineProperty(globalThis, 'document', { configurable: true, value: { createElement: () => canvas } });

function namedGroup(root: THREE.Group, id: string) {
  const group = root.children.find(child => child.name === id);
  assert.ok(group instanceof THREE.Group, `expected named ${id} group`);
  return group;
}
function transforms(root: THREE.Object3D) {
  const result: Array<{ node: THREE.Object3D; position: number[]; rotation: THREE.EulerTuple }> = [];
  root.traverse(node => result.push({ node, position: node.position.toArray(), rotation: node.rotation.toArray() }));
  return result;
}

test('owns sixteen named event groups under its child root and leaves the host camera alone', () => {
  const parent = new THREE.Group(), camera = new THREE.PerspectiveCamera();
  camera.position.set(2, 3, 4); camera.rotation.set(.1, .2, .3); parent.add(camera);
  const before = { position: camera.position.toArray(), rotation: camera.rotation.toArray() };
  const rig = createLocalEventRig(parent);
  assert.equal(rig.root.parent, parent);
  assert.equal(rig.root.name, 'local-sixteen-props');
  assert.deepEqual(rig.root.children.map(child => child.name), [...localEventIds]);
  assert.equal(new Set(rig.root.children.map(child => child.name)).size, 16);
  for (const id of localEventIds) {
    const group = namedGroup(rig.root, id);
    let hasGeometry = false;
    group.traverse(child => { if (child instanceof THREE.Mesh) hasGeometry = true; });
    assert.ok(hasGeometry, `${id} should contain visible geometry`);
  }
  const state = { ...createLocalEventState(), active: 'L16' as const };
  assert.equal(rig.update(state, 0, true), false);
  assert.deepEqual({ position: camera.position.toArray(), rotation: camera.rotation.toArray() }, before);
  rig.dispose();
  assert.equal(rig.root.parent, null);
});

test('keeps the approved pawn IDs mapped to their supplied runtime sources', () => {
  assert.deepEqual(approvedPawns.map(pawn => pawn.id), ['robot', 'sali-suli', 'astronaut', 'fox', 'cat', 'penguin', 'dragon']);
  assert.deepEqual(approvedPawns.map((_, index) => pawnSource(index)), [
    '/images/marble/premium/pawns/lisyeon.webp',
    '/images/marble/premium/pawns/sali-suli.webp',
    '/images/marble/premium/pawns/astronaut-rose-heart.webp',
    '/images/marble/premium/pawns/maltipoo.webp',
    '/images/marble/premium/pawns/ragdoll.webp',
    '/images/marble/premium/pawns/panda.webp',
    '/images/marble/premium/pawns/chinchilla.webp',
  ]);
  assert.deepEqual(jokerSources, ['/images/davinci/joker-couple-waterfront.webp', '/images/davinci/joker-couple-indoor.webp']);
  assert.deepEqual(nobleSources, ['/images/splendor/nobles/doctor-noble-portrait.webp', '/images/splendor/nobles/hanbok-noble-frontal.webp']);
});

test('L01 moves the dominoes and opens its drawer in the completed pose', () => {
  const rig = createLocalEventRig(new THREE.Group());
  const base = { ...createLocalEventState(), active: 'L01' as const };
  rig.update(base, 100, false);
  const before = transforms(namedGroup(rig.root, 'L01'));
  rig.update({ ...base, dominoFallen: true, motionSerial: 1 }, 200, false);
  const animating = rig.update({ ...base, dominoFallen: true, motionSerial: 1 }, 1_050, false);
  const after = transforms(namedGroup(rig.root, 'L01'));
  assert.equal(animating, false);
  assert.ok(after.some(item => item.node instanceof THREE.Group && Math.abs(item.node.position.z - .42) < .001));
  assert.ok(after.some((item, index) => item.node instanceof THREE.Group && item.rotation[2] !== before[index]?.rotation[2]));
  rig.dispose();
});

test('L08 follows a full rail orbit and returns the pawn to its starting pose', () => {
  const rig = createLocalEventRig(new THREE.Group());
  const state = { ...createLocalEventState(), active: 'L08' as const, railStep: 8 };
  rig.update(state, 100, false);
  const rail = namedGroup(rig.root, 'L08');
  const rider = rail.children.find(child => child instanceof THREE.Group && child.children.length === approvedPawns.length + 1);
  assert.ok(rider instanceof THREE.Group);
  const initial = rider.position.toArray();
  assert.equal(rig.update(state, 525, false), true);
  assert.notDeepEqual(rider.position.toArray(), initial);
  assert.equal(rig.update(state, 950, false), false);
  assert.ok(rider.position.distanceTo(new THREE.Vector3(...initial as [number, number, number])) < 1e-6);
  rig.dispose();
});

test('balance steps stay within the tray and settle when level near the center', () => {
  let pose = { position: 0, velocity: 0, settled: false };
  for (let i = 0; i < 20_000; i++) {
    pose = stepBalance(pose, 8, 1 / 60);
    assert.ok(Number.isFinite(pose.position) && Number.isFinite(pose.velocity));
    assert.ok(Math.abs(pose.position) <= .85);
  }
  const settled = stepBalance({ position: .02, velocity: .01, settled: false }, 0, 1 / 60);
  assert.deepEqual(settled, { position: 0, velocity: 0, settled: true });
});

test.after(() => {
  THREE.TextureLoader.prototype.load = originalLoad;
  delete (globalThis as { document?: unknown }).document;
});


test('restores only validated preferences from the existing versioned key', () => {
  let requested='';
  const state=restoreLocalEventState('es',{getItem:key=>{requested=key;return JSON.stringify({effectsEnabled:false,stamp:'heart',decor:'clip',pawn:6,decorSlot:2,active:'L14',strokes:[[{x:1,y:2}]]});}});
  assert.equal(requested,'post-hero-preview:v1');assert.equal(requested,LOCAL_EVENT_PREF_KEY);
  assert.equal(state.language,'es');assert.equal(state.effectsEnabled,false);assert.equal(state.stamp,'heart');
  assert.equal(state.decorKind,'clip');assert.equal(state.decorPawn,6);assert.equal(state.decorSlot,2);
  assert.equal(state.hasSavedDecor,true);
  assert.equal(state.active,null);assert.deepEqual(state.strokes,[]);
  const invalid=restoreLocalEventState('ko',{getItem:()=>'{"decorKind":"other","pawn":7,"decorSlot":-1,"stamp":"other"}'});
  assert.equal(invalid.decorKind,'gem');assert.equal(invalid.decorPawn,0);assert.equal(invalid.decorSlot,1);assert.equal(invalid.stamp,'YL');
  assert.equal(invalid.hasSavedDecor,false);
  assert.deepEqual(restoreLocalEventState('ko',{getItem:()=>{throw Error('blocked');}}),createLocalEventState('ko'));
  assert.deepEqual(restoreLocalEventState('ko',{getItem:()=>'{bad'}),createLocalEventState('ko'));
});

test('L01 and L15 use the same drawer and idle renders only the saved decoration', () => {
  const rig=createLocalEventRig(new THREE.Group());
  const state={...createLocalEventState(),active:'L01' as const};
  rig.update(state,100,true);
  const drawer=rig.root.getObjectByName('LOCAL_DECOR_DRAWER');assert.ok(drawer);
  assert.equal(drawer.parent,namedGroup(rig.root,'L01'));
  rig.update({...state,active:'L15',drawerOpen:true},200,true);
  assert.equal(rig.root.getObjectByName('LOCAL_DECOR_DRAWER'),drawer);
  assert.equal(drawer.parent,namedGroup(rig.root,'L15'));
  const idleDefault=createLocalEventState();
  assert.equal(rig.update(idleDefault,300,false),false);
  assert.equal(rig.root.visible,false);
  assert.equal(rig.update({...state,active:null,decorKind:'pawn',decorPawn:6,decorSlot:2,hasSavedDecor:true},400,false),false);
  assert.equal(rig.root.visible,true);
  assert.deepEqual(rig.root.children.filter(node=>node.visible).map(node=>node.name),['L15']);
  assert.equal(drawer.visible,false);
  let drawers=0;rig.root.traverse(node=>{if(node.name==='LOCAL_DECOR_DRAWER')drawers++;});assert.equal(drawers,1);
  rig.dispose();
});

test('saved decoration requires a valid explicit choice; effects and stamps alone stay idle',()=>{
  const restore=(value:unknown)=>restoreLocalEventState('ko',{getItem:()=>JSON.stringify(value)});
  assert.equal(createLocalEventState().hasSavedDecor,false);
  assert.equal(restore({effectsEnabled:false,stamp:'heart'}).hasSavedDecor,false);
  assert.equal(restore({decorKind:'gem',pawn:0,decorSlot:1,effectsEnabled:false,stamp:'heart'}).hasSavedDecor,false);
  assert.equal(restore({decorKind:'pawn',pawn:6,decorSlot:2}).hasSavedDecor,true);
  assert.equal(restore({decor:'clip'}).hasSavedDecor,true);
  assert.equal(restore({hasSavedDecor:true,decorKind:'pawn',pawn:7,decorSlot:1}).hasSavedDecor,false);
  assert.equal(restore({hasSavedDecor:false,decorKind:'clip'}).hasSavedDecor,false);
  const serialized=JSON.parse(serializeLocalEventPreferences({...createLocalEventState(),decorKind:'pawn',decorPawn:3,decorSlot:0,hasSavedDecor:true}));
  assert.deepEqual({hasSavedDecor:serialized.hasSavedDecor,decorKind:serialized.decorKind,pawn:serialized.pawn,decorSlot:serialized.decorSlot},{hasSavedDecor:true,decorKind:'pawn',pawn:3,decorSlot:0});
});
