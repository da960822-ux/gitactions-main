import type { GameId } from '../core/types';

export function GameArt({ id }: { id: GameId }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (id) {
    case 'davinci': return <svg viewBox="0 0 48 48" {...common}><rect x="8" y="11" width="32" height="27" rx="7"/><path d="M18 11l4-5h5l4 5M24 12v25M15 23h4m10 0h4M15 30h4m10 0h4"/></svg>;
    case 'catchmind': return <svg viewBox="0 0 48 48" {...common}><path d="M10 34l4-10L31 7l9 9-17 17-13 4zM14 24l9 9m9-22l9 9M11 41h27"/><circle cx="28" cy="22" r="2" fill="currentColor"/></svg>;
    case 'domino': return <svg viewBox="0 0 48 48" {...common}><rect x="7" y="10" width="34" height="28" rx="7"/><path d="M24 11v26"/><circle cx="15" cy="19" r="1.7" fill="currentColor"/><circle cx="19" cy="29" r="1.7" fill="currentColor"/><circle cx="30" cy="19" r="1.7" fill="currentColor"/><circle cx="35" cy="29" r="1.7" fill="currentColor"/></svg>;
    case 'jaipur': return <svg viewBox="0 0 48 48" {...common}><path d="M9 29l4-12 11-5 11 5 4 12-6 7H15zM14 17l-3-5m23 5l3-5M17 26h.1m14 0h.1M20 36v4m8-4v4"/><path d="M20 30c3 2 5 2 8 0"/></svg>;
    case 'splendor': return <svg viewBox="0 0 48 48" {...common}><path d="M24 5l16 12-6 22H14L8 17zM24 5v34M8 17h32M14 39l10-13 10 13"/></svg>;
    case 'minhwatu': return <svg viewBox="0 0 48 48" {...common}><path d="M24 5v38M5 24h38M11 11l26 26m0-26L11 37"/><circle cx="24" cy="24" r="7"/><circle cx="24" cy="5" r="2" fill="currentColor"/><circle cx="43" cy="24" r="2" fill="currentColor"/></svg>;
    case 'marble': return <svg viewBox="0 0 48 48" {...common}><path d="M6 9h14v12H6zM28 6h14v12H28zM28 30h14v12H28zM6 30h14v12H6zM20 15h8v-3m0 24h-8v-3"/><circle cx="24" cy="24" r="4" fill="currentColor" stroke="none"/></svg>;
    case 'rhythm': return <svg viewBox="0 0 48 48" {...common}><path d="M8 29c4-13 9-13 13 0s9 13 13 0 8-13 12 0M11 40h27M15 11v6m18-6v6"/></svg>;
  }
}
