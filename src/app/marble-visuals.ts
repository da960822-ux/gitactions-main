import type { Language } from '../core/types';
import { marblePawnCatalog, type MarblePawnId } from './MarblePawn';
import { marbleRentAtStage } from '../games/marble-economy';
const copy = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;
const num = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
export const moneyText = (value: number, language: Language) => value.toLocaleString(language === 'ko' ? 'ko-KR' : 'es-DO');
export const groups: Record<string, Record<Language, string>> = {
  green: { ko: '숲', es: 'Bosque' }, blue: { ko: '바다', es: 'Mar' }, purple: { ko: '보랏빛', es: 'Violeta' }, orange: { ko: '노을', es: 'Atardecer' },
  red: { ko: '정원', es: 'Jardín' }, yellow: { ko: '햇살', es: 'Sol' }, teal: { ko: '청록', es: 'Turquesa' }, dark: { ko: '밤', es: 'Noche' },
  pink: { ko: '분홍', es: 'Rosado' }, brown: { ko: '대지', es: 'Tierra' }, gold: { ko: '금빛', es: 'Dorado' }, silver: { ko: '은빛', es: 'Plateado' },
};
export const specialNames: Record<string, Record<Language, string>> = {
  start: { ko: '출발', es: 'Salida' }, tax: { ko: '세금', es: 'Impuesto' }, rest: { ko: '휴식', es: 'Descanso' }, event: { ko: '황금 열쇠', es: 'Llave dorada' },
  island: { ko: '무인도', es: 'Isla desierta' }, train: { ko: '열차역', es: 'Estación de tren' }, fund: { ko: '사회복지기금', es: 'Fondo social' }, 'fund-deposit': { ko: '기금 납부', es: 'Aporte al fondo' },
};
export const cityArtNames: Record<string, string> = {
  베를린: 'berlin', 'Berlín': 'berlin', 마이애미: 'miami', Miami: 'miami', 이스탄불: 'istanbul', Estambul: 'istanbul', 아그라: 'agra', Agra: 'agra', 아테네: 'athens', Atenas: 'athens', 시드니: 'sydney', 'Sídney': 'sydney',
  광주: 'gwangju', Gwangju: 'gwangju', 산토도밍고: 'santo-domingo', 'Santo Domingo': 'santo-domingo', 마드리드: 'madrid', Madrid: 'madrid', 산티아고: 'santiago', Santiago: 'santiago',
  푸에르토플라타: 'puerto-plata', 'Puerto Plata': 'puerto-plata', 산후안: 'san-juan', 'San Juan': 'san-juan', 라베가: 'la-vega', 'La Vega': 'la-vega', 푼타카나: 'punta-cana', 'Punta Cana': 'punta-cana',
  뉴욕: 'new-york', 'Nueva York': 'new-york', 파리: 'paris', 'París': 'paris', 도쿄: 'tokyo', Tokio: 'tokyo', 바르셀로나: 'barcelona', Barcelona: 'barcelona', 사마나: 'samana', 'Samaná': 'samana',
  아바나: 'havana', 'La Habana': 'havana', 멕시코시티: 'mexico-city', 'Ciudad de México': 'mexico-city', 리스본: 'lisbon', Lisboa: 'lisbon', 런던: 'london', Londres: 'london', 로마: 'rome', Roma: 'rome',
  뉴어크: 'newark', Newark: 'newark', 서울: 'seoul', 'Seúl': 'seoul', 발파라이소: 'valparaiso', 'Valparaíso': 'valparaiso', 세부: 'cebu', Cebú: 'cebu', 토론토: 'toronto', Toronto: 'toronto', 오클랜드: 'auckland', Auckland: 'auckland', 밴쿠버: 'vancouver', Vancouver: 'vancouver',
};

export function cityFlag(names: Record<string, unknown>): string | null {
  const known: Record<string, string> = {
    광주: 'kr', Gwangju: 'kr', 산토도밍고: 'do', 'Santo Domingo': 'do', 마드리드: 'es', Madrid: 'es', 산티아고: 'do', Santiago: 'do',
    푸에르토플라타: 'do', 'Puerto Plata': 'do', 산후안: 'pr', 'San Juan': 'pr', 라베가: 'do', 'La Vega': 'do', 푼타카나: 'do', 'Punta Cana': 'do',
    뉴욕: 'us', 'Nueva York': 'us', 파리: 'fr', 'París': 'fr', 도쿄: 'jp', Tokio: 'jp', 바르셀로나: 'es', Barcelona: 'es', 사마나: 'do', 'Samaná': 'do',
    아바나: 'cu', 'La Habana': 'cu', 멕시코시티: 'mx', 'Ciudad de México': 'mx', 리스본: 'pt', Lisboa: 'pt', 런던: 'gb', Londres: 'gb', 로마: 'it', Roma: 'it',
    뉴어크: 'us', Newark: 'us', 서울: 'kr', 'Seúl': 'kr', 마이애미: 'us', Miami: 'us', 발파라이소: 'cl', 'Valparaíso': 'cl', 세부: 'ph', Cebú: 'ph', 토론토: 'ca', Toronto: 'ca', 오클랜드: 'nz', Auckland: 'nz', 밴쿠버: 'ca', Vancouver: 'ca',
  };
  for (const name of Object.values(names)) if (typeof name === 'string' && known[name]) return known[name];
  return null;
}

export function pawnId(value: unknown): MarblePawnId | null {
  return marblePawnCatalog.some(item => item.id === value) ? value as MarblePawnId : null;
}
export function buildingName(level: number, language: Language, modern: boolean) {
  if (modern) return level >= 3 ? copy(language, '랜드마크', 'Monumento') : level === 2 ? copy(language, '아파트', 'Apartamentos') : level === 1 ? copy(language, '단독주택', 'Casa unifamiliar') : '';
  return level ? copy(language, '집', 'Casa') : '';
}
export function rentValue(tile: Record<string, any>, modern: boolean) {
  const level = num(tile.houses);
  const multipliers = Array.isArray(tile.rentMultipliers) ? tile.rentMultipliers as number[] : undefined;
  return marbleRentAtStage(num(tile.rent), level, undefined, modern, multipliers, num(tile.monopolyMultiplier) || 1);
}
