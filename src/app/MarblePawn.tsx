import { useId, useState } from 'react';
import type { CSSProperties } from 'react';
import type { GameAction, Language, PlayerId } from '../core/types';
import '../styles/marble-pawns.css';
import pawnAssets from '../../public/images/marble/pawns/manifest.json';

export type MarblePawnId = 'fox' | 'cat' | 'penguin' | 'astronaut' | 'robot' | 'dragon' | 'sali-suli';
type Copy = Record<Language, string>;

export const marblePawnCatalog: { id: MarblePawnId; name: Copy; color: string }[] = [
  { id: 'fox', name: { ko: '말티푸', es: 'Maltipoo' }, color: '#d3aa79' },
  { id: 'cat', name: { ko: '랙돌', es: 'Ragdoll' }, color: '#d88cbd' },
  { id: 'penguin', name: { ko: '판다', es: 'Panda' }, color: '#465559' },
  { id: 'astronaut', name: { ko: '우주인', es: 'Astronauta' }, color: '#55a99d' },
  { id: 'robot', name: { ko: '리스연', es: 'Lisyeon' }, color: '#a58c70' },
  { id: 'dragon', name: { ko: '친칠라', es: 'Chinchilla' }, color: '#a7adb3' },
  { id: 'sali-suli', name: { ko: '살리·술리', es: 'Sali y Suli' }, color: '#b89073' },
];

const copy = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;
export function isMarblePawnImageFailed(failedImage: string | null, pawn: MarblePawnId, src: string) {
  return failedImage === `${pawn}:${src}`;
}

export function MarblePawn({ pawn, language, label }: { pawn: MarblePawnId; language: Language; label?: string }) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const id = useId().replace(/:/g, '');
  const name = marblePawnCatalog.find(item => item.id === pawn)?.name[language] ?? pawn;
  const title = label ?? name;
  const g = (name: string) => `${id}-${name}`;

  const image = pawnAssets.assets.find(asset => asset.id === pawn)?.path;
  if (image && !isMarblePawnImageFailed(failedImage, pawn, image)) return <img className={`marble-pawn marble-pawn--${pawn}`} src={image} alt={title} decoding="async" onError={() => setFailedImage(`${pawn}:${image}`)}/>;

  return <svg className={`marble-pawn marble-pawn--${pawn}`} viewBox="0 0 120 150" role="img" aria-label={title} focusable="false">
    <defs>
      <linearGradient id={g('base')} x1="0" x2="1" y1="0" y2="1"><stop stopColor="#fff8ea"/><stop offset=".42" stopColor="#e7cfac"/><stop offset=".78" stopColor="#b99b73"/><stop offset="1" stopColor="#f5e5c8"/></linearGradient>
      <linearGradient id={g('metal')} x1="0" x2="1" y1="0" y2="1"><stop stopColor="#fff"/><stop offset=".38" stopColor="#e6d7be"/><stop offset=".72" stopColor="#9a7f5d"/><stop offset="1" stopColor="#f9edda"/></linearGradient>
      <radialGradient id={g('shine')} cx="30%" cy="18%" r="82%"><stop stopColor="#fff" stopOpacity=".92"/><stop offset=".28" stopColor="#fff" stopOpacity=".28"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></radialGradient>
      <linearGradient id={g('fox')} x1=".15" x2=".88" y1="0" y2="1"><stop stopColor="#fff3da"/><stop offset=".5" stopColor="#ddc5a3"/><stop offset="1" stopColor="#a88562"/></linearGradient>
      <linearGradient id={g('cat')} x1=".1" x2=".9" y1="0" y2="1"><stop stopColor="#f9c5e1"/><stop offset=".48" stopColor="#d98fbe"/><stop offset="1" stopColor="#8e4b82"/></linearGradient>
      <linearGradient id={g('penguin')} x1=".1" x2=".9" y1="0" y2="1"><stop stopColor="#6c7885"/><stop offset=".48" stopColor="#344352"/><stop offset="1" stopColor="#16222d"/></linearGradient>
      <linearGradient id={g('astronaut')} x1=".1" x2=".9" y1="0" y2="1"><stop stopColor="#a7ece1"/><stop offset=".46" stopColor="#51b2a4"/><stop offset="1" stopColor="#26756f"/></linearGradient>
      <linearGradient id={g('robot')} x1=".1" x2=".9" y1="0" y2="1"><stop stopColor="#edd5b2"/><stop offset=".46" stopColor="#b59c7b"/><stop offset="1" stopColor="#6f5e4b"/></linearGradient>
      <linearGradient id={g('dragon')} x1=".1" x2=".9" y1="0" y2="1"><stop stopColor="#d3cedc"/><stop offset=".46" stopColor="#a099b3"/><stop offset="1" stopColor="#626076"/></linearGradient>
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
    <path d="M41 31c-5 11-7 23-6 37 1 23 6 41 18 48 6 4 13 4 19 0 12-7 16-27 14-48-1-17-7-32-17-40-8-6-21-6-28 3z" fill={`url(#${g('shine')})`} opacity=".18" pointerEvents="none"/>
  </svg>;
}

function PawnFigure({ pawn, id }: { pawn: MarblePawnId; id: string }) {
  const f = (name: string) => `url(#${id}-${name})`;
  const ink = '#43332f';
  if (pawn === 'fox') return <g stroke="#a48565" strokeWidth="1.5" strokeLinejoin="round">
    <path d="M40 77c-9-3-14 7-12 16 0 6 7 10 13 6m39-22c9-3 14 7 12 16 0 6-7 10-13 6" fill={f('fox')}/>
    <path d="M39 103c-2-5 0-11 4-15-1-9 6-17 17-17s18 8 17 17c4 4 6 10 4 15l1 11c-11 10-33 10-44 0z" fill={f('fox')}/>
    <ellipse cx="60" cy="99" rx="14" ry="18" fill="#fff7e7" stroke="#d4b994"/>
    <g transform="translate(-8.4 -7.14) scale(1.14)">
    <path d="M37 31c-12-7-22 4-19 15-5 8 0 19 10 21 8 0 12-8 15-18m40-18c12-7 22 4 19 15 5 8 0 19-10 21-8 0-12-8-15-18" fill={f('fox')}/>
    <path d="M34 31c-1-9 7-14 14-10 5-7 14-8 20-2 9-3 18 4 17 12 8 3 10 12 5 18 5 10-3 24-14 26-7 6-24 6-32 0-12-2-20-15-15-26-4-7-2-15 5-18Z" fill={f('fox')}/>
    <ellipse cx="49" cy="51" rx="2.8" ry="3.8" fill={ink} stroke="none"/><ellipse cx="71" cy="51" rx="2.8" ry="3.8" fill={ink} stroke="none"/>
    <path d="M44 59c2-6 10-8 16-4 6-4 14-2 16 4 1 9-7 15-16 15s-17-6-16-15Z" fill="#fffcf2" stroke="#d0b28e"/>
    <ellipse cx="60" cy="59" rx="4" ry="3" fill="#5e453e" stroke="none"/><path d="M60 62v3m0 0c-3 4-7 4-10 1m10-1c3 4 7 4 10 1" fill="none" stroke="#735249" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M39 35c-3-5 2-10 6-7m9-1c-3-6 7-10 10-4m9 7c4-5 9-1 7 3M27 44c-5 2-5 7-1 9m67-9c5 2 5 7 1 9" fill="none" stroke="#b89975" strokeWidth="1.3" strokeLinecap="round"/>
    </g>
    <path d="M37 113c4-5 12-6 17-1l1 9H35zm29-1c5-5 13-4 17 1l2 8H65z" fill="#fff7e7" stroke="#c1a383"/>
    <path d="M42 27c4-5 10-6 14-4" fill="none" stroke="#fffdf3" strokeWidth="3" strokeLinecap="round" opacity=".75"/>
  </g>;
  if (pawn === 'cat') return <g stroke="#75466e" strokeWidth="1.5" strokeLinejoin="round">
    <path d="M79 101c18 9 26-1 20-12-3-5-8-3-6 1 4 7 0 12-13 5" fill={f('cat')} strokeWidth="3"/>
    <path d="M39 73c-11 0-15 13-10 23 4 8 14 6 17-2M80 73c11 0 15 13 10 23-4 8-14 6-17-2" fill={f('cat')}/>
    <path d="M39 105c0-20 9-31 21-31s21 11 21 31v9c-11 8-31 8-42 0z" fill={f('cat')}/><path d="M51 86c5-4 13-4 18 0v25c-5 4-13 4-18 0z" fill="#ffe6f1" stroke="#ca86b2"/>
    <g transform="translate(-8.4 -7.14) scale(1.14)">
    <path d="M36 48 35 18l24 18M84 48l1-30-24 18" fill={f('cat')}/><path d="m40 40-1-13 12 10m29 3 1-13-12 10" fill="#f3a9cf" stroke="none"/>
    <path d="M34 51c0-17 11-28 26-28s26 11 26 28c0 16-11 27-26 27S34 67 34 51z" fill={f('cat')}/>
    <path d="M45 59c5-4 10-5 15-5s10 1 15 5c-3 9-9 14-15 14s-12-5-15-14z" fill="#fff0f5" stroke="#c782ad"/>
    <path d="M47 49c1-3 4-4 6-1m14 0c1-3 4-4 6-1" fill="none" stroke={ink} strokeWidth="2.5" strokeLinecap="round"/><path d="m57 59 3 2 3-2-3-3z" fill="#a65588" stroke="none"/><path d="M60 61v3m0 0-4 2m4-2 4 2M42 61l-11-2m11 6-12 2m49-6 11-2m-11 8 12 1" fill="none" stroke="#fff1f8" strokeWidth="1.4"/>
    <path d="M41 31c5-7 12-10 20-9" fill="none" stroke="#fff5fb" strokeWidth="3" strokeLinecap="round" opacity=".7"/>
    </g>
  </g>;
  if (pawn === 'penguin') return <g stroke="#35434e" strokeWidth="1.5" strokeLinejoin="round">
    <path d="M39 79c-11-3-18 9-15 21 2 9 10 12 18 7m39-28c11-3 18 9 15 21-2 9-10 12-18 7" fill={f('penguin')}/>
    <path d="M39 104c0-23 8-34 21-34s21 11 21 34v12c-12 9-30 9-42 0z" fill={f('white')} stroke="#9aabb0"/>
    <path d="M39 85c11 6 31 6 42 0v10c-12 6-30 6-42 0z" fill={f('penguin')}/>
    <g transform="translate(-8.4 -7.14) scale(1.14)">
    <circle cx="38" cy="27" r="11" fill={f('penguin')}/><circle cx="82" cy="27" r="11" fill={f('penguin')}/>
    <path d="M32 51c0-19 12-30 28-30s28 11 28 30c0 18-12 31-28 31S32 69 32 51z" fill={f('white')} stroke="#9babb2"/>
    <ellipse cx="47" cy="51" rx="8" ry="10" transform="rotate(24 47 51)" fill={f('penguin')} stroke="none"/><ellipse cx="73" cy="51" rx="8" ry="10" transform="rotate(-24 73 51)" fill={f('penguin')} stroke="none"/>
    <ellipse cx="48" cy="50" rx="2.4" ry="3" fill="#fff" stroke="none"/><ellipse cx="72" cy="50" rx="2.4" ry="3" fill="#fff" stroke="none"/><circle cx="48" cy="51" r="1.4" fill="#17222c" stroke="none"/><circle cx="72" cy="51" r="1.4" fill="#17222c" stroke="none"/>
    <path d="m56 63 4 3 4-3-4-3z" fill="#26343c" stroke="none"/><path d="M60 66v3m0 0c-3 3-6 3-9 0m9 0c3 3 6 3 9 0" fill="none" stroke="#45515b" strokeWidth="1.3" strokeLinecap="round"/>
    </g>
    <path d="M38 114c4-6 12-6 17-1l1 10H36zm27-1c5-5 13-5 17 1l2 9H64z" fill={f('penguin')}/>
    <path d="M43 30c5-5 12-7 19-6" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".75"/>
  </g>;
  if (pawn === 'astronaut') return <g stroke="#286f69" strokeWidth="1.5" strokeLinejoin="round">
    <path d="M41 77c-10 1-15 9-14 20l2 10c6 3 13 1 17-5M79 77c10 1 15 9 14 20l-2 10c-6 3-13 1-17-5" fill={f('astronaut')}/>
    <path d="M40 91c2-9 10-14 20-14s18 5 20 14v24c-11 9-29 9-40 0z" fill={f('white')} stroke="#82b6b0"/><path d="m48 100 12-4 12 4v14c-8 5-16 5-24 0z" fill={f('astronaut')} stroke="#26756f"/><rect x="53" y="102" width="14" height="8" rx="2" fill="#d7fff4" stroke="#418f88"/><circle cx="57" cy="106" r="1" fill="#28a2a0"/><circle cx="63" cy="106" r="1" fill="#f4ad47"/>
    <g transform="translate(-8.4 -7.14) scale(1.14)">
    <path d="M60 23c17 0 29 11 29 27v8c0 14-12 24-29 24S31 72 31 58v-8c0-16 12-27 29-27z" fill={f('metal')} stroke="#4e958e" strokeWidth="2"/><path d="M38 51c0-12 9-20 22-20s22 8 22 20v8c0 11-9 17-22 17S38 70 38 59z" fill="#9be5df" stroke="#387e79" strokeWidth="2"/><path d="M43 44c6-7 14-10 23-9" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".8"/>
    <ellipse cx="60" cy="57" rx="15" ry="12" fill="#f5d5ba" stroke="#bc9480"/><circle cx="54" cy="55" r="2.4" fill="#3d454e" stroke="none"/><circle cx="66" cy="55" r="2.4" fill="#3d454e" stroke="none"/><path d="M55 62q5 5 10 0" fill="none" stroke="#986f68" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M48 83h24" stroke="#f9fff6" strokeWidth="4" strokeLinecap="round"/><circle cx="60" cy="87" r="3" fill="#f3b45c" stroke="#aa7441"/><path d="M39 30c5-8 13-12 22-12" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".65"/>
    </g>
  </g>;
  if (pawn === 'robot') return <g stroke="#746048" strokeWidth="1.5" strokeLinejoin="round">
    <path d="M43 75 31 85v18l13 4M77 75l12 10v18l-13 4" fill={f('robot')}/><circle cx="31" cy="103" r="4" fill={f('metal')}/><circle cx="89" cy="103" r="4" fill={f('metal')}/>
    <rect x="42" y="82" width="36" height="33" rx="11" fill={f('robot')}/><rect x="48" y="90" width="24" height="14" rx="5" fill="#426d72" stroke="#6d908d"/><circle cx="54" cy="96" r="2" fill="#aaf4db" stroke="none"/><circle cx="66" cy="96" r="2" fill="#ffc66e" stroke="none"/><path d="M54 109h12m-15 11v-5m24 5v-5" fill="none" stroke="#eed9b8" strokeWidth="3" strokeLinecap="round"/>
    <g transform="translate(-8.4 -7.14) scale(1.14)">
    <rect x="32" y="24" width="56" height="52" rx="17" fill={f('metal')}/><path d="M39 43c0-7 5-12 12-12h18c7 0 12 5 12 12v12c0 7-5 12-12 12H51c-7 0-12-5-12-12z" fill="#324853" stroke="#8f7859"/><circle cx="50" cy="47" r="4" fill="#91f3d8" stroke="none"/><circle cx="70" cy="47" r="4" fill="#ffb86a" stroke="none"/><path d="M50 58q10 9 20 0" stroke="#bedad0" strokeWidth="2" strokeLinecap="round"/><path d="M60 25v-8m0 0c-5 0-5-6 0-6s5 6 0 6z" fill={f('robot')}/><path d="M45 37c3-4 8-6 14-6" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".7"/>
    </g>
  </g>;
  return <g stroke="#666477" strokeWidth="1.5" strokeLinejoin="round">
    <path d="M77 109c21 10 37-4 31-19 7-8 2-17-6-17 0 8-9 10-7 17-6 3-6 11-17 8z" fill={f('dragon')}/>
    <path d="M40 78c-9-2-15 7-12 17 2 8 8 10 15 6m37-23c9-2 15 7 12 17-2 8-8 10-15 6" fill={f('dragon')}/>
    <path d="M38 102c0-23 10-35 22-35s22 12 22 35v13c-12 9-32 9-44 0z" fill={f('dragon')}/>
    <ellipse cx="60" cy="98" rx="15" ry="20" fill="#eeedf3" stroke="#aaa6ba"/>
    <g transform="translate(-8.4 -7.14) scale(1.14)">
    <ellipse cx="33" cy="27" rx="15" ry="19" transform="rotate(-17 33 27)" fill={f('dragon')}/><ellipse cx="87" cy="27" rx="15" ry="19" transform="rotate(17 87 27)" fill={f('dragon')}/>
    <ellipse cx="33" cy="27" rx="9" ry="13" transform="rotate(-17 33 27)" fill="#d6b6c2" stroke="#9a879d"/><ellipse cx="87" cy="27" rx="9" ry="13" transform="rotate(17 87 27)" fill="#d6b6c2" stroke="#9a879d"/>
    <path d="M33 53c-3-18 10-31 27-31s30 13 27 31c3 5 1 13-4 15-2 9-10 15-23 15s-21-6-23-15c-5-2-7-10-4-15Z" fill={f('dragon')}/>
    <path d="M42 58c5-6 11-7 18-4 7-3 13-2 18 4-1 12-8 18-18 18s-17-6-18-18Z" fill="#f3f0f4" stroke="#aba5b9"/>
    <ellipse cx="47" cy="49" rx="3" ry="4" fill="#343040" stroke="none"/><ellipse cx="73" cy="49" rx="3" ry="4" fill="#343040" stroke="none"/><circle cx="46" cy="48" r=".8" fill="#fff" stroke="none"/><circle cx="72" cy="48" r=".8" fill="#fff" stroke="none"/>
    <path d="m57 61 3 2 3-2-3-3z" fill="#af7f96" stroke="none"/><path d="M60 63v4m0 0-4 2m4-2 4 2M43 62l-11-2m11 7-12 1m46-6 11-2m-11 7 12 1" fill="none" stroke="#736881" strokeWidth="1.1" strokeLinecap="round"/>
    </g>
    <path d="M39 112c5-4 12-4 17 1v9H37zm25 1c5-5 12-5 17-1l2 10H64z" fill="#d6d0df"/>
    <path d="M42 31c5-5 12-7 20-6" fill="none" stroke="#f5f1fa" strokeWidth="3" strokeLinecap="round" opacity=".72"/>
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
  const seats: string[] = Array.isArray(view?.board?.seats) ? view.board.seats : ['p1', 'p2'];
  const teamMode = seats.length === 4;
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
      <span className="marble-pawn-picker__hint">{teamMode ? copy(language, '네 명은 서로 다른 말을 사용해요.', 'Los cuatro usan fichas diferentes.') : copy(language, '두 사람은 서로 다른 말을 사용해요.', 'Cada persona usa una ficha diferente.')}</span>
    </header>
    <div className="marble-pawn-picker__grid">
      {marblePawnCatalog.map(({ id, name, color }) => {
        const choice = validChoices.get(id);
        const isSelected = selectedPawn === id;
        const isPending = pending === id;
        const isTaken = seats.some(seat => seat !== playerId && view?.board?.pawns?.[seat] === id);
        return <button className={`marble-pawn-choice${isSelected ? ' is-selected' : ''}${isPending ? ' is-pending' : ''}`} style={{ '--pawn-color': color } as CSSProperties} type="button" key={id} disabled={!choice || pending !== null} aria-pressed={isSelected} onClick={() => void choose(id)}>
          <span className="marble-pawn-choice__art"><MarblePawn pawn={id} language={language}/></span>
          <span className="marble-pawn-choice__name">{name[language]}</span>
          <span className="marble-pawn-choice__state">{isPending ? copy(language, '선택 중…', 'Eligiendo…') : isSelected ? copy(language, '내 말', 'Tu ficha') : isTaken ? teamMode ? copy(language, '사용 중', 'En uso') : copy(language, '상대 말', 'De tu pareja') : choice ? copy(language, '선택', 'Elegir') : copy(language, '선택 불가', 'No disponible')}</span>
        </button>;
      })}
    </div>
    {failed && <p className="marble-pawn-picker__error" role="status">{copy(language, '말을 바꾸지 못했어요. 다시 선택해 주세요.', 'No se pudo cambiar la ficha. Inténtalo de nuevo.')}</p>}
  </section>;
}
