import { strict as assert } from 'node:assert';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'vitest';
import { FeedbackPage } from './FeedbackPage';

const render = (language: 'ko' | 'es') => renderToStaticMarkup(createElement(FeedbackPage, {
  language,
  mode: 'online',
  entries: [],
  loading: false,
  canCreate: true,
  canAcknowledge: false,
  onCreate: async () => undefined,
  onSetStatus: async () => undefined,
}));

describe('Mami ideas page copy', () => {
  it('keeps the original affectionate phrase as a progress note without adding a fourth status', () => {
    for (const language of ['ko', 'es'] as const) {
      const html = renderToStaticMarkup(createElement(FeedbackPage, {
        language, mode: 'online', loading: false, canCreate: false, canAcknowledge: true,
        entries: [{ id: 'planned', category: 'game', title: 'Idea', body: 'An idea', status: 'planned', createdAt: '2026-10-11T12:00:00Z' }],
        onCreate: async () => undefined, onSetStatus: async () => undefined,
      }));
      assert.match(html, language === 'ko' ? /진행<small> · 해볼게요<\/small>/ : /En curso<small> · Lo anoto<\/small>/);
      assert.equal((html.match(/<option /g) || []).length, 3);
    }
  });

  it('keeps legacy game titles and maps the legacy read status to received', () => {
    const html = renderToStaticMarkup(createElement(FeedbackPage, {
      language: 'ko', mode: 'online', loading: false, canCreate: false, canAcknowledge: true,
      entries: [{ id: 'legacy', category: 'game', title: '기존 제목', body: '<script>unsafe</script>', status: 'read', createdAt: '2026-10-11T12:00:00Z' }],
      onCreate: async () => undefined, onSetStatus: async () => undefined,
    }));
    assert.match(html, /기존 제목/);
    assert.match(html, /&lt;script&gt;unsafe&lt;\/script&gt;/);
    assert.match(html, /접수/);
    assert.match(html, /진행/);
    assert.match(html, /완료/);
    assert.doesNotMatch(html, /읽음|<script>/);
    assert.equal((html.match(/<option /g) || []).length, 3);
  });

  it('blocks composing while loading or failing and does not show a false empty state on error', () => {
    for (const state of [{ loading: true }, { loading: false, error: 'Connection failed' }]) {
      const html = renderToStaticMarkup(createElement(FeedbackPage, {
        language: 'es', mode: 'online', entries: [], canCreate: true, canAcknowledge: false,
        onCreate: async () => undefined, onSetStatus: async () => undefined, ...state,
      }));
      assert.match(html, /<textarea[^>]+disabled/);
      assert.match(html, /class="feedback-submit" disabled/);
      assert.doesNotMatch(html, /Todavía no hay ideas/);
    }
  });

  it('shows the requested Korean Mami and Papi copy', () => {
    const html = render('ko');
    assert.match(html, /Mami, 다음엔 뭐 만들까\?/);
    assert.match(html, /해보고 싶은 게임이나 추가했으면 하는 거 있으면 여기 적어줘\./);
    assert.match(html, /불편한 게 있거나 마음에 안 드는 것도 말해줘\. Papi가 보고 고쳐볼게\./);
    assert.match(html, /Mami, 편하게 적어줘/);
    assert.match(html, /Papi가 읽어볼게\./);
    assert.match(html, /Mami, 생각난 걸 언제든 남겨줘\./);
    assert.match(html, /placeholder="Baby, 여기 적어줘 ♡"/);
    assert.match(html, />Papi한테 보내기</);
    assert.doesNotMatch(html, /남편에게|Para mi esposo/);
  });

  it('keeps the Spanish copy in the same affectionate voice', () => {
    const html = render('es');
    assert.match(html, /Mami, ¿qué hacemos después\?/);
    assert.match(html, /Si hay algún juego que quieras probar o algo que te gustaría añadir, escríbelo aquí\./);
    assert.match(html, /Dime también si algo te incomoda o no te gusta\. Papi lo revisa y lo arregla\./);
    assert.match(html, /Algo que molesta/);
    assert.match(html, /Mami, cuéntame tu idea cuando quieras\./);
    assert.match(html, /Papi va a leerlo con cariño\./);
    assert.match(html, /placeholder="Baby, escríbelo aquí ♡"/);
    assert.match(html, />Enviar a Papi</);
    assert.doesNotMatch(html, /Para mi esposo/);
  });
});
