import type { Language } from '../core/types';
import { DominoTile } from './DominoTile';

const copy = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;

export function DominoQuickGuide({ language, rulesVersion, mode }: { language: Language; rulesVersion?: number; mode?: string }) {
  const lisbeth = rulesVersion === 2;
  const fourSeatRule = mode === 'partners' ? (language === 'ko' ? '두 팀은 번갈아 앉아요. ' : 'Los equipos se sientan alternados. ') : '';
  const openingPassRule = language === 'ko'
    ? mode === '1v1' ? '1대1은 첫 타일 다음 사람이 첫 차례에 패스하면 시작 타일이 더블일 때 +30, 비더블일 때 +60을 받아요.' : '4인전은 첫 타일 다음 사람이 패스하고 세 번째 자리가 놓아야 시작 타일이 더블이면 +30, 비더블이면 +60을 받아요. 세 번째 자리도 패스하면 보너스가 없어요.'
    : mode === '1v1' ? 'En uno contra uno, si pasa quien sigue a la apertura en su primer turno, recibe +30 si la ficha inicial fue doble o +60 si no lo fue.' : 'Con cuatro asientos, si pasa quien sigue a la apertura y juega el tercer asiento, reciben +30 si la ficha inicial fue doble o +60 si no lo fue. Si también pasa el tercer asiento, no hay bono.';
  const lisbethTip = language === 'ko'
    ? `Lisbeth · 카피쿠아 +30: 마지막 비더블 타일이 서로 다른 양쪽 끝에 모두 맞으면 모든 손패의 남은 점수 합을 더해요. ${openingPassRule} 보너스는 라운드 정산 때 더해요. ${fourSeatRule}양쪽 열린 끝 숫자에 각각 맞는 서로 다른 타일 7개가 모두 놓이면 즉시 막혀요${mode === '1v1' ? ' · 둘 다 놓을 수 없으면 연속 두 번 패스해 막혀요' : ''}. 트랑케는 막은 사람과 다음 자리의 손패만 비교해 승자를 정하고, 동점이면 막은 사람이 이겨요. 정산에는 승자와 팀원을 포함한 모든 손패 점수를 세요. 파소 코리도는 없어요.`
    : `Lisbeth · capicúa +30: si tu última ficha, sin ser doble, servía en los dos extremos distintos, suma los puntos restantes de todas las manos. ${openingPassRule} Los bonos se suman al cerrar la mano. ${fourSeatRule}La mano se bloquea cuando se juegan las 7 fichas distintas que coinciden con cada número abierto${mode === '1v1' ? ' · si nadie puede jugar, dos pases seguidos la bloquean' : ''}. El tranque compara solo a quien cerró la mano con el asiento siguiente; en empate gana quien la cerró. Para puntuar se cuentan todas las manos, incluidas las de quien ganó y su pareja. No hay paso corrido.`;
  return <div className="quick-guide">
    <p className="quick-guide-goal">{copy(language, lisbeth ? '목표 · 100점 또는 200점까지 경기해요. 첫 판은 6|6으로 열고, 다음 판부터는 직전 승자가 손패의 타일 아무거나 놓아 시작해요.' : '목표 · 한 판은 손패를 먼저 비우면 우리 편이 이겨요. 4인전은 두 명씩 한 팀이에요. 누적 경기는 설정한 100·200점에 먼저 도달해야 끝나요.', lisbeth ? 'Objetivo: jueguen a 100 o 200 puntos. La primera mano abre con el 6|6; después, quien ganó la mano anterior abre con cualquier ficha de su mano.' : 'Objetivo: vacía tu mano para ganar la ronda. Con cuatro jugadores, juegan en parejas. En un partido por puntos, llega a la meta elegida de 100 o 200.')}</p>
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
    <p className="quick-guide-tip">{lisbeth ? lisbethTip : copy(language, '패는 뽑지 않아요. 놓을 타일이 없으면 패스해요. 1대1은 2번, 4인 팀전은 4번 연속 패스하면 막혀요. 기본은 팀에 남은 숫자의 합이 낮은 편이 이겨요. 설정에 따라 판정이 달라질 수 있고, 동점은 무승부예요.', 'No se roban fichas: pasa si no puedes jugar. Hay tranque tras 2 pases seguidos en uno contra uno o 4 en equipos. Por defecto, gana el equipo con menor suma de puntos restantes; los ajustes pueden cambiarlo. Si empatan, quedan tablas.')}</p>
  </div>;
}
