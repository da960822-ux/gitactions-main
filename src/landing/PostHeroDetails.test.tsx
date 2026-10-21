import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Details from '../../post-hero-preview/src/Details';
import { approvedPawns, createLocalEventState, localEventIds, pawnSource, type LocalEventState } from '../../post-hero-preview/src/LocalEventRig';

function render(language:'ko'|'es',patch:Partial<LocalEventState>){
  return renderToStaticMarkup(<Details language={language} state={{...createLocalEventState(language),active:'L03',...patch}} setState={()=>{}} onClose={()=>{}} reducedMotion={false} onEffect={()=>{}}/>);
}

describe('paper room discovery',()=>{
  it.each(['ko','es'] as const)('names the next fold action and shows the matching paper state in %s',language=>{
    const closed=render(language,{}),open=render(language,{pocketOpen:true,sideView:true});
    expect(closed).toContain(language==='ko'?'놀이방 펼치기':'Abrir la sala');
    expect(closed).toContain('class="pocket-closed"');
    expect(closed).not.toContain('class="pocket-interior"');
    expect(open).toContain(language==='ko'?'놀이방 접기':'Doblar la sala');
    expect(open).toContain('data-side-view="true"');
    expect(open).toContain('class="pocket-interior"');
    expect(open).not.toContain('class="pocket-closed"');
  });

  it('uses each actual selected pawn whole, at the same small supported tabletop position',()=>{
    approvedPawns.forEach((_,pawn)=>{
      const html=render('es',{pocketOpen:true,pawn});
      const image=html.match(/<image[^>]+>/g);
      expect(image).toHaveLength(1);
      expect(image![0]).toContain(`href="${pawnSource(pawn)}"`);
      expect(image![0]).toContain('preserveAspectRatio="xMidYMid meet"');
      const coordinate=(name:string)=>Number(image![0].match(new RegExp(` ${name}="([\\d.]+)"`))![1]);
      const tableY=Number(html.match(/<ellipse[^>]+ cy="([\d.]+)"/)![1]);
      expect(coordinate('y')+coordinate('height')).toBe(tableY);
      expect(coordinate('height')).toBeLessThan(60);
      expect(html).not.toMatch(/<clipPath|<filter/);
    });
  });

  it.each(['ko','es'] as const)('keeps Escape help everywhere and drawing retention help only in L06 in %s',language=>{
    localEventIds.forEach(active=>{
      const html=render(language,{active});
      expect(html).toContain(language==='ko'?'Escape로 내려놓을 수 있어.':'Pulsa Escape para dejarlo.');
      expect(html.includes(language==='ko'?'그림은 이 세션에만 남아.':'El dibujo solo se queda durante esta sesión.')).toBe(active==='L06');
    });
  });
});
