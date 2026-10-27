import type { Language } from '../core/types';

const names = [
  ['대양의 여왕 리스벳', 'Lisbeth, reina de los océanos'],
  ['루비 여제 리스벳', 'Lisbeth, emperatriz del rubí'],
  ['카리브의 지도자 리스벳', 'Lisbeth, líder del Caribe'],
  ['에메랄드 여왕 리스벳', 'Lisbeth, reina de la esmeralda'],
  ['지혜의 왕 연석', 'Yeonseok, rey de la sabiduría'],
  ['메디치 공작 연석', 'Yeonseok, duque de Médici'],
  ['황금의 술탄 연석', 'Yeonseok, sultán de oro'],
  ['태양왕 연석', 'Yeonseok, el Rey Sol'],
  ['황금 제국의 두 군주', 'Los dos soberanos del Imperio Dorado'],
  ['두 왕국의 공동 통치자', 'Los corregentes de dos reinos'],
  ['검은 너울의 황진이', 'Hwang Jin-yi del velo negro'],
  ['황금 비단의 황진이', 'Hwang Jin-yi de seda dorada'],
  ['붉은 연회의 황진이', 'Hwang Jin-yi del banquete rojo'],
  ['바차타의 여왕 리스벳', 'Lisbeth, reina de la bachata'],
  ['카리브 축제의 여왕', 'La reina del festival caribeño'],
  ['산토도밍고의 장미', 'La rosa de Santo Domingo'],
] as const;

export function splendorNobleName(id: unknown, language: Language): string {
  const index = /^n(0|[1-9]\d*)$/.exec(String(id))?.[1];
  return (index === undefined ? undefined : names[Number(index)]?.[language === 'ko' ? 0 : 1]) ?? (language === 'ko' ? '귀족' : 'Noble');
}
