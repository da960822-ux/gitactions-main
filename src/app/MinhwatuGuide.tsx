import type { Language } from '../core/types';
import { MINHWATU_GODORI_BONUS } from '../games/minhwatu';
import '../styles/minhwatu-guide.css';

type FaceInfo = { name: Record<Language, string>; kind: Record<Language, string>; points: number };

const faceInfo: Record<string, FaceInfo> = {
  '01-01': { name: { ko: '학', es: 'grulla' }, kind: { ko: '광', es: 'brillante' }, points: 20 },
  '01-02': { name: { ko: '홍단', es: 'Hongdan' }, kind: { ko: '띠', es: 'cinta' }, points: 5 },
  '01-03': { name: { ko: '솔', es: 'pino' }, kind: { ko: '피', es: 'simple' }, points: 0 },
  '01-04': { name: { ko: '솔', es: 'pino' }, kind: { ko: '피', es: 'simple' }, points: 0 },
  '02-01': { name: { ko: '꾀꼬리', es: 'ruiseñor' }, kind: { ko: '열끗', es: 'animal' }, points: 10 },
  '02-02': { name: { ko: '홍단', es: 'Hongdan' }, kind: { ko: '띠', es: 'cinta' }, points: 5 },
  '02-03': { name: { ko: '매화', es: 'ciruelo' }, kind: { ko: '피', es: 'simple' }, points: 0 },
  '02-04': { name: { ko: '매화', es: 'ciruelo' }, kind: { ko: '피', es: 'simple' }, points: 0 },
  '03-02': { name: { ko: '홍단', es: 'Hongdan' }, kind: { ko: '띠', es: 'cinta' }, points: 5 },
  '04-01': { name: { ko: '두견새', es: 'cuco' }, kind: { ko: '열끗', es: 'animal' }, points: 10 },
  '04-02': { name: { ko: '초단', es: 'Chodan' }, kind: { ko: '띠', es: 'cinta' }, points: 5 },
  '05-02': { name: { ko: '초단', es: 'Chodan' }, kind: { ko: '띠', es: 'cinta' }, points: 5 },
  '06-02': { name: { ko: '청단', es: 'Cheongdan' }, kind: { ko: '띠', es: 'cinta' }, points: 5 },
  '07-02': { name: { ko: '초단', es: 'Chodan' }, kind: { ko: '띠', es: 'cinta' }, points: 5 },
  '08-02': { name: { ko: '기러기', es: 'gansos' }, kind: { ko: '열끗', es: 'animal' }, points: 10 },
  '09-02': { name: { ko: '청단', es: 'Cheongdan' }, kind: { ko: '띠', es: 'cinta' }, points: 5 },
  '10-02': { name: { ko: '청단', es: 'Cheongdan' }, kind: { ko: '띠', es: 'cinta' }, points: 5 },
};

const monthName = (id: string, language: Language) => {
  const month = Number(id.slice(0, 2));
  return language === 'ko' ? `${month}월` : `Mes ${month}`;
};

function Face({ id, language, highlight = false }: { id: string; language: Language; highlight?: boolean }) {
  const info = faceInfo[id];
  if (!info) return null;
  const description = `${monthName(id, language)} · ${info.kind[language]} · ${info.name[language]} · ${info.points} ${language === 'ko' ? '점' : 'pts'}`;
  return <figure className={`minhwatu-guide-face${highlight ? ' is-capture' : ''}`}>
    <img src={`/images/hwatu/${id}.svg`} width="103" height="168" alt={description}/>
    <figcaption>{monthName(id, language)}</figcaption>
  </figure>;
}

const matchingCases: { title: Record<Language, string>; hand: string; table: string[]; selected: string[]; result: Record<Language, string> }[] = [
  { title: { ko: '0장 일치', es: '0 coincidencias' }, hand: '01-01', table: ['02-01'], selected: [], result: { ko: '낸 패가 바닥에 남아요.', es: 'Tu carta se queda en la mesa.' } },
  { title: { ko: '1장 일치', es: '1 coincidencia' }, hand: '01-01', table: ['01-03'], selected: ['01-03'], result: { ko: '손패와 바닥 패를 함께 가져와요.', es: 'Capturas tu carta y la de la mesa.' } },
  { title: { ko: '2장 일치', es: '2 coincidencias' }, hand: '01-01', table: ['01-03', '01-04'], selected: ['01-03'], result: { ko: '바닥 패 하나를 골라 가져와요.', es: 'Elige una carta de la mesa para capturar.' } },
  { title: { ko: '3장 일치', es: '3 coincidencias' }, hand: '01-01', table: ['01-02', '01-03', '01-04'], selected: ['01-02', '01-03', '01-04'], result: { ko: '바닥의 세 장을 모두 가져와요.', es: 'Capturas las tres cartas de la mesa.' } },
];

const ribbonSets = [
  { id: 'hongdan', label: { ko: '홍단 · 30점', es: 'Hongdan · 30 pts' }, cards: ['01-02', '02-02', '03-02'] },
  { id: 'cheongdan', label: { ko: '청단 · 30점', es: 'Cheongdan · 30 pts' }, cards: ['06-02', '09-02', '10-02'] },
  { id: 'chodan', label: { ko: '초단 · 30점', es: 'Chodan · 30 pts' }, cards: ['04-02', '05-02', '07-02'] },
] as const;

function SectionTitle({ id, children }: { id: string; children: string }) { return <h3 className="minhwatu-guide-section-title" id={id}>{children}</h3>; }

export function MinhwatuGuide({ language }: { language: Language }) {
  const ko = language === 'ko';
  const categories = [
    { id: '01-01', label: ko ? '광' : 'Brillante', value: 20 },
    { id: '02-01', label: ko ? '열끗' : 'Animal', value: 10 },
    { id: '03-02', label: ko ? '띠' : 'Cinta', value: 5 },
    { id: '01-03', label: ko ? '피' : 'Simple', value: 0 },
  ];
  return <section className="minhwatu-guide" aria-labelledby="minhwatu-guide-title">
    <header className="minhwatu-guide-heading">
      <div>
        <h3 id="minhwatu-guide-title">{ko ? '실제 패 그림으로 보는 민화투' : 'Minhwatu con las cartas del juego'}</h3>
        <p>{ko ? '그림과 월 표시는 게임에 쓰이는 48장 원본 패예요.' : 'Las imágenes y los meses son las 48 cartas originales de la partida.'}</p>
      </div>
    </header>

    <section className="minhwatu-guide-block" aria-labelledby="minhwatu-match-title">
      <SectionTitle id="minhwatu-match-title">{ko ? '같은 달 패를 어떻게 가져오나요?' : '¿Cómo se capturan las cartas del mismo mes?'}</SectionTitle>
      <div className="minhwatu-match-grid">
        {matchingCases.map(example => <article className="minhwatu-match-case" key={example.title.ko}>
          <h4>{example.title[language]}</h4>
          <div className="minhwatu-match-visual">
            <div className="minhwatu-match-source">
              <span>{ko ? '손패' : 'Tu mano'}</span>
              <Face id={example.hand} language={language}/>
            </div>
            <span className="minhwatu-match-arrow" aria-hidden="true">→</span>
            <div className="minhwatu-match-source">
              <span>{ko ? '바닥' : 'Mesa'}</span>
              <div className="minhwatu-match-table-cards">
                {example.table.map(id => <Face key={id} id={id} language={language} highlight={example.selected.includes(id)}/>) }
              </div>
            </div>
          </div>
          <p>{example.result[language]}</p>
        </article>)}
      </div>
      <div className="minhwatu-draw-example">
        <div className="minhwatu-draw-step"><span>{ko ? '손패를 낸 뒤' : 'Después de jugar'}</span><Face id="01-01" language={language}/></div>
        <span className="minhwatu-match-arrow" aria-hidden="true">→</span>
        <div className="minhwatu-draw-step"><span>{ko ? '더미 맨 위 공개' : 'Se revela el mazo'}</span><Face id="01-04" language={language}/></div>
        <p>{ko ? '공개된 더미 패에도 같은 달 규칙을 적용해요.' : 'A la carta revelada se aplica la misma regla del mes.'}</p>
      </div>
    </section>

    <section className="minhwatu-guide-block" aria-labelledby="minhwatu-category-title">
      <SectionTitle id="minhwatu-category-title">{ko ? '패 종류와 기본 점수' : 'Categorías y puntos base'}</SectionTitle>
      <div className="minhwatu-category-grid">
        {categories.map(category => <article className="minhwatu-category-example" key={category.label}>
          <Face id={category.id} language={language}/>
          <div><b>{category.label}</b><strong>{category.value} {ko ? '점' : 'pts'}</strong></div>
        </article>)}
      </div>
      <p className="minhwatu-guide-note">{ko ? '비광도 광 20점입니다. 피의 개수 보너스는 없어요.' : 'La brillante de lluvia también vale 20. No hay bono por cantidad de cartas simples.'}</p>
    </section>

    <section className="minhwatu-guide-block" aria-labelledby="minhwatu-yaku-title">
      <SectionTitle id="minhwatu-yaku-title">{ko ? '띠 조합과 새 조합' : 'Combinaciones de cintas y aves'}</SectionTitle>
      <div className="minhwatu-ribbon-grid">
        {ribbonSets.map(set => <article className="minhwatu-combo-example" key={set.id}>
          <h4>{set.label[language]}</h4>
          <div>{set.cards.map(id => <Face key={id} id={id} language={language}/>)}</div>
        </article>)}
      </div>
      <article className="minhwatu-godori-example">
        <div className="minhwatu-godori-copy">
          <h4>{ko ? `고도리 · ${MINHWATU_GODORI_BONUS}점` : `Godori · ${MINHWATU_GODORI_BONUS} pts`}</h4>
          <p>{ko ? '2월 꾀꼬리 + 4월 두견새 + 8월 기러기' : 'Febrero: ruiseñor + abril: cuco + agosto: gansos'}</p>
        </div>
        <div className="minhwatu-godori-cards">
          {['02-01', '04-01', '08-02'].map(id => <Face key={id} id={id} language={language}/>) }
        </div>
      </article>
      <p className="minhwatu-guide-note">{ko ? '월 완성은 11월 네 장 40점, 5·10·12월 네 장 각각 20점입니다.' : 'Completar noviembre da 40 puntos; completar mayo, octubre o diciembre da 20 por mes.'}</p>
    </section>

    <section className="minhwatu-guide-block" aria-labelledby="minhwatu-score-title">
      <SectionTitle id="minhwatu-score-title">{ko ? '고도리 점수 예시' : 'Ejemplo de puntuación con Godori'}</SectionTitle>
      <div className="minhwatu-score-example">
        <div><span>{ko ? '내 기본점수: 새 3장' : 'Base: 3 cartas de ave'}</span><b>30</b></div>
        <span className="minhwatu-score-operator">+</span>
        <div><span>{ko ? '내 고도리 보너스 × 2' : 'Mi bono Godori × 2'}</span><b>{MINHWATU_GODORI_BONUS} × 2</b></div>
        <span className="minhwatu-score-operator">−</span>
        <div><span>{ko ? '상대 조합 보너스 없음' : 'Sin bono rival'}</span><b>0</b></div>
        <span className="minhwatu-score-operator">=</span>
        <strong>130 {ko ? '점' : 'pts'}</strong>
      </div>
      <p className="minhwatu-score-rival">{ko ? '상대의 기본점수가 20점이고 조합 보너스가 없어도, 내 고도리 50점은 상대 최종점수에서 빠져 20 − 50 = −30점이 됩니다.' : 'Si la otra persona tiene 20 puntos base y ningún bono propio, tu Godori se resta de su total: 20 − 50 = −30 puntos.'}</p>
    </section>
  </section>;
}
