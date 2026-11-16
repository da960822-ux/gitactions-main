import { marbleRuntimeImage } from './marble-runtime-images';
import { marbleLandmarkAsset } from './marble-world-theme';
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
    const tiles = marbleEngine.getPlayerView({ ...marbleEngine.createInitialState(1), boardProfile:undefined, cityRouteVersion: 2 }, 'p1').board.tiles;
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
    const tiles = marbleEngine.getPlayerView({...marbleEngine.createInitialState(1),boardProfile:undefined,cityRouteVersion:3}, 'p1').board.tiles;
    expect(dioramas.assets).toHaveLength(24);
    for (const asset of dioramas.assets) {
      const renamed:Record<number,string>={8:'Guiza',9:'Río',13:'Singapur',31:'Dubái',35:'Pekín'};
      expect(tiles[asset.tileIndex].name.es).toBe(renamed[asset.tileIndex] ?? asset.city);
      const html = renderToStaticMarkup(createElement(MarblePropertyArt, { city: asset.slug, level: 3, routeVersion: 3, language: 'es' }));
      expect(asset.path).toMatch(/^\/images\/marble\/premium\/cities\/.+\.webp$/);
      expect(existsSync(`public${asset.path}`)).toBe(true);
      expect(html).toContain(marbleLandmarkAsset(asset.slug) ?? asset.path!);
      expect(existsSync(`public${marbleLandmarkAsset(asset.slug) ?? asset.path}`)).toBe(true);
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

describe('independent construction artwork', () => {
  it('keeps villa, building and hotel together and replaces the whole cluster only with a landmark', () => {
    const props = { city:'new-york', routeVersion:3, owner:'p2' as const, buildings:['villa','building','hotel'] as ('villa'|'building'|'hotel')[] };
    const html = renderToStaticMarkup(createElement(MarblePropertyArt, props));
    for (const kind of props.buildings) expect(html).toContain(`data-building-kind="${kind}"`);
    expect(html).toContain(dioramas.commonStages.house.path);
    expect(html).toContain(dioramas.commonStages.apartment.path);
    expect(html).not.toContain(marbleRuntimeImage('new-york-statue-of-liberty-v2.png'));
    const landmark = renderToStaticMarkup(createElement(MarblePropertyArt, {...props,landmark:true}));
    expect(landmark).toContain(marbleRuntimeImage('new-york-statue-of-liberty-v2.png'));
    expect(landmark).not.toContain('data-building-kind=');
  });
  it('honors an isolated hotel without adding unpurchased buildings', () => {
    const html = renderToStaticMarkup(createElement(MarblePropertyArt, {city:'paris',routeVersion:3,buildings:['hotel']}));
    expect(html).toContain('data-building-kind="hotel"');
    expect(html).not.toContain('data-building-kind="villa"');
    expect(html).not.toContain('data-building-kind="building"');
  });
});

it('keeps world travel Newark distinct from Dubai and gives Incheon its approved airport', async () => {
  const { cityArtNames, cityFlag } = await import('./marble-visuals');
  const { marbleLandmarkNote } = await import('./marble-world-theme');
  for(const city of ['인천','뉴어크','두바이']){
    const slug=cityArtNames[city];
    const html=renderToStaticMarkup(createElement(MarblePropertyArt,{city:slug,level:3,routeVersion:5,language:'ko'}));
    expect(html).not.toContain('그림 준비 중');
    const path=html.match(/src="([^"]+)"/)?.[1];expect(path).toBeTruthy();expect(existsSync(`public${path}`)).toBe(true);
    if(city==='인천'){
      expect(html).toContain('incheon-airport-57a0d74bd12a.webp');
      expect(html).not.toContain('data-generic-landmark');
      expect(html).not.toContain(dioramas.commonStages.apartment.path);
      expect(marbleLandmarkNote(slug,'ko',5)).toContain('인천국제공항');
      expect(cityFlag({ko:city})).toBe('kr');
    }
    if(city==='뉴어크'){expect(html).toContain('newark-sacred-heart.webp');expect(html).not.toContain('dubai');expect(marbleLandmarkNote(slug,'ko',5)).toContain('뉴어크');}
    if(city==='두바이'){expect(html).toContain(marbleRuntimeImage('dubai-burj-khalifa-v1.png'));expect(marbleLandmarkNote(slug,'ko',5)).toContain('두바이');}
  }
  expect(marbleLandmarkAsset('newark',3)).toContain('dubai-burj-khalifa');
  expect(renderToStaticMarkup(createElement(MarblePropertyArt,{city:cityArtNames['두바이'],level:3,routeVersion:2}))).toContain('/images/marble/landmarks/newark.svg');
});

it('loads only explicitly requested decision previews eagerly, keeping board landmarks lazy',()=>{
 const props={city:'new-york',landmark:true,routeVersion:5};
 expect(renderToStaticMarkup(createElement(MarblePropertyArt,props))).toContain('loading="lazy" decoding="async"');
 expect(renderToStaticMarkup(createElement(MarblePropertyArt,{...props,loading:'eager'}))).toContain('loading="eager" decoding="sync"');
});
