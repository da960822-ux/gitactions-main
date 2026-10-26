import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../core/feedback', () => ({ isFeedbackOnline: true, feedback: {} }));

import { FeedbackRoute } from './FeedbackRoute';

afterEach(() => vi.unstubAllGlobals());

describe('feedback invitation', () => {
  it('keeps an incoming space link available for an explicit join before creating a space', () => {
    const space = '11111111-1111-4111-8111-111111111111';
    vi.stubGlobal('window', { location: { search: `?space=${space}` } });
    vi.stubGlobal('localStorage', { getItem: () => null });
    const html = renderToStaticMarkup(createElement(FeedbackRoute));
    expect(html).toContain(`value="${space}"`);
    expect(html).toContain('참여 링크가 열렸어요');
    expect(html).toContain('참여하기');
    expect(html).not.toContain('Papi한테 보내기');
  });

  it('warns that existing ideas stay in the prior space before joining another', () => {
    vi.stubGlobal('window', { location: { search: '?space=11111111-1111-4111-8111-111111111111' } });
    vi.stubGlobal('localStorage', { getItem: (key: string) => key === 'dos-feedback-space' ? '22222222-2222-4222-8222-222222222222' : null });
    const html = renderToStaticMarkup(createElement(FeedbackRoute));
    expect(html).toContain('기존 아이디어는 이전 공간에 남으니');
    expect(html).not.toContain('첫 아이디어를 기다리고 있어요');
  });
});
