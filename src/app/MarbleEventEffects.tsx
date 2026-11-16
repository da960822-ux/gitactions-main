import { marbleRuntimeImage } from './marble-runtime-images';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { isFreshMarbleCosmetic, marbleEventSequence, type MarbleActionEvent } from './marble-motion';
import { createPortal } from 'react-dom';
import type { Language } from '../core/types';
import './marble-event-effects.css';

export function marbleTileEffect(event: MarbleActionEvent | null | undefined, tileIndex: number, landmark = false) {
  if (!event || event.skipCosmetics || !marbleEventSequence(event) || event.tile !== tileIndex) return null;
  if (event.blockedByShield || event.cardOutcome === 'no-effect' || event.cardOutcome === 'pending-choice') return null;
  if ((event.type === 'festival-site' && event.cardOutcome === 'applied') || (event.type === 'event-card' && event.cardId === 'city-festival' && event.cardPhase !== 'draw')) return 'festival';
  if (event.type === 'event-card' && event.cardId === 'blackout' && event.cardPhase !== 'draw') return 'blackout';
  if (event.cardId === 'earthquake') return null;
  if (event.type === 'arrival') return 'arrival';
  if (event.type === 'buy') return event.landmark === true ? 'landmark' : 'purchase';
  if (event.type === 'takeover') return 'takeover';
  if (event.type === 'build') return (typeof event.landmark === 'boolean' ? event.landmark : landmark) ? 'landmark' : 'build';
  return null;
}

const celebrationCities: Record<string, { character: 'yeonseok' | 'lisbeth'; ko: string; es: string }> = {
  gwangju: { character: 'yeonseok', ko: '광주', es: 'Gwangju' },
  seoul: { character: 'yeonseok', ko: '서울', es: 'Seúl' },
  'new-york': { character: 'lisbeth', ko: '뉴욕', es: 'Nueva York' },
  'santo-domingo': { character: 'lisbeth', ko: '산토도밍고', es: 'Santo Domingo' },
};

type LandmarkCharacter = 'yeonseok' | 'lisbeth';
const characterLoads = new Map<LandmarkCharacter, Promise<boolean>>();
export function preloadMarbleCharacter(character: LandmarkCharacter): Promise<boolean> {
  let ready = characterLoads.get(character);
  if (!ready) {
    ready = new Promise(resolve => {
      const image = new Image();
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = marbleRuntimeImage(`result-${character}-wins.png`);
    });
    characterLoads.set(character, ready);
  }
  return ready;
}

export function MarbleLandmarkCelebration({ city, language }: { city: string; language: Language }) {
  const place = celebrationCities[city];
  if (!place) return null;
  return <figure className="mp-landmark-celebration" data-landmark-character={place.character} role="status">
    <svg viewBox={place.character === 'yeonseok' ? '270 90 470 580' : '920 110 510 580'} aria-hidden="true">
      <image href={marbleRuntimeImage(`result-${place.character}-wins.png`)} width="1672" height="941"/>
    </svg>
    <figcaption>{language === 'ko' ? `${place.ko} 랜드마크 완성!` : `¡Monumento de ${place.es} terminado!`}</figcaption>
  </figure>;
}

function LandmarkMoment({ city, language }: { city: string; language: Language }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let active = !document.hidden;
    let timer: number | undefined;
    const cancel = () => { if (document.hidden) { active = false; setVisible(false); } };
    // Start the finite cameo only after the shared, early preload succeeds.
    void preloadMarbleCharacter(celebrationCities[city].character).then(ready => {
      if (!active || !ready) return;
      setVisible(true);
      timer = window.setTimeout(() => setVisible(false), 2400);
    });
    document.addEventListener('visibilitychange', cancel);
    return () => { active = false; window.clearTimeout(timer); document.removeEventListener('visibilitychange', cancel); };
  }, [city]);
  // A portal keeps this brief cameo out of the tile's clipped building artwork.
  return visible && typeof document !== 'undefined' ? createPortal(<MarbleLandmarkCelebration city={city} language={language}/>, document.body) : null;
}

function Burst({ kind, owner }: { kind: string; owner?: string }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const cancel = () => { if (preference.matches || document.hidden) setVisible(false); };
    cancel();
    const timer = window.setTimeout(() => setVisible(false), kind === 'victory' ? 2200 : 1800);
    preference.addEventListener('change', cancel);
    document.addEventListener('visibilitychange', cancel);
    return () => { window.clearTimeout(timer); preference.removeEventListener('change', cancel); document.removeEventListener('visibilitychange', cancel); };
  }, [kind]);
  if (!visible) return null;
  return <span className={`mp-fx mp-fx--${kind}`} data-fx-owner={owner} aria-hidden="true">
    <i className="mp-fx-ring"/><i className="mp-fx-wave"/>{kind==='blackout'&&<b className="mp-fx-bolt">ϟ</b>}
    {Array.from({ length: kind === 'victory' || kind === 'festival' ? 24 : kind === 'landmark' ? 10 : 6 }, (_, index) => <i key={index} className="mp-fx-particle" style={{ '--fx-i': index, '--fx-angle': `${index * (kind === 'landmark' ? 36 : 60)}deg`, '--fx-x': `${(index * 37) % 100}%`, '--fx-drift': `${(index % 2 ? 1 : -1) * (12 + index % 5 * 9)}px` } as CSSProperties}/>)}
  </span>;
}

export function MarbleTileEffects({ event, tileIndex, landmark = false, owner, city = '', language = 'ko' }: { city?: string; language?: Language; event?: MarbleActionEvent | null; tileIndex: number; landmark?: boolean; owner?: string | null }) {
  useEffect(() => {
    const character = celebrationCities[city]?.character;
    if (character) void preloadMarbleCharacter(character);
  }, [city]);
  const sequence = marbleEventSequence(event);
  const previous = useRef(sequence);
  const [pulse, setPulse] = useState<{ kind: ReturnType<typeof marbleTileEffect>; sequence: number; owner?: string }>({ kind: null, sequence });
  useEffect(() => {
    const kind = marbleTileEffect(event, tileIndex, landmark);
    if (sequence < previous.current || !event) setPulse({ kind: null, sequence, owner: undefined });
    else if (kind && isFreshMarbleCosmetic(event, previous.current)) setPulse({ kind, sequence, owner: event?.type === 'arrival' ? owner ?? 'bank' : event?.actor });
    previous.current = sequence;
  }, [sequence, event, tileIndex, landmark, owner]);
  // Presentation may advance to a turn after 300ms; let this cosmetic burst finish independently.
  return pulse.kind ? <><Burst key={`${pulse.sequence}:${pulse.kind}`} kind={pulse.kind} owner={pulse.owner}/>{pulse.kind === 'landmark' && celebrationCities[city] && <LandmarkMoment key={pulse.sequence} city={city} language={language}/>}</> : null;
}

/** Render only inside the confirmed result dialog; particles stay in its emblem area. */
export function MarbleVictoryEffects() { return <Burst kind="victory"/>; }
