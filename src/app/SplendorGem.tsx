import { useState } from 'react';

const gemFamily = ['white', 'blue', 'green', 'red', 'black', 'gold'];

export function SplendorGem({ gem }: { gem: string }) {
  const color = gemFamily.includes(gem) ? gem : 'white';
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const source = `/images/splendor-gems/${color}.svg`;
  return <span className={`sp-gem-icon sp-color-${color}`} aria-hidden="true">
    {failedSource === source ? <span className="sp-gem-fallback">{color === 'gold' ? '●' : '◆'}</span>
      : <img src={source} alt="" width="64" height="64" draggable="false" onError={() => setFailedSource(source)}/>}
  </span>;
}
