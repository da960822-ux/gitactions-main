import type { Language } from '../core/types';
import type { FourSeat } from '../core/fourPlayer';
import { GameValue } from './GameValue';
import { MarblePawn, type MarblePawnId } from './MarblePawn';
import { moneyText } from './marble-visuals';

const copy=(language:Language,ko:string,es:string)=>language==='ko'?ko:es;

export function MarblePlayerHud({seat,name,pawn,cash,assets,scoreLabel,active,self,language,resetKey,meta}: {
  seat:'p1'|'p2';name:string;pawn:MarblePawnId;cash:number;assets:number;scoreLabel:string;active:boolean;self:boolean;language:Language;resetKey:string;
  meta:{debt:number;cities:number;landmarks:number;groups:number;rentPasses:number};
}) {
  return <div className={`mp-player ${self?'is-you':''} ${active?'is-turn':''}`} data-marble-seat={seat}>
    <div className="mp-player-name"><span className="mp-seat-key" aria-label={copy(language,`${seat.slice(1)}번`,`Asiento ${seat.slice(1)}`)}>{seat.slice(1)}</span><MarblePawn pawn={pawn} language={language} label={name}/><b>{name}</b>{active&&<span>{copy(language,'차례','Turno')}</span>}</div>
    <div className="mp-player-value" data-marble-value="cash"><small>{copy(language,'현금','Efectivo')}</small><b><GameValue value={cash} resetKey={`${resetKey}:cash:${seat}`} format={value=>moneyText(value,language)}/></b></div>
    <div className="mp-player-value" data-marble-value="assets"><small>{scoreLabel}</small><b><GameValue value={assets} resetKey={`${resetKey}:assets:${seat}`} format={value=>moneyText(value,language)}/></b></div>
    {meta.rentPasses>0&&<span className="mp-held-rent-pass"><svg viewBox="0 0 128 128" aria-hidden="true"><use href="/images/marble/golden-key-cards.svg#rent-pass-mark"/></svg>{copy(language,`통행료 면제권 ${meta.rentPasses}장`,`Pases de renta ${meta.rentPasses}`)}</span>}
    {(meta.debt>0||meta.cities>0||meta.groups>0)&&<div className="mp-player-meta">{meta.debt>0&&<span className="has-debt">{copy(language,`대출 ${moneyText(meta.debt,language)}`,`Préstamo ${moneyText(meta.debt,language)}`)}</span>}{meta.cities>0&&<span>{copy(language,`도시 ${meta.cities}`,`Ciudades ${meta.cities}`)}</span>}{meta.landmarks>0&&<span>{copy(language,`랜드마크 ${meta.landmarks}`,`Monumentos ${meta.landmarks}`)}</span>}{meta.groups>0&&<span>{copy(language,`완성 그룹 ${meta.groups}`,`Grupos completos ${meta.groups}`)}</span>}</div>}
  </div>;
}

export function MarbleTeamBank({seat,name,pawn,cash,assets,debt,position,active,eliminated,team,language}: {
  seat:FourSeat;name:string;pawn:MarblePawnId;cash:number;assets:number;debt:number;position:number;active:boolean;eliminated:boolean;team:'A'|'B';language:Language;
}) {
  return <article className={`mt-bank mt-bank-${team} ${active?'is-current':''} ${eliminated?'is-bankrupt':''}`} data-marble-seat={seat}>
    <MarblePawn pawn={pawn} language={language} label={name}/>
    <div><strong><span className="mp-seat-key" aria-label={copy(language,`${seat.slice(1)}번`,`Asiento ${seat.slice(1)}`)}>{seat.slice(1)}</span> {name} {active&&<span className="mt-turn-dot" title={copy(language,'차례','Turno')}/>}</strong><span>{copy(language,`현금 ${moneyText(cash,language)}${debt?` · 대출 ${moneyText(debt,language)}`:''}`,`Efectivo ${moneyText(cash,language)}${debt?` · deuda ${moneyText(debt,language)}`:''}`)}</span></div>
    <dl><div><dt>{copy(language,'순자산','Patrimonio')}</dt><dd>{moneyText(assets,language)}</dd></div><div><dt>{copy(language,'위치','Casilla')}</dt><dd>{eliminated?copy(language,'파산','Quiebra'):position+1}</dd></div></dl>
  </article>;
}
