import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { splendorEngine } from '../games/splendor';
import { fourSplendorEngine } from '../games/fourSplendor';
import { SplendorTable } from './SplendorTable';
import SplendorTeamTable from './SplendorTeamTable';
import { SplendorNobleViewer } from './SplendorDetailViewer';

describe('Splendor artwork viewers', () => {
  it('opens noble portraits from both tables even before their bonus condition is met', () => {
    const two = renderToStaticMarkup(<SplendorTable view={splendorEngine.getPlayerView(splendorEngine.createInitialState(17), 'p1')} language="ko" playerId="p1" runAction={() => {}}/>);
    const four = renderToStaticMarkup(<SplendorTeamTable view={fourSplendorEngine.getPlayerView(fourSplendorEngine.createInitialState(17), 'p1')} language="ko" runAction={async () => true}/>);
    expect(two).toMatch(/<button[^>]*class="sp-noble "[^>]*data-sp-noble-id="n\d+"[^>]*aria-label="[^"]*그림과 조건 보기"/);
    expect(four).toMatch(/<button[^>]*class="spt-noble "[^>]*data-sp-noble-id="n\d+"/);
    expect(two).not.toMatch(/class="sp-noble "[^>]*disabled/);
    expect(four).not.toMatch(/class="spt-noble "[^>]*disabled/);
  });

  it('keeps viewing separate from acquiring and shows current permanent-bonus progress', () => {
    const props = { id: 'n11', src: '/images/splendor/test.webp', points: 3, requirement: { white: 4, red: 4 }, bonuses: { white: 2, red: 1 }, language: 'ko' as const, onAcquire: () => {}, onClose: () => {} };
    const preview = renderToStaticMarkup(<SplendorNobleViewer {...props} canAcquire={false}/>);
    expect(preview).toContain('황금 비단의 황진이');
    expect(preview).toContain('2 / 4');
    expect(preview).toContain('1 / 4');
    expect(preview).not.toContain('방문 수락');
    expect(renderToStaticMarkup(<SplendorNobleViewer {...props} canAcquire language="es"/>)).toContain('Aceptar visita');
  });
});
