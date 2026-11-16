import type { ReactNode } from 'react';
import type { Language } from '../core/types';

export function MarbleBoardShell({tileCount,language,children}:{tileCount:number;language:Language;children:ReactNode}) {
  const grid=<div className={`mp-board-grid mp-board-grid--${tileCount===18?18:tileCount===32?32:40}`} role="list" aria-label={language==='ko'?`총 ${tileCount}칸 보드`:`Recorrido de ${tileCount} casillas`}>{children}</div>;
  return <section className="mp-board-panel" aria-label={language==='ko'?`${tileCount}칸 순환 보드`:`Tablero de ${tileCount} casillas`}>
    {tileCount>=32?<div className="mp-table-projection">{grid}</div>:grid}
  </section>;
}
