import type { Language } from '../core/types';
import { worldIslandsBoardFor } from '../games/marbleWorldIslands';
import { marbleEngine, createLegacyMarbleState, type MarbleTile } from '../games/marble';
import { getBeginnerGuide, type BeginnerGuideOptions } from './beginner-guides';
import { MarblePropertyArt } from './MarblePropertyArt';
import { MarblePropertyLedger } from './MarblePropertyLedger';
import { marbleLoanTerms, marblePassStartSalary, marbleStartingCash } from '../games/marbleEconomy';
import './marble-rule-guide.css';

const words = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;
const eventCategories = [
  ['cash-dividend', '돈과 비용', 'Dinero y gastos', '상금·배당·여행비·수리비', 'Premios, dividendos, viajes y reparaciones'],
  ['movement-travel', '이동', 'Viajes', '도시 방문·출발·후퇴·무인도·세계여행', 'Visitas, Salida, retroceso, isla y viaje'],
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
  ['무료 세계여행', 'Viaje gratis', '0', '운임 없이 즉시 보드의 어느 칸이든 골라요. 출발 통과 시 +200.', 'Elige cualquier casilla ahora, sin pagar pasaje. Cruzar Salida paga 200.'],
  ['도시 배당금', 'Dividendo de ciudades', '30 ×', '내 도시 수만큼 받아요.', 'Recibes por cada ciudad tuya.'],
  ['독점 경고', 'Advertencia de monopolio', '100 ×', '완성 색상군 최다 보유자가 도시군당 내요. 최대 300.', 'Quien tenga más colores completos paga por cada grupo, hasta 300.'],
  ['도시 축제', 'Festival de ciudad', '×2', '내 도시의 다음 적 착지 1회 통행료예요.', 'Duplica el alquiler una vez, en la próxima llegada rival a tu ciudad.'],
  ['정전', 'Apagón', '÷2', '적 도시(랜드마크 포함)의 다음 내 착지 1회. 내림, 최소 1.', 'Reduce tu próximo alquiler en una ciudad rival, incluido un monumento. Redondea hacia abajo, mínimo 1.'],
  ['통행료 면제권', 'Pase de alquiler', '0', '보관 후 통행료 지급 전에 직접 써요. 세금에는 못 써요.', 'Guárdalo y elige usarlo antes de pagar un alquiler. No sirve para impuestos.'],
];

const expandedEventEffects = [
  ['인수 할인권', 'Cupón de adquisición', '50%', '보관 후 직접 선택해 인수비만 절반(올림)으로 내고 1장을 소모해요. 상대 관광지도 기준 300 → 150에 인수해요. 실제 결제액은 기존 소유자에게 지급해요. 통행료 별도·랜드마크와 팀원 제외·미소유 땅 구매에는 적용하지 않아요.', 'Guarda el cupón y úsalo manualmente para pagar la mitad (redondeo arriba), consumiendo uno. Permite turismo rival: base 300 → 150. El dueño cobra solo lo pagado. Alquiler aparte; sin monumentos, aliados ni compras al banco.'],
  ['강제 청산', 'Venta forzosa', '→', '상대 일반 도시를 은행에 팔아요. 은행이 소유자에게 실제 매각대금을 지급하고 소유권·건물·도시 효과를 지워요. 관광지와 랜드마크는 제외해요.', 'Vende una ciudad normal rival al banco. El banco paga al dueño el valor de venta real y retira propiedad, edificios y efectos. No afecta turismo ni monumentos.'],
  ['지진', 'Terremoto', '−1', '상대 일반 도시의 가장 높은 일반 건물 하나를 보상 없이 없애요. 토지 소유권은 유지하며 랜드마크는 제외해요.', 'Retira sin compensación el edificio ordinario más alto de una ciudad rival. Conserva el terreno; no afecta monumentos.'],
  ['도시 방어권', 'Escudo urbano', '1', '최대 1장을 보관해요. 다음 강제 청산·지진·정전을 자동으로 한 번 막고 소모돼요. 통행료는 막지 않아요. 이미 있으면 추가하지 않아요.', 'Guarda como máximo un escudo. Bloquea automáticamente una venta forzosa, terremoto o apagón y se consume. No evita alquileres; si ya tienes uno, no recibes otro.'],
  ['건설 지원금', 'Ayuda de construcción', '+1', '내 일반 도시의 건설 가능한 가장 낮은 미보유 일반 건물 하나를 무료로 지어요. 호텔은 출발 1회 통과 뒤 가능하며 랜드마크는 지을 수 없어요.', 'Construye gratis el edificio ordinario permitido más bajo que falte en una ciudad propia. Hotel requiere una vuelta; no construye monumentos.'],
  ['빈 도시 탐색', 'Busca una ciudad libre', '→', '앞으로 가장 가까운 주인 없는 일반 도시로 가요. 출발 통과 보너스와 정상 도착·구매 규칙을 적용해요. 관광지는 대상이 아니에요.', 'Avanza a la ciudad normal libre más cercana. Aplica el bono de Salida y las reglas normales de llegada y compra; no busca turismo.'],
  ['생일 축하금', 'Regalo de cumpleaños', '≤40', '생존 상대마다 보유 현금 내에서 최대 40을 나에게 줘요. 팀원은 내지 않으며 대출·강제 매각·미납금은 없어요.', 'Cada rival activo te da hasta 40 de su efectivo disponible. Tu compañero no paga; no genera préstamos, ventas forzosas ni deuda pendiente.'],
];
export function MarbleExpandedCardGuide({language,eventVersion=3}:{language:Language;eventVersion?:number}) {
 const t=(ko:string,es:string)=>words(language,ko,es),expanded=eventVersion>=4;
 return <section className="marble-rule-events"><h3>{t(`황금열쇠 ${expanded?23:16}종`,`Llaves doradas: ${expanded?23:16} cartas`)}</h3>{expanded&&<><p>{t('추가 7종은 실물 보드게임의 아이디어를 우리 판에 맞춘 변형이며 원작 카드와 완전히 같지는 않아요. 대상이 없으면 이유를 알리고 효과 없이 계속해요.','Las siete cartas añadidas adaptan ideas de juegos de mesa a nuestra variante; no reproducen exactamente las originales. Sin objetivo válido se indica el motivo y se continúa sin efecto.')}</p><details className="guide-details marble-rule-expanded-card-list"><summary>{t('추가 7종의 효과 보기','Ver las siete cartas añadidas')}</summary><ul>{expandedEventEffects.map(([ko,es,amount,detailKo,detailEs])=><li key={es}><b>{amount}</b><div><strong>{t(ko,es)}</strong><p>{t(detailKo,detailEs)}</p></div></li>)}</ul></details></>}</section>;
}

export function MarbleRuleGuide({ language, rules, options = {}, teamMode = false }: {
  language: Language; rules: string[]; options?: BeginnerGuideOptions; teamMode?: boolean;
}) {
  const t = (ko: string, es: string) => words(language, ko, es);
  const economicVersion = options.marbleEconomyVersion === 3 ? 3 : options.marbleEconomyVersion === 1 ? 1 : 2;
  const { amount, repayment } = marbleLoanTerms(options.marbleLoanRulesVersion);
  const independent = options.marbleConstructionRulesVersion === 2;
  const expandedEvents = (options.marbleEventVersion??3)>=4, eventCount=expandedEvents?23:16;
  if(options.marbleCityRouteVersion===5){const islandCount=worldIslandsBoardFor(options.marbleBoardRevision).filter(tile=>tile.kind==='tourism').length;const sample=marbleEngine.getPlayerView({...marbleEngine.createInitialState(1),rentRulesVersion:options.marbleRentRulesVersion===2?2:1,constructionPriceRulesVersion:options.marbleConstructionPriceRulesVersion===2?2:1},'p1').board.tiles.find((tile:MarbleTile)=>tile.kind==='property');return <div className="marble-rule-guide"><h3>{t('세계 도시와 섬 · 32칸','Ciudades e islas · 32 casillas')}</h3><ul><li>{t(`대출은 ${amount}을 받고 ${repayment}을 전액 상환합니다. 추가 이자·만기는 없으며, 기존 대출을 갚아야 다시 빌릴 수 있습니다. 지급 위기에는 매각과 대출로 부족액을 마련하고, 위기에서 파산을 선택할 수도 있습니다.`, `Recibes ${amount} y devuelves ${repayment} completos, sin más intereses ni vencimiento. Paga la deuda antes de pedir otro préstamo. En una crisis vende propiedades o pide crédito; también puedes optar por declararte en quiebra durante la crisis.`)}</li><li>{t(`도시 18곳과 관광지 ${islandCount}곳을 구매합니다. 도시별 토지·건물·통행료는 각 도시 금액표를 따릅니다.`,`Compra 18 ciudades y ${islandCount} destinos turísticos. Cada ciudad usa su propia tabla de precios y alquileres.`)}</li>{options.marbleRentRulesVersion===2&&<li>{t('이 판의 일반 도시·관광지 통행료는 이전 기준보다 20%, 랜드마크 통행료는 30% 낮습니다.','En esta partida, los alquileres normales y turísticos son un 20 % menores que la tabla anterior; los de monumentos, un 30 % menores.')}</li>}{options.marbleConstructionPriceRulesVersion===2&&<li>{t('빌라·빌딩·호텔·랜드마크 추가 건설비는 이전 기준보다 20% 낮고 토지 가격은 그대로입니다.','Construir villa, edificio, hotel o monumento cuesta un 20 % menos que antes; el precio del terreno no cambia.')}</li>}<li>{t('출발 통과 보너스 450. 빌라·빌딩을 따로 선택하고 출발 1회 통과 뒤 호텔을 지을 수 있습니다. 건물 3종을 갖춘 도시의 재방문·출발 도착 또는 이미 완성된 도시 인수 때 랜드마크를 건설합니다.','Pasar Salida: +450. Elige villa y edificio; el hotel requiere una vuelta. Tras completar los tres, construye el monumento al revisitar, llegar a Salida o adquirir una ciudad ya completa.')}</li><li>{t(`랜드마크도 정전 대상이 됩니다. 관광지는 구매 150 · 통행료 ${options.marbleRentRulesVersion===2?96:120} · 은행 매각 75. 건설은 없고 관광지는 할인권이 있을 때만 인수 가능합니다. 랜드마크는 인수 불가·통행료 별도.`,`Los monumentos también reciben apagón. Turismo: compra 150, alquiler ${options.marbleRentRulesVersion===2?96:120}, venta al banco 75. Sin construcción; turismo solo se adquiere con cupón. Sin monumentos; alquiler aparte.`)}</li><li>{t('세계여행은 다음 내 차례에 보드의 어느 칸이든 직접 눌러 선택합니다.','En tu próximo turno de viaje, pulsa cualquier casilla para elegir destino.')}</li><li>{t('한 변의 도시와 관광지를 모두 한 사람이 소유하면 라인 독점 승리입니다. 서로 다른 색상 그룹 3개 완성 또는 관광지 전부 소유해도 승리합니다. 팀전에서도 한 사람이 완성해야 합니다.','Una persona gana al poseer todas las ciudades y destinos turísticos de un lado. También gana quien complete tres grupos de color o posea todos los destinos turísticos. En equipos debe completarlo una sola persona.')}</li><li>{teamMode ? t('상대 팀 두 명이 모두 파산해도 승리합니다. 한 명만 파산하면 팀원은 계속합니다. 120개 완료 차례 뒤에는 팀원 둘의 순자산 합계를 비교하며 같으면 무승부입니다.','También gana el equipo cuando quiebran los dos rivales; si quiebra uno, su compañero continúa. Tras 120 turnos completos se compara la suma del patrimonio neto de cada equipo; si empatan, hay empate.') : t('상대가 파산해도 승리합니다. 120개 완료 차례 뒤에는 순자산이 높은 쪽이 이기며 같으면 무승부입니다.','También ganas si tu rival quiebra. Tras 120 turnos completos gana quien tenga mayor patrimonio neto; si empatan, hay empate.')}</li><li>{(options.marbleBoardRevision === 3 || options.marbleBoardRevision === 4) ? t('색상군 하나의 완성은 통행료를 올리지 않습니다. 서로 다른 3개를 한 사람이 완성하면 즉시 승리합니다.','Completar un color no aumenta el alquiler. Una sola persona gana de inmediato al completar tres grupos distintos.') : t('한 사람이 같은 색을 전부 소유하면 그 도시들의 통행료가 2배입니다.','Si una persona completa un color, se duplican los alquileres de esas ciudades.')}</li><li>{options.marbleFestivalRulesVersion===2?t('축제는 플레이어당 1개입니다. 새 도시에서 열면 기존 내 축제만 해제됩니다. 같은 도시 재선택은 중첩되지 않으며 다음 상대 방문 1회 통행료 2배 후 종료됩니다. 랜드마크도 대상입니다.','Un festival por jugador. Celebrarlo en otra ciudad elimina solo tu festival anterior. Repetir ciudad no acumula efectos; el próximo rival paga el doble una vez y termina. Los monumentos también son elegibles.'):t('저장된 축제 규칙: 여러 내 도시에 각각 축제를 유지할 수 있고, 각 도시의 다음 상대 방문 1회 통행료가 2배가 된 뒤 종료됩니다.','Regla guardada: puedes mantener festivales en varias ciudades propias; cada uno duplica una vez el próximo alquiler rival y termina.')}</li>{worldIslandsBoardFor(options.marbleBoardRevision).some(tile=>tile.kind==='festival-site')&&<li>{t('출발 맞은편 축제개최 칸은 무료입니다. 내 도시 하나를 선택하면 다음 상대 방문 통행료가 한 번 2배가 됩니다. 관광지는 선택할 수 없고 내 도시가 없으면 효과 없이 끝납니다.','Festival, frente a Salida, es gratis. Elige una ciudad tuya para duplicar una vez el alquiler de la próxima visita rival. No puedes elegir turismo; sin ciudades propias no hay efecto.')}</li>}</ul><MarbleExpandedCardGuide language={language} eventVersion={options.marbleEventVersion}/><MarblePropertyLedger tile={sample} language={language} economicVersion={3} propertyRulesVersion={1} constructionRulesVersion={2} effectiveValues/><p>{t('승인된 세계 도시·섬 변형 규칙입니다. 원작 전체를 동일하게 재현한 것은 아닙니다.','Variante aprobada de ciudades e islas; no es una reproducción completa del original.')}</p></div>;}
  const openingCash = marbleStartingCash(economicVersion), passSalary = marblePassStartSalary(economicVersion);
  const guideState = createLegacyMarbleState(1); guideState.economicVersion = economicVersion;
  const currentCities: MarbleTile[] = marbleEngine.getPlayerView(guideState, 'p1').board.tiles;
  const exampleCity = currentCities.find(tile => tile.name.es === (language === 'es' ? 'Santo Domingo' : 'Gwangju'))!;
  const guide = getBeginnerGuide('marble', language, { ...options, marblePropertyRulesVersion: 1 })!;
  const eventRules = expandedEvents ? rules.map(rule=>rule.replace('황금열쇠 16종','황금열쇠 23종').replace('Las 16 llaves doradas','Las 23 llaves doradas')) : rules;
  const loanRules = options.marbleLoanRulesVersion === 2 ? eventRules.map(rule => /^(대출|지급 위기|Préstamo|Crisis de pago)/.test(rule) ? rule.replace(/300/g, '600').replace(/330/g, '660').replace(/매번 30/g, '매번 60').replace(/costar 30/g, 'costar 60') : rule) : eventRules;
  const baseRules = teamMode ? loanRules.map((rule, index) => index === 0
    ? t(`목표와 준비 — 우리 40칸·3단계 건설 팀전입니다. 각자 ${openingCash}으로 출발하고 팀원과 번갈아 앉아요. 돈과 도시·대출은 개인별이며, 같은 팀 두 명이 모두 파산하면 패배합니다.`, `Objetivo y preparación — Nuestra variante por equipos tiene 40 casillas y tres niveles. Cada persona empieza con ${openingCash} y los equipos se sientan alternados. El dinero, las ciudades y las deudas son individuales; el equipo pierde cuando ambos quiebran.`)
    : index === 9
      ? t('팀 정산 — 120개 완료 차례 뒤 두 팀원의 순자산을 합산합니다. 순자산은 현금+도시 원래 매입가+각 실제 건설비−미상환 대출이며 인수 웃돈은 포함하지 않습니다. 더블 재굴림·탈락 좌석은 완료 차례로 세지 않습니다. 팀 합계가 같으면 무승부입니다. 경매·저당·협의 거래는 없습니다.', 'Cuenta del equipo — Tras 120 turnos completos se suma el patrimonio neto de ambos compañeros: efectivo + precio original de las ciudades + construcción − deudas. El dinero extra de una adquisición no aumenta ese valor. Los lanzamientos extra y los asientos eliminados no cuentan como turnos completos. Si los equipos empatan, hay empate. No hay subastas, hipotecas ni intercambios negociados.')
      : rule) : loanRules;
  const savedRoomBuildingRule = t('도시와 건설 — 이 저장 방은 기존 건설 규칙을 유지합니다. 소유 도시에서 자금이 충분하면 최대 3단계까지 건설할 수 있습니다. 현재 경제의 땅값은 도시표의 80%를 10 단위로 반올림하며, 주택·아파트·랜드마크 비용은 조정 땅값의 40%·60%·80%(최소 30)입니다.', 'Ciudades y construcción — Esta sala guardada conserva su regla anterior: puedes construir en cualquier ciudad propia hasta nivel 3 si tienes fondos. El terreno cuesta el 80 % de la tabla, redondeado a 10; casa, apartamentos y monumento cuestan el 40 %, 60 % y 80 % del precio ajustado (mínimo 30).');
  const legacyDetailedRules = economicVersion === 3 ? baseRules.map((rule,index) => index === 0 && !teamMode ? rule.replace('1500',String(openingCash)) : index === 1 ? rule.replace('통과하면 200',`통과하면 ${passSalary}`).replace('pasar por Salida cobras 200',`pasar por Salida cobras ${passSalary}`) : index === 2 && options.marbleConstructionRulesVersion === 1 ? t('도시와 건설 — 빈 도시를 사거나 거절합니다. 구매한 도시와 재방문한 내 도시에서 건설합니다. 출발에 정확히 도착하면 내 도시 한 곳을 골라 한 번 건설합니다. 첫 구매는 최대 2단계이며 랜드마크는 이미 2단계인 도시의 재방문이나 출발 정확 도착 때 가능합니다. 인수 전부터 2단계였던 도시는 인수 직후 랜드마크를 건설할 수 있습니다. 인수 후 2단계를 완성했다면 재방문해야 합니다. 땅값은 기존 40칸 도시표의 80%를 10 단위 반올림합니다. 주택→아파트→랜드마크 비용은 조정 땅값의 40%·60%·80%(최소 30)이며, 통행료 단계 배수는 1·2·3·4배입니다.', 'Ciudades y construcción — Compra una ciudad libre o recházala. Construye en la ciudad comprada o al volver a una propia. Al llegar exactamente a Salida, elige una ciudad propia para construir una vez. La primera compra permite hasta el nivel 2; el monumento exige volver a una ciudad que ya era nivel 2 o llegar exactamente a Salida. Si ya era nivel 2 antes de adquirirla, puedes construir el monumento inmediatamente. Si completas el nivel 2 después de adquirirla, debes volver. El terreno vale el 80 % de la tabla actual, redondeado a 10. Construir casa→apartamentos→monumento cuesta el 40 %, 60 % y 80 % del precio ajustado (mínimo 30); el alquiler multiplica por 1, 2, 3 y 4.') : index === 2 ? savedRoomBuildingRule : index === 5 ? rule.replace('출발 이동 +200',`출발 이동 +${passSalary}`).replace('Salida +200',`Salida +${passSalary}`) : index === 8 ? rule.replace('통과해도 200',`통과해도 ${passSalary}`).replace('también paga 200',`también paga ${passSalary}`) : rule) : baseRules;
  const detailedRules = independent ? legacyDetailedRules.map((rule,index)=>index===2?t('도시와 건설 — 땅과 함께 빌라·빌딩·호텔을 개별 선택하고 총액을 확인한 뒤 한 번에 확정해요. 첫 바퀴에는 빌라·빌딩, 출발을 한 번 지난 뒤 호텔이 가능해요. 이미 세 건물이 모두 있던 도시를 재방문하거나 출발에 정확히 도착하면 랜드마크를 건설할 수 있어요. 인수 뒤에도 남은 일반 건물을 추가할 수 있어요. 인수 전부터 세 건물이 모두 있던 도시는 즉시 랜드마크가 가능해요. 인수 후 세 건물을 완성한 경우에는 재방문이 필요해요.', 'Ciudades y construcción — Selecciona villa, edificio y hotel por separado; revisa el total y confirma una sola vez junto con el terreno. Villa y edificio están disponibles desde el inicio; el hotel, después de completar una vuelta. Para construir un monumento, vuelve a una ciudad que ya tenga los tres edificios o llega exactamente a Salida. Después de adquirir también puedes añadir los edificios que falten. Si la ciudad ya tenía los tres edificios antes de adquirirla, puedes construir el monumento de inmediato. Si los completas después, debes volver a la ciudad.'):index===0?rule.replace('3단계 건설','개별 건물 건설').replace('tres niveles','edificios independientes'):rule) : legacyDetailedRules;
  const stageNames = independent ? (language==='ko'?['대지','빌라','빌딩','호텔','랜드마크']:['Terreno','Villa','Edificio','Hotel','Monumento']) : language === 'ko' ? ['대지', '단독주택', '아파트', '랜드마크'] : ['Terreno', 'Casa', 'Apartamentos', 'Monumento'];
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
        <MarblePropertyArt city={language === 'es' ? 'santo-domingo' : 'gwangju'} level={independent ? level===4?3:level===0?0:1 : level} buildings={independent ? level===0?[]:level===4?['villa','building','hotel']:[(['villa','building','hotel'] as const)[level-1]] : undefined} landmark={independent ? level===4 : undefined} routeVersion={options.marbleCityRouteVersion ?? 3} className="marble-rule-building-art" language={language}/>
        <figcaption><span>{level}</span><strong>{name}</strong></figcaption>
      </figure>)}</div>
      <p className="marble-rule-example">{independent?t('각 일반 건물 행은 해당 건물만 선택한 예시예요. 랜드마크의 투자액에는 땅과 일반 건물 세 종류가 모두 포함돼요.', 'Cada fila normal muestra solo ese edificio. La inversión del monumento incluye el terreno y los tres edificios.'):t(`${exampleCity.name.ko} 예시 · 추가비는 그 단계에서 더 내는 돈, 누적은 땅값과 지금까지 지은 건설비의 합이에요.`, `Ejemplo: ${exampleCity.name.es}. «Costo extra» es lo que pagas por ese nivel; «Invertido» suma el terreno y todos los niveles construidos.`)}</p>
      <MarblePropertyLedger tile={exampleCity} language={language} economicVersion={economicVersion} propertyRulesVersion={1} constructionRulesVersion={options.marbleConstructionRulesVersion} effectiveValues/>
      <p className="marble-rule-color">{t('한 사람이 같은 색을 전부 소유하면 그 도시들의 통행료 ×2', 'Si tú solo completas un color, cobras el doble de alquiler en esas ciudades.')}</p>
    </section>
    <div className="marble-rule-pair">
      <section aria-labelledby="marble-rule-takeover-title">
        <img src="/images/marble/guides/takeover-protection.webp" alt={t('일반 도시의 소유권을 넘기는 모습과 방패로 보호된 랜드마크', 'Una ciudad cambia de dueño; un escudo protege el monumento')} width="1536" height="1024" loading="lazy" decoding="async"/>
        <h3 id="marble-rule-takeover-title">{t('상대 도시 인수 · 랜드마크 보호', 'Ciudad rival: adquisición · monumento protegido')}</h3>
        <p>{t('통행료 지급 또는 면제권 사용 → 선택 인수. 누적 투자액 ×2를 기존 소유자에게 내요. 건물 단계는 유지돼요.', 'Primero paga el alquiler o usa un pase; luego decide si adquieres la ciudad. Pagas al dueño el doble de la inversión acumulada y conservas los edificios.')}</p>
        <strong className="marble-rule-key">{t('랜드마크는 인수 불가 · 정전 가능', 'Monumento: no se adquiere; sí recibe apagón')}</strong>
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
      <h3 id="marble-rule-events-title">{t(`황금열쇠 ${eventCount}종 · 그림을 보고 효과를 확인해요`, `${eventCount} llaves doradas · mira la carta y su efecto`)}</h3>
      <div>{eventCategories.map(([image, ko, es, detailKo, detailEs]) => <figure key={image}>
        <img src={`/images/marble/events/${image}.webp`} alt="" width="160" height="160" loading="lazy" decoding="async"/>
        <figcaption><strong>{t(ko, es)}</strong><span>{t(detailKo, detailEs)}</span></figcaption>
      </figure>)}</div>
      {expandedEvents&&<p>{t('추가 7종은 우리 판에 맞춘 변형입니다. 도시 방어권은 자동으로 소모되며 대상이 없으면 효과 없이 계속합니다.','Las siete cartas añadidas son adaptaciones propias. El escudo se consume automáticamente; sin objetivo válido no hay efecto.')}</p>}<p>{t('탈출권·통행료 면제권은 직접 사용해요. 이동 카드는 도착한 칸의 효과까지 적용해요.', 'Tú decides cuándo usar los pases de salida y alquiler. Las cartas de viaje también aplican el efecto de la casilla de llegada.')}</p>
      <details className="guide-details marble-rule-card-list"><summary>{t(`${eventCount}종 카드 한 장씩 보기`, `Ver el efecto de cada una de las ${eventCount} cartas`)}</summary>
        <ul>{(expandedEvents?[...eventEffects,...expandedEventEffects]:eventEffects).map(([ko, es, amount, detailKo, detailEs]) => <li key={es}><b>{ko === '출발점으로 이동' ? `+${passSalary}` : amount}</b><div><strong>{t(ko, es)}</strong><p>{t(independent&&ko==='건물 수리'?'일반 건물 개수 ×40, 랜드마크 도시당 160을 내요.':ko === '출발점으로 이동' ? `출발로 가서 ${passSalary}을 한 번 받아요.` : detailKo.replace('출발 통과 시 +200',`출발 통과 시 +${passSalary}`), independent&&ko==='건물 수리'?'Pagas 40 por cada edificio normal y 160 por cada ciudad con monumento.':ko === '출발점으로 이동' ? `Ve a Salida y cobra ${passSalary} una sola vez.` : detailEs.replace('Cruzar Salida paga 200',`Cruzar Salida paga ${passSalary}`).replace('cobras 200',`cobras ${passSalary}`))}</p></div></li>)}</ul>
        <p>{t('독점 경고 공동 선두는 카드를 뽑은 사람이 포함되면 그 사람, 아니면 시작 좌석부터 차례순으로 첫 공동 선두에게 부과해요.', 'Si hay empate en la advertencia de monopolio, paga quien sacó la carta si está entre quienes lideran. Si no, paga la primera persona empatada en el orden desde el asiento inicial.')}</p>
      </details>
    </section>
    <aside className="marble-rule-rescue">
      <h3>{t('낼 돈이 부족하면?', '¿No te alcanza para pagar?')}</h3>
      <p>{t(`지급 위기에서 도시+건물을 은행에 팔아 누적 투자액의 절반을 받아요. 대출은 ${amount} → 상환 ${repayment}. 지급 위기에서 파산을 선택할 수도 있어요.`, `Durante la crisis puedes vender al banco una ciudad con sus edificios por la mitad de su inversión. El préstamo te da ${amount} y devuelves ${repayment}. También puedes optar por declararte en quiebra durante la crisis.`)}</p>
      {teamMode && <p>{t('아군 통행료는 없고 돈과 도시는 각자 관리해요. 팀원 둘이 모두 파산하면 패배해요.', 'No pagas alquiler a tu compañero. Cada quien maneja su dinero y sus ciudades; el equipo pierde cuando ambos quiebran.')}</p>}
    </aside>
    <details className="guide-details marble-rule-details"><summary>{t('정산·세부 규칙', 'Cuenta final y reglas completas')}</summary>
      <p className="marble-rule-variant">{independent?t('우리 40칸 보드의 개별 건물·랜드마크 변형입니다. 금액·정산·팀 규칙은 이 게임의 맞춤 규칙이며 원작 전체의 동일 재현은 아닙니다.', 'Esta variante de 40 casillas tiene edificios independientes y monumentos. La economía, la cuenta final y los equipos usan reglas propias; no es una reproducción íntegra del original.'):t('우리 40칸·3건설 단계 변형입니다. 공식 모두의마블의 4건물 단계나 Monopoly를 그대로 재현하지 않습니다.', 'Esta es nuestra variante de 40 casillas y tres niveles. No reproduce los cuatro niveles de Modoo Marble ni las reglas completas de Monopoly.')}</p>
      <ol className="guide-full-rules">{detailedRules.map((rule, index) => <li key={index}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><p>{rule}</p></li>)}</ol>
    </details>
  </div>;
}
