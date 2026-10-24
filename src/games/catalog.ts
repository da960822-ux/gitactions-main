import type { GameId, Language } from '../core/types';

export type GameCatalogEntry = { id: GameId; title: Record<Language, string>; subtitle: Record<Language, string>; icon: string; color: string; duration: string };

/** Static bilingual metadata keeps the landing page independent of the game service. */
export const gameCatalog: GameCatalogEntry[] = [
  { id: 'davinci', title: { ko: '다빈치 코드', es: 'El código Da Vinci' }, subtitle: { ko: '숨겨진 숫자와 조커를 하나씩 맞혀 봐요.', es: 'Descubre los números y comodines ocultos.' }, icon: '◈', color: 'blue', duration: '15–25 min' },
  { id: 'catchmind', title: { ko: '캐치마인드', es: 'Adivina el dibujo' }, subtitle: { ko: '번갈아 그리고, 그림 속 단어를 맞혀 봐요', es: 'Dibujen por turnos y adivinen la palabra.' }, icon: '✎', color: 'coral', duration: '10–20 min' },
  { id: 'domino', title: { ko: '도미노', es: 'Dominó' }, subtitle: { ko: '같은 숫자를 잇고 손패를 먼저 비워 봐요.', es: 'Une los números iguales y vacía tu mano primero.' }, icon: '▥', color: 'green', duration: '15–30 min' },
  { id: 'jaipur', title: { ko: '자이푸르', es: 'Jaipur' }, subtitle: { ko: '상품을 모아 팔고, 먼저 두 라운드를 이겨 봐요.', es: 'Reúne mercancías, véndelas y gana dos rondas.' }, icon: '♧', color: 'gold', duration: '20–30 min' },
  { id: 'splendor', title: { ko: '스플렌더', es: 'Splendor' }, subtitle: { ko: '보석으로 카드를 사고 점수를 모아요.', es: 'Compra cartas con gemas y suma puntos.' }, icon: '✧', color: 'purple', duration: '25–35 min' },
  { id: 'minhwatu', title: { ko: '민화투', es: 'Minhwatu' }, subtitle: { ko: '같은 달의 패를 맞춰 점수를 모아요.', es: 'Junta cartas del mismo mes y suma puntos.' }, icon: '花', color: 'pink', duration: '20–35 min' },
  { id: 'marble', title: { ko: '부루마블 (우리 규칙)', es: 'Marble · juego de bienes raíces' }, subtitle: { ko: '주사위를 굴려 도시를 사고 건물을 지어요.', es: 'Lanza los dados, compra ciudades y construye.' }, icon: '●', color: 'mint', duration: '10–20 min' },
  { id: 'rhythm', title: { ko: '뮤직톡톡', es: 'Music Talk Talk' }, subtitle: { ko: '음악에 맞춰 방향키와 스페이스바를 눌러요.', es: 'Sigue la música con las flechas y la barra espaciadora.' }, icon: '♫', color: 'blue', duration: '∞' },
];

export const getGame = (id: GameId | string) => gameCatalog.find(game => game.id === id);
