import type { CSSProperties } from 'react';
import type { Language } from '../core/types';
import { fourSeats, fourTeam, type FourSeat, type Localized } from '../core/fourPlayer';
import type { MarbleView } from '../games/fourMarble';
import { MarblePawn } from './MarblePawn';
import { MarblePropertyArt } from './MarblePropertyArt';
import { cityArtNames, cityFlag, buildingName, rentValue, moneyText, specialNames } from './marble-visuals';
import { marbleGridPosition } from './marble-motion';
import '../styles/marble-premium.css';
const copy = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;
const record = (value: unknown): Record<string, any> => value && typeof value === 'object' ? value as Record<string, any> : {};
const num = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
export function MarbleTeamMap({view, language, seatNames, selectedTile, onInspect, displayPositions, traveler, changedProperties}: {
 view: MarbleView; language: Language; seatNames: Record<FourSeat, Localized>; selectedTile: number; onInspect:(index:number)=>void;
 displayPositions:Record<string,number>; traveler:{seat:FourSeat;tile:number;seq:number}|null; changedProperties:number[];
}) {
 const state=view.publicState;
 const tiles=view.publicBoard.map((tile,index)=>({...tile,index,owner:state.properties[index]?.owner??null,houses:state.properties[index]?.houses??0,rentModifiers:state.modifiers[index]}));
 const players=fourSeats,playerId='p1',phase=view.phase;
 const pos=state.positions[view.turn],lastMove=record(state.lastMove),lastMoveSequence=state.lastMove?.sequence??0;
 const seatLabel=(seat:FourSeat)=>seatNames[seat][language];
 const validSeat=(value:unknown):value is FourSeat=>fourSeats.includes(value as FourSeat);
 const inspectTile=onInspect;
 return (
      <section className="mp-board-panel" aria-label={copy(language, `${tiles.length}칸 순환 보드`, `Tablero de ${tiles.length} casillas`)}>
        <div className="mp-board-grid mp-board-grid--40" role="list" aria-label={copy(language, `총 ${tiles.length}칸 보드`, `Recorrido de ${tiles.length} casillas`)}>
          {tiles.map((tile, index) => {
            const kind = String(tile.kind ?? 'rest'), name = String(record(tile.name)[language] ?? record(tile.name).ko ?? ''), group = String(tile.group ?? '');
            const position = marbleGridPosition(index, 40);
            const atSeats = players.filter(seat => !state.eliminated[seat] && num(displayPositions[seat]) === index);
            const movingSeat = traveler?.tile === index ? traveler.seat : null;
            const seats = atSeats.filter(seat => traveler?.seat !== seat);
            if (!position) return null;
            const tileOwner = validSeat(tile.owner) ? tile.owner as FourSeat : null;
            const edge = position[1] === 1 || position[1] === 11 ? 'mp-tile--horizontal' : position[0] === 1 ? 'mp-tile--west' : 'mp-tile--east';
            const isKey = [2, 7, 12, 18, 27, 34].includes(index);
            const tileSymbol = isKey || kind === 'event' ? 'key' : kind === 'fund-deposit' ? 'fund-pay' : kind;
            const flag = kind === 'property' ? cityFlag(record(tile.name)) : null;
            const building = buildingName(num(tile.houses), language, true);
            const aria = kind === 'property'
              ? `${name}, ${tileOwner ? copy(language, `소유자 ${seatLabel(tileOwner)}`, `Dueño ${seatLabel(tileOwner)}`) : copy(language, '미소유', 'Sin dueño')}, ${copy(language, `매입 ${num(tile.price)}, 임대 ${rentValue(tile, true)}`, `compra ${num(tile.price)}, renta ${rentValue(tile, true)}`)}${building ? `, ${building}` : ''}${record(tile.rentModifiers).festival ? copy(language, ', 도시 축제: 다음 상대 방문 통행료 2배, 1회', ', Festival: próxima visita rival, renta doble, un uso') : ''}${record(tile.rentModifiers).blackout ? copy(language, ', 정전: 다음 카드 소유자 방문 통행료 절반, 1회', ', Apagón: próxima visita del titular, media renta, un uso') : ''}`
              : `${name}, ${specialNames[kind]?.[language] ?? ''}`;
            return <article className={`mp-tile ${edge} mp-kind-${kind} ${isKey ? 'is-key' : ''} ${group ? `mp-group-${group}` : ''} ${tileOwner ? `is-owned-${tileOwner}` : ''} ${atSeats.length || movingSeat ? 'has-player' : ''} ${movingSeat ? 'is-moving' : ''} ${changedProperties.includes(index) ? 'is-changed' : ''} ${pos === index && phase === 'decision' ? 'is-pending' : ''} ${selectedTile === index ? 'is-selected' : ''}`} style={{ gridColumn: position[0], gridRow: position[1] } as CSSProperties} role="listitem" aria-label={aria} data-mp-edge={`${position[0] === 1 ? 'left' : position[0] === 11 ? 'right' : ''}${position[1] === 1 ? 'top' : position[1] === 11 ? 'bottom' : ''}`} key={tile.index ?? index}>
              <div className="mp-tile-content">
                <div className="mp-tile-top"><span>{String(index + 1).padStart(2, '0')}</span>{flag && <img src={`/images/marble/flags/${flag}.svg`} alt="" aria-hidden="true" loading="lazy" decoding="async"/>}{tileOwner && <b className={`mp-owner mp-owner-${tileOwner}`}>{seatLabel(tileOwner)}</b>}</div>
                {kind === 'property' ? <div className="mp-property-tile-view">
                  {cityArtNames[name] && <MarblePropertyArt routeVersion={3} language={language} className="mp-property-tile-art" city={cityArtNames[name]} level={num(tile.houses)}/>}
                  <div className="mp-property-tile-copy"><strong className="mp-tile-name" title={name}>{name}</strong><small className="mp-tile-economy"><b>{moneyText(num(tile.price), language)}</b><span>{copy(language, `임대 ${moneyText(rentValue(tile, true), language)}`, `Renta ${moneyText(rentValue(tile, true), language)}`)}</span></small></div>
                  {num(tile.houses) > 0 && <span className="mp-building-badge" aria-label={building}>{num(tile.houses) >= 3 ? '★' : num(tile.houses)}</span>}
                </div> : <><strong className="mp-tile-name" title={name}>{name}</strong>{['start', 'key', 'island', 'train', 'rest', 'fund', 'fund-pay', 'tax'].includes(tileSymbol) && <svg className="mp-tile-symbol" aria-hidden="true" viewBox="0 0 32 32"><use href={`/images/marble/tile-symbols.svg#${tileSymbol}`}/></svg>}<small className="mp-tile-kind">{specialNames[kind]?.[language] ?? ''}{['tax', 'fund-deposit'].includes(kind) && num(tile.price) ? ` · ${copy(language, `납부 ${moneyText(num(tile.price), language)}`, `Pago ${moneyText(num(tile.price), language)}`)}` : ''}</small></>}
              </div>
              {['festival', 'blackout'].filter(effect => record(tile.rentModifiers)[effect]).map(effect => <span className="mp-city-effect" key={effect} title={effect === 'festival' ? copy(language, '도시 축제 · 다음 상대 방문 통행료 2배 · 1회', 'Festival · próxima visita rival: renta doble · un uso') : copy(language, '정전 · 다음 카드 소유자 방문 통행료 절반 · 1회', 'Apagón · próxima visita del titular: media renta · un uso')}><svg viewBox="0 0 128 128" aria-hidden="true"><use href={`/images/marble/golden-key-cards.svg#${effect === 'festival' ? 'city-festival' : 'blackout'}-mark`}/></svg><span>{effect === 'festival' ? '×2' : '½'}</span></span>)}
              {(seats.length > 0 || movingSeat) && <div className={`mp-pawns${seats.length > 1 ? ' has-two-pawns' : ''}`} data-cell-number={index + 1} aria-label={copy(language, `${index + 1}번 칸의 말`, `Fichas en la casilla ${index + 1}`)}>
                {seats.map(seat => { const id = state.pawns[seat]; return <span className={`mp-pawn-marker ${seat === playerId ? 'is-you' : ''}`} key={seat} data-seat-number={Number(seat.slice(1))} title={seatLabel(seat)}><MarblePawn pawn={id} language={language} label={seatLabel(seat)}/></span>; })}
                {movingSeat && <span className={`mp-pawn-marker is-moving-pawn ${movingSeat === playerId ? 'is-you' : ''}`} key={`${movingSeat}-${traveler?.seq}`} data-seat-number={Number(movingSeat.slice(1))}><MarblePawn pawn={state.pawns[movingSeat]} language={language} label={seatLabel(movingSeat)}/></span>}
              </div>}
              <button className="mp-tile-select" type="button" aria-label={copy(language, `선택 ${aria}`, `Seleccionar ${aria}`)} aria-pressed={selectedTile === index} onClick={() => inspectTile(index)}/>
            </article>;
          })}
          <div className="mp-board-center">
            <img className="mp-world-map" src="/images/marble/world-map-board.webp" alt="" aria-hidden="true" decoding="async"/>
            <div className="mp-center-route"><span>{copy(language, '광주 → 뉴욕 → 산토도밍고 → 뉴어크 → 서울 → 광주', 'Gwangju → Nueva York → Santo Domingo → Newark → Seúl → Gwangju')}</span></div>

            {lastMove.source === 'train' && lastMove.from === 30 && validSeat(lastMove.playerId) && <div className={`mp-flight ${traveler?.seq === lastMoveSequence ? 'is-flying' : ''}`} style={{ color: fourTeam(lastMove.playerId) === 'A' ? '#28766d' : '#ae4e63' } as CSSProperties}>
              <svg viewBox="0 0 160 100" aria-hidden="true"><ellipse cx="80" cy="86" rx="47" ry="5" fill="#344c59" opacity=".12"/><g stroke="#344c59" strokeWidth="2" strokeLinejoin="round"><path d="m72 44 19-35 12 1-12 38 36 7 16 12-9 6-42-12-17 23-11-2 8-27-45-6-14-9 7-5z" fill="#fff8e7"/><path d="m27 43-15-22 11 1 19 21z" fill="currentColor"/><path d="m76 44 15-35 12 1-12 38zM89 61 75 84l-11-2 8-27z" fill="currentColor"/><path d="m114 55 13 2 8 8-15-1z" fill="#8db9c8"/></g></svg>
              <span><b>{seatLabel(lastMove.playerId)}</b> · {copy(language, '팀 여행', 'Viaje del equipo')}</span>
              <small>{String(record(tiles[num(lastMove.to)]?.name)[language] ?? '')}</small>
            </div>}
          </div>
        </div>

      </section>
 );
}
