import type { CSSProperties, ReactNode } from 'react';
import type { Language } from '../core/types';
import { fourSeats, fourTeam, type FourSeat, type Localized } from '../core/fourPlayer';
import type { MarbleView } from '../games/fourMarble';
import { MarbleCityTile } from './MarbleCityTile';
import { MarbleBoardShell } from './MarbleBoardShell';
import { MarbleMobileSpotlight } from './MarbleMobileSpotlight';
import { marbleGridPosition } from './marble-motion';
import { cityArtNames, rentValue, visualBuildingLevel } from './marble-visuals';
import '../styles/marble-premium.css';
const copy = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;
const record = (value: unknown): Record<string, any> => value && typeof value === 'object' ? value as Record<string, any> : {};
const num = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
export function MarbleTeamMap({view, language, seatNames, selectedTile, onInspect, displayPositions, traveler, changedProperties, centerContent}: {
 view: MarbleView; language: Language; seatNames: Record<FourSeat, Localized>; selectedTile: number; onInspect:(index:number)=>void;
 displayPositions:Record<string,number>; traveler:{seat:FourSeat;tile:number;seq:number}|null; changedProperties:number[];
 centerContent?: ReactNode;
}) {
 const state=view.publicState;
 const tiles=view.publicBoard.map((tile,index)=>({...tile,index,owner:state.properties[index]?.owner??null,houses:state.properties[index]?.houses??0,rentModifiers:state.modifiers[index]}));
 const tileCount=tiles.length;
 const players=fourSeats,playerId='p1',phase=view.phase;
 const pos=state.positions[view.turn],lastMove=record(state.lastMove),lastMoveSequence=state.lastMove?.sequence??0;
 const selectedCity=tiles[selectedTile];
 const seatLabel=(seat:FourSeat)=>seatNames[seat][language];
 const validSeat=(value:unknown):value is FourSeat=>fourSeats.includes(value as FourSeat);
 return (
      <MarbleBoardShell tileCount={tileCount} language={language}>
          {tiles.map((tile, index) => {
            const position = marbleGridPosition(index, tileCount);
            if (!position) return null;
            const atSeats = players.filter(seat => !state.eliminated[seat] && num(displayPositions[seat]) === index);
            const movingSeat = traveler?.tile === index ? traveler.seat : null;
            return <MarbleCityTile key={tile.index ?? index} tile={tile} index={index} tileCount={tileCount} position={position} language={language} routeVersion={tileCount===32?4:3} modern selected={selectedTile === index} pending={pos === index && phase === 'decision'} changed={changedProperties.includes(index)} atSeats={atSeats} travelerSequence={traveler?.seq} movingSeat={movingSeat} playerId={playerId} pawnForSeat={seat => state.pawns[seat]} seatLabel={seatLabel} onInspect={onInspect}/>;
          })}
          <div className="mp-board-center"><div className="mp-ownership-key"><span className="mp-key-group"/>{copy(language, '윗띠 · 색상군', 'Franja · grupo')}<span className="mp-key-owner"/>{copy(language, '테두리·기단 · 소유자 번호', 'Borde y base · número del dueño')}<span className="mp-money-key">{copy(language, '미소유 숫자 = 매입 · 소유 숫자 = 통행료', 'Sin dueño: compra · Con dueño: alquiler')}</span></div>
            <img className="mp-world-map" src="/images/marble/world-map-board.webp" alt="" aria-hidden="true" decoding="async"/>
            {tileCount===32&&selectedCity&&<MarbleMobileSpotlight name={selectedCity.name[language]} city={cityArtNames[selectedCity.name.ko]??null} level={visualBuildingLevel(selectedCity,4)} owner={validSeat(selectedCity.owner)?selectedCity.owner:null} ownerLabel={validSeat(selectedCity.owner)?seatLabel(selectedCity.owner):copy(language,'은행','Banco')} price={['property','tourism'].includes(selectedCity.kind)?Number(selectedCity.price??0):null} toll={['property','tourism'].includes(selectedCity.kind)?rentValue(selectedCity,true):null} language={language} routeVersion={tileCount===32?4:3}/>}
            <div className="mp-center-route"><span>{tileCount===32?copy(language, '방콕 → 도쿄 → 베를린 → 뉴욕 → 서울 → 출발', 'Bangkok → Tokio → Berlín → Nueva York → Seúl → Salida'):copy(language, '광주 → 뉴욕 → 산토도밍고 → 뉴어크 → 서울 → 광주', 'Gwangju → Nueva York → Santo Domingo → Newark → Seúl → Gwangju')}</span></div>
            {centerContent}

            {lastMove.source === 'train' && lastMove.from === 30 && validSeat(lastMove.playerId) && <div className={`mp-flight ${traveler?.seq === lastMoveSequence ? 'is-flying' : ''}`} style={{ color: fourTeam(lastMove.playerId) === 'A' ? '#28766d' : '#ae4e63' } as CSSProperties}>
              <svg viewBox="0 0 160 100" aria-hidden="true"><ellipse cx="80" cy="86" rx="47" ry="5" fill="#344c59" opacity=".12"/><g stroke="#344c59" strokeWidth="2" strokeLinejoin="round"><path d="m72 44 19-35 12 1-12 38 36 7 16 12-9 6-42-12-17 23-11-2 8-27-45-6-14-9 7-5z" fill="#fff8e7"/><path d="m27 43-15-22 11 1 19 21z" fill="currentColor"/><path d="m76 44 15-35 12 1-12 38zM89 61 75 84l-11-2 8-27z" fill="currentColor"/><path d="m114 55 13 2 8 8-15-1z" fill="#8db9c8"/></g></svg>
              <span><b>{seatLabel(lastMove.playerId)}</b> · {copy(language, '팀 여행', 'Viaje del equipo')}</span>
              <small>{String(record(tiles[num(lastMove.to)]?.name)[language] ?? '')}</small>
            </div>}
          </div>
      </MarbleBoardShell>
 );
}
