import art from '../../public/images/splendor/card-map.json';
import type { Language } from '../core/types';
import { SplendorGem } from './SplendorGem';

const exampleCard = art.cards.find(card => card.engineId === 't1-01')!;
const exampleNoble = art.nobles.find(noble => noble.engineId === 'n0')!;

export function SplendorQuickGuide({ language }: { language: Language }) {
  const text = (ko: string, es: string) => language === 'ko' ? ko : es;

  return <div className="quick-guide">
    <p className="quick-guide-goal">{text('목표: 카드와 귀족으로 15점을 얻으세요.','Objetivo: llega a 15 puntos.')}</p>
    <p>{text('화면: 중앙은 살 카드, 은행은 가져올 보석, 내 보관함은 토큰·영구 보너스예요.', 'La mesa muestra cartas para comprar; el banco, gemas disponibles; tu zona, fichas y bonificaciones.')}</p>
    <ol className="quick-guide-steps">
      <li>
        <figure className="quick-guide-image">
          <div className="quick-guide-gems" aria-hidden="true">
            {['white','blue','green'].map(gem => <SplendorGem key={gem} gem={gem}/>)}
            <span aria-hidden="true">·</span><SplendorGem gem="white"/><SplendorGem gem="white"/>
          </div>
          <figcaption>{text('다른 색 3개 · 같은 색 2개','3 distintos · 2 iguales')}</figcaption>
        </figure>
        <h3>{text('보석 모으기','Toma gemas')}</h3>
        <p>{text('첫 수 예: 은행의 흰색·파랑·초록을 한 번씩 누른 뒤 ‘보석 가져오기’로 확정해요. 서로 다른 색 3개(은행에 색이 부족하면 가능한 색을 모두), 또는 은행에 4개 이상 남은 같은 색 2개를 가져와요. 금 포함 10개가 한도라, 넘으면 돌려줄 토큰을 골라요.','Primera acción: pulsa blanco, azul y verde en el banco y confirma con «Tomar gemas». Toma 3 colores distintos (o todos los disponibles si hay menos) o 2 iguales si quedan 4 o más. El límite es 10 fichas, incluido el oro; si lo superas, elige cuáles devolver.')}</p>
      </li>
      <li>
        <figure className="quick-guide-image">
          <img src={`/images/splendor/${exampleCard.src}`} alt={text('1단계 1점 카드: 초록 보석 4개 비용, 흰색 보너스 +1','Carta de nivel 1 de 1 punto: cuesta 4 gemas verdes y da +1 blanco')}/>
          <figcaption>{text('초록 4 → 흰색 보너스 +1 · 1점','4 verdes → blanca +1 · 1 punto')}</figcaption>
        </figure>
        <h3>{text('카드 구매 또는 예약','Compra o reserva una carta')}</h3>
        <p>{text('같은 색 영구 보너스를 비용에서 빼고, 남은 값은 토큰이나 금(아무 색 대용)으로 내요. 카드를 누르면 비용 확인창이 나와요. ‘구매 확정’ 또는 ‘예약 확정’을 눌러요. 구매하면 그 카드의 보너스를 얻어요; 예약은 최대 3장, 은행에 금이 남아 있으면 금 1개를 받아요.','Resta del coste las bonificaciones permanentes de ese color; paga lo restante con fichas o con oro (comodín). Pulsa una carta para revisar el pago; después «Confirmar compra» o «Confirmar reserva». Al comprar ganas la bonificación de la carta; al reservar, recibes 1 oro si queda en el banco y puedes tener hasta 3 reservadas.')}</p>
      </li>
      <li>
        <figure className="quick-guide-image">
          <img src={`/images/splendor/${exampleNoble.src}`} alt={text('흰색 4개와 파랑 4개 보너스로 방문하는 귀족','Noble que requiere 4 bonificaciones blancas y 4 azules')}/>
          <figcaption className="quick-guide-gems" aria-hidden="true"><SplendorGem gem="white"/> 4 + <SplendorGem gem="blue"/> 4 → 3 {text('점','pts')}</figcaption>
        </figure>
        <h3>{text('귀족과 마지막 차례','Nobles y final')}</h3>
        <p>{text('카드 보너스만으로 귀족 조건을 맞추면 3점을 얻고, 여러 명이면 하나를 골라요. 누군가 15점에 도달하면 서로 같은 수의 차례를 마치고, 점수가 높은 쪽이 이겨요. 동점이면 개발 카드가 적은 쪽, 그마저 같으면 무승부예요.','Los nobles cuentan solo bonificaciones de cartas: dan 3 puntos y, si calificas para varios, eliges uno. Al llegar a 15, ambos completan el mismo número de turnos; gana quien tenga más puntos. Si empatan, gana quien compró menos cartas; si también empatan en eso, quedan tablas.')}</p>
      </li>
    </ol>
    <p className="quick-guide-tip">{text('금은 직접 가져올 수 없어요. 보너스는 토큰이 아니에요. 이후 살 카드에서 해당 색 비용을 1 줄여요.','No se toma oro directamente. Las bonificaciones no son fichas; cada una resta 1 del coste futuro de ese color.')}</p>
  </div>;
}
