import { useId, useState } from 'react';
import type { CSSProperties } from 'react';
import type { GameAction, Language, PlayerId } from '../core/types';
import '../styles/marble-pawns.css';

export type MarblePawnId = 'fox' | 'cat' | 'penguin' | 'astronaut' | 'robot' | 'dragon';
type Copy = Record<Language, string>;

export const marblePawnCatalog: { id: MarblePawnId; name: Copy; color: string }[] = [
  { id: 'fox', name: { ko: '말티푸', es: 'Maltipoo' }, color: '#d3aa79' },
  { id: 'cat', name: { ko: '고양이', es: 'Gata' }, color: '#d88cbd' },
  { id: 'penguin', name: { ko: '판다', es: 'Panda' }, color: '#465559' },
  { id: 'astronaut', name: { ko: '우주비행사', es: 'Astronauta' }, color: '#55a99d' },
  { id: 'robot', name: { ko: '로봇', es: 'Robot' }, color: '#a58c70' },
  { id: 'dragon', name: { ko: '친칠라', es: 'Chinchilla' }, color: '#a7adb3' },
];

const copy = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;

export function MarblePawn({ pawn, language, label }: { pawn: MarblePawnId; language: Language; label?: string }) {
  const id = useId().replace(/:/g, '');
  const name = marblePawnCatalog.find(item => item.id === pawn)?.name[language] ?? pawn;
  const title = label ?? name;
  const g = (name: string) => `${id}-${name}`;

  return <svg className={`marble-pawn marble-pawn--${pawn}`} viewBox="0 0 120 150" role="img" aria-label={title} focusable="false">
    <defs>
      <linearGradient id={g('base')} x1="0" x2="1" y1="0" y2="1"><stop stopColor="#fff8ea"/><stop offset=".42" stopColor="#e7cfac"/><stop offset=".78" stopColor="#b99b73"/><stop offset="1" stopColor="#f5e5c8"/></linearGradient>
      <linearGradient id={g('metal')} x1="0" x2="1" y1="0" y2="1"><stop stopColor="#fff"/><stop offset=".38" stopColor="#e6d7be"/><stop offset=".72" stopColor="#9a7f5d"/><stop offset="1" stopColor="#f9edda"/></linearGradient>

      <linearGradient id={g('cat')} x1=".1" x2=".9" y1="0" y2="1"><stop stopColor="#f9c5e1"/><stop offset=".48" stopColor="#d98fbe"/><stop offset="1" stopColor="#8e4b82"/></linearGradient>
      <linearGradient id={g('astronaut')} x1=".1" x2=".9" y1="0" y2="1"><stop stopColor="#a7ece1"/><stop offset=".46" stopColor="#51b2a4"/><stop offset="1" stopColor="#26756f"/></linearGradient>
      <linearGradient id={g('robot')} x1=".1" x2=".9" y1="0" y2="1"><stop stopColor="#edd5b2"/><stop offset=".46" stopColor="#b59c7b"/><stop offset="1" stopColor="#6f5e4b"/></linearGradient>
      <linearGradient id={g('white')} x1=".2" x2=".8" y1="0" y2="1"><stop stopColor="#fffef8"/><stop offset="1" stopColor="#cbd9df"/></linearGradient>
      <linearGradient id={g('dark')} x1=".2" x2=".8" y1="0" y2="1"><stop stopColor="#53687a"/><stop offset="1" stopColor="#1d2c3b"/></linearGradient>
      <filter id={g('shadow')} x="-50%" y="-30%" width="200%" height="190%"><feGaussianBlur stdDeviation="4"/></filter>
    </defs>
    <ellipse cx="60" cy="137" rx="29" ry="7" fill="#1b1720" opacity=".23" filter={`url(#${g('shadow')})`}/>
    <ellipse cx="60" cy="131" rx="34" ry="11" fill="#987b59" opacity=".2"/>
    <path d="M25 122c0-8 15-14 35-14s35 6 35 14v8c0 8-15 14-35 14s-35-6-35-14z" fill={`url(#${g('base')})`} stroke="#9c805b" strokeWidth="1.3"/>
    <ellipse cx="60" cy="121" rx="35" ry="12" fill={`url(#${g('base')})`} stroke="#fff7e8" strokeWidth="1.4"/>
    <ellipse cx="60" cy="121" rx="29" ry="8" fill="none" stroke="#b69b77" strokeOpacity=".56"/>
    <PawnFigure pawn={pawn} id={id}/>

  </svg>;
}

function PawnFigure({ pawn, id }: { pawn: MarblePawnId; id: string }) {
  const f = (name: string) => `url(#${id}-${name})`;
  const ink = '#20343A';
  const eyes = <g fill={ink} stroke="none"><circle cx="47" cy="52" r="4"/><circle cx="72" cy="52" r="4"/></g>;
  if (pawn === 'fox') return <g stroke="#806449" strokeWidth="3" strokeLinejoin="round">
    <path d="M81 110q27-14 10-29" fill="none" stroke="#D8B78C" strokeWidth="12" strokeLinecap="round"/>
    <path d="M37 112V88q0-20 23-20t23 20v24Z" fill="#E8CDA7"/><ellipse cx="60" cy="97" rx="13" ry="17" fill="#FFF4DE"/>
    <path d="M35 35q-22-2-21 23t23 16m48-39q22-2 21 23T83 74" fill="#C6A175"/>
    <path d="M30 41q-6-12 8-15-2-14 13-10 9-12 20 0 16-4 14 10 14 3 8 15 7 9-2 16 2 20-31 25T29 58q-8-9 1-17Z" fill="#F2DEBE"/>
    {eyes}<ellipse cx="60" cy="65" rx="16" ry="12" fill="#FFF4DE"/><path d="m54 61 6 6 6-6Z" fill={ink} stroke="none"/><path d="M60 67v5m-9-2q9 8 18 0" fill="none" stroke={ink} strokeWidth="2"/>
  </g>;
  if (pawn === 'cat') return <g stroke="#75466E" strokeWidth="3" strokeLinejoin="round">
    <path d="M80 114q31 0 27-26-4-18-17-10" fill="none" stroke="#C579AB" strokeWidth="11" strokeLinecap="round"/>
    <path d="M38 113V89q0-19 22-19t22 19v24Z" fill={f('cat')}/><path d="M47 88h26v25H47Z" fill="#FFE6F1"/>
    <path d="m31 45 3-27 22 17h9l21-17 3 27v17q-2 22-29 22T31 62Z" fill={f('cat')}/>
    <path d="m40 53 13-3m14 0 13 3" fill="none" stroke={ink} strokeWidth="4" strokeLinecap="round"/>
    <path d="m54 62 6 5 6-5Z" fill={ink} stroke="none"/><path d="M26 61h16m36 0h16" stroke="#FFF1F8" strokeWidth="3"/>
  </g>;
  if (pawn === 'penguin') return <g stroke="#293B40" strokeWidth="3" strokeLinejoin="round">
    <ellipse cx="60" cy="94" rx="29" ry="29" fill={f('white')}/><path d="M33 78q27 10 54 0l-2 14q-25 10-50 0Z" fill={f('dark')}/>
    <path d="M36 81 23 101m61-20 13 20" stroke="#293B40" strokeWidth="14" strokeLinecap="round"/>
    <circle cx="35" cy="29" r="13" fill={f('dark')}/><circle cx="85" cy="29" r="13" fill={f('dark')}/>
    <ellipse cx="60" cy="52" rx="33" ry="31" fill={f('white')}/><ellipse cx="45" cy="51" rx="11" ry="15" transform="rotate(25 45 51)" fill={f('dark')}/><ellipse cx="75" cy="51" rx="11" ry="15" transform="rotate(-25 75 51)" fill={f('dark')}/>
    <circle cx="47" cy="50" r="3" fill="#FFF" stroke="none"/><circle cx="73" cy="50" r="3" fill="#FFF" stroke="none"/><path d="m54 64 6 5 6-5Z" fill={ink} stroke="none"/><path d="M60 69v5m-8-3q8 7 16 0" fill="none" strokeWidth="2"/>
    <ellipse cx="43" cy="116" rx="12" ry="8" fill={f('dark')}/><ellipse cx="77" cy="116" rx="12" ry="8" fill={f('dark')}/>
  </g>;
  if (pawn === 'astronaut') return <g stroke="#286F69" strokeWidth="3" strokeLinejoin="round">
    <rect x="27" y="68" width="66" height="38" rx="9" fill={f('astronaut')}/>
    <path d="M39 113V81h42v32Z" fill={f('white')}/><path d="M33 83 19 94m65-12 15-25" fill="none" stroke="#51B2A4" strokeWidth="12" strokeLinecap="round"/>
    <circle cx="60" cy="47" r="32" fill={f('white')}/><rect x="36" y="29" width="48" height="36" rx="15" fill="#203F53"/>
    <path d="M44 38q8-7 19-5" fill="none" stroke="#A7ECE1" strokeWidth="5" strokeLinecap="round"/>
    <rect x="49" y="84" width="22" height="18" rx="3" fill={f('astronaut')}/><path d="M46 113v9m28-9v9" stroke="#26756F" strokeWidth="13"/>
  </g>;
  if (pawn === 'robot') return <g stroke="#746048" strokeWidth="3" strokeLinejoin="round">
    <path d="M60 22V12"/><circle cx="60" cy="9" r="6" fill="#58C7B0"/>
    <path d="M30 83H20v20h12m58-20h10v20H88" fill={f('robot')}/><rect x="36" y="75" width="48" height="39" rx="4" fill={f('robot')}/>
    <rect x="26" y="23" width="68" height="48" rx="7" fill={f('metal')}/><rect x="34" y="33" width="52" height="27" rx="4" fill="#20343A"/>
    <circle cx="47" cy="45" r="5" fill="#58C7B0" stroke="none"/><circle cx="73" cy="45" r="5" fill="#F6A549" stroke="none"/>
    <path d="M49 91h22m-22 10h13" stroke="#20343A" strokeWidth="4"/><path d="M43 114v9m34-9v9" stroke="#746048" strokeWidth="12"/>
  </g>;
  return <g stroke="#59656F" strokeWidth="3" strokeLinejoin="round">
    <path d="M82 109q30-16 15-35" fill="none" stroke="#A5ABB3" strokeWidth="14" strokeLinecap="round"/>
    <ellipse cx="60" cy="96" rx="28" ry="28" fill="#ABB3BD"/><ellipse cx="60" cy="98" rx="17" ry="23" fill="#E8EBED"/>
    <ellipse cx="33" cy="29" rx="15" ry="24" transform="rotate(-18 33 29)" fill="#B7BEC5"/><ellipse cx="87" cy="29" rx="15" ry="24" transform="rotate(18 87 29)" fill="#B7BEC5"/>
    <ellipse cx="33" cy="28" rx="8" ry="16" fill="#D9BABD" stroke="none"/><ellipse cx="87" cy="28" rx="8" ry="16" fill="#D9BABD" stroke="none"/>
    <ellipse cx="60" cy="57" rx="34" ry="28" fill="#C5CAD0"/>{eyes}<ellipse cx="60" cy="67" rx="16" ry="11" fill="#EEF0F2"/><path d="m55 63 5 5 5-5Z" fill="#A27F84" stroke="none"/>
    <path d="M23 64h18m-17 9 17-4m38-5h18m-18 5 17 4" stroke="#59656F" strokeWidth="2"/><ellipse cx="42" cy="118" rx="11" ry="6" fill="#B7BEC5"/><ellipse cx="78" cy="118" rx="11" ry="6" fill="#B7BEC5"/>
  </g>;
}

export type MarblePawnChoice = { action: GameAction };
export function MarblePawnPicker({
  view, playerId, language, runAction,
}: {
  view: any;
  playerId: PlayerId;
  language: Language;
  runAction: (action: GameAction) => void | Promise<unknown>;
}) {
  const [pending, setPending] = useState<MarblePawnId | null>(null);
  const [failed, setFailed] = useState(false);
  const validChoices = new Map<MarblePawnId, MarblePawnChoice>();
  const choices = Array.isArray(view?.actions) ? view.actions as MarblePawnChoice[] : [];
  const selectedPawn = view?.board?.pawns?.[playerId] as string | undefined;
  for (const choice of choices) {
    const pawn = choice.action?.type === 'choose-pawn' ? choice.action.payload?.pawn : null;
    if (typeof pawn === 'string' && marblePawnCatalog.some(item => item.id === pawn)) validChoices.set(pawn as MarblePawnId, choice);
  }
  if (!validChoices.size) return null;

  const choose = async (pawn: MarblePawnId) => {
    const choice = validChoices.get(pawn);
    if (!choice || pending) return;
    setPending(pawn);
    setFailed(false);
    try {
      if (await runAction(choice.action) === false) setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setPending(null);
    }
  };

  return <section className="marble-pawn-picker" aria-labelledby="marble-pawn-title">
    <header className="marble-pawn-picker__head">
      <div><h3 id="marble-pawn-title">{copy(language, '어떤 말로 출발할까요?', '¿Con qué ficha quieres jugar?')}</h3></div>
      <span className="marble-pawn-picker__hint">{copy(language, '두 사람은 서로 다른 말을 사용해요.', 'Cada persona usa una ficha diferente.')}</span>
    </header>
    <div className="marble-pawn-picker__grid">
      {marblePawnCatalog.map(({ id, name, color }) => {
        const choice = validChoices.get(id);
        const isSelected = selectedPawn === id;
        const isPending = pending === id;
        const isTaken = view?.board?.pawns?.[playerId === 'p1' ? 'p2' : 'p1'] === id;
        return <button className={`marble-pawn-choice${isSelected ? ' is-selected' : ''}${isPending ? ' is-pending' : ''}`} style={{ '--pawn-color': color } as CSSProperties} type="button" key={id} disabled={!choice || pending !== null} aria-pressed={isSelected} onClick={() => void choose(id)}>
          <span className="marble-pawn-choice__art"><MarblePawn pawn={id} language={language}/></span>
          <span className="marble-pawn-choice__name">{name[language]}</span>
          <span className="marble-pawn-choice__state">{isPending ? copy(language, '선택 중…', 'Eligiendo…') : isSelected ? copy(language, '내 말', 'Tu ficha') : isTaken ? copy(language, '상대 말', 'De tu pareja') : choice ? copy(language, '선택', 'Elegir') : copy(language, '선택 불가', 'No disponible')}</span>
        </button>;
      })}
    </div>
    {failed && <p className="marble-pawn-picker__error" role="status">{copy(language, '말을 바꾸지 못했어요. 다시 선택해 주세요.', 'No se pudo cambiar la ficha. Inténtalo de nuevo.')}</p>}
  </section>;
}
