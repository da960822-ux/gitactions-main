import {MarbleFlight} from './MarbleFlight';
import { marbleMonopolyGroups } from './MarbleMonopoly';
import type { MarbleActionEvent } from './marble-motion';
import type { ReactNode } from 'react';
import type { Language } from '../core/types';
import { fourSeats, fourTeam, type FourSeat, type Localized } from '../core/fourPlayer';
import type { MarbleView } from '../games/fourMarble';
import { MarbleCityTile } from './MarbleCityTile';
import { MarbleBoardShell } from './MarbleBoardShell';
import { marbleGridPosition } from './marble-motion';
import '../styles/marble-premium.css';
const copy = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;
const num = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
export function MarbleTeamMap({view, language, seatNames, selectedTile, onInspect, displayPositions, traveler, changedProperties, centerContent, journeyInFlight=false, effectEvent,travelDestinations=[],effectDestinations=[]}: {
 view: MarbleView; language: Language; seatNames: Record<FourSeat, Localized>; selectedTile: number; onInspect:(index:number)=>void;
 displayPositions:Record<string,number>; traveler:{seat:FourSeat;tile:number;seq:number}|null; changedProperties:number[];
 effectDestinations?:number[];travelDestinations?:number[]; effectEvent?: MarbleActionEvent|null; centerContent?: ReactNode; journeyInFlight?:boolean;
}) {
 const state=view.publicState;
 const tiles=view.publicBoard.map((tile,index)=>({...tile,index,economicVersion:state.economicVersion??2,...state.properties[index],owner:state.properties[index]?.owner??null,houses:state.properties[index]?.houses??0,rentModifiers:state.modifiers[index]}));
 const monopolyGroups=marbleMonopolyGroups(tiles,state.propertyRulesVersion===1);
 const players=fourSeats,playerId='p1',phase=view.phase;
 const teammateSeat=fourSeats.find(seat=>seat!==playerId&&fourTeam(seat)===fourTeam(playerId))??null;
 const pos=state.positions[view.turn];
 const seatLabel=(seat:FourSeat)=>seatNames[seat][language];
 return (
      <MarbleBoardShell tileCount={tiles.length} language={language}>
          {tiles.map((tile, index) => {
            const position = marbleGridPosition(index, tiles.length);
            if (!position) return null;
            const atSeats = players.filter(seat => !state.eliminated[seat] && num(displayPositions[seat]) === index);
            const movingSeat = traveler?.tile === index ? traveler.seat : null;
            return <MarbleCityTile key={tile.index ?? index} tile={tile} index={index} tileCount={tiles.length} position={position} language={language} routeVersion={state.cityRouteVersion??3} modern selected={selectedTile === index} pending={pos === index && phase === 'decision'} changed={changedProperties.includes(index)} monopoly={monopolyGroups.find(group=>group.complete&&group.tiles.includes(index))} effectEvent={effectEvent} effectSelectable={effectDestinations.includes(index)} travelSelectable={travelDestinations.includes(index)} interactionHint={tile.kind==='train'?copy(language,travelDestinations.length?'이 칸을 여행 목적지로 선택':'이 칸에 도착한 다음 내 차례에 세계여행을 이용해요.',travelDestinations.length?'Elegir esta casilla como destino':'Llega aquí durante tu turno para viajar.'):undefined} teammateSeat={teammateSeat} growth={false} atSeats={atSeats} arrivalSeat={!journeyInFlight&&num(displayPositions[view.turn])===index?view.turn:null} movingSeat={movingSeat} travelerSequence={traveler?.seq} playerId={playerId} pawnForSeat={seat => state.pawns[seat]} seatLabel={seatLabel} onInspect={onInspect}/>;
          })}
          <div className="mp-board-center"><MarbleFlight event={effectEvent} events={state.actionLog} tiles={tiles} language={language}/><div className="mp-ownership-key"><span className="mp-key-group"/>{copy(language, '윗띠 · 색상군', 'Franja · grupo')}<span className="mp-key-owner"/>{copy(language, '테두리·기단 · 소유자 번호', 'Borde y base · número del dueño')}<span className="mp-money-key">{copy(language, '미소유 숫자 = 매입 · 소유 숫자 = 통행료', 'Sin dueño: compra · Con dueño: alquiler')}</span></div>
            {tiles.length===40&&<img className="mp-world-map" src="/images/marble/world-map-board.webp" alt="" aria-hidden="true" decoding="async"/>}
            <div className="mp-center-route"><span>{state.cityRouteVersion===4?copy(language,'한국맵 · 연구용 미리보기 · 플레이 불가','Corea · vista de investigación · no jugable'):state.cityRouteVersion===5?copy(language,'세계 도시와 섬 · 32칸','Ciudades e islas · 32 casillas'):copy(language, '광주 → 뉴욕 → 산토도밍고 → 뉴어크 → 서울 → 광주', 'Gwangju → Nueva York → Santo Domingo → Newark → Seúl → Gwangju')}</span></div>
            {centerContent}


          </div>
      </MarbleBoardShell>
 );
}
