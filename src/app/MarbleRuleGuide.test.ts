import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { marbleBuildCost, marbleCityValue, marbleEngine, marbleTakeoverPrice, type MarbleTile } from '../games/marble';
import { marbleExpandedRules, marblePropertyRules } from '../games/rules';
import { getBeginnerGuide } from './beginner-guides';
import { GameInstructions } from './GameInstructions';
import { MarbleRuleGuide } from './MarbleRuleGuide';

const options = { marbleVersion: 2, marbleEconomyVersion: 2, marbleCityRouteVersion: 3, marblePropertyRulesVersion: 1 };

describe('Marble property-rule illustrated guide', () => {
  it('uses current property helpers for every illustrated ledger amount', () => {
    const html = renderToStaticMarkup(createElement(MarbleRuleGuide, { language: 'es', rules: marblePropertyRules.es, options }));
    const tile = marbleEngine.getPlayerView(marbleEngine.createInitialState(1), 'p1').board.tiles.find((tile: MarbleTile) => tile.name.es === 'Santo Domingo') as MarbleTile;
    const rows = html.match(/<tbody>(.*?)<\/tbody>/)?.[1].match(/<tr>.*?<\/tr>/g) ?? [];
    expect(rows).toHaveLength(4);
    rows.forEach((row, level) => {
      const cells = Array.from(row.matchAll(/<td>(.*?)<\/td>/g), cell => cell[1]);
      expect(cells).toEqual([
        String(level === 0 ? tile.price : marbleBuildCost(tile, level - 1, 2)),
        String(marbleCityValue(tile, level, 2)),
        String(tile.rent! * [1, 2, 4, 8][level]),
        String(marbleTakeoverPrice(tile, level, 2) ?? 'Protegido'),
      ]);
    });
  });

  it('presents artwork and local language labels while keeping full rules and all 16 cards collapsed', () => {
    for (const language of ['ko', 'es'] as const) {
      const html = renderToStaticMarkup(createElement(GameInstructions, { gameId: 'marble', language, rules: marblePropertyRules[language], options }));
      expect(html).toContain(`lang="${language === 'es' ? 'es-DO' : 'ko'}"`);
      expect(html).toContain('/images/marble/guides/takeover-protection.webp');
      expect(html).toContain('/images/marble/guides/doubles-island.webp');
      for (const image of ['cash-dividend', 'movement-travel', 'protection-exemption', 'city-intervention']) expect(html).toContain(`/images/marble/events/${image}.webp`);
      expect(html).toContain('marble-rule-building-art');
      expect(html).not.toContain('<details open');
      expect(html.match(/<details /g)).toHaveLength(2);
      const cardList = html.split('<ul>')[1]?.split('</ul>')[0];
      expect(cardList?.match(/<li>/g)).toHaveLength(16);
      expect(html).toContain(language === 'es' ? 'adquieres' : '선택 인수');
    }
  });

  it('keeps saved 18- and 40-space games on their original introduction', () => {
    for (const marbleVersion of [1, 2]) {
      const html = renderToStaticMarkup(createElement(GameInstructions, { gameId: 'marble', language: 'es', rules: marbleExpandedRules.es, options: { marbleVersion, marbleEconomyVersion: 2 } }));
      expect(html).not.toContain('marble-rule-guide');
      expect(html).not.toContain('takeover-protection.webp');
      const saved = getBeginnerGuide('marble', 'es', { marbleVersion, marbleEconomyVersion: 2 })!;
      expect(saved.steps.map(step => step.body).join(' ')).not.toContain('adquirirla');
    }
    expect(getBeginnerGuide('marble', 'es', options)!.steps[1].body).toContain('adquirirla');
  });

  it('explains team resources and elimination only when rendering the team guide', () => {
    const solo = renderToStaticMarkup(createElement(MarbleRuleGuide, { language: 'es', rules: marblePropertyRules.es, options }));
    const team = renderToStaticMarkup(createElement(MarbleRuleGuide, { language: 'es', rules: marblePropertyRules.es, options, teamMode: true }));
    expect(solo).not.toContain('No pagas alquiler a tu compañero');
    expect(team).toContain('No pagas alquiler a tu compañero');
    expect(team).toContain('el equipo pierde cuando ambos quiebran');
    expect(team).toContain('se suma el patrimonio neto de ambos compañeros');
    expect(team).toContain('si está entre quienes lideran');
    expect(team).not.toContain('Ganas por quiebra rival');
  });
});
