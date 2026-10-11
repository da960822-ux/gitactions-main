import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { SplendorGem } from './SplendorGem';
import manifest from '../../public/images/splendor-gems/manifest.json';

describe('Splendor gem family', () => {
  it('ships all six distinct transparent vector identities at stable center anchors', () => {
    const hashes = new Set<string>();
    for (const asset of manifest.assets) {
      const source = readFileSync(asset.path, 'utf8');
      const hash = createHash('sha256').update(source).digest('hex');
      expect(hash).toBe(asset.sha256);
      hashes.add(hash);
      expect(source).toContain('viewBox="0 0 64 64"');
      expect(source).not.toMatch(/<rect|<text/);
      const gem = asset.id.replace('splendor-gem-', '');
      const html = renderToStaticMarkup(createElement(SplendorGem, { gem }));
      expect(html).toContain(`sp-gem-icon sp-color-${gem}`);
      expect(html).toContain(`/images/splendor-gems/${gem}.svg`);
      expect(html.match(/<span/g)).toHaveLength(1);
      expect(html.match(/<img/g)).toHaveLength(1);
      expect(html).toContain('aria-hidden="true"');
    }
    expect(hashes.size).toBe(6);
  });

  it('uses the white identity for an unknown gem rather than constructing an arbitrary path', () => {
    const html = renderToStaticMarkup(createElement(SplendorGem, { gem: '../private' }));
    expect(html).toContain('/images/splendor-gems/white.svg');
    expect(html).not.toContain('../private');
  });
});
