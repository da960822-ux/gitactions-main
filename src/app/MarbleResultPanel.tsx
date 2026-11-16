import { MarbleVictoryEffects } from './MarbleEventEffects';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { Language } from '../core/types';
import { moneyText } from './marble-visuals';
import './marble-result-panel.css';

type Props = {
  language: Language;
  winnerLabel: string;
  reason: string;
  scores: { name: string; score: number }[];
  draw?: boolean;
  replayPending?: boolean;
  scoreLabel?: string;
  onReplay?: () => void | Promise<unknown>;
  onExit?: () => void | Promise<unknown>;
};

/** The modal keeps the final result visible and makes the finished board inert. */
export function MarbleResultPanel({ language, winnerLabel, reason, scores, draw = false, replayPending = false, scoreLabel, onReplay, onExit }: Props) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const pendingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const ko = language === 'ko';
  const scoresTitle = scoreLabel ?? (ko ? '최종 순자산' : 'Patrimonio final');
  useLayoutEffect(() => {
    const node = dialog.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (node && !node.open) node.showModal();
    heading.current?.focus();
    return () => {
      node?.close();
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  const run = async (callback: () => void | Promise<unknown>) => {
    if (pendingRef.current) return;
    pendingRef.current = true; setPending(true); setFailed(false);
    try { const accepted=await callback(); if(accepted===false)setFailed(true); }
    catch { setFailed(true); }
    finally { pendingRef.current = false; setPending(false); }
  };
  return <dialog ref={dialog} className="marble-result-panel" aria-modal="true" aria-labelledby={`${id}-winner`} aria-describedby={`${id}-reason`} onCancel={event => event.preventDefault()}>
    <div className="marble-result-emblem" aria-hidden="true"><MarbleVictoryEffects/>{draw ? <span>＝</span> : <svg viewBox="0 0 100 84"><path d="M15 64 7 20l24 19L50 9l19 30 24-19-8 44Z"/><path d="M18 75h64"/></svg>}</div>
    <p className="marble-result-finished">{ko ? '경기 종료 · 최종 결과' : 'Partida terminada · resultado final'}</p>
    <h2 ref={heading} tabIndex={-1} id={`${id}-winner`}>{winnerLabel}</h2>
    <p id={`${id}-reason`} className="marble-result-reason">{reason}</p>
    <section aria-label={scoresTitle} className="marble-result-scores">
      <h3>{scoresTitle}</h3>
      <dl>{scores.map(({ name, score }, index) => <div key={`${index}:${name}`}><dt>{name}</dt><dd>{moneyText(score, language)}</dd></div>)}</dl>
    </section>
    {failed && <p className="marble-result-error" role="alert">{ko ? '진행하지 못했어요. 다시 시도해 주세요.' : 'No se pudo continuar. Inténtalo de nuevo.'}</p>}
    {(onReplay || onExit) && <div className="marble-result-actions" aria-busy={pending}>
      {onReplay && <button type="button" className="marble-result-replay" disabled={pending || replayPending} onClick={() => void run(onReplay)}>{replayPending ? (ko ? '상대 동의 기다리는 중' : 'Esperando acuerdo') : (ko ? '새 게임 시작' : 'Jugar de nuevo')}</button>}
      {onExit && <button type="button" disabled={pending} onClick={() => void run(onExit)}>{ko ? '게임 나가기' : 'Salir del juego'}</button>}
    </div>}
  </dialog>;
}
