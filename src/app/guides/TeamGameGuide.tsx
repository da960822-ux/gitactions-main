import { useState, useEffect, type ReactNode } from 'react';
import type { GameId, Language } from '../../core/types';
import { GuideLanguage } from '../GuideLanguage';
import { GameTutorial, getGameTutorial } from './GameTutorial';

export function TeamGameGuide({gameId, language: initialLanguage, current = true, boardRevision = 4, festivalRulesVersion = 2, rentRulesVersion = 2, loanRulesVersion = 2, constructionPriceRulesVersion = 2, eventVersion = 4, children}: {
  gameId: GameId; language: Language; current?: boolean; boardRevision?:number; festivalRulesVersion?:number; rentRulesVersion?:number; loanRulesVersion?:number; constructionPriceRulesVersion?:number; eventVersion?:number; children: (language: Language) => ReactNode;
}) {
  const [language, setLanguage] = useState(initialLanguage);
  useEffect(() => setLanguage(initialLanguage), [initialLanguage]);
  const tutorial = current && getGameTutorial(gameId, language, true, boardRevision, rentRulesVersion, loanRulesVersion, constructionPriceRulesVersion);
  return <div className="team-game-guide" lang={language === 'ko' ? 'ko' : 'es'}><GuideLanguage language={language} onChange={setLanguage}/>
    {tutorial ? <><GameTutorial gameId={gameId} language={language} uiLanguage={initialLanguage} boardRevision={boardRevision} festivalRulesVersion={festivalRulesVersion} rentRulesVersion={rentRulesVersion} loanRulesVersion={loanRulesVersion} constructionPriceRulesVersion={constructionPriceRulesVersion} eventVersion={eventVersion} teamMode/><details className="guide-details"><summary>{language === 'ko' ? '팀전 세부 규칙 보기' : 'Reglas detalladas por equipos'}</summary>{children(language)}</details></> : children(language)}
  </div>;
}
