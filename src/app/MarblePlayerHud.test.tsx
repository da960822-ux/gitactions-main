import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MarblePlayerHud, MarbleTeamBank } from './MarblePlayerHud';

describe('MarblePlayerHud', () => {
  it('keeps spendable cash distinct from assets and owner identity', () => {
    const html=renderToStaticMarkup(createElement(MarblePlayerHud,{seat:'p1',name:'나',pawn:'fox',cash:1240,assets:1500,scoreLabel:'순자산',active:true,self:true,language:'ko',resetKey:'qa',meta:{debt:0,cities:1,landmarks:0,groups:0,rentPasses:1,escapePasses:2,cityShields:1}}));
    expect(html).toContain('data-marble-value="cash"'); expect(html).toContain('1,240'); expect(html).toContain('data-marble-value="assets"'); expect(html).toContain('1,500'); expect(html).toContain('도시 1'); expect(html).toContain('무인도 탈출권 2장'); expect(html).toContain('통행료 면제권 1장'); expect(html).toContain('도시 방어권 1장');
  });
  it('shows all four-seat bank facts in Spanish', () => {
    const html=renderToStaticMarkup(createElement(MarbleTeamBank,{seat:'p3',name:'Compañero IA',pawn:'cat',cash:900,assets:1200,debt:300,position:4,active:false,eliminated:false,team:'A',language:'es',rentPasses:1,escapePasses:2,cityShields:1,cities:3,groups:1,teamAssets:2500}));
    expect(html).toContain('Efectivo 900 · deuda 300'); expect(html).toContain('Patrimonio'); expect(html).toContain('1,200'); expect(html).toContain('Casilla');expect(html).toContain('Pases de salida 2'); expect(html).toContain('Escudos urbanos 1');expect(html).toContain('Pases de renta 1');expect(html).toContain('Patrimonio del equipo 2,500');
  });
});
