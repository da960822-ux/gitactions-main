import type { GameId, Language } from '../core/types';
import { getBeginnerGuide, type BeginnerGuideOptions } from './beginner-guides';

export function GameInstructions({ gameId, language, options, rules }: {
  gameId: GameId; language: Language; options?: BeginnerGuideOptions; rules: string[];
}) {
  const guide = getBeginnerGuide(gameId, language, options);
  const legacyMarble = gameId === 'marble' && options?.marbleVersion === 1;
  const fullRules = <ol className="guide-full-rules">{rules.map((rule, i) => <li key={i}><span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span><p>{rule}</p></li>)}</ol>;
  if (!guide) return fullRules;
  const imageSource = legacyMarble ? '/images/marble/cities/santo-domingo.svg' : `/images/guides/${gameId}-${language}.webp`;
  return <div className="beginner-guide" lang={language === 'ko' ? 'ko' : 'es-DO'}>
    <p className="guide-goal"><strong>{language === 'ko' ? '목표' : 'Meta'}</strong> {guide.goal}</p>
    <figure className="guide-example">
      <img src={imageSource} alt={legacyMarble ? language === 'ko' ? '산토도밍고 부동산의 그림 예시' : 'Ilustración de una propiedad de Santo Domingo' : guide.imageAlt} width="900" loading="lazy" decoding="async"/>
      <figcaption>{legacyMarble
        ? language === 'ko' ? '부동산 그림 예시 · 이 저장된 판은 이전 18칸 보드를 사용해요.' : 'Ejemplo de una propiedad · Esta partida guardada usa el tablero anterior de 18 casillas.'
        : null} <a href={imageSource} target="_blank" rel="noopener noreferrer">{language === 'ko' ? '예시 그림 크게 보기 ↗ (새 탭)' : 'Ampliar ejemplo ↗ (pestaña nueva)'}</a></figcaption>
    </figure>
    <ol className="guide-quick-steps">{guide.steps.map((step, i) => <li key={i}>
      <span aria-hidden="true">{i + 1}</span><div><h3>{step.title}</h3><p>{step.body}</p></div>
    </li>)}</ol>
    <p className="guide-tip"><strong>{language === 'ko' ? '꼭 기억해요' : 'Recuerda'}</strong> {guide.tip}</p>
    <details className="guide-details"><summary>{language === 'ko' ? '세부 규칙과 예외 보기' : 'Ver reglas y casos especiales'}</summary>{fullRules}</details>
  </div>;
}
