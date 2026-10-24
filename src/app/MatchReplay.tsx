import { useEffect, useRef, useState } from 'react';
import type { Language } from '../core/types';

type Props = { language: Language; pending: boolean; requiresAgreement?: boolean; onReplay: () => unknown | Promise<unknown> };

export function MatchReplay({ language, pending, requiresAgreement = true, onReplay }: Props) {
  const [busy, setBusy] = useState(false), [requested, setRequested] = useState(false), [error, setError] = useState(false);
  const inFlight = useRef(false);
  useEffect(() => { if (!pending) setRequested(false); }, [pending]);
  const waiting = requiresAgreement && requested;
  const ko = language === 'ko';
  const request = async () => {
    if (inFlight.current || waiting) return;
    inFlight.current = true;setBusy(true);setError(false);
    try { const accepted = await onReplay();if (accepted !== false && requiresAgreement) setRequested(true); }
    catch { setError(true); }
    finally { inFlight.current = false;setBusy(false); }
  };
  return <section className="match-replay" aria-label={ko ? '같은 게임 재경기' : 'Otra partida del mismo juego'}>
    {requiresAgreement && <p role={pending || waiting ? 'status' : undefined}>{ko ? waiting ? '상대의 동의를 기다리고 있어요.' : pending ? '상대가 새 판을 요청했어요.' : '두 사람 모두 동의하면 새 판을 시작해요.' : waiting ? 'Esperando a la otra persona.' : pending ? 'La otra persona pidió otra partida.' : 'La nueva partida empieza cuando ambos estén de acuerdo.'}</p>}
    <button type="button" className="button button-dark" disabled={busy || waiting} aria-busy={busy} onClick={() => void request()}>{ko ? busy ? '시작 중…' : waiting ? '동의 대기 중…' : requiresAgreement ? pending ? '동의하고 다시 하기' : '새 판 요청' : '다시 하기' : busy ? 'Iniciando…' : waiting ? 'Esperando aceptación…' : requiresAgreement ? pending ? 'Aceptar otra partida' : 'Pedir otra partida' : 'Jugar otra vez'}</button>
    {error && <p role="alert">{ko ? '새 판을 시작하지 못했어요. 다시 눌러 주세요.' : 'No se pudo iniciar otra partida. Inténtalo de nuevo.'}</p>}
  </section>;
}
