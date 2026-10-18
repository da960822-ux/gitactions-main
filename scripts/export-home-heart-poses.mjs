import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { launchChromium } from './playwright-browser.mjs';

const base = process.env.HOME_ASSET_URL || 'http://127.0.0.1:5230';
const folder = 'public/images/landing-preview/hero';
const browser = await launchChromium(), page = await browser.newPage({ viewport: { width: 1440, height: 816 } });
await page.route('**/asset-export-blank.html', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body style="margin:0"></body></html>' }));
await page.goto(base + '/asset-export-blank.html');
const result = await page.evaluate(async () => {
  const T = await import('/node_modules/three/build/three.module.js');
  const { createHeartGeometry } = await import('/src/preview/heartGeometry.ts');
  const { createHeroMaterials } = await import('/src/preview/heroMaterials.ts');
  const renderer = new T.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(1440, 816); renderer.setPixelRatio(1); renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  const scene = new T.Scene(), camera = new T.PerspectiveCamera(38, 1440 / 816, .1, 50); camera.position.set(0, 0, 11.8);
  const environment = new T.Scene(); environment.background = new T.Color('#121016');
  for (const [x, y, z, width, height] of [[-5,4,5,4,7],[5,1,2,2,6],[0,6,-2,7,2],[0,-3,4,5,1]]) {
    const panel = new T.Mesh(new T.PlaneGeometry(width, height), new T.MeshBasicMaterial({ color: '#fff2e8', side: T.DoubleSide }));
    panel.position.set(x, y, z); panel.lookAt(0, 0, 0); environment.add(panel);
  }
  const generator = new T.PMREMGenerator(renderer); scene.environment = generator.fromScene(environment, .06).texture;
  const key = new T.DirectionalLight('#ffe5d1', 3); key.position.set(-4, 6, 8); scene.add(key);
  const rim = new T.DirectionalLight('#c6caff', 1.7); rim.position.set(5, 2, -3); scene.add(rim); scene.add(new T.HemisphereLight('#d5cbd6', '#110d13', .55));
  const materials = createHeroMaterials(), layout = [[-3.15,.65,.55,.60,-.25],[3.5,1.45,-1.1,.47,.16],[3.15,-1.7,.65,.56,.28]];
  const groups = layout.map(([x,y,z,size,angle], i) => {
    const group = new T.Group(); group.add(new T.Mesh(createHeartGeometry(), materials[i])); group.position.set(x,y,z); group.scale.setScalar(size); group.rotation.set(.13,-.2,angle); scene.add(group); return group;
  });
  const png = () => renderer.domElement.toDataURL('image/png').split(',')[1];
  renderer.render(scene, camera); const neutral = png(), assets = [], boxes = [];
  for (let i = 0; i < groups.length; i++) {
    camera.clearViewOffset(); camera.aspect = 1440 / 816; camera.updateProjectionMatrix();
    const points = [], group = groups[i], mesh = group.children[0], positions = mesh.geometry.attributes.position;
    for (const pose of [-1, 0, 1]) {
      group.rotation.set(.13 + pose * .055, -.2 + pose * .17, layout[i][4]); group.updateMatrixWorld(true);
      for (let vertex = 0; vertex < positions.count; vertex++) points.push(new T.Vector3().fromBufferAttribute(positions, vertex).applyMatrix4(mesh.matrixWorld).project(camera));
    }
    const left = Math.floor(Math.min(...points.map(p => (p.x+1)*720))-12), top = Math.floor(Math.min(...points.map(p => (1-p.y)*408))-12);
    const right = Math.ceil(Math.max(...points.map(p => (p.x+1)*720))+12), bottom = Math.ceil(Math.max(...points.map(p => (1-p.y)*408))+12);
    const box = [left, top, right-left, bottom-top]; boxes.push(box);
    groups.forEach((other, index) => other.visible = index === i); camera.setViewOffset(1440, 816, ...box); renderer.setSize(box[2], box[3]);
    for (const [name, pose] of [['left', -1], ['neutral', 0], ['right', 1]]) {
      group.rotation.set(.13 + pose * .055, -.2 + pose * .17, layout[i][4]); renderer.render(scene, camera);
      assets.push({ name: `heart-${i}-${name}.png`, data: png() });
    }
  }
  renderer.dispose(); return { neutral, assets, boxes, fixedKey: key.position.toArray() };
});
assert.deepEqual(result.fixedKey, [-4, 6, 8]);
assert.equal(new Set(result.assets.map(asset => asset.name)).size, 9);
assert.ok(result.boxes.every(([left, top, width, height]) => left >= 0 && top >= 0 && width > 0 && height > 0 && left + width <= 1440 && top + height <= 816));
for (const asset of [{ name: 'hearts-neutral.png', data: result.neutral }, ...result.assets]) assert.equal(Buffer.from(asset.data, 'base64').subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
await fs.writeFile(`${folder}/hearts-neutral.png`, Buffer.from(result.neutral, 'base64'));
for (const asset of result.assets) await fs.writeFile(`${folder}/${asset.name}`, Buffer.from(asset.data, 'base64'));
const layoutPath = 'src/preview/heroRasterLayout.json', layout = JSON.parse(await fs.readFile(layoutPath, 'utf8'));
await fs.writeFile(layoutPath, JSON.stringify({ ...layout, hearts: result.boxes }, null, 2) + '\n');
await browser.close();
console.log(JSON.stringify({ assets: result.assets.length + 1, boxes: result.boxes, fixedKey: result.fixedKey, note: 'Original 3D geometry, fixed light, three bounded front poses. PNG fallback blends these poses; it does not create a back face or run a 3D renderer.' }));
