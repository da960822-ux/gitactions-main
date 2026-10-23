import {useState} from 'react';
import {CoupleReactionArt,type CoupleReaction} from '../../app/CoupleReactionArt';
import './duel-illustration.css';

export function DuelIllustration({language}:{language:'ko'|'es'}){
 const ko=language==='ko';
 const [reaction,setReaction]=useState<CoupleReaction>('lisbeth');
 const [animate,setAnimate]=useState(false),[failed,setFailed]=useState(false);
 const choices=[{id:'lisbeth' as const,label:ko?'네가 이기면':'Si ganas tú',alt:ko?'네가 이기면: 리스벳은 메롱하며 웃고, 연석은 턱을 괴고 뾰로통한 표정.':'Si ganas tú: Lisbeth sonríe sacando la lengua y Yeonseok hace pucheros, con la barbilla en la mano.'},{id:'yeonseok' as const,label:ko?'내가 이기면':'Si gano yo',alt:ko?'내가 이기면: 연석은 박수치며 웃고, 리스벳은 노트북 앞에서 답답해하는 표정.':'Si gano yo: Yeonseok sonríe aplaudiendo y Lisbeth se ve frustrada frente a su portátil.'}];
 return <div className="duel-illustration" data-reaction={reaction} data-animate={animate}>
  <div className="duel-illustration-stage">
   {!failed&&<img className="duel-illustration-room" src="/images/approved-couple-room/approved-couple-gaming-room.png" alt="" aria-hidden="true"/>}
   {failed?<img className="duel-illustration-fallback" src="/images/approved-couple-room/approved-couple-gaming-room.png" alt={ko?'각자의 책상에서 게임하는 연석과 리스벳':'Yeonseok y Lisbeth jugando desde sus escritorios'}/>:<div className="duel-illustration-reactions">{choices.map(choice=><div key={choice.id} className="duel-illustration-layer" data-active={reaction===choice.id} aria-hidden={reaction!==choice.id}><CoupleReactionArt reaction={choice.id} alt={choice.alt} onError={()=>setFailed(true)}/></div>)}</div>}
  </div>
  {failed&&<p className="duel-illustration-error" role="status">{ko?'그림을 다시 보려면 아래에서 골라줘.':'Elige una opción abajo para volver a cargar la ilustración.'}</p>}
  <div className="duel-illustration-choices" role="group" aria-label={ko?'이기면 어떤 표정일까?':'¿Qué cara pondríamos al ganar?'}>
   {choices.map(choice=><button key={choice.id} type="button" aria-pressed={reaction===choice.id} onClick={event=>{setAnimate(event.detail>0);setReaction(choice.id);setFailed(false);}}>{choice.label}</button>)}
  </div>
 </div>;
}
