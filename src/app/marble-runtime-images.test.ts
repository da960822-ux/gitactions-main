import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import sharp from 'sharp';
import manifest from '../../public/images/marble/runtime-images.json';
import { marbleLandmarkAsset } from './marble-world-theme';
import { marbleRuntimeImage } from './marble-runtime-images';

it('keeps approved originals and complete compositions with smaller alpha-preserving runtime assets', async () => {
  expect(manifest.assets).toHaveLength(9);
  for (const asset of manifest.assets) {
    const original = readFileSync(`public${asset.source}`);
    const runtime = readFileSync(`public${asset.path}`);
    expect(createHash('sha256').update(original).digest('hex')).toBe(asset.sourceSha256);
    expect(runtime.length).toBe(asset.bytes);
    expect(asset.path).toContain(createHash('sha256').update(runtime).digest('hex').slice(0, 12));
    expect(runtime.length).toBeLessThan(original.length / 2);
    const decoded = await sharp(runtime).metadata();
    expect([decoded.width, decoded.height, decoded.hasAlpha]).toEqual([asset.width, asset.height, asset.hasAlpha]);
    const character = asset.source.includes('/approved-couple-room/');
    const pipeline = sharp(original);
    if (!character) pipeline.resize({ width: 768, height: 768, fit: 'inside', withoutEnlargement: true });
    const resized = await pipeline.png().toBuffer();
    const expected = await sharp(resized).metadata();
    expect([decoded.width, decoded.height]).toEqual([expected.width, expected.height]);
    if (asset.hasAlpha) {
      const sourceAlpha = await sharp(resized).extractChannel('alpha').raw().toBuffer();
      const runtimeAlpha = await sharp(runtime).extractChannel('alpha').raw().toBuffer();
      expect(runtimeAlpha.equals(sourceAlpha)).toBe(true);
    }
  }
});

it('uses optimized landmarks without changing saved route identity or the approved landing art', () => {
  for (const city of ['puerto-plata', 'san-juan', 'miami', 'toronto', 'new-york', 'dubai']) {
    expect(manifest.assets.some(asset => asset.path === marbleLandmarkAsset(city))).toBe(true);
  }
  expect(() => marbleRuntimeImage('unapproved.png')).toThrow('Missing approved Marble runtime image');
  expect(marbleLandmarkAsset('newark', 5)).toBe('/images/marble/premium/cities/newark-sacred-heart.webp');
  expect(readFileSync('src/app/CoupleReactionArt.tsx', 'utf8')).toContain('/images/approved-couple-room/result-${reaction}-wins.png');
});
