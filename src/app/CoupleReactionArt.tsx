import {useId} from 'react';

export type CoupleReaction = 'yeonseok' | 'lisbeth';
type Props={reaction:CoupleReaction;alt:string;onError?:()=>void};

/** Shared artwork only; callers own result rules, conditional copy and error behavior. */
export function CoupleReactionArt({reaction,alt,onError}:Props){
 const id=useId();
 return <svg viewBox="0 0 1672 941" role="img" aria-labelledby={`${id}-title`}>
      <title id={`${id}-title`}>{alt}</title>
      <defs>
        <filter id={`${id}-people`} filterUnits="userSpaceOnUse" x="0" y="0" width="1672" height="941" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1 -1 -1 0 0"/>
          <feMorphology operator="dilate" radius="1"/>
        </filter>
        <filter id={`${id}-new-pose`} filterUnits="userSpaceOnUse" x="0" y="0" width="1672" height="941" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1 0 0 0 0"/>
        </filter>
        <mask id={`${id}-reaction`} maskUnits="userSpaceOnUse" x="0" y="0" width="1672" height="941" style={{ maskType: 'alpha' }}>
          {/* Union clears the original arms while preserving the new pose outside the old silhouette. */}
          <image href="/images/approved-couple-room/foreground-semantic-mask.png" width="1672" height="941" preserveAspectRatio="none" filter={`url(#${id}-people)`} onError={onError}/>
          <image href={`/images/approved-couple-room/result-${reaction}-mask.png`} width="1672" height="941" preserveAspectRatio="none" filter={`url(#${id}-new-pose)`} onError={onError}/>
        </mask>
      </defs>
      <image href="/images/approved-couple-room/approved-couple-gaming-room.png" width="1672" height="941" onError={onError}/>
      <image href={`/images/approved-couple-room/result-${reaction}-wins.png`} width="1672" height="941" mask={`url(#${id}-reaction)`} onError={onError}/>
    </svg>;
}
