import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Offline rebuild: source OGGs and their original CC0 notices are checked in. Requires ffmpeg.
const root = resolve('public/audio/contextual');
const rate = 48000;
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const sources = [
  { id: 'casino', title: 'Kenney Casino Audio 1.1', sourceUrl: 'https://kenney.nl/assets/casino-audio', archiveUrl: 'https://kenney.nl/media/pages/assets/casino-audio/2472606a04-1721639069/kenney_casino-audio.zip', archiveSha256: 'f36250766ac5bc378c13708ddf12a23a8e54a3251f8d482c7536e51b5dbafa18', licenseFile: 'source/casino/LICENSE.txt' },
  { id: 'impact', title: 'Kenney Impact Sounds 1.0', sourceUrl: 'https://kenney.nl/assets/impact-sounds', archiveUrl: 'https://kenney.nl/media/pages/assets/impact-sounds/87b4ddecda-1677589768/kenney_impact-sounds.zip', archiveSha256: '029d734af1582474edf3a694d1b0cebc97c1c152f2f39fa34d4c2bafc5de77f8', licenseFile: 'source/impact/LICENSE.txt' },
  { id: 'interface', title: 'Kenney Interface Sounds 1.0', sourceUrl: 'https://kenney.nl/assets/interface-sounds', archiveUrl: 'https://kenney.nl/media/pages/assets/interface-sounds/fa43c1dd4d-1677589452/kenney_interface-sounds.zip', archiveSha256: 'f2193d072726d6758a5f7871b2dcc54dcce0d5c35c6f0a62f92549b327c81232', licenseFile: 'source/interface/LICENSE.txt' },
];
// family, variant, output milliseconds, material, [source, offset ms, crop ms, gain]
const recipes = [
  ['dice', 1, 620, 'Real dice shake followed by a dice throw', [['casino/dice-shake-1.ogg', 0, 390, 0.75], ['casino/dice-throw-1.ogg', 365, 255, 1]]],
  ['dice', 2, 620, 'Alternate real dice shake and throw', [['casino/dice-shake-2.ogg', 0, 390, 0.75], ['casino/dice-throw-2.ogg', 365, 255, 1]]],
  ['step', 1, 110, 'Light wood contact for a board pawn step', [['impact/impactWood_light_000.ogg', 0, 110, 1]]],
  ['step', 2, 110, 'Alternate light wood contact for a board pawn step', [['impact/impactWood_light_001.ogg', 0, 110, 1]]],
  ['tile', 1, 155, 'Medium wooden tile contact', [['impact/impactWood_medium_000.ogg', 0, 155, 1]]],
  ['tile', 2, 155, 'Alternate medium wooden tile contact', [['impact/impactWood_medium_001.ogg', 0, 155, 1]]],
  ['card', 1, 150, 'Real card slide', [['casino/card-slide-1.ogg', 0, 150, 1]]],
  ['card', 2, 150, 'Alternate real card slide', [['casino/card-slide-2.ogg', 0, 150, 1]]],
  ['coin', 1, 180, 'Casino chip collisions as a stylized money-token proxy', [['casino/chips-collide-1.ogg', 0, 180, 1]]],
  ['coin', 2, 180, 'Alternate casino chip collisions as a money-token proxy', [['casino/chips-collide-2.ogg', 0, 180, 1]]],
  ['build', 1, 330, 'Two wood impacts for construction, not a building recording', [['impact/impactWood_heavy_000.ogg', 0, 190, 0.8], ['impact/impactWood_heavy_001.ogg', 130, 200, 1]]],
  ['key', 1, 320, 'Light metallic contact as a golden-key proxy', [['impact/impactMetal_light_000.ogg', 0, 320, 1]]],
  ['blackout', 1, 275, 'Switch click with short electrical glitch', [['interface/switch_001.ogg', 0, 120, 0.8], ['interface/glitch_001.ogg', 65, 210, 1]]],
  ['jail', 1, 300, 'Heavy metal contact as a barred-door proxy', [['impact/impactMetal_heavy_000.ogg', 0, 300, 1]]],
  ['arrival', 1, 420, 'Small arrival bell, cropped and faded', [['impact/impactBell_heavy_004.ogg', 0, 420, 1]]],
  ['pass', 1, 140, 'Card shove as a deliberate pass gesture', [['casino/card-shove-1.ogg', 0, 140, 1]]],
  ['travel', 1, 460, 'Interface rising swoosh as a world-travel transition', [['interface/maximize_001.ogg', 0, 460, 1]]],
  ['gem', 1, 210, 'Light glass contact for a gem token', [['impact/impactGlass_light_000.ogg', 0, 210, 1]]],
];

function decode(relative, durationMs) {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', resolve(root, 'source', relative), '-f', 'f32le', '-ac', '1', '-ar', String(rate), 'pipe:1']);
  const pcm = Array.from({ length: raw.length / 4 }, (_, i) => raw.readFloatLE(i * 4));
  assert(pcm.length > 0 && pcm.every(Number.isFinite), `${relative}: invalid decoded PCM`);
  const onset = Math.max(0, pcm.findIndex(value => Math.abs(value) > 0.002) - 48);
  const length = Math.round(durationMs * rate / 1000);
  const cropped = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const fade = Math.min(1, i / 48, (length - 1 - i) / 480);
    cropped[i] = (pcm[onset + i] ?? 0) * Math.max(0, fade);
  }
  return cropped;
}

function wav(samples) {
  const data = Buffer.alloc(44 + samples.length * 2);
  data.write('RIFF'); data.writeUInt32LE(data.length - 8, 4); data.write('WAVEfmt ', 8);
  data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22);
  data.writeUInt32LE(rate, 24); data.writeUInt32LE(rate * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34);
  data.write('data', 36); data.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) data.writeInt16LE(Math.round(samples[i] * 32767), 44 + i * 2);
  return data;
}

mkdirSync(root, { recursive: true });
const files = recipes.map(([family, variant, durationMs, material, components]) => {
  const mixed = new Float32Array(Math.round(durationMs * rate / 1000));
  for (const [source, offset, crop, gain] of components) {
    const part = decode(source, crop);
    const start = Math.round(offset * rate / 1000);
    for (let i = 0; i < part.length && start + i < mixed.length; i++) mixed[start + i] += part[i] * gain;
  }
  const peak = mixed.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
  assert(peak > 0, `${family}: silent source`);
  // -6.1 dBFS leaves a margin for PCM quantization and runtime pitch variation.
  const scale = 10 ** (-6.1 / 20) / peak;
  for (let i = 0; i < mixed.length; i++) mixed[i] *= scale;
  const output = wav(mixed);
  const peakPcm = Array.from({ length: mixed.length }, (_, i) => Math.abs(output.readInt16LE(44 + i * 2) / 32768)).reduce((a, b) => Math.max(a, b), 0);
  const peakDbFS = 20 * Math.log10(peakPcm);
  assert(peakDbFS <= -6 && durationMs >= 35 && durationMs <= 700);
  assert(output.readUInt16LE(22) === 1 && output.readUInt32LE(24) === rate);
  const file = `${family}-${variant}.wav`;
  writeFileSync(resolve(root, file), output);
  const sourceFiles = [...new Set(components.map(([source]) => `source/${source}`))];
  return {
    file, family, source: sourceFiles[0], sourceSha256: sha256(readFileSync(resolve(root, sourceFiles[0]))),
    sourceFiles, sourceFileHashes: Object.fromEntries(sourceFiles.map(source => [source, sha256(readFileSync(resolve(root, source)))])),
    durationMs, sampleRate: rate, channels: 1, peakDbFS: Number(peakDbFS.toFixed(4)), sha256: sha256(output),
    material, processing: 'Decode mono 48kHz; trim to >0.002 onset with 1ms lead; recipe crop/offset; 1ms attack and 10ms release fades; composite; normalize to -6.1dBFS; PCM16 WAV',
    components: components.map(([source, offsetMs, cropMs, gain]) => ({ source: `source/${source}`, offsetMs, cropMs, gain })),
  };
});
assert.equal(new Set(files.map(file => file.sha256)).size, files.length, 'Every sample must be physically distinct');
writeFileSync(resolve(root, 'manifest.json'), JSON.stringify({
  license: 'CC0-1.0', author: 'Kenney', verifiedOn: '2026-10-27', sources, files,
  verification: { decoded: 'ffmpeg PCM decode and WAV header/peak assertions', listening: 'Not auditioned by a human; no listening approval claimed' },
}, null, 2) + '\n');
console.log(`Verified ${files.length} contextual WAV files; ${files.reduce((sum, file) => sum + readFileSync(resolve(root, file.file)).length, 0)} bytes; all <= -6dBFS.`);

if (process.argv.includes('--verify-browser')) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH ?? '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    const rendered = [];
    for (const file of files) {
      const result = await page.evaluate(async base64 => {
        const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0));
        const context = new OfflineAudioContext(1, 48000, 48000);
        const decoded = await context.decodeAudioData(bytes.buffer);
        const source = context.createBufferSource(); source.buffer = decoded; source.connect(context.destination); source.start(0);
        const pcm = (await context.startRendering()).getChannelData(0);
        let peak = 0, nonzero = 0;
        for (const sample of pcm) { peak = Math.max(peak, Math.abs(sample)); if (sample !== 0) nonzero++; }
        return { durationMs: decoded.duration * 1000, channels: decoded.numberOfChannels, sampleRate: decoded.sampleRate, peakDbFS: 20 * Math.log10(peak), nonzeroSamples: nonzero };
      }, readFileSync(resolve(root, file.file)).toString('base64'));
      assert(Math.abs(result.durationMs - file.durationMs) < 0.01 && result.peakDbFS <= -6 && result.nonzeroSamples > 100 && result.channels === 1 && result.sampleRate === rate);
      rendered.push({ file: file.file, ...result });
    }
    writeFileSync(resolve(root, 'verification.json'), JSON.stringify({ date: '2026-10-27', browser: await browser.version(), method: 'Chromium OfflineAudioContext WAV decode, unity-gain BufferSource, one-second mono 48kHz render', listening: 'Numeric render verification only; not human-auditioned', files: rendered }, null, 2) + '\n');
    console.log(`Chromium decoded and rendered all ${rendered.length} files successfully.`);
  } finally { await browser.close(); }
}
