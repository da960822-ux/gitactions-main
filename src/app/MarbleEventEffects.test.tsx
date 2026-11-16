import { marbleRuntimeImage } from './marble-runtime-images';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MarblePropertyArt } from './MarblePropertyArt';
import { MarbleLandmarkCelebration, marbleTileEffect, preloadMarbleCharacter } from './MarbleEventEffects';
describe('confirmed Marble effect mapping', () => {
  it('only targets the confirmed event tile and positive sequence', () => {
    expect(marbleTileEffect({ sequence: 4, type: 'buy', tile: 3 }, 3)).toBe('purchase');
    expect(marbleTileEffect({ sequence: 4, type: 'buy', tile: 3 }, 2)).toBeNull();
    expect(marbleTileEffect({ sequence: 0, type: 'buy', tile: 3 }, 3)).toBeNull();
  });
  it('separates landmark, building, arrival and takeover without treating payments as draws', () => {
    for (const [type, expected] of [['arrival','arrival'],['build','build'],['takeover','takeover'],['rent',null],['event-card',null]] as const)
      expect(marbleTileEffect({ sequence: 2, type, tile: 3 }, 3)).toBe(expected);
    expect(marbleTileEffect({ sequence: 2, type:'build', tile: 3 }, 3, true)).toBe('landmark');
  });
});

it('inherits owner colors but reserves higher-specificity gold for landmark rays',()=>{const css=readFileSync(new URL('./marble-event-effects.css',import.meta.url),'utf8');expect(css).toContain('--fx-color:var(--mp-owner-color');expect(css).not.toMatch(/\.mp-fx\[data-fx-owner=p[1-4]\]/);expect(css).toContain('.mp-fx.mp-fx--landmark { --fx-color:#f6cc61; }');expect(css).toContain('@media (prefers-reduced-motion:reduce)');});

it('uses confirmed construction payload instead of a newer landmark snapshot',()=>{
  expect(marbleTileEffect({ sequence:3,type:'build',tile:1,landmark:false },1,true)).toBe('build');
  expect(marbleTileEffect({ sequence:4,type:'build',tile:1,landmark:true },1,false)).toBe('landmark');
  expect(marbleTileEffect({ sequence:5,type:'buy',tile:1,landmark:true },1,false)).toBe('landmark');
  expect(marbleTileEffect({ sequence:6,type:'buy',tile:1,landmark:false },1,true)).toBe('purchase');
});

for (const [city, character] of [['gwangju','yeonseok'],['seoul','yeonseok'],['new-york','lisbeth'],['santo-domingo','lisbeth']]) {
  it(`celebrates ${city} with ${character}, without changing its permanent building`,()=>{
    const ko=renderToStaticMarkup(createElement(MarbleLandmarkCelebration,{city,language:'ko'}));
    const es=renderToStaticMarkup(createElement(MarbleLandmarkCelebration,{city,language:'es'}));
    expect(ko).toContain(marbleRuntimeImage(`result-${character}-wins.png`));expect(ko).toContain('랜드마크 완성!');
    expect(es).toContain('¡Monumento de');expect(es).toContain('terminado!');
    const tile=renderToStaticMarkup(createElement(MarblePropertyArt,{city,landmark:true,routeVersion:5}));
    expect(tile).not.toContain('result-');expect(tile).toContain('data-building-level="3"');
  });
}
it('does not add unrequested characters to other cities',()=>{
  expect(renderToStaticMarkup(createElement(MarbleLandmarkCelebration,{city:'paris',language:'ko'}))).toBe('');
});

it('preloads each approved character once and waits for load success before showing a cameo',async()=>{
  const images: {onload?:()=>void;onerror?:()=>void;src:string}[]=[];
  class TestImage { src='';onload?:()=>void;onerror?:()=>void;constructor(){images.push(this);} }
  vi.stubGlobal('Image',TestImage);
  try {
    const male=preloadMarbleCharacter('yeonseok');
    expect(preloadMarbleCharacter('yeonseok')).toBe(male);
    expect(images).toHaveLength(1);
    expect(images[0].src).toBe(marbleRuntimeImage('result-yeonseok-wins.png'));
    const loaded=vi.fn();void male.then(loaded);await Promise.resolve();expect(loaded).not.toHaveBeenCalled();
    images[0].onload!();expect(await male).toBe(true);
    const female=preloadMarbleCharacter('lisbeth');
    expect(images).toHaveLength(2);expect(images[1].src).toContain(marbleRuntimeImage('result-lisbeth-wins.png'));
    images[1].onerror!();expect(await female).toBe(false);
    expect(preloadMarbleCharacter('lisbeth')).toBe(female);
    expect(images).toHaveLength(2);
  } finally {vi.unstubAllGlobals();}
});
