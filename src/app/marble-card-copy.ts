import type {Language} from '../core/types';
import type {MarbleEventId} from '../games/marble';
import {marblePassStartSalary} from '../games/marbleEconomy';
type Copy={name:string;effect:string;target:string;duration:string};
export function marbleCardCopy(id:MarbleEventId,language:Language,economicVersion=3,independent=true,passSalary=marblePassStartSalary(economicVersion)):Copy{
 const ko=language==='ko',now=ko?'즉시 1회 처리':'Se resuelve una vez, ahora',self=ko?'카드를 뽑은 플레이어':'Quien roba la carta';
 const data:Record<MarbleEventId,[string,string,string,string]> = ko ? {
 'takeover-discount-pass':['인수 할인권','직접 선택하면 인수비만 50% 할인(올림)하고 1장을 소모합니다. 실제 결제액을 기존 소유자에게 지급합니다. 관광지는 기준 300 → 150. 통행료 별도·미소유 땅 구매에는 적용 불가.','상대 도시·관광지 · 랜드마크·팀원 제외','사용할 때까지 보관 · 자동 사용 안 함'],
 'forced-sale':['강제 청산','상대 일반 도시를 은행에 매각합니다. 은행이 소유자에게 실제 매각대금을 지급하고 토지·건물·도시 효과를 회수합니다. 공격자 수입은 0입니다.','상대 일반 도시 1곳 · 관광지·랜드마크 제외',now],
 earthquake:['지진','상대 도시의 가장 높은 일반 건물 1개를 철거합니다. 보상은 0이며 소유권·다른 효과는 유지됩니다.','건물이 있는 상대 일반 도시 · 랜드마크 제외',now],
 'city-shield':['도시 방어권','최대 1장 보관합니다. 다음 강제 청산·지진·정전을 자동으로 한 번 막고 소모됩니다. 통행료는 막지 않습니다.',self,'공격 방어 시까지 보관 · 이미 보유하면 추가 지급 없음'],
 'construction-grant':['건설 지원금','건설 가능한 가장 낮은 미보유 일반 건물 1개를 무료로 건설합니다. 호텔은 출발 1회 통과 후 가능하며 랜드마크는 만들지 않습니다.','건설 가능한 내 일반 도시 1곳',now],
 'property-hunt':['빈 도시 탐색','앞으로 가장 가까운 미소유 일반 도시로 이동하고 구매 등 도착 규칙을 적용합니다. 출발 통과 보너스도 정상 지급됩니다.','가장 가까운 미소유 일반 도시 · 없으면 효과 없음',now],
 birthday:['생일 축하','생존한 상대마다 현금에서 최대 40씩 받아요. 부족한 상대는 가진 현금만 내며 대출·매각은 없습니다. 팀원은 내지 않습니다.',self,now],

 festival:['동네 축제','은행에서 150을 받습니다.',self,now],lottery:['복권 당첨','은행에서 200을 받습니다.',self,now],
 'rent-rebate':['임대료 환급','은행에서 80을 돌려받습니다.',self,now], 'travel-cost':['여행 경비','은행에 100을 지급합니다. 부족하면 매각·대출로 결제합니다.',self,now],
 maintenance:['건물 수리',independent?'보유한 일반 건물마다 40, 랜드마크 도시는 160의 수리비를 냅니다.':'보유 도시의 건설 단계 합계 ×40을 지급합니다.',self,now],
 'visit-santo-domingo':['산토도밍고 방문','산토도밍고로 이동한 뒤 구매·통행료 등 도착 규칙을 적용합니다.','산토도밍고',now],
 'advance-start':['출발점으로 이동',`출발점으로 이동하고 ${passSalary}을 받습니다.`,self,now],
 retreat:['세 칸 뒤로','뒤로 3칸 이동하고 도착 효과를 적용합니다. 출발 보너스는 없습니다.',self,now],
 'go-to-island':['무인도로 이동','무인도로 이동합니다. 다음 차례에 더블 시도·100 지급·탈출권 중 선택합니다.',self,'최대 3번의 제한 차례 · 탈출하면 종료'],
 'escape-pass':['무인도 탈출권','탈출권 1장을 보관합니다. 무인도 차례에 사용하면 비용 없이 나옵니다.',self,'사용할 때까지 보관 · 사용 시 1장 소모'],
 'train-ticket':['무료 세계여행','지금 보드의 어느 칸이든 골라 운임 0으로 이동합니다. 도착 통행료는 별도이며 이동을 건너뛸 수 있습니다.','선택한 보드 칸','이번 이동 1회 · 사용하지 않으면 종료'],
 'city-dividend':['도시 배당금','보유 부동산 수 ×30을 은행에서 받습니다.',self,now],
 'monopoly-warning':['독점 경고','완성 색상군 수 ×100, 최대 300을 지급합니다. 완성 그룹이 없으면 지급하지 않습니다.','완성 색상군 최다 보유자 · 동률 대상 중 카드 뽑은 사람 우선, 아니면 좌석 순',now],
 'city-festival':['도시 축제','선택한 내 도시의 다음 상대 방문 통행료가 2배가 됩니다. 지금 돈을 받는 효과가 아닙니다.','내 소유 도시 1곳','다음 상대 착지 1회까지 유지 · 적용 후 종료'],
 blackout:['정전','선택한 상대 도시의 다음 내 방문 통행료를 절반으로 줄입니다. 지금 통행료를 내는 효과가 아닙니다.','상대 소유 도시 1곳 · 랜드마크 포함','다음 내 착지 1회까지 유지 · 적용 후 종료'],
 'rent-pass':['통행료 면제권','면제권 1장을 보관합니다. 상대 도시 도착 후 사용하면 그 통행료를 내지 않습니다.',self,'사용할 때까지 보관 · 사용 시 1장 소모'],
 } : {
 'takeover-discount-pass':['Cupón de adquisición','Elige usar uno para pagar el 50 % del precio (redondeo hacia arriba). El dueño cobra solo lo pagado. Turismo: base 300 → 150. Alquiler aparte; no descuenta compras al banco.','Ciudad o turismo rival; sin monumentos ni aliados','Se guarda hasta usarlo manualmente; consume uno'],
 'forced-sale':['Venta forzosa','Vende una ciudad rival al banco. El banco paga su valor de venta al dueño y retira terreno, edificios y efectos. El atacante recibe 0.','Una ciudad rival normal; sin turismo ni monumentos',now],
 earthquake:['Terremoto','Retira el edificio ordinario más alto de una ciudad rival. Compensación 0; conserva dueño y otros efectos.','Ciudad rival con edificios; sin monumentos',now],
 'city-shield':['Escudo urbano','Guarda como máximo uno. Bloquea automáticamente una venta forzosa, terremoto o apagón y se consume. No bloquea alquileres.',self,'Hasta bloquear un ataque; si ya tienes uno no recibes otro'],
 'construction-grant':['Ayuda de construcción','Construye gratis el edificio ordinario permitido más bajo que falte. El hotel requiere una vuelta. No construye monumentos.','Una ciudad propia donde se pueda construir',now],
 'property-hunt':['Busca una ciudad libre','Avanza a la ciudad normal sin dueño más cercana y aplica la llegada, incluida la compra. Cobras Salida si la cruzas.','Ciudad normal libre más cercana; sin objetivo no hay efecto',now],
 birthday:['Feliz cumpleaños','Recibes hasta 40 en efectivo de cada rival activo. Si tiene menos, paga solo lo disponible, sin vender ni pedir crédito. Los aliados no pagan.',self,now],

 festival:['Fiesta del barrio','Recibes 150 del banco.',self,now],lottery:['Premio de lotería','Recibes 200 del banco.',self,now],
 'rent-rebate':['Reembolso de alquiler','Recibes 80 del banco.',self,now],'travel-cost':['Gastos de viaje','Pagas 100 al banco. Si falta efectivo, vende o pide un préstamo.',self,now],
 maintenance:['Mantenimiento',independent?'Pagas 40 por edificio normal y 160 por ciudad con monumento.':'Pagas 40 por cada nivel construido.',self,now],
 'visit-santo-domingo':['Visita a Santo Domingo','Viaja a Santo Domingo y aplica compra, alquiler y demás efectos de llegada.','Santo Domingo',now],
 'advance-start':['Ve a Salida',`Ve a Salida y recibe ${passSalary}.`,self,now],retreat:['Retrocede tres casillas','Retrocede 3 y aplica la llegada. No recibes premio de Salida.',self,now],
 'go-to-island':['Ve a la isla','Ve a la isla. En tu turno puedes intentar dobles, pagar 100 o usar un pase.',self,'Hasta 3 turnos restringidos; termina al salir'],
 'escape-pass':['Pase de salida','Guardas un pase. Úsalo en la isla para salir sin pagar.',self,'Se guarda hasta usarlo; consume 1 pase'],
 'train-ticket':['Viaje mundial gratis','Elige cualquier casilla del tablero sin pagar pasaje. El alquiler se paga aparte. Puedes no viajar.','Cualquier casilla elegida','Solo este viaje; caduca si lo omites'],
 'city-dividend':['Dividendo de la ciudad','Recibes 30 del banco por cada propiedad tuya.',self,now],
 'monopoly-warning':['Advertencia de monopolio','Pagas 100 por grupo completo, máximo 300. Sin grupos no hay pago.','Quien tenga más grupos; entre empatados, quien robó la carta primero, si no por asiento',now],
 'city-festival':['Festival de ciudad','Duplica el alquiler de tu casilla elegida en la próxima visita rival. No recibes dinero ahora.','Una ciudad propia','Hasta la próxima llegada rival; se aplica una vez'],
 blackout:['Apagón','Reduce a la mitad el alquiler de la ciudad rival en tu próxima visita. No pagas alquiler ahora.','Una ciudad rival, incluido un monumento','Hasta tu próxima llegada; se aplica una vez'],
 'rent-pass':['Pase de alquiler','Guardas un pase. Al llegar a una ciudad rival puedes usarlo para no pagar ese alquiler.',self,'Se guarda hasta usarlo; consume 1 pase'],
 };
 const [name,effect,target,duration]=data[id];return{name,effect,target,duration};
}
