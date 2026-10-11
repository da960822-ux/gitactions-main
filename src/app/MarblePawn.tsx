import { useId, useState } from 'react';
import type { CSSProperties } from 'react';
import type { GameAction, Language, PlayerId } from '../core/types';
import '../styles/marble-pawns.css';

export type MarblePawnId = 'fox' | 'cat' | 'penguin' | 'astronaut' | 'robot' | 'dragon';
type Copy = Record<Language, string>;

export const marblePawnCatalog: { id: MarblePawnId; name: Copy; color: string }[] = [
  { id: 'fox', name: { ko: '여우', es: 'Zorro' }, color: '#e66e43' },
  { id: 'cat', name: { ko: '고양이', es: 'Gata' }, color: '#d88cbd' },
  { id: 'penguin', name: { ko: '펭귄', es: 'Pingüino' }, color: '#5575b8' },
  { id: 'astronaut', name: { ko: '우주비행사', es: 'Astronauta' }, color: '#55a99d' },
  { id: 'robot', name: { ko: '로봇', es: 'Robot' }, color: '#a58c70' },
  { id: 'dragon', name: { ko: '용', es: 'Dragón' }, color: '#78a65c' },
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
      <radialGradient id={g('shine')} cx="30%" cy="18%" r="82%"><stop stopColor="#fff" stopOpacity=".92"/><stop offset=".28" stopColor="#fff" stopOpacity=".28"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></radialGradient>
      <linearGradient id={g('fox')} x1=".15" x2=".88" y1="0" y2="1"><stop stopColor="#ffb56e"/><stop offset=".5" stopColor="#eb713e"/><stop offset="1" stopColor="#a93625"/></linearGradient>
      <linearGradient id={g('cat')} x1=".1" x2=".9" y1="0" y2="1"><stop stopColor="#f9c5e1"/><stop offset=".48" stopColor="#d98fbe"/><stop offset="1" stopColor="#8e4b82"/></linearGradient>
      <linearGradient id={g('penguin')} x1=".1" x2=".9" y1="0" y2="1"><stop stopColor="#91b7f4"/><stop offset=".48" stopColor="#526fae"/><stop offset="1" stopColor="#283b6e"/></linearGradient>
      <linearGradient id={g('astronaut')} x1=".1" x2=".9" y1="0" y2="1"><stop stopColor="#a7ece1"/><stop offset=".46" stopColor="#51b2a4"/><stop offset="1" stopColor="#26756f"/></linearGradient>
      <linearGradient id={g('robot')} x1=".1" x2=".9" y1="0" y2="1"><stop stopColor="#edd5b2"/><stop offset=".46" stopColor="#b59c7b"/><stop offset="1" stopColor="#6f5e4b"/></linearGradient>
      <linearGradient id={g('dragon')} x1=".1" x2=".9" y1="0" y2="1"><stop stopColor="#c2e78d"/><stop offset=".46" stopColor="#78a94e"/><stop offset="1" stopColor="#3f6f3a"/></linearGradient>
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
    <path d="M41 31c-5 11-7 23-6 37 1 23 6 41 18 48 6 4 13 4 19 0 12-7 16-27 14-48-1-17-7-32-17-40-8-6-21-6-28 3z" fill={`url(#${g('shine')})`} opacity=".33" pointerEvents="none"/>
  </svg>;
}

function PawnFigure({ pawn, id }: { pawn: MarblePawnId; id: string }) {
  const f = (name: string) => `url(#${id}-${name})`;
  const ink = '#43332f';
  if (pawn === 'fox') return <g stroke="#8a3f2b" strokeWidth="1.5" strokeLinejoin="round">
    <path d="M39 73c-7 2-11 13-7 21 4 7 11 4 14-2M81 73c7 2 11 13 7 21-4 7-11 4-14-2" fill={f('fox')}/>
    <path d="M39 100c0-20 9-33 21-33s21 13 21 33v14c-12 9-30 9-42 0z" fill={f('fox')}/>
    <path d="M49 82c5-5 17-5 22 0v27c-7 5-15 5-22 0z" fill="#ffe6bd" stroke="#d98e56"/>
    <path d="M35 52 30 20l22 17M85 52l5-32-22 17" fill={f('fox')}/><path d="m36 44-2-14 11 10m39 4 2-14-11 10" fill="#f8c0a0" stroke="none"/>
    <path d="M34 50c0-17 11-28 26-28s26 11 26 28c0 17-11 27-26 27S34 67 34 50z" fill={f('fox')}/>
    <path d="M40 57c4 13 12 19 20 19s16-6 20-19c-6-5-12-7-20-7s-14 2-20 7z" fill="#fff1dc" stroke="#dfaa80"/>
    <ellipse cx="49" cy="49" rx="2.6" ry="3.6" fill={ink} stroke="none"/><ellipse cx="71" cy="49" rx="2.6" ry="3.6" fill={ink} stroke="none"/><path d="m57 57 3 2 3-2-3-3z" fill="#653f3a" stroke="none"/><path d="M60 59v4m0 0-4 2m4-2 4 2" fill="none" stroke="#7a4b43" strokeWidth="1.2"/>
    <path d="M43 30c5-7 12-10 20-9" fill="none" stroke="#fff4df" strokeWidth="3" strokeLinecap="round" opacity=".6"/>
  </g>;
  if (pawn === 'cat') return <g stroke="#75466e" strokeWidth="1.5" strokeLinejoin="round">
    <path d="M39 73c-11 0-15 13-10 23 4 8 14 6 17-2M80 73c11 0 15 13 10 23-4 8-14 6-17-2" fill={f('cat')}/>
    <path d="M39 105c0-20 9-31 21-31s21 11 21 31v9c-11 8-31 8-42 0z" fill={f('cat')}/><path d="M51 86c5-4 13-4 18 0v25c-5 4-13 4-18 0z" fill="#ffe6f1" stroke="#ca86b2"/>
    <path d="M36 48 35 18l24 18M84 48l1-30-24 18" fill={f('cat')}/><path d="m40 40-1-13 12 10m29 3 1-13-12 10" fill="#f3a9cf" stroke="none"/>
    <path d="M34 51c0-17 11-28 26-28s26 11 26 28c0 16-11 27-26 27S34 67 34 51z" fill={f('cat')}/>
    <path d="M45 59c5-4 10-5 15-5s10 1 15 5c-3 9-9 14-15 14s-12-5-15-14z" fill="#fff0f5" stroke="#c782ad"/>
    <path d="M47 49c1-3 4-4 6-1m14 0c1-3 4-4 6-1" fill="none" stroke={ink} strokeWidth="2.5" strokeLinecap="round"/><path d="m57 59 3 2 3-2-3-3z" fill="#a65588" stroke="none"/><path d="M60 61v3m0 0-4 2m4-2 4 2M42 61l-11-2m11 6-12 2m49-6 11-2m-11 8 12 1" fill="none" stroke="#fff1f8" strokeWidth="1.4"/>
    <path d="M41 31c5-7 12-10 20-9" fill="none" stroke="#fff5fb" strokeWidth="3" strokeLinecap="round" opacity=".7"/>
  </g>;
  if (pawn === 'penguin') return <g stroke="#293f6f" strokeWidth="1.5" strokeLinejoin="round">
    <path d="M42 76c-14 3-20 14-16 27 3 8 10 10 18 5M78 76c14 3 20 14 16 27-3 8-10 10-18 5" fill={f('penguin')}/>
    <path d="M38 100c0-22 9-37 22-37s22 15 22 37v15c-12 8-32 8-44 0z" fill={f('penguin')}/><path d="M46 93c2-13 7-20 14-20s12 7 14 20v22c-9 6-19 6-28 0z" fill={f('white')} stroke="#b8d3dd"/>
    <path d="M35 50c0-19 10-30 25-30s25 11 25 30v15c0 13-10 22-25 22S35 78 35 65z" fill={f('dark')}/><path d="M43 57c0-13 7-21 17-21s17 8 17 21v11c0 9-7 15-17 15s-17-6-17-15z" fill={f('white')} stroke="#aebec9"/>
    <path d="m52 60 8-4 8 4-8 7z" fill="#f6a549" stroke="#bb7029"/><ellipse cx="51" cy="51" rx="2.5" ry="3.5" fill={ink} stroke="none"/><ellipse cx="69" cy="51" rx="2.5" ry="3.5" fill={ink} stroke="none"/>
    <path d="M43 119c3-5 11-5 15 0l-2 5H40zm19 0c4-5 12-5 15 0l3 5H61z" fill="#f59a43" stroke="#bc632b"/><path d="M44 34c5-8 13-12 22-10" fill="none" stroke="#b7d2ff" strokeWidth="3" strokeLinecap="round" opacity=".75"/>
  </g>;
  if (pawn === 'astronaut') return <g stroke="#286f69" strokeWidth="1.5" strokeLinejoin="round">
    <path d="M41 77c-10 1-15 9-14 20l2 10c6 3 13 1 17-5M79 77c10 1 15 9 14 20l-2 10c-6 3-13 1-17-5" fill={f('astronaut')}/>
    <path d="M40 91c2-9 10-14 20-14s18 5 20 14v24c-11 9-29 9-40 0z" fill={f('white')} stroke="#82b6b0"/><path d="m48 100 12-4 12 4v14c-8 5-16 5-24 0z" fill={f('astronaut')} stroke="#26756f"/><rect x="53" y="102" width="14" height="8" rx="2" fill="#d7fff4" stroke="#418f88"/><circle cx="57" cy="106" r="1" fill="#28a2a0"/><circle cx="63" cy="106" r="1" fill="#f4ad47"/>
    <path d="M60 23c17 0 29 11 29 27v8c0 14-12 24-29 24S31 72 31 58v-8c0-16 12-27 29-27z" fill={f('metal')} stroke="#4e958e" strokeWidth="2"/><path d="M38 51c0-12 9-20 22-20s22 8 22 20v8c0 11-9 17-22 17S38 70 38 59z" fill="#9be5df" stroke="#387e79" strokeWidth="2"/><path d="M43 44c6-7 14-10 23-9" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".8"/>
    <path d="M48 83h24" stroke="#f9fff6" strokeWidth="4" strokeLinecap="round"/><circle cx="60" cy="87" r="3" fill="#f3b45c" stroke="#aa7441"/><path d="M39 30c5-8 13-12 22-12" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".65"/>
  </g>;
  if (pawn === 'robot') return <g stroke="#746048" strokeWidth="1.5" strokeLinejoin="round">
    <path d="M43 75 31 85v18l13 4M77 75l12 10v18l-13 4" fill={f('robot')}/><circle cx="31" cy="103" r="4" fill={f('metal')}/><circle cx="89" cy="103" r="4" fill={f('metal')}/>
    <path d="M42 80h36v35H42z" rx="8" fill={f('robot')}/><path d="M48 89h24v15H48z" rx="4" fill="#426d72" stroke="#6d908d"/><circle cx="54" cy="96" r="2" fill="#aaf4db" stroke="none"/><circle cx="66" cy="96" r="2" fill="#ffc66e" stroke="none"/><path d="M54 109h12m-15 11v-5m24 5v-5" fill="none" stroke="#eed9b8" strokeWidth="3" strokeLinecap="round"/>
    <path d="M36 37c0-7 5-12 12-12h24c7 0 12 5 12 12v22c0 8-5 13-12 13H48c-7 0-12-5-12-13z" fill={f('metal')}/><path d="M42 42c0-5 4-9 9-9h18c5 0 9 4 9 9v11c0 6-4 9-9 9H51c-5 0-9-3-9-9z" fill="#324853" stroke="#8f7859"/><circle cx="51" cy="48" r="3" fill="#91f3d8" stroke="none"/><circle cx="69" cy="48" r="3" fill="#ffb86a" stroke="none"/><path d="M53 56h14" stroke="#bedad0" strokeWidth="2" strokeLinecap="round"/><path d="M60 25v-8m0 0c-5 0-5-6 0-6s5 6 0 6z" fill={f('robot')}/><path d="M45 37c3-4 8-6 14-6" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".7"/>
  </g>;
  return <g stroke="#456a37" strokeWidth="1.5" strokeLinejoin="round">
    <path d="M40 78c-12 2-18 9-19 20 8 1 14-1 20-6m39-14c12 2 18 9 19 20-8 1-14-1-20-6" fill={f('dragon')} strokeWidth="2"/><path d="m32 91 10-10-1 17m47-7L78 81l1 17" fill="#d6efa5" stroke="#689b49"/>
    <path d="M40 95c0-14 8-22 20-22s20 8 20 22v20c-12 9-28 9-40 0z" fill={f('dragon')}/><path d="M53 94v17m7-17v20m7-20v17" fill="none" stroke="#d4eaa6" strokeWidth="2" opacity=".8"/>
    <path d="M37 53c0-17 9-28 23-28 13 0 23 10 23 26 0 15-11 25-25 25-13 0-21-9-21-23z" fill={f('dragon')}/><path d="m45 36-3-12 13 9m22 3 5-11-15 7" fill="#f2d486"/><path d="M41 55c6 4 12 6 19 6 8 0 14-2 20-6-1 13-9 21-20 21S42 68 41 55z" fill="#e2cb86" stroke="#7e9f50"/><ellipse cx="51" cy="48" rx="2.5" ry="3.4" fill="#263a2e" stroke="none"/><ellipse cx="70" cy="48" rx="2.5" ry="3.4" fill="#263a2e" stroke="none"/><path d="m57 57 3 2 3-2-3-3z" fill="#59763a" stroke="none"/><path d="M42 34c4-7 10-11 19-12" fill="none" stroke="#f1ffd3" strokeWidth="3" strokeLinecap="round" opacity=".72"/>
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
