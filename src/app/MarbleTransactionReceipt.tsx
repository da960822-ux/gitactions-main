import type { Language } from '../core/types';
import { moneyText } from './marble-visuals';

/** The settled line stays after the short event animation ends. */
export function MarbleTransactionReceipt({ title, detail, flow, delta, language }: {
  title: string; detail: string; flow?: string; delta?: number; language: Language;
}) {
  return <div className="mp-center-receipt" aria-live="polite" aria-atomic="true">
    <b>{title}</b>
    {flow && <span>{flow}</span>}
    <span>{detail}</span>
    {delta !== undefined && delta !== 0 && <strong>{language === 'ko' ? '내 현금' : 'Tu efectivo'} {delta > 0 ? '+' : ''}{moneyText(delta, language)}</strong>}
  </div>;
}
