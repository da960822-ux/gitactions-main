import { useEffect, type RefObject } from 'react';

export function marbleSpaceTarget(phase: string, action?: string, continuation = false) {
  if (phase === 'debt' || phase === 'event-decision') return undefined;
  if (continuation) return 'continue';
  return ['roll', 'buy', 'build', 'endTurn'].includes(action ?? '') ? 'primary' : undefined;
}

const interactive = 'button,input,textarea,select,a,summary,[role="button"],[role="checkbox"],[role="textbox"],[contenteditable]:not([contenteditable="false"])';
const visible = (element: Element) => element.getClientRects().length > 0 && !element.closest('[hidden],[inert]');

export function bindMarbleSpaceAction(root: HTMLElement, enabled: () => boolean) {
  const doc = root.ownerDocument;
  const keydown = (event: KeyboardEvent) => {
    if (event.code !== 'Space' && event.key !== ' ') return;
    if (event.repeat || event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || !enabled() || !root.isConnected || !visible(root)) return;
    const target = event.target as Element | null;
    if (target?.closest?.(interactive) || doc.activeElement?.closest(interactive)) return;
    if (Array.from(doc.querySelectorAll('dialog[open],[role="dialog"],[role="alertdialog"],.game-sound-trigger[aria-expanded="true"]')).some(visible)) return;
    // A background Space belongs to a board only when it is the sole visible board.
    if (target && target !== doc.body && target !== doc.documentElement) {
      if (!root.contains(target)) return;
    } else if (Array.from(doc.querySelectorAll('[data-marble-space-board]')).filter(visible).length !== 1) return;
    const stage = root.querySelector<HTMLElement>('[data-marble-space-action]');
    const action = stage?.dataset.marbleSpaceAction;
    const selector = action === 'continue' ? '.mp-card-outcome > button, [data-marble-space-continue]' : action === 'primary' ? '#mp-action-primary, #mt-action-primary' : '';
    const button = selector ? stage?.querySelector<HTMLButtonElement>(selector) : null;
    if (!button || button.tagName !== 'BUTTON' || button.matches(':disabled,[aria-disabled="true"]') || !visible(button)) return;
    event.preventDefault();
    button.click();
  };
  doc.addEventListener('keydown', keydown);
  return () => doc.removeEventListener('keydown', keydown);
}

export function useMarbleSpaceAction(root: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => root.current ? bindMarbleSpaceAction(root.current, () => enabled) : undefined, [root, enabled]);
}
