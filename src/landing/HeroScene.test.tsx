import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HeroScene } from './HeroScene';

describe('HeroScene', () => {
  it.each([
    ['ko', 'Papi의 편지 열기'],
    ['es', 'Abrir la carta de Papi'],
  ] as const)('keeps the %s envelope disclosure localized and personal', (language, label) => {
    const html = renderToStaticMarkup(createElement(HeroScene, {
      language,
      children: createElement('h1', { id: 'hero-title' }, 'hero'),
      backgroundSrc: '/scene.webp',
      envelopeSrc: '/letter.webp',
      portraitSrc: '/couple.webp',
      portraitAlt: 'couple',
    }));

    expect(html).toContain(`aria-label="${label}"`);
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="hero-letter-preview"');
    expect(html).toContain('aria-hidden="true"><b>For my Mami ♡</b><small>Baby, surprise!</small>');
    expect(html).not.toContain('hero-orbit-svg');
    expect((html.match(/data-parallax=/g) ?? []).length).toBeGreaterThanOrEqual(7);
    expect((html.match(/class="hero-scene-sparkles/g) ?? []).length).toBe(1);
  });
  it('connects the hero envelope to the full letter when supplied', () => {
    const html = renderToStaticMarkup(createElement(HeroScene, {
      language: 'ko', children: createElement('h1', { id: 'hero-title' }, 'hero'),
      backgroundSrc: '/scene.webp', envelopeSrc: '/letter.webp',
      portraitSrc: '/couple.webp', portraitAlt: 'couple',
      onOpenLetter: () => {}, letterExpanded: true,
    }));
    expect(html).toContain('aria-controls="gift-paper"');
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('id="hero-letter-preview" aria-hidden="true"');
  });
});
