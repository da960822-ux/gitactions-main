import { useEffect, useRef, useState } from 'react';
import type { GameAction, GameId, Language, PlayerId } from '../core/types';
import { cancelMinhwatuAudio, playMinhwatuCue, dispose, getPreferences, playCue, setPreferences, setScene, unlock, type AudioCue, type AudioPreferences } from '../audio/audio';
import { marbleCueForEvent, marbleEventSequence, marbleEventsAfter, type MarbleActionEvent } from './marble-motion';
import { dominoCueForEvent, dominoSequence, dominoWindow, type DominoActionEvent } from './domino-motion';
import { jaipurCueForEvent, jaipurCuesForEvent, jaipurEventWindow, jaipurSequence, type JaipurEvent } from './jaipur-motion';
import { hwatuCueForEvent, hwatuEventWindow, hwatuEvents, hwatuSequence } from './hwatu-motion';
import './game-feedback.css';

const copy = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;
const defaultPreferences: AudioPreferences = { sfxEnabled: false, sfxVolume: 0.48 };

function readPreferences(gameId: GameId): AudioPreferences {
  try { return getPreferences(gameId); } catch { return defaultPreferences; }
}

export function cueForAction(game: GameId, action: GameAction): AudioCue | null {
  if (game === 'rhythm' || game === 'minhwatu') return null;
  if (game === 'domino' || game === 'jaipur') return null;
  if (game === 'marble') return null;
  const type = action.type.toLowerCase();
  if (game === 'davinci' && (type === 'draw' || type === 'skip-draw' || type === 'place-joker' || type === 'finish-setup')) return null;
  if (type === 'guess' || type === 'end-round' || type === 'endturn' || type === 'stop' || type === 'pass' || type === 'tick') return null;
  if (game === 'catchmind' && type === 'draw') return null;
  if (type.includes('roll') || type === 'dice' || type === 'attempt-doubles') return 'dice';
  if (type === 'skip-train') return 'select';
  if (type.includes('buy') || type.includes('purchase') || type.includes('train') || type === 'build' || type === 'upgrade') return 'buy';
  if (type.includes('sell')) return 'sell';
  if (type.includes('reveal')) return 'reveal';
  if (type.includes('correct')) return 'correct';
  if (type === 'draw') return 'draw';
  if (game === 'splendor' && type === 'choosenoble') return null;
  if (game === 'splendor' && type === 'reserve') return 'place';
  if (game === 'splendor' && (type === 'take' || type === 'taketwo')) return 'select';
  if (type.includes('place') || type.includes('capture') || type.includes('choose') || type.includes('select')) return 'select';
  return 'select';
}

export class ActionFlightGuard {
  private readonly actions = new Set<string>();
  get size() { return this.actions.size; }
  begin(action: GameAction): boolean {
    const key = JSON.stringify(action);
    if (this.actions.has(key)) return false;
    this.actions.add(key);
    return true;
  }
  finish(action: GameAction): void { this.actions.delete(JSON.stringify(action)); }
}

function resultSignature(result: any): string {
  if (!result) return '';
  return `${String(result.winner ?? '')}:${String(result.reason ?? '')}`;
}

function resultForPlayer(game: GameId, view: any, player: PlayerId): 'win' | 'lose' | 'draw' | null {
  const winner = view?.result?.winner;
  if (!winner) return null;
  if (winner === 'draw') return 'draw';
  const team = game === 'domino' ? view.board?.teams?.[winner] : null;
  return winner === player || (Array.isArray(team) && team.includes(player)) ? 'win' : 'lose';
}

export function publicViewCue(game: GameId, previous: any, next: any, player: PlayerId): AudioCue | null {
  if (!previous || !next) return null;
  const beforeResult = resultSignature(previous.result), afterResult = resultSignature(next.result);
  if (!beforeResult && afterResult) {
    const outcome = resultForPlayer(game, next, player);
    return outcome === 'draw' ? 'event' : outcome === 'win' ? 'win' : 'lose';
  }
  if (game === 'minhwatu') {
    const fresh = hwatuEventsAfterView(previous, next);
    return fresh.length ? hwatuCueForEvent(fresh[fresh.length - 1], player) : null;
  }
  if (game === 'davinci') {
    const before = previous.board?.lastEvent, after = next.board?.lastEvent;
    if (Number.isSafeInteger(after?.sequence) && after.sequence > (Number.isSafeInteger(before?.sequence) ? before.sequence : 0)) {
      if (after.type === 'draw') return 'draw';
      if (after.type === 'arrange') return 'place';
      if (after.type === 'correct-guess') return 'correct';
      if (after.type === 'wrong-guess') return 'error';
      if (after.type === 'stop' && previous.turn !== next.turn) return 'turn';
    }
    return null;
  }
  if (game === 'catchmind') {
    const before = previous.board?.scores ?? {}, after = next.board?.scores ?? {};
    if (Number(after.p1 ?? 0) > Number(before.p1 ?? 0) || Number(after.p2 ?? 0) > Number(before.p2 ?? 0)) return 'correct';
  }
  if (game === 'domino') {
    const prior = dominoEvents(previous);
    const beforeSequence = prior.reduce((max, event) => Math.max(max, dominoSequence(event)), 0);
    const fresh = dominoWindow(dominoEvents(next), beforeSequence).fresh;
    return fresh.length ? dominoCueForEvent(fresh[fresh.length - 1]) : null;
  }
  if (game === 'jaipur') {
    const before = jaipurEvents(previous);
    const sequence = before.reduce((max, event) => Math.max(max, jaipurSequence(event)), 0);
    const fresh = jaipurEventWindow(jaipurEvents(next), sequence).fresh;
    if (fresh.length) return jaipurCueForEvent(fresh[fresh.length - 1]);
  }
  if (game === 'marble') {
    const priorEvents = marbleEvents(previous);
    const nextEvents = marbleEvents(next);
    const priorSequence = priorEvents.reduce((max, event) => Math.max(max, marbleEventSequence(event)), 0);
    const fresh = marbleEventsAfter(nextEvents, priorSequence);
    return fresh.length ? marbleCueForEvent(fresh[fresh.length - 1]) : null;
  }
  if (game === 'splendor') {
    const before = previous.board?.ownedNobles, after = next.board?.ownedNobles;
    if (before && after && (['p1', 'p2'] as const).some(id => Number.isFinite(before[id]) && Number.isFinite(after[id]) && after[id] > before[id])) return 'noble';
  }
  if (previous.turn !== next.turn && next.turn !== undefined && next.turn !== null) return 'turn';
  return null;
}

function marbleEvents(view: any): MarbleActionEvent[] {
  const board = view?.board;
  const value = Array.isArray(board?.actionLog) && board.actionLog.length ? board.actionLog : board?.lastEvent ? [board.lastEvent] : [];
  return value.filter((event: unknown): event is MarbleActionEvent => Boolean(event && typeof event === 'object'));
}

function dominoEvents(view: any): DominoActionEvent[] {
  const value = Array.isArray(view?.log) ? view.log : Array.isArray(view?.board?.actionLog) ? view.board.actionLog : [];
  return value.filter((event: unknown): event is DominoActionEvent => Boolean(event && typeof event === 'object'));
}

function jaipurEvents(view: any): JaipurEvent[] {
  const value = Array.isArray(view?.log) ? view.log : Array.isArray(view?.board?.actionLog) ? view.board.actionLog : [];
  return value.filter((event: unknown): event is JaipurEvent => Boolean(event && typeof event === 'object'));
}

function hwatuEventsAfterView(previous: any, next: any) {
  const before = hwatuEvents(previous);
  const sequence = before.reduce((max, event) => Math.max(max, hwatuSequence(event)), 0);
  return hwatuEventWindow(hwatuEvents(next), sequence).fresh;
}

export function publicViewAnnouncement(game: GameId, previous: any, next: any, player: PlayerId, language: Language): { cue: AudioCue; message: string } | null {
  const cue = publicViewCue(game, previous, next, player);
  if (!cue) return null;
  const resultChanged = !resultSignature(previous?.result) && !!resultSignature(next?.result);
  let message = '';
  if (resultChanged) {
    const outcome = resultForPlayer(game, next, player);
    message = outcome === 'draw'
      ? copy(language, '무승부로 게임이 끝났어요.', 'La partida terminó en empate.')
      : outcome === 'win' ? copy(language, '게임에서 이겼어요.', 'Ganaste la partida.')
        : copy(language, '게임이 끝났어요. 상대가 이겼어요.', 'La partida terminó. Ganó la otra persona.');
  } else if (game === 'jaipur') {
    const beforeEvents = jaipurEvents(previous);
    const sequence = beforeEvents.reduce((max, event) => Math.max(max, jaipurSequence(event)), 0);
    const event = jaipurEventWindow(jaipurEvents(next), sequence).fresh.at(-1);
    message = [event?.title?.[language], event?.text?.[language]].filter(Boolean).join(' · ');
  } else if (game === 'domino') {
    const beforeEvents = dominoEvents(previous);
    const beforeSequence = beforeEvents.reduce((max, event) => Math.max(max, dominoSequence(event)), 0);
    const event = dominoWindow(dominoEvents(next), beforeSequence).fresh.at(-1);
    message = event?.title?.[language] ?? '';
  } else if (game === 'marble') {
    const previousEvents = marbleEvents(previous);
    const priorSequence = previousEvents.reduce((max, event) => Math.max(max, marbleEventSequence(event)), 0);
    const event = marbleEventsAfter(marbleEvents(next), priorSequence).at(-1) ?? next.board?.lastEvent;
    message = [event?.title?.[language], event?.text?.[language]].filter(Boolean).join(' · ');
  } else if (game === 'minhwatu') {
    const event = hwatuEventsAfterView(previous, next).at(-1);
    message = event?.title?.[language] ?? '';
    if (event?.type === 'special' && event.yaku?.bonus) message = [message, event.yaku.label[language]].filter(Boolean).join(' · ');
  } else if (game === 'davinci' && cue === 'draw') {
    message = next.board?.lastEvent?.actor === player
      ? copy(language, '타일을 뽑았어요.', 'Robaste una ficha.')
      : copy(language, '상대가 타일을 뽑았어요.', 'La otra persona robó una ficha.');
  } else if (game === 'davinci' && cue === 'place') {
    message = next.board?.lastEvent?.actor === player
      ? copy(language, '타일을 정렬했어요.', 'Ordenaste una ficha.')
      : copy(language, '상대가 타일을 정렬했어요.', 'La otra persona ordenó una ficha.');
  } else if (cue === 'correct') {
    if (game === 'davinci') message = next.board?.lastEvent?.actor === player
      ? copy(language, '상대 타일을 맞혔어요!', '¡Adivinaste la ficha rival!')
      : copy(language, '상대가 내 타일을 맞혔어요.', 'La otra persona adivinó una de tus fichas.');
    else message = copy(language, '정답을 맞혔어요!', '¡Respuesta correcta!');
  } else if (cue === 'noble' && game === 'splendor') {
    const before = previous.board?.ownedNobles?.[player] ?? 0, after = next.board?.ownedNobles?.[player] ?? 0;
    message = after > before
      ? copy(language, '귀족을 얻었어요.', 'Recibiste un noble.')
      : copy(language, '상대가 귀족을 얻었어요.', 'La otra persona recibió un noble.');
  } else if (cue === 'error') {
    if (game === 'davinci') {
      const event = next.board?.lastEvent;
      const revealed = Number.isInteger(event?.revealedOwnIndex);
      if (event?.actor === player) message = revealed
        ? copy(language, '틀려서 내 타일이 공개됐어요.', 'Fallaste y se reveló una ficha tuya.')
        : copy(language, '이번 추측은 틀렸어요.', 'No acertaste esta vez.');
      else message = revealed
        ? copy(language, '상대의 추측이 틀려 타일이 공개됐어요.', 'La otra persona falló y reveló una ficha suya.')
        : copy(language, '상대의 추측이 틀렸어요.', 'La otra persona no acertó.');
    } else message = copy(language, '내 타일이 공개됐어요.', 'Se reveló una de tus fichas.');
  } else if (cue === 'reveal') {
    message = copy(language, '타일이 공개됐어요.', 'Se reveló una ficha.');
  } else if (cue === 'turn') {
    message = next.turn === player
      ? copy(language, '내 차례예요.', 'Es tu turno.')
      : copy(language, '상대 차례예요.', 'Es el turno de la otra persona.');
  }
  return message ? { cue, message } : null;
}

export type ContextAnnouncement = { gameId: GameId; playerId: PlayerId; message: string };
export function announcementForContext(value: ContextAnnouncement | null, gameId: GameId, playerId: PlayerId): string {
  return value?.gameId === gameId && value.playerId === playerId ? value.message : '';
}

export function GameFeedback({ language, gameId, playerId, view, pending = false }: {
  language: Language;
  gameId: GameId;
  playerId: PlayerId;
  view: any;
  pending?: boolean;
}) {
  const [preferenceState, setPreferenceState] = useState<{ gameId: GameId; value: AudioPreferences }>(() => ({ gameId, value: readPreferences(gameId) }));
  const preferences = preferenceState.gameId === gameId ? preferenceState.value : readPreferences(gameId);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [announcementState, setAnnouncementState] = useState<ContextAnnouncement | null>(null);
  const announcement = announcementForContext(announcementState, gameId, playerId);
  const prior = useRef<{ gameId: GameId; playerId: PlayerId; view: any } | null>(null);
  const clearTimer = useRef<number | null>(null);
  const cueTimers = useRef<number[]>([]);

  useEffect(() => {
    if (gameId !== 'minhwatu') return;
    const receive = (signal: Event) => {
      const detail = (signal as CustomEvent).detail;
      if (!detail || detail.playerId !== playerId || !Array.isArray(detail.impactOffsets)) return;
      if (!detail.transfer) {
        const events = Array.isArray(detail.events) ? detail.events : [detail.event];
        const message = events.map((event: any) => event?.title?.[language]).filter((title: unknown): title is string => typeof title === 'string' && !!title).join(' · ');
        if (message) {
          if (clearTimer.current !== null) window.clearTimeout(clearTimer.current);
          const landing = Math.max(0, ...detail.impactOffsets.filter((offset: unknown): offset is number => typeof offset === 'number' && Number.isFinite(offset) && offset >= 0 && offset <= 2000));
          clearTimer.current = window.setTimeout(() => {
            setAnnouncementState({ gameId, playerId, message });
            clearTimer.current = window.setTimeout(() => { clearTimer.current = null; setAnnouncementState(null); }, 2600);
          }, landing);
        }
      }
      const cue = detail.transfer ? 'place' : hwatuCueForEvent(detail.event, playerId);
      if (cue === 'capture') {
        playMinhwatuCue(cue, detail.impactOffsets.slice(0, 1));
        playMinhwatuCue('stack', detail.impactOffsets.slice(1));
      } else if (cue) playMinhwatuCue(cue, detail.impactOffsets);
    };
    const cancel = () => {
      cancelMinhwatuAudio();
      if (clearTimer.current !== null) window.clearTimeout(clearTimer.current);
      clearTimer.current = null;
      setAnnouncementState(null);
    };
    window.addEventListener('minhwatu-presentation-cue', receive);
    window.addEventListener('minhwatu-presentation-cancel', cancel);
    return () => {
      window.removeEventListener('minhwatu-presentation-cue', receive);
      window.removeEventListener('minhwatu-presentation-cancel', cancel);
      cancel();
    };
  }, [gameId, language, playerId]);

  useEffect(() => { setScene(gameId); setPreferenceState({ gameId, value: readPreferences(gameId) }); }, [gameId]);
  useEffect(() => () => {
    if (clearTimer.current !== null) window.clearTimeout(clearTimer.current);
    clearTimer.current = null;
    cueTimers.current.forEach(window.clearTimeout);
    cueTimers.current = [];
    dispose();
    setScene(null);
  }, []);

  useEffect(() => {
    if (!view) {
      const previous = prior.current;
      if (previous && (previous.gameId !== gameId || previous.playerId !== playerId)) {
        prior.current = null;
        if (clearTimer.current !== null) window.clearTimeout(clearTimer.current);
        clearTimer.current = null;
        cueTimers.current.forEach(window.clearTimeout);
        cueTimers.current = [];
        setAnnouncementState(null);
      }
      return;
    }
    const next = { gameId, playerId, view };
    const previous = prior.current;
    prior.current = next;
    if (!previous || previous.gameId !== gameId || previous.playerId !== playerId) {
      if (clearTimer.current !== null) window.clearTimeout(clearTimer.current);
      clearTimer.current = null;
      cueTimers.current.forEach(window.clearTimeout);
      cueTimers.current = [];
      setAnnouncementState(null);
      return;
    }

    if (gameId === 'minhwatu') return;
    const transition = publicViewAnnouncement(gameId, previous.view, view, playerId, language);
    if (transition) {
      setAnnouncementState({ gameId, playerId, message: transition.message });
      if (clearTimer.current !== null) window.clearTimeout(clearTimer.current);
      clearTimer.current = window.setTimeout(() => { clearTimer.current = null; setAnnouncementState(null); }, 2600);
    }
    if (gameId === 'marble') {
      const previousResult = resultSignature(previous.view.result), nextResult = resultSignature(view.result);
      if (!previousResult && nextResult) {
        cueTimers.current.forEach(window.clearTimeout);
        cueTimers.current = [];
        if (transition) playCue(gameId, transition.cue);
        else playCue(gameId, resultForPlayer(gameId, view, playerId) === 'win' ? 'win' : 'lose');
        return;
      }
      const oldEvents = marbleEvents(previous.view);
      const oldSequence = oldEvents.reduce((max, event) => Math.max(max, marbleEventSequence(event)), 0);
      const cues = marbleEventsAfter(marbleEvents(view), oldSequence).map(marbleCueForEvent).filter((cue): cue is AudioCue => cue !== null);
      cues.forEach((cue, index) => {
        if (index === 0) playCue(gameId, cue);
        else cueTimers.current.push(window.setTimeout(() => playCue(gameId, cue), index * 230));
      });
      return;
    }
    if (gameId === 'jaipur') {
      const previousResult = resultSignature(previous.view.result), nextResult = resultSignature(view.result);
      if (!previousResult && nextResult) {
        cueTimers.current.forEach(window.clearTimeout);
        cueTimers.current = [];
        if (transition) playCue(gameId, transition.cue);
        else playCue(gameId, resultForPlayer(gameId, view, playerId) === 'win' ? 'win' : 'lose');
        return;
      }
      const before = jaipurEvents(previous.view);
      const sequence = before.reduce((max, event) => Math.max(max, jaipurSequence(event)), 0);
      const cues = jaipurEventWindow(jaipurEvents(view), sequence).fresh.flatMap(jaipurCuesForEvent);
      cues.forEach((cue, index) => {
        if (index === 0) playCue(gameId, cue);
        else cueTimers.current.push(window.setTimeout(() => playCue(gameId, cue), index * 115));
      });
      return;
    }
    if (gameId === 'domino') {
      const previousResult = resultSignature(previous.view.result), nextResult = resultSignature(view.result);
      if (!previousResult && nextResult) {
        cueTimers.current.forEach(window.clearTimeout);
        cueTimers.current = [];
        if (transition) playCue(gameId, transition.cue);
        else playCue(gameId, resultForPlayer(gameId, view, playerId) === 'win' ? 'win' : 'lose');
        return;
      }
      const before = dominoEvents(previous.view);
      const beforeSequence = before.reduce((max, event) => Math.max(max, dominoSequence(event)), 0);
      const cues = dominoWindow(dominoEvents(view), beforeSequence).fresh.map(dominoCueForEvent).filter((cue): cue is AudioCue => cue !== null);
      cues.forEach((cue, index) => {
        if (index === 0) playCue(gameId, cue);
        else cueTimers.current.push(window.setTimeout(() => playCue(gameId, cue), index * 150));
      });
      return;
    }
    if (transition) playCue(gameId, transition.cue);
  }, [gameId, language, playerId, view]);

  const updatePreference = (change: Partial<AudioPreferences>) => {
    const next = setPreferences(gameId, change);
    setPreferenceState({ gameId, value: next });
  };
  const openSettings = () => {
    setSettingsOpen(value => !value);
    if (gameId !== 'rhythm') void unlock();
  };
  const rhythm = gameId === 'rhythm';

  return <div className="game-feedback" data-game-feedback>
    <div className="game-feedback-status" aria-live="polite" aria-atomic="true">
      {pending && <span className="game-feedback-pending"><i aria-hidden="true"/>{copy(language, '처리 중…', 'Procesando…')}</span>}
      {announcement && <span key={announcement} className="game-feedback-event">{announcement}</span>}
    </div>
    <button className="game-sound-trigger" type="button" aria-expanded={settingsOpen} aria-controls="game-sound-settings" onClick={openSettings}>
      <span aria-hidden="true">♫</span>{copy(language, '게임 효과음', 'Efectos del juego')}
    </button>
    <section className="game-sound-settings" id="game-sound-settings" aria-label={copy(language, '게임 효과음', 'Efectos del juego')} hidden={!settingsOpen}>
      {rhythm ? <p className="game-sound-note">{copy(language, '리듬게임은 원작 플레이어의 음악을 사용해요. 앱 효과음은 재생되지 않아요.', 'Rhythm usa la música del reproductor original. La app no añade efectos.')}</p> : <>
        <label className="game-sound-toggle"><input type="checkbox" checked={preferences.sfxEnabled} onChange={event => updatePreference({ sfxEnabled: event.currentTarget.checked })}/><span>{copy(language, '효과음 사용', 'Activar efectos')}</span></label>
        <label className="game-sound-range"><span>{copy(language, '효과음 크기', 'Volumen de efectos')} <output>{Math.round(preferences.sfxVolume * 100)}%</output></span><input type="range" min="0" max="1" step="0.05" value={preferences.sfxVolume} disabled={!preferences.sfxEnabled} onChange={event => updatePreference({ sfxVolume: Number(event.currentTarget.value) })}/></label>
        <p className="game-sound-note">{copy(language, '효과음은 게임별로 이 브라우저에 저장돼요. 기본 설정은 꺼짐이에요.', 'Los efectos se guardan por juego en este navegador. Empiezan apagados.')}</p>
      </>}
    </section>
  </div>;
}
