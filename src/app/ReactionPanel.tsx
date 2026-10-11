import type { ReactElement, ReactNode } from 'react';
import type { Language, PlayerId } from '../core/types';
import { reactionEmoji, reactionForText, type ReactionId } from '../core/reactions';
import './reaction-panel.css';

type ReactionMessage = { id: string; playerId: PlayerId; text: string; createdAt: string };
type ReactionPlayer = { id: PlayerId; nickname: string };

const reactions: { id: ReactionId; ko: string; es: string; Icon: () => ReactElement }[] = [
  { id: 'heart', ko: '좋아요', es: 'Me encanta', Icon: HeartIcon },
  { id: 'laugh', ko: '웃겨요', es: 'Me da risa', Icon: LaughIcon },
  { id: 'applause', ko: '박수', es: 'Aplausos', Icon: ApplauseIcon },
  { id: 'wow', ko: '놀랐어요', es: 'Qué sorpresa', Icon: WowIcon },
  { id: 'sad', ko: '아쉬워요', es: 'Qué pena', Icon: SadIcon },
];

export function ReactionPanel({ language, playerId, players, messages, sending, error, onSend }: {
  language: Language;
  playerId: PlayerId;
  players: ReactionPlayer[];
  messages: ReactionMessage[];
  sending: boolean;
  error: string;
  onSend: (reaction: ReactionId) => void;
}) {
  const recent = messages.filter(message => reactionForText(message.text)).slice(-12);
  return <div className="reaction-panel-content">
    <div className="reaction-picker" role="group" aria-label={language === 'ko' ? '기분 반응 보내기' : 'Enviar una reacción'}>
      {reactions.map(({ id, ko, es, Icon }) => <button key={id} type="button" className={`reaction-button reaction-${id}`} aria-label={language === 'ko' ? ko : es} title={language === 'ko' ? ko : es} disabled={sending} onClick={() => onSend(id)}>
        <Icon/>
      </button>)}
    </div>
    {error && <p className="reaction-error" role="alert">{error}</p>}
    <div className="reaction-history" aria-live="polite" aria-label={language === 'ko' ? '최근 반응' : 'Reacciones recientes'}>
      {recent.length === 0 ? <p className="reaction-empty">{language === 'ko' ? '반응을 골라 보내 보세요.' : 'Elige una reacción para enviarla.'}</p> : recent.map(message => {
        const id = reactionForText(message.text)!;
        const reaction = reactions.find(item => item.id === id)!;
        const sender = players.find(player => player.id === message.playerId);
        return <div className={`reaction-entry ${message.playerId === playerId ? 'mine' : ''}`} key={message.id} title={`${reactionEmoji[id]} · ${sender?.nickname ?? ''} · ${language === 'ko' ? reaction.ko : reaction.es}`}>
          <span className={`reaction-sticker reaction-${id}`} aria-hidden="true"><reaction.Icon/></span>
          <span className="reaction-sender">{sender?.nickname ?? (message.playerId === playerId ? (language === 'ko' ? '나' : 'Tú') : (language === 'ko' ? '상대' : 'Rival'))}</span>
          <time>{formatTime(message.createdAt, language)}</time>
        </div>;
      })}
    </div>
  </div>;
}

function formatTime(value: string, language: Language) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? '' : date.toLocaleTimeString(language === 'ko' ? 'ko-KR' : 'es-DO', { hour: '2-digit', minute: '2-digit' });
}

function IconFrame({ children }: { children: ReactNode }) {
  return <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">{children}</svg>;
}
function HeartIcon() { return <IconFrame><path d="M16 26s-10-6.3-10-13a5.5 5.5 0 0 1 10-3.2A5.5 5.5 0 0 1 26 13c0 6.7-10 13-10 13Z"/><path className="icon-shine" d="M9 13c.2-2 1.4-3.2 3-3.5"/></IconFrame>; }
function LaughIcon() { return <IconFrame><circle cx="16" cy="16" r="11"/><path d="M11 13h.1M21 13h.1M10.5 18c1.3 3 3.1 4.5 5.5 4.5s4.2-1.5 5.5-4.5Z"/></IconFrame>; }
function ApplauseIcon() { return <IconFrame><path d="M7 17 16 7a2 2 0 0 1 3 2.6l-1 1.2 1.5-1.2a2 2 0 0 1 2.5 3.1l-1.6 1.3 1.2-.7a2 2 0 0 1 2 3.4l-5.5 3.8a7 7 0 0 1-8-.1L7 19a1.5 1.5 0 0 1 0-2Z"/><path d="m5 12-2-1m5-4L7 4m1 14 9 8M25 7l2-2M26 12l3-1"/></IconFrame>; }
function WowIcon() { return <IconFrame><circle cx="16" cy="16" r="11"/><path d="M11 12h.1M21 12h.1"/><ellipse cx="16" cy="20" rx="2.4" ry="3.1"/></IconFrame>; }
function SadIcon() { return <IconFrame><circle cx="16" cy="16" r="11"/><path d="M11 13h.1M21 13h.1M11 22c1-2 2.7-3 5-3s4 1 5 3"/><path className="icon-tear" d="M24 10c0 1.3-.8 2-1.6 2s-1.4-.7-1.4-1.8 1.4-3.2 1.4-3.2 1.6 1.7 1.6 3Z"/></IconFrame>; }
