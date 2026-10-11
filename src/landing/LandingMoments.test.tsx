import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { landingCopy } from '../copy/home';
import { LandingMoments } from './LandingMoments';

describe('LandingMoments', () => {
  it.each(['ko', 'es'] as const)('shows the %s game notes and full letter without implying a landing chat', language => {
    const html = renderToStaticMarkup(createElement(LandingMoments, { language }));
    const copy = landingCopy[language];

    expect(html).toContain(copy.momentsTitle);
    for (const moment of copy.moments) {
      expect(html).toContain(moment.title);
      expect(html).toContain(moment.body);
    }
    expect(html).toContain(copy.translationLimitNote);
    expect(html).toContain('href="/play?game=catchmind"');
    expect(html).toContain('href="/feedback"');
    expect(html).toContain(copy.ideasAction);
    expect(html).toContain('id="papi-letter"');
    expect(html).toContain(copy.letterTitle);
    for (const paragraph of copy.letterBody) expect(html).toContain(paragraph);
    expect(html).toContain(copy.letterSignature);
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('aria-controls="moment-letter-copy"');
    expect(html).not.toMatch(/<(?:form|textarea|input)\b/);
    expect(html).not.toContain('Yo también.');
    expect(html).not.toContain('보고 싶어.');
  });
});
