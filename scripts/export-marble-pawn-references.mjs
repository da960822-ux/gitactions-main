import { build } from 'esbuild';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'marble-pawn-reference-'));
try {
  const output = path.join(temporary, 'render.cjs');
  await build({ stdin: { contents: "import {createElement} from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {MarblePawn} from './src/app/MarblePawn';export const render=pawn=>renderToStaticMarkup(createElement(MarblePawn,{pawn,language:'ko'}));", resolveDir: process.cwd(), loader: 'tsx' }, outfile: output, bundle: true, platform: 'node', format: 'cjs', packages: 'bundle', loader: { '.css': 'empty' } });
  const { render } = (await import(pathToFileURL(output).href)).default, folder = process.env.MARBLE_PAWN_REFERENCE_OUTPUT || 'output/marble-pawn-references';
  await fs.mkdir(folder, { recursive: true });
  for (const [id, name] of [['fox','maltipoo'],['penguin','panda'],['dragon','chinchilla']]) {
    const svg = render(id).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="150" ');
    assert.ok(svg.startsWith('<svg ') && svg.includes('viewBox="0 0 120 150"') && svg.endsWith('</svg>'));
    await fs.writeFile(`${folder}/${name}.svg`, svg + '\n');
  }
  console.log('Exported three requested reference SVGs from the unchanged runtime MarblePawn component; not new replacement art or approval of the final six-character roster.');
} finally { await fs.rm(temporary, { recursive: true, force: true }); }
