import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import art from '../../public/images/splendor/card-map.json';
import { SplendorArtwork } from './SplendorArtwork';

describe('Splendor artwork excludes printed rules', () => {
  it('excludes the scanned noble number strip while preserving personalized portraits', () => {
    for (const noble of art.nobles) {
      const html = renderToStaticMarkup(<SplendorArtwork src={`/images/splendor/${noble.src}`}/>);
      expect(html).toContain(`href="/images/splendor/${noble.src}"`);
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
});
