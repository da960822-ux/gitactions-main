import { useState } from 'react';

const gemFamily = ['white', 'blue', 'green', 'red', 'black', 'gold'];

export function SplendorGem({ gem }: { gem: string }) {
  const color = gemFamily.includes(gem) ? gem : 'white';
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const source = `/images/splendor-gems/${color}.svg`, premium = `/images/game-premium-tokens/splendor/${color}.webp`;
  return <span className={`sp-gem-icon sp-color-${color}`} aria-hidden="true">
    {failedSource === source ? <span className="sp-gem-fallback">{color === 'gold' ? '●' : '◆'}</span>
      : <picture>
        {failedSource !== premium && <source media="(min-width: 1024px) and (hover: hover) and (pointer: fine)" type="image/webp" srcSet={premium}/>}
        <img src={source} alt="" width="64" height="64" draggable="false" onError={event => setFailedSource(event.currentTarget.currentSrc.includes('/game-premium-tokens/') ? premium : source)}/>
      </picture>}
  </span>;
}
