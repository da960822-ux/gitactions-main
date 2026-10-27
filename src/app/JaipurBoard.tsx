import { useEffect, useRef, useState } from 'react';
import type { GameAction, Language, PlayerId } from '../core/types';
import type { JaipurGood } from '../games/jaipur';
import { playCue } from '../audio/audio';
import { GameValue } from './GameValue';
import { JaipurBonusArt, JaipurBonusTokenBack, JaipurCamelAward, JaipurCoin, JaipurGoodArt, JaipurProductToken, jaipurCardVariant } from './JaipurArt';
import { JaipurMotion } from './JaipurMotion';
import '../styles/jaipur-premium.css';
import '../styles/jaipur-layout.css';
import '../styles/jaipur-feedback.css';

type Choice = { label: Record<Language, string>; action: GameAction };
type Props = { view: any; language: Language; playerId: PlayerId; desktopDisplay?: boolean; runAction: (action: GameAction) => void | Promise<unknown> };
type Bag = Record<string, any>;
const goods: Exclude<JaipurGood, 'camel'>[] = ['diamond', 'gold', 'silver', 'cloth', 'spice', 'leather'];
const text = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;
const bag = (v: unknown): Bag => v && typeof v === 'object' && !Array.isArray(v) ? v as Bag : {};
const list = (v: unknown): any[] => Array.isArray(v) ? v : [];
const names: Record<JaipurGood, Record<Language, string>> = {
  diamond: { ko: '다이아몬드', es: 'Diamantes' }, gold: { ko: '금', es: 'Oro' }, silver: { ko: '은', es: 'Plata' },
  cloth: { ko: '옷감', es: 'Tela' }, spice: { ko: '향신료', es: 'Especias' }, leather: { ko: '가죽', es: 'Cuero' }, camel: { ko: '낙타', es: 'Camellos' },
};
const sameIndices = (a: unknown, b: number[]) => Array.isArray(a) && a.length === b.length && [...a].sort((x, y) => Number(x) - Number(y)).every((n, i) => Number(n) === [...b].sort((x, y) => x - y)[i]);
export const toggleJaipurTakeSelection = (current: string[], target: string[]) => current.length === target.length && target.every((id, index) => current[index] === id) ? [] : target;
const choiceLabel = (choice: Choice, language: Language) => choice.label?.[language] ?? '';
export function jaipurSalePreview(language: Language, count: number, topValue: number | null, hasBonus: boolean) {
  if (count === 1) return topValue === null ? text(language, '상품 토큰 점수는 판매 후 공개', 'La ficha se revela al vender') : text(language, `토큰 ${topValue}점`, `Ficha superior: ${topValue} pts`);
  const first = topValue === null ? text(language, '첫 상품 토큰 점수는 판매 때 공개', 'La primera ficha se revela al vender') : text(language, `첫 토큰 ${topValue}점`, `Primera ficha: ${topValue} pts`);
  const bonus = count < 3 ? '' : hasBonus ? text(language, ' · 보너스 타일 가능 · 보너스 타일 가치는 비공개', ' · hay bono disponible · su valor es privado') : text(language, ' · 남은 보너스 타일 없음', ' · no quedan bonos');
  return text(language, `${first} · 나머지 ${count - 1}개 상품 토큰은 판매 때 공개${bonus}`, `${first} · las otras ${count - 1} fichas se revelan al vender${bonus}`);
}

export function JaipurBoard({ view, language, playerId, runAction, desktopDisplay = true }: Props) {
  const board = bag(view?.board), choices: Choice[] = list(view?.actions), market = list(board.market) as JaipurGood[], hand = list(view?.ownHand) as JaipurGood[];
  const piles = bag(board.piles), tokens = bag(board.tokens), herdCounts = bag(board.herdCounts), wins = bag(board.roundsWon), badges = bag(board.camelBadges), bonusCounts = bag(board.bonusTileCounts);
  const marketCards = list(board.marketCards), handCards = list(view?.handCards);
  const active = view?.turn === playerId && !view?.result;
  const [mode, setMode] = useState<'take' | 'exchange' | 'sell'>('take');
  const [handSelection, setHandSelection] = useState<string[]>([]), [marketSelection, setMarketSelection] = useState<string[]>([]);
  const [selectedGood, setSelectedGood] = useState<Exclude<JaipurGood, 'camel'> | null>(null), [saleCount, setSaleCount] = useState(0);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const busyRef = useRef(false), modeButtonRef = useRef<HTMLButtonElement>(null);
  const cardKey = (card: unknown, fallback: string) => String(bag(card).id ?? fallback);
  const stateKey = `${playerId}:${board.round}:${view?.turn}:${marketCards.map(card => bag(card).id ?? bag(card).good).join(',') || market.join(',')}:${handCards.map(card => bag(card).id ?? bag(card).good).join(',') || hand.join(',')}`;
  useEffect(() => { setMode('take'); setHandSelection([]); setMarketSelection([]); setSelectedGood(null); setSaleCount(0); setError(''); }, [stateKey]);

  const selectedHandIndices = handSelection.map(id => handCards.findIndex((card, index) => cardKey(card, `${board.round ?? 1}-${hand[index]}-${index}-${hand.join('|')}`) === id));
  const selectedMarketIndices = marketSelection.map(id => marketCards.findIndex((card, index) => cardKey(card, `${board.round ?? 1}-${market[index]}-${index}`) === id));
  const exchangeChoice = selectedHandIndices.every(index => index >= 0) && selectedMarketIndices.every(index => index >= 0)
    ? choices.find(c => c.action.type === 'take' && c.action.payload?.mode === 'exchange' && sameIndices(c.action.payload?.handIndices, selectedHandIndices) && sameIndices(c.action.payload?.marketIndices, selectedMarketIndices))
    : undefined;
  const camelChoice = choices.find(c => c.action.type === 'take' && c.action.payload?.mode === 'camels');
  const saleChoices = choices.filter(c => c.action.type === 'sell');
  const selectedGoods = selectedGood ? hand.map((good, index) => good === selectedGood ? cardKey(handCards[index], `${board.round ?? 1}-${good}-${index}-${hand.join('|')}`) : '').filter(Boolean) : [];
  const selectedSaleIds = selectedGood ? handCards.flatMap((card, index) => hand[index] === selectedGood ? [cardKey(card, `${board.round ?? 1}-${selectedGood}-${index}-${hand.join('|')}`)] : []).slice(0, saleCount) : [];
  const selectedHandGoods = selectedHandIndices.map(index => ({ good: hand[index], id: handSelection.find(id => cardKey(handCards[index], `${board.round ?? 1}-${hand[index]}-${index}-${hand.join('|')}`) === id) ?? `${board.round}-${hand[index]}-${index}` })).filter((item): item is { good: JaipurGood; id: string } => Boolean(item.good));
  const selectedMarketGoods = selectedMarketIndices.map(index => ({ good: market[index], id: marketSelection.find(id => cardKey(marketCards[index], `${board.round ?? 1}-${market[index]}-${index}`) === id) ?? `${board.round}-${market[index]}-${index}` })).filter((item): item is { good: JaipurGood; id: string } => Boolean(item.good));
  const saleChoice = saleChoices.find(c => c.action.payload?.good === selectedGood && Number(c.action.payload?.count) === saleCount);
  const selectedMarketIndex = marketSelection.length === 1 ? selectedMarketIndices[0] : -1;
  const takingCamels = selectedMarketIndices.length > 0 && selectedMarketIndices.every(index => index >= 0 && market[index] === 'camel');
  const takeChoice = selectedMarketIndex >= 0
    ? choices.find(c => c.action.type === 'take' && c.action.payload?.mode === 'single' && Number(list(c.action.payload?.indices)[0]) === selectedMarketIndex)
    : undefined;
  const canExchange = choices.some(c => c.action.type === 'take' && c.action.payload?.mode === 'exchange');
  const roundResult = bag(board.roundSummary ?? board.roundResult);
  const roundSummary = roundResult.winner ? roundResult : null;
  const events = list(view?.log ?? board.actionLog).slice(-6).reverse();
  const result = bag(view?.result);
  const playerLabel = (seat: PlayerId) => seat === playerId ? text(language, '나', 'Tú') : text(language, '상대', 'Rival');
  const eventDetail = (event: Bag) => {
    const cards = list(event.cards), good = cards[0]?.good as JaipurGood | undefined;
    if (event.type === 'sale') return text(language, `${good ? names[good][language] : '상품'} ${cards.length}장 · ${Number(event.points ?? 0)}점 획득`, `${good ? names[good].es : 'Mercancías'}: ${cards.length} · ${Number(event.points ?? 0)} pts`);
    if (event.type === 'bonus') return text(language, `${Number(event.bonus?.size ?? 0)}장 판매 보너스 ${Number(event.bonus?.value ?? 0)}점`, `Bono de ${Number(event.bonus?.size ?? 0)} cartas: ${Number(event.bonus?.value ?? 0)} pts`);
    if (event.type === 'take-single') return good ? names[good][language] : '';
    if (event.type === 'take-camels') return text(language, `${cards.length}마리`, `${cards.length} camellos`);
    if (event.type === 'exchange') return text(language, `${cards.length}장 교환`, `${cards.length} cartas`);
    if (event.type === 'round-end') return text(language, '라운드 정산', 'Cierre de ronda');
    if (event.type === 'round-start') return text(language, `${Number(event.round ?? 1)}라운드`, `Ronda ${Number(event.round ?? 1)}`);
    return event.type === 'win' ? text(language, '경기 종료', 'Fin de partida') : '';
  };
  const run = async (choice?: Choice) => {
    if (!choice || busyRef.current || !active) return;
    busyRef.current = true; setBusy(true); setError('');
    try {
      const accepted = await runAction(choice.action);
      if (accepted === false) { setError(text(language, '게임판을 확인한 뒤 다시 시도해 주세요.', 'Revisa el tablero actual antes de volver a intentarlo.')); return; }
      setHandSelection([]); setMarketSelection([]); setSelectedGood(null); setSaleCount(0); setMode('take');
    }
    catch { setError(text(language, '게임판을 확인한 뒤 다시 시도해 주세요.', 'Revisa el tablero actual antes de volver a intentarlo.')); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const toggle = (current: string[], update: (v: string[]) => void, id: string) => {
    if (current.includes(id)) { update(current.filter(value => value !== id)); playCue('jaipur', 'select'); }
    else if (current.length < 5) { update([...current, id]); playCue('jaipur', 'select'); }
  };
  const changeMode = (next: 'take' | 'exchange' | 'sell') => { setMode(next); setHandSelection([]); setMarketSelection([]); setSelectedGood(null); setSaleCount(0); setError(''); };
  const cancelSelection = () => { changeMode('take'); modeButtonRef.current?.focus(); };
  const handSig = hand.join('|');
  const roundKey = `${playerId}:jaipur:${Number(board.round ?? 1)}`;
  const mobileSaleTray = mode === 'sell' && !desktopDisplay && <div className="jp-sale-controls jp-action-tray" aria-label={text(language, '판매할 상품과 수량', 'Mercancías y cantidades para vender')}>
    {selectedGood && (() => { const pile = list(piles[selectedGood]), rawTop = pile[0], topValue = rawTop !== null && rawTop !== undefined && Number.isFinite(Number(rawTop)) ? Number(rawTop) : null, minimum = selectedGood === 'diamond' || selectedGood === 'gold' || selectedGood === 'silver' ? 2 : 1, hasBonus = saleCount >= 3 && Number(bonusCounts[saleCount >= 5 ? 5 : saleCount] ?? 0) > 0; return <div className="jp-sale-stepper"><span>{names[selectedGood][language]} · {text(language, `${selectedGoods.length}장 보유`, `${selectedGoods.length} en mano`)}</span><button type="button" disabled={busy || saleCount <= minimum} aria-label={text(language, '판매 수량 줄이기', 'Reducir cantidad')} onClick={() => setSaleCount(value => value - 1)}>−</button><output aria-live="polite">{saleCount}</output><button type="button" disabled={busy || saleCount >= selectedGoods.length} aria-label={text(language, '판매 수량 늘리기', 'Aumentar cantidad')} onClick={() => setSaleCount(value => value + 1)}>+</button><small>{selectedGoods.length < minimum ? text(language, `이 상품은 최소 ${minimum}장이 있어야 팔 수 있어요.`, `Se necesitan al menos ${minimum} cartas para vender.`) : !pile.length ? text(language, '이 상품 토큰이 남아 있지 않아요.', 'No quedan fichas de esta mercancía.') : jaipurSalePreview(language, saleCount, topValue, hasBonus)}</small><button type="button" className="jp-primary-action" disabled={!saleChoice || busy} onClick={() => run(saleChoice)}>{text(language, `${saleCount}장 판매 확정`, `Confirmar venta de ${saleCount}`)}</button><button type="button" className="jp-cancel-action" disabled={busy} onClick={cancelSelection}>{text(language, '취소', 'Cancelar')}</button></div>; })()}
    {!selectedGood && <p>{saleChoices.length ? text(language, '손패에서 판매할 상품을 선택하세요.', 'Elige qué mercancía vender de tu mano.') : text(language, '지금 팔 수 있는 상품이 없어요.', 'No hay mercancías que puedas vender ahora.')}</p>}
    {!selectedGood && <button type="button" className="jp-cancel-action" disabled={busy} onClick={cancelSelection}>{text(language, '취소', 'Cancelar')}</button>}
  </div>;

  return <main className={`jaipur-board ${desktopDisplay ? 'has-desktop-preview' : ''}`} aria-label={text(language, '자이푸르 게임판', 'Mesa de Jaipur')} onKeyDown={event => { if (event.key === 'Escape' && (mode !== 'take' || marketSelection.length > 0 || handSelection.length > 0 || selectedGood !== null)) { event.preventDefault(); cancelSelection(); } }}>
    <header className="jp-topline">
      <div><h2>{text(language, '자이푸르', 'Jaipur')}</h2></div>
      <div className="jp-round-pill"><span>{text(language, '라운드', 'Ronda')}</span><strong>{Number(board.round ?? 1)}</strong><span>/ 3</span></div>
    </header>

    <section className="jp-scorebar" aria-label={text(language, '점수와 낙타 현황', 'Puntos y camellos')} data-jaipur-zone="scores">
      {(['p1', 'p2'] as PlayerId[]).map((seat, index) => <article key={seat} className={`jp-score-seat ${seat === playerId ? 'is-you' : ''} ${view?.turn === seat && !view?.result ? 'is-turn' : ''}`} data-jaipur-zone={`tokens-${seat}`} data-jaipur-player-id={seat}>
        <span className="jp-seat-mark" aria-hidden="true">{index ? 'B' : 'A'}</span><div className="jp-score-main"><small>{playerLabel(seat)}{view?.turn === seat && !view?.result ? ` · ${seat === playerId ? text(language, '내 차례', 'Tu turno') : text(language, '상대 차례', 'Turno rival')}` : ''}</small><strong><GameValue value={Number(tokens[seat] ?? 0)} resetKey={`${roundKey}:${seat}:score`}/><span>{text(language, '점', 'pts')}</span></strong></div>
        <div className="jp-score-side"><span><JaipurCamelAward aria-hidden="true"/> {Number(herdCounts[seat] ?? 0)}</span><span>{text(language, '라운드 승리', 'Rondas ganadas')} <b><GameValue value={Number(wins[seat] ?? 0)} resetKey={`${playerId}:jaipur:wins:${seat}`}/>/2</b></span><span className="jp-badge-count">{text(language, '낙타 다수', 'Mayoría de camellos')} <b>{Number(badges[seat] ?? 0)}</b></span></div>
      </article>)}
    </section>

    <JaipurMotion events={list(view?.log ?? board.actionLog)} language={language} playerId={playerId}/>

    {(roundSummary || events.length > 0) && <details className="jp-history-drawer"><summary data-jaipur-zone={roundSummary ? 'settlement' : undefined}>{text(language, roundSummary ? '이전 라운드 정산 · 최근 거래' : '최근 거래', roundSummary ? 'Ronda anterior · actividad reciente' : 'Actividad reciente')}</summary><div className="jp-history-content">
      {roundSummary && <aside className="jp-round-result" role="status"><b>{roundSummary.winner === playerId ? text(language, '라운드 승리', 'Ganaste la ronda') : roundSummary.winner === 'draw' ? text(language, '라운드 무승부', 'Ronda empatada') : text(language, '상대가 라운드 승리', 'Tu pareja ganó la ronda')}</b><div className="jp-round-breakdown">{(['p1', 'p2'] as PlayerId[]).map(seat => { const item = bag(roundSummary.breakdown?.[seat]); return <span key={seat}><b>{playerLabel(seat)}</b>{item.detailed ? <small>{text(language, '상품', 'Mercancías')} {Number(item.goods ?? 0)} · {text(language, '보너스', 'Bonos')} {Number(item.bonus ?? 0)} · {text(language, '낙타', 'Camellos')} {Number(item.camel ?? 0)} · <strong>{Number(item.total ?? 0)}</strong></small> : <small>{text(language, '합산 점수', 'Puntos combinados')} <strong>{Number(item.total ?? 0)}</strong></small>}</span>; })}</div></aside>}
      {events.length > 0 && <ol className="jp-history" aria-label={text(language, '최근 거래', 'Actividad reciente')}>{events.map((event: Bag) => <li key={Number(event.sequence)} data-sequence={Number(event.sequence)}><span className="jp-history-title">{event.title?.[language] ?? ''}</span><span>{eventDetail(event)}</span></li>)}</ol>}
    </div></details>}

    <section className="jp-market-section" aria-label={text(language, '공개 시장', 'Mercado público')}>
      <div className="jp-section-heading"><div><h3>{text(language, '시장', 'Mercado')}</h3></div><span className="jp-deck" data-jaipur-zone="deck">{text(language, '남은 덱', 'Mazo')} <b>{Number(board.deckCount ?? 0)}</b></span></div>
      <div className="jp-market" data-jaipur-zone="market">
        {market.map((good, index) => {
          const stableId = cardKey(marketCards[index], `${board.round ?? 1}-${good}-${index}`);
          const single = choices.find(c => c.action.type === 'take' && c.action.payload?.mode === 'single' && list(c.action.payload?.indices).length === 1 && Number(list(c.action.payload?.indices)[0]) === index);
          const camel = good === 'camel';
          const selected = mode === 'exchange' || mode === 'take' ? marketSelection.includes(stableId) : false;
          const enabled = active && !busy && (mode === 'take' ? camel ? Boolean(camelChoice) : true : mode === 'exchange' ? !camel && canExchange : false);
          const label = `${text(language, '시장 카드', 'Carta del mercado')}: ${names[good][language]}`;
          const prompt = mode === 'sell' ? text(language, '판매 모드', 'Modo de venta') : mode === 'exchange' ? camel ? text(language, '낙타는 교환할 수 없어요', 'Los camellos no se intercambian') : text(language, selected ? '교환에서 빼기' : '교환에 선택', selected ? 'Quitar del cambio' : 'Elegir para cambio') : camel ? camelChoice ? text(language, '무리로 가져오기', 'Llévalos en grupo') : text(language, '가져올 수 없음', 'No disponible') : single ? text(language, '한 장 가져오기', 'Tomar una') : text(language, '가져올 수 없음', 'No disponible');
          return <button type="button" key={stableId} data-jaipur-card-id={stableId} className={`jp-goods-card jp-market-card ${camel ? 'is-camel' : `is-${good}`} ${mode === 'exchange' ? 'jp-market-select' : ''} ${selected ? 'is-selected' : ''}`} aria-label={label} aria-pressed={mode === 'exchange' || mode === 'take' ? selected : undefined} disabled={!enabled} onClick={() => {
            if (mode === 'exchange' && !camel) toggle(marketSelection, setMarketSelection, stableId);
            else if (mode === 'take' && camel) {
              const camels = marketCards.flatMap((card, i) => market[i] === 'camel' ? [cardKey(card, `${board.round ?? 1}-camel-${i}`)] : []);
              setMarketSelection(toggleJaipurTakeSelection(marketSelection, camels)); setHandSelection([]); playCue('jaipur', 'select');
            } else if (mode === 'take') {
              setMarketSelection(toggleJaipurTakeSelection(marketSelection, [stableId])); setHandSelection([]); playCue('jaipur', 'select');
            }
          }}>
            <JaipurGoodArt good={good} variant={jaipurCardVariant(stableId)} className="jp-good-illustration" decorative showWholeArt/><span className="jp-card-name">{names[good][language]}</span><span className="jp-card-prompt">{prompt}</span>
          </button>;
        })}
        {market.length === 0 && <p className="jp-empty">{text(language, '시장이 비었어요.', 'El mercado está vacío.')}</p>}
      </div>
        <div className={`jp-market-footer is-mode-${mode}`}>
        <div className="jp-mode-tabs" role="group" aria-label={text(language, '행동 선택', 'Elige una acción')}>
          <button ref={modeButtonRef} type="button" className={mode === 'take' ? 'is-current' : ''} aria-pressed={mode === 'take'} disabled={!active || busy} onClick={() => changeMode('take')}>{text(language, '가져오기', 'Tomar')}</button>
          <button type="button" className={mode === 'exchange' ? 'is-current' : ''} aria-pressed={mode === 'exchange'} disabled={!active || busy || !canExchange} onClick={() => changeMode('exchange')}>{text(language, '교환', 'Intercambiar')}</button>
          <button type="button" className={mode === 'sell' ? 'is-current' : ''} aria-pressed={mode === 'sell'} disabled={!active || busy || hand.length === 0} onClick={() => changeMode('sell')}>{text(language, '판매', 'Vender')}</button>
        </div>
        {mode === 'take' && <div className="jp-action-tray jp-take-controls" aria-live="polite"><p>{text(language, takingCamels ? `낙타 ${marketSelection.length}마리 선택` : takeChoice ? names[market[selectedMarketIndex]][language] : '시장 카드나 낙타 무리를 선택하세요.', takingCamels ? `${marketSelection.length} camellos elegidos` : takeChoice ? names[market[selectedMarketIndex]][language] : 'Elige una mercancía o los camellos del mercado.')}</p>{marketSelection.length > 0 && !takeChoice && !takingCamels && <small>{text(language, hand.length >= 7 ? '손패가 가득 차서 가져올 수 없어요.' : '현재 가져올 수 없는 상품이에요.', hand.length >= 7 ? 'La mano está llena.' : 'Esta mercancía no se puede tomar ahora.')}</small>}<button type="button" className="jp-primary-action" disabled={busy || (!takeChoice && !(takingCamels && camelChoice))} onClick={() => run(takingCamels ? camelChoice : takeChoice)}>{takingCamels && camelChoice ? choiceLabel(camelChoice, language) : takeChoice ? choiceLabel(takeChoice, language) : text(language, '가져오기 확정', 'Confirmar toma')}</button><button type="button" className="jp-cancel-action" disabled={busy || marketSelection.length === 0} onClick={cancelSelection}>{text(language, '취소', 'Cancelar')}</button></div>}
        {mode === 'exchange' && (desktopDisplay ? <div className="jp-exchange-controls jp-action-tray"><p>{text(language, '손패와 시장에서 상품을 2–5장씩 선택하세요.', 'Elige de 2 a 5 mercancías de tu mano y del mercado.')}</p><div className="jp-exchange-counts" role="status"><span>{text(language, `내 상품 ${handSelection.length}`, `Tu mano ${handSelection.length}`)}</span><b aria-hidden="true">↔</b><span>{text(language, `시장 ${marketSelection.length}`, `Mercado ${marketSelection.length}`)}</span>{handSelection.length !== marketSelection.length && <strong>{text(language, '수량 불일치', 'Cantidades distintas')}</strong>}</div><div className="jp-trade-preview" aria-label={text(language, '교환 미리보기', 'Vista previa del cambio')}><div className="jp-trade-side"><small>{text(language, '내 손패에서 나감', 'Sale de tu mano')}</small>{selectedHandGoods.length ? selectedHandGoods.map(item => <span className="jp-trade-object" key={item.id}><JaipurGoodArt good={item.good} variant={jaipurCardVariant(item.id)} decorative/><b>{names[item.good][language]}</b></span>) : <span className="jp-trade-empty">{text(language, '미선택', 'Sin elegir')}</span>}</div><b className="jp-trade-arrow" aria-hidden="true">⇄</b><div className="jp-trade-side"><small>{text(language, '시장에서 들어옴', 'Entra del mercado')}</small>{selectedMarketGoods.length ? selectedMarketGoods.map(item => <span className="jp-trade-object" key={item.id}><JaipurGoodArt good={item.good} variant={jaipurCardVariant(item.id)} decorative/><b>{names[item.good][language]}</b></span>) : <span className="jp-trade-empty">{text(language, '미선택', 'Sin elegir')}</span>}</div></div><button type="button" className="jp-primary-action" disabled={!exchangeChoice || busy} onClick={() => run(exchangeChoice)}>{exchangeChoice ? choiceLabel(exchangeChoice, language) : text(language, '교환 확정', 'Confirmar cambio')}</button><button type="button" className="jp-cancel-action" disabled={busy} onClick={cancelSelection}>{text(language, '취소', 'Cancelar')}</button></div> : <div className="jp-exchange-controls jp-action-tray"><p>{text(language, '손패와 시장에서 상품을 2–5장씩 선택하세요.', 'Elige de 2 a 5 mercancías de tu mano y del mercado.')}</p><span>{text(language, `내 상품 ${handSelection.length} ↔ 시장 ${marketSelection.length}${handSelection.length !== marketSelection.length ? ' · 수량이 맞지 않아요' : ''}`, `${handSelection.length} en mano ↔ ${marketSelection.length} en mercado${handSelection.length !== marketSelection.length ? ' · las cantidades deben coincidir' : ''}`)}</span><button type="button" className="jp-primary-action" disabled={!exchangeChoice || busy} onClick={() => run(exchangeChoice)}>{exchangeChoice ? choiceLabel(exchangeChoice, language) : text(language, '교환 확정', 'Confirmar cambio')}</button><button type="button" className="jp-cancel-action" disabled={busy} onClick={cancelSelection}>{text(language, '취소', 'Cancelar')}</button></div>)}
        {mode !== 'sell' && error && <p className="jp-action-error" role="alert">{error}</p>}
        {mode !== 'sell' && busy && <p className="jp-busy" role="status">{text(language, '처리 중…', 'Procesando…')}</p>}
        {mode === 'sell' && desktopDisplay && <div className="jp-sale-controls jp-action-tray" aria-label={text(language, '판매할 상품과 수량', 'Mercancías y cantidades para vender')}>
          {selectedGood && (() => { const pile = list(piles[selectedGood]), rawTop = pile[0], topValue = rawTop !== null && rawTop !== undefined && Number.isFinite(Number(rawTop)) ? Number(rawTop) : null, minimum = selectedGood === 'diamond' || selectedGood === 'gold' || selectedGood === 'silver' ? 2 : 1, hasBonus = saleCount >= 3 && Number(bonusCounts[saleCount >= 5 ? 5 : saleCount] ?? 0) > 0; return <div className="jp-sale-stepper"><span className="jp-sale-title-line">{names[selectedGood][language]} · {text(language, `${selectedGoods.length}장 보유`, `${selectedGoods.length} en mano`)}</span><button type="button" disabled={busy || saleCount <= minimum} aria-label={text(language, '판매 수량 줄이기', 'Reducir cantidad')} onClick={() => setSaleCount(value => value - 1)}>−</button><output aria-live="polite">{saleCount}</output><button type="button" disabled={busy || saleCount >= selectedGoods.length} aria-label={text(language, '판매 수량 늘리기', 'Aumentar cantidad')} onClick={() => setSaleCount(value => value + 1)}>+</button><div className="jp-sale-preview" aria-label={text(language, '판매 결과 미리보기', 'Vista previa de venta')}><div className="jp-sale-cards" aria-hidden="true">{selectedSaleIds.map(id => <JaipurGoodArt key={id} good={selectedGood} variant={jaipurCardVariant(id)} decorative className="jp-sale-preview-card"/>)}<span>{text(language, `${saleCount}장`, `${saleCount} cartas`)}</span></div><b className="jp-sale-result-arrow" aria-hidden="true">→</b><div className="jp-sale-reward"><JaipurCoin good={selectedGood} {...(topValue === null ? {} : {value: topValue})}/><strong>{topValue === null ? text(language, '첫 토큰 점수 공개', 'Se revela la primera ficha') : text(language, `첫 토큰 ${topValue}점`, `Primera ficha ${topValue} pts`)}</strong><small>{text(language, `상품 토큰 ${Math.min(saleCount, pile.length)}개`, `${Math.min(saleCount, pile.length)} fichas de mercancía`)}</small></div><div className={`jp-sale-reward jp-sale-bonus ${hasBonus ? 'is-available' : ''}`}><JaipurBonusArt revealed={false} count={Number(bonusCounts[saleCount >= 5 ? 5 : saleCount] ?? 0)} language={language}/><strong>{hasBonus ? text(language, '보너스 가능 · 값 비공개', 'Bono posible · valor oculto') : text(language, '보너스 없음', 'Sin bono')}</strong><small>{hasBonus ? text(language, `${Number(bonusCounts[saleCount >= 5 ? 5 : saleCount])}개 남음`, `${Number(bonusCounts[saleCount >= 5 ? 5 : saleCount])} disponibles`) : text(language, '3장 이상 판매 시 확인', 'Se revisa con 3 o más')}</small></div></div>{(selectedGoods.length < minimum || !pile.length || saleCount > 1) && <small className="jp-sale-preview-note">{selectedGoods.length < minimum ? text(language, `이 상품은 최소 ${minimum}장이 있어야 팔 수 있어요.`, `Se necesitan al menos ${minimum} cartas para vender.`) : !pile.length ? text(language, '이 상품 토큰이 남아 있지 않아요.', 'No quedan fichas de esta mercancía.') : text(language, '나머지 상품 토큰 점수는 판매 후 공개돼요.', 'Las demás fichas se revelan al vender.')}</small>}<button type="button" className="jp-primary-action" disabled={!saleChoice || busy} onClick={() => run(saleChoice)}>{text(language, `${saleCount}장 판매 확정`, `Confirmar venta de ${saleCount}`)}</button><button type="button" className="jp-cancel-action" disabled={busy} onClick={cancelSelection}>{text(language, '취소', 'Cancelar')}</button></div>; })()}
          {!selectedGood && <p>{saleChoices.length ? text(language, '손패에서 판매할 상품을 선택하세요.', 'Elige qué mercancía vender de tu mano.') : text(language, '지금 팔 수 있는 상품이 없어요.', 'No hay mercancías que puedas vender ahora.')}</p>}
          {!selectedGood && <button type="button" className="jp-cancel-action" disabled={busy} onClick={cancelSelection}>{text(language, '취소', 'Cancelar')}</button>}
        </div>}
      </div>
    </section>

    <section className="jp-opponent-row" aria-label={text(language, '상대 손패', 'Mano de tu rival')} data-jaipur-zone="opponent-hand"><div><b>{text(language, '상대 손패', 'Mano rival')}</b></div><span className="jp-opponent-count">{Number(view?.opponentCount ?? 0)} <small>{text(language, '장', 'cartas')}</small></span><div className="jp-card-backs" aria-hidden="true">{Array.from({ length: Math.min(7, Number(view?.opponentCount ?? 0)) }, (_, i) => <i key={i}/>)}</div></section>

    <section className="jp-player-area">
      <article className="jp-player-hand" aria-label={text(language, '내 손패', 'Tu mano')}>
        <div className="jp-section-heading"><div><h3>{text(language, '내 손패', 'Tu mano')} <small>{hand.length} / 7</small></h3></div></div>
        <div className="jp-hand-cards" data-jaipur-zone="hand" data-jaipur-player-id={playerId}>
          {hand.map((good, index) => {
            const stableId = cardKey(handCards[index], `${board.round ?? 1}-${good}-${index}-${handSig}`), selected = handSelection.includes(stableId), groupSelected = selectedGood === good, selling = selectedSaleIds.includes(stableId);
            return <button type="button" key={stableId} data-jaipur-card-id={stableId} className={`jp-goods-card jp-hand-card is-${good} ${mode === 'sell' ? 'jp-good-choice' : ''} ${groupSelected && mode === 'sell' ? 'is-group-selected' : ''} ${selling || selected ? 'is-selected' : ''}`} aria-label={`${names[good][language]} ${index + 1}`} aria-pressed={mode === 'exchange' ? selected : mode === 'sell' ? groupSelected : undefined} disabled={!active || busy || mode === 'take'} onClick={() => { if (mode === 'exchange') toggle(handSelection, setHandSelection, stableId); else if (mode === 'sell' && good !== 'camel') { setSelectedGood(good); setSaleCount(Math.min(good === 'diamond' || good === 'gold' || good === 'silver' ? 2 : 1, hand.filter(item => item === good).length)); playCue('jaipur', 'select'); } }}><JaipurGoodArt good={good} variant={jaipurCardVariant(stableId)} className="jp-good-illustration" decorative/><span className="jp-card-name">{names[good][language]}</span>{mode === 'exchange' && <span className="jp-card-prompt">{selected ? text(language, '교환 선택됨', 'Seleccionada') : text(language, '교환 선택', 'Elegir')}</span>}{mode === 'sell' && groupSelected && <span className="jp-card-prompt">{selling ? text(language, '판매할 카드', 'Para vender') : text(language, '상품 그룹', 'Grupo')}</span>}</button>;
          })}
          {!hand.length && <p className="jp-empty">{text(language, '손패가 비었어요.', 'No tienes cartas en la mano.')}</p>}
        </div>
        {mobileSaleTray}
        {mode === 'sell' && error && <p className="jp-action-error" role="alert">{error}</p>}
        {mode === 'sell' && busy && <p className="jp-busy" role="status">{text(language, '처리 중…', 'Procesando…')}</p>}
      </article>
      <article className="jp-herd" data-jaipur-zone={`herd-${playerId}`} data-jaipur-player-id={playerId}><div><h3>{text(language, '낙타 무리', 'Tu manada')}</h3></div><strong><JaipurCamelAward aria-hidden="true"/><GameValue value={Number(herdCounts[playerId] ?? 0)} resetKey={`${playerId}:jaipur:${board.round}:herd`}/></strong></article>
    </section>

    <section className="jp-rival-herd" data-jaipur-zone={`herd-${playerId === 'p1' ? 'p2' : 'p1'}`}><JaipurCamelAward aria-hidden="true"/><span>{text(language, '상대 낙타 무리', 'Manada rival')}</span><b>{Number(herdCounts[playerId === 'p1' ? 'p2' : 'p1'] ?? 0)}</b></section>

    <section className="jp-supply-area">
      <div className="jp-goods-piles" data-jaipur-zone="tokens"><div className="jp-section-heading"><div><h3>{text(language, '상품 토큰', 'Fichas de mercancía')}</h3></div><p>{text(language, '가장 위의 점수가 먼저 지급돼요.', 'Se toma primero la ficha de mayor valor.')}</p></div>
        <div className="jp-pile-grid" data-jaipur-zone="sale">{goods.map(good => { const pile = list(piles[good]), rawTop = pile[0], top = rawTop !== null && rawTop !== undefined && Number.isFinite(Number(rawTop)) ? Number(rawTop) : null; return <div className={`jp-pile is-${good}`} key={good}><span className="jp-pile-name">{names[good][language]}{desktopDisplay && <JaipurProductToken good={good}/>}</span><div className="jp-pile-count" aria-label={language === 'ko' ? `남음 ${pile.length}개` : `Quedan ${pile.length}`}><small>{text(language, '남음', 'Quedan')}</small><strong><GameValue value={pile.length} resetKey={`${roundKey}:pile:${good}`}/></strong>{language === 'ko' && <small>개</small>}</div><div className="jp-pile-next">{top === null ? <span className="jp-pile-next-label">—</span> : <><span className="jp-pile-next-label">{text(language, '다음', 'Siguiente:')}</span><span className="jp-pile-next-value"><JaipurCoin good={good} value={top} language={language}/><b>{top}{text(language, '점', ' pts')}</b></span></>}</div></div>; })}</div>
      </div>
      <div className="jp-bonus-piles" data-jaipur-zone="bonus"><div className="jp-section-heading"><div><h3>{text(language, '판매 보너스', 'Bonos por venta')}</h3></div></div>
        <div className="jp-bonus-row">{([3, 4, 5] as const).filter(count => Number(bonusCounts[count] ?? 0) > 0).map(count => <div className="jp-bonus-stack" key={count}>{desktopDisplay ? <JaipurBonusTokenBack count={Number(bonusCounts[count] ?? 0)} language={language}/> : <JaipurBonusArt revealed={false} count={Number(bonusCounts[count] ?? 0)} language={language} className="jp-bonus-art"/>}<span><b>{count === 5 ? '5+' : count}</b><small>{text(language, '장 판매', 'cartas vendidas')}</small><strong>{Number(bonusCounts[count] ?? 0)} <small>{text(language, '남음', 'quedan')}</small></strong></span></div>)}</div>
      </div>
    </section>

    {result.winner && <section className={`jp-final-result ${result.winner === playerId ? 'is-win' : result.winner === 'draw' ? 'is-draw' : 'is-loss'}`} data-game="jaipur" data-outcome={result.winner === playerId ? 'win' : result.winner === 'draw' ? 'draw' : 'lose'} role="status"><span>{result.winner === playerId ? text(language, '축하해요', '¡Ganaste!') : result.winner === 'draw' ? text(language, '무승부예요', 'Empate') : text(language, '상대가 이겼어요', 'Ganó tu pareja')}</span><strong>{text(language, `라운드 ${Number(result.scores?.[playerId] ?? wins[playerId] ?? 0)} : ${Number(result.scores?.[playerId === 'p1' ? 'p2' : 'p1'] ?? wins[playerId === 'p1' ? 'p2' : 'p1'] ?? 0)}`, `Rondas ${Number(result.scores?.[playerId] ?? wins[playerId] ?? 0)} : ${Number(result.scores?.[playerId === 'p1' ? 'p2' : 'p1'] ?? wins[playerId === 'p1' ? 'p2' : 'p1'] ?? 0)}`)}</strong></section>}
  </main>;
}
