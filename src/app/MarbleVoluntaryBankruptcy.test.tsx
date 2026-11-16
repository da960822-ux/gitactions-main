import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { marbleEngine } from '../games/marble';
import { fourMarbleEngine } from '../games/fourMarble';
import MarbleBoard from './MarbleBoard';
import MarbleTeamBoard from './MarbleTeamBoard';
for (const team of [false, true]) for (const language of ['ko', 'es'] as const) it(`${team ? '4p' : '2p'} ${language} offers a secondary bankruptcy review beside sale even when credit can rescue`, () => {
  const engine: any = team ? fourMarbleEngine : marbleEngine;
  const s = engine.createInitialState(1); s.phase = 'debt'; s.money.p1 = 20;
  s.pendingPayment = { amount: 100, creditor: 'p2', resumeActive: 'p1' };
  s.properties[1] = { owner: 'p1', houses: 0 };
  const render = () => {
    const props = { view: engine.getPlayerView(s, 'p1'), language, runAction: vi.fn() };
    return renderToStaticMarkup(team ? createElement(MarbleTeamBoard, { ...props, nickname: 'Test', onReplay: vi.fn(), onExit: vi.fn(), onSelectGame: vi.fn() }) : createElement(MarbleBoard, { ...props, playerId: 'p1' }));
  };
  const html = render(), start = html.indexOf('class="mp-debt-decision"'), center = html.slice(start);
  expect(center).toContain('marble-property-sale');
  expect(center).toContain(language === 'ko' ? '파산하기' : 'Declararse en quiebra');
  expect(center).not.toContain(language === 'ko' ? '파산 확정' : 'Confirmar quiebra');
  s.active = 'p2'; expect(render()).not.toContain('class="mp-debt-decision"');
});
