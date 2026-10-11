import { useId } from 'react';
import '../styles/domino-tiles.css';

const pipPositions: number[][][] = [
  [],
  [[30, 32]],
  [[15, 17], [45, 47]],
  [[15, 17], [30, 32], [45, 47]],
  [[15, 17], [45, 17], [15, 47], [45, 47]],
  [[15, 17], [45, 17], [30, 32], [15, 47], [45, 47]],
  [[15, 17], [45, 17], [15, 32], [45, 32], [15, 47], [45, 47]],
];

type DominoTileProps = {
  left: number;
  right: number;
  back?: boolean;
  label?: string;
  vertical?: boolean;
};

export function DominoTile({ left, right, back = false, label, vertical = false }: DominoTileProps) {
  const id = useId().replace(/:/g, '');
  const gradient = (name: string) => `${id}-${name}`;
  const dots = (count: number, offset: number) => (pipPositions[count] ?? []).map(([x, y], index) => <g key={`${offset}-${count}-${index}`}>
    <circle className="domino-pip" cx={x + offset} cy={y} r="3.6" fill={`url(#${gradient('pip')})`} stroke="#271f21" strokeWidth=".7"/>
    <circle className="domino-pip-highlight" cx={x + offset - 1.1} cy={y - 1.35} r="1.15" fill="#fff" opacity=".62"/>
  </g>);

  return <div className={`domino-tile domino-tile--premium${back ? ' is-back' : ''}${vertical ? ' is-vertical' : ''}`} role="img" aria-label={label ?? (back ? 'Domino tile back' : `${left} | ${right}`)}>
    <svg className="domino-tile__art" viewBox={vertical ? '0 0 64 120' : '0 0 120 64'} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradient('resin')} x1=".05" y1="0" x2=".92" y2="1"><stop stopColor="#fffdf7"/><stop offset=".34" stopColor="#f8efde"/><stop offset=".76" stopColor="#e8d9c1"/><stop offset="1" stopColor="#cbb797"/></linearGradient>
        <linearGradient id={gradient('edge')} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#dbc6a4"/><stop offset=".5" stopColor="#b99e77"/><stop offset="1" stopColor="#8e7659"/></linearGradient>
        <linearGradient id={gradient('pip')} x1=".15" y1="0" x2=".8" y2="1"><stop stopColor="#4e4545"/><stop offset=".42" stopColor="#292427"/><stop offset="1" stopColor="#111014"/></linearGradient>
        <linearGradient id={gradient('brass')} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff3ca"/><stop offset=".32" stopColor="#d9b971"/><stop offset=".66" stopColor="#9c713e"/><stop offset="1" stopColor="#f4dda3"/></linearGradient>
        <filter id={gradient('shadow')} x="-20%" y="-30%" width="145%" height="180%"><feGaussianBlur stdDeviation="1.7"/></filter>
      </defs>
      <g transform={vertical ? 'translate(64 0) rotate(90)' : undefined}>
        <rect x="8" y="7" width="106" height="53" rx="8" fill="#342b29" opacity=".24" filter={`url(#${gradient('shadow')})`}/>
        <path d="M10 5h100a6 6 0 0 1 6 6v42a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6V11a6 6 0 0 1 6-6Z" fill={`url(#${gradient('edge')})`} stroke="#8f7759" strokeWidth="1"/>
        <path d="M10 2h100a6 6 0 0 1 6 6v40a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6V8a6 6 0 0 1 6-6Z" fill={`url(#${gradient('resin')})`} stroke="#fff9eb" strokeWidth="1.2"/>
        <path d="M12 5h96a4 4 0 0 1 4 4v36a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4Z" fill="none" stroke="#b39c7b" strokeOpacity=".56" strokeWidth=".8"/>
        {!back ? <>
          <path d="M60 8v37" stroke="#947e60" strokeOpacity=".58" strokeWidth="1.3"/>
          <path d="M61.2 8v37" stroke="#fffaf0" strokeOpacity=".8" strokeWidth=".7"/>
          {dots(left, 0)}{dots(right, 60)}
          <circle cx="60.5" cy="26.5" r="2.5" fill={`url(#${gradient('brass')})`} stroke="#86653d" strokeWidth=".6"/>
          <circle cx="59.8" cy="25.8" r=".8" fill="#fff4ce" opacity=".9"/>
        </> : <g className="domino-tile__engraving">
          <path d="M60 9v10m0 13v12" stroke="#a79070" strokeWidth=".8" strokeOpacity=".58"/>
          <path d="M60 21c-5 0-8 4-8 8 0 4 4 7 8 11 4-4 8-7 8-11 0-4-3-8-8-8Z" fill={`url(#${gradient('brass')})`} stroke="#a18457" strokeWidth=".8"/>
          <path d="m60 24 3 5-3 5-3-5z" fill="#f8edcf" stroke="#b3915f" strokeWidth=".6"/>
        </g>}
        <path d="M12 7c16-2 29-1 40 0" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity=".72"/>
      </g>
    </svg>
  </div>;
}
