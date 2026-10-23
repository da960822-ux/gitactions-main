import type { Language } from '../core/types';
import { MINHWATU_GODORI_BONUS } from '../games/minhwatu';
import '../styles/minhwatu-guide.css';

type FaceInfo = { name: Record<Language, string>; kind: Record<Language, string>; points: number };
const faces: Record<string, FaceInfo> = {
  '01-01': { name: { ko: '학', es: 'grulla' }, kind: { ko: '광', es: 'brillante' }, points: 20 },
  '01-02': { name: { ko: '홍단', es: 'Hongdan' }, kind: { ko: '띠', es: 'cinta' }, points: 5 },
  '01-03': { name: { ko: '솔', es: 'pino' }, kind: { ko: '피', es: 'simple' }, points: 0 },
  '01-04': { name: { ko: '솔', es: 'pino' }, kind: { ko: '피', es: 'simple' }, points: 0 },
  '02-01': { name: { ko: '새', es: 'ave' }, kind: { ko: '열끗', es: 'animal' }, points: 10 },
  '02-02': { name: { ko: '홍단', es: 'Hongdan' }, kind: { ko: '띠', es: 'cinta' }, points: 5 },
  '03-02': { name: { ko: '홍단', es: 'Hongdan' }, kind: { ko: '띠', es: 'cinta' }, points: 5 },
  '04-01': { name: { ko: '새', es: 'ave' }, kind: { ko: '열끗', es: 'animal' }, points: 10 },
  '04-02': { name: { ko: '초단', es: 'Chodan' }, kind: { ko: '띠', es: 'cinta' }, points: 5 },
  '05-02': { name: { ko: '초단', es: 'Chodan' }, kind: { ko: '띠', es: 'cinta' }, points: 5 },
  '06-02': { name: { ko: '청단', es: 'Cheongdan' }, kind: { ko: '띠', es: 'cinta' }, points: 5 },
  '07-02': { name: { ko: '초단', es: 'Chodan' }, kind: { ko: '띠', es: 'cinta' }, points: 5 },
  '08-02': { name: { ko: '새', es: 'ave' }, kind: { ko: '열끗', es: 'animal' }, points: 10 },
  '09-02': { name: { ko: '청단', es: 'Cheongdan' }, kind: { ko: '띠', es: 'cinta' }, points: 5 },
  '10-02': { name: { ko: '청단', es: 'Cheongdan' }, kind: { ko: '띠', es: 'cinta' }, points: 5 },
};

function Face({ id, language, selected = false }: { id: string; language: Language; selected?: boolean }) {
  const face = faces[id];
  if (!face) return null;
  const month = Number(id.slice(0, 2));
  const monthText = language === 'ko' ? `${month}월` : `Mes ${month}`;
  const description = `${monthText} · ${face.kind[language]} · ${face.name[language]} · ${face.points} ${language === 'ko' ? '점' : 'pts'}`;
  return <figure className={`minhwatu-guide-face${selected ? ' is-selected' : ''}`}>
    <img src={`/images/hwatu/${id}.svg`} width="103" height="168" alt={description}/>
    <figcaption>{monthText}</figcaption>
  </figure>;
}

const matches = [
  { count: 0, hand: '01-01', table: ['02-01'], take: [], ko: '달이 다르면 낸 패가 바닥에 남아요.', es: 'Si no coincide el mes, la carta jugada se queda en la mesa.' },
  { count: 1, hand: '01-01', table: ['01-03'], take: ['01-03'], ko: '낸 패와 같은 달 바닥 패를 함께 가져와요.', es: 'Te llevas la carta jugada y la carta del mismo mes en la mesa.' },
  { count: 2, hand: '01-01', table: ['01-03', '01-04'], take: ['01-03'], ko: '바닥에서 하나를 골라, 낸 패와 함께 가져와요.', es: 'Elige una de las dos cartas y llévatela con la que jugaste.' },
  { count: 3, hand: '01-01', table: ['01-02', '01-03', '01-04'], take: ['01-02', '01-03', '01-04'], ko: '낸 패와 바닥의 세 장, 모두 4장을 가져와요.', es: 'Te llevas la carta jugada y las tres de la mesa.' },
];

const ribbons = [
  { name: { ko: '홍단', es: 'Hongdan' }, cards: ['01-02', '02-02', '03-02'] },
  { name: { ko: '청단', es: 'Cheongdan' }, cards: ['06-02', '09-02', '10-02'] },
  { name: { ko: '초단', es: 'Chodan' }, cards: ['04-02', '05-02', '07-02'] },
];

export function MinhwatuGuide({ language }: { language: Language }) {
  const ko = language === 'ko';
  const categories = [
    { id: '01-01', label: ko ? '광' : 'Brillante', points: 20 },
    { id: '02-01', label: ko ? '열끗' : 'Animal', points: 10 },
    { id: '01-02', label: ko ? '띠' : 'Cinta', points: 5 },
    { id: '01-03', label: ko ? '피' : 'Simple', points: 0 },
  ];
  return <section className="minhwatu-guide" aria-label={ko ? '민화투 하는 법' : 'Cómo jugar Minhwatu'}>
    <p className="minhwatu-guide-goal">{ko ? '같은 달 카드를 모아 점수를 얻고, 마지막 점수가 높은 사람이 이겨요.' : 'Junta cartas del mismo mes para sumar puntos; gana quien termine con más.'}</p>
    <p className="minhwatu-guide-month-rule">{ko ? '표시는 같은 달 패예요. 광·띠처럼 종류가 같을 필요는 없어요.' : 'Las cartas marcadas son del mismo mes; no tienen que ser de la misma categoría.'}</p>

    <ol className="minhwatu-guide-steps">
      <li><b>{ko ? '손패 내기' : 'Juega una carta'}</b><span>{ko ? '아래는 내 손패, 중앙은 공개 바닥이에요. 내 차례에 손패 한 장을 눌러 선택해요. 강조된 패는 바닥에 같은 달 짝이 있어요. 확정 전에는 Esc로 취소해요.' : 'Abajo está tu mano; en el centro, la mesa pública. En tu turno pulsa una carta de tu mano; las resaltadas tienen pareja del mismo mes. Antes de confirmar, Esc cancela la selección.'}</span></li>
      <li><b>{ko ? '바닥 후보 고르기' : 'Elige una de la mesa'}</b><span>{ko ? '같은 달 후보가 두 장이면 하나를 눌러 확정해요. 아니면 선택 뒤 나타난 ‘N월 패 내기’를 눌러요. 예: 1월 손패와 1월 바닥은 그림 종류가 달라도 짝이에요.' : 'Si hay dos del mismo mes, pulsa una para confirmar. Si no, pulsa el botón «Jugar la carta del mes N» que aparece tras elegir tu carta. Ejemplo: dos cartas de enero hacen pareja aunque sus dibujos sean distintos.'}</span></li>
      <li><b>{ko ? '더미에서 공개' : 'Se revela una carta'}</b><span>{ko ? '더미 맨 위가 자동 공개돼요. 두 후보면 하나를 골라요.' : 'El juego revela la primera carta del mazo; si hay dos opciones, eliges una.'}</span></li>
    </ol>

    <div className="minhwatu-match-grid">
      {matches.map(example => <article className="minhwatu-match-case" key={example.count}>
        <h4>{ko ? `같은 달 ${example.count}장` : `${example.count} ${example.count === 1 ? 'coincidencia' : 'coincidencias'}`}</h4>
        <div className="minhwatu-match-visual">
          <div className="minhwatu-match-source"><span>{ko ? '손패' : 'Tu mano'}</span><Face id={example.hand} language={language}/></div>
          <span className="minhwatu-match-arrow" aria-hidden="true">→</span>
          <div className="minhwatu-match-source"><span>{ko ? '바닥' : 'Mesa'}</span><div className="minhwatu-match-table-cards">
            {example.table.map(id => <Face key={id} id={id} language={language} selected={example.take.includes(id)}/>) }
          </div></div>
        </div>
        <p className="minhwatu-match-outcome"><b className="minhwatu-match-desktop">{ko ? `${example.count}장 일치 →` : `${example.count} ${example.count === 1 ? 'coincidencia' : 'coincidencias'} →`}</b> {example[language]} {example.take.length > 0 && <span className="minhwatu-match-desktop">{ko ? `획득 ${example.take.length + 1}장` : `Capturas ${example.take.length + 1}`}</span>}</p>
      </article>)}
    </div>

    <p className="minhwatu-guide-end">{ko ? '양쪽 손패와 더미가 비면 끝나요. 동점이면 무승부예요. 고·스톱은 없어요.' : 'La partida termina cuando se acaban las manos y el mazo. Si empatan, nadie gana. No hay Go ni Stop.'}</p>

    <details className="minhwatu-guide-details">
      <summary>{ko ? '점수·족보 그림 보기' : 'Ver cartas de puntos y combinaciones'}</summary>
      <section className="minhwatu-guide-detail-block">
        <h4>{ko ? '패 종류와 기본 점수' : 'Tipos de carta y puntos base'}</h4>
        <div className="minhwatu-category-grid">{categories.map(category => <div className="minhwatu-category-example" key={category.id}>
          <Face id={category.id} language={language}/><span><b>{category.label}</b><strong>{category.points} {ko ? '점' : 'pts'}</strong></span>
        </div>)}</div>
        <p className="minhwatu-guide-note">{ko ? '비광도 20점이고, 피는 모은 장수 보너스가 없어요.' : 'La brillante de lluvia también vale 20; las cartas simples no dan bono por cantidad.'}</p>
      </section>

      <section className="minhwatu-guide-detail-block">
        <h4>{ko ? '띠 조합 · 각 30점' : 'Combinaciones de cintas · 30 pts cada una'}</h4>
        <div className="minhwatu-ribbon-grid">{ribbons.map(set => <div className="minhwatu-combo-example" key={set.name.ko}>
          <b>{set.name[language]}</b><div>{set.cards.map(id => <Face key={id} id={id} language={language}/>)}</div>
        </div>)}</div>
        <div className="minhwatu-godori-example">
          <div><b>{ko ? `고도리 · ${MINHWATU_GODORI_BONUS}점` : `Godori · ${MINHWATU_GODORI_BONUS} pts`}</b><span>{ko ? '2·4·8월 새 세 장' : 'Las tres aves de febrero, abril y agosto'}</span></div>
          <div className="minhwatu-godori-cards">{['02-01', '04-01', '08-02'].map(id => <Face key={id} id={id} language={language}/>)}</div>
        </div>
        <p className="minhwatu-guide-note">{ko ? '월 완성은 11월 네 장 40점, 5·10·12월 네 장은 각각 20점이에요.' : 'Completar noviembre da 40 puntos; completar mayo, octubre o diciembre da 20 por mes.'}</p>
      </section>

      <section className="minhwatu-guide-detail-block">
        <h4>{ko ? '최종 점수 계산' : 'Cálculo final'}</h4>
        <p className="minhwatu-formula">{ko ? '기본점수 + 내 조합 보너스 × 2 − 상대 조합 보너스 = 최종 점수' : 'Puntos base + tus bonos × 2 − bonos rivales = total final'}</p>
        <p className="minhwatu-formula-example">{ko ? `예: 기본 30 + 내 고도리 ${MINHWATU_GODORI_BONUS} × 2 − 상대 보너스 0 = 130점. 상대 기본점수 20점에서 내 고도리 50점을 빼면 −30점이에요.` : `Ejemplo: base 30 + tu Godori de ${MINHWATU_GODORI_BONUS} × 2 − bono rival 0 = 130. Si la otra persona tiene 20 de base, tu Godori le resta 50: −30.`}</p>
        <p className="minhwatu-guide-note">{ko ? 'Go·Stop 없이 끝까지 진행해요. 이미 끝난 구버전 판은 당시 점수와 규칙을 유지해요.' : 'La partida va hasta el final, sin Go ni Stop. Las partidas antiguas terminadas conservan sus reglas y puntuación.'}</p>
      </section>
    </details>
  </section>;
}
