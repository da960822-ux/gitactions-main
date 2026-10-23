import type { Language } from '../core/types';
import { DominoTile } from './DominoTile';

const copy = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;

export function DominoQuickGuide({ language, rulesVersion = 2, mode = '1v1' }: { language: Language; rulesVersion?: number; mode?: string }) {
  const lisbeth = rulesVersion === 2;
  const fourSeatRule = mode === 'partners' ? (language === 'ko' ? '두 팀은 번갈아 앉아요. ' : 'Los equipos se sientan alternados. ') : '';
  const openingPassRule = language === 'ko'
    ? mode === '1v1'
      ? '1대1은 첫 타일을 낸 쪽이 보너스를 받아요. 다음 사람이 첫 차례에 패스하면 성립하고, 더블 오프닝은 어느 판이든 +30, 이후 판의 비더블 오프닝은 +60이에요.'
      : '네 자리에서는 첫 타일을 낸 쪽이 보너스를 받아요. 다음 자리가 패스하고 세 번째 자리가 실제로 놓아야 성립해요. 세 번째 자리도 패스하면 취소돼요. 더블 오프닝은 어느 판이든 +30, 이후 판의 비더블 오프닝은 +60이에요.'
    : mode === '1v1'
      ? 'En uno contra uno, el lado que hizo la salida recibe el bono cuando pasa la persona siguiente en su primer turno: +30 si la apertura fue doble, en cualquier mano, o +60 si fue no doble en una mano posterior.'
      : 'Con cuatro asientos, el lado que hizo la salida recibe el bono cuando pasa el asiento siguiente y juega el tercero. Si también pasa el tercero, se cancela. La apertura doble da +30 en cualquier mano; una apertura no doble en una mano posterior da +60.';
  const lisbethTip = language === 'ko' ? [
    openingPassRule + ' 이 보너스는 라운드 정산 때 더해요.',
    '일반 승리와 카피쿠아 모두 승리 팀이 모든 손패의 남은 숫자 합을 받아요. 카피쿠아는 마지막 타일이 비더블이고, 놓기 전 서로 다른 양쪽 열린 끝 모두에 맞으면 +30점이 더해져요.',
    `${fourSeatRule}모든 모드에서 양쪽 열린 끝 숫자에 각각 맞는 서로 다른 타일 7개가 놓이면 즉시 막혀요. 그 전에 아무도 놓을 수 없는 경우 1대1은 2번, 네 자리는 4번 연속 패스하면 막혀요. 트랑케는 막은 사람과 다음 자리만 비교해 낮은 쪽이 이기고, 동점이면 막은 사람이 이겨요. 정산 점수는 파트너를 포함한 모든 손패의 합이에요. 파소 코리도 보너스는 없어요.`,
  ] : [
    openingPassRule + ' Este bono se suma al cerrar la mano.',
    'En una victoria normal y en capicúa, el equipo ganador recibe los puntos restantes de todas las manos, incluida la de su pareja. Capicúa añade +30 si la última ficha no es doble y servía en los dos extremos distintos antes de jugarla.',
    `${fourSeatRule}En todos los modos, la mano se bloquea al jugar las 7 fichas distintas que coinciden con cada extremo abierto. Antes, si nadie puede jugar, se bloquea tras 2 pases seguidos en uno contra uno o 4 con cuatro asientos. El tranque compara solo a quien cerró la mano con el asiento siguiente; gana quien tenga menos y, en empate, quien la cerró. Para puntuar se cuentan todas las manos. No hay bono de paso corrido.`,
  ];
  return <div className="quick-guide">
    <p className="quick-guide-goal">{copy(language, lisbeth ? '목표 · 기본은 200점 경기예요. 시작 전 100점으로 바꿀 수 있어요. 첫 판은 6|6으로 열고, 다음 판부터는 직전 승자가 손패의 타일 아무거나 놓아 시작해요.' : '목표 · 한 판은 손패를 먼저 비우면 우리 편이 이겨요. 4인전은 두 명씩 한 팀이에요. 누적 경기는 설정한 100·200점에 먼저 도달해야 끝나요.', lisbeth ? 'Objetivo: la meta inicial es 200 puntos; antes de empezar puedes elegir 100. La primera mano abre con el 6|6; después, quien ganó la mano anterior abre con cualquier ficha.' : 'Objetivo: vacía tu mano para ganar la ronda. Con cuatro jugadores, juegan en parejas. En un partido por puntos, llega a la meta elegida de 100 o 200.')}</p>
    <ol className="quick-guide-steps">
      <li>
        <figure className="quick-guide-image" aria-label={copy(language, '예시 더블 4|4 (항상 나오지는 않음)', 'Ejemplo de doble 4|4; no siempre se reparte')}>
          <DominoTile left={4} right={4} label="4|4"/>
        </figure>
        <h3>{copy(language, '내 차례에 타일 고르기', 'Elige en tu turno')}</h3>
        <p>{copy(language, lisbeth ? '아래는 내 손패, 중앙은 공개 줄이에요. 내 차례에 활성 타일을 눌러 선택해요. 첫 판만 6|6으로 열고, 이후 판은 직전 승자가 아무 타일이나 골라요.' : '아래는 내 손패, 중앙은 공개 줄이에요. 내 차례에 활성 타일을 눌러 선택해요. 첫 수는 배분된 패 중 가장 높은 더블, 없으면 합이 가장 큰 패예요.', lisbeth ? 'Abajo está tu mano; en el centro, la cadena pública. En tu turno pulsa una ficha disponible. Solo la primera mano abre con el 6|6; luego, quien ganó la mano anterior elige cualquier ficha.' : 'Abajo está tu mano; en el centro, la cadena pública. En tu turno pulsa una ficha disponible. Abre el doble más alto repartido; si no hay dobles, la ficha de mayor suma.')}</p>
      </li>
      <li>
        <figure className="quick-guide-image" aria-label={copy(language, '열린 5와 선택 타일 5|4가 맞는 예시', 'El 5 abierto coincide con la ficha 5|4')}>
          <span className="quick-guide-example-chain">
            <DominoTile left={2} right={5} label="2|5"/>
            <DominoTile left={5} right={4} label="5|4"/>
          </span>
        </figure>
        <h3>{copy(language, '같은 숫자 끝 고르기', 'Une los extremos')}</h3>
        <p>{copy(language, '같은 숫자가 맞는 열린 끝을 고르세요. 미리보기에서 놓이는 방향과 새 끝 숫자를 확인해요.', 'Une el mismo número por cualquiera de los extremos. La vista previa muestra la orientación y el número abierto.')}</p>
      </li>
      <li>
        <figure className="quick-guide-image" aria-label={copy(language, '5를 맞춰 놓아 열린 끝이 2와 4인 예시', 'Ejemplo: se unen los 5 y quedan abiertos el 2 y el 4')}>
          <span className="quick-guide-example-chain">
            <DominoTile left={2} right={5} label="2|5"/>
            <DominoTile left={5} right={4} label="5|4"/>
          </span>
          <span className="quick-guide-confirm-mark" aria-hidden="true">✓</span>
        </figure>
        <h3>{copy(language, '놓기 확정하기', 'Confirma')}</h3>
        <p>{copy(language, '타일을 고른 뒤 빛나는 왼쪽/오른쪽 끝을 누르면 확정돼요. 첫 수는 손패 선택 뒤 중앙의 ‘시작 타일 X|Y 놓기’를 눌러요. 놓기 전에는 Esc로 선택을 취소할 수 있어요.', 'Tras elegir la ficha, pulsa el extremo izquierdo o derecho iluminado para confirmar. Al abrir, pulsa «Jugar ficha inicial X|Y» en el centro. Antes de jugar, Esc cancela la selección.')}</p>
      </li>
    </ol>
    {lisbeth ? lisbethTip.map((text, index) => <p className="quick-guide-tip" key={index}>{text}</p>) : <p className="quick-guide-tip">{copy(language, '패는 뽑지 않아요. 놓을 타일이 없으면 패스해요. 1대1은 2번, 4인 팀전은 4번 연속 패스하면 막혀요. 기본은 팀에 남은 숫자의 합이 낮은 편이 이겨요. 설정에 따라 판정이 달라질 수 있고, 동점은 무승부예요.', 'No se roban fichas: pasa si no puedes jugar. Hay tranque tras 2 pases seguidos en uno contra uno o 4 en equipos. Por defecto, gana el equipo con menor suma de puntos restantes; los ajustes pueden cambiarlo. Si empatan, quedan tablas.')}</p>}
  </div>;
}
