import { FormEvent, lazy, useCallback, useEffect, useRef, useState } from 'react';
import type { Language, PlayerId, GameId, GameAction } from '../core/types';
import { supportsAi } from '../games/simpleAi';
import { gameCatalog, getGame } from '../games/catalog';
import { gameRules, marbleLegacyRules, marbleCreditRules, marbleTieredRules, marbleExpandedRules, marblePropertyRules, dominoPremiumRules, dominoLegacyRules, lisbethDominoRules } from '../games/rules';
import { BrandHeader } from './App';
import { Link, navigate, roomHref } from './Router';
import DominoBoard from './DominoBoard';
import MarbleBoard from './MarbleBoard';
import CatchmindTable from './CatchmindTable';
import { SplendorTable } from './SplendorTable';
import DaVinciTable from './DaVinciTable';
import { JaipurBoard } from './JaipurBoard';
import { CoupleResultMoment } from './CoupleResultMoment';
import { MatchReplay } from './MatchReplay';
import { DaVinciMatchSummary } from './DaVinciMatchSummary';
import { RhythmBoard } from './RhythmBoard';
import { ReactionPanel } from './ReactionPanel';
import { reactionForText, type ReactionId } from '../core/reactions';
import { ActionFlightGuard, cueForAction, GameFeedback } from './GameFeedback';
import { MinhwatuTable } from './MinhwatuTable';
import { MinhwatuGuide } from './MinhwatuGuide';
import { GameInstructions as BeginnerGameInstructions } from './GameInstructions';
import { DominoQuickGuide } from './DominoQuickGuide';
import { JaipurQuickGuide } from './JaipurQuickGuide';
import { SplendorQuickGuide } from './SplendorQuickGuide';
import { playCue } from '../audio/audio';
import { canPlayGameOnDisplay, canViewRoomOnDisplay } from '../core/display';
import { DesktopGameNotice } from './DesktopGameNotice';
import { readBrowserStorage, writeBrowserStorage } from './browserStorage';
import '../styles/rules-dialog.css';
import '../styles/room-entry.css';
import '../styles/quick-guide.css';
import '../styles/minhwatu-room.css';
import '../styles/game-design-system.css';
import '../styles/jaipur-mobile-shell.css';

const FourPlayerRoom = lazy(() => import('./FourPlayerRoom'));

type Player = { id: PlayerId; nickname: string; language: Language; ready: boolean };
type Message = { id: string; playerId: PlayerId; text: string; translation?: string; targetLanguage?: Language; status: string; createdAt: string };
type Snapshot = { roomId: string | null; mode: 'demo' | 'online' | 'solo'; playerId: PlayerId; players: Player[]; gameId: GameId | null; version: number; view: any | null; messages: Message[]; pendingGame: GameId | null; error: string | null; connection?: 'local' | 'connecting' | 'connected' | 'reconnecting'; syncEpoch?: number; invitationNotice?: string | null };
type Api = {
  createRoom: (nickname: string, language: Language) => Promise<string>;
  joinRoom: (roomId: string, nickname: string, language: Language, acceptInvitation?: boolean) => Promise<void>;
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
const sameGameReplayIds: GameId[] = ['domino', 'jaipur', 'splendor'];
export function sameGameReplayAvailable(gameId: GameId | null, view: any): gameId is 'domino' | 'jaipur' | 'splendor' {
  return !!gameId && sameGameReplayIds.includes(gameId) && view?.phase === 'finished' && view?.status === 'finished' && !!view?.result;
}
const ko = (language: Language) => language === 'ko';
const preference = (): Language => readBrowserStorage('dos-language').value === 'es' ? 'es' : 'ko';
const nickPreference = () => readBrowserStorage('dos-nickname').value || '';
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
  const [onlineApi, setApi] = useState<Api | null>(null);
  const [soloApi, setSoloApi] = useState<Api | null>(null);
  const api = path.startsWith('/room/solo-') ? soloApi : onlineApi;
  const [loadError, setLoadError] = useState('');
  useEffect(() => { let live = true; import('../core/client').then(module => { if (live) { setApi(bindApi(module)); setSoloApi(bindApi({ client: module.soloClient, isOnlineConfigured: false })); } }).catch(() => { if (live) setLoadError('게임 서비스 모듈을 불러오지 못했어요. 페이지를 새로고침해 주세요.'); }); return () => { live = false; }; }, []);
  if (loadError) return <div className="app-shell"><BrandHeader/><div className="error-card"><span className="error-icon">!</span><h1>{preference() === 'ko' ? '연결을 준비하지 못했어요' : 'No se pudo preparar la conexión'}</h1><p>{preference() === 'ko' ? loadError : 'No se pudo cargar el servicio de juego. Actualiza la página e inténtalo de nuevo.'}</p><Link href="/" className="button button-dark">{preference() === 'ko' ? '처음으로' : 'Inicio'}</Link></div></div>;
  if (!api) return <div className="app-shell"><BrandHeader/><div className="loading-screen"><span className="loader"/><p>{preference() === 'ko' ? '게임방을 준비하고 있어요…' : 'Preparando los juegos…'}</p></div></div>;
  const roomMatch = path.match(/^\/room\/([^/]+)\/?$/);
  if (roomMatch) { const roomId = decodeURIComponent(roomMatch[1]); if(roomId.startsWith('solo-team-')) return <FourPlayerRoom key={roomId} roomId={roomId} desktopDisplay={desktopDisplay}/>; return <Room key={roomId} api={api} roomId={roomId} desktopDisplay={desktopDisplay} />; }
  return <Lobby api={api} desktopDisplay={desktopDisplay} />;
}

export function Lobby({ api, desktopDisplay }: { api: Api; desktopDisplay: boolean }) {
  const [language, setLanguage] = useState<Language>(preference);
  useLocalizedDocument(language);
  const [nickname, setNickname] = useState(nickPreference);
  const [busy, setBusy] = useState(false);
  const starting = useRef(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<GameId | null>(() => { const queryGame = gameFromQuery(); return canPlayGameOnDisplay(desktopDisplay, queryGame) ? queryGame : null; });
  const [showRules, setShowRules] = useState(false);
  const selectedGame = selected ? getGame(selected) : null;
  const previousRoom = readBrowserStorage('dos-last-room').value;
  const chooseLanguage = (value: Language) => { setLanguage(value); writeBrowserStorage('dos-language', value); };
  const start = async (mode: 'friends' | 'solo' | 'team') => {
    if (starting.current || !selected || !canPlayGameOnDisplay(desktopDisplay, selected)) return;
    if (mode !== 'friends' && (!supportsAi(selected) || mode === 'team' && selected === 'jaipur')) return;
    starting.current = true; setBusy(true); setError('');
    const name = nickname.trim() || text(language, '플레이어', 'Jugador');
    writeBrowserStorage('dos-nickname', name); writeBrowserStorage('dos-language', language);
    try {
      if (mode === 'friends') {
        const id = await api.createRoom(name, language);
        writeBrowserStorage('dos-last-room', id);
        await api.selectGame(selected);
        if (!api.isOnlineConfigured) { api.localSeat('p2'); await api.selectGame(selected); api.localSeat('p1'); }
        navigate(roomHref(id));
      } else if (mode === 'team' && selected !== 'domino') {
        const { fourPlayerClient } = await import('../core/fourPlayerClient');
        const id = await fourPlayerClient.createRoom(name, language);
        await fourPlayerClient.selectGame(selected); navigate(roomHref(id));
      } else {
        const { soloClient } = await import('../core/client');
        const id = await soloClient.createRoom(name, language);
        await soloClient.selectGame(selected);
        if (mode === 'team') await soloClient.sendAction({ type: 'configure', payload: { mode: 'partners', difficulty: 'hard' } });
        navigate(roomHref(id));
      }
    } catch (cause) { setError(errorMessage(cause, language)); }
    finally { starting.current = false; setBusy(false); }
  };
  return <div className="app-shell lobby-shell"><BrandHeader/><main className="lobby-main lobby-flow">
    <header className="lobby-intro"><div><h1>{text(language, '무슨 게임 할까요?', '¿Qué jugamos?')}</h1><p>{text(language, '친구와 함께, 또는 AI와 혼자 즐겨요.', 'Juega con alguien o a solas contra la IA.')}</p></div><LanguageSwitch language={language} onChange={chooseLanguage}/></header>
    <section className="lobby-picks" aria-label={text(language, '게임 선택', 'Elegir juego')}><div className="pick-list">{gameCatalog.map(game => { const allowed = canPlayGameOnDisplay(desktopDisplay, game.id); return <button className={`pick-item ${selected === game.id ? 'selected' : ''}`} key={game.id} onClick={() => { setSelected(game.id); setError(''); }} aria-pressed={selected === game.id} disabled={busy || !allowed} title={!allowed ? text(language, '데스크톱에서 이용할 수 있어요.', 'Disponible en computadora.') : undefined}><span className={`pick-icon game-${game.color}`}><span className={`game-thumbnail art-${game.id}`} aria-hidden="true"/></span><span className="pick-name"><b>{game.title[language]}</b><small>{game.subtitle[language]}</small></span><span className="pick-time">{game.duration}</span><span className="pick-check" aria-hidden="true">{selected === game.id ? '✓' : ''}</span></button>; })}</div>{!desktopDisplay && <p className="pick-hint">{text(language, '모바일에서는 자이푸르를 할 수 있어요.', 'En móvil puedes jugar Jaipur.')}</p>}</section>
    <section className="lobby-panel lobby-start" aria-label={text(language, '플레이 방법', 'Cómo jugar')}>
      <h2>{selectedGame ? selectedGame.title[language] : text(language, '게임을 골라 주세요', 'Elige un juego')}</h2>
      {selectedGame && <button className="plain-button lobby-rules" onClick={() => setShowRules(true)}>{text(language, '게임 방법', 'Cómo jugar')}</button>}
      <div className="lobby-actions"><button className="button button-dark" disabled={busy || !selected} onClick={() => void start('friends')}>{busy ? text(language, '준비 중…', 'Preparando…') : text(language, '친구와 플레이', 'Jugar con alguien')}</button>
      <p className="lobby-mode-note">{api.isOnlineConfigured ? text(language, '방이 열리면 초대 링크를 보내세요.', 'Comparte el enlace cuando se abra la sala.') : text(language, '지금은 같은 브라우저에서 두 자리를 번갈아 플레이해요.', 'Ahora se juega cambiando de asiento en este navegador.')}</p>
      {selected && supportsAi(selected) && <div className="lobby-ai-actions"><button className="button button-outline" disabled={busy} onClick={() => void start('solo')}>{text(language, 'AI와 1대1', 'IA: 1 contra 1')} →</button>{selected !== 'jaipur' && <button className="button button-outline" disabled={busy} onClick={() => void start('team')}>{text(language, 'AI와 2대2 팀전', 'IA: equipos 2 contra 2')} →</button>}<small>{text(language, 'AI 게임은 이 창에서만 유지돼요.', 'Las partidas con IA duran solo en esta ventana.')}</small></div>}
      <details className="lobby-profile"><summary>{text(language, '별명', 'Nombre')} · {nickname.trim() || text(language, '플레이어', 'Jugador')}</summary><label className="field-label" htmlFor="nickname">{text(language, '내 별명 (선택)', 'Tu nombre (opcional)')}</label><input id="nickname" className="text-input" value={nickname} maxLength={24} placeholder={text(language, '플레이어', 'Jugador')} autoComplete="nickname" onChange={event => setNickname(event.target.value)}/></details>
      {error && <p className="inline-error" role="alert">{error}</p>}</div>
      {previousRoom && !previousRoom.startsWith('solo-') && <Link className="lobby-resume" href={roomHref(previousRoom)}>{text(language, '이전 게임방으로 돌아가기', 'Volver a tu sala anterior')}</Link>}
    </section>
    {showRules && selected && <RulesDialog gameId={selected} language={language} onClose={() => setShowRules(false)}/>}
  </main></div>;
}

export function Room({ api, roomId, desktopDisplay = true }: { api: Api; roomId: string; desktopDisplay?: boolean }) {
  const [snapshot, setSnapshot] = useState<Snapshot>(() => api.getSnapshot());
  const [language, setLanguage] = useState<Language>(preference);
  useLocalizedDocument(language);
  const [nickname, setNickname] = useState(nickPreference);
  const [joinError, setJoinError] = useState('');
  const [inviteCopied, setInviteCopied] = useState(false);
  const [showInviteLink, setShowInviteLink] = useState(false);
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
  const messageSending = useRef(false);
  const [now, setNow] = useState(Date.now());
  const tickedDeadline = useRef('');
  const chatBottom = useRef<HTMLDivElement>(null);
  const active = snapshot.roomId === roomId && snapshot.players.some(player => player.id === snapshot.playerId);
  useEffect(() => { if (active && snapshot.mode !== 'solo') writeBrowserStorage('dos-last-room', roomId); }, [active, roomId]);
  const game = snapshot.gameId ? getGame(snapshot.gameId) : undefined;
  const view = snapshot.view;
  const isCatchmind = snapshot.gameId === 'catchmind';
  const solo = snapshot.mode === 'solo';
  useEffect(() => { setChatCollapsed(snapshot.gameId !== 'catchmind' && snapshot.gameId !== 'rhythm'); }, [snapshot.gameId]);
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
  useEffect(() => { const saved = snapshot.players.find(player => player.id === snapshot.playerId)?.language; if (active && saved && saved !== language) { setLanguage(saved); writeBrowserStorage('dos-language', saved); } }, [active, language, snapshot.playerId, snapshot.players]);
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
      const surface = board.querySelector('.mp-board-grid');
      if (!surface) return;
      const overflow = surface.getBoundingClientRect().bottom + 8 - window.innerHeight;
      if (overflow > 0) window.scrollBy({ top: Math.min(overflow, Math.max(0, board.getBoundingClientRect().top - 8)), behavior: 'auto' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [active, snapshot.gameId, snapshot.playerId, view?.board?.tiles?.length]);
  const doJoin = async (event: FormEvent) => {
    event.preventDefault(); if (busy) return; setJoinError(''); setBusy(true);
    const name = nickname.trim() || text(language, '플레이어', 'Jugador');
    try { await api.joinRoom(roomId, name, language, true); writeBrowserStorage('dos-nickname', name); writeBrowserStorage('dos-language', language); updateSnapshot(); }
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
  const send = async (event: FormEvent, body = chat, clear = true) => { event.preventDefault(); const value = body.trim(); if (!value || messageSending.current) return; messageSending.current = true; setMessageError(''); setSending(true); try { await api.sendChat(value); if (clear) setChat(''); updateSnapshot(); } catch (cause) { setMessageError(errorMessage(cause, language)); } finally { messageSending.current = false; setSending(false); } };
  const sendReaction = async (reaction: ReactionId) => { setMessageError(''); setSending(true); try { await api.sendReaction(reaction); updateSnapshot(); } catch (cause) { setMessageError(errorMessage(cause, language)); } finally { setSending(false); } };
  const setMyLanguage = async (value: Language) => { setLanguage(value); writeBrowserStorage('dos-language', value); try { await api.setLanguage(value); updateSnapshot(); } catch (cause) { setJoinError(errorMessage(cause, value)); } };
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
      await navigator.clipboard.writeText(new URL(roomHref(roomId), window.location.origin).href);
      setInviteCopied(true); setShowInviteLink(false);
    } catch { setShowInviteLink(true); setInviteCopied(false); }
  };

  if (active && !canViewRoomOnDisplay(desktopDisplay, snapshot.gameId)) return <DesktopGameNotice language={language}/>;

  if (!active && api.isOnlineConfigured && !snapshot.error) return <div className="app-shell"><BrandHeader compact/><div className="loading-screen"><span className="loader"/><p>{text(language, '초대받은 게임방을 찾고 있어요…', 'Buscando la sala invitada…')}</p></div></div>;
  if (!active && roomId.startsWith('solo-')) return <div className="app-shell"><BrandHeader compact/><main className="join-page"><p>{text(language, '혼자 플레이는 이 창에서만 유지돼요. 새 게임을 시작해 주세요.', 'La partida individual solo dura en esta ventana. Inicia otra partida.')}</p><Link href="/play" className="button button-dark">{text(language, '게임 선택으로', 'Elegir juego')}</Link></main></div>;
  if (!active) return <div className="app-shell"><BrandHeader compact/><main className="join-page invitation-entry"><div className="join-card"><h1>{text(language, '함께 플레이할까요?', '¿Jugamos juntos?')}</h1><p className="invitation-description">{text(language, '참여하면 친구가 고른 게임이 바로 시작돼요.', 'Al entrar empieza el juego elegido por tu amigo.')}</p><LanguageSwitch language={language} onChange={value => { setLanguage(value); writeBrowserStorage('dos-language', value); }}/><form onSubmit={doJoin}><button className="button button-dark full-button" disabled={busy}>{busy ? text(language, '참여 중…', 'Entrando…') : text(language, '초대한 게임에 참여', 'Entrar al juego invitado')}</button><details><summary>{text(language, '별명', 'Nombre')} · {nickname.trim() || text(language, '플레이어', 'Jugador')}</summary><label className="field-label" htmlFor="join-nickname">{text(language, '내 별명 (선택)', 'Tu nombre (opcional)')}</label><input id="join-nickname" className="text-input" maxLength={24} value={nickname} autoComplete="nickname" placeholder={text(language, '플레이어', 'Jugador')} onChange={event => setNickname(event.target.value)}/></details></form>{joinError && <p role="alert" className="inline-error">{joinError}</p>}<Link className="back-link" href="/play">{text(language, '다른 게임 고르기', 'Elegir otro juego')}</Link></div></main></div>;

  // Catchmind guards its queue by room, seat, round and deadline; reconnecting must preserve unsent strokes.
  const boardIdentity = `${roomId}:${snapshot.playerId}:${snapshot.gameId}${snapshot.gameId === 'catchmind' ? '' : `:${snapshot.syncEpoch ?? 0}:${snapshot.connection === 'reconnecting' ? 'offline' : 'live'}`}`;
  const compactTable = Boolean(snapshot.gameId);
  const myPlayer = snapshot.players.find(player => player.id === snapshot.playerId);
  const other = snapshot.players.find(player => player.id !== snapshot.playerId);
  const inlinePlayers = desktopDisplay && Boolean(game);
  const playerPills = <div className="room-player-pills"><div className="player-pill"><i className="player-avatar avatar-teal">{initial(myPlayer?.nickname || '나')}</i><span><b>{myPlayer?.nickname || text(language, '나', 'Tú')}</b><small>{myPlayer ? languageLabel(myPlayer.language) : text(language, '내 자리', 'Tu asiento')}</small></span><span className="ready-dot"/></div><div className="player-pill opponent-pill"><i className="player-avatar avatar-coral">{other ? initial(other.nickname) : '·'}</i><span><b>{other?.nickname || text(language, '상대가 들어오길 기다려요', 'Esperando a la otra persona')}</b><small>{other ? languageLabel(other.language) : text(language, '초대 링크를 보내 주세요', 'Envía el enlace')}</small></span><span className={`ready-dot ${other ? '' : 'waiting'}`}/></div></div>;
  return <div className={`app-shell room-shell ${snapshot.gameId ? `room-game-${snapshot.gameId}` : ''} ${compactTable ? 'quality-table-room' : ''} ${inlinePlayers ? 'has-inline-players' : ''} ${snapshot.gameId === 'minhwatu' ? 'minhwatu-room' : ''} ${!desktopDisplay && canViewRoomOnDisplay(false, snapshot.gameId) ? 'jaipur-mobile' : ''}`}><BrandHeader compact/><main className="room-main">
    {solo && <div className="room-session-label" title={text(language,'새로고침하면 초기화돼요.','Se reinicia al recargar.')}>AI · 1 vs 1</div>}
    {snapshot.mode === 'demo' && <div className="demo-banner"><span className="demo-pulse"/><span><b>{text(language, '같은 브라우저 데모', 'Demo en este navegador')}</b> · {text(language, '다른 기기에서는 입장할 수 없어요.', 'No se puede entrar desde otro dispositivo.')}</span><label>{text(language, '좌석', 'Asiento')} <select aria-label={text(language, '내 데모 좌석', 'Mi asiento de demo')} value={snapshot.playerId} onChange={event => { api.localSeat(event.target.value as PlayerId); updateSnapshot(); }}><option value="p1">1</option><option value="p2">2</option></select></label></div>}
    <div className="room-topline"><Link href="/play" className="back-link">← {text(language, '게임방 목록', 'Lista de salas')}</Link>{inlinePlayers && <><h1 className="sr-only">{text(language, '게임방', 'Sala de juego')}</h1>{playerPills}</>}<div className="room-id-label">{game && game.id !== 'rhythm' && <details className="room-sound-menu"><summary>{text(language,'소리','Sonido')}</summary><GameFeedback identity={boardIdentity} language={language} gameId={game.id} playerId={snapshot.playerId} view={view} pending={pendingActionCount > 0}/></details>}<Link href="/feedback">{text(language, 'Mami의 아이디어', 'Ideas de Mami')}</Link><button className="room-close-link" onClick={() => setConfirmClose(true)}>{text(language, solo ? '게임 종료' : '방 닫기', solo ? 'Terminar partida' : 'Cerrar sala')}</button></div></div>
    {snapshot.error && <div className="error-strip" role="alert">{errorMessage(new Error(snapshot.error), language)} <button disabled={reconnecting || !api.reconnectRoom} onClick={() => void retryConnection()}>{text(language, reconnecting ? '확인 중…' : '다시 시도', reconnecting ? 'Comprobando…' : 'Reintentar')}</button></div>}
    {snapshot.mode === 'online' && (snapshot.connection === 'connecting' || snapshot.connection === 'reconnecting') && <div className="connection-strip" role="status"><span>{text(language, '실시간 연결을 복구하고 있어요. 현재 판을 유지하며 최신 상태를 확인합니다.', 'Reconectando. Conservamos la mesa mientras consultamos el estado actual.')}</span><button disabled={reconnecting} onClick={() => void retryConnection()}>{text(language, reconnecting ? '확인 중…' : '상태 다시 확인', reconnecting ? 'Comprobando…' : 'Actualizar estado')}</button></div>}
    {!inlinePlayers && <section className="room-heading"><div className={game ? 'sr-only' : undefined}><h1>{snapshot.pendingGame ? getGame(snapshot.pendingGame)?.title[language] : text(language, '게임방', 'Sala de juego')}</h1></div>{playerPills}</section>}
    {!other && <div className="waiting-card"><div><b>{text(language, '친구에게 링크를 보내세요', 'Envía el enlace a tu amigo')}</b><p>{text(language, '친구가 참여하면 선택한 게임이 시작돼요.', 'Cuando entre, empezará el juego elegido.')}</p></div><button className="button button-dark" onClick={() => void copyInviteLink()}>{inviteCopied ? text(language, '링크 복사됨', 'Enlace copiado') : text(language, '초대 링크 복사', 'Copiar invitación')}</button><span className="sr-only" role="status">{inviteCopied ? text(language, '초대 링크를 복사했어요.', 'Enlace de invitación copiado.') : ''}</span>{showInviteLink && <div className="invite-link-fallback"><label htmlFor="invite-link">{text(language, '이 링크를 복사해 보내세요.', 'Copia y envía este enlace.')}</label><input id="invite-link" className="text-input" autoFocus readOnly value={new URL(roomHref(roomId), window.location.origin).href} onFocus={event => event.target.select()}/></div>}</div>}
    {snapshot.invitationNotice && <div className="invitation-notice" role="status">{snapshot.invitationNotice === 'invitation_changed' ? text(language, '친구의 게임 선택이 바뀌었어요. 아래에서 확인하고 시작하세요.', 'La selección cambió. Confirma abajo para empezar.') : text(language, '방에 참여했어요. 아래에서 게임을 확인하고 시작하세요.', 'Ya estás en la sala. Confirma el juego abajo para empezar.')}</div>}
    <section className={`room-layout ${chatCollapsed ? 'chat-collapsed' : ''}`}>
      <div className="play-column">
        {!game ? <section className="game-select-card"><div className="select-intro" hidden={!!snapshot.pendingGame}><h2>{text(language, '무슨 게임을 할까요?', '¿Qué jugamos?')}</h2><p>{solo ? text(language, '게임을 고르면 바로 시작해요.', 'Elige un juego para empezar.') : text(language, '두 사람 모두 같은 게임을 고르면 시작돼요.', 'La partida comienza cuando los dos eligen el mismo juego.')}</p></div>{snapshot.pendingGame && <div className="pending-invitation">{other && <button className="button button-dark" onClick={() => void chooseGame(snapshot.pendingGame!)}>{text(language, '이 게임 시작', 'Empezar este juego')}</button>}</div>}<details className="other-game-choices" open={!snapshot.pendingGame}><summary>{text(language, snapshot.pendingGame ? '다른 게임 고르기' : '게임 선택', snapshot.pendingGame ? 'Elegir otro juego' : 'Elegir juego')}</summary><div className="room-game-grid">{gameCatalog.filter(item => !solo || supportsAi(item.id)).map(item => { const allowed = canPlayGameOnDisplay(desktopDisplay, item.id); return <button key={item.id} className={`room-game-card game-${item.color}`} onClick={() => void chooseGame(item.id)} aria-disabled={!allowed} disabled={!allowed} title={!allowed ? text(language, '이 게임은 데스크톱에서 이용할 수 있어요.', 'Este juego requiere una computadora de escritorio.') : undefined}><span className="room-game-icon"><span className={`game-thumbnail art-${item.id}`} aria-hidden="true"/></span><span><b>{item.title[language]}</b><small>{item.subtitle[language]}</small></span><span className="room-game-arrow">↗</span></button>; })}</div></details>{!desktopDisplay && <p className="pick-hint">{text(language, '모바일에서는 자이푸르만 선택할 수 있어요.', 'En móvil solo puedes elegir Jaipur.')}</p>}{!solo && (!snapshot.pendingGame || snapshot.pendingGame === 'rhythm') && <div className="rhythm-note"><b>♫</b><p><strong>MUSIC TALK TALK</strong> — {text(language, '이 방의 내장 플레이어에서 실행됩니다.', 'Se juega en el reproductor integrado de esta sala.')}</p><a href="https://vidkidz.tistory.com/431" target="_blank" rel="noreferrer">{text(language, '원작 제공처 열기', 'Abrir página original')} ↗</a></div>}</section>
        : <section className="board-card" id="game-board" aria-busy={pendingActionCount > 0}><header className="board-header"><div className="board-game"><span className={`board-game-icon game-${game.color}`}><span className={`game-thumbnail art-${game.id}`} aria-hidden="true"/></span><span><b>{game.title[language]}</b><small>{game.subtitle[language]}</small></span></div><div className="board-header-right">{snapshot.gameId === 'rhythm' && <span className="turn-tag">{statusLabel(view, snapshot.playerId, language, snapshot.gameId)}</span>}<a className="plain-button" href="#game-guide" onClick={() => {const guide=document.querySelector<HTMLDetailsElement>('details.room-guide');if(guide)guide.open=true;}}>{rulesButtonLabel(language)}</a>{snapshot.gameId === 'rhythm' && <GameFeedback identity={boardIdentity} language={language} gameId={game.id} playerId={snapshot.playerId} view={view} pending={pendingActionCount > 0}/>}{desktopDisplay && <a className="plain-button game-switch-link" href="#game-switcher" onClick={() => {const switcher=document.querySelector<HTMLDetailsElement>('details.game-switcher');if(switcher)switcher.open=true;}}>{text(language, '게임 바꾸기 ↓', 'Cambiar juego ↓')}</a>}</div></header>
          {actionError && <div className="action-notice" role="alert">{actionError}<button aria-label={text(language, '안내 닫기', 'Cerrar aviso')} onClick={() => setActionError('')}>×</button></div>}
          {sameGameReplayAvailable(snapshot.gameId, view) && <SameGameReplay requiresAgreement={!solo} gameId={snapshot.gameId} language={language} pendingGame={snapshot.pendingGame} onReplay={() => chooseGame(snapshot.gameId!)}/>}
          {view?.result && snapshot.gameId === 'marble' && <MatchReplay language={language} requiresAgreement={!solo} pending={snapshot.pendingGame === 'marble'} onReplay={() => chooseGame('marble')}/> }
          {snapshot.gameId === 'davinci' && <DaVinciMatchSummary requiresAgreement={!solo} roomId={roomId} playerId={snapshot.playerId} language={language} view={view} pendingGame={snapshot.pendingGame} onReplay={() => chooseGame('davinci')}/>}
          {snapshot.gameId === 'rhythm' ? <RhythmBoard language={language}/> : isCatchmind ? <CatchmindTable roomId={roomId} key={boardIdentity} onReplay={() => chooseGame('catchmind')} replayPending={snapshot.pendingGame === 'catchmind'} view={view} playerId={snapshot.playerId} language={language} now={now} palette={palette} setPalette={setPalette} strokeWidth={strokeWidth} setStrokeWidth={setStrokeWidth} runAction={runAction} /> : snapshot.gameId === 'domino' ? <DominoBoard solo={solo} key={boardIdentity} view={view} playerId={snapshot.playerId} language={language} runAction={runAction}/> : snapshot.gameId === 'marble' ? <MarbleBoard key={boardIdentity} view={view} playerId={snapshot.playerId} language={language} runAction={runAction}/> : snapshot.gameId === 'minhwatu' ? <MinhwatuTable view={view} playerId={snapshot.playerId} language={language} runAction={runAction} playerNames={Object.fromEntries(snapshot.players.map(player => [player.id, player.nickname]))} sceneKey={roomId} requiresAgreement={!solo} onReplay={() => chooseGame('minhwatu')} replayPending={snapshot.pendingGame === 'minhwatu'}/> : snapshot.gameId === 'jaipur' ? <JaipurBoard key={boardIdentity} desktopDisplay={desktopDisplay} view={view} playerId={snapshot.playerId} language={language} runAction={runAction}/> : snapshot.gameId === 'splendor' ? <SplendorTable key={boardIdentity} desktopDisplay={desktopDisplay} roomId={roomId} version={snapshot.version} view={view} playerId={snapshot.playerId} language={language} runAction={runAction}/> : snapshot.gameId === 'davinci' ? <DaVinciTable key={boardIdentity} view={view} playerId={snapshot.playerId} language={language} runAction={runAction}/> : null}


          {!!game && game.id === 'rhythm' && <footer className="board-footer"><span>{snapshot.mode === 'online' ? text(language, '이 방의 게임은 두 사람만 볼 수 있어요.', 'Solo ustedes dos pueden ver la partida.') : solo ? text(language, '컴퓨터 상대 · 이 창에서만 유지돼요.', 'Contra la computadora · Solo en esta ventana.') : text(language, '데모 게임은 이 브라우저에서만 보여요.', 'La demo solo se ve en este navegador.')}</span><a href="#game-guide">{text(language, '게임 방법 보기 ↓', 'Ver cómo jugar ↓')}</a></footer>}
        </section>}

        {snapshot.gameId && <CoupleResultMoment key={`${roomId}:${snapshot.gameId}`} gameId={snapshot.gameId} result={view?.result ?? null} players={snapshot.players} language={language} teams={view?.board?.teams}/>}
        {snapshot.gameId === 'marble' && view?.board?.version === 1 && <p className="marble-legacy-notice">{text(language, '이 저장된 게임은 이전 18칸 보드예요.', 'Esta partida guardada usa el tablero anterior de 18 casillas.')} <Link href="/play">{text(language, '40칸 보드로 하려면 새 게임방 만들기', 'Para jugar en el tablero de 40 casillas, crea una sala nueva')} ↗</Link></p>}
        {game && !solo && !isCatchmind && <aside className={`chat-panel reaction-chat-panel ${chatCollapsed ? 'is-collapsed' : ''}`}>
          <header><h2>{text(language, '표정 보내기', 'Reacciones')}</h2><span className="chat-count">{snapshot.messages.filter(message => reactionForText(message.text)).length}</span><button className="chat-toggle" type="button" aria-expanded={!chatCollapsed} aria-controls="room-reactions" aria-label={text(language, chatCollapsed ? '반응 열기' : '반응 접기', chatCollapsed ? 'Abrir reacciones' : 'Contraer reacciones')} onClick={() => setChatCollapsed(value => !value)}>{chatCollapsed ? '⌄' : '⌃'}</button></header>
          <div className="chat-content" id="room-reactions" hidden={chatCollapsed}><ReactionPanel language={language} playerId={snapshot.playerId} players={snapshot.players} messages={snapshot.messages} sending={sending} error={messageError} onSend={reaction => void sendReaction(reaction)}/></div>
        </aside>}
        {snapshot.gameId === 'davinci' && view?.board?.tileCount === 24 && <p className="marble-legacy-notice">{text(language, '이 저장된 판은 조커 없는 24장 규칙이에요. 아래 설명의 조커 항목은 제외하고, 새 판부터 조커 포함 26장으로 시작해요.', 'Esta partida guardada usa 24 fichas sin comodines. Omite los puntos sobre comodines de las reglas de abajo; la próxima partida usará 26 fichas.')}</p>}
        {game && (game.id === 'rhythm' ? <GameGuide desktopDisplay={desktopDisplay} gameId={game.id} language={language} dominoMode={view?.board?.mode ?? view?.mode} dominoRulesVersion={view?.board?.rulesVersion} marbleVersion={view?.board?.version} marbleCityRouteVersion={view?.board?.cityRouteVersion ?? 0} marbleEconomyVersion={view?.board?.economicVersion} marbleEventVersion={view?.board?.eventVersion} marblePropertyRulesVersion={view?.board?.propertyRulesVersion}/> : <details className="room-guide"><summary>{text(language,'게임 방법','Cómo jugar')}</summary><GameGuide desktopDisplay={desktopDisplay} gameId={game.id} language={language} dominoMode={view?.board?.mode ?? view?.mode} dominoRulesVersion={view?.board?.rulesVersion} marbleVersion={view?.board?.version} marbleCityRouteVersion={view?.board?.cityRouteVersion ?? 0} marbleEconomyVersion={view?.board?.economicVersion} marbleEventVersion={view?.board?.eventVersion} marblePropertyRulesVersion={view?.board?.propertyRulesVersion}/></details>)}
        {game && (desktopDisplay || game.id !== 'jaipur') && <details className="game-switcher" id="game-switcher" tabIndex={-1}><summary>{text(language, '다른 게임 고르기', 'Elegir otro juego')}</summary><div><p>{solo ? text(language, '고르면 새 게임이 바로 시작돼요.', 'Al elegir empieza una partida nueva.') : text(language, '바꾸려면 두 사람 모두 같은 게임을 골라야 해요.', 'Para cambiar, los dos tienen que elegir el mismo juego.')}</p></div><div className="switch-game-list">{gameCatalog.filter(item => (!solo || supportsAi(item.id)) && item.id !== game.id && canPlayGameOnDisplay(desktopDisplay, item.id)).map(item => <button key={item.id} onClick={() => void chooseGame(item.id)} aria-label={`${text(language, '게임 선택', 'Elegir juego')}: ${item.title[language]}`} className={snapshot.pendingGame === item.id ? 'pending' : ''} aria-pressed={snapshot.pendingGame === item.id}><span className={`game-thumbnail art-${item.id}`} aria-hidden="true"/><span>{item.title[language]}</span>{snapshot.pendingGame === item.id && <small>{text(language, '상대 선택 대기', 'Esperando a tu pareja')}</small>}</button>)}</div></details>}
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

export function SameGameReplay({ gameId, language, pendingGame, onReplay, requiresAgreement = true }: { gameId: 'domino' | 'jaipur' | 'splendor'; language: Language; pendingGame: GameId | null; onReplay: () => Promise<boolean>; requiresAgreement?: boolean }) {
  return <div className="same-game-replay" data-replay-game={gameId}><MatchReplay language={language} pending={pendingGame === gameId} requiresAgreement={requiresAgreement} onReplay={onReplay}/></div>;
}

export function catchmindEnterSubmits(event: Pick<KeyboardEvent, 'key' | 'shiftKey' | 'isComposing' | 'keyCode'>, sending: boolean) {
  return event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.keyCode !== 229 && !sending;
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
    <form className="chat-compose" onSubmit={event => { event.preventDefault(); if (!sending && chat.trim()) onSend(event); }}><label className="sr-only" htmlFor="room-message">{text(language, '채팅 또는 정답 입력', 'Escribe un mensaje o respuesta')}</label><textarea id="room-message" rows={2} maxLength={60} value={chat} onChange={event => setChat(event.target.value)} placeholder={text(language, '정답을 맞히거나 이야기해요…', 'Adivina o escribe algo…')} onKeyDown={event => { if (catchmindEnterSubmits(event.nativeEvent, sending)) { event.preventDefault(); onSend(event as unknown as FormEvent); } }}/><button aria-label={text(language, '보내기', 'Enviar')} disabled={sending || !chat.trim()}>↑</button><small>{languageLabel(language)} · <button type="button" className="inline-language" onClick={() => onLanguageChange(language === 'ko' ? 'es' : 'ko')}>{text(language, '언어 바꾸기', 'Cambiar idioma')}</button></small></form>
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

function GameInstructions({ gameId, language, rules, options, dominoMode, dominoRulesVersion, desktopDisplay = true }: { gameId: GameId; language: Language; rules: string[]; dominoMode?: string; dominoRulesVersion?: number; desktopDisplay?: boolean; options?: import('./beginner-guides').BeginnerGuideOptions }) {
  if (['davinci', 'catchmind', 'marble'].includes(gameId)) return <BeginnerGameInstructions desktopDisplay={desktopDisplay} gameId={gameId} language={language} rules={rules} options={options}/>;
  if (gameId === 'minhwatu') return <MinhwatuGuide language={language}/>;
  const QuickGuide = gameId === 'domino' ? DominoQuickGuide : gameId === 'jaipur' ? JaipurQuickGuide : gameId === 'splendor' ? SplendorQuickGuide : null;
  const fullRules = <ol>{rules.map((rule, i) => <li key={i}><span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span><p>{rule}</p></li>)}</ol>;
  return QuickGuide ? <><QuickGuide language={language} {...(gameId === 'domino' ? { mode: dominoMode, rulesVersion: dominoRulesVersion } : {})} {...(['splendor', 'jaipur'].includes(gameId) ? { desktopDisplay } : {})}/><details className="guide-details"><summary>{text(language, '궁금할 때: 세부 규칙 보기', 'Ver reglas detalladas')}</summary>{fullRules}</details></> : fullRules;
}

export function GameGuide({ gameId, language, desktopDisplay = true, dominoMode, dominoRulesVersion = 2, marbleVersion, marbleEconomyVersion, marbleEventVersion, marbleCityRouteVersion, marblePropertyRulesVersion }: { gameId: GameId; language: Language; desktopDisplay?: boolean; dominoMode?: string; dominoRulesVersion?: number; marbleVersion?: number; marbleEconomyVersion?: number; marbleEventVersion?: number; marbleCityRouteVersion?: number; marblePropertyRulesVersion?: number }) {
  const game = getGame(gameId)!;
  const economyVersion = marbleEconomyVersion ?? (marbleVersion === undefined ? 2 : 0);
  const eventVersion = marbleEventVersion ?? (marbleVersion === undefined ? 3 : undefined);
  const cityRouteVersion = marbleCityRouteVersion ?? (marbleVersion === undefined ? 3 : 0);
  const propertyRulesVersion = marblePropertyRulesVersion ?? (marbleVersion === undefined ? 1 : 0);
  const rules = gameId === 'domino' && dominoRulesVersion === 2 ? lisbethDominoRules : gameId === 'domino' && dominoRulesVersion === 1 ? dominoPremiumRules : gameId === 'domino' ? dominoLegacyRules : gameId === 'marble' ? marbleVersion === 1 ? marbleLegacyRules : propertyRulesVersion === 1 ? marblePropertyRules : eventVersion === 3 ? marbleExpandedRules : economyVersion === 2 ? marbleTieredRules : economyVersion === 1 ? marbleCreditRules : gameRules.marble : gameRules[gameId];
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
    <GameInstructions desktopDisplay={desktopDisplay} gameId={gameId} language={language} rules={rules[language]} dominoMode={dominoMode} dominoRulesVersion={dominoRulesVersion} options={{ marbleVersion, marbleEconomyVersion: economyVersion, marbleCityRouteVersion: cityRouteVersion, marblePropertyRulesVersion: propertyRulesVersion }}/>
    {game.id === 'domino' && <p className="variant-note">{dominoModeLabel}{' · '}{dominoRulesVersion === 2 ? text(language, 'Lisbeth 규칙 · 100점 또는 200점 매치 · 카피쿠아 +30점.', 'Reglas de Lisbeth · partido a 100 o 200 · capicúa +30.') : dominoRulesVersion === 1 ? text(language, '목표점수·보너스·막힘 판정은 테이블 설정을 확인하세요.', 'Revisa la meta, los bonos y el tranque en los ajustes.') : text(language, '기존 단판 규칙입니다. 카피쿠아 보너스는 적용하지 않습니다.', 'Esta sala conserva las reglas de una sola mano, sin bono de capicúa.')}</p>}
  </section>;
}

export function RulesDialog({ gameId, language, dominoMode, onClose }: { gameId: GameId; language: Language; dominoMode?: string; onClose: () => void }) {
  const dialogRef = useModalFocus(onClose);
  const game = getGame(gameId)!;
  const dominoModeLabel = dominoMode === 'partners'
    ? text(language, '현재 모드: 사람-봇 혼합 팀전', 'Modo actual: equipos mixtos de persona y bot')
    : dominoMode === 'humans-vs-bots'
      ? text(language, '현재 모드: 사람 2명 대 봇 2명', 'Modo actual: dos personas contra dos bots')
      : dominoMode === '1v1'
        ? text(language, '현재 모드: 1대1', 'Modo actual: 1 contra 1')
        : text(language, '첫 타일 전에 모드를 선택할 수 있어요.', 'Pueden elegir el modo antes de colocar la primera ficha.');
  const rules = gameId === 'domino' ? lisbethDominoRules : gameId === 'marble' ? marblePropertyRules : gameRules[gameId];
  return <div className="dialog-scrim" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section ref={dialogRef} tabIndex={-1} className="rules-dialog" role="dialog" aria-modal="true" aria-labelledby="rules-title"><button className="dialog-close" aria-label={text(language, '닫기', 'Cerrar')} onClick={onClose}>×</button><div className={`rules-icon game-${game.color}`}><span className={`game-thumbnail art-${game.id}`} aria-hidden="true"/></div><h2 id="rules-title">{game.title[language]}</h2>{gameId !== 'minhwatu' && <p className="rules-subtitle">{game.subtitle[language]}</p>}<GameInstructions gameId={gameId} language={language} rules={rules[language]} options={gameId === 'marble' ? {marbleVersion:2,marbleEconomyVersion:2,marbleCityRouteVersion:3,marblePropertyRulesVersion:1} : undefined} dominoMode={dominoMode ?? '1v1'} dominoRulesVersion={gameId === 'domino' ? 2 : undefined}/>{game.id === 'domino' && <p className="variant-note">{dominoModeLabel}{' · '}{text(language, 'Lisbeth 규칙으로 100점 또는 200점 매치를 진행합니다.', 'Jueguen con las reglas de Lisbeth a 100 o 200 puntos.')}</p>}<button className="button button-dark full-button" onClick={onClose}>{text(language, '확인했어요', 'Entendido')} <span>✓</span></button></section></div>;
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
  if (gameId === 'catchmind') {
    const drawing = view?.turn === player;
    if (view?.phase === 'choosing') return drawing ? text(language, '제시어를 골라 주세요', 'Elige una palabra') : text(language, '상대가 제시어를 고르고 있어요', 'Tu pareja elige una palabra');
    if (view?.phase === 'drawing') return drawing ? text(language, '그림을 그려 주세요', 'Dibuja la palabra') : text(language, '그림을 맞혀 보세요', 'Adivina el dibujo');
  }
  return view?.turn === player ? text(language, '내 차례예요', 'Tu turno') : text(language, '상대 차례예요', 'Turno rival');
}
function languageLabel(language: Language) { return language === 'ko' ? '한국어' : 'Español · RD'; }
function initial(name: string) { return [...name][0] || '?'; }
function formatTime(value: string) { const date = new Date(value); return Number.isNaN(date.valueOf()) ? '' : date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); }

function errorMessage(cause: unknown, language: Language) {
  const message = cause instanceof Error ? cause.message : '';
  const errors: Record<string, [string, string]> = {
    nickname_required: ['별명을 1~24자로 입력해 주세요.', 'Escribe un nombre de 1 a 24 caracteres.'],
    demo_same_browser_only: ['이 데모 방은 만든 브라우저에서만 열 수 있어요.', 'Esta sala demo solo funciona en el navegador donde se creó.'],
    invalid_language: ['언어를 다시 선택해 주세요.', 'Vuelve a elegir el idioma.'],
    no_game: ['먼저 게임을 선택해 주세요.', 'Primero elige un juego.'],
    solo_game_unavailable: ['이 게임은 혼자 플레이를 지원하지 않아요.', 'Este juego no admite modo individual.'],
    solo_session_only: ['혼자 플레이에는 초대로 참가할 수 없어요.', 'No se puede entrar por invitación a una partida individual.'],
    online_seat_fixed: ['온라인 방에서는 좌석을 바꿀 수 없어요.', 'No puedes cambiar de asiento en una sala en línea.'],
    stale_state: ['판이 갱신됐어요. 현재 패와 선택을 확인한 뒤 다시 확정해 주세요.', 'La mesa cambió. Revisa tus cartas y tu selección antes de confirmar de nuevo.'],
    action_confirmation_unknown: ['서버 응답을 확인하지 못했어요. 최신 판에서 해당 행동이 반영됐는지 확인해 주세요.', 'No recibimos la confirmación. Revisa en la mesa actual si la acción ya se realizó.'],
    room_expired: ['이 방은 만료됐어요. 새 방을 만들어 주세요.', 'La sala venció. Crea una nueva.'],
    server_clock_only: ['서버 시각을 확인할 수 없어요. 잠시 후 다시 시도해 주세요.', 'No se pudo consultar el reloj del servidor. Inténtalo de nuevo.'],
    chat_rate_limit: ['너무 빠르게 보냈어요. 1초 뒤에 다시 보내 주세요. 입력한 내용은 남아 있어요.', 'Enviaste muy rápido. Espera un segundo e inténtalo de nuevo; tu texto sigue aquí.'],
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
