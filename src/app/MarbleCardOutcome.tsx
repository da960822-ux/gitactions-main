import {constructionLabel} from './marble-decision';
import {moneyText,buildingName} from './marble-visuals';
import {marbleEventText} from './marble-event-text';
import type {Language} from '../core/types';
import type {MarbleEventId} from '../games/marble';
import {MarbleEventArt,marbleEventArtFamily} from './MarbleEventArt';
import {marbleCardCopy} from './marble-card-copy';
import './marble-card-decision.css';
export function currentCardOutcome(events:any[]){
 const boundary=events.map(event=>event.type==='turn'||event.type==='roll').lastIndexOf(true);
 const current=events.slice(boundary+1),card=[...current].reverse().find(event=>event.type==='event-card'&&marbleEventArtFamily(event.cardId??event.id));
 if(!card)return null;
 const result=[...current].reverse().find(event=>event.sequence>=card.sequence&&!['roll','move','pawn','turn','arrival'].includes(event.type))??card;
 return {card,result};
}
export function MarbleCardOutcome({outcome,language,economicVersion,constructionRulesVersion,onContinue,disabled,actorName,names,waiting,pendingCount=1,passSalary}: {outcome:NonNullable<ReturnType<typeof currentCardOutcome>>;language:Language;economicVersion:number;constructionRulesVersion?:number;onContinue:()=>void;disabled:boolean;actorName?:string;names?:Record<string,string>;waiting?:string;pendingCount?:number;passSalary?:number}){
 const {card,result}=outcome,id=(card.cardId??card.id) as MarbleEventId,copy=marbleCardCopy(id,language,economicVersion,constructionRulesVersion===2,passSalary),ko=language==='ko';
 const detail=marbleEventText(result.text?.[language],language,names),hasResult=result!==card||/없|불가|sin |no hay|ningun|ningún/i.test(detail)||result.tile!==undefined||result.cardOutcome==='no-effect'||result.blockedByShield;
 const construction=(value:any)=>constructionLabel(value,language)||buildingName(value.houses??0,language,true)||(ko?'빈 땅':'Terreno vacío');
 return <article lang={language} className="mp-card-decision mp-card-outcome" data-card-sequence={card.sequence} aria-label={copy.name}><figure key={card.sequence} className="mp-card-illustration mp-card-draw-reveal"><MarbleEventArt cardId={id} fallback={<svg viewBox="0 0 128 160"><use href="/images/marble/golden-key-cards.svg#festival"/></svg>}/></figure><header><div><small>{ko?'이번 황금 열쇠':'Carta de llave dorada'}{actorName&&` · ${actorName}`}</small><h2>{copy.name}</h2>{pendingCount>1&&<small>{ko?`확인할 카드 ${pendingCount}장`:`${pendingCount} cartas por revisar`}</small>}</div></header><p className="mp-card-effect">{copy.effect}</p><dl><div><dt>{ko?'대상':'Objetivo'}</dt><dd>{copy.target}</dd></div><div><dt>{ko?'기간':'Duración'}</dt><dd>{copy.duration}</dd></div></dl>{hasResult&&<section className="mp-card-consequence"><strong>{(result.cardOutcome==='pending-payment'||result.type==='crisis')?(ko?'지급 대기 · 결제가 필요합니다':'Pago pendiente'):(result.cardOutcome==='paid'||result.cardOutcome===undefined&&Object.values(result.moneyDelta??{}).some(value=>typeof value==='number'&&value!==0))?(ko?'거래 처리 완료':'Transacción completada'):(ko?'처리 결과':'Resultado')}</strong><p>{detail||result.title?.[language]}</p>{result.blockedByShield&&<b>{ko?'도시 방어권 1 → 0 · 도시·현금 변화 없음':'Escudo 1 → 0 · ciudad y efectivo sin cambios'}</b>}{result.constructionBefore&&!result.blockedByShield&&<b>{construction(result.constructionBefore)} → {result.constructionAfter?construction(result.constructionAfter):(ko?'은행 소유 · 빈 땅':'Del banco · terreno vacío')}</b>}{Object.entries(result.moneyDelta??{}).filter(([,value])=>typeof value==='number'&&value!==0).map(([seat,value])=><span key={seat}>{names?.[seat]??seat} · {Number(value)>0?'+':''}{moneyText(Number(value),language)} {ko?(Number(value)>0?'수령':'지급'):(Number(value)>0?'recibe':'paga')}</span>)}</section>}{waiting?<p role="status">{waiting}</p>:<button className="mp-action mp-action-primary mt-primary" disabled={disabled} onClick={onContinue}>{ko?'효과 확인 · 계속':'Entendido · continuar'}</button>}</article>;
}
