import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DesktopGameNotice } from './DesktopGameNotice';

describe('DesktopGameNotice', () => {
  it.each(['ko', 'es'] as const)('offers a localized return route without loading gameplay in %s', language => {
    const html = renderToStaticMarkup(<DesktopGameNotice language={language}/>);
    expect(html).toContain(language === 'ko' ? '다른 게임은 컴퓨터에서 같이 하자' : 'Los demás juegos, en la computadora');
    expect(html).toContain('href="/"');
    expect(html).not.toContain('href="/play');
    expect(html).not.toContain('game-board');
  });
});
