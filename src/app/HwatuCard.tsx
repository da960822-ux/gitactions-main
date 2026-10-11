import type { Language } from '../core/types';
import '../styles/hwatu-card-premium.css';

type Value = Record<string, any>;
const copy = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;
const safeRecord = (value: unknown): Value => value && typeof value === 'object' && !Array.isArray(value) ? value as Value : {};

const monthFlowers = ['솔 / pino', '매화 / ciruelo', '벚꽃 / cerezo', '등꽃 / glicinia', '창포 / iris', '모란 / peonía', '싸리 / trébol', '억새 / pampas', '국화 / crisantemo', '단풍 / arce', '오동 / paulownia', '비 / lluvia'];
const kinds: Record<string, { ko: string; es: string }> = {
  gwang: { ko: '광', es: 'brillante' }, bright: { ko: '광', es: 'brillante' }, 광: { ko: '광', es: 'brillante' },
  animal: { ko: '열끗', es: 'animal' }, yeolkkeut: { ko: '열끗', es: 'animal' }, 열끗: { ko: '열끗', es: 'animal' },
  ribbon: { ko: '띠', es: 'cinta' }, tti: { ko: '띠', es: 'cinta' }, 띠: { ko: '띠', es: 'cinta' },
  junk: { ko: '피', es: 'simple' }, pi: { ko: '피', es: 'simple' }, 피: { ko: '피', es: 'simple' }, plain: { ko: '피', es: 'simple' }, special: { ko: '특수', es: 'especial' },
};
export function HwatuCard({ card, language }: { card: Value; language: Language }) {
  const month = Math.max(1, Math.min(12, Number(card.month ?? 1)));
  const flowerValue = safeRecord(card.flower);
  const flower = typeof card.flower === 'string'
    ? card.flower.split(' / ')[language === 'ko' ? 0 : 1]
    : flowerValue[language] ?? monthFlowers[month - 1].split(' / ')[language === 'ko' ? 0 : 1];
  const kind = safeRecord(kinds[String(card.kind ?? '').toLowerCase()]);
  const label = language === 'ko' ? kind.ko : kind.es;
  const badgeValue = safeRecord(card.badge);
  const badge = badgeValue[language] ?? '';
  const id = /^(?:[1-9]|1[0-2])-[1-4]$/.test(String(card.id)) ? String(card.id) : null;
  const face = id ? `/images/hwatu/${id.split('-').map(part => part.padStart(2, '0')).join('-')}.svg` : null;
  const description = `${copy(language, `${month}월`, `Mes ${month}`)} · ${flower} · ${badge || label} · ${Number(card.points ?? 0)} ${copy(language, '점', 'pts')}`;
  return <article className={`gb-hwatu-card gb-hwatu-card-premium gb-hwatu-month-${month}`} title={description} aria-label={description} role="img">
    {face && <img className="gb-hwatu-face gb-hwatu-face-premium" src={face} width="103" height="168" alt="" aria-hidden="true"/>}
    <span className="gb-hwatu-month-tag" aria-hidden="true">{copy(language, `${month}월`, `Mes ${month}`)}</span>
  </article>;
}
