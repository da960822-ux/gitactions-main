import type { Language } from '../core/types';
import { moneyText } from './marble-visuals';

export function MarbleDecisionPreview({ kind, cost, cashAfter, tollBefore, tollAfter, levelBefore = 0, shortfall = 0, recipient, language }: {
  kind:'buy'|'build'|'takeover'|'rent'; cost:number; cashAfter:number; tollBefore:number; tollAfter:number; levelBefore?:number; shortfall?:number; recipient?:string; language:Language;
}) {
  const ko=language==='ko';
  return <div className="mp-stage-preview">
    <span><small>{kind==='buy'?(ko?'매입 비용':'Compra'):kind==='build'?(ko?`${levelBefore} → ${levelBefore+1}단계 건설`:`Construcción ${levelBefore} → ${levelBefore+1}`):kind==='takeover'?(ko?'인수 비용':'Costo de adquisición'):(ko?'통행료 지급':'Pago de alquiler')}</small><b>{moneyText(cost,language)}</b></span>
    <span><small>{ko?'실행 후 현금':'Efectivo después'}</small><b>{moneyText(cashAfter,language)}</b></span>
    <span><small>{recipient?(ko?'받는 사람':'Recibe'):ko?'통행료':'Alquiler'}</small><b>{recipient??`${moneyText(tollBefore,language)} → ${moneyText(tollAfter,language)}`}</b></span>
    {shortfall>0&&<strong role="alert">{ko?`현금 ${moneyText(shortfall,language)} 부족`:`Faltan ${moneyText(shortfall,language)}`}</strong>}
  </div>;
}
