import { useEffect, useRef } from 'react';
import type { Language } from '../core/types';
import type { Gem } from '../games/splendor';
import { splendorNobleName } from '../games/splendorNobleNames';
import { SplendorArtwork } from './SplendorArtwork';
import { SplendorGem } from './SplendorGem';

const colors: Gem[] = ['white', 'blue', 'green', 'red', 'black'];
const names = { white: ['흰색', 'Blanco'], blue: ['파랑', 'Azul'], green: ['초록', 'Verde'], red: ['빨강', 'Rojo'], black: ['검정', 'Negro'] } as const;

export function SplendorDetailArtwork({ src }: { src: string | null }) {
  return <span className="sp-detail-artwork" aria-hidden="true">{src && <SplendorArtwork src={src}/>}</span>;
}

export function SplendorNobleViewer({ id, src, points, requirement, bonuses, language, canAcquire, onAcquire, onClose }: {
  id: string;
  src: string | null;
  points: number;
  requirement: Partial<Record<Gem, number>>;
  bonuses: Partial<Record<Gem, number>>;
  language: Language;
  canAcquire: boolean;
  onAcquire: () => void;
  onClose: () => void;
}) {
  const panel = useRef<HTMLElement>(null);
  const ko = language === 'ko';
  useEffect(() => { panel.current?.focus(); }, [id]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
      if (event.key !== 'Tab' || !panel.current) return;
      const buttons = Array.from(panel.current.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
      if (!buttons.length) return;
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);
  return <>
    <div className="sp-card-detail-scrim" aria-hidden="true"/>
    <section ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={splendorNobleName(id, language)} className="sp-noble-detail-overlay sp-card-detail-overlay">
      <header><div><h2>{splendorNobleName(id, language)}</h2><p>{points} {ko ? '점' : 'pts'}</p></div><button type="button" onClick={onClose} aria-label={ko ? '닫기' : 'Cerrar'}>×</button></header>
      <SplendorDetailArtwork src={src}/>
      <div className="sp-noble-detail-info">
        <b>{ko ? '필요한 영구 보너스' : 'Bonificaciones permanentes necesarias'}</b>
        {colors.filter(color => requirement[color]).map(color => <p key={color}><SplendorGem gem={color}/><span>{names[color][ko ? 0 : 1]}</span><strong>{Math.min(bonuses[color] ?? 0, requirement[color] ?? 0)} / {requirement[color]}</strong></p>)}
        {canAcquire ? <button type="button" className="sp-button sp-button-buy" onClick={onAcquire}>{ko ? '방문 수락' : 'Aceptar visita'}</button> : <small>{ko ? '조건을 채우면 자동으로 방문해요.' : 'Te visitará al cumplir los requisitos.'}</small>}
      </div>
    </section>
  </>;
}
