import type { GameId, Language } from '../../core/types';
import { worldIslandsBoardFor } from '../../games/marbleWorldIslands';
import './game-tutorial.css';
import { MarbleExpandedCardGuide } from '../MarbleRuleGuide';

export interface TutorialCopy {
  goal: string;
  setup: string[];
  turnSteps: { title: string; body: string; control: string }[];
  example: { title: string; steps: string[]; result: string };
  mistakes: { question: string; answer: string }[];
  win: string;
  glossary: { term: string; meaning: string }[];
}
type TutorialData = Record<Language, TutorialCopy> & { team?: Record<Language, TutorialCopy> };
const files = import.meta.glob<TutorialData>('./data/*.json', { eager: true, import: 'default' });
export function getGameTutorial(gameId: GameId, language: Language, teamMode = false, boardRevision = 4, rentRulesVersion = 2, loanRulesVersion = 2, constructionPriceRulesVersion = 2, eventVersion = 4): TutorialCopy | undefined {
  const guide = files[`./data/${gameId}.json`];
  let copy = teamMode ? guide?.team?.[language] : guide?.[language];
  if (!copy || gameId !== 'marble') return copy;
  if (loanRulesVersion === 2) copy = { ...copy, mistakes: copy.mistakes.map(item => ({ ...item, answer: item.answer.replace('300을 받고 330을 갚으며', '600을 받고 660을 갚으며').replace('Recibes 300 y debes devolver 330', 'Recibes 600 y debes devolver 660') })) };
  if (rentRulesVersion === 2) copy = { ...copy, example: { ...copy.example, result: copy.example.result.replaceAll('48', '38') }, glossary: copy.glossary.map(item => ({ ...item, meaning: item.meaning.replace('통행료 120', '통행료 96').replace('cobra 120 fijos', 'cobra 96 fijos') })) };
  if (constructionPriceRulesVersion === 2) {
    const construction = (text: string) => text.replaceAll('빌라 15 + 빌딩 45', '빌라 12 + 빌딩 36').replaceAll('Villa 15 + Edificio 45', 'Villa 12 + Edificio 36').replace(/\b99\b/g, '87').replaceAll('2,901', '2,913');
    copy = { ...copy, example: { ...copy.example, steps: copy.example.steps.map(construction), result: construction(copy.example.result) } };
  }
  if (eventVersion >= 4) {
    const coupon = (text: string) => text.replace('관광섬과 랜드마크는 인수할 수 없어요.', '관광지는 인수 할인권이 있을 때만 인수 가능(기준 300 → 150)하며 랜드마크는 불가해요. 인수비만 50% 할인하고 통행료는 별도예요.').replace('팀원 소유지·관광섬·랜드마크는 인수할 수 없어요.', '관광지는 인수 할인권으로만 인수 가능(기준 300 → 150)하며 팀원 소유지·랜드마크는 불가해요. 통행료는 별도예요.').replace('건설과 인수가 없습니다.', '건설은 없고 인수 할인권으로만 상대 관광지를 인수할 수 있습니다(기준 300 → 150).').replace('No puedes adquirir islas turísticas ni monumentos de tu rival.', 'Solo con cupón puedes adquirir turismo rival (base 300 → 150); sin monumentos. El descuento del 50 % es solo para la adquisición, alquiler aparte.').replace('No puedes adquirir propiedades de tu compañero, islas turísticas ni monumentos.', 'Solo con cupón puedes adquirir turismo rival (base 300 → 150); sin aliados ni monumentos. Alquiler aparte.').replace('no permite construcción ni adquisición a otro jugador.', 'sin construcción; solo con cupón puedes adquirir turismo rival (base 300 → 150).');
    copy = { ...copy, turnSteps: copy.turnSteps.map(step => ({ ...step, body: coupon(step.body) })), glossary: copy.glossary.map(item => ({ ...item, meaning: coupon(item.meaning) })) };
  }
  if (boardRevision < 3) return copy;
  const city = (text: string) => text.replaceAll('산토도밍고', '인천').replaceAll('Santo Domingo', 'Incheon');
  const colorRule = language === 'ko'
    ? '한 사람이 서로 다른 색상군 3개를 완성하면 즉시 승리합니다. 색상 독점으로 통행료가 2배가 되지는 않습니다. 관광지는 색상군에 포함되지 않지만 한 변 독점에는 필요합니다. 팀원의 소유지는 합치지 않습니다.'
    : 'Una sola persona gana de inmediato al completar tres grupos de colores distintos. Completar un color no duplica el alquiler. Las islas no forman grupos de color, pero sí son necesarias para completar un lado. No se suman las propiedades de compañeros.';
  return { ...copy, example: { ...copy.example, title: city(copy.example.title), steps: copy.example.steps.map(city), result: city(copy.example.result) }, mistakes: copy.mistakes.map((item, index) => index === 0 ? { ...item, answer: colorRule } : item) };
}

export function GameTutorial({ gameId, language, teamMode = false, uiLanguage = language, boardRevision = 4, festivalRulesVersion = 2, rentRulesVersion = 2, loanRulesVersion = 2, constructionPriceRulesVersion = 2, eventVersion = 4 }: { gameId: GameId; language: Language; teamMode?: boolean; uiLanguage?:Language; boardRevision?:number; festivalRulesVersion?:number; rentRulesVersion?:number; loanRulesVersion?:number; constructionPriceRulesVersion?:number; eventVersion?:number }) {
  const guide = getGameTutorial(gameId, language, teamMode, boardRevision, rentRulesVersion, loanRulesVersion, constructionPriceRulesVersion, eventVersion);
  if (!guide) return null;
  const board = worldIslandsBoardFor(boardRevision);
  const islandCount = board.filter(tile=>tile.kind==='tourism').length;
  const hasFestival = board.some(tile=>tile.kind==='festival-site');
  const actualControls = uiLanguage !== language ? getGameTutorial(gameId, uiLanguage, teamMode, boardRevision, rentRulesVersion, loanRulesVersion, constructionPriceRulesVersion, eventVersion)?.turnSteps : undefined;
  const t = (ko: string, es: string) => language === 'ko' ? ko : es;
  return <article className="game-tutorial" lang={language === 'ko' ? 'ko' : 'es'} data-tutorial-game={gameId} data-tutorial-mode={teamMode ? 'team' : 'solo'}>
    <section className="tutorial-goal"><h3>{t('무엇을 하면 이기나요?', '¿Cuál es la meta?')}</h3><p>{guide.goal}</p></section>
    {gameId==='marble'&&<p className="tutorial-board-version">{hasFestival?t(`현재 판: 도시 18곳 · 관광지 ${islandCount}곳 · 무료 축제개최 칸. 축제개최에 도착하면 내 도시를 골라 다음 상대 방문 통행료를 2배로 만들어요.`,`Este tablero: 18 ciudades, ${islandCount} destinos turísticos y Festival gratis. Al llegar a Festival, elige una ciudad tuya: cobra el doble en la próxima visita rival.`):t(`저장된 판: 도시 18곳 · 관광지 ${islandCount}곳. 출발 맞은편 모서리는 이비사이며 축제개최 칸이 아닙니다.`,`Partida guardada: 18 ciudades y ${islandCount} destinos turísticos. La esquina opuesta a Salida es Ibiza, no Festival.`)}</p>}
    {gameId==='marble'&&<p className="tutorial-festival-rule">{festivalRulesVersion===2?t('축제는 플레이어당 1개입니다. 새 도시에서 열면 기존 내 축제만 해제됩니다. 같은 도시를 다시 선택해도 중첩되지 않으며, 다음 상대 방문 1회 통행료 2배 후 종료됩니다. 랜드마크도 선택할 수 있습니다.','Un festival por jugador. Al celebrarlo en otra ciudad se elimina solo tu festival anterior. Repetir la misma ciudad no acumula efectos: el próximo rival paga el doble una vez y termina. También puedes elegir un monumento.'):t('저장된 판의 축제 규칙: 여러 내 도시에 축제를 유지할 수 있습니다. 각 도시의 다음 상대 방문 1회 통행료가 2배가 되고 종료됩니다.','Regla guardada: puedes mantener festivales en varias ciudades propias. Cada uno duplica una vez el alquiler de la próxima visita rival y termina.')}</p>}
    {gameId==='marble'&&<MarbleExpandedCardGuide language={language} eventVersion={eventVersion}/>}
    <section className="tutorial-setup"><h3>{t('시작 전에 화면부터 알아봐요', 'Antes de empezar: mira la mesa')}</h3><ul>{guide.setup.map(line => <li key={line}>{line}</li>)}</ul></section>
    <section><h3>{t('내 첫 차례 · 이 순서대로 해 보세요', 'Tu primer turno, paso a paso')}</h3><ol className="tutorial-steps">{guide.turnSteps.map((step, index) => <li key={step.title}><span className="tutorial-step-number" aria-hidden="true">{index + 1}</span><div><h4>{step.title}</h4><p>{step.body}</p><p className="tutorial-control"><b>{t('화면에서', 'En pantalla')}</b> {step.control}</p>{actualControls?.[index]&&<small className="tutorial-actual-control"><b>{t('실제 게임 화면','Pantalla actual')}</b> <span lang={uiLanguage}>{actualControls[index].control}</span></small>}</div></li>)}</ol></section>
    <section className="tutorial-example"><h3>{t('한 번 같이 해 볼까요?', 'Veamos un ejemplo')}</h3><h4>{guide.example.title}</h4><ol>{guide.example.steps.map((line, i) => <li key={line}><span aria-hidden="true">{i + 1}</span><p>{line}</p></li>)}</ol><p className="tutorial-result"><b>{t('결과', 'Resultado')}</b> {guide.example.result}</p></section>
    <section className="tutorial-mistakes"><h3>{t('처음에 헷갈리는 것', 'Dudas frecuentes')}</h3>{guide.mistakes.map(item => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>
    <section className="tutorial-win"><h3>{t('언제 끝나고 누가 이기나요?', '¿Cuándo termina y quién gana?')}</h3><p>{guide.win}</p></section>
    <details className="tutorial-glossary"><summary>{t('낯선 말 뜻 보기', 'Palabras del juego')}</summary><dl>{guide.glossary.map(item => <div key={item.term}><dt>{item.term}</dt><dd>{item.meaning}</dd></div>)}</dl></details>
  </article>;
}
