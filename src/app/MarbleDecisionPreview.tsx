import type { Language } from '../core/types';
import { moneyText } from './marble-visuals';

export function MarbleDecisionPreview({ kind, cost, cashAfter, tollBefore, tollAfter, levelBefore = 0, shortfall = 0, language }: {
  kind:'buy'|'build'; cost:number; cashAfter:number; tollBefore:number; tollAfter:number; levelBefore?:number; shortfall?:number; language:Language;
}) {
  const ko=language==='ko';
  return <div className="mp-stage-preview">
    <span>{kind==='buy'?(ko?`구매 ${moneyText(cost,language)}`:`Compra ${moneyText(cost,language)}`):(ko?`${levelBefore} → ${levelBefore+1}단계 · 건설 ${moneyText(cost,language)}`:`Nivel ${levelBefore} → ${levelBefore+1} · costo ${moneyText(cost,language)}`)}</span>
    <b>{kind==='buy'?(ko?`구매 후 현금 ${moneyText(cashAfter,language)}`:`Efectivo después ${moneyText(cashAfter,language)}`):(ko?`통행료 ${moneyText(tollBefore,language)} → ${moneyText(tollAfter,language)}`:`Alquiler ${moneyText(tollBefore,language)} → ${moneyText(tollAfter,language)}`)}</b>
    <small>{kind==='buy'?(ko?`통행료 ${moneyText(tollBefore,language)} → ${moneyText(tollAfter,language)}`:`Alquiler ${moneyText(tollBefore,language)} → ${moneyText(tollAfter,language)}`):(ko?`건설 후 현금 ${moneyText(cashAfter,language)}`:`Efectivo después ${moneyText(cashAfter,language)}`)}</small>
    {shortfall>0&&<strong role="alert">{ko?`현금 ${moneyText(shortfall,language)} 부족`:`Faltan ${moneyText(shortfall,language)}`}</strong>}
  </div>;
}
