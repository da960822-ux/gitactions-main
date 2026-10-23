import {renderToStaticMarkup} from 'react-dom/server';
import {afterEach,expect,it,vi} from 'vitest';
import {EndingChapter} from '../../post-hero-preview/src/EndingChapter';
import {PartnerPact,isPactSignature,parsePactResponse,persistPactResponse} from '../../post-hero-preview/src/PartnerPact';
import {createLocalEventState} from '../../post-hero-preview/src/LocalEventRig';

afterEach(()=>vi.unstubAllGlobals());

it('shows the rose at completion with one optional reread path and no repeated letter or pact',()=>{
 const html=renderToStaticMarkup(<EndingChapter language="ko" embedded state={createLocalEventState()} playHref="/play?game=domino" onReadLetter={()=>{}}/>);
 expect(html).toContain('id="together-again"');
 expect(html).not.toContain('data-pose=');
 expect(html).toContain('id="rose-gift-finale"');
 expect(html).toContain('class="ec-actions ec-finale-actions" hidden=""');
 expect(html).toContain('href="/play?game=domino"');
 expect(html).toContain('href="#papi-letter"');
 expect(html).toContain('href="#home"');
 expect(html).toMatch(/datetime="2025-04-04"/i);
 expect(html).not.toContain('ec-invitation');
 expect(html).not.toContain('partner-pact');
 expect(html).not.toContain('moment-letter-copy');
});

it('does not fabricate a yes response or mutate drawing and decor state',()=>{
 const state={...createLocalEventState('es'),strokes:[[{x:13,y:17}]],hasSavedDecor:true,decorKind:'pawn' as const,decorPawn:1};
 const original=JSON.stringify(state);
 const html=renderToStaticMarkup(<EndingChapter language="es" state={state} pactAccepted={false} reducedMotion onReadLetter={()=>{}}/>);
 expect(JSON.stringify(state)).toBe(original);
 expect(html).not.toContain('Ya dijiste que sí');
 expect(html).not.toContain('ec-keepsake');
 expect(html).toContain('href="/#games"');
 expect(html).toContain('href="#intro"');
});

it('keeps the pact separate from the original letter and asks only for this viewer’s own response',()=>{
 for(const language of ['ko','es'] as const){
  const html=renderToStaticMarkup(<PartnerPact language={language}/>);
  expect(html).toContain('aria-expanded="false"');
  expect(html).toMatch(/class="pp-paper" hidden=""/);
  expect(html).toContain(language==='ko'?'평생 파트너 계약서':'Nuestro pacto para toda la vida');
  expect(html).toContain(language==='ko'?'내일도 그다음 날도 나랑 한 팀':'hacemos equipo hoy, mañana y todos los días');
  expect(html).toContain(language==='ko'?'게임에서 져도 언제나 네 편':'Aunque pierda, siempre estoy de tu lado');
  expect(html).toContain(language==='ko'?'다음 판은 꼭 같이 해줘':'prométeme otra partida');
  expect(html).toContain(language==='ko'?'이 서명과 대답은 이 브라우저에만 저장돼.':'Esta firma y respuesta se guardan solo en este navegador.');
  expect(html).not.toContain('moment-letter-copy');
  expect(html).not.toContain('<dialog');
  expect(html).toContain('class="pp-signature-pad"');
  expect(html).toContain('class="pp-signature-name"');
  expect(html).toContain(language==='ko'?'앞뒤 공백을 빼고 2~40자로':'entre 2 y 40 caracteres');
  expect(html).toContain('aria-live="polite"');
  expect(html).toContain('disabled=""');
  expect(html).toContain(language==='ko'?'서명하고 평생 한 팀 되기 ♡':'Firmar para ser un equipo toda la vida ♡');
  expect(html).not.toContain('Lisbeth');
  expect(html).not.toContain('Yeonseok');
  expect(html).not.toContain('Mi respuesta: sí');
  expect(html).not.toContain('내 대답: 응');
 }
});

it('accepts only bounded drawn or typed signatures and rejects taps, malformed and nonfinite strokes',()=>{
 expect(isPactSignature({mode:'drawn',strokes:[[{x:2,y:3}]]})).toBe(false);
 expect(isPactSignature({mode:'drawn',strokes:[[{x:2,y:3},{x:2.2,y:3.1}]]})).toBe(false);
 expect(isPactSignature({mode:'drawn',strokes:[[{x:2,y:3},{x:12,y:13}]]})).toBe(true);
 expect(isPactSignature({mode:'drawn',strokes:[[{x:2,y:3},{x:Infinity,y:13}]]})).toBe(false);
 expect(isPactSignature({mode:'drawn',strokes:[[{x:2,y:3},{x:101,y:13}]]})).toBe(false);
 expect(isPactSignature({mode:'drawn',strokes:[Array.from({length:201},(_,x)=>({x:x%100,y:20}))]})).toBe(false);
 expect(isPactSignature({mode:'typed',name:'  '})).toBe(false);
 expect(isPactSignature({mode:'typed',name:'Li'})).toBe(true);
 expect(isPactSignature({mode:'typed',name:'L'.repeat(41)})).toBe(false);
});

it('persists only versioned signatures in this browser and ignores the old yes-only response',()=>{
 const setItem=vi.fn(),removeItem=vi.fn();vi.stubGlobal('localStorage',{setItem,removeItem});
 const signature={mode:'drawn' as const,strokes:[[{x:2,y:3},{x:20,y:15}]]};
 expect(persistPactResponse(signature)).toBe(true);
 expect(setItem).toHaveBeenCalledExactlyOnceWith('dos-partner-pact-response-v2',JSON.stringify({version:2,signature}));
 expect(persistPactResponse({mode:'drawn',strokes:[[{x:2,y:3}]]})).toBe(false);
 expect(persistPactResponse(null)).toBe(true);
 expect(removeItem).toHaveBeenCalledExactlyOnceWith('dos-partner-pact-response-v2');
 expect(parsePactResponse('"yes"')).toBeNull();
 expect(parsePactResponse('{broken')).toBeNull();
 expect(parsePactResponse(JSON.stringify({version:1,signature}))).toBeNull();
 expect(parsePactResponse(JSON.stringify({version:2,signature}))).toEqual(signature);
});

it('reports blocked local save and reset without throwing or pretending storage succeeded',()=>{
 const blocked=()=>{throw new Error('Storage unavailable');};
 vi.stubGlobal('localStorage',{setItem:blocked,removeItem:blocked});
 expect(persistPactResponse({mode:'typed',name:'Lisbeth'})).toBe(false);
 expect(persistPactResponse(null)).toBe(false);
});

it('preserves the existing ending workbench while hiding the closing controls',()=>{
 const html=renderToStaticMarkup(<EndingChapter language="ko" state={createLocalEventState()} detailsOpen onReadLetter={()=>{}}><div id="details-ending">Existing workbench</div></EndingChapter>);
 expect(html).toContain('class="ec-closing" hidden=""');
 expect(html).toContain('id="details-ending"');
});
