import { aiTurnDelay } from '../games/simpleAi';
import { fourDavinciEngine } from '../games/fourDavinci';
import { fourSplendorEngine } from '../games/fourSplendor';
import { fourMinhwatuEngine } from '../games/fourMinhwatu';
import { fourMarbleEngine } from '../games/fourMarble';
import { fourSeats, type FourEngine, type FourView } from './fourPlayer';
import type { GameId, GameAction, Language } from './types';

export const fourEngines: Partial<Record<GameId, FourEngine>> = {
  davinci: fourDavinciEngine, splendor: fourSplendorEngine,
  minhwatu: fourMinhwatuEngine, marble: fourMarbleEngine,
};
export interface FourSnapshot { roomId: string | null; nickname: string; language: Language; gameId: GameId | null; view: FourView | null; version: number; matchId: number; error: string | null }

export class FourPlayerClient {
  private snapshot: FourSnapshot = { roomId: null, nickname: '', language: 'ko', gameId: null, view: null, version: 0, matchId: 0, error: null };
  private state: any = null;
  private listeners = new Set<(snapshot: FourSnapshot) => void>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  getSnapshot = () => this.snapshot;
  private cancel() { if (this.timer !== null) clearTimeout(this.timer); this.timer = null; }
  private update() {
    const engine = this.snapshot.gameId ? fourEngines[this.snapshot.gameId] : null;
    this.snapshot = { ...this.snapshot, version: this.snapshot.version + 1, view: engine && this.state ? engine.getPlayerView(this.state, 'p1') : null };
    for (const callback of this.listeners) callback(this.snapshot);
    this.schedule();
  }
  private schedule() {
    this.cancel();
    const engine = this.snapshot.gameId ? fourEngines[this.snapshot.gameId] : null;
    if (!this.listeners.size || !engine || !this.state || this.snapshot.view?.result) return;
    // Engines may have simultaneous setup actions; use each seat's own view.
    for (const seat of fourSeats.filter(seat => seat !== 'p1')) {
      const action = engine.chooseAiAction(engine.getPlayerView(this.state, seat), seat);
      if (!action) continue;
      this.timer = setTimeout(() => {
        this.timer = null;
        try {
          const error = engine.validateAction(this.state, seat, action);
          if (error) throw new Error(error);
          this.state = engine.applyAction(this.state, seat, action);
          this.update();
        } catch (error) {
          this.snapshot = { ...this.snapshot, error: error instanceof Error ? error.message : 'ai_action_failed' };
          for (const callback of this.listeners) callback(this.snapshot);
        }
      }, aiTurnDelay(engine.id));
      return;
    }
  }
  async createRoom(nickname: string, language: Language) {
    const name = nickname.trim();
    if (!name || name.length > 24) throw new Error('nickname_required');
    this.cancel(); this.state = null;
    this.snapshot = { roomId: `solo-team-${crypto.randomUUID()}`, nickname: name, language, gameId: null, view: null, version: 0, matchId: 0, error: null };
    this.update(); return this.snapshot.roomId!;
  }
  subscribeRoom(roomId: string, callback: (snapshot: FourSnapshot) => void) {
    if (roomId !== this.snapshot.roomId) return () => {};
    this.listeners.add(callback); callback(this.snapshot); this.schedule();
    return () => { this.listeners.delete(callback); if (!this.listeners.size) this.cancel(); };
  }
  async selectGame(gameId: GameId) {
    const engine = fourEngines[gameId];
    if (!this.snapshot.roomId || !engine) throw new Error('solo_game_unavailable');
    const state = engine.createInitialState(crypto.getRandomValues(new Uint32Array(1))[0]);
    this.cancel(); this.state = state;
    this.snapshot = { ...this.snapshot, gameId, matchId: this.snapshot.matchId + 1, error: null }; this.update();
  }
  async sendAction(action: GameAction) {
    const engine = this.snapshot.gameId ? fourEngines[this.snapshot.gameId] : null;
    if (!engine || !this.state) throw new Error('no_game');
    const error = engine.validateAction(this.state, 'p1', action);
    if (error) throw new Error(error);
    this.state = engine.applyAction(this.state, 'p1', action); this.update();
  }
  closeRoom() {
    this.cancel();this.state = null;
    this.snapshot = { roomId: null, nickname: '', language: 'ko', gameId: null, view: null, version: 0, matchId: 0, error: null };
    this.update();
  }
}
export const fourPlayerClient = new FourPlayerClient();
