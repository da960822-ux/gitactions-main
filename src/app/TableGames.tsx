import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { GameAction, Language, PlayerId } from '../core/types';
import { GameValue } from './GameValue';
import DaVinciTable from './DaVinciTable';
import { JaipurBoard } from './JaipurBoard';
import splendorArt from '../../public/images/splendor/card-map.json';
import '../styles/game-design-system.css';
import '../styles/table-games.css';
import '../styles/splendor-premium.css';

type TableGameId = 'jaipur' | 'splendor' | 'davinci';
type Choice = { label: Record<Language, string>; action: GameAction };
type Props = { game: TableGameId; view: any; language: Language; playerId: PlayerId; runAction: (action: GameAction) => void };
type RecordValue = Record<string, any>;

const gems = ['white', 'blue', 'green', 'red', 'black', 'gold'] as const;
const colors = ['white', 'blue', 'green', 'red', 'black'] as const;
const splendorCardArtById = new Map(splendorArt.cards.map(card => [card.engineId, card.src]));
const splendorNobleArtById = new Map(splendorArt.nobles.map(noble => [noble.engineId, noble.src]));
export const splendorCardArtSrc = (id: unknown) => { const src = splendorCardArtById.get(String(id)); return src ? `/images/splendor/${src}` : null; };
export const splendorNobleArtSrc = (id: unknown) => { const src = splendorNobleArtById.get(String(id)); return src ? `/images/splendor/${src}` : null; };
const copy = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;
const record = (value: unknown): RecordValue => value && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : {};
const array = (value: unknown): any[] => Array.isArray(value) ? value : [];
const gemName = (gem: string, language: Language) => ({
  white: copy(language, '흰색', 'Blanca'), blue: copy(language, '파랑', 'Azul'),
  green: copy(language, '초록', 'Verde'), red: copy(language, '빨강', 'Roja'),
  black: copy(language, '검정', 'Negra'), gold: copy(language, '황금', 'Comodín'),
}[gem] ?? gem);
const tokenReturnCount = (value: unknown) => Object.values(record(value)).reduce<number>((sum, count) => sum + Number(count ?? 0), 0);
export const splendorTotalAfterTake = (tokens: RecordValue, picked: number, returnTokens: unknown) =>
  gems.reduce((total, gem) => total + Number(tokens[gem] ?? 0), 0) + picked - tokenReturnCount(returnTokens);

export function TableGames(props: Props) {
  if (props.game === 'jaipur') return <JaipurBoard {...props}/>;
  if (props.game === 'splendor') return <SplendorTable {...props}/>;
  return <DaVinciTable {...props}/>;
}

type SplendorVisualEvent = {
  key: string;
  viewer: PlayerId;
  kind: 'result' | 'noble' | 'purchase' | 'reserve' | 'tokens' | 'market' | 'turn';
  marketArrivals: string[];
  reservedArrivals: string[];
  incomingTokens: string[];
  incomingCounts: Record<string, number>;
  bonusGem: string | null;
  turnChanged: boolean;
  nobleRecipient?: 'you' | 'rival' | 'unknown';
  nobleAwarded?: boolean;
  nobleId?: string;
  noblePoints?: number;
  purchasedCard?: { id: string; bonus: string; points: number; tier: number };
  result?: 'win' | 'lose' | 'draw';
};

const marketEntries = (view: any) => [1, 2, 3].flatMap(tier => array(record(view?.board?.market)[tier]).map((card, index) => ({ tier, index, id: String(card?.id ?? `${tier}-${index}`), card: record(card) })));
const gemCounts = (view: any) => record(view?.ownHand?.tokens);
const ownedBonuses = (view: any) => record(view?.ownHand?.bonuses);

export function deriveSplendorVisualEvent(previous: any, next: any, viewer: PlayerId): SplendorVisualEvent | null {
  if (!previous?.view || previous.viewer !== viewer) return null;
  const beforeMarket = marketEntries(previous.view), afterMarket = marketEntries(next);
  const beforeIds = new Set(beforeMarket.map(card => card.id));
  const afterIds = new Set(afterMarket.map(card => card.id));
  const marketArrivals = afterMarket.filter(card => !beforeIds.has(card.id)).map(card => card.id);
  const beforeReserved = array(previous.view?.ownHand?.reserved).map((card: any) => String(card?.id));
  const reservedArrivals = array(next?.ownHand?.reserved).map((card: any) => String(card?.id)).filter((id: string) => !beforeReserved.includes(id));
  const beforeTokens = gemCounts(previous.view), afterTokens = gemCounts(next);
  const incomingCounts = Object.fromEntries(gems.map(gem => [gem, Math.max(0, Number(afterTokens[gem] ?? 0) - Number(beforeTokens[gem] ?? 0))]));
  const incomingTokens = gems.filter(gem => Number(incomingCounts[gem] ?? 0) > 0);
  const beforeBonuses = ownedBonuses(previous.view), afterBonuses = ownedBonuses(next);
  const bonusGem = colors.find(gem => Number(afterBonuses[gem] ?? 0) > Number(beforeBonuses[gem] ?? 0)) ?? null;
  const beforeReservedCards = array(previous.view?.ownHand?.reserved), afterReservedIds = new Set(array(next?.ownHand?.reserved).map((card: any) => String(card?.id)));
  const removedMarketCards = beforeMarket.filter(entry => beforeIds.has(entry.id) && !afterIds.has(entry.id) && entry.card.bonus === bonusGem);
  const removedReservedCards = beforeReservedCards.filter((card: any) => !afterReservedIds.has(String(card?.id)) && card?.bonus === bonusGem);
  const purchasedRaw = bonusGem ? removedReservedCards.length === 1 ? removedReservedCards[0] : removedMarketCards.length === 1 ? removedMarketCards[0].card : null : null;
  const purchasedCard = purchasedRaw ? { id: String(purchasedRaw.id ?? 'purchased'), bonus: String(purchasedRaw.bonus ?? bonusGem), points: Number(purchasedRaw.points ?? 0), tier: Number(purchasedRaw.tier ?? 1) } : undefined;
  const beforeNobles = Number(previous.view?.ownHand?.nobles ?? 0), afterNobles = Number(next?.ownHand?.nobles ?? 0);
  const beforeNobleIds = Object.keys(record(previous.view?.board?.nobles));
  const afterNobleIds = Object.keys(record(next?.board?.nobles));
  const nobleLeftMarket = beforeNobleIds.some(id => !afterNobleIds.includes(id));
  const nobleId = beforeNobleIds.find(id => !afterNobleIds.includes(id));
  const nobleData = nobleId ? record(record(previous.view?.board?.nobles)[nobleId]) : {};
  const rivalSeat = viewer === 'p1' ? 'p2' : 'p1';
  const beforeRivalNobles = Number(record(previous.view?.board?.ownedNobles)[rivalSeat] ?? 0);
  const afterRivalNobles = Number(record(next?.board?.ownedNobles)[rivalSeat] ?? 0);
  const turnChanged = previous.view?.turn !== next?.turn;
  const hadResult = !!previous.view?.result, hasResult = !!next?.result;
  let kind: SplendorVisualEvent['kind'] | null = null;
  let result: SplendorVisualEvent['result'];
  if (!hadResult && hasResult) {
    kind = 'result';
    result = next.result.winner === 'draw' ? 'draw' : next.result.winner === viewer ? 'win' : 'lose';
  } else if (afterNobles > beforeNobles || afterRivalNobles > beforeRivalNobles || nobleLeftMarket) kind = 'noble';
  else if (bonusGem) kind = 'purchase';
  else if (reservedArrivals.length) kind = 'reserve';
  else if (incomingTokens.length) kind = 'tokens';
  else if (marketArrivals.length) kind = 'market';
  else if (turnChanged) kind = 'turn';
  if (!kind) return null;
  const nobleRecipient = afterNobles > beforeNobles ? 'you' : afterRivalNobles > beforeRivalNobles ? 'rival' : 'unknown';
  const signature = [kind, ...marketArrivals, ...reservedArrivals, ...incomingTokens.map(gem => `${gem}-${incomingCounts[gem]}`), bonusGem ?? '', purchasedCard?.id ?? '', beforeNobles, afterNobles, beforeRivalNobles, afterRivalNobles, record(next?.board?.turns).p1 ?? '', record(next?.board?.turns).p2 ?? '', next?.turn ?? '', result ?? ''].join(':');
  const nobleAwarded = afterNobles > beforeNobles || afterRivalNobles > beforeRivalNobles || nobleLeftMarket;
  return { key: `${viewer}:${signature}`, viewer, kind, marketArrivals, reservedArrivals, incomingTokens, incomingCounts, bonusGem, turnChanged, ...(purchasedCard ? { purchasedCard } : {}), ...(nobleAwarded ? { nobleAwarded, nobleRecipient, ...(nobleId ? { nobleId, noblePoints: Number(nobleData.points ?? 3) } : {}) } : {}), ...(result ? { result } : {}) };
}

function SplendorTable({ view, language, playerId, runAction }: Props) {
  const board = record(view?.board), hand = record(view?.ownHand), choices: Choice[] = array(view?.actions);
  const bank = record(board.bank), market = record(board.market), nobles = record(board.nobles), scores = record(board.score);
  const tokens = record(hand.tokens), owned = record(hand.bonuses), reserved = array(hand.reserved);
  const [picked, setPicked] = useState<string[]>([]), [returnChoice, setReturnChoice] = useState(0), [reserveChoices, setReserveChoices] = useState<Record<string, number>>({}), [doubleTakeChoice, setDoubleTakeChoice] = useState<Record<string, number>>({});
  const previous = useRef<{ viewer: PlayerId; view: any } | null>(null);
  const eventTimer = useRef<number | null>(null);
  const [visualEvent, setVisualEvent] = useState<SplendorVisualEvent | null>(null);
  const bankNodes = useRef(new Map<string, HTMLButtonElement>()), treasuryNodes = useRef(new Map<string, HTMLDivElement>());
  const bankGoldNode = useRef<HTMLSpanElement | null>(null), flightTimer = useRef<number | null>(null);
  const [tokenFlights, setTokenFlights] = useState<Array<{ id: string; viewer: PlayerId; gem: string; left: number; top: number; dx: number; dy: number; delay: number }>>([]);
  const takeChoices = choices.filter(choice => choice.action.type === 'take');
  const distinctAvailable = colors.filter(gem => Number(bank[gem] ?? 0) > 0).length;
  const needed = Math.min(3, distinctAvailable);
  const matchingTakes = takeChoices.filter(choice => sameStrings(choice.action.payload?.gems, picked));
  const selectedTake = matchingTakes[Math.min(returnChoice, Math.max(0, matchingTakes.length - 1))];
  const active = view?.turn === playerId && !view?.result;
  const scoreTotal = Number(hand.points ?? 0) + Number(hand.nobles ?? 0);
  const handTokenTotal = gems.reduce((total, gem) => total + Number(tokens[gem] ?? 0), 0);
  const resetKey = [view?.turn, ...gems.map(gem => Number(bank[gem] ?? 0)), ...gems.map(gem => Number(tokens[gem] ?? 0)), Number(tokens.gold ?? 0), scoreTotal, reserved.map((card: any) => card.id).join(',')].join(':');
  useEffect(() => { setPicked([]); setReturnChoice(0); setReserveChoices({}); setDoubleTakeChoice({}); }, [resetKey]);
  useEffect(() => {
    const before = previous.current;
    previous.current = { viewer: playerId, view };
    if (eventTimer.current !== null) window.clearTimeout(eventTimer.current);
    eventTimer.current = null;
    const nextEvent = deriveSplendorVisualEvent(before, view, playerId);
    setVisualEvent(nextEvent);
    if (nextEvent) eventTimer.current = window.setTimeout(() => { eventTimer.current = null; setVisualEvent(null); }, 1200);
    return () => { if (eventTimer.current !== null) window.clearTimeout(eventTimer.current); eventTimer.current = null; };
  }, [view, playerId]);
  useEffect(() => {
    if (!visualEvent || visualEvent.viewer !== playerId || !visualEvent.incomingTokens.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const frame = window.requestAnimationFrame(() => {
      const flights = visualEvent.incomingTokens.flatMap(gem => {
        const source = (gem === 'gold' ? bankGoldNode.current : bankNodes.current.get(gem))?.querySelector('.sp-gem-icon')?.getBoundingClientRect();
        const target = treasuryNodes.current.get(gem)?.querySelector('.sp-gem-icon')?.getBoundingClientRect();
        if (!source || !target) return [];
        const count = Math.min(visualEvent.incomingCounts[gem] ?? 1, 2);
        return Array.from({ length: count }, (_, index) => ({
          id: `${visualEvent.key}:${gem}:${index}`, viewer: playerId, gem,
          left: source.left + source.width / 2 - 11 + (count > 1 ? index * 4 : 0), top: source.top + source.height / 2 - 11,
          dx: target.left + target.width / 2 - source.left - source.width / 2,
          dy: target.top + target.height / 2 - source.top - source.height / 2, delay: index * 70,
        }));
      });
      const batch = flights.slice(0, 3);
      if (batch.length) {
        if (flightTimer.current !== null) window.clearTimeout(flightTimer.current);
        setTokenFlights(current => [...current.filter(item => item.viewer === playerId), ...batch].slice(-3));
        flightTimer.current = window.setTimeout(() => { setTokenFlights([]); flightTimer.current = null; }, 1000);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [visualEvent, playerId]);
  useEffect(() => {
    if (flightTimer.current !== null) window.clearTimeout(flightTimer.current);
    flightTimer.current = null;
    setTokenFlights([]);
    return () => { if (flightTimer.current !== null) window.clearTimeout(flightTimer.current); };
  }, [playerId]);
  useEffect(() => () => { if (flightTimer.current !== null) window.clearTimeout(flightTimer.current); }, []);
  const finalRound = !view?.result && Math.max(Number(scores.p1 ?? 0), Number(scores.p2 ?? 0)) >= 15;
  const turnCounts = record(board.turns), rivalSeat: PlayerId = playerId === 'p1' ? 'p2' : 'p1';
  const lowerTurnSeat: PlayerId = Number(turnCounts.p1 ?? 0) < Number(turnCounts.p2 ?? 0) ? 'p1' : 'p2';
  const turnCountsUnequal = Number(turnCounts.p1 ?? 0) !== Number(turnCounts.p2 ?? 0);
  const finalTurnSeat: PlayerId | null = !finalRound ? null : view?.phase === 'chooseNoble' ? (turnCountsUnequal ? lowerTurnSeat : rivalSeat)
    : Number(turnCounts.p1 ?? 0) < Number(turnCounts.p2 ?? 0) ? 'p1'
      : Number(turnCounts.p2 ?? 0) < Number(turnCounts.p1 ?? 0) ? 'p2' : view?.turn;
  const reserveMarket = (tier: number, index: number) => choices.filter(choice => choice.action.type === 'reserve' && choice.action.payload?.tier === tier && choice.action.payload?.index === index);
  const reserveDeck = (tier: number) => choices.filter(choice => choice.action.type === 'reserve' && choice.action.payload?.tier === tier && choice.action.payload?.index === undefined);
  const actionBuy = (tier: number, index: number) => choices.find(choice => choice.action.type === 'buy' && choice.action.payload?.source === 'market' && choice.action.payload?.tier === tier && choice.action.payload?.index === index);
  const bankTakeTwo = (gem: string) => choices.filter(choice => choice.action.type === 'takeTwo' && choice.action.payload?.gem === gem);
  const tokenReturnOptions = (candidate: Choice[]) => candidate.map(choice => choice.action.payload?.returnTokens ?? {});
  const chooseReserve = (key: string, options: Choice[]) => options[Math.min(reserveChoices[key] ?? 0, Math.max(0, options.length - 1))];
  const reserveControl = (key: string, options: Choice[]) => options.length > 1 && <label className="sp-return-select"><span>{copy(language, '토큰 반환', 'Devolver')}</span><select aria-label={copy(language, '예약 토큰 반환 계획', 'Plan de devolución al reservar')} value={Math.min(reserveChoices[key] ?? 0, options.length - 1)} onChange={event => setReserveChoices(current => ({ ...current, [key]: Number(event.target.value) }))}>{tokenReturnOptions(options).map((option, index) => <option key={`${index}-${returnLabel(option, language)}`} value={index}>{returnLabel(option, language)}</option>)}</select></label>;
  const clickGem = (gem: string) => {
    if (!active || Number(bank[gem] ?? 0) <= 0 || !needed) return;
    setReturnChoice(0);
    setPicked(current => current.includes(gem) ? current.filter(value => value !== gem) : current.length < needed ? [...current, gem] : current);
  };
  const eventCopy = (event: SplendorVisualEvent) => {
    if (event.kind === 'result') return event.result === 'win' ? copy(language, '스플렌더에서 이겼어요', 'Ganaste Splendor') : event.result === 'draw' ? copy(language, '무승부', 'Empate') : copy(language, '상대가 이겼어요', 'Ganó la otra persona');
    if (event.kind === 'noble') return event.nobleRecipient === 'rival' ? copy(language, '귀족이 상대를 방문했어요', 'Un noble visita a la otra persona') : event.nobleRecipient === 'you' ? copy(language, '귀족이 나를 방문했어요', 'Un noble te visita') : copy(language, '귀족이 방문했어요', 'Llega un noble');
    if (event.kind === 'purchase') return copy(language, `영구 보너스 ${gemName(event.bonusGem ?? '', language)} +1`, `Bonificación permanente de ${gemName(event.bonusGem ?? '', language)} +1`);
    if (event.kind === 'reserve') return copy(language, '카드를 개인 보관함에 넣었어요', 'Carta guardada en tu reserva');
    if (event.kind === 'tokens') return copy(language, '보석이 내 보관함으로 이동했어요', 'Las gemas pasaron a tu reserva');
    if (event.kind === 'market') return copy(language, '새 개발 카드가 공개됐어요', 'Hay nuevas cartas disponibles');
    return view?.turn === playerId ? copy(language, '내 차례예요', 'Es tu turno') : copy(language, '상대 차례예요', 'Turno de la otra persona');
  };
  const shownEvent = visualEvent?.viewer === playerId ? visualEvent : null;
  const marketArrivals = new Set(shownEvent?.marketArrivals ?? []), reservedArrivals = new Set(shownEvent?.reservedArrivals ?? []);
  const scoreKey = `${playerId}:splendor`;
  const title = copy(language, '스플렌더', 'Splendor');
  return <div className="table-game sp-splendor" aria-label={copy(language, '스플렌더 게임판', 'Mesa de Splendor')}>
    <header className="sp-scorebar">
      <div className="sp-title"><span>{title}</span><small>{copy(language, '보석을 모아 개발 카드를 얻고, 먼저 15점에 도달하세요.', 'Reúne gemas, compra desarrollos y alcanza 15 puntos.')}</small></div>
      {(['p1', 'p2'] as const).map((seat, index) => <div className={`sp-player-score ${seat === playerId ? 'is-you' : ''} ${view?.turn === seat ? 'is-active' : ''}`} key={seat}>
        <span>{seat === playerId ? copy(language, '나', 'Tú') : copy(language, '상대', 'Rival')}</span><b><GameValue value={Number(scores[seat] ?? 0)} resetKey={`${scoreKey}:${seat}`}/></b><small>{copy(language, '점', 'pts')}</small>{view?.turn === seat && !view?.result && <i>{copy(language, '차례', 'Turno')}</i>}
      </div>)}
      {finalRound && <p className="sp-final-turn" role="status">{finalTurnSeat === playerId ? copy(language, '15점에 도달했어요. 이번 차례가 마지막이에요.', 'Se alcanzaron 15 puntos. Este es el último turno.') : copy(language, '15점에 도달했어요. 상대의 마지막 차례예요.', 'Se alcanzaron 15 puntos. La otra persona tiene su último turno.')}</p>}
    </header>
    <div className="sp-feedback-slot">{shownEvent ? <p className={`sp-event sp-event-${shownEvent.kind}`} key={shownEvent.key} role="status">{eventCopy(shownEvent)}</p> : <p className="sp-turn-guide" role="status">{choices.some(choice=>choice.action.type==='chooseNoble') ? copy(language,'여러 귀족의 조건을 채웠어요. 하나를 선택하세요.','Cumpliste los requisitos de varios nobles. Elige uno.') : !active ? copy(language, '상대 차례예요. 보석 은행과 공개 카드를 살펴보세요.', 'Turno de la otra persona. Puedes revisar el banco y las cartas.') : picked.length ? copy(language, `서로 다른 보석을 ${needed}가지 선택한 뒤 가져오세요.`, `Elige ${needed} colores distintos y confirma para tomarlos.`) : choices.length ? copy(language, '보석을 가져오거나, 비용이 맞는 카드를 구매하거나 예약하세요.', 'Toma gemas, compra una carta si te alcanza o reserva una.') : copy(language, '가능한 행동이 없어요.', 'No hay acciones disponibles.')}</p>}</div>
    <section className="sp-market" aria-label={copy(language, '개발 카드 시장', 'Mercado de desarrollo')}>
      {[3, 2, 1].map(tier => <section className={`sp-tier sp-tier-${tier}`} key={tier} aria-label={copy(language, `${tier}단계 개발 카드`, `Cartas de nivel ${tier}`)}>
        <div className="sp-tier-rail"><header className="sp-tier-head"><b>{tier}</b><span>{copy(language, `${tier}단계`, `Nivel ${tier}`)}</span><i>{array(market[tier]).length} / 4</i></header>
          <div className="sp-deck-control">{reserveControl(`deck-${tier}`, reserveDeck(tier))}<button type="button" className="sp-button sp-button-quiet" aria-label={copy(language, `${tier}단계 덱에서 보이지 않는 카드 한 장 예약`, `Reservar una carta sin verla del mazo de nivel ${tier}`)} title={copy(language, '공개 카드 대신 덱 맨 위 카드를 한 장 예약해요', 'Reserva la carta superior sin verla')} disabled={!active || !reserveDeck(tier).length} onClick={()=>{const action=chooseReserve(`deck-${tier}`,reserveDeck(tier));if(action)runAction(action.action);}}>{copy(language,'덱 예약','Reservar')}</button></div>
        </div>
        <div className="sp-card-grid">{array(market[tier]).map((raw: any, index: number) => {
          const card = record(raw), id = String(card.id ?? `${tier}-${index}`), buy = actionBuy(tier, index), reserveOptions = reserveMarket(tier, index), selectedReserve = chooseReserve(`market-${id}`, reserveOptions);
          const spareCard = { ...card, id, tier, index };
          return <SplendorMarketCard key={id} card={spareCard} language={language} buy={buy} active={active} reserve={selectedReserve} reserveOptions={reserveOptions} reserveControl={reserveControl(`market-${id}`, reserveOptions)} incoming={marketArrivals.has(id)} tokens={tokens} bonuses={owned} runAction={runAction}/>;
        })}{Array.from({length:Math.max(0,4-array(market[tier]).length)},(_,slot)=><div className="sp-card-empty" key={`empty-${tier}-${slot}`} aria-hidden="true"/>)}</div>
      </section>)}
    </section>
    <aside className="sp-sidebar">
      <section className="sp-bank" aria-label={copy(language, '보석 은행', 'Banco de gemas')}>
        <header className="sp-section-heading"><div><h2>{copy(language, '보석 은행', 'Banco de gemas')}</h2><p>{copy(language, `${needed}가지 색을 골라 가져오세요`, `Elige ${needed} colores distintos`)}</p></div></header>
        <div className="sp-gem-piles">{colors.map(gem => {
          const doubleOptions = bankTakeTwo(gem), doubleIndex = Math.min(doubleTakeChoice[gem] ?? 0, Math.max(0, doubleOptions.length - 1)), double = doubleOptions[doubleIndex];
          const pressed = picked.includes(gem), pile = Number(bank[gem] ?? 0), canPick = takeChoices.length > 0;
          const doubleReturn=double?.action.payload?.returnTokens??{},doubleReturnCount=tokenReturnCount(doubleReturn);
          return <div className={`sp-gem-option ${pressed ? 'is-picked' : ''}`} key={gem}>
            <button ref={element=>{if(element)bankNodes.current.set(gem,element);else bankNodes.current.delete(gem);}} type="button" className={`sp-gem-pile sp-color-${gem}`} aria-label={`${gemName(gem, language)}: ${pile}`} aria-pressed={pressed} disabled={!active || !canPick || !pile || !needed} onClick={()=>clickGem(gem)}><GemIcon gem={gem}/><b>{pile}</b></button>
            <span className="sp-gem-name">{gemName(gem,language)}{pressed && <small>{copy(language,'선택됨','Elegida')}</small>}</span>
            {double&&<button type="button" className="sp-double-take" disabled={!active} aria-label={copy(language,`${gemName(gem,language)} 2개 가져오기`,`Tomar 2 gemas del mismo color: ${gemName(gem,language)}`)} onClick={()=>runAction(double.action)}>+2</button>}
            {(doubleOptions.length>1||doubleReturnCount>0)&&<div className="sp-double-plan">{doubleOptions.length>1?<label><span>{copy(language,'반환 계획','Devolución')}</span><select aria-label={copy(language,`반환 계획 ${gemName(gem,language)}`,`Plan de devolución ${gemName(gem,language)}`)} value={doubleIndex} onChange={event=>setDoubleTakeChoice(current=>({...current,[gem]:Number(event.target.value)}))}>{doubleOptions.map((choice,index)=><option key={`${index}-${returnLabel(choice.action.payload?.returnTokens,language)}`} value={index}>{returnLabel(choice.action.payload?.returnTokens,language)}</option>)}</select></label>:<span>{copy(language,`반환 ${returnLabel(doubleReturn,language)}`,`Devolver ${returnLabel(doubleReturn,language)}`)}</span>}<small>{copy(language,`반환 ${doubleReturnCount} · 가져온 뒤 ${splendorTotalAfterTake(tokens,2,doubleReturn)}/10개`,`Devuelves ${doubleReturnCount} · tendrás ${splendorTotalAfterTake(tokens,2,doubleReturn)}/10`)}</small></div>}
          </div>;
        })}<div className="sp-gem-option sp-gem-gold"><span ref={bankGoldNode} className="sp-gem-pile sp-color-gold"><GemIcon gem="gold"/><b>{Number(bank.gold??0)}</b></span><span className="sp-gem-name">{gemName('gold',language)}</span></div></div>
        {(picked.length > 0 || matchingTakes.length > 1) && <div className="sp-token-confirm">
          {matchingTakes.length > 1 && <label className="sp-return-select"><span>{copy(language,'반환할 토큰','Fichas a devolver')}</span><select aria-label={copy(language,'반환 토큰 계획','Plan de devolución')} value={Math.min(returnChoice,matchingTakes.length-1)} onChange={event=>setReturnChoice(Number(event.target.value))}>{matchingTakes.map((choice,index)=><option key={index} value={index}>{returnLabel(choice.action.payload?.returnTokens,language)}</option>)}</select></label>}
          {selectedTake && <><p role="status">{copy(language,`선택 ${picked.length}/${needed} · 반환 ${tokenReturnCount(selectedTake.action.payload?.returnTokens)} · 가져온 뒤 ${splendorTotalAfterTake(tokens,picked.length,selectedTake.action.payload?.returnTokens)}/10개`,`${picked.length}/${needed} elegidas · devolver ${tokenReturnCount(selectedTake.action.payload?.returnTokens)} · tendrás ${splendorTotalAfterTake(tokens,picked.length,selectedTake.action.payload?.returnTokens)}/10`)}</p><button type="button" className="sp-button sp-button-primary" disabled={!active} onClick={()=>runAction(selectedTake.action)}>{copy(language,'보석 가져오기','Tomar gemas')}</button></>}
        </div>}
      </section>
      <section className="sp-treasury" aria-label={copy(language, '내 보관함', 'Tus gemas y bonificaciones')}>
        <header className="sp-section-heading"><div><h2>{copy(language,'내 보관함','Tus gemas')}</h2><p>{copy(language,'토큰과 영구 보너스','Fichas y bonificaciones permanentes')}</p></div><span className="sp-capacity"><b>{handTokenTotal}</b> / 10</span></header>
        <div className="sp-treasury-gems">{gems.map(gem=><div ref={element=>{if(element)treasuryNodes.current.set(gem,element);else treasuryNodes.current.delete(gem);}} className="sp-treasury-gem" key={gem}><GemIcon gem={gem}/><b><GameValue value={Number(tokens[gem]??0)} resetKey={`${playerId}:splendor:token:${gem}`}/></b><span>{gemName(gem,language)}</span></div>)}</div>
        <div className="sp-bonus-row" aria-label={copy(language,'영구 카드 보너스','Bonificaciones permanentes')}><small>{copy(language,'영구 보너스','Bonificaciones permanentes')}</small>{colors.map(gem=><span className={`sp-bonus sp-color-${gem} ${shownEvent?.bonusGem===gem?'is-gain':''}`} key={gem}><GemIcon gem={gem}/><b><GameValue value={Number(owned[gem]??0)} resetKey={`${playerId}:splendor:bonus:${gem}`}/></b></span>)}</div>
        {shownEvent?.purchasedCard&&<div className="sp-acquired-card" data-card-id={shownEvent.purchasedCard.id}><span className="sp-acquired-art" aria-hidden="true">{splendorCardArtSrc(shownEvent.purchasedCard.id)&&<img src={splendorCardArtSrc(shownEvent.purchasedCard.id)!} alt=""/>}</span><span><b>{copy(language,'새 카드가 포트폴리오에 들어왔어요','Nueva carta añadida a tu colección')}</b></span></div>}
      </section>
      <section className="sp-reserved" aria-label={copy(language,'예약 카드','Cartas reservadas')}>
        <header className="sp-section-heading"><div><h2>{copy(language,'예약 카드','Cartas reservadas')}</h2><p>{copy(language,'내가 볼 수 있는 카드','Solo tú ves estas cartas')}</p></div><span className="sp-capacity"><b>{reserved.length}</b> / 3</span></header>
        <div className="sp-reserved-list">{Array.from({length:3},(_,index)=>{
          const card=reserved[index]; if(!card)return <div className="sp-reserved-empty" key={`slot-${index}`}><span>{index+1}</span>{copy(language,'빈 슬롯','Espacio vacío')}</div>;
          const id=String(card.id??index), buy=choices.find(choice=>choice.action.type==='buy'&&choice.action.payload?.source==='reserved'&&choice.action.payload?.index===index);
          return <SplendorReservedCard key={id} card={{...record(card),id,index}} language={language} buy={buy} tokens={tokens} bonuses={owned} incoming={reservedArrivals.has(id)} runAction={runAction}/>;
        })}</div>
        <p className="sp-opponent-reserved">{copy(language,'상대 예약 카드','Reservadas de la otra persona')} <b>{Number(board.reservedOpponentCount??0)} / 3</b></p>
      </section>
      <section className={`sp-nobles ${choices.some(choice=>choice.action.type==='chooseNoble')?'is-choosing':''} ${shownEvent?.nobleAwarded?'is-visit':''}`} aria-label={copy(language,'공개 귀족','Nobles visibles')}>
        <header className="sp-section-heading"><div><h2>{choices.some(choice=>choice.action.type==='chooseNoble')?copy(language,'귀족을 선택하세요','Elige un noble'):copy(language,'귀족','Nobles')}</h2><p>{copy(language,'개발 보너스 조건','Requisitos de bonificación')}</p></div></header>
        {shownEvent?.nobleAwarded&&<div className="sp-noble-event" role="status" data-recipient={shownEvent.nobleRecipient}><span className="sp-noble-event-art" aria-hidden="true">{splendorNobleArtSrc(shownEvent.nobleId)&&<img src={splendorNobleArtSrc(shownEvent.nobleId)!} alt=""/>}</span><b>{eventCopy({...shownEvent,kind:'noble'})}</b></div>}
        <div className="sp-noble-list">{Object.entries(nobles).map(([id,raw])=>{
          const noble=record(raw), choice=choices.find(item=>item.action.type==='chooseNoble'&&item.action.payload?.id===id), needs=colors.filter(gem=>Number(noble.requirement?.[gem]??0)>0);
          const artSrc = splendorNobleArtSrc(id);
          return <button type="button" className={`sp-noble ${choice?'is-selectable':''}`} key={id} disabled={!choice} aria-label={`${copy(language,'귀족','Noble')} · ${Number(noble.points??3)} ${copy(language,'점','pts')}${choice?` · ${copy(language,'선택 가능','disponible')}`:''}`} onClick={()=>choice&&runAction(choice.action)}>
            <span className="sp-noble-art" aria-hidden="true">{artSrc&&<img src={artSrc} alt=""/>}</span><span className="sp-noble-info"><b>{copy(language,'귀족 방문','Visita noble')}</b><small>{Number(noble.points??3)} {copy(language,'점','pts')}</small><span className="sp-noble-cost">{needs.map(gem=><i className={`sp-cost sp-color-${gem}`} key={gem}><GemIcon gem={gem}/><b>{Number(noble.requirement[gem])}</b></i>)}</span></span>
            {choice&&<span className="sp-noble-select-label">{copy(language,'선택','Elegir')}</span>}
          </button>;
        })}{!Object.keys(nobles).length&&<p className="sp-empty">{copy(language,'남은 귀족이 없어요','No quedan nobles')}</p>}</div>
      </section>
    </aside>
    {tokenFlights.filter(flight=>flight.viewer===playerId).map(flight=><span key={flight.id} className={`sp-token-flight sp-color-${flight.gem}`} aria-hidden="true" style={{left:flight.left,top:flight.top,'--sp-dx':`${flight.dx}px`,'--sp-dy':`${flight.dy}px`,'--sp-delay':`${flight.delay}ms`} as CSSProperties} onAnimationEnd={()=>setTokenFlights(current=>current.filter(item=>item.id!==flight.id))}><GemIcon gem={flight.gem}/></span>)}
    {view?.result&&<ResultLine game="splendor" result={view.result} playerId={playerId} language={language}/>}
  </div>;
}

function SplendorMarketCard({card,language,buy,active,reserve,reserveOptions,reserveControl,incoming,tokens,bonuses,runAction}:{card:RecordValue;language:Language;buy?:Choice;active:boolean;reserve?:Choice;reserveOptions:Choice[];reserveControl:ReactNode;incoming:boolean;tokens:RecordValue;bonuses:RecordValue;runAction:(action:GameAction)=>void}) {
  const grossDeficit=colors.reduce((sum,gem)=>sum+Math.max(0,Number(card.cost?.[gem]??0)-Number(bonuses?.[gem]??0)-Number(tokens?.[gem]??0)),0);
  const deficit=Math.max(0,grossDeficit-Number(tokens.gold??0));
  const bonus=String(card.bonus??'white'), tier=Number(card.tier??1), artSrc=splendorCardArtSrc(card.id);
  const costDescription=colors.filter(gem=>Number(card.cost?.[gem]??0)>0).map(gem=>`${Number(card.cost[gem])} ${gemName(gem,language)}`).join(', ')||copy(language,'비용 없음','Sin costo');
  return <article className={`sp-card ${buy?'is-buyable':''} ${incoming?'is-arrival':''}`} data-card-id={card.id} aria-label={copy(language,`${tier}단계 카드 · 보너스 ${gemName(bonus,language)} +1 · ${Number(card.points??0)}점 · 비용 ${costDescription}`,`Carta de nivel ${tier} · bonificación ${gemName(bonus,language)} +1 · ${Number(card.points??0)} pts · costo ${costDescription}`)}>
    <div className={`sp-card-art sp-color-${bonus}`} data-art-src={artSrc??''} aria-hidden="true">{artSrc?<img className="sp-card-face" src={artSrc} alt="" width="250" height="350" loading="lazy"/>:<span className="sp-card-fallback"><GemIcon gem={bonus}/>{copy(language,'카드 그림을 불러올 수 없어요','Imagen no disponible')}</span>}</div>
    <div className="sp-card-details"><div className={`sp-bonus-label sp-color-${bonus}`}><GemIcon gem={bonus}/><span>{copy(language,`보너스 +1 ${gemName(bonus,language)}`,`+1 ${gemName(bonus,language)}`)}</span></div>
      <div className="sp-card-actions">
      {buy?<button type="button" className="sp-button sp-button-buy" aria-label={copy(language,`카드 구매 · ${Number(card.points??0)}점`,`Comprar carta · ${Number(card.points??0)} pts`)} onClick={()=>runAction(buy.action)}>{copy(language,'구매','Comprar')}</button>:<button type="button" className="sp-button sp-button-disabled" disabled title={copy(language,deficit?`토큰 ${deficit}개가 더 필요해요`:'내 차례에 구매할 수 있어요',deficit?`Necesitas ${deficit} ${deficit===1?'ficha':'fichas'} más`:'Puedes comprar en tu turno')}>{deficit?copy(language,`부족 ${deficit}`,`Faltan ${deficit}`):active?copy(language,'선택을 먼저 마쳐요','Termina la elección'):copy(language,'상대 차례','Turno rival')}</button>}
        {reserveOptions.length>0&&<button type="button" className="sp-button sp-button-quiet" title={reserve?.label[language]} onClick={()=>reserve&&runAction(reserve.action)}>{copy(language,'예약','Reservar')}</button>}
      </div>{reserveControl}
    </div>
  </article>;
}

function SplendorReservedCard({card,language,buy,tokens,bonuses,incoming,runAction}:{card:RecordValue;language:Language;buy?:Choice;tokens:RecordValue;bonuses:RecordValue;incoming:boolean;runAction:(action:GameAction)=>void}) {
  const bonus=String(card.bonus??'white'),cost=colors.filter(gem=>Number(card.cost?.[gem]??0)>0),deficit=Math.max(0,colors.reduce((sum,gem)=>sum+Math.max(0,Number(card.cost?.[gem]??0)-Number(bonuses[gem]??0)-Number(tokens[gem]??0)),0)-Number(tokens.gold??0));
  const artSrc=splendorCardArtSrc(card.id);
  return <article className={`sp-reserved-card ${incoming?'is-arrival':''}`} data-card-id={card.id}><span className="sp-reserved-art" aria-hidden="true">{artSrc&&<img src={artSrc} alt="" width="52" height="74" loading="lazy"/>}</span><div><b>{copy(language,'예약 카드','Carta reservada')} · {copy(language,`단계 ${Number(card.tier)}`,`Nivel ${Number(card.tier)}`)}</b><span className="sp-reserved-value">{Number(card.points??0)} {copy(language,'점','pts')} · {copy(language,`보너스 ${gemName(bonus,language)}`,`Bonificación ${gemName(bonus,language)}`)}</span><span className="sp-reserved-cost">{cost.map(gem=>`${Number(card.cost[gem])} ${gemName(gem,language)}`).join(' · ')||copy(language,'비용 없음','Sin costo')}</span><button type="button" className={`sp-button ${buy?'sp-button-buy':'sp-button-disabled'}`} disabled={!buy} onClick={()=>buy&&runAction(buy.action)}>{buy?copy(language,'구매','Comprar'):copy(language,deficit?`부족 ${deficit}`:'상대 차례',deficit?`Faltan ${deficit}`:'Turno rival')}</button></div></article>;
}

function GemIcon({gem}: {gem: string}) {
  const shapes:Record<string,[string,string]>={
    white:['M12 2 22 9 12 22 2 9Z','M2 9h20M7 5l5 17m5-17-5 17'],
    blue:['M7 2h10l5 8-10 12L2 10Z','M2 10h20M7 2l5 20m5-20-5 20'],
    green:['M5 3h14l3 7-10 12L2 10Z','M2 10h20M5 3l7 19 7-19'],
    red:['M4 5 12 2l8 3 2 7-10 10L2 12Z','M2 12h20M4 5l8 17 8-17'],
    black:['M8 2h8l7 8-11 12L1 10Z','M1 10h22M8 2l4 20 4-20'],
    gold:['M12 2 21 6v12l-9 4-9-4V6Z','M3 6l9 6 9-6M3 18l9-6 9 6M12 2v10'],
  };
  const [outline,facets]=shapes[gem]??shapes.white;
  return <span className={`sp-gem-icon sp-color-${gem}`} aria-hidden="true"><svg viewBox="0 0 24 24"><path d={outline}/><path d={facets}/></svg></span>;
}
function sameStrings(left: unknown, right: string[]) { return Array.isArray(left) && left.length === right.length && left.every(value => right.includes(value as string)); }
function returnLabel(value: unknown, language: Language) { const tokens = record(value); const entries = Object.entries(tokens).filter(([,count]) => Number(count) > 0); return entries.length ? entries.map(([gem,count]) => `${count} ${gemName(gem, language)}`).join(' · ') : copy(language, '반환 없음', 'Sin devolución'); }
function ResultLine({game, result, playerId, language}: {game: TableGameId; result: any; playerId: PlayerId; language: Language}) {
  const message = result?.winner === 'draw' ? copy(language, '무승부', 'Empate') : result?.winner === playerId ? copy(language, '이겼어요', 'Ganaste') : copy(language, '상대가 이겼어요', 'Ganó la otra persona');
  const outcome = result?.winner === 'draw' ? 'draw' : result?.winner === playerId ? 'win' : 'lose';
  const scores = record(result?.scores);
  const detail = game === 'jaipur'
    ? copy(language, `라운드 승리 ${Number(scores.p1 ?? 0)} 대 ${Number(scores.p2 ?? 0)}`, `Rondas ganadas: ${Number(scores.p1 ?? 0)} a ${Number(scores.p2 ?? 0)}`)
    : game === 'splendor' && result?.scores
      ? copy(language, `최종 점수 ${Number(scores.p1 ?? 0)} 대 ${Number(scores.p2 ?? 0)}`, `Puntuación final: ${Number(scores.p1 ?? 0)} a ${Number(scores.p2 ?? 0)}`)
      : game === 'davinci'
        ? copy(language, '상대의 타일을 모두 공개했어요.', 'Se revelaron todas las fichas de la otra persona.')
        : '';
  return <div className={`tg-result tg-result-${outcome}`} data-game={game} data-outcome={outcome} role="status"><b>{message}</b>{detail && <span>{detail}</span>}</div>;
}
