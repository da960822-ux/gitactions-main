import {createElement,Fragment} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {CoupleReactionArt} from './CoupleReactionArt';
import {DuelIllustration} from '../landing/story/DuelIllustration';

it('keeps the exact full-room mask union for either presentation-only reaction',()=>{
 for(const reaction of ['lisbeth','yeonseok'] as const){
  const html=renderToStaticMarkup(createElement(CoupleReactionArt,{reaction,alt:'Conditional reaction'}));
  expect(html).toContain('viewBox="0 0 1672 941"');
  expect(html).toContain('/images/approved-couple-room/approved-couple-gaming-room.png');
  expect(html).toContain('/images/approved-couple-room/foreground-semantic-mask.png');
  expect(html).toContain(`/images/approved-couple-room/result-${reaction}-mask.png`);
  expect(html).toContain(`/images/approved-couple-room/result-${reaction}-wins.png`);
  expect(html).toContain('1 -1 -1 0 0');
  expect(html).toContain('1 0 0 0 0');
  expect(html).toContain('operator="dilate" radius="1"');
  expect(html).toContain('mask-type:alpha');
  expect(html.match(/<image /g)).toHaveLength(4);
 }
});

it('gives simultaneous artwork instances independent filter and mask identifiers',()=>{
 const html=renderToStaticMarkup(createElement(Fragment,null,createElement(CoupleReactionArt,{reaction:'lisbeth',alt:'First'}),createElement(CoupleReactionArt,{reaction:'yeonseok',alt:'Second'})));
 const ids=[...html.matchAll(/id="([^"]+)"/g)].map(match=>match[1]);
 expect(ids.length).toBe(8);
 expect(new Set(ids).size).toBe(ids.length);
});

it('presents imagined alternatives with a default choice and no actual result announcement',()=>{
 for(const [language,first,second] of [['ko','네가 이기면','내가 이기면'],['es','Si ganas tú','Si gano yo']] as const){
  const html=renderToStaticMarkup(createElement(DuelIllustration,{language}));
  expect(html).toContain('data-reaction="lisbeth"');
  expect(html).toContain(`aria-pressed="true">${first}`);
  expect(html).toContain(`aria-pressed="false">${second}`);
  expect(html.match(/data-active="true" aria-hidden="false"/g)).toHaveLength(1);
  expect(html.match(/data-active="false" aria-hidden="true"/g)).toHaveLength(1);
  expect(html).not.toContain('Ganó');
  expect(html).not.toContain('승!');
  expect(html).not.toContain('couple-result-moment');
  expect(html).toContain('data-animate="false"');
  expect(html).toContain('class="duel-illustration-celebration" viewBox="0 0 1672 941" aria-hidden="true"');
  expect(html.indexOf('duel-illustration-room')).toBeLessThan(html.indexOf('duel-illustration-celebration'));
  expect(html.indexOf('duel-illustration-celebration')).toBeLessThan(html.indexOf('duel-illustration-reactions'));
 }
});
