import { useRef, useState } from 'react';
import type { Language } from '../core/types';

export function MatchReplay({ language, pending, onReplay }: { language: Language; pending: boolean; onReplay: () => Promise<unknown> }) {
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const request = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try { await onReplay(); }
    finally { inFlight.current = false; setBusy(false); }
  };
  return <section className="match-replay" aria-label={language === 'ko' ? '같은 게임 재경기' : 'Otra partida del mismo juego'}>
    <p role={pending ? 'status' : undefined}>{language === 'ko' ? pending ? '새 판 요청이 있어요. 두 사람 모두 선택하면 시작합니다.' : '같은 방에서 새 판을 할 수 있어요. 두 사람 모두 동의해야 시작합니다.' : pending ? 'Hay una solicitud. La nueva partida empieza cuando ambos la acepten.' : 'Pueden jugar otra partida en esta sala cuando ambos estén de acuerdo.'}</p>
    <button type="button" className="button button-dark" disabled={busy} aria-busy={busy} onClick={() => void request()}>{language === 'ko' ? busy ? '요청 중…' : pending ? '새 판 선택' : '새 판 요청' : busy ? 'Enviando…' : pending ? 'Aceptar otra partida' : 'Pedir otra partida'}</button>
  </section>;
}
