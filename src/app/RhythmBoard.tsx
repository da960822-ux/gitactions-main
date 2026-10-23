import { useEffect, useRef, useState } from 'react';
import type { Language } from '../core/types';
import '../styles/rhythm-board.css';

type RufflePlayer = HTMLElement & { ruffle: () => { load: (url: string) => Promise<void> } };
type RuffleApi = { newest?: () => { createPlayer: () => RufflePlayer }; config?: Record<string, unknown> };
declare global { interface Window { RufflePlayer?: RuffleApi } }

let ruffleLoad: Promise<void> | undefined;
const RUFFLE_READY_TIMEOUT_MS = 15_000;
const labels = {
  ko: {
    title: '뮤직톡톡', intro: '화살표와 스페이스바로 박자를 맞춰 봐요.', controls: '먼저 ‘게임에 포커스’를 누르고 방향키와 스페이스바로 박자를 맞춰요.',
    known: '원작 안내에 따르면 ‘처음으로’ 버튼이 제대로 작동하지 않을 수 있어요.',
    unverified: '이 브라우저에서의 전체 플레이는 아직 확인되지 않았어요.', loading: '게임을 불러오는 중…',
    ready: '플레이 준비 완료', error: '게임을 불러오지 못했어요. 다시 시도해 주세요.', retry: '다시 불러오기',
    focus: '게임에 포커스', fullscreen: '전체 화면', exitFullscreen: '전체 화면 나가기',
    fullscreenError: '전체 화면을 시작하지 못했어요. 브라우저 설정을 확인해 주세요.',
    recovery: '화면이 비거나 크기 변경 뒤 멈추면 페이지를 새로고침해 주세요. 원작 게임이 처음부터 다시 시작돼요.', source: '원작 게시물',
  },
  es: {
    title: 'Music Talk Talk', intro: 'Sigan el ritmo con las flechas y la barra espaciadora.', controls: 'Pulsa «Enfocar el juego» y luego sigue el ritmo con las flechas y la barra espaciadora.',
    known: 'La página original avisa que el botón «Inicio» puede no funcionar bien.',
    unverified: 'Aún no hemos comprobado el juego completo en este navegador.', loading: 'Cargando el juego…',
    ready: 'Listo para jugar', error: 'No se pudo cargar el juego. Inténtalo de nuevo.', retry: 'Volver a cargar',
    focus: 'Enfocar el juego', fullscreen: 'Pantalla completa', exitFullscreen: 'Salir de pantalla completa',
    fullscreenError: 'No se pudo activar la pantalla completa. Revisa la configuración del navegador.',
    recovery: 'Si la pantalla queda en blanco o se congela al cambiar el tamaño, recarga la página. El juego original volverá a empezar.', source: 'Página original',
  },
};

export function loadRuffle(): Promise<void> {
  if (ruffleLoad) return ruffleLoad;
  if (window.RufflePlayer?.newest) return Promise.resolve();
  ruffleLoad = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/rhythm/ruffle/ruffle.js';
    script.onload = () => resolve();
    script.onerror = () => { window.RufflePlayer = undefined; reject(new Error('Ruffle script failed to load')); };
    window.RufflePlayer = { config: {
        publicPath: '/rhythm/ruffle/',
        urlRewriteRules: [[
          'http://images.hangame.co.kr/static/flash/flashgame/game/lang/Music_RES.swf',
          new URL('/rhythm/Music_RES.swf', window.location.href).href,
        ]],
      } };
    document.head.appendChild(script);
  }).catch(error => { ruffleLoad = undefined; throw error; });
  return ruffleLoad!;
}

export function waitForRuffleReady(player: HTMLElement, load: () => Promise<void>, signal: AbortSignal, timeoutMs = RUFFLE_READY_TIMEOUT_MS): Promise<void> {
  return new Promise((resolve, reject) => {
    let loaded = false;
    let dataReady = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const cleanup = () => {
      if (timeout) clearTimeout(timeout);
      player.removeEventListener('loadeddata', onLoadedData);
      signal.removeEventListener('abort', onAbort);
    };
    const fail = (error: Error) => { cleanup(); reject(error); };
    const finish = () => {
      if (!loaded || !dataReady) return;
      cleanup();
      resolve();
    };
    const onLoadedData = () => { dataReady = true; finish(); };
    const onAbort = () => fail(new Error('Ruffle load cancelled'));

    if (signal.aborted) return onAbort();
    player.addEventListener('loadeddata', onLoadedData);
    signal.addEventListener('abort', onAbort, { once: true });
    timeout = setTimeout(() => fail(new Error('Ruffle did not load data in time')), timeoutMs);
    try {
      void load().then(() => { loaded = true; finish(); }, error => fail(error instanceof Error ? error : new Error(String(error))));
    } catch (error) {
      fail(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

export function observeRhythmKeys(player: HTMLElement, findKey: (code: string) => Pick<HTMLElement, 'classList'> | null) {
  const activePulses = new Map<string, ReturnType<typeof setTimeout>>();
  const onKey = (event: Event) => {
    const keyboardEvent = event as KeyboardEvent;
    const code = keyboardEvent.code === 'Space' ? 'Space' : keyboardEvent.key;
    const key = findKey(code);
    if (!key) return;
    if (event.type === 'keyup') {
      const timer = activePulses.get(code);
      if (timer) clearTimeout(timer);
      activePulses.delete(code);
      key.classList.remove('is-pressed');
      return;
    }
    key.classList.add('is-pressed');
    const prior = activePulses.get(code);
    if (prior) clearTimeout(prior);
    activePulses.set(code, setTimeout(() => {
      key.classList.remove('is-pressed');
      activePulses.delete(code);
    }, 140));
  };
  const clearPressedKeys = () => {
    for (const [code, timer] of activePulses) {
      clearTimeout(timer);
      findKey(code)?.classList.remove('is-pressed');
    }
    activePulses.clear();
  };
  player.addEventListener('keydown', onKey);
  player.addEventListener('keyup', onKey);
  player.addEventListener('blur', clearPressedKeys);
  return () => {
    player.removeEventListener('keydown', onKey);
    player.removeEventListener('keyup', onKey);
    player.removeEventListener('blur', clearPressedKeys);
    clearPressedKeys();
  };
}

export function RhythmBoard({ language }: { language: Language }) {
  const mount = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const playerRef = useRef<RufflePlayer | undefined>(undefined);
  const keyRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlError, setControlError] = useState(false);
  const copy = labels[language];

  useEffect(() => {
    let live = true;
    let player: RufflePlayer | undefined;
    const readiness = new AbortController();
    let disposeKeyFeedback = () => {};
    setStatus('loading');
    void loadRuffle().then(() => {
      const api = window.RufflePlayer;
      if (!live || !mount.current) return;
      if (!api?.newest) throw new Error('Ruffle did not initialize');
      player = api.newest().createPlayer();
      player.setAttribute('aria-label', copy.title);
      player.tabIndex = 0;
      player.style.width = '100%';
      player.style.height = '100%';
      playerRef.current = player;
      disposeKeyFeedback = observeRhythmKeys(player, code => keyRefs.current[code] ?? null);
      mount.current.replaceChildren(player);
      return waitForRuffleReady(player, () => player!.ruffle().load('/rhythm/Music14.swf'), readiness.signal);
    }).then(() => { if (live) setStatus('ready'); }).catch(() => { if (live) setStatus('error'); });
    return () => { live = false; readiness.abort(); disposeKeyFeedback(); player?.remove(); playerRef.current = undefined; };
  }, [attempt]);

  useEffect(() => { playerRef.current?.setAttribute('aria-label', copy.title); }, [copy.title]);

  useEffect(() => {
    const update = () => setFullscreen(document.fullscreenElement === shell.current);
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);

  const retry = () => setAttempt(value => value + 1);
  const focusPlayer = () => playerRef.current?.focus();
  const toggleFullscreen = async () => {
    const node = shell.current;
    if (!node) return;
    setControlError(false);
    try {
      if (document.fullscreenElement === node) await document.exitFullscreen();
      else await node.requestFullscreen();
    } catch {
      setControlError(true);
    }
  };

  return <section className="rhythm-board" aria-label={copy.title}>
    <div className="rhythm-board-intro">
      <span className="rhythm-board-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M10 18V5l10-2v13M10 9l10-2M6 20a3 2.5 0 1 0 0-5 3 2.5 0 0 0 0 5Zm10-2a3 2.5 0 1 0 0-5 3 2.5 0 0 0 0 5Z"/></svg></span>
      <div><h2>{copy.intro}</h2><p>{copy.controls}</p></div>
    </div>
    <div className="rhythm-key-guide" aria-hidden="true">
      <div className="rhythm-arrow-keys">
        <span ref={node => { keyRefs.current.ArrowUp = node; }} className="rhythm-key rhythm-key-up">↑</span>
        <span ref={node => { keyRefs.current.ArrowLeft = node; }} className="rhythm-key">←</span>
        <span ref={node => { keyRefs.current.ArrowDown = node; }} className="rhythm-key">↓</span>
        <span ref={node => { keyRefs.current.ArrowRight = node; }} className="rhythm-key">→</span>
      </div>
      <span className="rhythm-key rhythm-key-space" ref={node => { keyRefs.current.Space = node; }}>SPACE</span>
    </div>
    <div className="rhythm-game-shell" ref={shell}>
      <div className="rhythm-game-toolbar">
        <span aria-live="polite"><i aria-hidden="true" className={`rhythm-status-dot is-${status}`} />{status === 'loading' ? copy.loading : status === 'error' ? copy.error : copy.ready}</span>
        <div className="rhythm-game-tools">
          {status === 'ready' && <button type="button" onClick={focusPlayer}>{copy.focus}</button>}
          {document.fullscreenEnabled && <button type="button" onClick={() => void toggleFullscreen()}>{fullscreen ? copy.exitFullscreen : copy.fullscreen}</button>}
        </div>
      </div>
      <div className="rhythm-game-frame">
        <div ref={mount} className="rhythm-game-mount" />
        {status === 'loading' && <div className="rhythm-game-overlay" role="status">{copy.loading}</div>}
        {status === 'error' && <div className="rhythm-game-overlay rhythm-game-error" role="alert"><span className="rhythm-error-icon" aria-hidden="true">!</span><b>{copy.error}</b><button type="button" onClick={retry}>{copy.retry}</button></div>}
      </div>
    </div>
    <div className="rhythm-board-notes">
      <p className="rhythm-known-note">{copy.known}</p>
      <p className="rhythm-recovery-note">{copy.recovery}</p>
      <div className="rhythm-source-row"><small>{copy.unverified}</small><a href="https://vidkidz.tistory.com/431" target="_blank" rel="noreferrer">{copy.source}<span aria-hidden="true">↗</span></a></div>
      {controlError && <p className="rhythm-control-error" role="status">{copy.fullscreenError}</p>}
    </div>
  </section>;
}

export default RhythmBoard;
