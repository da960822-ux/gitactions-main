import type { Language } from '../core/types';
import { JaipurBonusArt, JaipurCamelAward, JaipurCoin, JaipurGoodArt } from './JaipurArt';

export function JaipurQuickGuide({ language }: { language: Language }) {
  const es = language === 'es';

  return <div className="quick-guide" lang={language}>
    <p className="quick-guide-goal">{es ? 'Objetivo: gana 2 rondas para ganar la partida; se juegan hasta 3.' : '목표: 최대 3라운드에서 먼저 2승을 해요.'}</p>
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
        <p>{es ? 'En cada turno elige una acción: toma 1 mercancía del mercado o todos los camellos del mercado, intercambia de 2 a 5 mercancías por la misma cantidad, o vende. Para intercambiar, selecciona mercancías de tu mano y del mercado y confirma.' : '차례마다 하나만 해요: 시장 상품 1장이나 낙타 전부 가져오기, 상품 2–5장씩 같은 수로 교환하기, 또는 판매하기. 교환은 손패와 시장에서 상품을 골라 확정해요.'}</p>
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
    <p className="quick-guide-tip">{es ? 'Suma los puntos de mercancías y bonos; quien tenga más camellos añade 5 puntos para decidir la ronda.' : '상품·보너스 점수를 더하고, 낙타가 더 많으면 5점을 더해 라운드 승자를 정해요.'}</p>
  </div>;
}
