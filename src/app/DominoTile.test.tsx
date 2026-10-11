import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DominoTile } from './DominoTile';

describe('domino faces', () => {
  it('renders the correct readable pip count for every double-six tile', () => {
    for (let left = 0; left <= 6; left++) {
      for (let right = left; right <= 6; right++) {
        const html = renderToStaticMarkup(<DominoTile left={left} right={right}/>);
        expect(html.match(/class="domino-pip"/g)?.length ?? 0).toBe(left + right);
        expect(html).toContain(`aria-label="${left} | ${right}"`);
      }
    }
  });

  it('renders a number-free engraved back and supports a labelled vertical face', () => {
    const back = renderToStaticMarkup(<DominoTile left={6} right={3} back/>);
    expect(back).toContain('aria-label="Domino tile back"');
    expect(back).toContain('class="domino-tile__engraving"');
    expect(back).not.toContain('aria-label="6 | 3"');
    expect(back).not.toContain('class="domino-pip"');

    const vertical = renderToStaticMarkup(<DominoTile left={2} right={5} vertical label="Two and five"/>);
    expect(vertical).toContain('class="domino-tile domino-tile--premium is-vertical"');
    expect(vertical).toContain('aria-label="Two and five"');
    expect(vertical).toContain('viewBox="0 0 64 120"');
  });
});
