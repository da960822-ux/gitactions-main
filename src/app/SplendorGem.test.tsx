import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { SplendorGem } from './SplendorGem';
import manifest from '../../public/images/splendor-gems/manifest.json';
import premium from '../../public/images/game-premium-tokens/manifest.json';

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
      expect(html).toContain(`/images/game-premium-tokens/splendor/${gem}.webp`);
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

  it('preserves the pinned premium-token source provenance and validates optimized transparent WebP files', () => {
    expect(premium.sourceArchiveCommit).toBe('1dc181214cfb8d776195864cb954dc95760e1ba4');
    expect(premium.assets).toHaveLength(13);
    for (const asset of premium.assets) {
      expect(asset.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(asset.sourceGitBlobSha).toMatch(/^[a-f0-9]{40}$/);
      expect(asset.outputSha256).toMatch(/^[a-f0-9]{64}$/);
      const bytes = readFileSync(asset.output);
      expect(bytes.subarray(0, 4).toString()).toBe('RIFF');
      expect(bytes.subarray(8, 12).toString()).toBe('WEBP');
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.outputSha256);
      expect(asset.alpha).toBe(true);
      expect(asset.width).toBe(384);
      expect(asset.height).toBe(384);
    }
  });
});
