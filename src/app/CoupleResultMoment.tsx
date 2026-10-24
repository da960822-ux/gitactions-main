import { useState } from 'react';
import { CoupleReactionArt } from './CoupleReactionArt';
import type { GameId, GameResult, Language, PlayerId } from '../core/types';
import './couple-result-moment.css';

type CoupleIdentity = 'yeonseok' | 'lisbeth';
type Player = { id: PlayerId; nickname: string };
type Props = {
  gameId: GameId;
  result: GameResult | null;
  players: readonly Player[];
  language: Language;
  teams?: Record<string, readonly string[]>;
};

function identity(nickname: string): CoupleIdentity | null {
  const name = nickname.normalize('NFC').trim().toLowerCase();
  if (name === 'yeonseok' || name === '연석') return 'yeonseok';
  if (name === 'lisbeth' || name === '리스벳') return 'lisbeth';
  return null;
}

export function coupleResultWinner({ gameId, result, players, teams }: Omit<Props, 'language'>): CoupleIdentity | null {
  if (!result || (result.winner !== 'p1' && result.winner !== 'p2') || gameId === 'rhythm') return null;
  const first = players.filter(player => player.id === 'p1');
  const second = players.filter(player => player.id === 'p2');
  if (first.length !== 1 || second.length !== 1) return null;
  const p1 = identity(first[0].nickname), p2 = identity(second[0].nickname);
  if (!p1 || !p2 || p1 === p2) return null;
  // Domino winners can be teams; a shared human victory must not become a couple rivalry.
  const members = gameId === 'domino' ? teams?.[result.winner] : undefined;
  if (gameId === 'domino' && !members) return null;
  if (members) {
    const humans = members.filter(seat => seat === 'p1' || seat === 'p2');
    if (humans.length !== 1) return null;
    return humans[0] === 'p1' ? p1 : p2;
  }
  return result.winner === 'p1' ? p1 : p2;
}

export function CoupleResultMoment(props: Props) {
  const winner = coupleResultWinner(props);
  return winner ? <ResultPicture key={`${props.gameId}:${winner}`} winner={winner} language={props.language}/> : null;
}

function ResultPicture({ winner, language }: { winner: CoupleIdentity; language: Language }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  const name = winner === 'lisbeth' ? 'Lisbeth' : 'Yeonseok';
  const es = language === 'es';
  const alt = winner === 'lisbeth'
    ? es ? 'Lisbeth celebra sacando la lengua; Yeonseok está cabizbajo en su escritorio.' : '리스벳이 메롱하며 기뻐하고 연석은 책상에서 풀이 죽어 있어요.'
    : es ? 'Yeonseok celebra aplaudiendo; Lisbeth está frustrada frente a su laptop.' : '연석이 박수치며 기뻐하고 리스벳은 노트북 앞에서 답답해하고 있어요.';
  return <aside className="couple-result-moment" aria-label={es ? 'Después de la partida' : '한 판 끝나고'}>
    <div className="couple-result-moment-heading"><p>{es ? `Ganó ${name}. Te felicito con cariño. La próxima partida ya es otra historia ♡` : `${name} 승! 축하는 해줄게. 다음 판은 별개야 ♡`}</p><button type="button" onClick={() => setDismissed(true)}>{es ? 'Ocultar imagen' : '그림 접기'}</button></div>
    <CoupleReactionArt reaction={winner} alt={alt} onError={() => setDismissed(true)}/>
  </aside>;
}
