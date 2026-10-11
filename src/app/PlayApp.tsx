import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import type { Language, PlayerId, GameId, GameAction } from '../core/types';
import { gameCatalog, getGame } from '../games/catalog';
import { gameRules, marbleLegacyRules, marbleCreditRules, dominoPremiumRules } from '../games/rules';
import { BrandHeader } from './App';
import { Link, navigate } from './Router';
import DominoBoard from './DominoBoard';
import MarbleBoard from './MarbleBoard';
import CatchmindTable from './CatchmindTable';
import { TableGames } from './TableGames';
import { DaVinciMatchSummary } from './DaVinciMatchSummary';
import { RhythmBoard } from './RhythmBoard';
import { ReactionPanel } from './ReactionPanel';
import { reactionForText, type ReactionId } from '../core/reactions';
import { ActionFlightGuard, cueForAction, GameFeedback } from './GameFeedback';
import { MinhwatuTable } from './MinhwatuTable';
import { MinhwatuGuide } from './MinhwatuGuide';
import { DominoQuickGuide } from './DominoQuickGuide';
import { JaipurQuickGuide } from './JaipurQuickGuide';
import { SplendorQuickGuide } from './SplendorQuickGuide';
import { playCue } from '../audio/audio';
import { canPlayGameOnDisplay, canViewRoomOnDisplay } from '../core/display';
import { DesktopGameNotice } from './DesktopGameNotice';
import '../styles/rules-dialog.css';
import '../styles/quick-guide.css';
import '../styles/minhwatu-room.css';
import '../styles/game-design-system.css';
import '../styles/jaipur-mobile-shell.css';

type Player = { id: PlayerId; nickname: string; language: Language; ready: boolean };
type Message = { id: string; playerId: PlayerId; text: string; translation?: string; targetLanguage?: Language; status: string; createdAt: string };
type Snapshot = { roomId: string | null; mode: 'demo' | 'online'; playerId: PlayerId; players: Player[]; gameId: GameId | null; version: number; view: any | null; messages: Message[]; pendingGame: GameId | null; error: string | null; connection?: 'local' | 'connecting' | 'connected' | 'reconnecting'; syncEpoch?: number };
type Api = {
  createRoom: (nickname: string, language: Language) => Promise<string>;
  joinRoom: (roomId: string, nickname: string, language: Language) => Promise<void>;
  subscribeRoom: (roomId: string, callback: (snapshot: Snapshot) => void) => () => void;
  sendAction: (action: GameAction) => Promise<void>;
  selectGame: (gameId: GameId) => Promise<void>;
  sendChat: (text: string) => Promise<void>;
  sendReaction: (reaction: ReactionId) => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
  tick: () => Promise<void>;
  closeRoom: () => Promise<void>;
  localSeat: (player: PlayerId) => void;
  getSnapshot: () => Snapshot;
  reconnectRoom?: () => Promise<void>;
  isOnlineConfigured: boolean;
};
export function bindApi(module: { client: object; isOnlineConfigured: boolean }): Api {
  return Object.assign(module.client, { isOnlineConfigured: module.isOnlineConfigured }) as Api;
}
export const rulesButtonLabel = (language: Language) => text(language, '게임 방법 ↓', 'Cómo jugar ↓');
const ko = (language: Language) => language === 'ko';
const preference = (): Language => localStorage.getItem('dos-language') === 'es' ? 'es' : 'ko';
const nickPreference = () => localStorage.getItem('dos-nickname') || '';
const text = (language: Language, korean: string, spanish: string) => ko(language) ? korean : spanish;
const gameFromQuery = (): GameId | null => {
  const id = new URLSearchParams(window.location.search).get('game');
  return id ? getGame(id)?.id ?? null : null;
};
function useLocalizedDocument(language: Language) {
  useEffect(() => {
    document.documentElement.lang = language === 'es' ? 'es-DO' : 'ko';
    document.title = text(language, '우리 둘 · 게임방', 'Nosotros · Juegos');
  }, [language]);
}

export function PlayApp({ path, desktopDisplay = true }: { path: string; desktopDisplay?: boolean }) {
  const [api, setApi] = useState<Api | null>(null);
  const [loadError, setLoadError] = useState('');
  useEffect(() => { let live = true; import('../core/client').then(module => { if (live) setApi(bindApi(module)); }).catch(() => { if (live) setLoadError('게임 서비스 모듈을 불러오지 못했어요. 페이지를 새로고침해 주세요.'); }); return () => { live = false; }; }, []);
  if (loadError) return <div className="app-shell"><BrandHeader/><div className="error-card"><span className="error-icon">!</span><h1>{preference() === 'ko' ? '연결을 준비하지 못했어요' : 'No se pudo preparar la conexión'}</h1><p>{preference() === 'ko' ? loadError : 'No se pudo cargar el servicio de juego. Actualiza la página e inténtalo de nuevo.'}</p><Link href="/" className="button button-dark">{preference() === 'ko' ? '처음으로' : 'Inicio'}</Link></div></div>;
  if (!api) return <div className="app-shell"><BrandHeader/><div className="loading-screen"><span className="loader"/><p>{preference() === 'ko' ? '게임방을 준비하고 있어요…' : 'Preparando los juegos…'}</p></div></div>;
  const roomMatch = path.match(/^\/room\/([^/]+)\/?$/);
  if (roomMatch) { const roomId = decodeURIComponent(roomMatch[1]); return <Room key={roomId} api={api} roomId={roomId} desktopDisplay={desktopDisplay} />; }
  return <Lobby api={api} desktopDisplay={desktopDisplay} />;
}

function Lobby({ api, desktopDisplay }: { api: Api; desktopDisplay: boolean }) {
  const [language, setLanguage] = useState<Language>(preference);
  useLocalizedDocument(language);
  const [nickname, setNickname] = useState(nickPreference);
  const [roomCode, setRoomCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<GameId | null>(() => { const queryGame = gameFromQuery(); return canPlayGameOnDisplay(desktopDisplay, queryGame) ? queryGame : null; });
  const [showRules, setShowRules] = useState(false);
  const chooseLanguage = (value: Language) => { setLanguage(value); localStorage.setItem('dos-language', value); };
  const create = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (!nickname.trim()) { setError(text(language, '게임방에서 사용할 별명을 적어 주세요.', 'Escribe el nombre que usarás en el juego.')); return; }
    setBusy(true);
    try { localStorage.setItem('dos-nickname', nickname.trim()); const id = await api.createRoom(nickname.trim(), language); if (selected) await api.selectGame(selected); navigate(`/room/${encodeURIComponent(id)}`); }
    catch (cause) { setError(errorMessage(cause, language)); }
    finally { setBusy(false); }
  };
  const join = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (!nickname.trim() || !roomCode.trim()) { setError(text(language, '별명과 초대 코드를 입력해 주세요.', 'Escribe tu nombre y el código de invitación.')); return; }
    setBusy(true);
    try { localStorage.setItem('dos-nickname', nickname.trim()); const id = roomIdentifier(roomCode); await api.joinRoom(id, nickname.trim(), language); navigate(`/room/${encodeURIComponent(id)}`); }
    catch (cause) { setError(errorMessage(cause, language)); }
    finally { setBusy(false); }
  };
  return <div className="app-shell lobby-shell"><BrandHeader/><main className="lobby-main">
    <div className="lobby-intro"><h1>{text(language, '게임방 만들기', 'Crear partida')}</h1><p>{text(language, '별명을 정하고 초대 링크를 공유하세요.', 'Elige tu nombre y comparte la invitación.')}</p></div>
    <section className="lobby-panel"><div className="panel-heading"><div><h2>{text(language, '시작하기', 'Empezar')}</h2></div><LanguageSwitch language={language} onChange={chooseLanguage}/></div>
      <label className="field-label" htmlFor="nickname">{text(language, '내 별명', 'Tu nombre')}</label><input id="nickname" className="text-input" value={nickname} maxLength={24} placeholder={text(language, '예: 구름, Luna', 'Ej.: Luna, Nube')} onChange={event => setNickname(event.target.value)} />
      <div className="lobby-actions"><button className="button button-dark" disabled={busy} onClick={event => void create(event as unknown as FormEvent)}>{busy ? text(language, '잠시만요…', 'Un momento…') : selected ? text(language, `${getGame(selected)?.title[language]} 방 만들기`, `Crear partida: ${getGame(selected)?.title[language]}`) : text(language, '새 방 만들기', 'Crear una sala')} <span>↗</span></button><div className="or-divider"><span>{text(language, '또는 초대 코드로', 'O con un código')}</span></div><form className="join-form" onSubmit={join}><input className="text-input code-input" aria-label={text(language, '초대 링크 또는 방 ID', 'Enlace de invitación o ID de sala')} value={roomCode} onChange={event => setRoomCode(event.target.value)} placeholder={text(language, '초대 링크를 붙여 넣으세요', 'Pega el enlace de invitación')}/><button className="button button-outline" disabled={busy}>{text(language, '참여', 'Entrar')} <span>→</span></button></form>
      {error && <p className="inline-error" role="alert">{error}</p>}</div>
      <div className="privacy-note"><span className="lock-icon">⌑</span><span><b>{api.isOnlineConfigured ? text(language, '비공개 초대방', 'Sala privada') : text(language, '같은 브라우저 데모', 'Demo en este navegador')}</b><small>{api.isOnlineConfigured ? text(language, '초대 링크를 아는 두 사람만 입장할 수 있어요.', 'Solo entran las dos personas con el enlace.') : text(language, '서비스 연결 정보가 없어 이 브라우저 안에서만 플레이해요.', 'Sin conexión al servicio, solo se juega en este navegador.')}</small></span></div>
    </section>
    <section className="lobby-picks"><div className="pick-heading"><span className="eyebrow">{text(language, '게임 메뉴', 'EL MENÚ DE JUEGOS')}</span><button className="plain-button" onClick={() => { if (!selected) setSelected(desktopDisplay ? 'davinci' : 'jaipur'); setShowRules(true); }}>{text(language, '게임 규칙 보기', 'Ver reglas')} ↗</button></div><div className="pick-list">{gameCatalog.map(game => { const allowed = canPlayGameOnDisplay(desktopDisplay, game.id); return <button className={`pick-item ${selected === game.id ? 'selected' : ''}`} key={game.id} onClick={() => { if (allowed) setSelected(game.id); }} aria-pressed={selected === game.id} aria-disabled={!allowed} disabled={!allowed} title={!allowed ? text(language, '이 게임은 데스크톱에서 이용할 수 있어요.', 'Este juego requiere una computadora de escritorio.') : undefined}><span className={`pick-icon game-${game.color}`}><span className={`game-thumbnail art-${game.id}`} aria-hidden="true"/></span><span className="pick-name"><b>{game.title[language]}</b><small>{game.subtitle[language]}</small></span><span className="pick-time">{game.duration}</span><span className="pick-check">{selected === game.id ? '✓' : '＋'}</span></button>; })}</div>{!desktopDisplay && <p className="pick-hint">{text(language, '모바일에서는 자이푸르만 할 수 있어요. 다른 게임은 데스크톱에서 열어 주세요.', 'En móvil solo puedes jugar Jaipur. Abre los demás juegos en una computadora.')}</p>}<p className="pick-hint">{text(language, '게임은 방 안에서 두 사람의 선택이 맞으면 시작돼요.', 'La partida comienza cuando ambas personas eligen el mismo juego.')}</p></section>
    {selected === 'davinci' && <DaVinciStartBrief language={language}/>}
    <p className="retention-foot">{text(language, '대화와 게임 기록은 최대 7일간 보관되며, 언제든 방을 닫을 수 있어요.', 'Los mensajes y partidas se guardan hasta 7 días. Puedes cerrar la sala cuando quieras.')}</p>
    {showRules && selected && <RulesDialog gameId={selected} language={language} onClose={() => setShowRules(false)}/>}
  </main></div>;
}

export function Room({ api, roomId, desktopDisplay = true }: { api: Api; roomId: string; desktopDisplay?: boolean }) {
  const [snapshot, setSnapshot] = useState<Snapshot>(() => api.getSnapshot());
  const [language, setLanguage] = useState<Language>(preference);
  useLocalizedDocument(language);
  const [nickname, setNickname] = useState(nickPreference);
  const [joinError, setJoinError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [closing, setClosing] = useState(false);
  const [chat, setChat] = useState('');
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [actionError, setActionError] = useState('');
  const [pendingActionCount, setPendingActionCount] = useState(0);
  const pendingActionKeys = useRef(new ActionFlightGuard());
  const [palette, setPalette] = useState('#284f49');
  const [strokeWidth, setStrokeWidth] = useState(6);
  const [sending, setSending] = useState(false);
  const [now, setNow] = useState(Date.now());
  const tickedDeadline = useRef('');
  const chatBottom = useRef<HTMLDivElement>(null);
  const active = snapshot.roomId === roomId && snapshot.players.some(player => player.id === snapshot.playerId);
  useEffect(() => { if (active) localStorage.setItem('dos-last-room', roomId); }, [active, roomId]);
  const game = snapshot.gameId ? getGame(snapshot.gameId) : undefined;
  const view = snapshot.view;
  const isCatchmind = snapshot.gameId === 'catchmind';
  useEffect(() => { setChatCollapsed(false); }, [snapshot.gameId]);
  useEffect(() => {
    let live = true;
    if (active) {
      setSnapshot(api.getSnapshot());
      const off = api.subscribeRoom(roomId, next => { if (live) setSnapshot(next); });
      return () => { live = false; off(); };
    }
    if (api.isOnlineConfigured) {
      const off = api.subscribeRoom(roomId, next => { if (live) setSnapshot(next); });
      return () => { live = false; off(); };
    }
    return () => { live = false; };
  }, [api, roomId, active]);
  useEffect(() => {
    if (!active || !chatBottom.current) return;
    const list = chatBottom.current.parentElement;
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
  }, [snapshot.messages.length, active]);
  const updateSnapshot = useCallback(() => setSnapshot(api.getSnapshot()), [api]);
  useEffect(() => { const saved = snapshot.players.find(player => player.id === snapshot.playerId)?.language; if (active && saved && saved !== language) { setLanguage(saved); localStorage.setItem('dos-language', saved); } }, [active, language, snapshot.playerId, snapshot.players]);
  useEffect(() => {
    if (!active || !isCatchmind || view?.phase !== 'drawing' || !view.deadlineAt) return;
    const deadline = String(view.deadlineAt);
    const update = () => {
      const current = Date.now(); setNow(current);
      const expired = Date.parse(deadline) <= current;
      const requestKey = `${deadline}:timeout`;
      if (!expired || tickedDeadline.current === requestKey) return;
      tickedDeadline.current = requestKey;
      void api.tick().then(() => {
        updateSnapshot();
        const latest = api.getSnapshot().view;
        if (latest?.phase === 'drawing' && latest.deadlineAt === deadline) tickedDeadline.current = '';
      }).catch(cause => { tickedDeadline.current = ''; setActionError(errorMessage(cause, language)); });
    };
    update(); const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [active, api, isCatchmind, language, updateSnapshot, view?.deadlineAt, view?.phase]);
  useEffect(() => {
    if (!active || snapshot.gameId !== 'marble' || view?.board?.tiles?.length !== 40) return;
    const frame = window.requestAnimationFrame(() => {
      const board = document.getElementById('game-board');
      if (!board) return;
      const overflow = board.getBoundingClientRect().bottom + 8 - window.innerHeight;
      if (overflow > 0) window.scrollBy({ top: overflow, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [active, language, snapshot.gameId, view?.board?.tiles?.length]);
  const doJoin = async (event: FormEvent) => {
    event.preventDefault(); setJoinError(''); setBusy(true);
    try { await api.joinRoom(roomId, nickname.trim(), language); localStorage.setItem('dos-nickname', nickname.trim()); localStorage.setItem('dos-language', language); updateSnapshot(); }
    catch (cause) { setJoinError(errorMessage(cause, language)); }
    finally { setBusy(false); }
  };
  const runAction = async (action: GameAction) => {
    if (!pendingActionKeys.current.begin(action)) return false;
    setPendingActionCount(pendingActionKeys.current.size);
    setActionError('');
    if (snapshot.gameId === 'davinci' && action.type === 'guess') playCue('davinci', 'guess');
    try {
      await api.sendAction(action);
      updateSnapshot();
      const cue = snapshot.gameId ? cueForAction(snapshot.gameId, action) : null;
      if (cue && snapshot.gameId && !(snapshot.gameId === 'splendor' && action.type === 'buy')) playCue(snapshot.gameId, cue);
      return true;
    } catch (cause) {
      setActionError(errorMessage(cause, language));
      if (snapshot.gameId && snapshot.gameId !== 'rhythm' && snapshot.gameId !== 'davinci') playCue(snapshot.gameId, 'error');
      return false;
    } finally {
      pendingActionKeys.current.finish(action);
      setPendingActionCount(pendingActionKeys.current.size);
    }
  };
  const send = async (event: FormEvent, body = chat, clear = true) => { event.preventDefault(); const value = body.trim(); if (!value) return; setMessageError(''); setSending(true); try { await api.sendChat(value); if (clear) setChat(''); updateSnapshot(); } catch (cause) { setMessageError(errorMessage(cause, language)); } finally { setSending(false); } };
  const sendReaction = async (reaction: ReactionId) => { setMessageError(''); setSending(true); try { await api.sendReaction(reaction); updateSnapshot(); } catch (cause) { setMessageError(errorMessage(cause, language)); } finally { setSending(false); } };
  const setMyLanguage = async (value: Language) => { setLanguage(value); localStorage.setItem('dos-language', value); try { await api.setLanguage(value); updateSnapshot(); } catch (cause) { setJoinError(errorMessage(cause, value)); } };
  const chooseGame = async (gameId: GameId) => { if (!canPlayGameOnDisplay(desktopDisplay, gameId)) return false; try { await api.selectGame(gameId); updateSnapshot(); return true; } catch (cause) { setActionError(errorMessage(cause, language)); return false; } };
  const closeRoom = async () => { setClosing(true); setActionError(''); try { await api.closeRoom(); navigate('/play'); } catch (cause) { setActionError(errorMessage(cause, language)); setClosing(false); setConfirmClose(false); } };
  const retryConnection = async () => {
    if (!api.reconnectRoom || reconnecting) return;
    setReconnecting(true);
    try { await api.reconnectRoom(); updateSnapshot(); }
    catch (cause) { setActionError(errorMessage(cause, language)); }
    finally { setReconnecting(false); }
  };
  const copyInviteLink = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard_unavailable');
      await navigator.clipboard.writeText(location.href);
      setActionError(text(language, '초대 링크를 복사했어요.', 'Enlace copiado.'));
    } catch {
      setActionError(text(language, '링크를 복사하지 못했어요. 주소창에서 링크를 복사해 주세요.', 'No se pudo copiar el enlace. Cópialo desde la barra de direcciones.'));
    }
  };

  if (active && !canViewRoomOnDisplay(desktopDisplay, snapshot.gameId)) return <DesktopGameNotice language={language}/>;

  if (!active && api.isOnlineConfigured && !snapshot.error) return <div className="app-shell"><BrandHeader compact/><div className="loading-screen"><span className="loader"/><p>{text(language, '초대받은 게임방을 찾고 있어요…', 'Buscando la sala invitada…')}</p></div></div>;
  if (!active) return <div className="app-shell"><BrandHeader compact/><main className="join-page"><Link className="back-link" href="/play">← {text(language, '게임방 목록', 'Lista de salas')}</Link><div className="join-card"><span className="eyebrow">{text(language, '게임방 초대', 'INVITACIÓN A LA SALA')}</span><div className="join-art">d<span>.</span></div><h1>{language === 'ko' ? <>게임방에<br/>참여할까요?</> : <>¿Te unes a<br/>esta partida?</>}</h1><p className="join-code">{roomId}</p><LanguageSwitch language={language} onChange={value => { setLanguage(value); localStorage.setItem('dos-language', value); }}/><form onSubmit={doJoin}><label className="field-label" htmlFor="join-nickname">{text(language, '사용할 별명', 'Tu nombre')}</label><input id="join-nickname" className="text-input" required maxLength={24} value={nickname} placeholder="Luna" onChange={event => setNickname(event.target.value)}/><button className="button button-dark full-button" disabled={busy}>{text(language, '게임방 참여하기', 'Unirse a la sala')} <span>↗</span></button></form>{joinError && <p role="alert" className="inline-error">{joinError}</p>}<p className="tiny-copy">{api.isOnlineConfigured ? text(language, '초대한 사람과 나만 입장할 수 있어요.', 'Solo tú y quien te invitó pueden entrar.') : text(language, '데모 방은 현재 열린 세션에서만 유지됩니다.', 'La sala demo solo dura durante esta sesión.')}</p></div></main></div>;

  const boardIdentity = `${roomId}:${snapshot.playerId}:${snapshot.gameId}:${snapshot.syncEpoch ?? 0}:${snapshot.connection === 'reconnecting' ? 'offline' : 'live'}`;
  const compactTable = Boolean(snapshot.gameId);
  const myPlayer = snapshot.players.find(player => player.id === snapshot.playerId);
  const other = snapshot.players.find(player => player.id !== snapshot.playerId);
  return <div className={`app-shell room-shell ${compactTable ? 'quality-table-room' : ''} ${snapshot.gameId === 'minhwatu' ? 'minhwatu-room' : ''} ${!desktopDisplay && canViewRoomOnDisplay(false, snapshot.gameId) ? 'jaipur-mobile' : ''}`}><BrandHeader compact/><main className="room-main">
    {snapshot.mode === 'demo' && <div className="demo-banner"><span className="demo-pulse"/><span><b>{text(language, '같은 브라우저 데모', 'Demo en este navegador')}</b> · {text(language, '다른 기기에서는 입장할 수 없어요.', 'No se puede entrar desde otro dispositivo.')}</span><label>{text(language, '좌석', 'Asiento')} <select aria-label={text(language, '내 데모 좌석', 'Mi asiento de demo')} value={snapshot.playerId} onChange={event => { api.localSeat(event.target.value as PlayerId); updateSnapshot(); }}><option value="p1">1</option><option value="p2">2</option></select></label></div>}
    <div className="room-topline"><Link href="/play" className="back-link">← {text(language, '게임방 목록', 'Lista de salas')}</Link><div className="room-id-label"><Link href="/feedback">{text(language, 'Mami의 아이디어', 'Ideas de Mami')}</Link><details className="room-invite-details"><summary>{text(language, '초대 · 방 관리', 'Invitar · sala')}</summary><div className="room-invite-content"><span className="online-dot"/> {text(language, '초대 코드', 'Invitación')} <b>{roomId}</b><button title={text(language, '초대 링크 복사', 'Copiar enlace')} onClick={() => void copyInviteLink()}>⧉</button><button className="room-close-link" onClick={() => setConfirmClose(true)}>{text(language, '방 닫기', 'Cerrar sala')}</button></div></details></div></div>
    {snapshot.error && <div className="error-strip" role="alert">{errorMessage(new Error(snapshot.error), language)} <button disabled={reconnecting || !api.reconnectRoom} onClick={() => void retryConnection()}>{text(language, reconnecting ? '확인 중…' : '다시 시도', reconnecting ? 'Comprobando…' : 'Reintentar')}</button></div>}
    {snapshot.mode === 'online' && (snapshot.connection === 'connecting' || snapshot.connection === 'reconnecting') && <div className="connection-strip" role="status"><span>{text(language, '실시간 연결을 복구하고 있어요. 현재 판을 유지하며 최신 상태를 확인합니다.', 'Reconectando. Conservamos la mesa mientras consultamos el estado actual.')}</span><button disabled={reconnecting} onClick={() => void retryConnection()}>{text(language, reconnecting ? '확인 중…' : '상태 다시 확인', reconnecting ? 'Comprobando…' : 'Actualizar estado')}</button></div>}
    <section className="room-heading"><div className={game ? 'sr-only' : undefined}><h1>{text(language, '게임방', 'Sala de juego')}</h1></div><div className="room-player-pills"><div className="player-pill"><i className="player-avatar avatar-teal">{initial(myPlayer?.nickname || '나')}</i><span><b>{myPlayer?.nickname || text(language, '나', 'Tú')}</b><small>{myPlayer ? languageLabel(myPlayer.language) : text(language, '내 자리', 'Tu asiento')}</small></span><span className="ready-dot"/></div><div className="player-pill opponent-pill"><i className="player-avatar avatar-coral">{other ? initial(other.nickname) : '·'}</i><span><b>{other?.nickname || text(language, '상대가 들어오길 기다려요', 'Esperando a la otra persona')}</b><small>{other ? languageLabel(other.language) : text(language, '초대 링크를 보내 주세요', 'Envía el enlace')}</small></span><span className={`ready-dot ${other ? '' : 'waiting'}`}/></div></div></section>
    {!other && <div className="waiting-card"><span className="waiting-icon">♡</span><div><b>{text(language, '상대가 들어오길 기다리고 있어요.', 'Esperando a la otra persona.')}</b><p>{text(language, '이 링크를 보내면 게임방에 참여할 수 있어요.', 'Comparte este enlace para que se una al juego.')}</p></div><button className="button button-outline" onClick={() => void copyInviteLink()}>{text(language, '초대 링크 복사', 'Copiar enlace')} ⧉</button></div>}
    <section className={`room-layout ${chatCollapsed ? 'chat-collapsed' : ''}`}>
      <div className="play-column">
        {!game ? <section className="game-select-card"><div className="select-intro"><span className="eyebrow">{text(language, '함께 고르기', 'ELIJAN JUNTOS')}</span><h2>{text(language, '무슨 게임을 할까요?', '¿Qué jugamos?')}</h2><p>{text(language, '두 사람 모두 같은 게임을 고르면 시작돼요.', 'La partida comienza cuando los dos eligen el mismo juego.')}</p></div>{snapshot.pendingGame && <div className="pending-choice"><span>◷</span><span>{text(language, '상대의 선택을 기다려요:', 'Esperando la elección de la otra persona:')} <b>{getGame(snapshot.pendingGame)?.title[language]}</b></span></div>}<div className="room-game-grid">{gameCatalog.map(item => { const allowed = canPlayGameOnDisplay(desktopDisplay, item.id); return <button key={item.id} className={`room-game-card game-${item.color}`} onClick={() => void chooseGame(item.id)} aria-disabled={!allowed} disabled={!allowed} title={!allowed ? text(language, '이 게임은 데스크톱에서 이용할 수 있어요.', 'Este juego requiere una computadora de escritorio.') : undefined}><span className="room-game-icon"><span className={`game-thumbnail art-${item.id}`} aria-hidden="true"/></span><span><b>{item.title[language]}</b><small>{item.subtitle[language]}</small></span><span className="room-game-arrow">↗</span></button>; })}</div>{!desktopDisplay && <p className="pick-hint">{text(language, '모바일에서는 자이푸르만 선택할 수 있어요.', 'En móvil solo puedes elegir Jaipur.')}</p>}<div className="rhythm-note"><b>♫</b><p><strong>MUSIC TALK TALK</strong> — {text(language, '이 방의 내장 플레이어에서 실행됩니다.', 'Se juega en el reproductor integrado de esta sala.')}</p><a href="https://vidkidz.tistory.com/431" target="_blank" rel="noreferrer">{text(language, '원작 제공처 열기', 'Abrir página original')} ↗</a></div></section>
        : <section className="board-card" id="game-board" aria-busy={pendingActionCount > 0}><header className="board-header"><div className="board-game"><span className={`board-game-icon game-${game.color}`}><span className={`game-thumbnail art-${game.id}`} aria-hidden="true"/></span><span><b>{game.title[language]}</b><small>{game.subtitle[language]}</small></span></div><div className="board-header-right"><span className="turn-tag">{statusLabel(view, snapshot.playerId, language, snapshot.gameId)}</span><a className="plain-button" href="#game-guide">{rulesButtonLabel(language)}</a><GameFeedback identity={boardIdentity} language={language} gameId={game.id} playerId={snapshot.playerId} view={view} pending={pendingActionCount > 0}/><button className="icon-button" aria-label={text(language, '다른 게임으로 바꾸기', 'Cambiar de juego')} onClick={() => setActionError(text(language, '게임 바꾸기를 요청합니다. 아래 게임 목록에서 새 게임을 골라 주세요.', 'Pide cambiar de juego seleccionando otro juego abajo.'))}>↻</button></div></header>
          {actionError && <div className="action-notice" role="alert">{actionError}<button aria-label={text(language, '안내 닫기', 'Cerrar aviso')} onClick={() => setActionError('')}>×</button></div>}
          {snapshot.gameId === 'rhythm' ? <RhythmBoard language={language}/> : isCatchmind ? <CatchmindTable key={boardIdentity} onReplay={async () => { await chooseGame('catchmind'); }} replayPending={snapshot.pendingGame === 'catchmind'} view={view} playerId={snapshot.playerId} language={language} now={now} palette={palette} setPalette={setPalette} strokeWidth={strokeWidth} setStrokeWidth={setStrokeWidth} runAction={runAction} /> : snapshot.gameId === 'domino' ? <DominoBoard key={boardIdentity} view={view} playerId={snapshot.playerId} language={language} runAction={runAction}/> : snapshot.gameId === 'marble' ? <MarbleBoard key={boardIdentity} view={view} playerId={snapshot.playerId} language={language} runAction={runAction}/> : snapshot.gameId === 'minhwatu' ? <MinhwatuTable view={view} playerId={snapshot.playerId} language={language} runAction={runAction} playerNames={Object.fromEntries(snapshot.players.map(player => [player.id, player.nickname]))} sceneKey={roomId} onReplay={() => chooseGame('minhwatu')} replayPending={snapshot.pendingGame === 'minhwatu'}/> : snapshot.gameId === 'jaipur' || snapshot.gameId === 'splendor' || snapshot.gameId === 'davinci' ? <TableGames key={boardIdentity} roomId={roomId} version={snapshot.version} game={snapshot.gameId} view={view} playerId={snapshot.playerId} language={language} runAction={runAction}/> : null}
          {snapshot.gameId === 'davinci' && <DaVinciMatchSummary roomId={roomId} playerId={snapshot.playerId} language={language} view={view} pendingGame={snapshot.pendingGame} onReplay={async () => { await chooseGame('davinci'); }}/>}
          {!!game && <footer className="board-footer"><span>{snapshot.mode === 'online' ? text(language, '이 방의 게임은 두 사람만 볼 수 있어요.', 'Solo ustedes dos pueden ver la partida.') : text(language, '데모 게임은 이 브라우저에서만 보여요.', 'La demo solo se ve en este navegador.')}</span><a href="#game-guide">{text(language, '게임 방법 보기 ↓', 'Ver cómo jugar ↓')}</a></footer>}
        </section>}
        {snapshot.gameId === 'marble' && view?.board?.version === 1 && <p className="marble-legacy-notice">{text(language, '이 저장된 게임은 이전 18칸 보드예요.', 'Esta partida guardada usa el tablero anterior de 18 casillas.')} <Link href="/play">{text(language, '40칸 보드로 하려면 새 게임방 만들기', 'Para jugar en el tablero de 40 casillas, crea una sala nueva')} ↗</Link></p>}
        {!isCatchmind && <aside className={`chat-panel reaction-chat-panel ${chatCollapsed ? 'is-collapsed' : ''}`}>
          <header><h2>{text(language, '표정 보내기', 'Reacciones')}</h2><span className="chat-count">{snapshot.messages.filter(message => reactionForText(message.text)).length}</span><button className="chat-toggle" type="button" aria-expanded={!chatCollapsed} aria-controls="room-reactions" aria-label={text(language, chatCollapsed ? '반응 열기' : '반응 접기', chatCollapsed ? 'Abrir reacciones' : 'Contraer reacciones')} onClick={() => setChatCollapsed(value => !value)}>{chatCollapsed ? '⌄' : '⌃'}</button></header>
          <div className="chat-content" id="room-reactions" hidden={chatCollapsed}><ReactionPanel language={language} playerId={snapshot.playerId} players={snapshot.players} messages={snapshot.messages} sending={sending} error={messageError} onSend={reaction => void sendReaction(reaction)}/></div>
        </aside>}
        {snapshot.gameId === 'davinci' && view?.board?.tileCount === 24 && <p className="marble-legacy-notice">{text(language, '이 저장된 판은 조커 없는 24장 규칙이에요. 아래 설명의 조커 항목은 제외하고, 새 판부터 조커 포함 26장으로 시작해요.', 'Esta partida guardada usa 24 fichas sin comodines. Omite los puntos sobre comodines de las reglas de abajo; la próxima partida usará 26 fichas.')}</p>}
        {game && <GameGuide gameId={game.id} language={language} dominoMode={view?.board?.mode ?? view?.mode} dominoRulesVersion={view?.board?.rulesVersion} marbleVersion={view?.board?.version} marbleEconomyVersion={view?.board?.economicVersion}/>}
        {game && (desktopDisplay || game.id !== 'jaipur') && <section className="game-switcher"><div><span className="eyebrow">{text(language, '다른 게임', 'OTROS JUEGOS')}</span><p>{text(language, '바꾸려면 두 사람 모두 같은 게임을 골라야 해요.', 'Para cambiar, los dos tienen que elegir el mismo juego.')}</p></div><div className="switch-game-list">{gameCatalog.filter(item => item.id !== game.id && canPlayGameOnDisplay(desktopDisplay, item.id)).map(item => <button key={item.id} onClick={() => void chooseGame(item.id)} aria-label={`${text(language, '게임 선택', 'Elegir juego')}: ${item.title[language]}`} className={snapshot.pendingGame === item.id ? 'pending' : ''}><span className={`game-thumbnail art-${item.id}`} aria-hidden="true"/></button>)}</div></section>}
      </div>
      {isCatchmind && <aside className={`chat-panel catchmind-chat-panel ${chatCollapsed ? 'is-collapsed' : ''}`}>
        <header>
          <div>{isCatchmind && <span className="eyebrow">{text(language, '그림 그리고 맞히기', 'DIBUJA Y ADIVINA')}</span>}<h2>{text(language, isCatchmind ? '대화와 정답 맞히기' : '표정 보내기', isCatchmind ? 'Chat y respuestas' : 'Reacciones')}</h2></div>
          <span className="chat-count">{snapshot.messages.filter(message => !reactionForText(message.text)).length}</span>
          <button className="chat-toggle" type="button" aria-expanded={!chatCollapsed} aria-controls="room-chat-content" aria-label={text(language, chatCollapsed ? '대화 열기' : '대화 접기', chatCollapsed ? 'Abrir chat' : 'Contraer chat')} title={text(language, chatCollapsed ? '대화 열기' : '대화 접기', chatCollapsed ? 'Abrir chat' : 'Contraer chat')} onClick={() => setChatCollapsed(value => !value)}>{chatCollapsed ? '‹' : '›'}</button>
        </header>
        <div className="chat-content" id="room-chat-content" hidden={chatCollapsed}>
          <>
            <div className="message-list" aria-live="polite">{snapshot.messages.filter(message => !reactionForText(message.text)).length === 0 && <div className="chat-empty"><span>✳</span><p>{text(language, '그림을 보고 답을 보내 보세요.', 'Mira el dibujo y manda tu respuesta.')}</p><small>{text(language, '채팅이나 정답을 입력할 수 있어요.', 'Puedes conversar o adivinar.')}</small></div>}{snapshot.messages.filter(message => !reactionForText(message.text)).map(message => <MessageBubble key={message.id} message={message} mine={message.playerId === snapshot.playerId} players={snapshot.players} language={language} />)}<div ref={chatBottom}/></div>
            {messageError && <p className="chat-error" role="alert">{messageError}</p>}
            <CatchmindChatComposer language={language} chat={chat} setChat={setChat} sending={sending} onSend={event => void send(event)} onLanguageChange={value => void setMyLanguage(value)}/>
          </>
        </div>
      </aside>}
    </section>
    {!game && snapshot.pendingGame === 'davinci' && <DaVinciStartBrief language={language}/>}
    {actionError && !game && <p className="inline-error" role="alert">{actionError}</p>}
    {confirmClose && <ConfirmClose language={language} closing={closing} onCancel={() => setConfirmClose(false)} onConfirm={() => void closeRoom()}/>}
  </main></div>;
}

function LanguageSwitch({ language, onChange }: { language: Language; onChange: (language: Language) => void }) {
  return <div className="language-switch" role="group" aria-label="Idioma / 언어"><button type="button" className={language === 'ko' ? 'active' : ''} onClick={() => onChange('ko')} aria-pressed={language === 'ko'}>한국어</button><span/><button type="button" className={language === 'es' ? 'active' : ''} onClick={() => onChange('es')} aria-pressed={language === 'es'}>Español <small>· RD</small></button></div>;
}

export function CatchmindChatComposer({ language, chat, setChat, sending, onSend, onLanguageChange }: {
  language: Language;
  chat: string;
  setChat: (value: string) => void;
  sending: boolean;
  onSend: (event: FormEvent) => void;
  onLanguageChange: (value: Language) => void;
}) {
  return <>
    <div className="chat-language-note"><span>文</span><p>{text(language, '메시지는 상대가 고른 언어로 자동 번역돼요. 원문도 함께 보여요.', 'Los mensajes se traducen al idioma de la otra persona. También verás el original.')}</p></div>
    <form className="chat-compose" onSubmit={onSend}><label className="sr-only" htmlFor="room-message">{text(language, '채팅 또는 정답 입력', 'Escribe un mensaje o respuesta')}</label><textarea id="room-message" rows={2} maxLength={60} value={chat} onChange={event => setChat(event.target.value)} placeholder={text(language, '정답을 맞히거나 이야기해요…', 'Adivina o escribe algo…')} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); onSend(event as unknown as FormEvent); } }}/><button aria-label={text(language, '보내기', 'Enviar')} disabled={sending || !chat.trim()}>↑</button><small>{languageLabel(language)} · <button type="button" className="inline-language" onClick={() => onLanguageChange(language === 'ko' ? 'es' : 'ko')}>{text(language, '언어 바꾸기', 'Cambiar idioma')}</button></small></form>
  </>;
}

function useModalFocus(onEscape: () => void) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const escapeRef = useRef(onEscape);
  escapeRef.current = onEscape;
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])')).filter(node => !node.hidden);
    (focusable()[0] ?? dialog).focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); escapeRef.current(); return; }
      if (event.key !== 'Tab') return;
      const nodes = focusable();
      if (!nodes.length) { event.preventDefault(); dialog.focus(); return; }
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); if (previous?.isConnected) previous.focus(); };
  }, []);
  return dialogRef;
}

function GameInstructions({ gameId, language, rules }: { gameId: GameId; language: Language; rules: string[] }) {
  if (gameId === 'minhwatu') return <MinhwatuGuide language={language}/>;
  const QuickGuide = gameId === 'domino' ? DominoQuickGuide : gameId === 'jaipur' ? JaipurQuickGuide : gameId === 'splendor' ? SplendorQuickGuide : null;
  const fullRules = <ol>{rules.map((rule, i) => <li key={i}><span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span><p>{rule}</p></li>)}</ol>;
  return QuickGuide ? <><QuickGuide language={language}/><details className="guide-details"><summary>{text(language, '궁금할 때: 세부 규칙 보기', 'Ver reglas detalladas')}</summary>{fullRules}</details></> : fullRules;
}

export function GameGuide({ gameId, language, dominoMode, dominoRulesVersion, marbleVersion, marbleEconomyVersion }: { gameId: GameId; language: Language; dominoMode?: string; dominoRulesVersion?: number; marbleVersion?: number; marbleEconomyVersion?: number }) {
  const game = getGame(gameId)!;
  const rules = gameId === 'domino' && dominoRulesVersion === 1 ? dominoPremiumRules : gameId === 'marble' ? marbleVersion === 1 ? marbleLegacyRules : marbleEconomyVersion === 1 ? marbleCreditRules : gameRules.marble : gameRules[gameId];
  const dominoModeLabel = dominoMode === 'partners'
    ? text(language, '현재 모드: 사람-봇 혼합 팀전', 'Modo actual: equipos mixtos de persona y bot')
    : dominoMode === 'humans-vs-bots'
      ? text(language, '현재 모드: 사람 2명 대 봇 2명', 'Modo actual: dos personas contra dos bots')
      : dominoMode === '1v1'
        ? text(language, '현재 모드: 1대1', 'Modo actual: 1 contra 1')
        : text(language, '첫 타일 전에 모드를 선택할 수 있어요.', 'Pueden elegir el modo antes de colocar la primera ficha.');
  return <section className="game-guide" id="game-guide" aria-labelledby="game-guide-title">
    <header className="game-guide-heading"><div>
      <h2 id="game-guide-title">{game.title[language]} · {text(language, '게임 방법', 'Cómo jugar')}</h2>
      {gameId !== 'minhwatu' && <p className="game-guide-subtitle">{game.subtitle[language]}</p>}
    </div><a className="guide-return" href="#game-board">{text(language, '게임으로 돌아가기 ↑', 'Volver al juego ↑')}</a></header>
    <GameInstructions gameId={gameId} language={language} rules={rules[language]}/>
    {game.id === 'domino' && <p className="variant-note">{dominoModeLabel}{' · '}{dominoRulesVersion === 1 ? text(language, '목표점수·보너스·막힘 판정은 테이블 설정을 확인하세요.', 'Revisa la meta, los bonos y el tranque en los ajustes.') : text(language, '기존 단판 규칙입니다. 카피쿠아 보너스는 적용하지 않습니다.', 'Esta sala conserva las reglas de una sola mano, sin bono de capicúa.')}</p>}
  </section>;
}

function RulesDialog({ gameId, language, dominoMode, onClose }: { gameId: GameId; language: Language; dominoMode?: string; onClose: () => void }) {
  const dialogRef = useModalFocus(onClose);
  const game = getGame(gameId)!;
  const dominoModeLabel = dominoMode === 'partners'
    ? text(language, '현재 모드: 사람-봇 혼합 팀전', 'Modo actual: equipos mixtos de persona y bot')
    : dominoMode === 'humans-vs-bots'
      ? text(language, '현재 모드: 사람 2명 대 봇 2명', 'Modo actual: dos personas contra dos bots')
      : dominoMode === '1v1'
        ? text(language, '현재 모드: 1대1', 'Modo actual: 1 contra 1')
        : text(language, '첫 타일 전에 모드를 선택할 수 있어요.', 'Pueden elegir el modo antes de colocar la primera ficha.');
  return <div className="dialog-scrim" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section ref={dialogRef} tabIndex={-1} className="rules-dialog" role="dialog" aria-modal="true" aria-labelledby="rules-title"><button className="dialog-close" aria-label={text(language, '닫기', 'Cerrar')} onClick={onClose}>×</button><span className="eyebrow">{text(language, '게임 방법', 'CÓMO JUGAR')} · {languageLabel(language).toUpperCase()}</span><div className={`rules-icon game-${game.color}`}><span className={`game-thumbnail art-${game.id}`} aria-hidden="true"/></div><h2 id="rules-title">{game.title[language]}</h2>{gameId !== 'minhwatu' && <p className="rules-subtitle">{game.subtitle[language]}</p>}<GameInstructions gameId={gameId} language={language} rules={(gameId === 'domino' ? dominoPremiumRules : gameRules[gameId])[language]}/>{game.id === 'domino' && <p className="variant-note">{dominoModeLabel}{' · '}{text(language, '단판 또는 누적 경기를 선택하고, 보너스와 막힘 판정은 테이블 설정에서 함께 확인하세요.', 'Elijan una mano o un partido por puntos y revisen los bonos y el conteo del tranque en los ajustes de la mesa.')}</p>}<button className="button button-dark full-button" onClick={onClose}>{text(language, '확인했어요', 'Entendido')} <span>✓</span></button></section></div>;
}

function ConfirmClose({ language, closing, onCancel, onConfirm }: { language: Language; closing: boolean; onCancel: () => void; onConfirm: () => void }) {
  const dialogRef = useModalFocus(() => { if (!closing) onCancel(); });
  return <div className="dialog-scrim" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !closing) onCancel(); }}><section ref={dialogRef} tabIndex={-1} className="rules-dialog close-dialog" role="alertdialog" aria-modal="true" aria-labelledby="close-title"><button className="dialog-close" aria-label={text(language, '닫기', 'Cerrar')} onClick={onCancel} disabled={closing}>×</button><span className="eyebrow">{text(language, '비공개 방', 'SALA PRIVADA')}</span><div className="rules-icon game-coral">×</div><h2 id="close-title">{text(language, '이 방을 닫을까요?', '¿Cerrar esta sala?')}</h2><p>{text(language, '방을 닫으면 초대 링크가 더 이상 열리지 않고 대화와 게임도 끝나요.', 'Al cerrar la sala, el enlace dejará de funcionar y terminarán el chat y la partida.')}</p><div className="close-actions"><button className="button button-outline" onClick={onCancel} disabled={closing}>{text(language, '계속하기', 'Seguir jugando')}</button><button className="button button-danger" onClick={onConfirm} disabled={closing}>{closing ? text(language, '닫는 중…', 'Cerrando…') : text(language, '방 닫기', 'Cerrar sala')}</button></div></section></div>;
}

function MessageBubble({ message, mine, players, language }: { message: Message; mine: boolean; players: Player[]; language: Language }) {
  const sender = players.find(player => player.id === message.playerId);
  const translated = !!message.translation && message.targetLanguage === language;
  const note = message.status === 'limit' ? text(language, '번역 한도에 도달해 원문으로 표시돼요', 'Se muestra el original: límite de traducción alcanzado') : message.status === 'unavailable' ? text(language, '번역을 사용할 수 없어 원문으로 표시돼요', 'Traducción no disponible; se muestra el original') : message.status === 'correct' ? text(language, '정답을 맞혔어요!', '¡Respuesta correcta!') : '';
  return <article className={`chat-message ${mine ? 'mine' : ''}`}><div className="message-byline"><span className={`message-avatar ${mine ? 'mine-avatar' : ''}`}>{initial(sender?.nickname || '?')}</span><b>{sender?.nickname || text(language, mine ? '나' : '상대', mine ? 'Tú' : 'Rival')}</b><time>{formatTime(message.createdAt)}</time></div><div className="message-bubble">{translated ? <><p>{message.translation}</p><small className="original-line">{text(language, '원문', 'Original')}: {message.text}</small></> : <p>{message.text}</p>}{note && <small className="translation-note">{note}</small>}</div></article>;
}

export function statusLabel(view: any, player: PlayerId, language: Language, gameId?: GameId | null) {
  if (gameId === 'rhythm') return text(language, '원작 플레이어', 'Juego original');
  if (view?.result) return text(language, '한 판이 끝났어요', 'Partida terminada');
  if (view?.phase === 'round-over') return text(language, '라운드 정산', 'Fin de ronda');
  return view?.turn === player ? text(language, '내 차례예요', 'Tu turno') : text(language, '상대 차례예요', 'Turno rival');
}
function languageLabel(language: Language) { return language === 'ko' ? '한국어' : 'Español · RD'; }
function initial(name: string) { return [...name][0] || '?'; }
function formatTime(value: string) { const date = new Date(value); return Number.isNaN(date.valueOf()) ? '' : date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); }
function roomIdentifier(input: string) {
  const value = input.trim();
  try { const url = new URL(value, window.location.origin); const match = url.pathname.match(/^\/room\/([^/]+)\/?$/); if (match) return decodeURIComponent(match[1]); } catch { /* Keep the entered room code below. */ }
  return value.replace(/^\/+|\/+$/g, '');
}
function errorMessage(cause: unknown, language: Language) {
  const message = cause instanceof Error ? cause.message : '';
  const errors: Record<string, [string, string]> = {
    nickname_required: ['별명을 1~24자로 입력해 주세요.', 'Escribe un nombre de 1 a 24 caracteres.'],
    demo_same_browser_only: ['이 데모 방은 만든 브라우저에서만 열 수 있어요.', 'Esta sala demo solo funciona en el navegador donde se creó.'],
    invalid_language: ['언어를 다시 선택해 주세요.', 'Vuelve a elegir el idioma.'],
    no_game: ['먼저 게임을 선택해 주세요.', 'Primero elige un juego.'],
    online_seat_fixed: ['온라인 방에서는 좌석을 바꿀 수 없어요.', 'No puedes cambiar de asiento en una sala en línea.'],
    stale_state: ['판이 갱신됐어요. 현재 패와 선택을 확인한 뒤 다시 확정해 주세요.', 'La mesa cambió. Revisa tus cartas y tu selección antes de confirmar de nuevo.'],
    action_confirmation_unknown: ['서버 응답을 확인하지 못했어요. 최신 판에서 해당 행동이 반영됐는지 확인해 주세요.', 'No recibimos la confirmación. Revisa en la mesa actual si la acción ya se realizó.'],
    room_expired: ['이 방은 만료됐어요. 새 방을 만들어 주세요.', 'La sala venció. Crea una nueva.'],
    server_clock_only: ['서버 시각을 확인할 수 없어요. 잠시 후 다시 시도해 주세요.', 'No se pudo consultar el reloj del servidor. Inténtalo de nuevo.'],
    chat_max_500: ['메시지는 500자 이하로 적어 주세요.', 'El mensaje puede tener hasta 500 caracteres.'],
    not_room_member: ['이 초대 링크를 사용할 수 없어요. 방을 만든 사람에게 새 링크를 요청해 주세요.', 'No puedes usar esta invitación. Pide un enlace nuevo a quien creó la sala.'],
    'Not your turn': ['아직 내 차례가 아니에요.', 'Todavía no es tu turno.'],
  };
  if (errors[message]) return text(language, ...errors[message]);
  return text(language, '요청을 처리하지 못했어요. 다시 시도해 주세요.', 'No se pudo completar. Inténtalo de nuevo.');
}

function DaVinciStartBrief({ language }: { language: Language }) {
  return <section className="davinci-start-brief" aria-label={text(language, '다빈치 코드 시작 안내', 'Antes de jugar Da Vinci')}><h3>{text(language, '시작 전에', 'Antes de jugar')}</h3><p>{text(language, '우리는 조커 포함 규칙으로 해. 흑백 0~11과 조커 － 두 장, 총 26장이야. 숫자는 작은 순서로 놓고, 같은 숫자면 검정이 먼저야. 조커는 원하는 자리에 놓되 배치 후 옮길 수 없어. 처음 배치를 마치면 둘 다 준비를 눌러 줘.', 'Jugamos con comodines: son 26 fichas, del 0 al 11 en blanco y negro, más dos comodines －. Los números van en orden y, si coinciden, la negra va primero. Coloca el comodín donde quieras; después no puedes moverlo. Ambos confirmen que están listos.')}</p><p>{text(language, '상대 타일을 클릭하고 숫자나 －를 골라 봐. 맞히면 계속 추리하거나 차례를 끝낼 수 있어. 틀리면 방금 뽑은 내 타일이 공개돼. 더미가 비면 새 타일 공개 없이 차례만 넘어가. 상대 타일을 모두 공개하면 이겨.', 'Pulsa una ficha rival y elige un número o －. Si aciertas, puedes seguir o terminar el turno. Si fallas, se revela la ficha que acabas de robar. Con el mazo vacío, solo termina tu turno, sin revelar otra ficha. Ganas cuando todas las fichas rivales quedan visibles.')}</p><small>{text(language, '게임 안에서도 전체 규칙을 볼 수 있어.', 'Las reglas completas también están disponibles dentro de la partida.')}</small></section>;
}
