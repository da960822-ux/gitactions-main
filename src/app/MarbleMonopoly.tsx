import type { Language } from '../core/types';
import { groups as groupNames } from './marble-visuals';
import './marble-monopoly.css';

type Tile = { name?: { ko?: string; es?: string }; kind?: string; group?: string; owner?: string | null; monopolyMultiplier?: number };
export type MarbleMonopolyGroup = { group: string; owner: string; tiles: number[]; remaining: number[]; complete: boolean; multiplier: number | null };

/** Ownership, not allied team totals, completes a group in both existing engines. */
export function marbleMonopolyGroups(tiles: readonly Tile[], enabled: boolean): MarbleMonopolyGroup[] {
  if (!enabled) return [];
  const groups = new Map<string, number[]>();
  tiles.forEach((tile, index) => {
    if (tile.kind !== 'property' || !tile.group) return;
    groups.set(tile.group, [...(groups.get(tile.group) ?? []), index]);
  });
  const result: MarbleMonopolyGroup[] = [];
  for (const [group, indices] of groups) {
    if (indices.length < 2) continue;
    const owners = [...new Set(indices.map(index => tiles[index].owner).filter((owner): owner is string => typeof owner === 'string' && /^p[1-4]$/.test(owner)))].sort();
    for (const owner of owners) {
      const remaining = indices.filter(index => tiles[index].owner !== owner);
      if (remaining.length > 1) continue;
      const multipliers = indices.map(index => tiles[index].monopolyMultiplier);
      const multiplier = remaining.length === 0 && multipliers.every(value => typeof value === 'number' && Number.isFinite(value) && value === multipliers[0]) ? multipliers[0]! : null;
      result.push({ group, owner, tiles: indices, remaining, complete: remaining.length === 0, multiplier });
    }
  }
  return result;
}

export function marbleMonopolyThreats(groups: readonly MarbleMonopolyGroup[], playerId: string, teammateSeat?: string | null) {
  return groups.filter(group => !group.complete && group.owner !== playerId && group.owner !== teammateSeat);
}
const worldGroupNames: Record<string, Record<Language,string>> = {
 'world-g1':{ko:'연두',es:'Lima'},'world-g2':{ko:'초록',es:'Verde'},'world-g3':{ko:'하늘',es:'Cian'},'world-g4':{ko:'파랑',es:'Azul'},'world-g5':{ko:'분홍',es:'Rosa'},'world-g6':{ko:'보라',es:'Violeta'},'world-g7':{ko:'주황',es:'Naranja'},'world-g8':{ko:'빨강',es:'Rojo'},
};
export const marbleMonopolyGroupName = (group: string, language: Language) => `${worldGroupNames[group]?.[language] ?? groupNames[group]?.[language] ?? group}${language === 'ko' ? ' 색상군' : ' · grupo'}`;

export function marbleOwnershipProgress(tiles: readonly Tile[], seats: readonly string[], boardProfile?: string) {
  if (boardProfile !== 'world-islands-32-v1' || tiles.length !== 32) return [];
  const tourism = tiles.flatMap((tile, index) => tile.kind === 'tourism' ? [index] : []);
  const colors = [...new Set(tiles.filter(tile => tile.kind === 'property' && tile.group).map(tile => tile.group!))];
  const lines = [0, 1, 2, 3].map(side => tiles.flatMap((tile, index) => Math.floor(index / 8) === side && (tile.kind === 'property' || tile.kind === 'tourism') ? [index] : []));
  return seats.map(owner => {
    const colorGroups = colors.map(group => ({ group, missing: tiles.flatMap((tile, index) => tile.kind === 'property' && tile.group === group && tile.owner !== owner ? [index] : []) }));
    const completedColors = colorGroups.filter(group => !group.missing.length).length;
    const colorMissing = colorGroups.filter(group => group.missing.length).sort((a,b) => a.missing.length - b.missing.length).slice(0, Math.max(0, 3 - completedColors)).flatMap(group => group.missing);
    const touristMissing = tourism.filter(index => tiles[index].owner !== owner);
    const closestLine = lines.map((indices, side) => ({ side, required: indices.length, missing: indices.filter(index => tiles[index].owner !== owner) })).filter(line => line.required > 0).sort((a,b) => a.missing.length - b.missing.length || a.side - b.side)[0];
    return { owner, completedColors, colorMissing, tourismRequired: tourism.length, touristMissing, closestLine };
  });
}

/** Stable ownership-derived text; no turn-triggered toast, timer or audio. */
export function MarbleMonopolyStatus({ groups, playerId, teammateSeat, language, seatLabel, tiles = [], seats = [], boardProfile, boardRevision }: { groups: MarbleMonopolyGroup[]; playerId: string; teammateSeat?: string | null; language: Language; seatLabel: (seat: any) => string; tiles?: readonly Tile[]; seats?: readonly string[]; boardProfile?: string; boardRevision?: number }) {
  const threats = marbleMonopolyThreats(groups, playerId, teammateSeat);
  const complete = groups.filter(group => group.complete);
  const progress = marbleOwnershipProgress(tiles, seats, boardProfile);
  if (!threats.length && !complete.length && !progress.length) return null;
  const ko = language === 'ko';
  const names = (indices: number[]) => indices.map(index => tiles[index].name?.[language] ?? `${index + 1}`).join(', ');
  const near = progress.flatMap(p => {
    if (p.owner === playerId || p.owner === teammateSeat) return [];
    return [p.colorMissing.length === 1 ? (ko ? '컬러 3군' : '3 colores') : '', p.tourismRequired > 0 && p.touristMissing.length === 1 ? (ko ? '관광지' : 'Turismo') : '', p.closestLine?.missing.length === 1 ? (ko ? '라인' : 'Línea') : ''].filter(Boolean).map(goal => `${seatLabel(p.owner)} · ${goal}`);
  });
  return <section className="mp-monopoly-status" aria-label={ko ? '독점 현황과 승리 조건' : 'Monopolios y objetivos de victoria'}>
    {progress.length > 0 && <>
      <b>{ko ? '독점 승리 · 한 사람이 완성' : 'Victoria · completar individualmente'}</b>
      <div role="status" aria-live="polite" aria-atomic="true">{near.length > 0 && <p className="mp-monopoly-danger"><b>{ko ? '승리 위험 · 1칸 남음' : 'Riesgo de victoria · falta 1 casilla'}</b>: {near.join(' / ')}</p>}</div>
      {progress.map(p => <details className="mp-monopoly-progress" key={p.owner}>
        <summary><b>{seatLabel(p.owner)}</b> · {ko ? '컬러' : 'Color'} {p.completedColors}/3 · {ko ? '관광' : 'Islas'} {p.tourismRequired-p.touristMissing.length}/{p.tourismRequired} · {ko ? '라인' : 'Línea'} {p.closestLine ? `${p.closestLine.required-p.closestLine.missing.length}/${p.closestLine.required}` : '—'}</summary>
        <p>{ko ? '컬러 3군 승리까지' : 'Hasta 3 grupos'}: {p.colorMissing.length ? `${p.colorMissing.length}${ko ? '칸' : ' casillas'} · ${names(p.colorMissing)}` : (ko ? '완성' : 'Completo')}</p>
        <p>{ko ? '관광지 전체까지' : 'Hasta todas las islas'}: {p.touristMissing.length ? `${p.touristMissing.length}${ko ? '칸' : ' casillas'} · ${names(p.touristMissing)}` : (ko ? '완성' : 'Completo')}</p>
        {p.closestLine && <p>{ko ? `가장 가까운 ${p.closestLine.side+1}번 라인` : `Línea más cercana ${p.closestLine.side+1}`} · {p.closestLine.missing.length ? `${ko ? '남은 칸' : 'Faltan'}: ${names(p.closestLine.missing)}` : (ko ? '완성' : 'Completo')}</p>}
      </details>)}
      <p>{(boardRevision === 3 || boardRevision === 4) ? (ko ? '컬러 3군 완성은 즉시 승리 · 색상 통행료 보너스 없음' : '3 grupos: victoria inmediata · sin bono de alquiler por color') : (ko ? '컬러 1군은 통행료 보너스 · 3군 완성은 승리' : '1 grupo: bono de alquiler · 3 grupos: victoria')}</p>
    </>}
    <div role="status" aria-live="polite" aria-atomic="true">{threats.length > 0 && <p className="mp-monopoly-danger"><b>{(boardRevision === 3 || boardRevision === 4) ? (ko ? '색상군 완성 임박' : 'Grupo de color casi completo') : (ko ? '색상 보너스 위험' : 'Riesgo de bono de color')}</b> · {threats.map(group => `${seatLabel(group.owner)} · ${marbleMonopolyGroupName(group.group, language)} ${ko ? '1도시 남음' : 'a 1 ciudad'}`).join(' / ')}</p>}</div>
    {complete.length > 0 && <p className="mp-monopoly-complete">{complete.map(group => `${seatLabel(group.owner)} · ${marbleMonopolyGroupName(group.group, language)} ${ko ? '독점' : 'completo'}${group.multiplier !== null && group.multiplier > 1 ? ` · ${ko ? '통행료' : 'alquiler'} ×${group.multiplier}` : ''}`).join(' / ')}</p>}
  </section>;
}
