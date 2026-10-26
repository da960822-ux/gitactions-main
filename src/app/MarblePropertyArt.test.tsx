import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import dioramas from '../../public/images/marble/dioramas/manifest.json';
import journeyManifest from '../../public/images/marble/landmarks/manifest.json';
import { marbleEngine } from '../games/marble';
import cityManifest from '../../public/images/marble/cities/manifest.json';
import { MarblePropertyArt } from './MarblePropertyArt';

describe('Marble property shapes', () => {
  const render = (city: string, level: number) => renderToStaticMarkup(createElement(MarblePropertyArt, { city, level }));
  it('maps all 24 new-route cities to existing final faces and offers both common buildings', () => {
    const tiles = marbleEngine.getPlayerView({ ...marbleEngine.createInitialState(1), cityRouteVersion: 2 }, 'p1').board.tiles;
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
  it('connects the complete approved route inventory to local verified WebP assets', () => {
    const tiles = marbleEngine.getPlayerView(marbleEngine.createInitialState(1), 'p1').board.tiles;
    expect(dioramas.assets).toHaveLength(24);
    for (const asset of dioramas.assets) {
      expect(tiles[asset.tileIndex].name.es).toBe(asset.city);
      const html = renderToStaticMarkup(createElement(MarblePropertyArt, { city: asset.slug, level: 3, routeVersion: 3, language: 'es' }));
      expect(asset.path).toMatch(/^\/images\/marble\/premium\/cities\/.+\.webp$/);
      expect(existsSync(`public${asset.path}`)).toBe(true);
      expect(html).toContain(asset.path!);
      expect(html).not.toContain('Imagen pendiente');
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
  it('uses the same verified common raster shapes with city tinting and preserves unbuilt land', () => {
    for (const { slug } of dioramas.assets) {
      for (const level of [1, 2]) {
        const html = renderToStaticMarkup(createElement(MarblePropertyArt, { city: slug, level, routeVersion: 3 }));
        expect(html).toContain(level === 1 ? dioramas.commonStages.house.path! : dioramas.commonStages.apartment.path!);
        expect(html).toContain('data-city-color="#');
        expect(html).toContain('slope="0.8"');
        expect(html).not.toContain('building-stages.svg');
      }
      const unbuilt = renderToStaticMarkup(createElement(MarblePropertyArt, { city: slug, level: 0, routeVersion: 3 }));
      expect(unbuilt).toContain('viewBox="0 34 128 80"');
      expect(unbuilt).not.toContain(dioramas.assets.find(asset => asset.slug === slug)!.path!);
      expect(unbuilt).toContain('data-building-level="0"');
    }
  });
  it('colors the house roof and apartment facade with the actual owner palette', () => {
    for (const [owner, color] of Object.entries({ p1: '#cf6473', p2: '#398d80', p3: '#92596b', p4: '#2b6b62' })) {
      for (const level of [1, 2]) {
        const html = renderToStaticMarkup(createElement(MarblePropertyArt, { city: 'gwangju', level, routeVersion: 3, owner: owner as 'p1'|'p2'|'p3'|'p4' }));
        expect(html).toContain(`data-marble-owner="${owner}"`);
        expect(html).toContain(`flood-color="${color}"`);
      }
    }
  });
  it('keeps every unbuilt city as land, separate from its final landmark', () => {
    for (const asset of journeyManifest.assets) {
      expect(render(asset.slug, 0)).toContain('building-stages.svg#land');
      expect(render(asset.slug, 0)).not.toContain(asset.path);
      expect(render(asset.slug, 3)).toContain(asset.path);
    }
  });
});
