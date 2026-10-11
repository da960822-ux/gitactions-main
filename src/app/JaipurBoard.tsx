import { useEffect, useState } from 'react';
import type { GameAction, Language, PlayerId } from '../core/types';
import type { JaipurGood } from '../games/jaipur';
import { playCue } from '../audio/audio';
import { GameValue } from './GameValue';
import { JaipurBonusArt, JaipurCamelAward, JaipurCoin, JaipurGoodArt, jaipurCardVariant } from './JaipurArt';
import { JaipurMotion } from './JaipurMotion';
import '../styles/jaipur-premium.css';

type Choice = { label: Record<Language, string>; action: GameAction };
type Props = { view: any; language: Language; playerId: PlayerId; runAction: (action: GameAction) => void | Promise<unknown> };
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
const choiceLabel = (choice: Choice, language: Language) => choice.label?.[language] ?? '';
export function jaipurSalePreview(language: Language, count: number, topValue: number, hasBonus: boolean) {
  if (count === 1) return text(language, `토큰 ${topValue}점`, `Ficha superior: ${topValue} pts`);
  return text(language, `첫 토큰 ${topValue}점 · 나머지 ${count - 1}개 상품 토큰은 판매 때 공개${hasBonus ? ' · 보너스 타일 가치는 비공개' : ''}`, `Primera ficha: ${topValue} pts · las otras ${count - 1}${hasBonus ? ' fichas y el bono se revelan al vender' : ' fichas se revelan al vender'}`);
}

export function JaipurBoard({ view, language, playerId, runAction }: Props) {
  const board = bag(view?.board), choices: Choice[] = list(view?.actions), market = list(board.market) as JaipurGood[], hand = list(view?.ownHand) as JaipurGood[];
  const piles = bag(board.piles), tokens = bag(board.tokens), herdCounts = bag(board.herdCounts), wins = bag(board.roundsWon), badges = bag(board.camelBadges), bonusCounts = bag(board.bonusTileCounts);
  const marketCards = list(board.marketCards), handCards = list(view?.handCards);
  const active = view?.turn === playerId && !view?.result;
  const [mode, setMode] = useState<'take' | 'exchange' | 'sell'>('take');
  const [handSelection, setHandSelection] = useState<number[]>([]), [marketSelection, setMarketSelection] = useState<number[]>([]);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const stateKey = `${playerId}:${board.round}:${view?.turn}:${marketCards.map(card => bag(card).id ?? bag(card).good).join(',') || market.join(',')}:${handCards.map(card => bag(card).id ?? bag(card).good).join(',') || hand.join(',')}`;
  useEffect(() => { setMode('take'); setHandSelection([]); setMarketSelection([]); setError(''); }, [stateKey]);

  const exchangeChoice = choices.find(c => c.action.type === 'take' && c.action.payload?.mode === 'exchange' && sameIndices(c.action.payload?.handIndices, handSelection) && sameIndices(c.action.payload?.marketIndices, marketSelection));
  const camelChoice = choices.find(c => c.action.type === 'take' && c.action.payload?.mode === 'camels');
  const saleChoices = choices.filter(c => c.action.type === 'sell');
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
    if (!choice || busy || !active) return;
    setBusy(true); setError('');
    try {
      const accepted = await runAction(choice.action);
      if (accepted === false) { setError(text(language, '동작이 거절됐어요. 선택을 확인해 주세요.', 'La acción no se aceptó. Revisa tu selección.')); return; }
      setHandSelection([]); setMarketSelection([]); setMode('take');
    }
    catch { setError(text(language, '동작을 완료하지 못했어요. 다시 선택해 주세요.', 'No se pudo completar. Inténtalo otra vez.')); }
    finally { setBusy(false); }
  };
  const toggle = (current: number[], update: (v: number[]) => void, i: number) => {
    if (current.includes(i)) { update(current.filter(n => n !== i)); playCue('jaipur', 'select'); }
    else if (current.length < 5) { update([...current, i].sort((a, b) => a - b)); playCue('jaipur', 'select'); }
  };
  const cardKey = (card: unknown, fallback: string) => String(bag(card).id ?? fallback);
  const handSig = hand.join('|');
  const roundKey = `${playerId}:jaipur:${Number(board.round ?? 1)}`;

  return <main className="jaipur-board" aria-label={text(language, '자이푸르 게임판', 'Mesa de Jaipur')}>
    <header className="jp-topline">
      <div><h2>{text(language, '자이푸르', 'Jaipur')}</h2><p>{text(language, '상품을 모으고, 기회를 읽고, 먼저 두 라운드를 차지하세요.', 'Reúne mercancías, aprovecha el mercado y gana dos rondas.')}</p></div>
      <div className="jp-round-pill"><span>{text(language, '라운드', 'Ronda')}</span><strong>{Number(board.round ?? 1)}</strong><span>/ 3</span></div>
    </header>

    <section className="jp-scorebar" aria-label={text(language, '점수와 낙타 현황', 'Puntos y camellos')} data-jaipur-zone="scores">
      {(['p1', 'p2'] as PlayerId[]).map((seat, index) => <article key={seat} className={`jp-score-seat ${seat === playerId ? 'is-you' : ''} ${view?.turn === seat && !view?.result ? 'is-turn' : ''}`} data-jaipur-zone={`tokens-${seat}`} data-jaipur-player-id={seat}>
        <span className="jp-seat-mark" aria-hidden="true">{index ? 'B' : 'A'}</span><div className="jp-score-main"><small>{playerLabel(seat)}{view?.turn === seat && !view?.result ? ` · ${seat === playerId ? text(language, '내 차례', 'Tu turno') : text(language, '상대 차례', 'Turno rival')}` : ''}</small><strong><GameValue value={Number(tokens[seat] ?? 0)} resetKey={`${roundKey}:${seat}:score`}/><span>{text(language, '점', 'pts')}</span></strong></div>
        <div className="jp-score-side"><span><JaipurCamelAward aria-hidden="true"/> {Number(herdCounts[seat] ?? 0)}</span><span>{text(language, '라운드 승리', 'Rondas ganadas')} <b><GameValue value={Number(wins[seat] ?? 0)} resetKey={`${playerId}:jaipur:wins:${seat}`}/>/2</b></span><span className="jp-badge-count">{text(language, '낙타 다수', 'Mayoría de camellos')} <b>{Number(badges[seat] ?? 0)}</b></span></div>
      </article>)}
    </section>

    {roundSummary && <aside className="jp-round-result" role="status"><b>{roundSummary.winner === playerId ? text(language, '라운드 승리', 'Ganaste la ronda') : roundSummary.winner === 'draw' ? text(language, '라운드 무승부', 'Ronda empatada') : text(language, '상대가 라운드 승리', 'Tu pareja ganó la ronda')}</b><div className="jp-round-breakdown">{(['p1', 'p2'] as PlayerId[]).map(seat => { const item = bag(roundSummary.breakdown?.[seat]); return <span key={seat}><b>{playerLabel(seat)}</b>{item.detailed ? <small>{text(language, '상품', 'Mercancías')} {Number(item.goods ?? 0)} · {text(language, '보너스', 'Bonos')} {Number(item.bonus ?? 0)} · {text(language, '낙타', 'Camellos')} {Number(item.camel ?? 0)} · <strong>{Number(item.total ?? 0)}</strong></small> : <small>{text(language, '합산 점수', 'Puntos combinados')} <strong>{Number(item.total ?? 0)}</strong></small>}</span>; })}</div></aside>}

    {events.length > 0 && <ol className="jp-history" aria-label={text(language, '최근 거래', 'Actividad reciente')}>{events.map((event: Bag) => <li key={Number(event.sequence)} data-sequence={Number(event.sequence)}><span className="jp-history-title">{event.title?.[language] ?? ''}</span><span>{eventDetail(event)}</span></li>)}</ol>}

    <section className="jp-market-section" aria-label={text(language, '공개 시장', 'Mercado público')}>
      <div className="jp-section-heading"><div><h3>{text(language, '시장', 'Mercado')}</h3></div><span className="jp-deck" data-jaipur-zone="deck">{text(language, '남은 덱', 'Mazo')} <b>{Number(board.deckCount ?? 0)}</b></span></div>
      <div className="jp-market" data-jaipur-zone="market">
        {market.map((good, index) => {
          const stableId = cardKey(marketCards[index], `${board.round ?? 1}-${good}-${index}`);
          const single = choices.find(c => c.action.type === 'take' && c.action.payload?.mode === 'single' && list(c.action.payload?.indices).length === 1 && Number(list(c.action.payload?.indices)[0]) === index);
          const camel = good === 'camel';
          const selected = marketSelection.includes(index);
          const enabled = active && !busy && (mode === 'take' ? camel ? Boolean(camelChoice) : Boolean(single) : mode === 'exchange' ? !camel && canExchange : false);
          const label = `${text(language, '시장 카드', 'Carta del mercado')}: ${names[good][language]}`;
          const prompt = mode === 'sell' ? text(language, '판매 모드', 'Modo de venta') : mode === 'exchange' ? camel ? text(language, '낙타는 교환할 수 없어요', 'Los camellos no se intercambian') : text(language, selected ? '교환에서 빼기' : '교환에 선택', selected ? 'Quitar del cambio' : 'Elegir para cambio') : camel ? camelChoice ? text(language, '무리로 가져오기', 'Llévalos en grupo') : text(language, '가져올 수 없음', 'No disponible') : single ? text(language, '한 장 가져오기', 'Tomar una') : text(language, '가져올 수 없음', 'No disponible');
            return <button type="button" key={stableId} data-jaipur-card-id={stableId} className={`jp-goods-card jp-market-card ${camel ? 'is-camel' : `is-${good}`} ${selected ? 'is-selected' : ''}`} aria-label={label} aria-pressed={mode === 'exchange' ? selected : undefined} disabled={!enabled} onClick={() => mode === 'exchange' && !camel ? toggle(marketSelection, setMarketSelection, index) : run(camel ? camelChoice : single)}>
            <JaipurGoodArt good={good} variant={jaipurCardVariant(stableId)} className="jp-good-illustration" decorative/><span className="jp-card-name">{names[good][language]}</span><span className="jp-card-prompt">{prompt}</span>
          </button>;
        })}
        {market.length === 0 && <p className="jp-empty">{text(language, '시장이 비었어요.', 'El mercado está vacío.')}</p>}
      </div>
        <div className="jp-market-footer">
        <div className="jp-mode-tabs" role="group" aria-label={text(language, '행동 선택', 'Elige una acción')}>
          <button type="button" className={mode === 'take' ? 'is-current' : ''} aria-pressed={mode === 'take'} disabled={!active || busy} onClick={() => { setMode('take'); setHandSelection([]); setMarketSelection([]); }}>{text(language, '가져오기', 'Tomar')}</button>
          <button type="button" className={mode === 'exchange' ? 'is-current' : ''} aria-pressed={mode === 'exchange'} disabled={!active || busy || !canExchange} onClick={() => { setMode('exchange'); setHandSelection([]); setMarketSelection([]); }}>{text(language, '교환', 'Intercambiar')}</button>
          <button type="button" className={mode === 'sell' ? 'is-current' : ''} aria-pressed={mode === 'sell'} disabled={!active || busy || saleChoices.length === 0} onClick={() => { setMode('sell'); setHandSelection([]); setMarketSelection([]); }}>{text(language, '판매', 'Vender')}</button>
        </div>
        {mode === 'exchange' && <div className="jp-exchange-controls"><p>{text(language, '손패와 시장에서 같은 수의 상품을 2–5장 골라요. 낙타는 교환할 수 없어요.', 'Elige la misma cantidad, de 2 a 5, en tu mano y el mercado. Los camellos no se intercambian.')}</p><span>{text(language, `손패 ${handSelection.length} · 시장 ${marketSelection.length}`, `${handSelection.length} en mano · ${marketSelection.length} en mercado`)}</span><button type="button" className="jp-primary-action" disabled={!exchangeChoice || busy} onClick={() => run(exchangeChoice)}>{exchangeChoice ? choiceLabel(exchangeChoice, language) : text(language, '같은 수의 2–5장을 선택하세요', 'Elige la misma cantidad, de 2 a 5')}</button></div>}
        {mode === 'sell' && <div className="jp-sale-controls" aria-label={text(language, '판매할 상품과 수량', 'Mercancías y cantidades para vender')}>
          {goods.map(good => {
            const options = saleChoices.filter(c => c.action.payload?.good === good);
            if (!options.length) return null;
            const pile = list(piles[good]);
            return <article className={`jp-sale-card is-${good}`} key={good}><div className="jp-sale-title"><JaipurGoodArt good={good} className="jp-sale-art" decorative/><b>{names[good][language]}</b><span>{text(language, `최소 ${good === 'diamond' || good === 'gold' || good === 'silver' ? 2 : 1}장`, `Mín. ${good === 'diamond' || good === 'gold' || good === 'silver' ? 2 : 1}`)}</span></div>{options.map(c => {
              const count = Number(c.action.payload?.count ?? 0), topValue = pile.length ? Number(pile[0]) : 0, hasBonus = count >= 3 && Number(bonusCounts[count >= 5 ? 5 : count] ?? 0) > 0;
              return <button type="button" key={count} className="jp-sale-option" disabled={!active || busy} onClick={() => run(c)}><span>{text(language, `${count}장`, `${count} cartas`)}</span><b>{text(language, `${count}장 판매`, `Vender ${count}`)}</b><small>{jaipurSalePreview(language, count, topValue, hasBonus)}</small></button>;
            })}</article>;
          })}
          {saleChoices.length === 0 && <p>{text(language, '판매할 수 있는 상품이 없어요.', 'No tienes mercancías que puedas vender.')}</p>}
        </div>}
        {error && <p className="jp-action-error" role="alert">{error}</p>}
        {busy && <p className="jp-busy" role="status">{text(language, '처리 중…', 'Procesando…')}</p>}
      </div>
    </section>

    <section className="jp-opponent-row" aria-label={text(language, '상대 손패', 'Mano de tu rival')} data-jaipur-zone="opponent-hand"><div><span className="jp-eyebrow">{text(language, '상대 손패', 'Mano rival')}</span><b>{text(language, '상대 손패는 뒷면으로 표시돼요.', 'Las cartas rivales se muestran boca abajo.')}</b></div><span className="jp-opponent-count">{Number(view?.opponentCount ?? 0)} <small>{text(language, '장', 'cartas')}</small></span><div className="jp-card-backs" aria-hidden="true">{Array.from({ length: Math.min(7, Number(view?.opponentCount ?? 0)) }, (_, i) => <i key={i}/>)}</div></section>

    <section className="jp-player-area">
      <article className="jp-player-hand" aria-label={text(language, '내 손패', 'Tu mano')}>
        <div className="jp-section-heading"><div><h3>{text(language, '내 손패', 'Tu mano')} <small>{hand.length} / 7</small></h3></div><p>{text(language, '낙타는 손패 제한에 포함되지 않아요.', 'Los camellos no cuentan en el límite de la mano.')}</p></div>
        <div className="jp-hand-cards" data-jaipur-zone="hand" data-jaipur-player-id={playerId}>
          {hand.map((good, index) => {
            const stableId = cardKey(handCards[index], `${board.round ?? 1}-${good}-${index}-${handSig}`), selected = handSelection.includes(index);
            return <button type="button" key={stableId} data-jaipur-card-id={stableId} className={`jp-goods-card jp-hand-card is-${good} ${selected ? 'is-selected' : ''}`} aria-label={`${names[good][language]}${mode === 'exchange' ? ` ${index + 1}` : ''}`} aria-pressed={mode === 'exchange' ? selected : undefined} disabled={!active || busy || mode !== 'exchange'} onClick={() => mode === 'exchange' && toggle(handSelection, setHandSelection, index)}><JaipurGoodArt good={good} variant={jaipurCardVariant(stableId)} className="jp-good-illustration" decorative/><span className="jp-card-name">{names[good][language]}</span>{mode === 'exchange' && <span className="jp-card-prompt">{selected ? text(language, '교환 선택됨', 'Seleccionada') : text(language, '교환 선택', 'Elegir')}</span>}</button>;
          })}
          {!hand.length && <p className="jp-empty">{text(language, '손패가 비었어요.', 'No tienes cartas en la mano.')}</p>}
        </div>
      </article>
      <article className="jp-herd" data-jaipur-zone={`herd-${playerId}`} data-jaipur-player-id={playerId}><div><h3>{text(language, '낙타 무리', 'Tu manada')}</h3><p>{text(language, '손패 제한에 포함되지 않아요.', 'No cuenta para el límite de cartas.')}</p></div><strong><JaipurCamelAward aria-hidden="true"/><GameValue value={Number(herdCounts[playerId] ?? 0)} resetKey={`${playerId}:jaipur:${board.round}:herd`}/></strong></article>
    </section>

    <section className="jp-rival-herd" data-jaipur-zone={`herd-${playerId === 'p1' ? 'p2' : 'p1'}`}><JaipurCamelAward aria-hidden="true"/><span>{text(language, '상대 낙타 무리', 'Manada rival')}</span><b>{Number(herdCounts[playerId === 'p1' ? 'p2' : 'p1'] ?? 0)}</b></section>

    <section className="jp-supply-area">
      <div className="jp-goods-piles" data-jaipur-zone="tokens"><div className="jp-section-heading"><div><h3>{text(language, '상품 토큰', 'Fichas de mercancía')}</h3></div><p>{text(language, '가장 위의 점수가 먼저 지급돼요.', 'Se toma primero la ficha de mayor valor.')}</p></div>
        <div className="jp-pile-grid" data-jaipur-zone="sale">{goods.map(good => { const pile = list(piles[good]), top = pile.length ? Number(pile[0]) : null; return <div className={`jp-pile is-${good}`} key={good}><span className="jp-pile-name">{names[good][language]}</span><div className="jp-pile-count" aria-label={language === 'ko' ? `남음 ${pile.length}개` : `Quedan ${pile.length}`}><small>{text(language, '남음', 'Quedan')}</small><strong>{pile.length}</strong>{language === 'ko' && <small>개</small>}</div><div className="jp-pile-next">{top === null ? <span>—</span> : <><span>{text(language, '다음', 'Siguiente:')}</span><JaipurCoin good={good} value={top} language={language}/><b>{top}{text(language, '점', ' pts')}</b></>}</div></div>; })}</div>
      </div>
      <div className="jp-bonus-piles" data-jaipur-zone="bonus"><div className="jp-section-heading"><div><h3>{text(language, '판매 보너스', 'Bonos por venta')}</h3></div></div>
        <div className="jp-bonus-row">{([3, 4, 5] as const).filter(count => Number(bonusCounts[count] ?? 0) > 0).map(count => <div className="jp-bonus-stack" key={count}><JaipurBonusArt revealed={false} count={Number(bonusCounts[count] ?? 0)} language={language} className="jp-bonus-art"/><span><b>{count === 5 ? '5+' : count}</b><small>{text(language, '장 판매', 'cartas vendidas')}</small><strong>{Number(bonusCounts[count] ?? 0)} <small>{text(language, '남음', 'quedan')}</small></strong></span></div>)}</div>
      </div>
    </section>

    {result.winner && <section className={`jp-final-result ${result.winner === playerId ? 'is-win' : result.winner === 'draw' ? 'is-draw' : 'is-loss'}`} data-game="jaipur" data-outcome={result.winner === playerId ? 'win' : result.winner === 'draw' ? 'draw' : 'lose'} role="status"><span>{result.winner === playerId ? text(language, '축하해요', '¡Ganaste!') : result.winner === 'draw' ? text(language, '무승부예요', 'Empate') : text(language, '상대가 이겼어요', 'Ganó tu pareja')}</span><strong>{text(language, `라운드 ${Number(result.scores?.[playerId] ?? wins[playerId] ?? 0)} : ${Number(result.scores?.[playerId === 'p1' ? 'p2' : 'p1'] ?? wins[playerId === 'p1' ? 'p2' : 'p1'] ?? 0)}`, `Rondas ${Number(result.scores?.[playerId] ?? wins[playerId] ?? 0)} : ${Number(result.scores?.[playerId === 'p1' ? 'p2' : 'p1'] ?? wins[playerId === 'p1' ? 'p2' : 'p1'] ?? 0)}`)}</strong></section>}
    <JaipurMotion events={list(view?.log ?? board.actionLog)} language={language} playerId={playerId}/>
  </main>;
}
