import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { approvedPawns, createLocalEventRig, createLocalEventState, jokerSources, localEventIds, nobleSources, pawnSource, stepBalance, restoreLocalEventState, LOCAL_EVENT_PREF_KEY, serializeLocalEventPreferences, paperGustHeight } from './LocalEventRig';

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


test('preserved output tabletop rig keeps the same drawing into ending without default toys there',()=>{
 const rig=createLocalEventRig(new THREE.Group());
 const state=createLocalEventState();
 rig.update(state,100,true,'tabletop');
 for(const id of ['L01','L04','L06'])assert.equal(namedGroup(rig.root,id).visible,true);
 assert.deepEqual(state.dominoTiles,[[1,2],[2,3],[3,4],[4,5]]);
 const drawing=namedGroup(rig.root,'L06');
 const saved={...state,strokes:[[{x:10,y:10},{x:40,y:20}]],drawingFlipped:true};
 rig.update(saved,200,true,'tabletop');const before=drawing.children[0];
 rig.update(saved,300,true,'ending');assert.equal(drawing.visible,true);assert.equal(drawing.children[0],before);
 assert.equal(namedGroup(rig.root,'L04').visible,false,'no unrelated shadow stage at ending');assert.equal(namedGroup(rig.root,'L01').visible,false,'ending does not invent a default domino result');
 rig.update({...saved,hasSavedDecor:true},400,true,'ending');assert.equal(namedGroup(rig.root,'L15').visible,true);
 rig.dispose();
});


test('Ruixen-adapted paper gust stays finite, bounded and pinned, and settles to the same sheet',()=>{
 for(const phase of [0,.1,.25,.5,.75,.9,1])for(let i=0;i<=24;i++)for(let j=0;j<=12;j++){
  const u=-1+i/12,v=-1+j/6,height=paperGustHeight(u,v,phase);
  assert.ok(Number.isFinite(height)&&height>=0&&height<=.68);
  if(i===0||i===24||j===0||j===12||phase===0||phase===1)assert.equal(height,0);
 }
 for(const value of [NaN,Infinity,-Infinity]){assert.equal(paperGustHeight(value,0,.5),0);assert.equal(paperGustHeight(0,value,.5),0);assert.equal(paperGustHeight(0,0,value),0);}
 assert.equal(paperGustHeight(0,0,.3,true),.5);
 const rig=createLocalEventRig(new THREE.Group()),state={...createLocalEventState(),active:'L14' as const};
 rig.update(state,100,true);const sheet=rig.root.getObjectByName('LOCAL_L14_CONTINUOUS_PAPER') as THREE.Mesh;
 assert.ok(sheet);assert.equal(sheet.geometry.getAttribute('position').count,49*25);
 const reward=rig.root.getObjectByName('WIND_REVEALED_DECOR') as THREE.Mesh;reward.geometry.computeBoundingBox();assert.ok(reward.position.y+reward.geometry.boundingBox!.max.y<sheet.position.y,'gem is genuinely below the resting paper');
 rig.update({...state,windRaised:true},200,true);sheet.geometry.computeBoundingBox();assert.ok(sheet.geometry.boundingBox!.max.y>=.49,'reduced motion provides the lifted result');assert.ok(reward.position.z>.475+.095,'reduced pose reveals the same gem past the near paper edge');
 const snapshot=Array.from(sheet.geometry.getAttribute('position').array);rig.update({...state,windRaised:true},600,true);assert.deepEqual(Array.from(sheet.geometry.getAttribute('position').array),snapshot,'static result does not ripple');
 rig.update(state,700,true);sheet.geometry.computeBoundingBox();assert.equal(sheet.geometry.boundingBox!.max.y,0);assert.equal(reward.position.z,0);const gust={...state,windRaised:true,motionSerial:1};rig.update(gust,1000,false);rig.update(gust,1425,false);assert.ok(reward.position.z>.57);rig.update(gust,1850,false);assert.ok(Math.abs(reward.position.z)<1e-9,'the gem returns beneath the settled sheet');rig.dispose();
});


test('keyboard discovery actions settle the same mesh result without persisting input modality',()=>{
 const rig=createLocalEventRig(new THREE.Group());
 const state={...createLocalEventState(),active:'L03' as const,pocketOpen:false};
 rig.update(state,100,false);
 const opened={...state,pocketOpen:true,motionSerial:1,motionInstant:true};
 assert.equal(rig.update(opened,116,false),false,'keyboard action schedules no hinge animation');
 const instant=transforms(namedGroup(rig.root,'L03')).map(item=>({position:item.position,rotation:item.rotation}));
 rig.update({...opened,motionInstant:false},1000,true);
 assert.deepEqual(transforms(namedGroup(rig.root,'L03')).map(item=>({position:item.position,rotation:item.rotation})),instant,'the completed paper shape matches the static result');
 assert.equal(JSON.parse(serializeLocalEventPreferences(opened)).motionInstant,undefined);
 rig.dispose();
});
