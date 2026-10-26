import type { ReactNode } from 'react';
import type { Language } from '../core/types';

export function MarbleBoardShell({tileCount,language,children}:{tileCount:number;language:Language;children:ReactNode}) {
  return <section className="mp-board-panel" aria-label={language==='ko'?`${tileCount}칸 순환 보드`:`Tablero de ${tileCount} casillas`}>
    <div className={`mp-board-grid ${tileCount===18?'mp-board-grid--18':'mp-board-grid--40'}`} role="list" aria-label={language==='ko'?`총 ${tileCount}칸 보드`:`Recorrido de ${tileCount} casillas`}>
      {children}
    </div>
  </section>;
}
