import {describe,expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {FirstConversation} from './FirstConversation';
import {connectionEchoDuration,connectionEchoProgress} from './conversation-flow';

describe('InterPals connection reply',()=>{
 it.each(['ko','es'] as const)('keeps the portraits and travelling threads with a native localized reply control in %s',language=>{
  const html=renderToStaticMarkup(<FirstConversation language={language}/>);
  expect(html).toContain(language==='ko'?'대화에 하트 보내기':'Enviar un corazón a nuestra conversación');
  expect(html).toContain('<button type="button" class="fc-send-heart"');
  expect(html).toContain('fc-portrait-left');expect(html).toContain('fc-portrait-right');expect(html).toContain('fc-messages');
  expect(html).toContain('data-charging="false"');expect(html).not.toContain('class="fc-echo"');
 });
 it('bounds the material echo to a finite release and ignores inactive or stale time',()=>{
  expect(connectionEchoProgress(-1)).toBe(-1);expect(connectionEchoProgress(0)).toBe(0);
  expect(connectionEchoProgress(connectionEchoDuration/2)).toBe(.5);
  expect(connectionEchoProgress(connectionEchoDuration)).toBe(-1);expect(connectionEchoProgress(Infinity)).toBe(-1);expect(connectionEchoProgress(NaN)).toBe(-1);
 });
});
