import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { approvedPawns, pawnSource } from './LocalEventRig';
import { sharedEventsClient, isSharedEventsConfigured, type SharedEventSnapshot } from '../../src/core/sharedEventsClient';
import type { SharedEventId, SharedEventIntent, SharedEventRound, SharedEventSeat } from '../../src/core/sharedEventsState';
import { appendDrawingPoint, canChooseNewRound, gridPoint, matchesPattern, sharedStartMode, MAX_DRAW_POINTS, DRAW_GRID_COLUMNS, DRAW_GRID_ROWS } from './SharedEventsPanel.logic';
import SharedEventsOutcome from './SharedEventsOutcome';
import './shared-events.css';

const patterns: ReadonlyArray<number> = [0, 1, 2, 3, 4, 5];
const eventNames = {
  ko: { R01: '봉투 같이 열기', R02: '장식 말 보내기', R03: '그림 반쪽 합치기', R04: '패턴 번갈아 맞추기' },
  es: { R01: 'Abrir el sobre juntos', R02: 'Enviar una figura', R03: 'Unir dos dibujos', R04: 'Repetir los patrones por turnos' },
};
const copy = {
  ko: {
    title: '둘이서 함께', intro: '초대를 만들거나 받은 코드로 참여해. 두 사람 모두 동의해야 시작해.', sharing: '그림은 초대한 상대와만 공유하고 세션 동안 임시 보관해. ‘세션 나가기’를 누르면 지워져. 만료되면 접근이 차단되고, 5분마다 실행되는 정리 때 삭제돼.', unavailable: '공동 이벤트 서버에 연결할 수 없어. 연결 후 다시 시도해.', create: '초대 만들기', invite: '초대 코드', copy: '코드 복사', copied: '복사했어', joinLabel: '초대 코드 입력', join: '참여하기', leave: '세션 나가기', waiting: '상대가 참여하기를 기다리는 중', waitingFor: '상대의 동의를 기다리는 중', memberCount: (n: number) => `${n}/2명 참여`, connected: '내 연결 상태: 연결됨', reconnecting: '내 연결 상태: 재연결 중 · 과거 이벤트는 재생하지 않아', expires: '세션 만료', eventPicker: '함께 해볼 이벤트', propose: '제안하기', replace: '내 선택 바꾸기', select: '장식 말을 골라서 보내봐.', send: '보내기', accept: '받기', ready: '동의하기', readyBoth: '두 사람의 동의를 기다리는 중', confirm: '한 번 더 확인하기', scheduled: '두 사람 모두 확인했어. 시작을 기다리는 중.', started: '시작됐어. 각자 원하는 때에 진행해.', cancelled: '이 이벤트는 취소됐어.', expired: '이벤트 시간이 끝났어.', cancel: '취소하기', sender: '보낸 사람', independent: '각자 열고 읽는 위치는 서로에게 전달되지 않아.', draw: '점으로 그림을 그려봐.', drawButtons: '버튼으로 점 찍기', addPoint: '점 추가', clear: '그림 지우기', sendHalf: '내 반쪽 보내기', halfSent: '내 반쪽을 보냈어.', merged: '두 반쪽이 하나의 카드가 됐어.', drawLimit: '점은 200개까지야.', makePattern: '최대 여섯 칸의 패턴을 만들어.', addBeat: '패턴에 칸 추가', removeBeat: '마지막 칸 지우기', sendPattern: '패턴 보내기', repeatOther: '상대 패턴 따라 누르기', acknowledged: '상대 패턴을 확인했어.', patternMismatch: '상대와 같은 순서로 눌러야 해.', turns: '두 사람이 차례로 만든 패턴이야.', playPattern: '패턴 보기', you: '나', other: '상대', sessionExpired: '세션이 만료됐어. 새 초대를 만들어.', sessionUnavailable: '세션을 찾을 수 없거나 더 이상 참여할 수 없어.', error: '공동 이벤트를 진행하지 못했어.', auth: '계정 인증이 필요해. 로그인한 뒤 다시 시도해.', roundUnavailable: '지금은 이 이벤트를 시작할 수 없어.', cooldown: '방금 이벤트가 시작됐어. 잠시 뒤 다시 제안해.', cancelWait: '취소 중…', status: '상태', retrySnapshot: '최신 상태 확인', noReplay: '재연결하면 서버의 현재 상태부터 이어가. 지나간 장면은 재생되지 않아.',
  },
  es: {
    title: 'Para los dos', intro: 'Crea una invitación o entra con un código. Ambos tienen que aceptar para empezar.', sharing: 'El dibujo se guarda temporalmente y solo se comparte con la persona invitada. Al pulsar «Salir de la sesión» se borra. Al vencer, se bloquea el acceso y se elimina en la siguiente limpieza, cada cinco minutos.', unavailable: 'El servicio de eventos compartidos no está conectado. Inténtalo cuando esté disponible.', create: 'Crear invitación', invite: 'Código de invitación', copy: 'Copiar código', copied: 'Copiado', joinLabel: 'Escribe el código', join: 'Entrar', leave: 'Salir de la sesión', waiting: 'Esperando a que la otra persona entre', waitingFor: 'Esperando el consentimiento de la otra persona', memberCount: (n: number) => `${n}/2 participantes`, connected: 'Tu conexión: conectada', reconnecting: 'Tu conexión: reconectando · No se reproducen eventos pasados', expires: 'La sesión vence', eventPicker: 'Elige algo para hacer juntos', propose: 'Proponer', replace: 'Cambiar mi elección', select: 'Elige una figura y envíala.', send: 'Enviar', accept: 'Aceptar', ready: 'Aceptar', readyBoth: 'Esperando el consentimiento de ambos', confirm: 'Confirmar una vez más', scheduled: 'Ambos confirmaron. Esperando el inicio.', started: 'Ya empezó. Cada uno puede seguir a su propio ritmo.', cancelled: 'Se canceló este evento.', expired: 'Se acabó el tiempo para este evento.', cancel: 'Cancelar', sender: 'Persona que envía', independent: 'Cada uno abre y lee por su cuenta; la posición de lectura no se comparte.', draw: 'Dibuja con puntos.', drawButtons: 'Dibujar con botones', addPoint: 'Añadir punto', clear: 'Borrar dibujo', sendHalf: 'Enviar mi mitad', halfSent: 'Ya envié mi mitad.', merged: 'Las dos mitades forman una tarjeta.', drawLimit: 'Puedes usar hasta 200 puntos.', makePattern: 'Crea un patrón de hasta seis pasos.', addBeat: 'Añadir un paso', removeBeat: 'Borrar el último paso', sendPattern: 'Enviar patrón', repeatOther: 'Repetir el patrón de la otra persona', acknowledged: 'Ya repetiste el patrón de la otra persona.', patternMismatch: 'Sigue el mismo orden que la otra persona.', turns: 'Cada persona creó un patrón por turnos.', playPattern: 'Ver patrón', you: 'Yo', other: 'La otra persona', sessionExpired: 'La sesión venció. Crea otra invitación.', sessionUnavailable: 'La sesión no existe o ya no está disponible.', error: 'No se pudo completar el evento compartido.', auth: 'Necesitas autenticar tu cuenta. Inicia sesión e inténtalo de nuevo.', roundUnavailable: 'No se puede empezar este evento ahora.', cooldown: 'El evento acaba de empezar. Espera un poco antes de proponer otro.', cancelWait: 'Cancelando…', status: 'Estado', retrySnapshot: 'Revisar estado actual', noReplay: 'Al reconectar, se retoma el estado actual del servidor. No se reproducen escenas pasadas.',
  },
};

const otherSeat = (seat: SharedEventSeat): SharedEventSeat => seat === 'p1' ? 'p2' : 'p1';
const asRecord = (value: SharedEventIntent): Record<string, unknown> | null => value && typeof value === 'object' ? value : null;

function messageForError(error: unknown, language: 'ko' | 'es') {
  const code = error instanceof Error ? error.message : '';
  const t = copy[language];
  if (code.includes('online_unavailable')) return t.unavailable;
  if (code.includes('auth') || code.includes('login')) return t.auth;
  if (code.includes('expired')) return t.sessionExpired;
  if (code.includes('event_cooldown')) return t.cooldown;
  if (code.includes('session') || code.includes('invite')) return t.sessionUnavailable;
  if (code.includes('unavailable') || code.includes('stale')) return t.roundUnavailable;
  if (code.includes('pattern_mismatch')) return t.patternMismatch;
  return t.error;
}

type Props = { language: 'ko' | 'es'; onSharedStart?: (round: SharedEventRound, options: { settle: boolean }) => void; initialEventId?: SharedEventId; initiallyOpen?: boolean };
export default function SharedEventsPanel({ language, onSharedStart, initialEventId, initiallyOpen = false }: Props) {
  const t = copy[language];
  const [snapshot, setSnapshot] = useState<SharedEventSnapshot | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [decorId, setDecorId] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<SharedEventId>(initialEventId ?? 'R01');
  const [points, setPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [pattern, setPattern] = useState<number[]>([]);
  const [repeatInput, setRepeatInput] = useState<number[]>([]);
  const [displayedPatternSeat, setDisplayedPatternSeat] = useState<SharedEventSeat | null>(null);
  const [playbackStep, setPlaybackStep] = useState<number | null>(null);
  const [motionRoundId, setMotionRoundId] = useState<string | null>(null);
  const previous = useRef<SharedEventSnapshot | null>(null);
  const mounted = useRef(false);
  const languageRef = useRef(language);
  languageRef.current = language;
  const onStart = useRef(onSharedStart);
  onStart.current = onSharedStart;
  const inviteInput = useRef<HTMLInputElement>(null);
  const summaryInput = useRef<HTMLElement>(null);
  const lifecycle = useRef<Promise<unknown>>(Promise.resolve());

  const receive = useCallback((next: SharedEventSnapshot | null) => {
    if (!mounted.current) return;
    if (!next) {
      previous.current = null;
      setSnapshot(null);
      setMotionRoundId(null);
      setPoints([]);
      setPattern([]);
      setRepeatInput([]);
      return;
    }
    const old = previous.current;
    const sameSession = old?.sessionId === next.sessionId;
    const startMode = sharedStartMode(old, next);
    if (startMode && next.round.eventId === 'R01') onStart.current?.(next.round, { settle: startMode === 'settle' });
    if (startMode === 'animate' && next.round.eventId !== 'R01'
      && document.visibilityState === 'visible' && summaryInput.current?.closest('details')?.open
      && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setMotionRoundId(next.round.roundId);
    }
    if (next.connection !== 'connected' || old?.syncEpoch !== next.syncEpoch
      || !['scheduled', 'started'].includes(next.round.status) || startMode === 'settle') setMotionRoundId(null);
    if (sameSession && old.syncEpoch !== next.syncEpoch) {
      setPoints([]);
      setPattern([]);
      setRepeatInput([]);
      setDisplayedPatternSeat(null);
    }
    previous.current = next;
    setSnapshot(next);
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const contextualOptIn = Boolean(initialEventId && initiallyOpen);
  useEffect(() => {
    if (!contextualOptIn) return;
    let active = true;
    const unsubscribe = sharedEventsClient.subscribe(next => { if (active) receive(next); });
    if (sharedEventsClient.getSnapshot()) {
      void sharedEventsClient.resume()
        .then(next => { if (active) receive(next); })
        .catch(cause => { if (active && mounted.current) setError(messageForError(cause, languageRef.current)); });
    }
    return () => { active = false; unsubscribe(); };
  }, [contextualOptIn, receive]);
  useEffect(() => {
    if (contextualOptIn || !snapshot) return;
    return sharedEventsClient.subscribe(receive);
  }, [contextualOptIn, snapshot?.sessionId, receive]);
  useEffect(() => {
    if (!motionRoundId) return;
    const timer = window.setTimeout(() => setMotionRoundId(null), 1200);
    const settleWhenHidden = () => { if (document.hidden) setMotionRoundId(null); };
    document.addEventListener('visibilitychange', settleWhenHidden);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', settleWhenHidden); };
  }, [motionRoundId]);
  async function run(task: () => Promise<SharedEventSnapshot | void>) {
    if (!mounted.current) return;
    setBusy(true); setError('');
    try { const next = await task(); if (next) receive(next); }
    catch (cause) { if (mounted.current) setError(messageForError(cause, language)); }
    finally { if (mounted.current) setBusy(false); }
  }

  const createSession = () => run(() => sharedEventsClient.createSession());
  const joinSession = () => run(() => sharedEventsClient.joinSession(code.trim()));
  const send = (input: Parameters<typeof sharedEventsClient.send>[0]) => run(() => sharedEventsClient.send(input));
  async function copyInvite() {
    if (!snapshot) return;
    try { await navigator.clipboard.writeText(snapshot.sessionId); if (mounted.current) setCopied(true); }
    catch { if (mounted.current) { inviteInput.current?.focus(); inviteInput.current?.select(); } }
  }
  const round = snapshot?.round;
  const seat = snapshot?.seat;
  const active = Boolean(round && ['proposed', 'scheduled', 'started'].includes(round.status));
  const memberSeat = seat && otherSeat(seat);
  const ownIntent = seat ? asRecord(round?.intentBy[seat] ?? null) : null;
  const otherIntent = memberSeat ? asRecord(round?.intentBy[memberSeat] ?? null) : null;
  const bothIntents = Boolean(round && round.intentBy.p1 !== undefined && round.intentBy.p2 !== undefined);
  const ownReady = Boolean(seat && round?.readyBy[seat]);
  const bothReady = Boolean(round?.readyBy.p1 && round?.readyBy.p2);
  const ownConfirmed = Boolean(seat && round?.confirmBy[seat]);
  const ownAck = Boolean(seat && round?.ackBy?.[seat]);
  const otherAck = Boolean(memberSeat && round?.ackBy?.[memberSeat]);
  const otherPattern = otherIntent && Array.isArray(otherIntent.pattern) ? otherIntent.pattern : [];
  const hasMembers = snapshot?.memberCount === 2;

  useEffect(() => {
    if (!displayedPatternSeat || round?.status !== 'started') { setPlaybackStep(null); return; }
    const value = asRecord(round.intentBy[displayedPatternSeat] ?? null)?.pattern;
    if (!Array.isArray(value)) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setPlaybackStep(null); setDisplayedPatternSeat(null); return; }
    let step = 0;
    setPlaybackStep(step);
    const timer = window.setInterval(() => {
      step++;
      if (step >= value.length) { clearInterval(timer); setPlaybackStep(null); setDisplayedPatternSeat(null); return; }
      setPlaybackStep(step);
    }, 420);
    return () => clearInterval(timer);
  }, [displayedPatternSeat, round?.roundId, round?.status]);

  function propose(eventId: SharedEventId) {
    let intent: SharedEventIntent = null;
    if (eventId === 'R02') intent = { decorId: decorId as 'fox' | 'cat' | 'penguin' | 'astronaut' | 'robot' | 'dragon' | 'sali-suli' };
    if (eventId === 'R03') intent = { points };
    if (eventId === 'R04') intent = { pattern };
    return send({ type: 'propose', eventId, intent });
  }

  function contribute() {
    if (round?.eventId === 'R03') return send({ type: 'contribute', intent: { points } });
    return send({ type: 'contribute', intent: { pattern } });
  }

  function repeatStep(step: number) {
    const next = [...repeatInput, step];
    setRepeatInput(next);
    if (next.length < otherPattern.length) return;
    if (matchesPattern(next, otherPattern)) {
      void send({ type: 'acknowledge', pattern: otherPattern });
      setRepeatInput([]);
      setDisplayedPatternSeat(null);
    } else {
      setError(t.patternMismatch);
      setRepeatInput([]);
    }
  }

  function addPointerPoint(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const col = Math.max(0, Math.min(DRAW_GRID_COLUMNS - 1, Math.round((event.clientX - rect.left) / rect.width * (DRAW_GRID_COLUMNS - 1))));
    const row = Math.max(0, Math.min(DRAW_GRID_ROWS - 1, Math.round((event.clientY - rect.top) / rect.height * (DRAW_GRID_ROWS - 1))));
    setPoints(old => appendDrawingPoint(old, { x: col / (DRAW_GRID_COLUMNS - 1), y: row / (DRAW_GRID_ROWS - 1) }));
  }

  function onDetailsToggle(event: React.SyntheticEvent<HTMLDetailsElement>) {
    const isOpen = event.currentTarget.open;
    if (!isOpen) setMotionRoundId(null);
    if (!snapshot) return;
    lifecycle.current = lifecycle.current.then(async () => {
      if (isOpen) receive(await sharedEventsClient.resume());
      else await sharedEventsClient.pause();
    }).catch(cause => { if (mounted.current) setError(messageForError(cause, language)); });
  }

  function onPanelKeyDown(event: KeyboardEvent<HTMLDetailsElement>) {
    const pendingRound = round?.status === 'proposed' || round?.status === 'scheduled';
    if (event.key !== 'Escape' || !pendingRound) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.open = false;
    summaryInput.current?.focus();
  }

  const drawingEditor = <div className="shared-drawing-tools">
    <p>{t.draw} <small>{points.length}/{MAX_DRAW_POINTS}</small></p>
    <svg className="shared-drawing" viewBox="0 0 100 100" role="img" aria-label={t.draw} onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); addPointerPoint(event); }}>
      {[...Array(DRAW_GRID_COLUMNS)].map((_, col) => [...Array(DRAW_GRID_ROWS)].map((__, row) => <circle key={`${col}-${row}`} cx={col * 25} cy={row * 25} r="2"/>))}
      {points.length > 1 && <polyline points={points.map(point => `${point.x * 100},${point.y * 100}`).join(' ')}/>}
      {points.map((point, index) => <circle className="shared-drawing-point" key={index} cx={point.x * 100} cy={point.y * 100} r="3"/>)}
    </svg>
    <details className="shared-drawing-fallback"><summary>{t.drawButtons}</summary><div className="shared-grid-buttons" aria-label={t.addPoint}>{Array.from({ length: 25 }, (_, index) => <button type="button" key={index} aria-label={`${t.addPoint} ${index + 1}`} disabled={points.length >= MAX_DRAW_POINTS} onClick={() => setPoints(old => appendDrawingPoint(old, gridPoint(index)))}>{index + 1}</button>)}</div></details>
    <button type="button" disabled={busy || !points.length} onClick={() => setPoints([])}>{t.clear}</button>
  </div>;

  return <details className="shared-events" data-initial-event-id={initialEventId} open={initiallyOpen} onToggle={onDetailsToggle} onKeyDown={onPanelKeyDown}>
    <summary ref={summaryInput}>{t.title}</summary>
    <div className="shared-events-body">
      <p className="shared-events-intro">{t.intro}</p>
      {!isSharedEventsConfigured && <p className="shared-events-message" role="status">{t.unavailable}</p>}
      {isSharedEventsConfigured && !snapshot && <div className="shared-events-lobby">
        <button type="button" disabled={busy} onClick={createSession}>{t.create}</button>
        <label>{t.joinLabel}<input value={code} onChange={event => setCode(event.target.value)} autoComplete="off" spellCheck={false} aria-describedby="shared-join-help" /></label>
        <button type="button" disabled={busy || !code.trim()} onClick={joinSession}>{t.join}</button>
        <small id="shared-join-help">{language === 'ko' ? '초대 코드는 대소문자를 그대로 입력해.' : 'Escribe el código tal como lo recibiste.'}</small>
      </div>}
      {snapshot && <>
        <p className="shared-events-note">{t.sharing}</p>
        <div className="shared-events-session">
          <p role="status">{snapshot.connection === 'reconnecting' ? t.reconnecting : t.connected} · {t.memberCount(snapshot.memberCount)}</p>
          <label>{t.invite}<input ref={inviteInput} readOnly value={snapshot.sessionId} aria-label={t.invite} /></label>
          <button type="button" disabled={busy} onClick={copyInvite}>{copied ? t.copied : t.copy}</button>
          <small>{t.expires}: <time dateTime={new Date(snapshot.expiresAt).toISOString()}>{new Date(snapshot.expiresAt).toLocaleString(language === 'ko' ? 'ko-KR' : 'es-DO')}</time></small>
          <button type="button" className="shared-events-leave" disabled={busy} onClick={() => run(async () => { await sharedEventsClient.closeSession(); previous.current = null; setSnapshot(null); setCopied(false); return; })}>{t.leave}</button>
        </div>
        {!hasMembers ? <p role="status">{t.waiting}</p> : <>
          {snapshot.connection === 'reconnecting' && <p className="shared-events-note">{t.noReplay}</p>}
          {round && active && <section className="shared-round" aria-labelledby="shared-round-title">
            <h3 id="shared-round-title">{eventNames[language][round.eventId]}</h3>
            <p role="status">{t.status}: {round.status === 'proposed' ? t.waitingFor : round.status === 'scheduled' ? t.scheduled : t.started}</p>
            {round.eventId === 'R01' && <p>{t.independent}</p>}
            {round.status === 'proposed' && round.eventId === 'R03' && <div className="shared-drawing-tools">{drawingEditor}<button type="button" disabled={busy || !points.length} onClick={contribute}>{t.sendHalf}</button></div>}
            {round.status === 'proposed' && round.eventId === 'R04' && <div className="shared-pattern-tools">
              <p>{t.makePattern} <small>{pattern.length}/6</small></p>
              <div className="shared-pattern-builder" role="group" aria-label={t.makePattern}>{patterns.map(step => <button type="button" key={step} disabled={pattern.length >= 6} onClick={() => setPattern(old => old.length < 6 ? [...old, step] : old)}>{step + 1}</button>)}</div>
              <p className="shared-pattern-code" aria-label={t.sendPattern}>{pattern.map(step => <span key={`${step}-${pattern.indexOf(step)}`}>{step + 1}</span>)}</p>
              <button type="button" disabled={busy || !pattern.length} onClick={() => setPattern(old => old.slice(0, -1))}>{t.removeBeat}</button>
              <button type="button" disabled={busy || !pattern.length} onClick={contribute}>{t.sendPattern}</button>
            </div>}
            {(round.eventId === 'R02' || (round.eventId === 'R03' && bothIntents)) && seat && <SharedEventsOutcome key={`${snapshot.sessionId}:${round.roundId}`} round={round} seat={seat} language={language} animate={motionRoundId === round.roundId}/> }
            {round.eventId === 'R04' && bothIntents && <div className="shared-pattern-turns"><p>{t.turns}</p>{[round.intentBy.p1, round.intentBy.p2].map((intent, index) => { const currentSeat: SharedEventSeat = index === 0 ? 'p1' : 'p2'; const steps = asRecord(intent ?? null)?.pattern; return <div className="shared-pattern-turn" key={index}><p><b>{currentSeat === seat ? t.you : t.other}:</b></p><div aria-label={currentSeat === seat ? t.you : t.other} className="shared-pattern-machine">{Array.isArray(steps) ? (steps as number[]).map((step, i) => <span key={`${step}-${i}`} data-step={step} className={displayedPatternSeat === currentSeat && playbackStep === i ? 'is-active' : ''}>{step + 1}</span>) : null}</div>{round.status === 'started' && <button type="button" disabled={displayedPatternSeat !== null} onClick={() => setDisplayedPatternSeat(currentSeat)}>{t.playPattern} · {currentSeat === seat ? t.you : t.other}</button>}</div>; })}
              {round.status === 'proposed' && !ownAck && otherPattern.length > 0 && <><p>{t.repeatOther} · {repeatInput.map(step => step + 1).join(' · ')}</p><div className="shared-pattern-builder">{patterns.map(step => <button type="button" key={step} disabled={busy || repeatInput.length >= otherPattern.length} onClick={() => repeatStep(step)}>{step + 1}</button>)}</div></>}{ownAck && <p role="status">{t.acknowledged}</p>}{otherAck && <p>{t.other}: {t.acknowledged}</p>}
            </div>}
            {round.status === 'proposed' && <div className="shared-round-actions">
              {round.eventId !== 'R02' && round.eventId !== 'R03' && round.eventId !== 'R04' && <button type="button" disabled={busy || ownReady} onClick={() => send({ type: 'ready' })}>{t.ready}</button>}
              {round.eventId === 'R02' && <button type="button" disabled={busy || ownReady} onClick={() => send({ type: 'ready' })}>{round.intentBy[seat!] ? t.ready : t.accept}</button>}
              {round.eventId === 'R03' && bothIntents && <><p>{ownReady ? t.halfSent : t.readyBoth}</p><button type="button" disabled={busy || ownReady} onClick={() => send({ type: 'ready' })}>{t.ready}</button></>}
              {round.eventId === 'R04' && bothIntents && ownAck && otherAck && <button type="button" disabled={busy || ownReady} onClick={() => send({ type: 'ready' })}>{t.ready}</button>}
              {bothReady && <button type="button" disabled={busy || ownConfirmed} onClick={() => send({ type: 'confirm' })}>{t.confirm}</button>}
              <button type="button" disabled={busy} onClick={() => send({ type: 'cancel' })}>{busy ? t.cancelWait : t.cancel}</button>
            </div>}
            {round.status === 'scheduled' && <p>{t.scheduled}</p>}
            {round.status === 'started' && <p>{t.started}</p>}
            {round.status === 'scheduled' && <button type="button" disabled={busy} onClick={() => send({ type: 'cancel' })}>{busy ? t.cancelWait : t.cancel}</button>}
            {round.eventId === 'R01' && round.status === 'started' && <p className="shared-own-open">{t.independent}</p>}
            {round.eventId === 'R03' && round.status === 'started' && <p role="status">{t.merged}</p>}
          </section>}
          {round && ['cancelled', 'expired'].includes(round.status) && <p role="status">{round.status === 'expired' ? t.expired : t.cancelled}</p>}
          {(!round || canChooseNewRound(round.status)) && <section aria-labelledby="shared-event-picker-title"><h3 id="shared-event-picker-title">{initialEventId ? eventNames[language][selectedEvent] : t.eventPicker}</h3>
            {!initialEventId && <div className="shared-event-choices" role="group" aria-label={t.eventPicker}>{(['R01', 'R02', 'R03', 'R04'] as SharedEventId[]).map(id => <button key={id} type="button" disabled={busy} aria-pressed={selectedEvent === id} onClick={() => setSelectedEvent(id)}>{eventNames[language][id]}</button>)}</div>}
            <div className="shared-draft-event">
              {selectedEvent === 'R01' && <p className="shared-events-note">{t.independent}</p>}
              {selectedEvent === 'R02' && <div className="shared-prop-picker shared-idle-picker"><p>{t.select}</p>{approvedPawns.map((pawn, index) => <button type="button" key={pawn.id} aria-pressed={decorId === pawn.id} onClick={() => setDecorId(pawn.id)}><img src={pawnSource(index)} alt=""/><span>{pawn[language]}</span></button>)}</div>}
              {selectedEvent === 'R03' && drawingEditor}
              {selectedEvent === 'R04' && <div className="shared-pattern-tools"><p>{t.makePattern} <small>{pattern.length}/6</small></p><div className="shared-pattern-builder">{patterns.map(step => <button type="button" key={step} disabled={pattern.length >= 6} onClick={() => setPattern(old => old.length < 6 ? [...old, step] : old)}>{step + 1}</button>)}</div><p className="shared-pattern-code" aria-label={t.sendPattern}>{pattern.map((step, index) => <span key={`${step}-${index}`}>{step + 1}</span>)}</p><button type="button" disabled={!pattern.length} onClick={() => setPattern(old => old.slice(0, -1))}>{t.removeBeat}</button></div>}
              <button type="button" disabled={busy || (selectedEvent === 'R02' && !decorId) || (selectedEvent === 'R03' && !points.length) || (selectedEvent === 'R04' && !pattern.length)} onClick={() => propose(selectedEvent)}>{t.propose} · {eventNames[language][selectedEvent]}</button>
            </div>
          </section>}
        </>}
      </>}
      {error && <p className="shared-events-error" role="alert">{error}</p>}
      {snapshot && <button type="button" className="shared-events-refresh" disabled={busy} onClick={() => run(() => sharedEventsClient.snapshot())}>{t.retrySnapshot}</button>}
    </div>
  </details>;
}
