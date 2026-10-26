import type { Language } from '../core/types';
import { moneyText } from './marble-visuals';

export function MarbleDecisionPreview({ kind, cost, cashAfter, tollBefore, tollAfter, levelBefore = 0, shortfall = 0, recipient, acquiredStage, language }: {
  kind:'buy'|'build'|'takeover'; cost:number; cashAfter:number; tollBefore:number|null; tollAfter:number|null; levelBefore?:number; shortfall?:number; recipient?:string; acquiredStage?:string; language:Language;
}) {
  const ko=language==='ko';
  return <div className="mp-stage-preview">
    <span>{kind==='buy'?(ko?`구매 ${moneyText(cost,language)}`:`Compra ${moneyText(cost,language)}`):kind==='takeover'?(ko?`인수 ${moneyText(cost,language)} · ${recipient??'소유자'}에게 지급`:`Adquisición ${moneyText(cost,language)} · pago a ${recipient??'propietario'}`):(ko?`${levelBefore} → ${levelBefore+1}단계 · 건설 ${moneyText(cost,language)}`:`Nivel ${levelBefore} → ${levelBefore+1} · costo ${moneyText(cost,language)}`)}</span>
    <b>{kind==='build'?(ko?`통행료 ${moneyText(tollBefore??0,language)} → ${moneyText(tollAfter??0,language)}`:`Alquiler ${moneyText(tollBefore??0,language)} → ${moneyText(tollAfter??0,language)}`):(ko?`${kind==='buy'?'구매':'인수'} 후 현금 ${moneyText(cashAfter,language)}`:`Efectivo después ${moneyText(cashAfter,language)}`)}</b>
    <small>{kind==='build'?(ko?`건설 후 현금 ${moneyText(cashAfter,language)}`:`Efectivo después ${moneyText(cashAfter,language)}`):kind==='takeover'?(ko?`획득 ${acquiredStage??`${levelBefore}단계`} · 통행료 ${moneyText(tollAfter??0,language)}`:`Recibes ${acquiredStage??`nivel ${levelBefore}`} · alquiler ${moneyText(tollAfter??0,language)}`):tollBefore===null||tollAfter===null?(ko?'관광지 통행료는 방문 시 소유 단계에 따라 정산':'El peaje turístico se liquida según las propiedades del dueño'):ko?`통행료 ${moneyText(tollBefore,language)} → ${moneyText(tollAfter,language)}`:`Alquiler ${moneyText(tollBefore,language)} → ${moneyText(tollAfter,language)}`}</small>
    {shortfall>0&&<strong role="alert">{ko?`현금 ${moneyText(shortfall,language)} 부족`:`Faltan ${moneyText(shortfall,language)}`}</strong>}
  </div>;
}
