import type { Language } from '../core/types';
import { marbleEngine, type MarbleTile } from '../games/marble';
import { getBeginnerGuide, type BeginnerGuideOptions } from './beginner-guides';
import { MarblePropertyArt } from './MarblePropertyArt';
import { MarblePropertyLedger } from './MarblePropertyLedger';
import { marblePassStartSalary, marbleStartingCash } from '../games/marbleEconomy';
import './marble-rule-guide.css';

const words = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;
const eventCategories = [
  ['cash-dividend', '돈과 비용', 'Dinero y gastos', '상금·배당·여행비·수리비', 'Premios, dividendos, viajes y reparaciones'],
  ['movement-travel', '이동', 'Viajes', '도시 방문·출발·후퇴·무인도·열차', 'Visitas, Salida, retroceso, isla y tren'],
  ['protection-exemption', '보관하는 패', 'Pases que guardas', '탈출권·통행료 면제권', 'Salida de la isla y un alquiler gratis'],
  ['city-intervention', '도시 효과', 'Efectos de ciudad', '축제·정전·독점 경고', 'Festival, apagón y advertencia de monopolio'],
];
const eventEffects = [
  ['동네 축제', 'Fiesta del barrio', '+150', '은행에서 받아요.', 'Recibes del banco.'],
  ['작은 복권 당첨', 'Premio de lotería', '+200', '은행에서 받아요.', 'Recibes del banco.'],
  ['임대료 환급', 'Reembolso de alquiler', '+80', '은행에서 받아요.', 'Recibes del banco.'],
  ['여행 경비', 'Gastos de viaje', '−100', '은행에 내요.', 'Pagas al banco.'],
  ['건물 수리', 'Mantenimiento', '40 ×', '내 도시 건설 단계 합계만큼 내요. 랜드마크는 3단계예요.', 'Pagas por la suma de niveles construidos. Un monumento cuenta como tres.'],
  ['산토도밍고 방문', 'Visita a Santo Domingo', '→', '앞으로 이동해 도착 효과 적용. 출발 통과 시 +200.', 'Avanza y aplica la casilla de llegada. Si pasas por Salida, cobras 200.'],
  ['출발점으로 이동', 'Ve a Salida', '+200', '출발로 가서 한 번 받아요.', 'Ve a Salida y cobra una sola vez.'],
  ['세 칸 뒤로', 'Retrocede tres casillas', '−3', '도착 효과 적용. 출발 보너스는 없어요.', 'Aplica el destino, sin cobrar Salida.'],
  ['무인도로 이동', 'Ve a la isla', '→', '직행해요. 출발 보너스와 더블 추가 굴림은 없어요.', 'Ve directo, sin cobrar Salida ni volver a lanzar por dobles.'],
  ['탈출권', 'Pase de salida', '1', '보관하다 무인도에서 나올 때 써요.', 'Guárdalo y úsalo para salir de la isla.'],
  ['무료 열차표', 'Tren gratis', '0', '운임 없이 즉시 도시를 골라요. 출발 통과 시 +200.', 'Elige una ciudad ahora, sin pagar pasaje. Cruzar Salida paga 200.'],
  ['도시 배당금', 'Dividendo de ciudades', '30 ×', '내 도시 수만큼 받아요.', 'Recibes por cada ciudad tuya.'],
  ['독점 경고', 'Advertencia de monopolio', '100 ×', '완성 색상군 최다 보유자가 도시군당 내요. 최대 300.', 'Quien tenga más colores completos paga por cada grupo, hasta 300.'],
  ['도시 축제', 'Festival de ciudad', '×2', '내 도시의 다음 적 착지 1회 통행료예요.', 'Duplica el alquiler una vez, en la próxima llegada rival a tu ciudad.'],
  ['정전', 'Apagón', '÷2', '적 일반 도시의 다음 내 착지 1회. 내림, 최소 1.', 'Reduce tu próximo alquiler en una ciudad rival sin monumento. Redondea hacia abajo, mínimo 1.'],
  ['통행료 면제권', 'Pase de alquiler', '0', '보관 후 통행료 지급 전에 직접 써요. 세금에는 못 써요.', 'Guárdalo y elige usarlo antes de pagar un alquiler. No sirve para impuestos.'],
];

export function MarbleRuleGuide({ language, rules, options = {}, teamMode = false }: {
  language: Language; rules: string[]; options?: BeginnerGuideOptions; teamMode?: boolean;
}) {
  const t = (ko: string, es: string) => words(language, ko, es);
  const economicVersion = options.marbleEconomyVersion === 3 ? 3 : options.marbleEconomyVersion === 1 ? 1 : 2;
  const openingCash = marbleStartingCash(economicVersion), passSalary = marblePassStartSalary(economicVersion);
  const guideState = marbleEngine.createInitialState(1); guideState.economicVersion = economicVersion;
  const currentCities: MarbleTile[] = marbleEngine.getPlayerView(guideState, 'p1').board.tiles;
  const exampleCity = currentCities.find(tile => tile.name.es === (language === 'es' ? 'Santo Domingo' : 'Gwangju'))!;
  const guide = getBeginnerGuide('marble', language, { ...options, marblePropertyRulesVersion: 1 })!;
  const baseRules = teamMode ? rules.map((rule, index) => index === 0
    ? t(`목표와 준비 — 우리 40칸·3단계 건설 팀전입니다. 각자 ${openingCash}으로 출발하고 팀원과 번갈아 앉아요. 돈과 도시·대출은 개인별이며, 같은 팀 두 명이 모두 파산하면 패배합니다.`, `Objetivo y preparación — Nuestra variante por equipos tiene 40 casillas y tres niveles. Cada persona empieza con ${openingCash} y los equipos se sientan alternados. El dinero, las ciudades y las deudas son individuales; el equipo pierde cuando ambos quiebran.`)
    : index === 9
      ? t('팀 정산 — 120개 완료 차례 뒤 두 팀원의 순자산을 합산합니다. 순자산은 현금+도시 원래 매입가+각 실제 건설비−미상환 대출이며 인수 웃돈은 포함하지 않습니다. 더블 재굴림·탈락 좌석은 완료 차례로 세지 않습니다. 팀 합계가 같으면 무승부입니다. 경매·저당·협의 거래는 없습니다.', 'Cuenta del equipo — Tras 120 turnos completos se suma el patrimonio neto de ambos compañeros: efectivo + precio original de las ciudades + construcción − deudas. El dinero extra de una adquisición no aumenta ese valor. Los lanzamientos extra y los asientos eliminados no cuentan como turnos completos. Si los equipos empatan, hay empate. No hay subastas, hipotecas ni intercambios negociados.')
      : rule) : rules;
  const savedRoomBuildingRule = t('도시와 건설 — 이 저장 방은 기존 건설 규칙을 유지합니다. 소유 도시에서 자금이 충분하면 최대 3단계까지 건설할 수 있습니다. 현재 경제의 땅값은 도시표의 80%를 10 단위로 반올림하며, 주택·아파트·랜드마크 비용은 조정 땅값의 40%·60%·80%(최소 30)입니다.', 'Ciudades y construcción — Esta sala guardada conserva su regla anterior: puedes construir en cualquier ciudad propia hasta nivel 3 si tienes fondos. El terreno cuesta el 80 % de la tabla, redondeado a 10; casa, apartamentos y monumento cuestan el 40 %, 60 % y 80 % del precio ajustado (mínimo 30).');
  const detailedRules = economicVersion === 3 ? baseRules.map((rule,index) => index === 0 && !teamMode ? rule.replace('1500',String(openingCash)) : index === 1 ? rule.replace('통과하면 200',`통과하면 ${passSalary}`).replace('pasar por Salida cobras 200',`pasar por Salida cobras ${passSalary}`) : index === 2 && options.marbleConstructionRulesVersion === 1 ? t('도시와 건설 — 빈 도시를 사거나 거절합니다. 구매한 도시와 재방문한 내 도시에서 건설합니다. 출발에 정확히 도착하면 내 도시 한 곳을 골라 한 번 건설합니다. 첫 구매는 최대 2단계이며 랜드마크는 이미 2단계인 도시의 재방문이나 출발 정확 도착 때만 가능합니다. 땅값은 기존 40칸 도시표의 80%를 10 단위 반올림합니다. 주택→아파트→랜드마크 비용은 조정 땅값의 40%·60%·80%(최소 30)이며, 통행료 단계 배수는 1·2·3·4배입니다.', 'Ciudades y construcción — Compra una ciudad libre o recházala. Construye en la ciudad comprada o al volver a una propia. Al llegar exactamente a Salida, elige una ciudad propia para construir una vez. La primera compra permite hasta el nivel 2; el monumento exige volver a una ciudad que ya era nivel 2 o llegar exactamente a Salida. El terreno vale el 80 % de la tabla actual, redondeado a 10. Construir casa→apartamentos→monumento cuesta el 40 %, 60 % y 80 % del precio ajustado (mínimo 30); el alquiler multiplica por 1, 2, 3 y 4.') : index === 2 ? savedRoomBuildingRule : index === 3 && options.marbleConstructionRulesVersion === 1 ? rule.replace('인수 뒤 추가 건설도 가능합니다. ', '').replace(' y permite seguir construyendo', '') : index === 5 ? rule.replace('출발 이동 +200',`출발 이동 +${passSalary}`).replace('Salida +200',`Salida +${passSalary}`) : index === 8 ? rule.replace('통과해도 200',`통과해도 ${passSalary}`).replace('también paga 200',`también paga ${passSalary}`) : rule) : baseRules;
  const stageNames = language === 'ko' ? ['대지', '단독주택', '아파트', '랜드마크'] : ['Terreno', 'Casa', 'Apartamentos', 'Monumento'];
  return <div className="marble-rule-guide" lang={language === 'ko' ? 'ko' : 'es-DO'}>
    <p className="marble-rule-goal">{teamMode ? t('내 도시를 키우고 팀의 순자산을 모아요.', 'Desarrolla tus ciudades y suma patrimonio para tu equipo.') : guide.goal}</p>
    <ol className="marble-rule-start" aria-label={t('첫 차례', 'Tu primer turno')}>
      {[t('두 주사위 굴리기', 'Lanza los dos dados'), t('도착한 칸 확인', 'Revisa dónde caíste'), t('구매·지급 등 도착 행동', 'Compra o paga, según la casilla')].map((step, index) => <li key={step}><b>{index + 1}</b>{step}</li>)}
    </ol>
    <p className="marble-rule-opening">{t('원하면 첫 주사위를 굴리기 전에 말을 바꿀 수 있어요.', 'Si quieres, puedes cambiar de ficha antes de tu primer lanzamiento.')}</p>
    <p className="marble-rule-opening">{t(`시작 현금 ${openingCash.toLocaleString()} · 출발 통과 +${passSalary} · 40칸 보드`, `Empiezas con ${openingCash.toLocaleString()} · pasar por Salida +${passSalary} · tablero de 40 casillas`)}</p>
    <section className="marble-rule-building" aria-labelledby="marble-rule-building-title">
      <h3 id="marble-rule-building-title">{t('내 도시를 키우면 통행료도 올라가요', 'Construye y cobra más alquiler')}</h3>
      <div className="marble-rule-stages">{stageNames.map((name, level) => <figure key={level}>
        <MarblePropertyArt city={language === 'es' ? 'santo-domingo' : 'gwangju'} level={level} routeVersion={options.marbleCityRouteVersion ?? 3} className="marble-rule-building-art" language={language}/>
        <figcaption><span>{level}</span><strong>{name}</strong></figcaption>
      </figure>)}</div>
      <p className="marble-rule-example">{t(`${exampleCity.name.ko} 예시 · 추가비는 그 단계에서 더 내는 돈, 누적은 땅값과 지금까지 지은 건설비의 합이에요.`, `Ejemplo: ${exampleCity.name.es}. «Costo extra» es lo que pagas por ese nivel; «Invertido» suma el terreno y todos los niveles construidos.`)}</p>
      <MarblePropertyLedger tile={exampleCity} language={language} economicVersion={economicVersion} propertyRulesVersion={1} effectiveValues/>
      <p className="marble-rule-color">{t('한 사람이 같은 색을 전부 소유하면 그 도시들의 통행료 ×2', 'Si tú solo completas un color, cobras el doble de alquiler en esas ciudades.')}</p>
    </section>
    <div className="marble-rule-pair">
      <section aria-labelledby="marble-rule-takeover-title">
        <img src="/images/marble/guides/takeover-protection.webp" alt={t('일반 도시의 소유권을 넘기는 모습과 방패로 보호된 랜드마크', 'Una ciudad cambia de dueño; un escudo protege el monumento')} width="1536" height="1024" loading="lazy" decoding="async"/>
        <h3 id="marble-rule-takeover-title">{t('상대 도시 인수 · 랜드마크 보호', 'Ciudad rival: adquisición · monumento protegido')}</h3>
        <p>{t('통행료 지급 또는 면제권 사용 → 선택 인수. 누적 투자액 ×2를 기존 소유자에게 내요. 건물 단계는 유지돼요.', 'Primero paga el alquiler o usa un pase; luego decide si adquieres la ciudad. Pagas al dueño el doble de la inversión acumulada y conservas los edificios.')}</p>
        <strong className="marble-rule-key">{t('3단계는 인수·정전 불가', 'Nivel 3: no se adquiere ni recibe apagón')}</strong>
        <p className="marble-rule-opening">{t('수리비와 독점 부담금 같은 일반 비용은 그대로 내요.', 'La protección no exime del mantenimiento ni de otros cargos.')}</p>
      </section>
      <section aria-labelledby="marble-rule-doubles-title">
        <img src="/images/marble/guides/doubles-island.webp" alt={t('같은 눈 주사위로 한 번 더 굴리고 세 번 연속이면 무인도로 가는 예시', 'Dados iguales permiten otro lanzamiento; tres dobles seguidos llevan a la isla')} width="1536" height="1024" loading="lazy" decoding="async"/>
        <div className="marble-rule-dice-labels"><span>{t('더블 → 추가 굴림', 'Dobles → otra tirada')}</span><span>{t('3연속 더블 → 무인도', 'Tres dobles seguidos → isla')}</span></div>
        <h3 id="marble-rule-doubles-title">{t('더블이면 한 번 더 · 3연속이면 섬', 'Dados iguales: dobles · tres seguidos: a la isla')}</h3>
        <p>{t('도착 행동을 마친 뒤 다시 굴려요. 한 차례에 3연속이면 세 번째 이동과 출발 보너스 없이 바로 무인도로 가요.', 'Termina las acciones de llegada y vuelve a lanzar. Con tres dobles seguidos en el mismo turno vas directo a la isla, sin tercer movimiento ni cobro de Salida.')}</p>
        <strong className="marble-rule-key">{t('탈출용 더블에는 추가 굴림 없음', 'Los dobles para salir de la isla no dan otro lanzamiento')}</strong>
      </section>
    </div>
    <section className="marble-rule-events" aria-labelledby="marble-rule-events-title">
      <h3 id="marble-rule-events-title">{t('황금열쇠 16종 · 그림을 보고 효과를 확인해요', '16 llaves doradas · mira la carta y su efecto')}</h3>
      <div>{eventCategories.map(([image, ko, es, detailKo, detailEs]) => <figure key={image}>
        <img src={`/images/marble/events/${image}.webp`} alt="" width="160" height="160" loading="lazy" decoding="async"/>
        <figcaption><strong>{t(ko, es)}</strong><span>{t(detailKo, detailEs)}</span></figcaption>
      </figure>)}</div>
      <p>{t('보관 패는 직접 사용해요. 이동 카드는 도착한 칸의 효과까지 적용해요.', 'Tú decides cuándo usar un pase. Las cartas de viaje también aplican el efecto de la casilla de llegada.')}</p>
      <details className="guide-details marble-rule-card-list"><summary>{t('16종 카드 한 장씩 보기', 'Ver el efecto de cada una de las 16 cartas')}</summary>
        <ul>{eventEffects.map(([ko, es, amount, detailKo, detailEs]) => <li key={es}><b>{ko === '출발점으로 이동' ? `+${passSalary}` : amount}</b><div><strong>{t(ko, es)}</strong><p>{t(ko === '출발점으로 이동' ? `출발로 가서 ${passSalary}을 한 번 받아요.` : detailKo.replace('출발 통과 시 +200',`출발 통과 시 +${passSalary}`), ko === '출발점으로 이동' ? `Ve a Salida y cobra ${passSalary} una sola vez.` : detailEs.replace('Cruzar Salida paga 200',`Cruzar Salida paga ${passSalary}`))}</p></div></li>)}</ul>
        <p>{t('독점 경고 공동 선두는 카드를 뽑은 사람이 포함되면 그 사람, 아니면 시작 좌석부터 차례순으로 첫 공동 선두에게 부과해요.', 'Si hay empate en la advertencia de monopolio, paga quien sacó la carta si está entre quienes lideran. Si no, paga la primera persona empatada en el orden desde el asiento inicial.')}</p>
      </details>
    </section>
    <aside className="marble-rule-rescue">
      <h3>{t('낼 돈이 부족하면?', '¿No te alcanza para pagar?')}</h3>
      <p>{t('지급 위기에서 도시+건물을 은행에 팔아 누적 투자액의 절반을 받아요. 대출은 300 → 상환 330. 매각과 대출로도 부족할 때만 파산해요.', 'Durante la crisis puedes vender al banco una ciudad con sus edificios por la mitad de su inversión. El préstamo te da 300 y devuelves 330. Solo quiebras si vender y pedir crédito tampoco basta.')}</p>
      {teamMode && <p>{t('아군 통행료는 없고 돈과 도시는 각자 관리해요. 팀원 둘이 모두 파산하면 패배해요.', 'No pagas alquiler a tu compañero. Cada quien maneja su dinero y sus ciudades; el equipo pierde cuando ambos quiebran.')}</p>}
    </aside>
    <details className="guide-details marble-rule-details"><summary>{t('정산·세부 규칙', 'Cuenta final y reglas completas')}</summary>
      <p className="marble-rule-variant">{t('우리 40칸·3건설 단계 변형입니다. 공식 모두의마블의 4건물 단계나 Monopoly를 그대로 재현하지 않습니다.', 'Esta es nuestra variante de 40 casillas y tres niveles. No reproduce los cuatro niveles de Modoo Marble ni las reglas completas de Monopoly.')}</p>
      <ol className="guide-full-rules">{detailedRules.map((rule, index) => <li key={index}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><p>{rule}</p></li>)}</ol>
    </details>
  </div>;
}
