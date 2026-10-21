import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {RoseGiftFinale,roseGiftClosingLine} from '../../post-hero-preview/src/RoseGiftFinale';

it('uses the playful lifetime-partner line only after receiving and an actual pact answer',()=>{
 for(const language of ['ko','es'] as const){
  const normal=roseGiftClosingLine(language,true,false);
  expect(roseGiftClosingLine(language,false,true)).toBe(normal);
  expect(roseGiftClosingLine(language,true,true)).toContain(language==='ko'?'약속했으니까':'Ya dijiste que sí');
  expect(normal).not.toContain(language==='ko'?'약속했으니까':'Ya dijiste que sí');
 }
});

it('keeps the illustration semantic and the replay unavailable before the three poses load',()=>{
 const html=renderToStaticMarkup(<RoseGiftFinale language="es" pactAccepted/>);
 expect(html).toContain('id="rose-gift-title"');
 expect(html).toContain('role="img"');
 expect(html).toContain('Yeonseok le ofrece una rosa roja a Lisbeth');
 for(const pose of ['offer','contact','received'])expect(html).toContain(`/images/rose-gift/${pose}.png`);
 expect(html).toMatch(/class="rg-replay" disabled=""/);
 expect(html).not.toContain('Ya dijiste que sí');
 expect(html).not.toContain('<canvas');
});
