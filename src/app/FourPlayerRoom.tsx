import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { fourPlayerClient, fourEngines, type FourSnapshot } from '../core/fourPlayerClient';
import type { GameAction, GameId, Language } from '../core/types';
import { getGame } from '../games/catalog';
import { canPlayGameOnDisplay } from '../core/display';
import { DesktopGameNotice } from './DesktopGameNotice';
import { Link, navigate, roomHref } from './Router';

const DaVinciTeamTable = lazy(() => import('./DaVinciTeamTable'));
const SplendorTeamTable = lazy(() => import('./SplendorTeamTable'));
const MinhwatuTeamTable = lazy(() => import('./MinhwatuTeamTable').then(module => ({ default: module.MinhwatuTeamTable })));
const MarbleTeamBoard = lazy(() => import('./MarbleTeamBoard'));
const text = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;

// Routing and session lifetime only. Every supported game owns its four-player screen.
export default function FourPlayerRoom({ roomId, desktopDisplay }: { roomId: string; desktopDisplay: boolean }) {
  const [snapshot, setSnapshot] = useState<FourSnapshot>(fourPlayerClient.getSnapshot);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  useEffect(() => fourPlayerClient.subscribeRoom(roomId, setSnapshot), [roomId]);
  const { language, gameId, view } = snapshot;
  useEffect(() => { document.documentElement.lang = language === 'ko' ? 'ko' : 'es-DO'; }, [language]);
  const selectGame = async (game: GameId) => {
    setError('');
    if (game === 'domino') {
      const { soloClient } = await import('../core/client');
      const id = await soloClient.createRoom(snapshot.nickname, language);
      await soloClient.selectGame('domino');
      await soloClient.sendAction({ type: 'configure', payload: { mode: 'partners', difficulty: 'hard' } });
      navigate(roomHref(id));return;
    }
    if (!fourEngines[game]) throw new Error('unsupported_team_screen');
    await fourPlayerClient.selectGame(game);
  };
  const runAction = async (action: GameAction) => {
    if (locked.current) return false;
    locked.current = true;setBusy(true);setError('');
    try { await fourPlayerClient.sendAction(action);return true; }
    catch { setError(text(language, '선택할 수 없는 행동이에요. 다시 골라 주세요.', 'La acción no está disponible. Elige de nuevo.'));return false; }
    finally { locked.current = false;setBusy(false); }
  };
  const exit = () => {
    fourPlayerClient.closeRoom();navigate('/play');
  };
  if (roomId !== snapshot.roomId || !gameId || !view) return <main className="join-page"><p>{text(language, '게임을 선택해 새 팀전을 시작해 주세요.', 'Elige un juego para empezar otra partida.')}</p><Link className="button button-dark" href="/play">{text(language, '게임 선택', 'Elegir juego')}</Link></main>;
  if (!canPlayGameOnDisplay(desktopDisplay, gameId)) return <DesktopGameNotice language={language}/>;
  const props = { view, language, runAction, nickname: snapshot.nickname, roomId, version: snapshot.version, onReplay: () => selectGame(gameId), onExit: exit, onSelectGame: selectGame, error: error || (snapshot.error ? text(language, 'AI 진행을 멈췄어요. 새 판을 시작해 주세요.', 'La IA se detuvo. Inicia otra partida.') : ''), busy };
  let screen;
  switch (gameId) {
    case 'davinci': screen = <DaVinciTeamTable {...props}/>;break;
    case 'splendor': screen = <SplendorTeamTable {...props}/>;break;
    case 'minhwatu': screen = <MinhwatuTeamTable {...props}/>;break;
    case 'marble': screen = <MarbleTeamBoard {...props}/>;break;
    default: throw new Error('unsupported_team_screen');
  }
  return <Suspense fallback={<main className="loading-screen"><p>{text(language, `${getGame(gameId)?.title[language]} 준비 중…`, `Preparando ${getGame(gameId)?.title[language]}…`)}</p></main>}><div key={`${roomId}:${gameId}:${snapshot.matchId}`} className={`team-route-${gameId}`}>{screen}</div></Suspense>;
}
