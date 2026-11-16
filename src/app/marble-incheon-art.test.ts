import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { expect, it } from 'vitest';
import { marbleDisplayName, marbleLandmarkAsset, marbleLandmarkNote } from './marble-world-theme';

it('ships the approved airport as an immutable transparent 768px runtime image', async () => {
  const path = marbleLandmarkAsset('incheon', 5)!;
  const bytes = readFileSync(`public${path}`);
  expect(path).toBe(`/images/marble/runtime/incheon-airport-${createHash('sha256').update(bytes).digest('hex').slice(0,12)}.webp`);
  const metadata = await sharp(bytes).metadata();
  expect([metadata.width, metadata.height, metadata.hasAlpha]).toEqual([768,768,true]);
  const alpha = await sharp(bytes).extractChannel('alpha').raw().toBuffer();
  expect(alpha.includes(0)).toBe(true);
  expect(alpha.includes(255)).toBe(true);
  expect(marbleLandmarkNote('incheon','es',5)).toContain('Aeropuerto');
});

it('does not remap saved city names or replace unrelated city landmarks', () => {
  for (const names of [{ko:'인천',es:'Incheon'},{ko:'서울',es:'Seúl'},{ko:'산토도밍고',es:'Santo Domingo'}]) {
    const saved = {...names};
    expect(marbleDisplayName(names,'ko')).toBe(names.ko);
    expect(marbleDisplayName(names,'es')).toBe(names.es);
    expect(names).toEqual(saved);
  }
  expect(marbleLandmarkAsset('seoul',5)).toContain('seoul-gyeongbokgung-');
  expect(marbleLandmarkAsset('santo-domingo',5)).toBeUndefined();
  expect(marbleLandmarkAsset('newark',3)).toContain('dubai-burj-khalifa');
  expect(marbleLandmarkAsset('newark',5)).toBe('/images/marble/premium/cities/newark-sacred-heart.webp');
});
