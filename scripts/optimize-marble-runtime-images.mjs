import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';

// Runtime derivatives only: keep the complete approved composition and all source files.
const directory = 'public/images/marble/premium/cities/world-iconic-v2';
const sources = (await readdir(directory)).filter(file => file.endsWith('.png')).map(file => `${directory}/${file}`);
sources.push(...['yeonseok', 'lisbeth'].map(character => `public/images/approved-couple-room/result-${character}-wins.png`));
await mkdir('public/images/marble/runtime', { recursive: true });
const assets = [];
for (const source of sources) {
  const original = await readFile(source);
  const metadata = await sharp(original).metadata();
  const character = source.includes('approved-couple-room');
  const pipeline = sharp(original);
  if (!character) pipeline.resize({ width: 768, height: 768, fit: 'inside', withoutEnlargement: true });
  const resized = await pipeline.png().toBuffer();
  const output = await sharp(resized).webp({ quality: character ? 94 : 92, alphaQuality: 100, effort: 6 }).toBuffer();
  const hash = createHash('sha256').update(output).digest('hex').slice(0, 12);
  const destination = `public/images/marble/runtime/${source.split('/').at(-1).replace('.png', '')}-${hash}.webp`;
  const decoded = await sharp(output).metadata();
  assert.equal(decoded.hasAlpha, metadata.hasAlpha);
  assert.ok(Math.abs(decoded.width / decoded.height - metadata.width / metadata.height) < .003);
  assert.ok(output.length < original.length);
  if (metadata.hasAlpha) {
    const expected = await sharp(resized).extractChannel('alpha').raw().toBuffer();
    const actual = await sharp(output).extractChannel('alpha').raw().toBuffer();
    assert.ok(actual.equals(expected), `Alpha preserved: ${source}`);
  }
  await writeFile(destination, output);
  assets.push({ source: source.replace('public', ''), path: destination.replace('public', ''), sourceBytes: original.length, bytes: output.length, sourceWidth: metadata.width, sourceHeight: metadata.height, width: decoded.width, height: decoded.height, hasAlpha: decoded.hasAlpha, sourceSha256: createHash('sha256').update(original).digest('hex') });
}
const manifest = { policy: 'Uncropped WebP quality92, longest edge768, lossless alpha; cameos quality94 at original dimensions. Original PNGs unchanged. No timing claims.', sourceBytes: assets.reduce((sum, asset) => sum + asset.sourceBytes, 0), bytes: assets.reduce((sum, asset) => sum + asset.bytes, 0), assets };
await writeFile('public/images/marble/runtime-images.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));
