import { strict as assert } from 'node:assert';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, it, vi } from 'vitest';
import { App, BrandHeader } from './App';
import { FeedbackRoute } from './FeedbackRoute';
import { readBrowserStorage, writeBrowserStorage } from './browserStorage';

afterEach(() => vi.unstubAllGlobals());

describe('optional browser storage', () => {
  it('keeps the feedback route available when browser storage is blocked', () => {
    vi.stubGlobal('window', {
      location: { pathname: '/feedback', reload() {} },
      matchMedia: () => ({ matches: true }),
    });
    vi.stubGlobal('localStorage', { getItem() { throw new DOMException('blocked', 'SecurityError'); } });
    const html = renderToStaticMarkup(createElement(App));
    assert.match(html, /건의사항을 여는 중/);
    assert.doesNotMatch(html, /이 사이트의 저장소를 허용한 뒤 다시 시도해 주세요/);
  });

  it('falls back cleanly when reading preferences is blocked on app and feedback routes', () => {
    vi.stubGlobal('window', {
      location: { pathname: '/' },
      matchMedia: () => ({ matches: true }),
    });
    vi.stubGlobal('localStorage', {
      getItem() { throw new DOMException('blocked', 'SecurityError'); },
      setItem() { throw new DOMException('blocked', 'SecurityError'); },
    });

    assert.doesNotThrow(() => renderToStaticMarkup(createElement(App)));
    assert.doesNotThrow(() => renderToStaticMarkup(createElement(BrandHeader)));
    const html = renderToStaticMarkup(createElement(FeedbackRoute));
    assert.match(html, /우리의 아이디어 보관함/);
    assert.equal(readBrowserStorage('dos-language').available, false);
  });

  it('reports blocked writes without throwing or claiming the preference was saved', () => {
    vi.stubGlobal('localStorage', { setItem() { throw new DOMException('blocked', 'SecurityError'); } });
    assert.equal(writeBrowserStorage('dos-language', 'es'), false);
  });
});
