import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import journeyManifest from '../../public/images/marble/landmarks/manifest.json';
import { marbleEngine } from '../games/marble';
import cityManifest from '../../public/images/marble/cities/manifest.json';
import { MarblePropertyArt } from './MarblePropertyArt';

describe('Marble property shapes', () => {
  const render = (city: string, level: number) => renderToStaticMarkup(createElement(MarblePropertyArt, { city, level }));
  it('maps all 24 new-route cities to existing final faces and offers both common buildings', () => {
    const tiles = marbleEngine.getPlayerView(marbleEngine.createInitialState(1), 'p1').board.tiles;
    expect(journeyManifest.assets).toHaveLength(24);
    expect(new Set(journeyManifest.assets.map(asset => asset.path)).size).toBe(24);
    for (const asset of journeyManifest.assets) {
      expect(tiles[asset.tileIndex].name.es).toBe(asset.city);
      expect(existsSync(`public${asset.path}`)).toBe(true);
      expect(render(asset.slug, 3)).toContain(asset.path);
      expect(render(asset.slug, 1)).toContain('building-stages.svg#villa');
      expect(render(asset.slug, 2)).toContain('building-stages.svg#building');
    }
  });
  it('gives all 24 cities the same first and second building shapes and individual colors', () => {
    expect(cityManifest.assets).toHaveLength(24);
    for (const { slug } of cityManifest.assets) {
      expect(render(slug, 1)).toContain('building-stages.svg#villa');
      expect(render(slug, 2)).toContain('building-stages.svg#building');
      expect(render(slug, 1)).not.toContain('<img');
      expect(render(slug, 1)).toContain('color:#');
      expect(render(slug, 3)).toContain(`/${slug}.svg`);
      expect(render(slug, 3)).not.toContain('building-stages.svg');
    }
    expect(render('gwangju', 1)).not.toBe(render('santo-domingo', 1));
  });
  it('uses the two selected landmarks only at the final level, keeping unbuilt and legacy faces', () => {
    for (const city of ['gwangju', 'santo-domingo']) {
      expect(render(city, 0)).toContain(`/cities/${city}.svg`);
      expect(render(city, 3)).toContain(`/landmarks/${city}.svg`);
    }
  });
});
