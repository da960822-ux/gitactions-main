import { useEffect, useRef, useState } from 'react';
import type { GameResult, Language, PlayerId } from '../core/types';
import '../styles/davinci-match-summary.css';

type SessionRecord = { roomId: string; p1: number; p2: number; draws: number };
type ResultTracker = { roomId: string; complete: boolean };
type Progress = { record: SessionRecord; tracker: ResultTracker };

const emptyRecord = (roomId: string): SessionRecord => ({ roomId, p1: 0, p2: 0, draws: 0 });

export function advanceDaVinciRecord(record: SessionRecord, tracker: ResultTracker, roomId: string, result: GameResult | null): Progress {
  const current = record.roomId === roomId && tracker.roomId === roomId ? record : emptyRecord(roomId);
  const alreadyCounted = tracker.roomId === roomId && tracker.complete;
  if (!result) return { record: current, tracker: { roomId, complete: false } };
  if (alreadyCounted) return { record: current, tracker: { roomId, complete: true } };
  const next = result.winner === 'draw' ? { ...current, draws: current.draws + 1 }
    : result.winner === 'p1' || result.winner === 'p2' ? { ...current, [result.winner]: current[result.winner] + 1 }
    : current;
  return { record: next, tracker: { roomId, complete: true } };
}

type Props = {
  roomId: string;
  playerId: PlayerId;
  language: Language;
  view: any;
  pendingGame: string | null;
  onReplay: () => Promise<void> | void;
};
const text = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;

export function DaVinciMatchSummary({ roomId, playerId, language, view, pendingGame, onReplay }: Props) {
  const [record, setRecord] = useState(() => emptyRecord(roomId));
  const [replayBusy, setReplayBusy] = useState(false);
  const replayBusyRef = useRef(false);
  const mountedRef = useRef(true);
  const recordRef = useRef(record);
  const tracker = useRef<ResultTracker>({ roomId, complete: false });
  const result: GameResult | null = view?.result ?? null;
  const progress = advanceDaVinciRecord(record, tracker.current, roomId, result);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const next = advanceDaVinciRecord(recordRef.current, tracker.current, roomId, result);
    recordRef.current = next.record;
    tracker.current = next.tracker;
    setRecord(next.record);
  }, [roomId, result]);

  if (!result) return null;
  const p1Label = text(language, '1번 자리', 'Jugador 1');
  const p2Label = text(language, '2번 자리', 'Jugador 2');
  const replayPending = pendingGame === 'davinci';
  const requestReplay = async () => {
    if (replayBusyRef.current) return;
    replayBusyRef.current = true;
    setReplayBusy(true);
    try { await onReplay(); }
    catch { /* The room owner reports selection failures. */ }
    finally {
      replayBusyRef.current = false;
      if (mountedRef.current) setReplayBusy(false);
    }
  };

  return <section className="davinci-session-summary" aria-label={text(language, '이 접속의 다빈치 전적', 'Récord de Da Vinci en esta sesión')} data-viewer={playerId}>
    <div className="davinci-session-record">
      <h3>{text(language, '이 접속의 전적', 'Récord de esta sesión')}</h3>
      <div className="davinci-session-scores" aria-live="polite">
        <span><b>{p1Label}</b><strong>{progress.record.p1}</strong><small>{text(language, '승', 'victorias')}</small></span>
        <span><b>{p2Label}</b><strong>{progress.record.p2}</strong><small>{text(language, '승', 'victorias')}</small></span>
        <span><b>{text(language, '무승부', 'Empates')}</b><strong>{progress.record.draws}</strong></span>
      </div>
      <small className="davinci-session-scope">{text(language, '이 브라우저 접속 중 확인된 결과만 보여 줘.', 'Cuenta solo resultados vistos durante esta sesión del navegador.')}</small>
    </div>
    <div className="davinci-replay">
      {replayPending && <p role="status">{text(language, '다빈치 새 판 선택이 진행 중이야. 두 사람 모두 선택하면 시작돼.', 'Da Vinci está pendiente. La partida comienza cuando ambas personas lo elijan.')}</p>}
      <button type="button" disabled={replayBusy} aria-busy={replayBusy} onClick={() => void requestReplay()}>{replayBusy ? text(language, '요청 중…', 'Enviando…') : replayPending ? text(language, '다빈치 선택', 'Elegir Da Vinci') : text(language, '새 판 요청', 'Pedir otra partida')}</button>
      <small>{text(language, '새 판은 두 사람의 선택이 모두 모이면 시작돼.', 'La nueva partida comienza cuando ambas personas la elijan.')}</small>
    </div>
  </section>;
}
