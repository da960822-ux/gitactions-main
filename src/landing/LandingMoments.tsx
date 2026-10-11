import { useState } from 'react';
import { Link } from '../app/Router';
import { landingCopy } from '../copy/home';
import './landing-moments.css';

type Language = 'ko' | 'es';

export function LandingMoments({ language }: { language: Language }) {
  const copy = landingCopy[language];
  const [letterOpen, setLetterOpen] = useState(true);

  return <div className="home-bottom wrap landing-moments">
    <section className="moment-notes" aria-labelledby="moment-notes-title">
      <h2 id="moment-notes-title">{copy.momentsTitle}</h2>
      <div className="moment-note-list">
        {copy.moments.map((moment, index) => <article className="moment-note" key={moment.title}>
          <h3>{moment.title}</h3>
          <p>{moment.body}</p>
          {index === 1 && <>
              <p className="moment-translation-limit">{copy.translationLimitNote}</p>
              <Link href="/play?game=catchmind" className="moment-catchmind-link">{copy.catchmindAction} <span aria-hidden="true">↗</span></Link>
          </>}
          {index === 2 && <Link href="/feedback" className="moment-feedback-link">{copy.ideasAction} <span aria-hidden="true">↗</span></Link>}
        </article>)}
      </div>
    </section>

    <section id="papi-letter" className="moment-letter" aria-labelledby="moment-letter-title">
      <div className={`moment-paper${letterOpen ? ' is-open' : ''}`}>
        <div className="moment-paper-top">
          <span className="moment-letter-address">{copy.letterAddress}</span>
          <button type="button" className="moment-fold-button" aria-expanded={letterOpen} aria-controls="moment-letter-copy" onClick={() => setLetterOpen(open => !open)}>
            <svg className="moment-envelope" viewBox="0 0 80 48" aria-hidden="true">
              <path d="M4 7.5A3.5 3.5 0 0 1 7.5 4h65A3.5 3.5 0 0 1 76 7.5v33a3.5 3.5 0 0 1-3.5 3.5h-65A3.5 3.5 0 0 1 4 40.5z" />
              <path d="m5 7 35 25L75 7M5 41l24-19m46 19L51 22" />
              <path className="moment-envelope-flap" d="m5 7 35 25L75 7" />
            </svg>
            <span>{letterOpen ? copy.foldLetter : copy.openLetter}</span>
          </button>
        </div>
        <div id="moment-letter-copy" className="moment-letter-copy" aria-hidden={!letterOpen}>
          <h2 id="moment-letter-title">{copy.letterTitle}</h2>
          {copy.letterBody.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          <span className="moment-signature">{copy.letterSignature}</span>
        </div>
      </div>
    </section>
  </div>;
}
