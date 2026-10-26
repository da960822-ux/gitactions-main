import type { CSSProperties } from 'react';
import type { Language } from '../core/types';
import { MarblePawn, type MarblePawnId } from './MarblePawn';
import { MarblePropertyArt } from './MarblePropertyArt';
import { MarbleTourismArt } from './MarbleTourismArt';
import { buildingName, buildingSummary, cityArtNames, cityFlag, moneyText, rentValue, specialNames, visualBuildingLevel } from './marble-visuals';

type Seat = 'p1' | 'p2' | 'p3' | 'p4';
const copy = (language:Language, ko:string, es:string) => language === 'ko' ? ko : es;
const record = (value:unknown):Record<string,any> => value && typeof value === 'object' ? value as Record<string,any> : {};
const num = (value:unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const isSeat = (value:unknown):value is Seat => ['p1','p2','p3','p4'].includes(String(value));

export function MarbleCityTile({ tile, index, tileCount, position, language, routeVersion, modern, selected, pending, changed, atSeats, movingSeat, travelerSequence, playerId, pawnForSeat, seatLabel, onInspect }: {
  tile:Record<string,any>; index:number; tileCount:number; position:[number,number]; language:Language; routeVersion:number; modern:boolean;
  selected:boolean; pending:boolean; changed:boolean; atSeats:Seat[]; movingSeat:Seat|null; travelerSequence?:number; playerId:Seat;
  pawnForSeat:(seat:Seat)=>MarblePawnId; seatLabel:(seat:Seat)=>string; onInspect:(index:number)=>void;
}) {
  const kind=String(tile.kind??'rest'), name=String(record(tile.name)[language]??record(tile.name).ko??''), group=String(tile.group??'');
  const isTourism=kind==='tourism'||tile.tourism===true,isProperty=kind==='property'||kind==='city'||isTourism;
  const owner=isSeat(tile.owner)?tile.owner:null;
  const boardSide=tileCount===32||tileCount===40?tileCount/4+1:0;
  const edge=boardSide?(position[1]===1||position[1]===boardSide?'mp-tile--horizontal':position[0]===1?'mp-tile--west':'mp-tile--east'):'';
  const isKey=modern&&(kind==='event'||kind==='card');
  const symbol=isKey?'key':kind==='fund-deposit'?'fund-pay':kind==='world-travel'?'train':kind;
  const art=cityArtNames[String(record(tile.name).ko??'')],flag=isProperty?cityFlag(record(tile.name)):null;
  const level=visualBuildingLevel(tile,routeVersion),building=buildingSummary(tile,language,routeVersion);
  const aria=isProperty
    ? `${name}, ${owner?copy(language,`소유자 ${seatLabel(owner)}`,`Dueño ${seatLabel(owner)}`):copy(language,'미소유','Sin dueño')}, ${copy(language,`매입 ${num(tile.price)}, 임대 ${rentValue(tile,modern)}`,`compra ${num(tile.price)}, renta ${rentValue(tile,modern)}`)}${isTourism?copy(language,', 관광지: 은행에서 구매 가능, 상대에게 인수 불가',', turismo: se compra al banco, no se adquiere de otro jugador'):building?`, ${building}`:''}${record(tile.rentModifiers).festival?copy(language,', 도시 축제: 다음 상대 방문 통행료 2배, 1회',', Festival: próxima visita rival, renta doble, un uso'):''}${record(tile.rentModifiers).blackout?copy(language,', 정전: 다음 카드 소유자 방문 통행료 절반, 1회',', Apagón: próxima visita del titular, media renta, un uso'):''}`
    : `${name}, ${specialNames[kind]?.[language]??''}`;
  const seats=atSeats.filter(seat=>seat!==movingSeat);
  return <article className={`mp-tile ${edge} mp-kind-${kind} ${isProperty?'mp-kind-property':''} ${isKey?'is-key':''} ${group?`mp-group-${group}`:''} ${owner?`is-owned-${owner}`:''} ${atSeats.length||movingSeat?'has-player':''} ${movingSeat?'is-moving':''} ${changed?'is-changed':''} ${pending?'is-pending':''} ${selected?'is-selected':''}`} style={{gridColumn:position[0],gridRow:position[1]} as CSSProperties} role="listitem" aria-label={aria} data-marble-owner={isProperty?owner??'bank':undefined} data-tourism-label={isTourism?copy(language,'관광','Turismo'):undefined} data-mp-edge={boardSide?`${position[0]===1?'left':position[0]===boardSide?'right':''}${position[1]===1?'top':position[1]===boardSide?'bottom':''}`:undefined}>
    <div className="mp-tile-content">
      <div className="mp-tile-top"><span>{String(index+1).padStart(2,'0')}</span>{flag&&<img src={`/images/marble/flags/${flag}.svg`} alt="" aria-hidden="true" loading="lazy" decoding="async"/>}{owner&&<b className={`mp-owner mp-owner-${owner}`} title={seatLabel(owner)} aria-label={seatLabel(owner)}>{owner.slice(1)}</b>}</div>
      {isProperty?<div className="mp-property-tile-view">
        {isTourism?<MarbleTourismArt name={String(record(tile.name).ko??name)} className="mp-property-tile-art"/>:art&&<MarblePropertyArt routeVersion={routeVersion} language={language} className="mp-property-tile-art" city={art} level={modern?level:0} owner={owner} ownerLabel={owner?seatLabel(owner):copy(language,'은행','Banco')}/>}
        <div className="mp-property-tile-copy"><strong className="mp-tile-name" title={name}>{name}</strong><small className="mp-tile-economy"><b data-marble-price-kind={owner?'rent':'purchase'} title={owner?copy(language,`현재 통행료 ${rentValue(tile,modern)}`,`Alquiler actual ${rentValue(tile,modern)}`):copy(language,`매입가 ${num(tile.price)}`,`Precio de compra ${num(tile.price)}`)}>{moneyText(owner?rentValue(tile,modern):num(tile.price),language)}</b><span>{owner?copy(language,`통행료 ${moneyText(rentValue(tile,modern),language)}`,`Renta ${moneyText(rentValue(tile,modern),language)}`):copy(language,`기본 통행료 ${moneyText(num(tile.rent),language)}`,`Renta base ${moneyText(num(tile.rent),language)}`)}</span></small></div>
        {!isTourism&&(modern||level>0)&&<span className="mp-building-badge" data-building-level={level} aria-label={building||copy(language,'미건설','Sin construir')}>{tileCount===32&&level>0?buildingName(level,language,modern,routeVersion):level}</span>}
      </div>:<><strong className="mp-tile-name" title={name}>{name}</strong>{['start','key','island','train','rest','fund','fund-pay','tax'].includes(symbol)&&<svg className="mp-tile-symbol" aria-hidden="true" viewBox="0 0 32 32"><use href={`/images/marble/tile-symbols.svg#${symbol}`}/></svg>}<small className="mp-tile-kind">{specialNames[kind]?.[language]??''}{['tax','fund-deposit'].includes(kind)&&num(tile.price)?` · ${copy(language,`납부 ${moneyText(num(tile.price),language)}`,`Pago ${moneyText(num(tile.price),language)}`)}`:''}</small></>}
    </div>
    {['festival','blackout'].filter(effect=>record(tile.rentModifiers)[effect]).map(effect=><span className="mp-city-effect" key={effect} title={effect==='festival'?copy(language,'도시 축제 · 다음 상대 방문 통행료 2배 · 1회','Festival · próxima visita rival: renta doble · un uso'):copy(language,'정전 · 다음 카드 소유자 방문 통행료 절반 · 1회','Apagón · próxima visita del titular: media renta · un uso')}><svg viewBox="0 0 128 128" aria-hidden="true"><use href={`/images/marble/golden-key-cards.svg#${effect==='festival'?'city-festival':'blackout'}-mark`}/></svg><span>{effect==='festival'?'×2':'½'}</span></span>)}
    {(seats.length>0||movingSeat)&&<div className={`mp-pawns${seats.length>1?' has-two-pawns':''}`} data-cell-number={index+1} aria-label={copy(language,`${index+1}번 칸의 말`,`Fichas en la casilla ${index+1}`)}>
      {seats.map(seat=><span className={`mp-pawn-marker ${seat===playerId?'is-you':''}`} key={seat} data-seat-number={Number(seat.slice(1))} data-marble-pawn-seat={seat} title={seatLabel(seat)}><MarblePawn pawn={pawnForSeat(seat)} language={language} label={seatLabel(seat)}/></span>)}
      {movingSeat&&<span className={`mp-pawn-marker is-moving-pawn ${movingSeat===playerId?'is-you':''}`} key={`${movingSeat}-${travelerSequence}`} data-seat-number={Number(movingSeat.slice(1))} data-marble-pawn-seat={movingSeat}><MarblePawn pawn={pawnForSeat(movingSeat)} language={language} label={seatLabel(movingSeat)}/></span>}
    </div>}
    <button className="mp-tile-select" type="button" aria-label={copy(language,`선택 ${aria}`,`Seleccionar ${aria}`)} aria-pressed={selected} onClick={()=>onInspect(index)}/>
  </article>;
}
