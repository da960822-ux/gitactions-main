import { legacyInitial } from './marble.effectFixtures';
import { describe, expect, it } from 'vitest';
import { classicCityEconomies, classicConstructionCost, classicEconomyConfig, classicInvestment, classicSaleValue, classicTakeoverPrice, classicToll, classicTourismEconomy, CLASSIC_ECONOMY_PROFILE } from './marbleClassicEconomy';
import { classicSourceCities } from './marbleClassicEconomyData';
import { marbleBaseRent, marbleLandPrice, marblePassStartSalary } from './marbleEconomy';
import { classicKoreaBoard } from './marbleBoardProfiles';
import { createClassicKoreaResearchState, marbleEngine } from './marble';
import { createFourClassicKoreaResearchState, fourMarbleEngine } from './fourMarble';
const all = { houses: 2, buildings: ['villa','building','hotel'] as const };
const allProperty = () => ({ ...all, buildings: [...all.buildings] });
describe('versioned zero-stat classic calculator economy', () => {
  it('uses one first-class×5 and display×3/10000 conversion for all18 source rows', () => {
    expect(Object.keys(classicCityEconomies)).toHaveLength(18);
    for (const [name,,,[land,villa,building,hotel,landmark],tolls] of classicSourceCities) {
      const city = classicCityEconomies[name];
      expect([city.landCost,city.buildCosts.villa,city.buildCosts.building,city.buildCosts.hotel,city.landmarkCost]).toEqual([land,villa,building,hotel,landmark].map(raw=>raw*15/10000));
      expect([0,1,3,7].map(mask=>city.tollByMask[mask])).toEqual(tolls.slice(0,4).map(raw=>raw*15/10000));
      expect(city.landmarkToll).toBe(tolls[4]*15/10000);
      expect(city.inferredTollMasks).toEqual([2,4,5,6]);
    }
  });
  it('reconstructs missing masks explicitly and crosschecks Cairo building-only56,000', () => {
    const cairoRow = classicCityEconomies['천안'];
    expect(cairoRow.tollByMask[2]).toBe(56000*15/10000);
    expect(cairoRow.inferredTollMasks).toContain(2);
    const seoul=classicCityEconomies['서울'];
    expect(seoul).toMatchObject({ landCost:300,buildCosts:{villa:120,building:360,hotel:600},landmarkCost:600,landmarkToll:2820 });
    expect(classicConstructionCost(seoul,{buildings:['building']})).toBe(360);
    expect(classicInvestment(seoul,allProperty())).toBe(1380);
    expect(classicToll(seoul,{...allProperty(),landmark:true})).toBe(2820);
    expect(classicTakeoverPrice(seoul,allProperty())).toBe(2760);
    expect(classicTakeoverPrice(seoul,{...allProperty(),landmark:true})).toBeNull();
  });
  it('preserves fractional display units and excludes extra landmark investment from zero-stat sale', () => {
    const first=classicCityEconomies['강릉'],seoul=classicCityEconomies['서울'];
    expect(classicSaleValue(first,{houses:1,buildings:['villa']})).toBe(22.5);
    expect(classicSaleValue(classicCityEconomies['춘천'],{houses:0,buildings:[]})).toBe(19.5);
    expect(classicSaleValue(seoul,allProperty())).toBe(690);
    expect(classicSaleValue(seoul,{...allProperty(),landmark:true})).toBe(690);
  });
  it('keeps tourism prices distinct and does not apply city color multipliers', () => {
    expect(classicTourismEconomy).toMatchObject({purchaseCost:150,tollStages:[120,240,480],colorMultiplierApplies:false});
    expect(classicEconomyConfig).toMatchObject({startingCash:3000,passStartSalary:450,travelFare:null,jailEscapeFee:null,expoFee:null});
  });
  it('exposes actual profile values without applying legacy0.8 prices a second time', () => {
    const seoul=classicKoreaBoard[31];
    expect(marbleLandPrice(seoul,3)).toBe(300); expect(marbleBaseRent(seoul,3)).toBe(120);
    expect(marblePassStartSalary(3,CLASSIC_ECONOMY_PROFILE)).toBe(450); expect(marblePassStartSalary(3)).toBe(300);
    const two=marbleEngine.getPlayerView({...createClassicKoreaResearchState(),rentRulesVersion:1},'p1');
    const four:any=fourMarbleEngine.getPlayerView({...createFourClassicKoreaResearchState(),rentRulesVersion:1},'p1');
    expect(two.board.tiles[31]).toMatchObject({price:300,rent:120}); expect(four.publicBoard[31]).toMatchObject({price:300,rent:120});
    expect(two.actions).toEqual([]); expect(four.actions).toEqual([]);
    two.board.tiles[31].cityEconomy!.tollByMask[0]=999; expect(classicCityEconomies['서울'].tollByMask[0]).toBe(120);
    expect(marbleEngine.getPlayerView(legacyInitial(marbleEngine, 1),'p1').board.tiles[1]).toMatchObject({price:80,rent:20});
  });
});
