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
  it('shows one progress badge without implying an idea has been read', () => {
    for (const language of ['ko', 'es'] as const) {
      const html = renderToStaticMarkup(createElement(FeedbackPage, {
        language, mode: 'online', loading: false, canCreate: false, canAcknowledge: true,
        entries: [{ id: 'planned', category: 'game', title: 'Idea', body: 'An idea', status: 'planned', createdAt: '2026-10-11T12:00:00Z' }],
        onCreate: async () => undefined, onSetStatus: async () => undefined,
      }));
      assert.match(html, language === 'ko' ? /status-planned">진행<\/span>/ : /status-planned">En curso<\/span>/);
      assert.doesNotMatch(html, /해볼게요|Lo anoto/);
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

  it('does not repeat an automatically generated title above a multiline idea', () => {
    const html = renderToStaticMarkup(createElement(FeedbackPage, {
      language: 'ko', mode: 'demo', loading: false, canCreate: true, canAcknowledge: true,
      entries: [{ id: 'multiline', category: 'game', title: '같이 도미노 해보자 다음 주말에', body: '같이 도미노 해보자\n다음 주말에', status: 'new', createdAt: '2026-10-21T12:00:00Z' }],
      onCreate: async () => undefined, onSetStatus: async () => undefined,
    }));
    assert.doesNotMatch(html, /<h3>/);
    assert.match(html, /같이 도미노 해보자\n다음 주말에/);
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
      if (state.loading) assert.match(html, /<form aria-busy="true">/);
      else assert.match(html, /feedback-compose[\s\S]+role="alert">Connection failed/);
    }
  });

  it('explains demo storage once and labels saving without implying delivery', () => {
    for (const language of ['ko', 'es'] as const) {
      const html = renderToStaticMarkup(createElement(FeedbackPage, {
        language, mode: 'demo', entries: [], loading: false, canCreate: true, canAcknowledge: true,
        onCreate: async () => undefined, onSetStatus: async () => undefined,
      }));
      assert.equal((html.match(/class="feedback-demo-note"/g) || []).length, 1);
      assert.doesNotMatch(html, /feedback-mode|feedback-retention|Papi한테 보내기|Enviar a Papi/);
      assert.match(html, language === 'ko' ? /메모 남기기/ : /Guardar mi idea/);
      assert.match(html, language === 'ko' ? /다른 기기와 공유되지 않고, 7일 뒤 삭제돼요/ : /no se comparte con otros dispositivos y se elimina a los siete días/);
    }
  });

  it('shows both controls to the owner, composing to the invited member, and status editing to no one else', () => {
    for (const { canCreate, canAcknowledge } of [
      { canCreate: true, canAcknowledge: true },
      { canCreate: true, canAcknowledge: false },
      { canCreate: false, canAcknowledge: true },
      { canCreate: false, canAcknowledge: false },
    ]) {
      const html = renderToStaticMarkup(createElement(FeedbackPage, {
        language: 'es', mode: 'online', loading: false, canCreate, canAcknowledge,
        entries: [{ id: 'role-check', category: 'game', title: 'Una idea', body: 'Una idea', status: 'new', createdAt: '2026-10-21T12:00:00Z' }],
        onCreate: async () => undefined, onSetStatus: async () => undefined,
      }));
      assert.equal(html.includes('id="feedback-body"'), canCreate);
      assert.equal(html.includes('<select'), canAcknowledge);
      assert.equal(html.includes('feedback-layout-readonly'), !canCreate);
    }
  });

  it('renders a bounded first page while retaining the true total and all remaining ideas', () => {
    const entries = Array.from({ length: 1000 }, (_, index) => ({
      id: `entry-${index}`, category: 'game' as const, title: `Idea ${index}`, body: `Idea ${index}`,
      status: 'new' as const, createdAt: '2026-10-21T12:00:00Z',
    }));
    const html = renderToStaticMarkup(createElement(FeedbackPage, {
      language: 'ko', mode: 'online', loading: false, canCreate: false, canAcknowledge: false,
      entries, onCreate: async () => undefined, onSetStatus: async () => undefined,
    }));
    assert.equal((html.match(/class="feedback-entry"/g) || []).length, 25);
    assert.match(html, /1,000 <small>개<\/small>/);
    assert.match(html, /더 보기 \(975개 남음\)/);
    assert.match(html, /Idea 0/);
    assert.doesNotMatch(html, /Idea 999/);
  });

  it('shows the requested Korean Mami and Papi copy', () => {
    const html = render('ko');
    assert.match(html, /Mami, 다음엔 뭐 하고 놀까\?/);
    assert.match(html, /같이 해보고 싶은 게임이나 있으면 좋겠는 걸 적어줘/);
    assert.match(html, /불편한 것도 편하게 말해줘/);
    assert.match(html, /무슨 생각 했어\?/);
    assert.match(html, /편하게 적어줘\. 읽어볼게 ♡/);
    assert.match(html, /생각나면 한 줄만 남겨줘/);
    assert.match(html, /placeholder="같이 해보고 싶은 건…"/);
    assert.match(html, />아이디어 저장하기</);
    assert.match(html, /다른 사람은 참여한 뒤 볼 수 있어요/);
    assert.doesNotMatch(html, /Papi한테 보내기|우리 둘의 비공개 공간에 저장돼요/);
    assert.doesNotMatch(html, /남편에게|Para mi esposo/);
  });

  it('keeps the Spanish copy in the same affectionate voice', () => {
    const html = render('es');
    assert.match(html, /Mami, ¿a qué jugamos después\?/);
    assert.match(html, /Cuéntame qué juego te gustaría probar conmigo/);
    assert.match(html, /Aquí no hace falta decir solo cosas bonitas/);
    assert.match(html, /Algo que molesta/);
    assert.match(html, /Cuando se te ocurra algo, déjame una línea/);
    assert.match(html, /Escríbeme con confianza\. Lo leeré con cariño ♡/);
    assert.match(html, /placeholder="Me gustaría que probáramos…"/);
    assert.match(html, />Guardar idea</);
    assert.match(html, /Otra persona podrá verlo cuando se una/);
    assert.doesNotMatch(html, /Enviar a Papi|Se guarda en nuestro espacio privado/);
    assert.doesNotMatch(html, /Para mi esposo/);
  });
});
