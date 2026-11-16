import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import sharp from 'sharp';
import { expect, it } from 'vitest';
import { MarblePropertyArt } from './MarblePropertyArt';
import { marbleLandmarkAsset, marbleLandmarkNote } from './marble-world-theme';

it('ships the approved whole palace as an immutable transparent 768px image', async () => {
  const path = marbleLandmarkAsset('seoul', 5)!;
  const bytes = readFileSync(`public${path}`);
  expect(path).toBe(`/images/marble/runtime/seoul-gyeongbokgung-${createHash('sha256').update(bytes).digest('hex').slice(0,12)}.webp`);
  const metadata = await sharp(bytes).metadata();
  expect([metadata.width, metadata.height, metadata.hasAlpha]).toEqual([768,768,true]);
  const alpha = await sharp(bytes).extractChannel('alpha').raw().toBuffer();
  expect(alpha.includes(0)).toBe(true);
  expect(alpha.includes(255)).toBe(true);
  // Ignore near-invisible generation residue; every visible edge retains padding.
  for (let y=0;y<768;y++) for (let x=0;x<768;x++) {
    if (alpha[y*768+x]>10) expect(x>50&&x<718&&y>50&&y<718).toBe(true);
  }
  expect(marbleLandmarkNote('seoul','ko',5)).toContain('경복궁 근정전');
  expect(marbleLandmarkNote('seoul','es',5)).toContain('Palacio Gyeongbokgung');
});

it('uses the palace only for completed Seoul landmarks, never a permanent character', () => {
  for (const routeVersion of [3,4,5]) {
    const html=renderToStaticMarkup(<MarblePropertyArt city="seoul" routeVersion={routeVersion} landmark buildings={[]}/>);
    expect(html).toContain(marbleLandmarkAsset('seoul',routeVersion));
    expect(html).not.toMatch(/yeonseok|n-seoul-tower/);
    const vacant=renderToStaticMarkup(<MarblePropertyArt city="seoul" routeVersion={routeVersion} buildings={[]}/>);
    expect(vacant).not.toContain('seoul-gyeongbokgung');
  }
});
