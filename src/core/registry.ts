import type { GameEngine, GameId } from './types';
import { davinciEngine } from '../games/davinci';
import { catchmindEngine } from '../games/catchmind';
import { dominoEngine } from '../games/domino';
import { jaipurEngine } from '../games/jaipur';
import { splendorEngine } from '../games/splendor';
import { minhwatuEngine } from '../games/minhwatu';
import { marbleEngine } from '../games/marble';
export const engines: Partial<Record<GameId, GameEngine>> = {davinci:davinciEngine, catchmind:catchmindEngine, domino:dominoEngine, jaipur:jaipurEngine, splendor:splendorEngine, minhwatu:minhwatuEngine, marble:marbleEngine};
