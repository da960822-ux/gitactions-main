import { useEffect, useRef, useState } from 'react';

/** Use a seat/game/round key so reconnects and round resets never fake a gain. */
export function GameValue({ value, resetKey, format }: { value: number; resetKey: string; format?: (value: number) => string }) {
  const previous = useRef({ value, resetKey });
  const [change, setChange] = useState({ value, resetKey, delta: 0 });
  const delta = change.value === value && change.resetKey === resetKey ? change.delta : 0;
  useEffect(() => {
    const old = previous.current;
    previous.current = { value, resetKey };
    const difference = old.resetKey === resetKey && Number.isFinite(value) && Number.isFinite(old.value) ? value - old.value : 0;
    setChange({ value, resetKey, delta: difference });
    if (!difference) return;
    const timer = window.setTimeout(() => setChange({ value, resetKey, delta: 0 }), 1600);
    return () => window.clearTimeout(timer);
  }, [value, resetKey]);
  return <span className="game-value"><span className="game-value-number">{format ? format(value) : value}</span>{delta !== 0 && <span key={`${resetKey}:${value}`} className={`game-value-delta ${delta < 0 ? 'is-negative' : ''}`} aria-hidden="true">{delta > 0 ? '+' : '−'}{format ? format(Math.abs(delta)) : Math.abs(delta)}</span>}</span>;
}
