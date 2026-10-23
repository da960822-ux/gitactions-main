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
  expect(html).toContain(language==='ko'?'너랑은,<br/>시간도 잊었어.':'Contigo,<br/>las horas volaban.');
  expect(html).toContain(language==='ko'?'첫날부터 12시간을 쉬지 않고 얘기했어.':'El primer día hablamos doce horas sin parar.');
  const duration=html.match(/class="fc-connection-duration"[^>]*>(.*?)<\/div>/)![1];
  expect(duration).toContain(language==='ko'?'네가 더 궁금했어.':'quería seguir contigo.');
  expect(duration).not.toMatch(/12|doce|<br/);
 });
 it('bounds the material echo to a finite release and ignores inactive or stale time',()=>{
  expect(connectionEchoProgress(-1)).toBe(-1);expect(connectionEchoProgress(0)).toBe(0);
  expect(connectionEchoProgress(connectionEchoDuration/2)).toBe(.5);
  expect(connectionEchoProgress(connectionEchoDuration)).toBe(-1);expect(connectionEchoProgress(Infinity)).toBe(-1);expect(connectionEchoProgress(NaN)).toBe(-1);
 });
});
