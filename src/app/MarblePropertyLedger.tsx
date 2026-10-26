import type { GameAction, Language } from '../core/types';
import { marbleBuildCost, marbleCityValue, marbleTakeoverPrice, type MarbleTile } from '../games/marble';
import { marbleRentAtStage } from '../games/marble-economy';
import { selectMarblePropertySale } from '../games/marble-actions';
import { classicMarbleAcquisitionPrice, classicMarbleCityToll, classicMarbleConstructionCost, classicMarbleReferenceProfile, type ClassicMarbleBuildings, type ClassicMarbleStructure } from '../games/marble-reference-profile';
import { moneyText } from './marble-visuals';

const t = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;
export function MarblePropertyLedger({ tile, language, economicVersion, propertyRulesVersion, multiplier = 1 }: { tile: MarbleTile; language: Language; economicVersion?: number; propertyRulesVersion?: number; multiplier?: number }) {
  if (tile.referenceProfileId === classicMarbleReferenceProfile.id && tile.referenceCity) {
    const city = classicMarbleReferenceProfile.cities.find(item => item.name === tile.referenceCity);
    if (city) {
      const structures: readonly ClassicMarbleStructure[] = ['villa', 'building', 'hotel', 'landmark'];
      const activeBuildings = (tile as MarbleTile & { buildings?: ClassicMarbleBuildings }).buildings ?? {};
      const masks: ClassicMarbleBuildings[] = [{}, { villa: true }, { building: true }, { hotel: true }, { villa: true, building: true, hotel: true }, { villa: true, building: true, hotel: true, landmark: true }];
      const investment = (buildings: ClassicMarbleBuildings) => city.land + structures.filter(structure=>buildings[structure]).reduce((sum,structure)=>sum+(classicMarbleConstructionCost(city.name,structure)??0),0);
      const owned = structures.some(structure=>activeBuildings[structure]);
      const exampleNames = [t(language,'대지','Terreno'),t(language,'빌라만','Solo villa'),t(language,'빌딩만','Solo edificio'),t(language,'호텔만','Solo hotel'),t(language,'빌라+빌딩+호텔','Villa+edificio+hotel'),t(language,'랜드마크','Monumento')];
      const price=(value:number|null)=>value===null?t(language,'불가','Protegido'):moneyText(value,language);
      return <table className="marble-property-ledger"><caption>{t(language, '독립 건설 조합 · 대표 금액', 'Edificios independientes · importes de ejemplo')}</caption><thead><tr><th>{t(language, '건물 조합', 'Edificios')}</th><th>{t(language, '추가비', 'Costo extra')}</th><th>{t(language, '투자액', 'Invertido')}</th><th>{t(language, '통행료', 'Alquiler')}</th><th>{t(language, '인수', 'Adquirir')}</th></tr></thead><tbody>{owned&&<tr data-current-stage="true"><th>{t(language,'현재 보유','Actual')}</th><td>—</td><td>{price(investment(activeBuildings))}</td><td>{price(classicMarbleCityToll(city.name,activeBuildings))}</td><td>{price(classicMarbleAcquisitionPrice(city.name,activeBuildings))}</td></tr>}{masks.map((buildings, level) => {
        const extra = level === 0 ? city.land : level===4 ? classicMarbleConstructionCost(city.name,'hotel') : level===5 ? classicMarbleConstructionCost(city.name,'landmark') : classicMarbleConstructionCost(city.name,structures[level-1]);
        return <tr key={level} data-current-stage={!owned&&level===0?'true':undefined}><th>{exampleNames[level]}</th><td>{price(extra)}</td><td>{price(investment(buildings))}</td><td>{price(classicMarbleCityToll(city.name,buildings))}</td><td>{price(classicMarbleAcquisitionPrice(city.name,buildings))}</td></tr>;
      })}</tbody></table>;
    }
  }
  return <table className="marble-property-ledger"><caption>{t(language, '단계별 금액', 'Importes por nivel')}</caption><thead><tr><th>{t(language, '단계', 'Nivel')}</th><th>{t(language, '추가비', 'Costo extra')}</th><th>{t(language, '누적', 'Invertido')}</th><th>{t(language, '통행료', 'Alquiler')}</th>{propertyRulesVersion === 1 && <th>{t(language, '인수', 'Adquirir')}</th>}</tr></thead><tbody>{[0,1,2,3].map(level => <tr key={level}><th>{level === 0 ? t(language, '대지', 'Terreno') : level === 3 ? t(language, '랜드마크', 'Monumento') : `${level}`}</th><td>{level === 0 ? tile.price : marbleBuildCost(tile, level - 1, economicVersion)}</td><td>{marbleCityValue(tile, level, economicVersion)}</td><td>{marbleRentAtStage(tile.rent ?? 0, level, economicVersion, true, tile.rentMultipliers, multiplier)}</td>{propertyRulesVersion === 1 && <td>{marbleTakeoverPrice(tile, level, economicVersion) ?? t(language, '불가', 'Protegido')}</td>}</tr>)}</tbody></table>;
}
type SaleChoice = { label: Record<Language, string>; action: GameAction };
export function MarblePropertySale({ choices, language, runAction, selectedTile, onSelectTile, disabled = false }: { choices: SaleChoice[]; language: Language; runAction: (action: GameAction) => unknown; selectedTile: number | null; onSelectTile: (tile: number) => void; disabled?: boolean }) {
  const choice = selectMarblePropertySale(choices, selectedTile);
  if (!choice) return null;
  return <div className="marble-property-sale"><label>{t(language, '도시 매각으로 지급', 'Vender para pagar')}<select value={String(choice.action.payload?.tile)} onChange={event => onSelectTile(Number(event.target.value))} disabled={disabled}>{choices.map(item => <option key={String(item.action.payload?.tile)} value={String(item.action.payload?.tile)}>{item.label[language]}</option>)}</select></label><button disabled={disabled} onClick={() => void runAction(choice.action)}>{t(language, '선택 도시·건물 매각', 'Vender ciudad y edificios')}</button></div>;
}
