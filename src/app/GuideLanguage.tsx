import type { Language } from '../core/types';

/** Guide language is independent of the room language and never changes gameplay. */
export function GuideLanguage({ language, onChange }: { language: Language; onChange: (language: Language) => void }) {
  return <div className="guide-language" role="group" aria-label="설명 언어 / Idioma de la guía">
    <span>설명 언어 · Idioma</span>
    <button type="button" lang="ko" aria-pressed={language === 'ko'} onClick={() => onChange('ko')}>한국어</button>
    <button type="button" lang="es" aria-pressed={language === 'es'} onClick={() => onChange('es')}>Español</button>
  </div>;
}
