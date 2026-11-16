import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import art from '../../public/images/splendor/card-map.json';
import { SplendorArtwork, splendorBoardArtSrc } from './SplendorArtwork';

describe('Splendor artwork excludes printed rules', () => {
  it('excludes the scanned noble number strip while preserving personalized portraits', () => {
    for (const noble of art.nobles) {
      const html = renderToStaticMarkup(<SplendorArtwork src={`/images/splendor/${noble.src}`}/>);
      expect(html).toContain(`href="${splendorBoardArtSrc(`/images/splendor/${noble.src}`)}"`);
      expect(html).toContain(noble.src.endsWith('.jpg') ? 'viewBox="75 0 175 250"' : 'viewBox="0 0 100 100"');
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain('clipPathUnits="userSpaceOnUse"');
      expect(html).toContain('clip-path="url(#sp-art-');
    }
  });

  it('preserves the accessible engine-value description in the guide', () => {
    const html = renderToStaticMarkup(<SplendorArtwork src="/images/splendor/cards/01.jpg" label="1점 · 초록 4 · 흰색 +1"/>);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="1점 · 초록 4 · 흰색 +1"');
    expect(html).not.toContain('aria-hidden');
  });

  it('uses full portrait development art and top-aligned noble portraits without printed-rule crops', () => {
    const card = renderToStaticMarkup(<SplendorArtwork src="/images/splendor/custom-v2/t2-01.webp"/>);
    expect(card).toContain('viewBox="0 0 100 150"');
    expect(card).toContain('data-artwork-only="card"');
    expect(card).toContain('preserveAspectRatio="xMidYMin slice"');
    const noble = renderToStaticMarkup(<SplendorArtwork src="/images/splendor/custom-v2/n10.webp"/>);
    expect(noble).toContain('viewBox="0 0 100 100"');
    expect(noble).toContain('preserveAspectRatio="xMidYMin slice"');
    expect(noble).toContain('data-artwork-only="noble"');
  });
});

describe('board image loading', () => {
  it('uses derivatives for all three tiers and all sixteen nobles, including extra nobles', async () => {
    const { existsSync, statSync } = await import('node:fs');
    let originals = 0, thumbnails = 0;
    for (const item of [...art.cards, ...art.nobles]) {
      const source = `/images/splendor/${item.src}`;
      const board = splendorBoardArtSrc(source);
      expect(board).toMatch(/^\/images\/splendor\/board\/[^/]+-[a-f0-9]{12}\.webp$/);
      expect(existsSync(`public${board}`)).toBe(true);
      originals += statSync(`public${source}`).size;
      thumbnails += statSync(`public${board}`).size;
      const small = renderToStaticMarkup(<SplendorArtwork src={source}/>);
      expect(small).toContain(`href="${board}"`);
      expect(small).not.toContain(`href="${source}"`);
      expect(renderToStaticMarkup(<SplendorArtwork src={source} fullSize/>)).toContain(`href="${source}"`);
    }
    expect(thumbnails).toBeLessThan(originals / 4);
  });

  it('never rewrites private, blob, unknown, or remote artwork URLs', () => {
    for (const src of ['__proto__', 'constructor', 'blob:private-noble', '/private-assets/splendor/n1.webp', 'https://example.test/images/splendor/custom-v2/n0.webp', '/images/splendor/unknown.webp']) {
      expect(splendorBoardArtSrc(src)).toBe(src);
      expect(renderToStaticMarkup(<SplendorArtwork src={src}/>)).toContain(`href="${src}"`);
    }
  });
});
