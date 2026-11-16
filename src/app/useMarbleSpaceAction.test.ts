import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import MarbleBoard from './MarbleBoard';
import MarbleTeamBoard from './MarbleTeamBoard';
import { createLegacyMarbleState, marbleEngine } from '../games/marble';
import { createFourLegacyMarbleState, fourMarbleEngine } from '../games/fourMarble';
import { describe, expect, it, vi } from 'vitest';
import { bindMarbleSpaceAction, marbleSpaceTarget } from './useMarbleSpaceAction';

function setup() {
  let listener: (event: any) => void = () => {};
  const rects = () => [{}];
  const button = { tagName: 'BUTTON', matches: vi.fn(() => false), closest: () => null, getClientRects: rects, click: vi.fn() };
  const stage = { dataset: { marbleSpaceAction: 'primary' }, querySelector: vi.fn(() => button) };
  const body = { closest: () => null };
  const doc = { body, documentElement: {}, activeElement: body, addEventListener: vi.fn((_type, fn) => { listener = fn; }), removeEventListener: vi.fn(), querySelectorAll: vi.fn((selector: string): any[] => selector === '[data-marble-space-board]' ? [root] : []) };
  const root = { ownerDocument: doc, isConnected: true, getClientRects: rects, closest: () => null, contains: vi.fn(() => true), querySelector: vi.fn(() => stage) };
  const enabled = vi.fn(() => true);
  const cleanup = bindMarbleSpaceAction(root as unknown as HTMLElement, enabled);
  const press = (props = {}) => { const event = { code: 'Space', target: body, preventDefault: vi.fn(function(this: any) { this.defaultPrevented = true; }), ...props }; listener(event); return event; };
  return { root, doc, stage, button, enabled, cleanup, press };
}

describe('Marble Space action', () => {
  it('only opts into safe primary actions and explicit continuation', () => {
    for (const action of ['roll', 'buy', 'build', 'endTurn']) expect(marbleSpaceTarget('main', action)).toBe('primary');
    for (const action of ['borrow', 'repay', 'declare-bankruptcy', 'sell-property', 'takeover', 'choose-event-city']) expect(marbleSpaceTarget('main', action)).toBeUndefined();
    expect(marbleSpaceTarget('debt', 'buy', true)).toBeUndefined();
    expect(marbleSpaceTarget('event-decision', 'build', true)).toBeUndefined();
    expect(marbleSpaceTarget('main', undefined, true)).toBe('continue');
  });
  it('clicks once, prevents scrolling only when handled and removes its listener', () => {
    const s = setup(), event = s.press();
    expect(s.button.click).toHaveBeenCalledOnce(); expect(event.preventDefault).toHaveBeenCalledOnce();
    s.press({ defaultPrevented: true }); expect(s.button.click).toHaveBeenCalledOnce();
    s.cleanup(); expect(s.doc.removeEventListener).toHaveBeenCalledWith('keydown', s.doc.addEventListener.mock.calls[0][1]);
  });
  it('ignores repeats, typing, native controls, modifiers, Escape and pending actions', () => {
    const s = setup();
    for (const props of [{ repeat: true }, { isComposing: true }, { ctrlKey: true }, { shiftKey: true }, { code: 'Escape', key: 'Escape' }, { target: { closest: () => ({}) } }]) expect(s.press(props).preventDefault).not.toHaveBeenCalled();
    s.enabled.mockReturnValue(false); s.press(); expect(s.button.click).not.toHaveBeenCalled();
  });
  it('rejects disabled buttons, detached boards and ambiguous background boards', () => {
    const s = setup(); s.button.matches.mockReturnValue(true); s.press();
    s.button.matches.mockReturnValue(false); s.root.isConnected = false; s.press();
    s.root.isConnected = true; s.doc.querySelectorAll.mockImplementation(selector => selector === '[data-marble-space-board]' ? [s.root, s.root] : []); s.press();
    expect(s.button.click).not.toHaveBeenCalled();
  });
  it('blocks open dialogs, outside-board focus and unmarked new decisions', () => {
    const s = setup(); s.doc.querySelectorAll.mockReturnValue([s.root]); s.press();
    s.doc.querySelectorAll.mockImplementation(selector => selector === '[data-marble-space-board]' ? [s.root] : []);
    s.root.contains.mockReturnValue(false); s.press({ target: { closest: () => null } });
    s.stage.dataset.marbleSpaceAction = ''; s.press(); expect(s.button.click).not.toHaveBeenCalled();
  });
});


describe('board shortcut opt-in', () => {
  it('marks both active boards and translates the visible hint', () => {
    for (const language of ['ko', 'es'] as const) {
      const boards = [
        createElement(MarbleBoard, { view: marbleEngine.getPlayerView(createLegacyMarbleState(71), 'p1'), language, playerId: 'p1', runAction: vi.fn() }),
        createElement(MarbleTeamBoard, { view: fourMarbleEngine.getPlayerView(createFourLegacyMarbleState(71), 'p1'), language, runAction: vi.fn() }),
      ];
      for (const board of boards) {
        const html = renderToStaticMarkup(board);
        expect(html).toContain('data-marble-space-board=""');
        expect(html).toContain('data-marble-space-action="primary"');
        expect(html).toContain(language === 'ko' ? 'Space · 현재 행동 실행' : 'Espacio · acción actual');
      }
    }
  });
  it('never enables the other player’s board', () => {
    const view = marbleEngine.getPlayerView(createLegacyMarbleState(71), 'p2');
    const html = renderToStaticMarkup(createElement(MarbleBoard, { view, language: 'ko', playerId: 'p2', runAction: vi.fn() }));
    expect(html).not.toContain('data-marble-space-action=');
    expect(html).not.toContain('Space · 현재 행동 실행');
  });
});
