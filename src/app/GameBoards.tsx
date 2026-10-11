import splendorArt from '../../public/images/splendor/card-map.json';
import { GameValue } from './GameValue';
import type { GameAction, GameId, Language, PlayerId } from '../core/types';
import '../styles/hwatu-card-premium.css';

type Value = Record<string, any>;
type SharedProps = { game: GameId | string; language: Language; playerId: PlayerId };
type Choice = { label: {ko: string; es: string}; action: GameAction };
type PublicGameBoardProps = SharedProps & { board: unknown; choices?: Choice[]; runAction?: (action: GameAction) => void };
type GameHandProps = { game: GameId | string; hand: unknown; language: Language; choices?: Choice[]; runAction?: (action: GameAction) => void };

const goods = ['diamond', 'gold', 'silver', 'cloth', 'spice', 'leather', 'camel'] as const;
const gems = ['white', 'blue', 'green', 'red', 'black', 'gold'] as const;
const marblePath = [
  [6, 5], [5, 5], [4, 5], [3, 5], [2, 5], [1, 5],
  [1, 4], [1, 3], [1, 2], [1, 1], [2, 1], [3, 1],
  [4, 1], [5, 1], [6, 1], [6, 2], [6, 3], [6, 4],
] as const;

const copy = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;
const safeRecord = (value: unknown): Value => value && typeof value === 'object' && !Array.isArray(value) ? value as Value : {};
const safeArray = (value: unknown): any[] => Array.isArray(value) ? value : [];
const nameGood = (good: string, language: Language) => ({
  diamond: copy(language, '다이아몬드', 'Diamantes'), gold: copy(language, '금', 'Oro'),
  silver: copy(language, '은', 'Plata'), cloth: copy(language, '옷감', 'Tela'),
  spice: copy(language, '향신료', 'Especias'), leather: copy(language, '가죽', 'Cuero'),
  camel: copy(language, '낙타', 'Camellos'),
}[good] ?? good);
const gemName = (gem: string, language: Language) => ({
  white: copy(language, '흰색', 'Blanco'), blue: copy(language, '파랑', 'Azul'),
  green: copy(language, '초록', 'Verde'), red: copy(language, '빨강', 'Rojo'),
  black: copy(language, '검정', 'Negro'), gold: copy(language, '금', 'Oro'),
}[gem] ?? gem);

export function PublicGameBoard({ game, board: rawBoard, language, playerId, choices = [], runAction }: PublicGameBoardProps) {
  const board = safeRecord(rawBoard);
  if (game === 'jaipur') return <JaipurBoard board={board} language={language} playerId={playerId} />;
  if (game === 'splendor') return <SplendorBoard board={board} language={language} playerId={playerId} choices={choices} runAction={runAction} />;
  if (game === 'marble') return <MarbleBoard board={board} language={language} playerId={playerId} />;
  if (game === 'minhwatu') return <HwatuBoard board={board} language={language} playerId={playerId} choices={choices} runAction={runAction} />;
  if (game === 'davinci' && Array.isArray(board.opponentTiles)) return <DaVinciPublicBoard board={board} language={language} />;
  // `runAction` is accepted so parent integrations can keep one stable board API;
  // choices remain in the shared legal-action controls, which know current phase.
  void runAction;
  return null;
}

export function GameHand({ game, hand: rawHand, language, choices = [], runAction }: GameHandProps) {
  if (game === 'davinci') {
    const tiles = safeArray(rawHand);
    if (!tiles.length) return null;
    return <div className="gb-hand gb-hand-davinci" aria-label={copy(language, '내 타일', 'Tus fichas')}>
      {tiles.map((item, index) => {
        const tile = safeRecord(item);
        return <div className={`gb-number-tile gb-number-${tile.color === 'white' ? 'white' : 'black'}`} key={tile.id ?? index}>
          <b>{Number.isFinite(tile.value) ? tile.value : '—'}</b>
          <small>{index + 1}</small>
          {tile.revealed && <span className="gb-revealed">{copy(language, '노출', 'Revelada')}</span>}
        </div>;
      })}
    </div>;
  }

  if (game === 'jaipur') {
    const cards = safeArray(rawHand);
    if (!cards.length) return null;
    return <div className="gb-hand gb-hand-jaipur">
      {cards.map((item, index) => <GoodCard key={`${String(item)}-${index}`} good={String(item)} language={language} compact />)}
    </div>;
  }

  if (game === 'splendor') {
    const hand = safeRecord(rawHand);
    const tokens = safeRecord(hand.tokens);
    const bonuses = safeRecord(hand.bonuses);
    const reserved = safeArray(hand.reserved);
    if (!Object.keys(tokens).length && !Object.keys(bonuses).length && !reserved.length) return null;
    return <section className="gb-own-tableau">
      <div className="gb-tableau-top"><strong>{copy(language, '내 보석과 개발', 'Tus gemas y desarrollo')}</strong><span>{Number(hand.points ?? 0) + Number(hand.nobles ?? 0)} {copy(language, '점', 'pts')}</span></div>
      <GemBank values={tokens} language={language} heading={copy(language, '보유 토큰', 'Fichas')} />
      <div className="gb-bonuses" aria-label={copy(language, '개발 보너스', 'Bonificaciones de desarrollo')}>
        {gems.slice(0, 5).map(gem => <span className={`gb-gem-bonus gb-gem-${gem}`} key={gem} title={`${gemName(gem, language)} +${Number(bonuses[gem] ?? 0)}`}><GemIcon gem={gem}/><b>{Number(bonuses[gem] ?? 0)}</b></span>)}
        <small>{copy(language, '개발 보너스', 'Bonificaciones')}</small>
      </div>
      {reserved.length > 0 && <div className="gb-reserved-row"><span className="gb-row-label">{copy(language, '예약 카드', 'Reservadas')} <b>{reserved.length}/3</b></span><div className="gb-reserved-cards">{reserved.map((card, i) => <div key={card.id ?? i}><SplendorCardView card={safeRecord(card)} language={language} reserved/><CardActions choices={choices.filter(option => option.action.type === 'buy' && option.action.payload?.source === 'reserved' && option.action.payload?.index === i)} language={language} runAction={runAction}/></div>)}</div></div>}
    </section>;
  }

  if (game === 'marble') {
    const hand = safeRecord(rawHand);
    if (typeof hand.money !== 'number' && typeof hand.position !== 'number') return null;
    return <div className="gb-marble-own"><span>{copy(language, '내 현금', 'Tu efectivo')} <b>{Number(hand.money ?? 0).toLocaleString(language === 'ko' ? 'ko-KR' : 'es-DO')}</b></span><span>{copy(language, '현재 칸', 'Casilla')} <b>{Number(hand.position ?? 0) + 1}</b></span></div>;
  }

  if (game === 'minhwatu') {
    const cards = safeArray(rawHand);
    if (!cards.length) return null;
    return <div className="gb-hand gb-hand-hwatu">{cards.map((card, i) => {
      const legal = choices.filter(option => option.action.type === 'play' && option.action.payload?.index === i);
      return <div className={legal.length ? 'gb-hwatu-playable' : ''} key={card.id ?? i}>
        {legal.length > 0 && <span className="gb-hwatu-playable-mark" aria-hidden="true">⌄</span>}
        <HwatuCard card={safeRecord(card)} language={language}/>
        <CardActions choices={legal} language={language} runAction={runAction}/>
      </div>;
    })}</div>;
  }
  return null;
}

function JaipurBoard({ board, language, playerId }: { board: Value; language: Language; playerId: PlayerId }) {
  const market = safeArray(board.market);
  const tokens = safeRecord(board.tokens);
  const piles = safeRecord(board.piles);
  const camel = safeRecord(board.herdCounts);
  const rounds = safeRecord(board.roundsWon);
  const badges = safeRecord(board.camelBadges);
  const bonusCounts = safeRecord(board.bonusTileCounts);
  return <section className="gb-board gb-jaipur" aria-label={copy(language, '자이푸르 시장', 'Mercado de Jaipur')}>
    <div className="gb-board-heading"><div><span className="gb-kicker">{copy(language, '오늘의 시장', 'EL MERCADO')}</span><h3>{copy(language, '자이푸르 시장', 'Mercado de Jaipur')}</h3></div><span className="gb-round">{copy(language, '라운드', 'Ronda')} <b>{Number(board.round ?? 1)}</b> <i>/ 3</i></span></div>
    <div className="gb-jaipur-scores">
      {(['p1', 'p2'] as const).map((seat, i) => <div className={`gb-score-chip ${seat === 'p1' ? 'seat-one' : 'seat-two'}`} key={seat}><span className="gb-seat-mark">{i === 0 ? '01' : '02'}</span><span><small>{seat === playerId ? copy(language, '나', 'Tú') : copy(language, '상대', 'Rival')}</small><b>{Number(tokens[seat] ?? 0)} <em>{copy(language, '점', 'pts')}</em></b></span><span className="gb-score-side"><GoodIcon good="camel"/> {Number(camel[seat] ?? 0)} <i>·</i> {Number(rounds[seat] ?? 0)}/2</span></div>)}
    </div>
    <div className="gb-market-head"><span>{copy(language, '공개 시장', 'Mercado abierto')}</span><small>{copy(language, '남은 카드', 'Mazo')} <b>{Number(board.deckCount ?? 0)}</b></small></div>
    <div className="gb-jaipur-market">
      {market.map((good: string, index: number) => <GoodCard key={`${good}-${index}`} good={good} language={language} />)}
      {!market.length && <div className="gb-empty">{copy(language, '시장이 비었어요', 'El mercado está vacío')}</div>}
    </div>
    <div className="gb-goods-row">
      {goods.filter(good => good !== 'camel').map(good => {
        const values = safeArray(piles[good]);
        return <div className={`gb-goods-pile gb-good-${good}`} key={good} title={nameGood(good, language)}>
          <GoodIcon good={good}/><b>{values.length}</b><small>{values[0] === undefined ? '—' : `${values[0]} ${copy(language, '점', 'pts')}`}</small>
        </div>;
      })}
    </div>
    <div className="gb-jaipur-foot"><span><GoodIcon good="camel"/>{copy(language, '낙타 배지', 'Insignias de camello')} <b>{Number(badges.p1 ?? 0)} : {Number(badges.p2 ?? 0)}</b></span><span>{copy(language, '판매 보너스', 'Bonos de venta')} <b>{[3, 4, 5].map(n => `${n}×${Number(bonusCounts[n] ?? 0)}`).join(' · ')}</b></span></div>
  </section>;
}

function SplendorBoard({ board, language, playerId, choices, runAction }: { board: Value; language: Language; playerId: PlayerId; choices: Choice[]; runAction?: (action: GameAction) => void }) {
  const bank = safeRecord(board.bank);
  const market = safeRecord(board.market);
  const nobles = safeRecord(board.nobles);
  const score = safeRecord(board.score);
  const reservedCount = Number(board.reservedOpponentCount ?? 0);
  return <section className="gb-board gb-splendor" aria-label={copy(language, '보석 시장과 개발 카드', 'Mercado de gemas y cartas de desarrollo')}>
    <div className="gb-board-heading"><div><span className="gb-kicker">{copy(language, '보석 은행', 'BANCO DE GEMAS')}</span><h3>{copy(language, '개발 시장', 'Mercado de desarrollo')}</h3></div><div className="gb-splendor-scores">{(['p1', 'p2'] as const).map((seat) => <span className={seat === 'p1' ? 'seat-one' : 'seat-two'} key={seat}><small>{seat === playerId ? copy(language, '나', 'Tú') : copy(language, '상대', 'Rival')}</small><b>{Number(score[seat] ?? 0)}</b></span>)}</div></div>
    <GemBank values={bank} language={language} heading={copy(language, '은행 토큰', 'Banco')} />
    <div className="gb-card-tiers">
      {([3, 2, 1] as const).map(tier => <section className={`gb-tier gb-tier-${tier}`} key={tier}>
        <div className="gb-tier-title"><span className="gb-tier-number">{String(tier).padStart(2, '0')}</span><b>{copy(language, `단계 ${tier}`, `Nivel ${tier}`)}</b><small>{copy(language, '앞면 공개', 'Cartas visibles')}</small></div>
        <div className="gb-card-row">{safeArray(market[tier]).map((card, index) => <div key={card.id ?? index}><SplendorCardView card={safeRecord(card)} language={language}/><CardActions choices={choices.filter(option => option.action.payload?.tier === tier && option.action.payload?.index === index && (option.action.type === 'reserve' || option.action.type === 'buy'))} language={language} runAction={runAction}/></div>)}{!safeArray(market[tier]).length && <span className="gb-empty">{copy(language, '카드가 없어요', 'Sin cartas')}</span>}</div>
      </section>)}
    </div>
    <div className="gb-nobles-head"><span>{copy(language, '방문할 귀족', 'Nobles disponibles')}</span><small>{copy(language, '조건을 채우면 방문해요', 'Visitan al cumplir requisitos')}</small></div>
    <div className="gb-nobles">{Object.entries(nobles).map(([id, value]) => {
      const noble = safeRecord(value); const requirements = safeRecord(noble.requirement);
      const art = splendorArt.nobles.find(item => item.engineId === id);
      const description = `${copy(language, '귀족', 'Noble')} +${Number(noble.points ?? 3)}, ${gems.slice(0, 5).filter(gem => Number(requirements[gem] ?? 0) > 0).map(gem => `${gemName(gem, language)} ${requirements[gem]}`).join(', ')}`;
      return <div className="gb-noble gb-noble-original" key={id} title={description}>{art && <img src={`/images/splendor/${art.src}`} alt={description} width="250" height="251"/>}</div>;
    })}{!Object.keys(nobles).length && <span className="gb-empty">{copy(language, '남은 귀족이 없어요', 'No quedan nobles')}</span>}</div>
    {reservedCount > 0 && <div className="gb-rival-reserved"><span className="gb-rival-dot"/>{copy(language, '상대 예약 카드', 'Reservadas del rival')} <b>{reservedCount}/3</b></div>}
  </section>;
}

function MarbleBoard({ board, language, playerId }: { board: Value; language: Language; playerId: PlayerId }) {
  const tiles = safeArray(board.tiles);
  const positions = safeRecord(board.positions);
  const money = safeRecord(board.money);
  const active = board.turn as PlayerId | undefined;
  return <section className="gb-board gb-marble-board" aria-label={copy(language, '마블 순환 보드', 'Tablero circular de Marble')}>
    <div className="gb-board-heading"><div><span className="gb-kicker">{copy(language, '두 사람의 순환 경로', 'RECORRIDO PARA DOS')}</span><h3>{copy(language, '마블 보드', 'Tablero Marble')}</h3></div><div className="gb-roll">{safeArray(board.lastRoll).map((die: number, i: number) => <span key={i}>{die}</span>)}</div></div>
    <div className="gb-marble-wrap"><div className="gb-marble-ring">
      {tiles.map((rawTile, index) => {
        const tile = safeRecord(rawTile); const owner = tile.owner as PlayerId | null;
        const currentPlayers = (['p1', 'p2'] as const).filter(seat => Number(positions[seat]) === index);
        const kind = String(tile.kind ?? 'rest');
        const group = String(tile.group ?? kind);
        const cellLang = safeRecord(tile.name)[language] ?? safeRecord(tile.name).ko ?? kind;
        return <article className={`gb-marble-cell gb-cell-${kind} gb-group-${group} ${owner ? `owned-by-${owner}` : ''} ${currentPlayers.length ? 'has-player' : ''}`} style={{ gridColumn: marblePath[index]?.[0], gridRow: marblePath[index]?.[1] }} key={tile.index ?? index}>
          <span className="gb-cell-index">{String(index).padStart(2, '0')}</span>
          <b className="gb-cell-name">{String(cellLang)}</b>
          {kind === 'property' && <><span className="gb-property-facts">{copy(language, '구매', 'Compra')} {Number(tile.price ?? 0)}</span><span className="gb-property-facts">{copy(language, '임대', 'Renta')} {Number(tile.rent ?? 0)}{Number(tile.houses ?? 0) ? ` × ${Number(tile.houses) + 1}` : ''}</span>{Number(tile.houses ?? 0) > 0 && <span className="gb-house-row">{Array.from({ length: Math.min(2, Number(tile.houses)) }, (_, i) => <i key={i}/>)}</span>}</>}
          {owner && <span className={`gb-owner-badge owner-${owner}`}>{owner === playerId ? copy(language, '내 소유', 'Tuya') : copy(language, '상대 소유', 'Rival')}</span>}
          {!!currentPlayers.length && <span className="gb-player-markers">{currentPlayers.map(seat => <i className={`gb-player-marker marker-${seat} ${seat === active ? 'is-active' : ''}`} title={seat === playerId ? copy(language, '내 말', 'Tu ficha') : copy(language, '상대 말', 'Ficha rival')} key={seat}>{seat === playerId ? copy(language, '나', 'Tú') : copy(language, '상', 'R')}</i>)}</span>}
        </article>;
      })}
      <div className="gb-marble-center"><div className="gb-marble-center-brand"><span>m.</span><b>MARBLE</b></div><div className="gb-marble-wallets">{(['p1', 'p2'] as const).map((seat) => <div className={seat === playerId ? 'is-you' : ''} key={seat}><span>{seat === playerId ? copy(language, '나', 'Tú') : copy(language, '상대', 'Rival')}</span><b>{Number(money[seat] ?? 0).toLocaleString(language === 'ko' ? 'ko-KR' : 'es-DO')}</b></div>)}</div><small>{copy(language, '공공 은행 잔액이 아닌 각자의 현금', 'Efectivo individual de cada persona')}</small></div>
    </div></div>
  </section>;
}

function HwatuBoard({ board, language, playerId, choices, runAction }: { board: Value; language: Language; playerId: PlayerId; choices: Choice[]; runAction?: (action: GameAction) => void }) {
  const table = safeArray(board.table);
  const captures = safeRecord(board.captures);
  const scores = safeRecord(board.scores);
  const pending = safeRecord(board.pendingCard);
  const remainingDeck = Number(board.remainingDeck ?? 0);
  return <section className="gb-board gb-hwatu-board" aria-label={copy(language, '화투 바닥', 'Mesa de hwatu')}>
    <div className="gb-board-heading"><div><span className="gb-kicker">{copy(language, '같은 달을 짝지어요', 'EMPAREJA POR MES')}</span><h3>{copy(language, '화투 바닥', 'Mesa de hwatu')}</h3></div></div>
    <div className="gb-hwatu-layout">
      <aside className="gb-hwatu-players" aria-label={copy(language, '점수와 가져온 패', 'Puntos y capturas')}>
        {(['p1', 'p2'] as const).map(seat => {
          const won = safeArray(captures[seat]);
          return <section className={`gb-hwatu-player ${seat === playerId ? 'is-you' : ''}`} key={seat} aria-label={seat === playerId ? copy(language, '내 점수와 가져온 패', 'Tus puntos y capturas') : copy(language, '상대 점수와 가져온 패', 'Puntos y capturas rivales')}>
            <div className="gb-hwatu-player-head"><span className={`gb-hwatu-seat seat-${seat}`}>{seat === playerId ? copy(language, '나', 'Tú') : copy(language, '상대', 'Rival')}</span><b><GameValue value={Number(scores[seat] ?? 0)} resetKey={`hwatu:${playerId}:${seat}`}/> <small>{copy(language, '점', 'pts')}</small></b></div>
            <div className="gb-hwatu-capture-head"><span>{copy(language, '가져온 패', 'Capturas')}</span><b>{won.length}</b></div>
            <div className="hwatu-category-counts">{(['bright','animal','ribbon','plain'] as const).map(kind => <span key={kind}>{kinds[kind][language]} <b>{won.filter(card => card.kind === kind).length}</b></span>)}</div>
            {won.length > 0 ? <details className="hwatu-capture-details"><summary>{copy(language, '가져온 패 펼쳐 보기', 'Ver las cartas capturadas')}</summary><div className="gb-hwatu-capture-rack">{[...won].sort((a,b) => a.month-b.month).map((card, i) => <div className="gb-hwatu-capture-card" key={card.id ?? i}><HwatuCard card={safeRecord(card)} language={language}/></div>)}</div></details> : <p className="gb-hwatu-no-captures">{copy(language, '아직 없어요', 'Sin capturas')}</p>}
          </section>;
        })}
      </aside>
      <section className="gb-hwatu-play" aria-label={copy(language, '공개된 카드와 더미', 'Cartas visibles y mazo')}>
        <div className="gb-hwatu-center-head"><div><span className="gb-kicker">{copy(language, '공개된 카드', 'CARTAS EN MESA')}</span><b>{copy(language, '같은 달 카드를 선택해요', 'Elige una carta del mismo mes')}</b></div><div className="gb-hwatu-deck" aria-label={`${copy(language, '남은 더미', 'Cartas en el mazo')}: ${remainingDeck}`}><span aria-hidden="true" className="gb-hwatu-deck-stack"><i/><i/><i/></span><span>{copy(language, '남은 더미', 'Mazo')}<b>{remainingDeck}</b></span></div></div>
        {!!pending.month && <div className="gb-pending-draw"><div><span className="gb-kicker">{copy(language, '이번 차례에 공개된 카드', 'CARTA REVELADA')}</span><b>{copy(language, '짝을 찾으세요', 'Busca su pareja')}</b></div><HwatuCard card={pending} language={language}/></div>}
        <div className="gb-hwatu-table">{table.map((card, i) => {
          const legal = choices.filter(option => (option.action.type === 'capture' || option.action.type === 'play') && option.action.payload?.targetIndex === i);
          const capturesNow = legal;
          return <div className={`gb-hwatu-table-card ${legal.length ? 'is-capture-target' : ''}`} key={card.id ?? i}>
            <small className="gb-table-position">{i + 1}</small>{legal.length > 0 && <span className="gb-hwatu-target-mark">{copy(language, '선택 가능', 'Disponible')}</span>}
            <HwatuCard card={safeRecord(card)} language={language}/><CardActions choices={capturesNow} language={language} runAction={runAction}/>
          </div>;
        })}{!table.length && <span className="gb-empty">{copy(language, '바닥이 비었어요', 'La mesa está vacía')}</span>}</div>
      </section>
    </div>
  </section>;
}

function DaVinciPublicBoard({ board, language }: { board: Value; language: Language }) {
  const tiles = safeArray(board.opponentTiles);
  return <div className="gb-board gb-davinci-rival"><span>{copy(language, '상대 타일', 'Fichas rivales')}</span><div>{tiles.map((item, i) => {
    const tile = safeRecord(item);
    return <div className={`gb-number-tile gb-number-${tile.color === 'white' ? 'white' : 'black'}`} key={i}><b>{tile.revealed && Number.isFinite(tile.value) ? tile.value : '· ·'}</b><small>{i + 1}</small>{tile.revealed && <span className="gb-revealed">{copy(language, '공개', 'Revelada')}</span>}</div>;
  })}</div></div>;
}

function GemBank({ values, language, heading }: { values: Value; language: Language; heading: string }) {
  return <div className="gb-gem-bank"><span className="gb-row-label">{heading}</span><div>{gems.map(gem => <span className={`gb-gem-count gb-gem-${gem}`} key={gem} title={gemName(gem, language)}><GemIcon gem={gem}/><b>{Number(values[gem] ?? 0)}</b><small>{gemName(gem, language)}</small></span>)}</div></div>;
}

function SplendorCardView({ card, language, reserved = false }: { card: Value; language: Language; reserved?: boolean }) {
  const bonus = String(card.bonus ?? 'white');
  const cost = safeRecord(card.cost);
  const readableCost = gems.slice(0, 5).filter(gem => Number(cost[gem] ?? 0) > 0).map(gem => `${Number(cost[gem])} ${gemName(gem, language)}`).join(', ') || copy(language, '비용 없음', 'sin coste');
  const art = splendorArt.cards.find(item => item.engineId === card.id);
  const description = `${copy(language, '카드', 'Carta')} ${String(card.id ?? '')}, ${gemName(bonus, language)} +1, ${Number(card.points ?? 0)} ${copy(language, '점', 'puntos')}, ${readableCost}`;
  return <article className={`gb-splendor-card gb-original-face ${reserved ? 'is-reserved' : ''}`} title={description}>
    {art && <img src={`/images/splendor/${art.src}`} alt={description} width="250" height="350"/>}
    <small className="gb-card-reference">{reserved ? copy(language, '예약', 'Reservada') : `T${Number(card.tier ?? 1)}`} · {String(card.id ?? '').toUpperCase()}</small>
  </article>;
}

function CardActions({choices, language, runAction}: {choices: Choice[]; language: Language; runAction?: (action: GameAction) => void}) {
  if (!runAction || !choices.length) return null;
  // Multiple token-return plans stay in the shared action selector.
  if (choices.length > 2) return <small className="gb-card-action-note">{copy(language, '반환할 토큰을 아래에서 선택', 'Elige qué devolver abajo')}</small>;
  return <div className="gb-direct-actions">{choices.map((option,index) => <button type="button" key={index} title={option.label[language]} aria-label={option.label[language]} onClick={() => runAction(option.action)}>{option.action.type === 'buy' ? copy(language,'구매','Comprar') : option.action.type === 'reserve' ? copy(language,'예약','Reservar') : option.action.payload?.targetIndex !== undefined ? copy(language, `${Number(option.action.payload.targetIndex)+1}번`, `#${Number(option.action.payload.targetIndex)+1}`) : option.action.type === 'capture' ? copy(language,'가져오기','Capturar') : copy(language,'내기','Jugar')}</button>)}</div>;
}

function GoodCard({ good, language, compact = false }: { good: string; language: Language; compact?: boolean }) {
  return <article className={`gb-good-card gb-good-${good} ${compact ? 'is-compact' : ''}`} aria-label={nameGood(good, language)}>
    <span className="gb-good-art"><GoodIcon good={good}/></span>
    <b>{nameGood(good, language)}</b>
  </article>;
}

function GoodIcon({ good }: { good: string }) {
  const safeGood = goods.includes(good as typeof goods[number]) ? good : 'camel';
  return <span className={`gb-sprite-icon gb-good-sprite gb-good-sprite-${safeGood}`} aria-hidden="true" />;
}

function GemIcon({ gem }: { gem: string }) {
  const safeGem = gems.includes(gem as typeof gems[number]) ? gem : 'white';
  return <span className={`gb-gem-icon gb-sprite-icon gb-gem-sprite-${safeGem}`} aria-hidden="true" />;
}

const monthFlowers = ['솔 / pino', '매화 / ciruelo', '벚꽃 / cerezo', '등꽃 / glicinia', '창포 / iris', '모란 / peonía', '싸리 / trébol', '억새 / pampas', '국화 / crisantemo', '단풍 / arce', '오동 / paulownia', '비 / lluvia'];
const kinds: Record<string, { ko: string; es: string }> = {
  gwang: { ko: '광', es: 'brillante' }, bright: { ko: '광', es: 'brillante' }, 광: { ko: '광', es: 'brillante' },
  animal: { ko: '열끗', es: 'animal' }, yeolkkeut: { ko: '열끗', es: 'animal' }, 열끗: { ko: '열끗', es: 'animal' },
  ribbon: { ko: '띠', es: 'cinta' }, tti: { ko: '띠', es: 'cinta' }, 띠: { ko: '띠', es: 'cinta' },
  junk: { ko: '피', es: 'simple' }, pi: { ko: '피', es: 'simple' }, 피: { ko: '피', es: 'simple' }, plain: { ko: '피', es: 'simple' }, special: { ko: '특수', es: 'especial' },
};
export function HwatuCard({ card, language }: { card: Value; language: Language }) {
  const month = Math.max(1, Math.min(12, Number(card.month ?? 1)));
  const flowerValue = safeRecord(card.flower);
  const flower = typeof card.flower === 'string'
    ? card.flower.split(' / ')[language === 'ko' ? 0 : 1]
    : flowerValue[language] ?? monthFlowers[month - 1].split(' / ')[language === 'ko' ? 0 : 1];
  const kind = safeRecord(kinds[String(card.kind ?? '').toLowerCase()]);
  const label = language === 'ko' ? kind.ko : kind.es;
  const badgeValue = safeRecord(card.badge);
  const badge = badgeValue[language] ?? '';
  const id = /^(?:[1-9]|1[0-2])-[1-4]$/.test(String(card.id)) ? String(card.id) : null;
  const face = id ? `/images/hwatu/${id.split('-').map(part => part.padStart(2, '0')).join('-')}.svg` : null;
  const description = `${copy(language, `${month}월`, `Mes ${month}`)} · ${flower} · ${badge || label} · ${Number(card.points ?? 0)} ${copy(language, '점', 'pts')}`;
  return <article className={`gb-hwatu-card gb-hwatu-card-premium gb-hwatu-month-${month}`} title={description} aria-label={description} role="img">
    {face && <img className="gb-hwatu-face gb-hwatu-face-premium" src={face} width="103" height="168" alt="" aria-hidden="true"/>}
    <span className="gb-hwatu-month-tag" aria-hidden="true">{copy(language, `${month}월`, `Mes ${month}`)}</span>
  </article>;
}
