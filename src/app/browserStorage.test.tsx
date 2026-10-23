import { strict as assert } from 'node:assert';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, it, vi } from 'vitest';
import { App, BrandHeader } from './App';
import { FeedbackRoute } from './FeedbackRoute';
import { readBrowserStorage, writeBrowserStorage } from './browserStorage';

afterEach(() => vi.unstubAllGlobals());

describe('optional browser storage', () => {
  it('keeps the feedback SDK chunk from loading when its required storage probe is blocked', () => {
    vi.stubGlobal('window', {
      location: { pathname: '/feedback', reload() {} },
      matchMedia: () => ({ matches: true }),
    });
    vi.stubGlobal('localStorage', { getItem() { throw new DOMException('blocked', 'SecurityError'); } });
    const html = renderToStaticMarkup(createElement(App));
    assert.match(html, /브라우저 저장소를 사용할 수 없어요/);
    assert.match(html, /이 사이트의 저장소를 허용한 뒤 다시 시도해 주세요/);
    assert.match(html, /href="\/#games"/);
    assert.match(html, /다시 시도/);
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
    assert.match(html, /브라우저 저장소를 사용할 수 없어/);
    assert.equal(readBrowserStorage('dos-language').available, false);
  });

  it('reports blocked writes without throwing or claiming the preference was saved', () => {
    vi.stubGlobal('localStorage', { setItem() { throw new DOMException('blocked', 'SecurityError'); } });
    assert.equal(writeBrowserStorage('dos-language', 'es'), false);
  });
});
