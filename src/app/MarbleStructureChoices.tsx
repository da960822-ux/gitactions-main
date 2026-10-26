import type { GameAction, Language } from '../core/types';
import { sameMarbleAction } from '../games/marble-actions';
import { moneyText } from './marble-visuals';

export type MarbleStructureOption = { action: GameAction; structure: string; cost: number; tollAfter: number };
const labels: Record<string, Record<Language,string>> = {
  villa:{ko:'빌라',es:'Villa'}, building:{ko:'빌딩',es:'Edificio'}, hotel:{ko:'호텔',es:'Hotel'}, landmark:{ko:'랜드마크',es:'Monumento'},
};
export const marbleStructureName = (structure:string,language:Language) => labels[structure]?.[language]??structure;
export function MarbleStructureChoices({options,selected,cash,tollBefore,language,onSelect}: {
  options:MarbleStructureOption[];selected?:GameAction;cash:number;tollBefore:number;language:Language;onSelect:(action:GameAction)=>void;
}) {
  const ko=language==='ko';
  return <div className="mp-structure-choices" role="group" aria-label={ko?'건설할 건물 선택':'Elegir edificio'}>
    {options.map(option=><button key={`${option.action.payload?.tile}-${option.structure}`} type="button" className="mp-structure-option" aria-pressed={sameMarbleAction(selected,option.action)} onClick={()=>onSelect(option.action)}>
      <strong>{marbleStructureName(option.structure,language)}</strong>
      <span>{ko?'건설':'Costo'} {moneyText(option.cost,language)} · {ko?'잔액':'Saldo'} {moneyText(cash-option.cost,language)}</span>
      <small>{ko?'통행료':'Alquiler'} {moneyText(tollBefore,language)} → {moneyText(option.tollAfter,language)}</small>
    </button>)}
  </div>;
}
