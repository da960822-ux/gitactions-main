import type { GameId, Language } from '../core/types';

export type GameCatalogEntry = { id: GameId; title: Record<Language, string>; subtitle: Record<Language, string>; icon: string; color: string; duration: string };

/** Static bilingual metadata keeps the landing page independent of the game service. */
export const gameCatalog: GameCatalogEntry[] = [
  { id: 'davinci', title: { ko: '다빈치 코드', es: 'El código Da Vinci' }, subtitle: { ko: '상대 타일의 숫자를 추리해요', es: 'Deduce los números de las fichas de tu pareja' }, icon: '◈', color: 'blue', duration: '15–25 min' },
  { id: 'catchmind', title: { ko: '캐치마인드', es: 'Adivina el dibujo' }, subtitle: { ko: '그리고 단어를 맞혀요', es: 'Dibuja una palabra para que tu pareja la adivine' }, icon: '✎', color: 'coral', duration: '10–20 min' },
  { id: 'domino', title: { ko: '도미노', es: 'Dominó' }, subtitle: { ko: '같은 숫자끼리 타일을 이어요', es: 'Conecta los números iguales de las fichas' }, icon: '▥', color: 'green', duration: '15–30 min' },
  { id: 'jaipur', title: { ko: '자이푸르', es: 'Jaipur' }, subtitle: { ko: '상품을 모으고 팔아요', es: 'Reúne productos y véndelos' }, icon: '♧', color: 'gold', duration: '20–30 min' },
  { id: 'splendor', title: { ko: '스플렌더', es: 'Splendor' }, subtitle: { ko: '보석으로 개발 카드를 사요', es: 'Compra cartas con gemas' }, icon: '✧', color: 'purple', duration: '25–35 min' },
  { id: 'minhwatu', title: { ko: '민화투', es: 'Minhwatu' }, subtitle: { ko: '월을 맞춰 카드를 모아요', es: 'Busca coincidencias por mes y captura cartas' }, icon: '花', color: 'pink', duration: '20–35 min' },
  { id: 'marble', title: { ko: '부루마블 (우리 규칙)', es: 'Marble · juego de bienes raíces' }, subtitle: { ko: '주사위를 굴리고 땅을 사요', es: 'Tira dados y compra propiedades' }, icon: '●', color: 'mint', duration: '10–20 min' },
  { id: 'rhythm', title: { ko: '뮤직톡톡', es: 'Music Talk Talk' }, subtitle: { ko: '리듬에 맞춰 키를 눌러요', es: 'Pulsa las teclas al ritmo' }, icon: '♫', color: 'blue', duration: '∞' },
];

export const getGame = (id: GameId | string) => gameCatalog.find(game => game.id === id);
