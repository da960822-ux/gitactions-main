import type { GameAction, Language, PlayerId } from '../core/types';
import DominoBoard from './DominoBoard';
import MarbleBoard from './MarbleBoard';
export { DominoBoard, MarbleBoard };
export { orderDominoChain } from './domino-chain';

type BoardGamesProps = {
  game: string; view: any; language: Language; playerId: PlayerId;
  runAction: (action: GameAction) => void | Promise<unknown>;
};

export function BoardGames({ game, view, language, playerId, runAction }: BoardGamesProps) {
  if (game === 'domino') return <DominoBoard view={view} language={language} playerId={playerId} runAction={runAction}/>;
  if (game === 'marble') return <MarbleBoard view={view} language={language} playerId={playerId} runAction={runAction}/>;
  return null;
}
