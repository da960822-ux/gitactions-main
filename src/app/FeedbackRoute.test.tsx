import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FeedbackRoute } from './FeedbackRoute';

afterEach(() => vi.unstubAllGlobals());

describe('shared feedback route', () => {
  it('has one board without invite, join, or browser space controls', () => {
    vi.stubGlobal('localStorage', { getItem: () => null });
    const html = renderToStaticMarkup(createElement(FeedbackRoute));
    expect(html).toContain('우리의 아이디어 보관함');
    expect(html).not.toMatch(/참여하기|초대|invite|dos-feedback-space|참여 코드/);
    expect(html).toContain('아이디어를 불러오는 중');
  });
});
