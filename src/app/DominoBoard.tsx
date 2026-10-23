import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameAction, Language, PlayerId } from '../core/types';
import { playCue } from '../audio/audio';
import { dominoTileKeys, orderDominoChain, previewDominoPlacement } from './domino-chain';
import { DominoEventStage } from './DominoEventStage';
import { DominoTile } from './DominoTile';
import '../styles/domino-premium.css';

type AnyRecord = Record<string, any>;
type Choice = { label?: Record<Language, string>; action: GameAction };
type Props = { view: any; language: Language; playerId: PlayerId; runAction: (action: GameAction) => void | Promise<unknown> };
type Side = 'left' | 'right';
type Seat = PlayerId | 'b1' | 'b2';
type Mode = '1v1' | 'partners' | 'humans-vs-bots';
type Configuration = { mode: Mode; difficulty: 'easy' | 'normal' | 'hard'; targetScore: 0 | 100 | 200; capicuaBonus: 0 | 25 | 30; pasoCorridoBonus: 0 | 25; tranqueRule: 'team' | 'lowest-player' | 'trancador' };

const copy = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;
const record = (value: unknown): AnyRecord => value && typeof value === 'object' && !Array.isArray(value) ? value as AnyRecord : {};
const list = (value: unknown): any[] => Array.isArray(value) ? value : [];
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const MODES: Mode[] = ['1v1', 'partners', 'humans-vs-bots'];
const DEFAULT_CONFIG: Configuration = { mode: '1v1', difficulty: 'normal', targetScore: 0, capicuaBonus: 0, pasoCorridoBonus: 0, tranqueRule: 'team' };
export function dominoPlacementsFor(choices: readonly Choice[], index: number): Choice[] {
  return choices.filter(choice => choice.action.type === 'play' && choice.action.payload?.index === index && (choice.action.payload?.side === 'left' || choice.action.payload?.side === 'right'));
}
export function dominoChoiceForTile(hand: AnyRecord[], choices: readonly Choice[], key: string, side: Side): Choice | null {
  const index = dominoTileKeys(hand).indexOf(key);
  return index < 0 ? null : dominoPlacementsFor(choices, index).find(choice => choice.action.payload?.side === side) ?? null;
}
export function dominoOpeningChoice(choices: readonly Choice[]): Choice | null {
  return choices.find(choice => choice.action.type === 'play' && Number.isInteger(choice.action.payload?.index) && choice.action.payload?.side === 'left') ?? null;
}
export function dominoUnavailableEndReason(language: Language, end: number): string {
  return copy(language, `선택한 타일은 ${end}에 맞지 않아요`, `La ficha seleccionada no coincide con ${end}`);
}
function seatLabel(seat: Seat, playerId: PlayerId, mode: Mode, language: Language) {
  if (seat === playerId) return copy(language, '나', 'Tú');
  if (seat === 'b1' || seat === 'b2') return copy(language, 'AI 봇', 'IA');
  if (mode === 'humans-vs-bots') return copy(language, '사람 팀원', 'Compañero');
  return copy(language, '상대', 'Rival');
}
function teamName(team: PlayerId, mode: Mode, language: Language, playerId: PlayerId) {
  if (mode === 'humans-vs-bots') {
    const humanTeam: PlayerId = playerId === 'p1' || playerId === 'p2' ? 'p1' : 'p1';
    return team === humanTeam ? copy(language, '사람 팀', 'Equipo humano') : copy(language, '봇 팀', 'Equipo de IA');
  }
  if (team === playerId) return copy(language, '내 팀', 'Tu equipo');
  return copy(language, mode === 'partners' ? '상대 팀' : '상대', mode === 'partners' ? 'Rivales' : 'Rival');
}

function Tile({ tile, className = '', label, sequence, previewSide }: { tile: AnyRecord; className?: string; label?: string; sequence?: number; previewSide?: Side }) {
  const a = number(tile.a), b = number(tile.b);
  return <span className={`dp-tile ${className}`} data-sequence={sequence} data-domino-a={a} data-domino-b={b} data-domino-actor={tile.by} data-domino-preview-side={previewSide} aria-label={label ?? `${a} | ${b}`}>
    <DominoTile left={a} right={b} vertical={className.includes('is-double')}/>
  </span>;
}

export default function DominoBoard({ view: rawView, language, playerId, runAction }: Props) {
  const view = record(rawView), board = record(view.board), rulesVersion = number(board.rulesVersion);
  const settings = { ...DEFAULT_CONFIG, ...record(view.settings) } as Configuration;
  const mode = (MODES.includes(view.mode) ? view.mode : settings.mode) as Mode;
  settings.mode = mode;
  if (rulesVersion === 2) Object.assign(settings, { targetScore: [100, 200].includes(settings.targetScore) ? settings.targetScore : 200, capicuaBonus: 30, pasoCorridoBonus: 0, tranqueRule: 'trancador' });
  const lisbeth = rulesVersion === 2;
  const ownTeam: PlayerId = mode === 'humans-vs-bots' ? 'p1' : playerId;
  const actions: Choice[] = list(view.actions), hand: AnyRecord[] = list(view.hand), tiles: AnyRecord[] = list(board.tiles);
  const seats: Seat[] = list(board.seats).filter((seat): seat is Seat => ['p1', 'p2', 'b1', 'b2'].includes(seat));
  const counts = record(board.counts), teams = record(board.teams), revealedHands = record(board.revealedHands);
  const log = list(view.log ?? board.actionLog);
  const latestSequence = number(log.at(-1)?.sequence);
  const lastTileSequence = number(log.filter(event => event.type === 'play').at(-1)?.sequence);
  const boardRef = useRef<HTMLElement>(null);
  const chainScrollRef = useRef<HTMLDivElement>(null);
  const focusAfterPlayRef = useRef<{ tileKey: string; identity: string } | null>(null);
  const setupButtonRef = useRef<HTMLButtonElement>(null);
  const setupFirstFieldRef = useRef<HTMLSelectElement>(null);
  const setupWasOpen = useRef(false);
  const observedTiles = useRef<{ identity: string; sequences: number[] } | null>(null);
  const ordered: { tile: AnyRecord; index: number }[] = useMemo(() => (orderDominoChain(tiles as AnyRecord[], board.ends ? record(board.ends) : null) as AnyRecord[]).map((tile: AnyRecord, index: number) => ({ tile, index })), [tiles, board.ends]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [config, setConfig] = useState<Configuration>(settings);
  const [setupOpen, setSetupOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const submitLockRef = useRef(false);
  const [actionError, setActionError] = useState('');
  const configureChoice = actions.find(item => item.action.type === 'configure');
  const legacyModeChoices = actions.filter(item => item.action.type === 'set-mode');
  const playChoices = actions.filter(item => item.action.type === 'play');
  const openingChoice = tiles.length === 0 ? dominoOpeningChoice(playChoices) : null;
  const passChoice = actions.find(item => item.action.type === 'pass');
  const nextRoundChoice = actions.find(item => item.action.type === 'next-round');
  const active = view.turn === playerId && view.phase !== 'finished' && view.phase !== 'round-over';
  const handKeys = dominoTileKeys(hand);
  const selectedIndex = selectedKey === null ? -1 : handKeys.indexOf(selectedKey);
  const selectedLegal = selectedIndex < 0 ? [] : dominoPlacementsFor(playChoices, selectedIndex);
  const roundResult = record(board.roundResult);
  const roundOver = view.phase === 'round-over' || view.phase === 'finished';
  const hasResult = Boolean(view.result);
  const seatsForTeam = (team: PlayerId) => Array.isArray(teams[team]) ? teams[team] as Seat[] : [team];
  const matchScores = record(board.matchScores);
  const roundBonuses = record(board.roundBonuses);
  const pendingBonusTeams = (['p1', 'p2'] as const).filter(team => number(roundBonuses[team]) > 0);
  const revealed = roundOver && Object.keys(revealedHands).length > 0;
  const showResult = roundOver && (hasResult || Boolean(board.roundResult));
  const resultWinner = (hasResult ? view.result?.winner : roundResult.winner) as PlayerId | 'draw' | undefined;
  const resultPips = record(roundResult.pips ?? view.result?.scores);
  const resultReason = String(view.result?.reason ?? roundResult.reason ?? '');
  const localizedReason = resultReason.toLowerCase().includes('block') || resultReason.toLowerCase().includes('tranque')
    ? resultWinner === 'draw' ? copy(language, '판이 막혔고 남은 점수가 같아요.', 'El juego quedó bloqueado y los puntos restantes empataron.')
      : settings.tranqueRule === 'lowest-player'
        ? copy(language, '판이 막혔어요. 각 팀에서 손패 점수가 가장 낮은 사람을 비교했어요.', 'El juego quedó bloqueado. Se comparó a la persona con menos puntos de cada equipo.')
        : settings.tranqueRule === 'trancador'
          ? copy(language, '판이 막혔어요. 막은 사람과 다음 사람의 손패 점수를 비교했어요.', 'La mano se bloqueó. Se compararon los puntos de quien cerró y de quien seguía.')
        : copy(language, '판이 막혔어요. 남은 타일 점수가 낮은 팀이 이겨요.', 'El juego quedó bloqueado. Gana el equipo con menos puntos restantes.')
    : resultReason.toLowerCase().includes('target') ? copy(language, '매치 목표 점수에 도달했어요.', 'Se alcanzó la puntuación objetivo del partido.')
      : resultReason.toLowerCase().includes('all dominoes') || resultReason.toLowerCase().includes('played all') ? copy(language, '손패를 먼저 비워 이겼어요.', 'Ganó quien se quedó sin fichas primero.') : '';
  const targetScore = number(settings.targetScore);
  const canConfigure = Boolean(configureChoice || legacyModeChoices.length) && !tiles.length && number(view.round) <= 1 && !roundOver;
  const statusText = view.phase === 'finished'
    ? copy(language, '매치가 끝났어요', 'Partida terminada')
    : view.phase === 'round-over'
      ? copy(language, '라운드 정산이 끝났어요 · 결과를 확인하세요', 'Ronda contabilizada · revisa el resultado')
      : active
        ? copy(language, '놓을 타일을 선택하세요', 'Elige una ficha para jugar')
        : view.status === 'bot-turn'
          ? copy(language, '봇이 수를 두고 있어요', 'La IA está jugando')
          : mode === 'humans-vs-bots' && (view.turn === 'p1' || view.turn === 'p2')
            ? copy(language, '팀원 차례예요', 'Turno de tu compañero')
            : copy(language, '상대의 차례예요', 'Turno de tu rival');
  const waitingOnSeat = !active && !roundOver && seats.includes(view.turn as Seat)
    ? seatLabel(view.turn as Seat, playerId, mode, language)
    : '';

  useEffect(() => { setConfig(settings); }, [settings.mode, settings.difficulty, settings.targetScore, settings.capicuaBonus, settings.pasoCorridoBonus, settings.tranqueRule]);
  const gameIdentity = `${view.roomId ?? view.room ?? ''}:${playerId}:${number(view.round) || 1}:${mode}`;
  useEffect(() => { if (selectedKey !== null && !handKeys.includes(selectedKey)) setSelectedKey(null); }, [selectedKey, handKeys.join(',')]);
  useEffect(() => { setSelectedKey(null); }, [gameIdentity]);
  useEffect(() => {
    const pending = focusAfterPlayRef.current;
    if (!pending || busy) return;
    if (pending.identity !== gameIdentity) { focusAfterPlayRef.current = null; return; }
    if (handKeys.includes(pending.tileKey)) return;
    focusAfterPlayRef.current = null;
    const nextHandTile = boardRef.current?.querySelector<HTMLButtonElement>('.dp-hand-tile:not(:disabled)');
    (nextHandTile ?? chainScrollRef.current)?.focus();
  }, [busy, gameIdentity, handKeys.join(',')]);
  useEffect(() => {
    if (!setupOpen) return;
    const dialog = document.querySelector<HTMLElement>('.dp-setup-dialog');
    (setupFirstFieldRef.current ?? dialog?.querySelector<HTMLElement>('button:not(:disabled),select:not(:disabled)'))?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setSetupOpen(false); }
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled),select:not(:disabled)')];
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    dialog?.addEventListener('keydown', onKeyDown);
    return () => dialog?.removeEventListener('keydown', onKeyDown);
  }, [setupOpen]);
  useEffect(() => {
    if (setupOpen) { setupWasOpen.current = true; return; }
    if (setupWasOpen.current) { setupWasOpen.current = false; setupButtonRef.current?.focus(); }
  }, [setupOpen]);
  const tileSequenceSignature = tiles.map(tile => number(tile.sequence)).join(',');
  useEffect(() => {
    const sequences = tiles.map(tile => number(tile.sequence)).filter(sequence => Number.isSafeInteger(sequence) && sequence > 0);
    const previous = observedTiles.current;
    if (!previous || previous.identity !== gameIdentity) {
      observedTiles.current = { identity: gameIdentity, sequences };
      return;
    }
    observedTiles.current = { identity: gameIdentity, sequences };
    const latest = sequences.filter(sequence => !previous.sequences.includes(sequence)).at(-1);
    if (!latest) return;
    const pane = chainScrollRef.current;
    const tile = pane?.querySelector<HTMLElement>(`[data-sequence="${latest}"]`);
    if (!pane || !tile) return;
    const paneBounds = pane.getBoundingClientRect(), tileBounds = tile.getBoundingClientRect();
    const shift = tileBounds.right > paneBounds.right ? tileBounds.right - paneBounds.right : tileBounds.left < paneBounds.left ? tileBounds.left - paneBounds.left : 0;
    if (shift) pane.scrollTo({ left: pane.scrollLeft + shift, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  // Observe only the compact public sequence list instead of fresh snapshot objects.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameIdentity, tileSequenceSignature]);

  const submit = async (action: GameAction, keepKeyboardFocus = false): Promise<boolean> => {
    if (busy || submitLockRef.current) return false;
    const playedTileKey = action.type === 'play' ? selectedKey : null;
    if (action.type === 'play') {
      const choice = selectedKey === null || (action.payload?.side !== 'left' && action.payload?.side !== 'right') ? null : dominoChoiceForTile(hand, playChoices, selectedKey, action.payload.side);
      if (!active || !choice) return false;
      action = choice.action;
    }
    submitLockRef.current = true;
    setBusy(true); setActionError('');
    try {
      const result = await runAction(action);
      if (result === false) return false;
      if (action.type === 'play') {
        if (keepKeyboardFocus && playedTileKey) focusAfterPlayRef.current = { tileKey: playedTileKey, identity: gameIdentity };
        setSelectedKey(null);
      }
      return true;
    } catch {
      setActionError(copy(language, '연결을 확인하고 다시 시도해 주세요.', 'Revisa la conexión e inténtalo otra vez.'));
      return false;
    } finally { submitLockRef.current = false; setBusy(false); }
  };
  const selectTile = (index: number) => {
    if (!active || busy) return;
    const key = handKeys[index];
    setSelectedKey(current => current === key ? null : key);
    setActionError('');
    playCue('domino', 'select');
  };
  const place = (side: Side, keepKeyboardFocus = false) => {
    const choice = selectedKey === null ? null : dominoChoiceForTile(hand, playChoices, selectedKey, side);
    if (choice && active && !busy) void submit(choice.action, keepKeyboardFocus);
  };
  const applyConfig = async () => {
    if (!configureChoice || busy) return;
    if (await submit({ ...configureChoice.action, payload: { ...record(configureChoice.action.payload), ...config } })) setSetupOpen(false);
  };
  const modeLabel = (value: Mode) => value === '1v1'
    ? copy(language, '1대1', '1 contra 1')
    : value === 'partners'
      ? copy(language, '사람-봇 팀전', 'Equipos mixtos')
      : copy(language, '사람 2명 대 봇 2명', 'Dos personas contra dos bots');
  const moneyOrScore = (value: unknown) => number(value).toLocaleString(language === 'ko' ? 'ko-KR' : 'es-DO');
  const update = <K extends keyof Configuration>(key: K, value: Configuration[K]) => setConfig(current => ({ ...current, [key]: value }));
  const updateMode = (value: Mode) => setConfig(current => ({ ...current, mode: value, ...(lisbeth ? { targetScore: 200, capicuaBonus: 30, pasoCorridoBonus: 0, tranqueRule: 'trancador' as const } : {}) }));

  return <section ref={boardRef} className="domino-premium" data-game="domino" data-mode={mode} data-domino-game-identity={gameIdentity} aria-label={copy(language, '도미노 게임 보드', 'Mesa de dominó')} onKeyDown={event => {
    const endpoint = event.target instanceof Element && event.target.closest('.dp-end-target, .dp-start-target');
    if (endpoint && event.repeat && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); return; }
    if (event.key === 'Escape' && selectedKey !== null && !(event.target instanceof Element && event.target.closest('.dp-setup-dialog'))) {
      event.preventDefault();
      const selectedTile = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('.dp-hand-tile')].find(button => button.dataset.dominoTileKey === selectedKey);
      setSelectedKey(null);
      (selectedTile ?? chainScrollRef.current)?.focus();
    }
  }}>
    <header className="dp-header">
      <div>
        <p className="dp-kicker">{copy(language, '더블 식스 · 블록 도미노', 'Doble seis · dominó bloqueado')}</p>
        <h2>{copy(language, '도미노', 'Dominó')}</h2>
        <p className="dp-status" aria-live="polite">{statusText}</p>
      </div>
      <div className="dp-round-chip"><span>{copy(language, '라운드', 'Ronda')}</span><b>{number(view.round) || 1}</b></div>
      {canConfigure && <button ref={setupButtonRef} type="button" className="dp-settings-launcher" aria-haspopup="dialog" aria-expanded={setupOpen} onClick={() => setSetupOpen(true)}>{copy(language, '게임 설정', 'Ajustes de juego')}</button>}
    </header>

    <section className="dp-scoreboard" aria-label={copy(language, '팀 점수', 'Puntuación por equipo')}>
      {(['p1', 'p2'] as const).map(team => {
        const teamSeats = seatsForTeam(team);
        const side = team === playerId || teamSeats.includes(playerId) ? 'own' : 'other';
        return <article className={`dp-score ${side === 'own' ? 'is-own' : ''}`} key={team}>
          <div className="dp-score-heading"><span className={`dp-team-mark dp-mark-${team}`} aria-hidden="true"/><div><b>{teamName(team, mode, language, playerId)}</b><small>{teamSeats.map(seat => seatLabel(seat, playerId, mode, language)).join(' · ')}</small></div></div>
          {targetScore > 0 ? <strong className="dp-score-number">{moneyOrScore(matchScores[team])}<small> / {targetScore}</small></strong> : <span className="dp-score-note">{revealed || hasResult ? copy(language, '이번 판 점수 공개', 'Puntos de la ronda visibles') : copy(language, '라운드 종료 후 공개', 'Se muestran al final')}</span>}
        </article>;
      })}
    </section>
    {pendingBonusTeams.length > 0 && !roundOver && <div className="dp-pending-bonuses" aria-label={copy(language, '아직 정산되지 않은 보너스', 'Bonos pendientes de liquidar')}>
      <span>{copy(language, '라운드 종료 때 정산', 'Se suman al cerrar la ronda')}</span>
      {pendingBonusTeams.map(team => <b key={team}>{teamName(team, mode, language, playerId)} +{moneyOrScore(roundBonuses[team])}</b>)}
    </div>}

    {!canConfigure && <details className="dp-settings-readout">
      <summary>{copy(language, '플레이 설정 보기', 'Ver ajustes de juego')}</summary>
      <div><span>{modeLabel(mode)}</span>{mode !== '1v1' && <span>{copy(language, '봇', 'IA')}: {settings.difficulty === 'easy' ? copy(language, '편안하게', 'Tranquilo') : settings.difficulty === 'hard' ? copy(language, '도전', 'Difícil') : copy(language, '보통', 'Normal')}</span>}
        <span>{copy(language, '매치 목표', 'Objetivo')}: {settings.targetScore ? settings.targetScore : copy(language, '한 라운드', 'Una ronda')}</span>
        {lisbeth ? <span>{copy(language, '카피쿠아 +30 · 파소 코리도 없음 · 트랑카도르 규칙', 'Capicúa +30 · sin paso corrido · regla de trancador')}</span> : <>
          {settings.capicuaBonus > 0 && <span>{copy(language, '카피쿠아', 'Capicúa')} +{settings.capicuaBonus}</span>}
          {settings.pasoCorridoBonus > 0 && <span>{copy(language, '파소 코리도', 'Paso corrido')} +{settings.pasoCorridoBonus}</span>}
          {settings.tranqueRule === 'lowest-player' && <span>{copy(language, '막힌 판: 개인별 점수', 'Tranque: menor total individual')}</span>}
        </>}
      </div>
    </details>}

    <div className="dp-table">
    <div className="dp-seat-row" aria-label={copy(language, '각 좌석의 남은 타일', 'Fichas restantes por asiento')}>
      {seats.map(seat => {
        const isTurn = view.turn === seat && !roundOver;
        const ownSeat = seat === playerId;
        const seatTeam = (['p1', 'p2'] as const).find(team => seatsForTeam(team).includes(seat));
        const seatTiles: AnyRecord[] | undefined = revealed ? list(revealedHands[seat]) : undefined;
        return <article key={seat} className={`dp-seat ${isTurn ? 'is-turn' : ''} ${ownSeat ? 'is-you' : ''}`} data-domino-seat={seat} aria-current={isTurn ? 'step' : undefined}>
          <div className="dp-seat-top"><b>{seatLabel(seat, playerId, mode, language)}</b><span>{seatTeam ? teamName(seatTeam, mode, language, playerId) : ''}</span></div>
          <div className="dp-seat-count"><strong>{seatTiles ? seatTiles.length : number(counts[seat])}</strong><span>{copy(language, '타일', 'fichas')}</span></div>
          {seatTiles ? <div className="dp-revealed-hand" data-domino-revealed-seat={seat} aria-label={copy(language, `${seatLabel(seat, playerId, mode, language)}의 공개된 손패`, `Mano revelada de ${seatLabel(seat, playerId, mode, language)}`)}>{seatTiles.map((tile, index) => <Tile key={`${tile.a}-${tile.b}-${index}`} tile={tile} className="is-mini"/>)}</div> : !ownSeat && <div className="dp-backs" aria-label={copy(language, `${number(counts[seat])}개의 숨겨진 타일`, `${number(counts[seat])} fichas ocultas`)}>{Array.from({ length: Math.min(number(counts[seat]), 5) }, (_, index) => <span className="dp-back" key={index}><DominoTile left={0} right={0} back label={copy(language, '숨겨진 도미노 타일', 'Ficha de dominó oculta')}/></span>)}</div>}
          {ownSeat && !revealed && <small className="dp-private-note">{copy(language, '내 손패', 'Tu mano')}</small>}
        </article>;
      })}
    </div>

    <section className="dp-felt" aria-label={copy(language, '공개된 도미노 줄', 'Cadena pública de dominó')}>
      <div className="dp-felt-inset" aria-hidden="true"/>
      {tiles.length === 0 ? <div className="dp-chain-empty"><span className="dp-empty-seal">28</span><b>{copy(language, '첫 타일을 놓으면 줄이 시작돼요', 'La cadena empieza con la primera ficha')}</b><small>{copy(language, '시작 타일을 손패에서 선택해 주세요.', 'Elige la ficha inicial en tu mano.')}</small>{openingChoice && selectedIndex === number(openingChoice.action.payload?.index) && <><Tile tile={hand[selectedIndex]} className={`is-preview ${hand[selectedIndex]?.a === hand[selectedIndex]?.b ? 'is-double' : ''}`} label={`${hand[selectedIndex]?.a} | ${hand[selectedIndex]?.b}`} /><button className="dp-start-target" type="button" disabled={busy} onClick={event => void submit(openingChoice.action, event.detail === 0)} aria-label={copy(language, `첫 타일 ${hand[selectedIndex]?.a}|${hand[selectedIndex]?.b} 놓기`, `Jugar la ficha inicial ${hand[selectedIndex]?.a}|${hand[selectedIndex]?.b}`)}>{copy(language, `시작 타일 ${hand[selectedIndex]?.a}|${hand[selectedIndex]?.b} 놓기`, `Jugar ficha inicial ${hand[selectedIndex]?.a}|${hand[selectedIndex]?.b}`)}</button></>}</div> : <div className="dp-chain-scroll" ref={chainScrollRef} tabIndex={-1} role="list" aria-label={copy(language, '도미노 줄 · 가로로 이동할 수 있어요', 'Cadena de dominó · desplázate horizontalmente')}>
        <div className="dp-chain" role="presentation">
          {ordered.map(({ tile, index }) => {
            const eventSequence = number(tile.sequence) || (index + 1);
            const classes = `is-chain ${tile.a === tile.b ? 'is-double' : ''} ${eventSequence === lastTileSequence ? 'is-latest' : ''}`;
            return <Tile key={`${eventSequence}-${tile.by ?? 'tile'}-${tile.a}-${tile.b}`} sequence={eventSequence} tile={tile} className={classes} label={`${tile.a} | ${tile.b}`}/>;
          })}
        </div>
      </div>}
      {tiles.length > 0 && <div className="dp-end-docks" aria-label={copy(language, '놓을 끝 선택', 'Elige un extremo para colocar')}>
        {(['left', 'right'] as const).map(side => {
          const end = number(record(board.ends)[side]);
          const choice = selectedLegal.find(item => item.action.payload?.side === side);
          const preview = choice && selectedIndex >= 0 ? previewDominoPlacement(hand[selectedIndex], side, record(board.ends)) : null;
          const unavailableReason = selectedKey !== null && selectedIndex >= 0 && selectedLegal.length > 0 && !choice ? dominoUnavailableEndReason(language, end) : '';
          return <button key={side} className={`dp-end-target dp-end-${side}`} data-domino-side={side} type="button" disabled={!choice || busy} aria-disabled={!choice || busy} onClick={event => place(side, event.detail === 0)} aria-label={copy(language, `${side === 'left' ? '왼쪽' : '오른쪽'} 끝 ${end}${preview ? `에 놓기 · 새 끝 ${side === 'left' ? preview.left : preview.right}` : unavailableReason ? ` · ${unavailableReason}` : ''}`, `Extremo ${side === 'left' ? 'izquierdo' : 'derecho'} ${end}${preview ? ` · nuevo extremo ${side === 'left' ? preview.left : preview.right}` : unavailableReason ? ` · ${unavailableReason}` : ''}`)}>
            <span className="dp-end-match">{copy(language, side === 'left' ? '왼쪽' : '오른쪽', side === 'left' ? 'Izq.' : 'Der.')} · {end}</span>
            {preview && <><Tile tile={preview} previewSide={side} className={`is-preview ${preview.a === preview.b ? 'is-double' : ''} ${side === 'left' ? 'preview-left' : 'preview-right'}`} label={`${preview.a} | ${preview.b}`} /><span className="dp-end-preview">{copy(language, '새 끝', 'Nuevo extremo')} {side === 'left' ? preview.left : preview.right}</span></>}
            {unavailableReason && <span className="dp-end-unavailable">{unavailableReason}</span>}
          </button>;
        })}
      </div>}
      {tiles.length > 0 && <div className="dp-open-ends" aria-live="polite"><span>{copy(language, '열린 끝', 'Extremos')}</span><b>{number(record(board.ends).left)}</b><i aria-hidden="true"/><b>{number(record(board.ends).right)}</b></div>}
    </section>

    <section className="dp-play-area">
      <div className={`dp-play-copy ${active ? 'is-active' : 'is-waiting'}`}><span className={`dp-turn-light ${active ? 'is-active' : ''}`} aria-hidden="true"/><div><h3>{active ? copy(language, '내 손패', 'Tu mano') : waitingOnSeat ? copy(language, `${waitingOnSeat} 차례 · 타일 선택`, `${waitingOnSeat} juega ahora`) : copy(language, '도미노 테이블', 'Mesa de dominó')}</h3><p>{active ? copy(language, '타일을 고른 다음 열린 끝을 확인하세요.', 'Elige una ficha y revisa los extremos disponibles.') : waitingOnSeat ? copy(language, `${waitingOnSeat}가 타일을 고르고 있어요. 놓인 끝을 확인하세요.`, `${waitingOnSeat} elige una ficha. Revisa los extremos abiertos.`) : statusText}</p></div></div>
      <div className="dp-hand" aria-label={copy(language, '내 도미노 타일', 'Tus fichas de dominó')}>
        {hand.map((tile, index) => {
          const legal = playChoices.some(choice => number(choice.action.payload?.index) === index);
          const selected = selectedIndex === index;
          return <button key={`${tile.a}-${tile.b}-${index}`} type="button" className={`dp-hand-tile ${selected ? 'is-selected' : ''} ${legal ? 'is-playable' : ''}`} data-domino-tile-key={handKeys[index]} data-domino-index={index} data-domino-a={tile.a} data-domino-b={tile.b} aria-pressed={selected} aria-label={copy(language, `내 타일 ${tile.a}와 ${tile.b}${legal ? ', 놓을 수 있음' : ''}`, `Tu ficha ${tile.a} y ${tile.b}${legal ? ', disponible para jugar' : ''}`)} disabled={!active || busy || !legal} onClick={() => selectTile(index)}>
            <DominoTile left={number(tile.a)} right={number(tile.b)}/>
          </button>;
        })}
      </div>
      {active && !selectedLegal.length && passChoice && <button type="button" className="dp-pass" disabled={busy} onClick={() => void submit(passChoice.action)}>{busy ? copy(language, '전달 중…', 'Enviando…') : copy(language, '놓을 수 없어요 · 패스', 'No puedes jugar · pasar')}</button>}
      {active && selectedKey !== null && <p className="dp-selection-help" aria-live="polite">{selectedLegal.length ? copy(language, '끝의 미리보기를 확인하고 놓을 위치를 선택하세요. Esc로 취소할 수 있어요.', 'Revisa la ficha previa y elige dónde colocarla. Pulsa Esc para cancelar.') : copy(language, '이 타일은 지금 놓을 수 없어요.', 'Esta ficha no se puede jugar ahora.')}</p>}
      {actionError && <p className="dp-error" role="alert">{actionError}</p>}
    </section>
    </div>

    <DominoEventStage events={log} language={language} playerId={playerId} ownTeam={ownTeam} identity={gameIdentity} mode={mode}/>

    {canConfigure && setupOpen && <div className="dp-setup-dialog" role="dialog" aria-modal="true" aria-labelledby="dp-setup-title" onMouseDown={event => { if (event.target === event.currentTarget) setSetupOpen(false); }}>
      <section className="dp-setup" aria-label={copy(language, '게임 설정', 'Configuración de la partida')}>
      <div className="dp-section-heading"><div><p>{copy(language, '시작 전 설정', 'Antes de empezar')}</p><h3 id="dp-setup-title">{copy(language, '테이블 설정', 'Ajustes de mesa')}</h3></div><button type="button" className="dp-modal-close" onClick={() => setSetupOpen(false)}>{copy(language, '닫기', 'Cerrar')}</button></div>
      {configureChoice && <div className="dp-config-grid">
        <label><span>{copy(language, '플레이 방식', 'Modo')}</span><select ref={setupFirstFieldRef} value={config.mode} onChange={event => updateMode(event.target.value as Mode)} disabled={busy}>{MODES.map(value => <option value={value} key={value}>{modeLabel(value)}</option>)}</select></label>
        <label><span>{copy(language, '봇 난이도', 'Nivel de IA')}</span><select value={config.difficulty} onChange={event => update('difficulty', event.target.value as Configuration['difficulty'])} disabled={busy}>{(['easy', 'normal', 'hard'] as const).map(value => <option key={value} value={value}>{value === 'easy' ? copy(language, '편안하게', 'Tranquilo') : value === 'normal' ? copy(language, '보통', 'Normal') : copy(language, '도전', 'Difícil')}</option>)}</select></label>
        <label><span>{copy(language, '매치 목표 점수', 'Puntuación objetivo')}</span><select value={config.targetScore} onChange={event => update('targetScore', Number(event.target.value) as Configuration['targetScore'])} disabled={busy}>{(lisbeth ? [100, 200] as const : [0, 100, 200] as const).map(value => <option key={value} value={value}>{value ? `${value}` : copy(language, '한 라운드', 'Una ronda')}</option>)}</select></label>
        {lisbeth ? <p className="dp-config-note">{copy(language, 'Lisbeth 규칙 · 카피쿠아 +30 · 파소 코리도 없음 · 트랑카도르 판정', 'Reglas Lisbeth · capicúa +30 · sin paso corrido · tranque por trancador')}</p> : <>
          <label><span>{copy(language, '카피쿠아 보너스', 'Bono capicúa')}</span><select value={config.capicuaBonus} onChange={event => update('capicuaBonus', Number(event.target.value) as Configuration['capicuaBonus'])} disabled={busy}>{([0, 25] as const).map(value => <option key={value} value={value}>{value ? `+${value}` : copy(language, '사용 안 함', 'Sin bono')}</option>)}</select></label>
          <label><span>{copy(language, '파소 코리도', 'Paso corrido')}</span><select value={config.pasoCorridoBonus} onChange={event => update('pasoCorridoBonus', Number(event.target.value) as Configuration['pasoCorridoBonus'])} disabled={busy}>{([0, 25] as const).map(value => <option key={value} value={value}>{value ? `+${value}` : copy(language, '사용 안 함', 'Sin bono')}</option>)}</select></label>
          <label><span>{copy(language, '막힌 판 규칙', 'Desempate en tranque')}</span><select value={config.tranqueRule} onChange={event => update('tranqueRule', event.target.value as Configuration['tranqueRule'])} disabled={busy}><option value="team">{copy(language, '팀 손패 합계', 'Total del equipo')}</option><option value="lowest-player">{copy(language, '개인 손패 합계', 'Menor total individual')}</option></select></label>
        </>}
      </div>}
      {configureChoice ? <button type="button" className="dp-primary" disabled={busy} onClick={applyConfig}>{busy ? copy(language, '적용 중…', 'Aplicando…') : copy(language, '설정 적용', 'Aplicar ajustes')}</button> : <div className="dp-legacy-modes">{legacyModeChoices.map(choice => <button type="button" key={String(choice.action.payload?.mode)} disabled={busy} onClick={async () => { if (await submit(choice.action)) setSetupOpen(false); }}>{choice.action.payload?.mode === 'partners' ? modeLabel('partners') : modeLabel('humans-vs-bots')}</button>)}</div>}
      </section>
    </div>}

    <div className="dp-ledger-row">
      <section className="dp-ledger"><h3>{copy(language, targetScore ? '매치 점수' : '이번 라운드', targetScore ? 'Marcador del partido' : 'Esta ronda')}</h3><div className="dp-ledger-values">{(['p1', 'p2'] as const).map(team => <div key={team}><span>{teamName(team, mode, language, playerId)}</span><b>{targetScore ? moneyOrScore(matchScores[team]) : revealed || hasResult ? moneyOrScore(resultPips[team]) : '—'}</b></div>)}</div>{!revealed && !hasResult && !targetScore && <small>{copy(language, '손패 점수는 라운드가 끝날 때 공개돼요.', 'Los puntos de las manos se revelan al terminar la ronda.')}</small>}</section>
      {showResult && <section className="dp-round-result" data-outcome={resultWinner === ownTeam ? 'win' : resultWinner === 'draw' ? 'draw' : 'lose'}>
        <div><span>{copy(language, hasResult ? '매치 결과' : `라운드 ${number(roundResult.round) || number(view.round) || 1} 결과`, hasResult ? 'Resultado del partido' : `Resultado de la ronda ${number(roundResult.round) || number(view.round) || 1}`)}</span><b>{resultWinner === 'draw' ? copy(language, '무승부', 'Empate') : resultWinner === ownTeam ? copy(language, '내 팀 승리', '¡Ganó tu equipo!') : copy(language, '상대 팀 승리', 'Ganó el otro equipo')}</b></div>
        {Object.keys(resultPips).length > 0 && <p>{copy(language, `남은 점수 ${moneyOrScore(resultPips.p1)} 대 ${moneyOrScore(resultPips.p2)}${roundResult.award !== undefined ? ` · 이번 점수 ${moneyOrScore(roundResult.award)}` : ''}`, `Puntos restantes ${moneyOrScore(resultPips.p1)} a ${moneyOrScore(resultPips.p2)}${roundResult.award !== undefined ? ` · premio ${moneyOrScore(roundResult.award)}` : ''}`)}</p>}
        {record(roundResult.scoreDelta).p1 !== undefined && <p className="dp-settled-delta">{copy(language, `정산 점수: ${teamName('p1', mode, language, playerId)} +${moneyOrScore(record(roundResult.scoreDelta).p1)} · ${teamName('p2', mode, language, playerId)} +${moneyOrScore(record(roundResult.scoreDelta).p2)}`, `Puntos liquidados: ${teamName('p1', mode, language, playerId)} +${moneyOrScore(record(roundResult.scoreDelta).p1)} · ${teamName('p2', mode, language, playerId)} +${moneyOrScore(record(roundResult.scoreDelta).p2)}`)}</p>}
        {localizedReason && <p className="dp-result-reason">{localizedReason}</p>}
        {Boolean(roundResult.capicua) && <small>{copy(language, settings.capicuaBonus > 0 ? `카피쿠아 성립 · 보너스 +${settings.capicuaBonus}` : '카피쿠아 성립 · 추가 점수 없음', settings.capicuaBonus > 0 ? `Capicúa · bono +${settings.capicuaBonus}` : 'Capicúa sin bono')}</small>}
        {lisbeth && number(roundResult.openingPass) > 0 && <small>{copy(language, `오프닝 패스 보너스 +${moneyOrScore(roundResult.openingPass)} 포함`, `Incluye bono de pase inicial +${moneyOrScore(roundResult.openingPass)}`)}</small>}
        {!lisbeth && number(roundResult.pasoCorrido) > 0 && <small>{copy(language, '파소 코리도 보너스 포함', 'Incluye bono de paso corrido')}</small>}
        {nextRoundChoice && <button type="button" className="dp-primary" disabled={busy} onClick={() => void submit(nextRoundChoice.action)}>{copy(language, '다음 라운드', 'Siguiente ronda')}</button>}
      </section>}
    </div>
    {latestSequence > 0 && <span className="dp-sr-only">{copy(language, `최근 공개 기록 ${latestSequence}`, `Último registro público ${latestSequence}`)}</span>}
  </section>;
}
