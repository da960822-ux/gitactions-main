import type { Language } from '../core/types';
import { JaipurBonusArt, JaipurCamelAward, JaipurCoin, JaipurGoodArt } from './JaipurArt';

export function JaipurQuickGuide({ language }: { language: Language }) {
  const es = language === 'es';

  return <div className="quick-guide" lang={language}>
    <p className="quick-guide-goal">{es ? 'Objetivo: gana 2 rondas para ganar la partida; se juegan hasta 3.' : '목표: 최대 3라운드에서 먼저 2승을 해요.'}</p>
    <p>{es ? 'El mercado del centro es público. Abajo están tu mano y tu manada; las cartas rivales siguen ocultas. Las fichas de mercancía son la recompensa por vender.' : '중앙 시장은 누구나 보는 카드예요. 아래는 내 손패와 낙타 무리이고, 상대 손패는 숨겨져요. 상품 토큰은 판매하면 받는 점수예요.'}</p>
    <ol className="quick-guide-steps">
      <li>
        <figure className="quick-guide-image">
          <div className="quick-guide-image-row quick-guide-actions-row" aria-hidden="true">
            <span className="quick-guide-example-chain">
              <JaipurGoodArt good="cloth" language={language} decorative className="quick-guide-exchange-card"/>
              <JaipurGoodArt good="spice" language={language} decorative className="quick-guide-exchange-card"/>
              <span aria-hidden="true">↔</span>
              <JaipurGoodArt good="leather" language={language} decorative className="quick-guide-exchange-card"/>
              <JaipurGoodArt good="diamond" language={language} decorative className="quick-guide-exchange-card"/>
            </span>
          </div>
          <figcaption>{es ? 'Cambia la misma cantidad: 2↔2' : '같은 수로 교환: 2↔2'}</figcaption>
        </figure>
        <h3>{es ? 'Una acción por turno' : '차례마다 행동 하나'}</h3>
        <p>{es ? 'En cada turno elige una acción: toma 1 mercancía del mercado o todos los camellos del mercado, intercambia de 2 a 5 mercancías por la misma cantidad, o vende. Primera acción: en «Tomar», pulsa una tela del mercado y luego «Tomar: tela» para confirmar. Para cambiar, pulsa «Intercambiar», selecciona igual cantidad en mano y mercado, y pulsa «Cambiar N cartas». Puedes cancelar antes de confirmar.' : '차례마다 하나만 해요: 시장 상품 1장이나 낙타 전부 가져오기, 상품 2–5장씩 같은 수로 교환하기, 또는 판매하기. 첫 수 예: ‘가져오기’에서 시장의 옷감 1장을 누른 뒤 나타난 ‘가져오기: 옷감’을 눌러 확정해요. 교환은 ‘교환’을 누르고 손패·시장에서 같은 수를 골라 ‘N장 교환’으로 확정해요. 확정 전에는 ‘취소’할 수 있어요.'}</p>
      </li>
      <li>
        <figure className="quick-guide-image">
          <div className="quick-guide-image-row quick-guide-sale-row" aria-hidden="true">
            <JaipurGoodArt good="leather" language={language} decorative className="quick-guide-sale-card"/>
            <JaipurGoodArt good="leather" language={language} decorative className="quick-guide-sale-card"/>
            <JaipurGoodArt good="leather" language={language} decorative className="quick-guide-sale-card"/>
            <span aria-hidden="true">→</span>
            <JaipurCoin good="leather" language={language}/>
            <JaipurBonusArt count={1} language={language}/>
          </div>
          <figcaption>{es ? '3 iguales → ficha + posible bono oculto' : '같은 상품 3장 → 토큰 + 보너스 가능(값 비공개)'}</figcaption>
        </figure>
        <h3>{es ? 'Vende un tipo de mercancía' : '같은 상품을 팔아요'}</h3>
        <p>{es ? 'En Vender, elige el tipo y ajusta la cantidad con −/+; luego confirma. Se venden mínimo 2 de diamantes, oro o plata, y 1 de los demás; con 3 o más puedes obtener una ficha de bonificación si queda alguna (su valor se revela al recibirla).' : '판매에서 상품 종류와 수량(−/+)을 골라 확정해요. 다이아몬드·금·은은 2장 이상, 나머지는 1장 이상 팔 수 있고 3장 이상은 남은 보너스를 받을 수 있어요(값은 받을 때 공개).'}</p>
      </li>
      <li>
        <figure className="quick-guide-image">
          <div className="quick-guide-image-row quick-guide-hand-row" aria-hidden="true">
            <JaipurGoodArt good="cloth" language={language} decorative className="quick-guide-hand-card"/>
            <span className="quick-guide-count" aria-hidden="true">7</span>
            <JaipurGoodArt good="camel" language={language} decorative className="quick-guide-hand-camel"/>
            <JaipurCamelAward language={language} aria-hidden="true"/>
          </div>
          <figcaption>{es ? 'Máximo 7 cartas · camellos aparte' : '손패 최대 7장 · 낙타는 별도'}</figcaption>
        </figure>
        <h3>{es ? 'Separa tu mano y tu manada' : '손패와 낙타 무리는 따로'}</h3>
        <p>{es ? 'Tu mano admite hasta 7 cartas. Los camellos van aparte y no cuentan para ese límite.' : '손패에는 최대 7장까지 둘 수 있어요. 낙타는 무리에 따로 모으며 손패 수에 포함하지 않아요.'}</p>
      </li>
    </ol>
    <p className="quick-guide-tip">{es ? 'La ronda termina al vaciar 3 tipos de fichas de mercancía o al agotarse el mazo. Suma mercancías, bonos y 5 puntos para la manada mayor. La siguiente ronda empieza sola; con 2 victorias termina la partida. Tras la tercera ronda, gana quien tenga más victorias; si empatan, quedan tablas. No intercambies camellos.' : '상품 토큰 세 종류가 비거나 덱이 비면 라운드가 끝나요. 상품·보너스와 낙타 다수 보너스 5점을 합산해요. 다음 라운드는 자동 시작, 먼저 2승이면 경기 종료예요. 3라운드 뒤에는 승수가 높은 쪽이 이기며, 같으면 무승부예요. 낙타는 교환할 수 없어요.'}</p>
  </div>;
}
