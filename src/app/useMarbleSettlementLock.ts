import { useEffect, useRef, useState } from 'react';

const settlementActions = new Set(['buy', 'build', 'takeover', 'pay-rent', 'borrow', 'repay', 'sell-property', 'pay-escape', 'choose-train']);
const SETTLEMENT_MS = 850;

/** Holds the next decision while one confirmed cash/build effect finishes. */
export function useMarbleSettlementLock(transactionSequence?: number) {
  const [locked, setLocked] = useState(false);
  const held = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const lastSequence = useRef(transactionSequence ?? 0);
  const release = () => { window.clearTimeout(timer.current); held.current = false; setLocked(false); };
  const hold = () => {
    if (document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    held.current = true;
    setLocked(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(release, SETTLEMENT_MS);
  };
  useEffect(() => {
    const sequence = transactionSequence ?? 0;
    if (sequence <= lastSequence.current) return;
    lastSequence.current = sequence;
    hold();
  }, [transactionSequence]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onReduce = () => { if (media.matches) release(); };
    media.addEventListener('change', onReduce);
    return () => { media.removeEventListener('change', onReduce); window.clearTimeout(timer.current); };
  }, []);
  return { locked, held, holdAfterAction: (actionType: string, accepted: unknown) => {
    if (accepted !== false && settlementActions.has(actionType)) hold();
  } };
}
