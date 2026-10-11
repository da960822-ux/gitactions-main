import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import './hero-scene.css';

type HeroSceneProps = {
  children: ReactNode;
  backgroundSrc?: string;
  envelopeSrc: string;
  portraitSrc: string;
  portraitAlt: string;
  language: 'ko' | 'es';
};

export function HeroScene({ children, backgroundSrc, envelopeSrc, portraitSrc, portraitAlt, language }: HeroSceneProps) {
  const sceneRef = useRef<HTMLElement>(null);
  const pointerFrame = useRef(0);
  const pointerPosition = useRef({ x: 0, y: 0, localX: 0, localY: 0 });
  const [heartBurst, setHeartBurst] = useState(0);
  const [letterOpen, setLetterOpen] = useState(false);

  const resetPointer = () => {
    const scene = sceneRef.current;
    if (!scene) return;
    cancelAnimationFrame(pointerFrame.current);
    pointerFrame.current = 0;
    const glow = scene.querySelector<HTMLElement>('.hero-pointer-glow');
    if (glow) glow.style.opacity = '0';
    scene.querySelectorAll<HTMLElement>('[data-parallax]').forEach(layer => {
      layer.style.setProperty('--shift-x', '0px');
      layer.style.setProperty('--shift-y', '0px');
    });
    scene.querySelector<HTMLElement>('.hero-scene-portrait')?.style.setProperty('--portrait-tilt', '0deg');
  };

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const resetForReducedMotion = () => { if (motionPreference.matches) resetPointer(); };
    motionPreference.addEventListener('change', resetForReducedMotion);
    return () => {
      motionPreference.removeEventListener('change', resetForReducedMotion);
      cancelAnimationFrame(pointerFrame.current);
    };
  }, []);

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const scene = sceneRef.current;
    if (!scene) return;
    const bounds = scene.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width * 2 - 1;
    const y = (event.clientY - bounds.top) / bounds.height * 2 - 1;
    const localX = event.clientX - bounds.left;
    const localY = event.clientY - bounds.top;
    pointerPosition.current = { x, y, localX, localY };
    if (pointerFrame.current) return;
    pointerFrame.current = requestAnimationFrame(() => {
      pointerFrame.current = 0;
      const { x, y, localX, localY } = pointerPosition.current;
      const glow = scene.querySelector<HTMLElement>('.hero-pointer-glow');
      if (glow) {
        glow.style.transform = `translate3d(${localX - 220}px, ${localY - 220}px, 0)`;
        glow.style.opacity = '1';
      }
      scene.querySelectorAll<HTMLElement>('[data-parallax]').forEach(layer => {
        const depth = Number(layer.dataset.parallax || 0);
        layer.style.setProperty('--shift-x', `${x * depth}px`);
        layer.style.setProperty('--shift-y', `${y * depth}px`);
      });
      scene.querySelector<HTMLElement>('.hero-scene-portrait')?.style.setProperty('--portrait-tilt', `${x * -1.8}deg`);
    });
  };

  const envelopeLabel = language === 'ko' ? 'Papi의 편지 열기' : 'Abrir la carta de Papi';

  return <section className="couple-hero hero-scene" id="home" aria-labelledby="hero-title" ref={sceneRef} onPointerMove={onPointerMove} onPointerLeave={resetPointer}>
    {backgroundSrc && <>
      <img className="hero-scene-backdrop" data-parallax="-2" src={backgroundSrc} alt="" aria-hidden="true" />
      <img className="hero-scene-foreground" data-parallax="-7" src={backgroundSrc} alt="" aria-hidden="true" />
    </>}
    <div className="hero-pointer-glow" aria-hidden="true" />
    <div className="hero-scene-inner">
      <div className="hero-scene-copy">{children}</div>
      <div className="hero-scene-art">
        <svg className="hero-orbit-svg" data-parallax="-4" viewBox="0 0 800 480" preserveAspectRatio="none" aria-hidden="true">
          <ellipse className="hero-orbit-path hero-orbit-path-wide" cx="405" cy="244" rx="345" ry="164" transform="rotate(-14 405 244)" pathLength="1" />
          <ellipse className="hero-orbit-path hero-orbit-path-close" cx="405" cy="244" rx="303" ry="137" transform="rotate(18 405 244)" pathLength="1" />
          <g className="hero-orbit-traveler"><circle cx="70" cy="244" r="3" /><circle cx="70" cy="244" r="8" /></g>
        </svg>
        <figure className="hero-scene-portrait" data-parallax="14">
          <img src={portraitSrc} width="1254" height="1254" alt={portraitAlt} fetchPriority="high" aria-hidden="false" />
        </figure>
        <div className="hero-postcard" data-parallax="-12" aria-hidden="true">
          <img src={backgroundSrc || '/images/midnight-rose-sky.webp'} alt="" />
          <span className="hero-postmark" aria-hidden="true">♡</span>
        </div>
        <button className="hero-envelope" data-parallax="12" type="button" aria-label={envelopeLabel} aria-expanded={letterOpen} aria-controls="hero-letter-preview" onClick={() => setLetterOpen(value => !value)}>
          <img src={envelopeSrc} alt="" />
          <span className="hero-envelope-flap" aria-hidden="true" />
          <span className="hero-letter-preview" id="hero-letter-preview" aria-hidden={!letterOpen}><b>For my Mami ♡</b><small>Baby, surprise!</small></span>
        </button>
        <div className="hero-table-details" data-parallax="18">
          <button className="hero-glass-heart" type="button" aria-label={language === 'ko' ? '하트 반짝이기' : 'Hacer brillar el corazón'} onClick={() => setHeartBurst(value => value + 1)}>
            <svg viewBox="0 0 72 66" aria-hidden="true"><path d="M36 59 8 34C-7 13 19-1 36 19 53-1 79 13 64 34Z"/><path d="M16 24c-1-7 5-12 11-12"/></svg>
            {heartBurst > 0 && <span className="hero-heart-burst" key={heartBurst} aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <i key={index}><svg viewBox="0 0 20 18"><path d="M10 17 2 10C-2 4 5 0 10 6 15 0 22 4 18 10Z"/></svg></i>)}</span>}
          </button>
          <div className="hero-candle" aria-hidden="true"><i /></div>
        </div>
        <div className="hero-scene-sparkles" data-parallax="-2" aria-hidden="true"><i /><i /><i /><i /><i /><b><svg viewBox="0 0 20 18"><path d="M10 17 2 10C-2 4 5 0 10 6 15 0 22 4 18 10Z" /></svg></b><b><svg viewBox="0 0 20 18"><path d="M10 17 2 10C-2 4 5 0 10 6 15 0 22 4 18 10Z" /></svg></b></div>
      </div>
    </div>
  </section>;
}

export default HeroScene;
