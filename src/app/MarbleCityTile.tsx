import { marbleDestinationImage, marbleSpecialDestinationImage } from './marble-destination-art';
import { marbleMonopolyGroupName, type MarbleMonopolyGroup } from './MarbleMonopoly';
import { marbleDisplayName, marbleHasReplacement } from './marble-world-theme';
import { MarbleTileEffects } from './MarbleEventEffects';
import type { MarbleActionEvent } from './marble-motion';
import type { CSSProperties } from 'react';
import { MarbleKoreaTileMark } from './MarbleKoreaTileMark';
import { constructionLabel } from './marble-decision';
import type { Language } from '../core/types';
import { MarblePawn, type MarblePawnId } from './MarblePawn';
import { MarblePropertyArt } from './MarblePropertyArt';
import { buildingName, cityArtNames, cityFlag, moneyText, rentValue, specialNames } from './marble-visuals';

type Seat = 'p1' | 'p2' | 'p3' | 'p4';
const copy = (language:Language, ko:string, es:string) => language === 'ko' ? ko : es;
const record = (value:unknown):Record<string,any> => value && typeof value === 'object' ? value as Record<string,any> : {};
const num = (value:unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const isSeat = (value:unknown):value is Seat => ['p1','p2','p3','p4'].includes(String(value));

export function MarbleCityTile({ tile, index, tileCount, position, interactionHint, travelSelectable = false, effectSelectable = false, language, routeVersion, modern, selected, pending, changed, growth = false, monopoly, effectEvent, arrivalSeat = null, teammateSeat = null, atSeats, movingSeat, travelerSequence, playerId, pawnForSeat, seatLabel, onInspect }: {
  interactionHint?:string; travelSelectable?:boolean; effectSelectable?:boolean; tile:Record<string,any>; index:number; tileCount:number; position:[number,number]; language:Language; routeVersion:number; modern:boolean;
  selected:boolean; pending:boolean; changed:boolean; growth?:boolean; monopoly?:MarbleMonopolyGroup; effectEvent?:MarbleActionEvent|null; arrivalSeat?:Seat|null; teammateSeat?:Seat|null; atSeats:Seat[]; movingSeat:Seat|null; travelerSequence?:number; playerId:Seat;
  pawnForSeat:(seat:Seat)=>MarblePawnId; seatLabel:(seat:Seat)=>string; onInspect:(index:number)=>void;
}) {
  const kind=String(tile.kind??'rest'), name=routeVersion===3?marbleDisplayName(record(tile.name),language):String(record(tile.name)[language]??record(tile.name).ko??''), group=String(tile.group??'');
  const worldIsland=routeVersion===5&&kind==='tourism', purchasable=kind==='property'||worldIsland;
  const owner=kind!=='festival-site'&&isSeat(tile.owner)?tile.owner:null;
  const relation=owner===playerId?'mine':owner===teammateSeat?'team':'other';
  const ownershipText=owner ? `${owner===playerId?copy(language,'내 땅','Mía'):owner===teammateSeat?copy(language,'우리 팀','Equipo'):copy(language,'상대','Rival')} · P${owner.slice(1)}` : '';
  const gridSize=tileCount===32?9:11;
  const edge=tileCount>=32?(position[1]===1||position[1]===gridSize?'mp-tile--horizontal':position[0]===1?'mp-tile--west':'mp-tile--east'):'';
  const isKey=modern&&routeVersion<4&&[2,7,12,18,27,34].includes(index);
  const symbol=isKey||kind==='event'?'key':kind==='fund-deposit'?'fund-pay':kind;
  const art=cityArtNames[String(record(tile.name).ko??'')]??(kind==='property'&&routeVersion===4?`korea-${index}`:undefined),flag=kind==='property'&&!(routeVersion===3&&marbleHasReplacement(record(tile.name)))?cityFlag(record(tile.name)):null;
  const building=worldIsland?copy(language,'관광지 · 건설 없음','Isla · sin construcción'):constructionLabel(tile,language)||buildingName(num(tile.houses),language,modern);
  const aria=purchasable
    ? `${name}, ${owner?copy(language,`소유자 ${seatLabel(owner)}`,`Dueño ${seatLabel(owner)}`):copy(language,'미소유','Sin dueño')}, ${tile.price===undefined?copy(language,'경제 수치 조사 중','Economía pendiente'):copy(language,`매입 ${num(tile.price)}, 임대 ${rentValue(tile,modern)}`,`compra ${num(tile.price)}, renta ${rentValue(tile,modern)}`)}${building?`, ${building}`:''}${record(tile.rentModifiers).festival?copy(language,', 도시 축제: 다음 상대 방문 통행료 2배, 1회',', Festival: próxima visita rival, renta doble, un uso'):''}${record(tile.rentModifiers).blackout?copy(language,', 정전: 다음 카드 소유자 방문 통행료 절반, 1회',', Apagón: próxima visita del titular, media renta, un uso'):''}`
    : `${name}, ${routeVersion>=4?name:specialNames[kind]?.[language]??''}`;
  const seats=atSeats.filter(seat=>seat!==movingSeat);
  const ownershipBadge = owner&&<span className="mp-ownership-label" title={`${ownershipText} · ${seatLabel(owner)}`} aria-label={ownershipText}>{ownershipText}{monopoly?.complete&&<span className="mp-monopoly-badge" title={`${marbleMonopolyGroupName(monopoly.group,language)} ${copy(language,'독점','monopolio')} · ${seatLabel(owner)}${monopoly.multiplier!==null&&monopoly.multiplier>1?` · ${copy(language,'통행료','alquiler')} ×${monopoly.multiplier}`:''}`}>{monopoly.multiplier!==null&&monopoly.multiplier>1?`◆ ×${monopoly.multiplier}`:'◆'}</span>}</span>;
  return <><article className={`mp-tile mp-city-scene ${travelSelectable?'is-travel-selectable':''} ${effectSelectable?'is-effect-selectable':''} ${edge} mp-kind-${kind} ${worldIsland?'mp-kind-property mp-world-island':''} ${isKey?'is-key':''} ${group?`mp-group-${group}`:''} ${owner?`is-owned-${owner}`:''} ${atSeats.length||movingSeat?'has-player':''} ${movingSeat?'is-moving':''} ${changed?'is-changed':''} ${growth?'is-growing':''} ${pending?'is-pending':''} ${selected?'is-selected':''} ${arrivalSeat?'is-arrived':''}`}  style={{gridColumn:position[0],gridRow:position[1]} as CSSProperties} data-monopoly-group={monopoly?.complete?monopoly.group:undefined} data-ownership-relation={owner?relation:undefined} data-tourism-group={tile.tourismGroup} data-arrival-ownership={arrivalSeat&&purchasable?(owner===playerId?'mine':owner?'other':'bank'):undefined} role="listitem" aria-label={aria} data-marble-owner={purchasable?owner??'bank':undefined} data-mp-edge={tileCount>=32?`${position[0]===1?'left':position[0]===gridSize?'right':''}${position[1]===1?'top':position[1]===gridSize?'bottom':''}`:undefined}>
    <MarbleTileEffects city={art} language={language} owner={owner} event={effectEvent} tileIndex={index} landmark={!!tile.landmark || num(tile.houses)===3}/>
    {movingSeat&&<span key={`${movingSeat}:${travelerSequence}:${index}`} className="mp-fx-step" aria-hidden="true"/>}
    {owner&&<span className="mp-owner-floor" aria-hidden="true"/>}
    {monopoly?.complete&&<span className="mp-monopoly-halo" aria-hidden="true"/>}
    <div className="mp-tile-content">
      {arrivalSeat&&purchasable&&<span className="mp-arrival-label">{owner===playerId?copy(language,'내 땅','Tu ciudad'):owner?copy(language,`상대 땅 · ${seatLabel(owner)}`,`Rival · ${seatLabel(owner)}`):copy(language,'빈 땅','Sin dueño')}</span>}
      <div className="mp-tile-top"><span>{String(index+1).padStart(2,'0')}</span>{flag&&<img src={`/images/marble/flags/${flag}.svg`} alt="" aria-hidden="true" loading="lazy" decoding="async"/>}{owner&&<b className={`mp-owner mp-owner-${owner}`} title={seatLabel(owner)} aria-label={seatLabel(owner)}>{owner.slice(1)}</b>}</div>
      {purchasable?<div className="mp-property-tile-view">
        {worldIsland&&<img className="mp-property-tile-art mp-island-art" data-building-level="island" src={marbleDestinationImage(String(record(tile.name).ko??''))} alt="" aria-hidden="true"/>}
        {art&&<MarblePropertyArt routeVersion={routeVersion} language={language} className="mp-property-tile-art" city={art} buildings={tile.buildings} landmark={tile.landmark} level={modern?num(tile.houses):0} owner={owner} ownerLabel={owner?seatLabel(owner):copy(language,'은행','Banco')}/>}
        {growth&&art&&!tile.buildings&&num(tile.houses)>0&&<span className="mp-growth-previous"><MarblePropertyArt routeVersion={routeVersion} language={language} city={art} level={num(tile.houses)-1} owner={owner}/></span>}
        <div className="mp-property-tile-copy"><strong className="mp-tile-name" title={name}>{name}{worldIsland&&<small className="mp-island-price">{owner?num(tile.rent):num(tile.price)}</small>}</strong>{tileCount<32&&ownershipBadge}<small className="mp-tile-economy"><b data-marble-price-kind={owner?'rent':'purchase'} title={tile.price===undefined?copy(language,'경제 수치 조사 중','Economía pendiente'):owner?copy(language,`현재 통행료 ${rentValue(tile,modern)}`,`Alquiler actual ${rentValue(tile,modern)}`):copy(language,`매입가 ${num(tile.price)}`,`Precio de compra ${num(tile.price)}`)}>{tile.price===undefined?copy(language,'조사 중','Pendiente'):moneyText(owner?rentValue(tile,modern):num(tile.price),language)}</b><span>{tile.price===undefined?copy(language,'경제 수치 조사 중','Economía pendiente'):owner?copy(language,`통행료 ${moneyText(rentValue(tile,modern),language)}`,`Renta ${moneyText(rentValue(tile,modern),language)}`):copy(language,`기본 통행료 ${moneyText(num(tile.rent),language)}`,`Renta base ${moneyText(num(tile.rent),language)}`)}</span></small></div>

      </div>:<><strong className="mp-tile-name" title={name}>{name}</strong>{marbleSpecialDestinationImage(kind)?<img className="mp-destination-special-art" src={marbleSpecialDestinationImage(kind)} alt="" aria-hidden="true"/>:kind==='festival-site'?<svg className="mp-festival-site-mark" viewBox="0 0 128 128" aria-hidden="true"><use href="/images/marble/golden-key-cards.svg#city-festival-mark"/></svg>:routeVersion===4?<MarbleKoreaTileMark kind={kind} tourismGroup={tile.tourismGroup}/>:['start','key','island','train','rest','fund','fund-pay','tax'].includes(symbol)&&<svg className="mp-tile-symbol" aria-hidden="true" viewBox="0 0 32 32"><use href={`/images/marble/tile-symbols.svg#${symbol}`}/></svg>}<small className="mp-tile-kind">{specialNames[kind]?.[language]??''}{['tax','fund-deposit'].includes(kind)&&num(tile.price)?` · ${copy(language,`납부 ${moneyText(num(tile.price),language)}`,`Pago ${moneyText(num(tile.price),language)}`)}`:''}</small></>}
    </div>
    {['festival','blackout'].filter(effect=>record(tile.rentModifiers)[effect]).map(effect=><span className={`mp-city-effect mp-city-effect--${effect}`} key={effect} title={effect==='festival'?copy(language,'도시 축제 · 다음 상대 방문 통행료 2배 · 1회','Festival · próxima visita rival: renta doble · un uso'):copy(language,'정전 · 다음 카드 소유자 방문 통행료 절반 · 1회','Apagón · próxima visita del titular: media renta · un uso')}><svg viewBox="0 0 128 128" aria-hidden="true"><use href={`/images/marble/golden-key-cards.svg#${effect==='festival'?'city-festival':'blackout'}-mark`}/></svg><span>{effect==='festival'?copy(language,'축제 ×2','Fiesta ×2'):copy(language,'정전 ½','Apagón ½')}</span></span>)}
    {(seats.length>0||movingSeat)&&<div className={`mp-pawns${seats.length>1?' has-two-pawns':''}`} data-pawn-count={seats.length + (movingSeat ? 1 : 0)} data-cell-number={index+1} data-cell-name={name} aria-label={copy(language,`${name}, ${index+1}번 칸의 말`,`${name}, fichas en la casilla ${index+1}`)}>
      {seats.map(seat=><span className={`mp-pawn-marker ${seat===playerId?'is-you':''}`} key={seat} data-seat-number={Number(seat.slice(1))} data-marble-pawn-seat={seat} title={seatLabel(seat)}><MarblePawn pawn={pawnForSeat(seat)} language={language} label={seatLabel(seat)}/></span>)}
      {movingSeat&&<span className={`mp-pawn-marker is-moving-pawn ${movingSeat===playerId?'is-you':''}`} key={`${movingSeat}-${travelerSequence}`} data-seat-number={Number(movingSeat.slice(1))} data-marble-pawn-seat={movingSeat}><MarblePawn pawn={pawnForSeat(movingSeat)} language={language} label={seatLabel(movingSeat)}/></span>}
    </div>}
    <button className="mp-tile-select" title={interactionHint} aria-description={interactionHint} type="button" aria-label={copy(language,`${effectSelectable?'카드 효과 적용 대상 선택':travelSelectable?'여행 목적지 선택':'선택'} ${aria}`,`${effectSelectable?'Elegir objetivo de carta':travelSelectable?'Elegir destino':'Seleccionar'} ${aria}`)} aria-pressed={selected} onClick={()=>onInspect(index)}/>
  </article>{owner&&tileCount>=32&&<div className="mp-tile-owner-layer" data-mp-edge={tileCount>=32?`${position[0]===1?'left':position[0]===gridSize?'right':''}${position[1]===1?'top':position[1]===gridSize?'bottom':''}`:undefined} data-marble-owner={owner} style={{gridColumn:position[0],gridRow:position[1]} as CSSProperties}>{ownershipBadge}</div>}</>;
}
