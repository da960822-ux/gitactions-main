import { useState, type ReactNode } from 'react';
import type { MarbleEventId } from '../games/marble';
import artManifest from '../../public/images/marble/events/manifest.json';

export type MarbleEventFamily = 'cash' | 'movement' | 'city' | 'protection';

export const marbleEventFamilyById = {
  festival: 'cash',
  lottery: 'cash',
  'rent-rebate': 'cash',
  'city-dividend': 'cash',
  'visit-santo-domingo': 'movement',
  retreat: 'movement',
  'advance-start': 'movement',
  'train-ticket': 'movement',
  'go-to-island': 'movement',
  'travel-cost': 'city',
  maintenance: 'city',
  'monopoly-warning': 'city',
  'city-festival': 'city',
  blackout: 'city',
  'escape-pass': 'protection',
  'rent-pass': 'protection',
} satisfies Record<MarbleEventId, MarbleEventFamily>;

export function marbleEventArtFamily(cardId: unknown): MarbleEventFamily | null {
  return typeof cardId === 'string' && Object.hasOwn(marbleEventFamilyById, cardId)
    ? marbleEventFamilyById[cardId as MarbleEventId]
    : null;
}

export function marbleEventArtPath(cardId: unknown): string | null {
  const family = marbleEventArtFamily(cardId);
  return family ? artManifest.families[family].path : null;
}

export function MarbleEventArt({ cardId, fallback }: { cardId: unknown; fallback: ReactNode }) {
  const [failed, setFailed] = useState(false);
  const family = marbleEventArtFamily(cardId);
  const src = marbleEventArtPath(cardId);
  if (!src || !family || failed) return <span className="marble-event-card-art-pending" data-art-pending={family ?? 'unknown'}>{fallback}</span>;
  return <img
    className="marble-event-card-art"
    data-event-family={family}
    src={src}
    alt=""
    aria-hidden="true"
    width={96}
    height={120}
    loading="lazy"
    decoding="async"
    onError={() => setFailed(true)}
  />;
}
