import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import sharp from 'sharp';

// Board-sized derivatives only: original art and enlarged-view URLs stay unchanged.
const root = new URL('../public/images/splendor/', import.meta.url);
const art = JSON.parse(await readFile(new URL('card-map.json', root), 'utf8'));
await mkdir(new URL('board/', root), { recursive: true });
const manifest = {};
let originalBytes = 0, boardBytes = 0;
for (const { src, engineId } of [...art.cards, ...art.nobles]) {
  assert.match(src, /^(cards\/\d+\.jpg|custom-v2\/(t[23]-\d+|n\d+)\.webp)$/);
  const original = new URL(src, root);
  const buffer = await sharp(original.pathname).resize({ width: 320, withoutEnlargement: true }).webp({ quality: 84, effort: 6 }).toBuffer();
  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 12);
  const name = `board/${engineId}-${hash}.webp`;
  await writeFile(new URL(name, root), buffer);
  manifest[`/images/splendor/${src}`] = `/images/splendor/${name}`;
  originalBytes += (await stat(original)).size;
  boardBytes += buffer.length;
}
assert.equal(Object.keys(manifest).length, 106);
assert.ok(boardBytes < originalBytes / 4);
await writeFile(new URL('board-map.json', root), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ assets: Object.keys(manifest).length, originalBytes, boardBytes, reductionPercent: 100 * (1 - boardBytes / originalBytes) }, null, 2));
