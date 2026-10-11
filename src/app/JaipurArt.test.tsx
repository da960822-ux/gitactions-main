import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { JaipurBonusArt, JaipurCamelAward, JaipurCoin, JaipurGoodArt, jaipurCardVariant, type JaipurGood } from './JaipurArt';

const goods: JaipurGood[] = ['diamond', 'gold', 'silver', 'cloth', 'spice', 'leather', 'camel'];

describe('Jaipur illustrated assets', () => {
  it('maps each commodity to its own scene without baking labels into the atlas', () => {
    goods.forEach((good, cell) => {
      const html = renderToStaticMarkup(<JaipurGoodArt good={good} language="es"/>);
      expect(html).toContain(`data-atlas-cell="${cell}"`);
      expect(html).toContain('href="/images/jaipur/merchant-atlas.webp"');
      expect(html).toContain(`x="${-(cell % 4) * 100}"`);
      expect(html).toContain(`y="${-Math.floor(cell / 4) * 100}"`);
      expect(html).not.toContain('<text');
    });
  });

  it('provides three distinct stable compositions for each of seven goods', () => {
    for (const good of goods) {
      const art = [0, 1, 2].map(variant => renderToStaticMarkup(<JaipurGoodArt good={good} variant={variant}/>));
      expect(art.every(svg => svg.includes(`data-good="${good}"`))).toBe(true);
      expect(new Set(art.map(svg => svg.match(/data-composition="([^"]+)"/)?.[1])).size).toBe(3);
      expect(art.every(svg => svg.includes('role="img"'))).toBe(true);
    }
  });

  it('keeps card art stable by card id and gives each commodity coin its own mark', () => {
    expect(jaipurCardVariant('market-a')).toBe(jaipurCardVariant('market-a'));
    expect(jaipurCardVariant('market-a')).not.toBe(jaipurCardVariant('market-b'));

    const marks = goods.map(good => {
      const svg = renderToStaticMarkup(<JaipurCoin good={good} language="es"/>);
      expect(svg).toContain(`data-mark="${good}"`);
      expect(svg).toContain(`jaipur-coin--${good}`);
      return svg.slice(svg.indexOf('<g'), svg.lastIndexOf('</g>') + 4);
    });
    expect(new Set(marks).size).toBe(goods.length);
  });

  it('keeps bonus values out of the unrevealed card back', () => {
    const hidden = renderToStaticMarkup(<JaipurBonusArt value={9}/>);
    const shown = renderToStaticMarkup(<JaipurBonusArt revealed value={9} language="es"/>);
    expect(hidden).toContain('aria-label="뒤집힌 판매 보너스"');
    expect(hidden).not.toContain('<text');
    expect(hidden).not.toContain('data-value');
    expect(shown).toContain('aria-label="Bono de venta: 9 puntos"');
    expect(shown).toContain('>9</text>');
  });

  it('labels the illustrated point coin and camel-majority seal in both locales', () => {
    expect(renderToStaticMarkup(<JaipurCoin value={6}/>)).toContain('aria-label="6점 금화"');
    expect(renderToStaticMarkup(<JaipurCoin value={6}/>)).toContain('>6</text>');
    expect(renderToStaticMarkup(<JaipurCoin language="es"/>)).toContain('aria-label="Ficha de moneda"');
    expect(renderToStaticMarkup(<JaipurCamelAward/>)).toContain('aria-label="낙타 다수 배지"');
    expect(renderToStaticMarkup(<JaipurCamelAward language="es"/>)).toContain('aria-label="Sello por mayoría de camellos"');
    expect(renderToStaticMarkup(<JaipurCamelAward aria-hidden="true"/>)).not.toContain('aria-label=');
  });
});
