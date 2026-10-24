import type { SharedEventRound, SharedEventSeat } from '../../core/sharedEventsState';
import { approvedPawns, pawnSource } from './LocalEventRig';
import './shared-events-outcome.css';

type Props = {
  round: SharedEventRound;
  seat: SharedEventSeat;
  language: 'ko' | 'es';
  animate: boolean;
};

const words = {
  ko: { you: '나', other: '상대', sender: '보내는 쪽', recipient: '받는 쪽', sent: '장식 말이 상대에게 도착했어.', waiting: '두 사람이 확인하면 이 길로 보내.', joined: '반쪽씩 그렸는데, 같이 보니 한 장이네 ♡', halves: '각자 그린 반쪽 · 함께 확인하면 접어서 합쳐.', left: '왼쪽 반쪽', right: '오른쪽 반쪽' },
  es: { you: 'Yo', other: 'La otra persona', sender: 'Envía', recipient: 'Recibe', sent: 'La figura llegó a la otra persona.', waiting: 'Cuando ambos confirmen, la figura irá por este camino.', joined: 'Una mitad de cada uno, una tarjeta de los dos ♡', halves: 'Una mitad de cada persona. Al confirmar, se pliegan para unirse.', left: 'Mitad izquierda', right: 'Mitad derecha' },
};

export default function SharedEventsOutcome({ round, seat, language, animate }: Props) {
  const t = words[language];
  const complete = round.status === 'started';
  const playing = complete && animate;
  if (round.eventId === 'R02') {
    const sender: SharedEventSeat = round.intentBy.p1 ? 'p1' : 'p2';
    const intent = round.intentBy[sender];
    const pawnIndex = approvedPawns.findIndex(pawn => pawn.id === (intent && 'decorId' in intent ? intent.decorId : ''));
    if (pawnIndex < 0) return null;
    const pawn = approvedPawns[pawnIndex];
    return <figure className={`shared-outcome shared-delivery ${complete ? 'is-complete' : ''} ${playing ? 'is-playing' : ''}`} aria-label={`${pawn[language]} · ${complete ? t.sent : t.waiting}`}>
      <div className="shared-delivery-labels" aria-hidden="true"><span><b>{sender === seat ? t.you : t.other}</b>{t.sender}</span><span><b>{sender === seat ? t.other : t.you}</b>{t.recipient}</span></div>
      <div className="shared-delivery-stage" aria-hidden="true">
        <svg className="shared-paper-lane" viewBox="0 0 600 80" preserveAspectRatio="none">
          <ellipse cx="47" cy="57" rx="44" ry="11" className="shared-station"/><ellipse cx="553" cy="57" rx="44" ry="11" className="shared-station"/>
          <path d="M47 43 170 13 170 33 47 63Z" fill="#ad8674"/><path d="m170 13 130 30v20L170 33Z" fill="#72504d"/><path d="m300 43 130-30v20L300 63Z" fill="#ad8674"/><path d="m430 13 123 30v20L430 33Z" fill="#72504d"/>
          <path d="M47 43 170 13 300 43 430 13 553 43M170 13v20m130 10v20m130-50v20" className="shared-paper-creases"/>
          <path d="M47 63 170 33 300 63 430 33 553 63" className="shared-paper-edge"/>
        </svg>
        <div className="shared-delivery-carrier"><div className="shared-delivery-standee"><img src={pawnSource(pawnIndex)} alt=""/><span className="shared-standee-foot"/></div></div>
      </div>
      <figcaption>{complete ? t.sent : t.waiting}</figcaption>
    </figure>;
  }
  if (round.eventId !== 'R03' || !round.intentBy.p1 || !round.intentBy.p2) return null;
  return <figure className={`shared-outcome shared-card-outcome ${complete ? 'is-complete' : ''} ${playing ? 'is-playing' : ''}`} aria-label={complete ? t.joined : t.halves}>
    <div className="shared-card-authors">{(['p1', 'p2'] as const).map((author, index) => <span key={author}><b>{author === seat ? t.you : t.other}</b>{index === 0 ? t.left : t.right}</span>)}</div>
    <div className="shared-fold-card">
      {(['p1', 'p2'] as const).map(author => {
        const intent = round.intentBy[author];
        const points = intent && 'points' in intent ? intent.points : [];
        return <div className={`shared-card-leaf shared-card-leaf-${author}`} key={author}>
          <svg viewBox="0 0 100 100" role="img" aria-label={`${author === seat ? t.you : t.other} · ${author === 'p1' ? t.left : t.right}`}>
            <path className="shared-card-rule" d={author === 'p1' ? 'M9 9H100M9 91H100M9 9V91' : 'M0 9H91V91H0'}/>
            {points.length > 1 && <polyline points={points.map(point => `${12 + point.x * 76},${12 + point.y * 76}`).join(' ')}/>}
            {points.length === 1 && <circle cx={12 + points[0].x * 76} cy={12 + points[0].y * 76} r="1.6"/>}
          </svg>
          <span className="shared-card-fold-shade" aria-hidden="true"/>
        </div>;
      })}
      <span className="shared-card-seam" aria-hidden="true"/>
    </div>
    <figcaption>{complete ? t.joined : t.halves}</figcaption>
  </figure>;
}
