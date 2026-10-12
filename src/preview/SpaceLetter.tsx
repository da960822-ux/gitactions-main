import { useEffect, useRef } from 'react';
import { previewCopy } from './copy';
import './space-letter.css';

type SpaceLetterProps = {
  language: 'ko' | 'es';
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export function SpaceLetter({ language, open, onOpen, onClose }: SpaceLetterProps) {
  const copy = previewCopy[language];
  const seal = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) close.current?.focus({ preventScroll: true });
    else if (wasOpen.current) seal.current?.focus({ preventScroll: true });
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <section
      id="gift-letter"
      className={`cs-letter-section${open ? ' is-open' : ''}`}
      aria-labelledby="gift-letter-heading"
    >
      <header className="cs-letter-heading">
        <span className="cs-letter-kicker">SEALED WITH LOVE</span>
        <h2 id="gift-letter-heading">{copy.letterTitle}</h2>
        <p>{open
          ? language === 'ko' ? '천천히 읽어줘, baby. 너에게 쓴 편지야.' : 'Lee con calma, baby. La escribí para ti.'
          : language === 'ko' ? '실링을 눌러, baby. 이 편지는 너한테만.' : 'Toca el sello, baby. Esta carta es solo para ti.'}</p>
      </header>

      <div className="cs-letter-stage">
        <article
          id="gift-letter-paper"
          className="cs-letter-paper"
          aria-hidden={!open}
          inert={!open}
        >
          <span className="cs-letter-paper-top">YEONSEOK → LISBETH <i aria-hidden="true">♡</i></span>
          <p className="cs-letter-address">{copy.address}</p>
          <h3>{copy.letterTitle}</h3>
          <div className="cs-letter-body" tabIndex={open ? 0 : -1}>
            {copy.letterBody.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <span className="cs-letter-signature">{copy.signature} ♡</span>
        </article>

        <button
          ref={seal}
          className="cs-letter-seal"
          aria-label={copy.secondary}
          aria-expanded={open}
          aria-controls="gift-letter-paper"
          disabled={open}
          onClick={onOpen}
        >
          <span>Y <i aria-hidden="true">♡</i> L</span>
          <small>{language === 'ko' ? '너에게' : 'PARA TI'}</small>
        </button>

        <figure className="cs-letter-rose">
          <img
            src="/images/landing-preview/organic-rose-generated.png"
            width="1024"
            height="1536"
            decoding="async"
            alt={copy.rose}
          />
          <figcaption>{language === 'ko' ? '먼저 여기서, baby.' : 'Primero aquí, baby.'}</figcaption>
        </figure>
      </div>

      <button
        ref={close}
        className="cs-letter-close"
        hidden={!open}
        onClick={onClose}
      >
        {copy.close}<span aria-hidden="true">×</span>
      </button>
    </section>
  );
}
