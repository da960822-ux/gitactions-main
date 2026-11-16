import { worldIslandsMetadata, WORLD_ISLANDS_PROFILE } from './marbleWorldIslands';
export { worldIslandsBoard, worldFestivalBoard, worldTravelBoard, worldIslandsBoardFor, worldIslandsProfile, completedPropertyLines, worldOwnershipVictory, isPurchasableMarbleTile } from './marbleWorldIslands';
import { classicCityEconomies, classicTourismEconomy } from './marbleClassicEconomy';
import type { MarbleTile } from './marble';

export type MarbleBoardProfile = 'classic-korea-2015' | typeof WORLD_ISLANDS_PROFILE;
export const classicKoreaProfile = {
  id: 'classic-korea-2015' as const,
  routeVersion: 4 as const,
  size: 32,
  status: 'research-pending' as const,
  source: 'https://www.inven.co.kr/board/mogong/4222/618',
  observedDate: '2015-05-02',
  pendingRules: ['korea-city-economy', 'tourism-growth-and-tolls', 'expo', 'bonus-game', 'random-event', 'fortune-deck', 'team-rules', 'victory-and-settlement'] as const,
};
const city = (ko: string, es: string, group: string): MarbleTile => {
  const cityEconomy = classicCityEconomies[ko];
  if (!cityEconomy) throw new Error(`Missing classic city economy: ${ko}`);
  return { kind: 'property', name: { ko, es }, group, cityEconomy, price: cityEconomy.landCost, rent: cityEconomy.tollByMask[0]! };
};
const special = (kind: MarbleTile['kind'], ko: string, es: string): MarbleTile => ({ kind, name: { ko, es } });
const tourism = (ko: string, es: string, tourismGroup: 'mountain' | 'park'): MarbleTile => ({ kind: 'tourism', name: { ko, es }, tourismGroup, tourismEconomy: classicTourismEconomy, price: classicTourismEconomy.purchaseCost, rent: classicTourismEconomy.tollStages[0] });
// Exact observed2015 route; zero-stat economics resolved from the2013 calculator under a separate version. Gameplay remains gated.
export const classicKoreaBoard: MarbleTile[] = [
  special('start', '시작', 'Salida'),
  city('강릉', 'Gangneung', 'korea-g1'),
  special('bonus-game', '오락실', 'Sala de juegos'),
  city('춘천', 'Chuncheon', 'korea-g1'),
  tourism('북한산', 'Bukhansan', 'mountain'),
  city('경주', 'Gyeongju', 'korea-g2'),
  city('안동', 'Andong', 'korea-g2'),
  city('천안', 'Cheonan', 'korea-g2'),
  special('island', '감옥', 'Cárcel'),
  tourism('서울대공원', 'Gran Parque de Seúl', 'park'),
  city('인천', 'Incheon', 'korea-g3'),
  city('대전', 'Daejeon', 'korea-g3'),
  special('event', '포츈카드', 'Carta de fortuna'),
  city('청주', 'Cheongju', 'korea-g4'),
  tourism('설악산', 'Seoraksan', 'mountain'),
  city('세종', 'Sejong', 'korea-g4'),
  special('expo', '엑스포', 'Expo'),
  city('여수', 'Yeosu', 'korea-g5'),
  tourism('지리산', 'Jirisan', 'mountain'),
  city('제주', 'Jeju', 'korea-g5'),
  special('event', '포츈카드', 'Carta de fortuna'),
  city('포항', 'Pohang', 'korea-g6'),
  city('울산', 'Ulsan', 'korea-g6'),
  city('대구', 'Daegu', 'korea-g6'),
  special('train', '기차여행', 'Viaje en tren'),
  tourism('어린이대공원', 'Gran Parque Infantil', 'park'),
  city('전주', 'Jeonju', 'korea-g7'),
  city('광주', 'Gwangju', 'korea-g7'),
  special('event', '포츈카드', 'Carta de fortuna'),
  city('부산', 'Busan', 'korea-g8'),
  special('random-event', '복불복', 'Suerte o mala suerte'),
  city('서울', 'Seúl', 'korea-g8'),
];
export function marbleBoardProfileMetadata(profile?: MarbleBoardProfile, revision?: number, board?: MarbleTile[]) {
  const metadata = profile === 'classic-korea-2015' ? structuredClone(classicKoreaProfile) : profile === WORLD_ISLANDS_PROFILE ? structuredClone(worldIslandsMetadata(revision)) : null;
  const tourism = board?.find(tile => tile.kind === 'tourism');
  return metadata && 'tourismToll' in metadata && tourism ? { ...metadata, tourismToll: tourism.rent ?? metadata.tourismToll } : metadata;
}
export const marbleProfilePending = (profile?: MarbleBoardProfile) => profile === 'classic-korea-2015';
