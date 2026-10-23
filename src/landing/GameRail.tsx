import { useEffect, useRef, useState } from 'react';
import { Link } from '../app/Router';
import type { Language } from '../core/types';
import { gameCatalog } from '../games/catalog';
import '../styles/game-rail.css';

export function GameRail({ language }: { language: Language }) {
  const railRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; scrollLeft: number; moved: boolean } | null>(null);
  const frames = useRef(new Map<number, number>());
  const timers = useRef(new Set<number>());
  const [readyArt, setReadyArt] = useState<string[]>([]);
  const revealArt = (id: string) => setReadyArt(current => current.includes(id) ? current : [...current, id]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const resetMotion = () => {
      frames.current.forEach(frame => cancelAnimationFrame(frame));
      frames.current.clear();
      const rail = railRef.current;
      const drag = dragRef.current;
      dragRef.current = null;
      if (rail && drag && rail.hasPointerCapture(drag.pointerId)) rail.releasePointerCapture(drag.pointerId);
      timers.current.forEach(timer => window.clearTimeout(timer));
      timers.current.clear();
      rail?.querySelectorAll<HTMLElement>('.game-rail-card').forEach(card => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
        card.style.setProperty('--light-x', '50%');
        card.style.setProperty('--light-y', '50%');
      });
      if (rail) delete rail.dataset.dragged;
    };
    preference.addEventListener('change', resetMotion);
    return () => {
      preference.removeEventListener('change', resetMotion);
      const rail = railRef.current;
      if (rail && dragRef.current && rail.hasPointerCapture(dragRef.current.pointerId)) rail.releasePointerCapture(dragRef.current.pointerId);
      dragRef.current = null;
      frames.current.forEach(frame => cancelAnimationFrame(frame));
      frames.current.clear();
      timers.current.forEach(timer => window.clearTimeout(timer));
      timers.current.clear();
    };
  }, []);

  const pointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || !event.isPrimary || event.button !== 0) return;
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, scrollLeft: event.currentTarget.scrollLeft, moved: false };
  };

  const pointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.abs(dx) > 5 && Math.abs(dx) > Math.abs(dy)) {
      drag.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (drag.moved) {
      event.currentTarget.scrollLeft = drag.scrollLeft - dx;
      event.preventDefault();
    }
  };

  const pointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    if (dragRef.current.moved) {
      event.currentTarget.dataset.dragged = 'true';
      const timer = window.setTimeout(() => {
        timers.current.delete(timer);
        if (railRef.current) delete railRef.current.dataset.dragged;
      }, 0);
      timers.current.add(timer);
    }
    dragRef.current = null;
  };

  const tilt = (id: number, event: React.PointerEvent<HTMLAnchorElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || event.pointerType === 'touch') return;
    const card = event.currentTarget;
    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    const oldFrame = frames.current.get(id);
    if (oldFrame !== undefined) cancelAnimationFrame(oldFrame);
    frames.current.set(id, requestAnimationFrame(() => {
      card.style.setProperty('--tilt-x', `${((0.5 - y) * 10).toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${((x - 0.5) * 10).toFixed(2)}deg`);
      card.style.setProperty('--light-x', `${(x * 100).toFixed(1)}%`);
      card.style.setProperty('--light-y', `${(y * 100).toFixed(1)}%`);
    }));
  };

  const resetTilt = (id: number, card: HTMLAnchorElement) => {
    const oldFrame = frames.current.get(id);
    if (oldFrame !== undefined) cancelAnimationFrame(oldFrame);
    frames.current.set(id, requestAnimationFrame(() => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
      card.style.setProperty('--light-x', '50%');
      card.style.setProperty('--light-y', '50%');
    }));
  };

  return <div className="game-rail-viewport" role="region" aria-label={language === 'ko' ? '게임 고르기' : 'Elige un juego'}>
    <div ref={railRef} className="game-rail-track" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onClickCapture={event => { if (event.currentTarget.dataset.dragged === 'true') { event.preventDefault(); event.stopPropagation(); } }}>
      {gameCatalog.map((game, index) => <Link
        href={`/play?game=${game.id}`}
        className={`game-rail-card game-${game.color}`}
        key={game.id}
        aria-labelledby={`game-rail-title-${game.id}`}
        aria-describedby={`game-rail-description-${game.id}`}
        onPointerMove={event => tilt(index, event)}
        onPointerLeave={event => resetTilt(index, event.currentTarget)}
        onBlur={event => resetTilt(index, event.currentTarget)}
      >
        <img hidden className="game-rail-art-source" src={game.id === 'splendor' ? '/images/splendor/box-cover.jpg' : game.id === 'minhwatu' ? '/images/hwatu/01-01.svg' : '/images/rose-game-atlas.webp'} alt="" aria-hidden="true" onLoad={event => { void event.currentTarget.decode().then(() => revealArt(game.id), () => revealArt(game.id)); }} onError={() => revealArt(game.id)}/>
        <span className={`game-rail-art game-thumbnail art-${game.id}`} data-image-ready={readyArt.includes(game.id)} aria-hidden="true"/>
        <span className="game-rail-meta">
          <span className="game-rail-label" id={`game-rail-title-${game.id}`}>{game.title[language]}</span>
          <span className="game-rail-description" id={`game-rail-description-${game.id}`}>{game.subtitle[language]}</span>
          <span className="game-rail-cta" aria-hidden="true">{language === 'ko' ? '같이 놀기' : 'Jugar juntos'} <i>♡</i></span>
        </span>
      </Link>)}
    </div>
    <p className="game-rail-device-note">{language === 'ko' ? '게임은 컴퓨터에서 같이 하자 ♡' : 'Para jugar, nos vemos en la computadora ♡'}</p>
  </div>;
}
