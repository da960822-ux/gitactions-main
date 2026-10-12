import type { GameId, Language } from '../core/types';
import { getBeginnerGuide, type BeginnerGuideOptions } from './beginner-guides';
import { MarblePropertyArt } from './MarblePropertyArt';

export function GameInstructions({ gameId, language, options, rules, desktopDisplay = true }: {
  gameId: GameId; language: Language; options?: BeginnerGuideOptions; rules: string[]; desktopDisplay?: boolean;
}) {
  const guide = getBeginnerGuide(gameId, language, options);
  const legacyMarble = gameId === 'marble' && options?.marbleVersion === 1;
  const fullRules = <ol className="guide-full-rules">{rules.map((rule, i) => <li key={i}><span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span><p>{rule}</p></li>)}</ol>;
  if (!guide) return fullRules;
  const imageSource = legacyMarble ? '/images/marble/cities/santo-domingo.svg' : `/images/guides/${gameId}-${language}.webp`;
  return <div className="beginner-guide" lang={language === 'ko' ? 'ko' : 'es-DO'}>
    <p className="guide-goal"><strong>{language === 'ko' ? '목표' : 'Meta'}</strong> {guide.goal}</p>
    {desktopDisplay && gameId === 'marble' && !legacyMarble && <section className="first-action-walkthrough" aria-label={language === 'ko' ? '첫 차례 따라 하기' : 'Tu primer turno'}>
      <h3>{language === 'ko' ? '첫 차례 따라 하기' : 'Tu primer turno'}</h3>
      <ol>
        <li><b>1 · {language === 'ko' ? '내 말 선택' : 'Elige tu figura'}</b><span>{language === 'ko' ? '캐릭터 그림을 눌러 내 말을 정해요.' : 'Pulsa un personaje para elegir tu figura.'}</span></li>
        <li><b>2 · {language === 'ko' ? '주사위 굴리기' : 'Lanza los dados'}</b><span>{language === 'ko' ? '내 차례에 주사위를 굴리고 도착한 칸을 확인해요.' : 'En tu turno, lanza y revisa la casilla de llegada.'}</span></li>
        <li><b>3 · {language === 'ko' ? '도착 후 결정' : 'Decide al llegar'}</b><span>{language === 'ko' ? '예: 뉴욕에 도착하면 260에 구매하거나 지나가요. 구매 전 잔액이 1,500이면 구매 후 1,240이에요.' : 'Ejemplo: en Nueva York puedes comprar por 260 o continuar. Si tenías 1,500, después de comprar quedan 1,240.'}</span></li>
      </ol>
    </section>}
    {gameId === 'marble' && !legacyMarble ? <figure className="guide-example guide-marble-example">
      <div className="guide-marble-stages">{[0, 1, 2, 3].map(level => <div key={level}>
        <MarblePropertyArt city="gwangju" level={level} routeVersion={options?.marbleCityRouteVersion ?? 3} className="guide-marble-art" language={language}/>
        <b>{(language === 'ko' ? ['미건설', '단독주택', '아파트', '랜드마크'] : ['Sin construir', 'Casa unifamiliar', 'Apartamentos', 'Monumento'])[level]}</b>
      </div>)}</div>
      <figcaption>{language === 'ko' ? `실제 도시·건물 자산 예시 · 광주 매입 100 · 첫 건설 ${(options?.marbleEconomyVersion ?? 2) >= 2 ? 40 : 100} · 통행료 12 → 24` : `Ejemplo de los gráficos de ciudad y edificios · Gwangju cuesta 100 · primera mejora ${(options?.marbleEconomyVersion ?? 2) >= 2 ? 40 : 100} · renta 12 → 24`}</figcaption>
    </figure> : <figure className="guide-example">
      <img src={imageSource} alt={legacyMarble ? language === 'ko' ? '산토도밍고 부동산의 그림 예시' : 'Ilustración de una propiedad de Santo Domingo' : guide.imageAlt} width="900" loading="lazy" decoding="async"/>
      <figcaption>{legacyMarble
        ? language === 'ko' ? '부동산 그림 예시 · 이 저장된 판은 이전 18칸 보드를 사용해요.' : 'Ejemplo de una propiedad · Esta partida guardada usa el tablero anterior de 18 casillas.'
        : null} <a href={imageSource} target="_blank" rel="noopener noreferrer">{language === 'ko' ? '예시 그림 크게 보기 ↗ (새 탭)' : 'Ampliar ejemplo ↗ (pestaña nueva)'}</a></figcaption>
    </figure>}
    <ol className="guide-quick-steps">{guide.steps.map((step, i) => <li key={i}>
      <span aria-hidden="true">{i + 1}</span><div><h3>{step.title}</h3><p>{step.body}</p></div>
    </li>)}</ol>
    <p className="guide-tip"><strong>{language === 'ko' ? '꼭 기억해요' : 'Recuerda'}</strong> {guide.tip}</p>
    <details className="guide-details"><summary>{language === 'ko' ? '세부 규칙과 예외 보기' : 'Ver reglas y casos especiales'}</summary>{fullRules}</details>
  </div>;
}
