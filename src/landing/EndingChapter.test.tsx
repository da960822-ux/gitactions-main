import {renderToStaticMarkup} from 'react-dom/server';
import {afterEach,expect,it,vi} from 'vitest';
import {EndingChapter} from '../../post-hero-preview/src/EndingChapter';
import {PartnerPact,persistPactResponse} from '../../post-hero-preview/src/PartnerPact';
import {createLocalEventState} from '../../post-hero-preview/src/LocalEventRig';

afterEach(()=>vi.unstubAllGlobals());

it('keeps the ending open to the shared scene and real letter/game destinations without inventing a keepsake',()=>{
 const html=renderToStaticMarkup(<EndingChapter language="ko" embedded state={createLocalEventState()} playHref="/play?game=domino" onReadLetter={()=>{}}/>);
 expect(html).toContain('id="together-again"');
 expect(html).toContain('data-pose="1"');
 expect(html).toContain('data-ending-artifact-window="true"');
 expect(html).toContain('href="/play?game=domino"');
 expect(html).toContain('href="#papi-letter"');
 expect(html).toContain('href="/feedback"');
 expect(html).toContain('href="#home"');
 expect(html).toMatch(/datetime="2025-04-04"/i);
 expect(html).not.toContain('ec-keepsake');
 expect(html).toContain('/images/story-companions/hanbok-pact-dolls.png');
 expect(html).toContain('우리의 약속');
 expect(html).not.toContain('<canvas');
});

it('replaces only the old ending drawing display while preserving actual session drawing and decor state',()=>{
 const state={...createLocalEventState('es'),strokes:[[{x:13,y:17}],[{x:20,y:30},{x:45,y:35}]],hasSavedDecor:true,decorKind:'pawn' as const,decorPawn:1};
 const original=JSON.stringify(state);
 const html=renderToStaticMarkup(<EndingChapter language="es" state={state} onReadLetter={()=>{}}/>);
 expect(JSON.stringify(state)).toBe(original);
 expect(html).not.toContain('ec-keepsake');
 expect(html).not.toContain('Tu tarjeta');
 expect(html).toContain('Nuestro pacto');
 expect(html).toContain('href="/#games"');
 expect(html).toContain('href="#intro"');
});

it('keeps the pact separate from the original letter and asks only for this viewer’s own response',()=>{
 for(const language of ['ko','es'] as const){
  const html=renderToStaticMarkup(<PartnerPact language={language}/>);
  expect(html).toContain('aria-expanded="false"');
  expect(html).toMatch(/class="pp-paper" hidden=""/);
  expect(html).toContain(language==='ko'?'Baby, 내 평생의 동반자가 되어줄래?':'Baby, ¿quieres ser mi compañera de vida?');
  expect(html).toContain(language==='ko'?'이 대답은 이 브라우저에만 저장돼.':'Esta respuesta se guarda solo en este navegador.');
  expect(html).not.toContain('moment-letter-copy');
  expect(html).not.toContain('<dialog');
  expect(html).not.toContain('<input');
  expect(html).not.toContain('Lisbeth');
  expect(html).not.toContain('Yeonseok');
  expect(html).toContain('aria-pressed="false"');
  expect(html).not.toContain('Mi respuesta: sí');
  expect(html).not.toContain('내 대답: 응');
 }
});

it('stores only a local answer and resets only its own key, preserving other saved work',()=>{
 const setItem=vi.fn(),removeItem=vi.fn();vi.stubGlobal('localStorage',{setItem,removeItem});
 expect(persistPactResponse(true)).toBe(true);
 expect(setItem).toHaveBeenCalledExactlyOnceWith('dos-partner-pact-response-v1','yes');
 expect(persistPactResponse(false)).toBe(true);
 expect(removeItem).toHaveBeenCalledExactlyOnceWith('dos-partner-pact-response-v1');
});

it('reports blocked local save and reset without throwing or pretending storage succeeded',()=>{
 const blocked=()=>{throw new Error('Storage unavailable');};
 vi.stubGlobal('localStorage',{setItem:blocked,removeItem:blocked});
 expect(persistPactResponse(true)).toBe(false);
 expect(persistPactResponse(false)).toBe(false);
});

it('preserves the existing ending workbench while hiding the closing controls',()=>{
 const html=renderToStaticMarkup(<EndingChapter language="ko" state={createLocalEventState()} detailsOpen onReadLetter={()=>{}}><div id="details-ending">Existing workbench</div></EndingChapter>);
 expect(html).toContain('class="ec-closing" hidden=""');
 expect(html).toContain('id="details-ending"');
});
