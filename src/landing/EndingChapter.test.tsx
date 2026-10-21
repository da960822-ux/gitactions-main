import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {EndingChapter} from '../../post-hero-preview/src/EndingChapter';
import {createLocalEventState,pawnSource} from '../../post-hero-preview/src/LocalEventRig';

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
 expect(html).not.toContain('<img');
 expect(html).not.toContain('<canvas');
});

it('carries the actual session drawing and saved decor into the ending, including a single tapped point',()=>{
 const state={...createLocalEventState('es'),strokes:[[{x:13,y:17}],[{x:20,y:30},{x:45,y:35}]],hasSavedDecor:true,decorKind:'pawn' as const,decorPawn:1};
 const html=renderToStaticMarkup(<EndingChapter language="es" state={state} onReadLetter={()=>{}}/>);
 expect(html).toContain('cx="13" cy="17"');
 expect(html).toContain('points="20,30 45,35"');
 expect(html).toContain(pawnSource(1));
 expect(html).toContain('Sali · Suli');
 expect(html).toContain('Tu tarjeta');
 expect(html).toContain('href="/#games"');
 expect(html).toContain('href="#intro"');
});

it('preserves the existing ending workbench while hiding the closing controls',()=>{
 const html=renderToStaticMarkup(<EndingChapter language="ko" state={createLocalEventState()} detailsOpen onReadLetter={()=>{}}><div id="details-ending">Existing workbench</div></EndingChapter>);
 expect(html).toContain('class="ec-closing" hidden=""');
 expect(html).toContain('id="details-ending"');
});
