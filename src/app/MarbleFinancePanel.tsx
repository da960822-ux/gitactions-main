import {useRef,useState} from 'react';
import type {GameAction,Language} from '../core/types';
import {marbleLoanTerms} from '../games/marbleEconomy';
import {moneyText} from './marble-visuals';
import './marble-finance.css';
export function MarbleFinancePanel({loanRulesVersion,cash,debt,due=0,borrow,repay,language,disabled,onAction,compact=false,active=true,eliminated=false}:{loanRulesVersion?:number;compact?:boolean;cash:number;debt:number;due?:number;borrow?:GameAction;repay?:GameAction;language:Language;disabled:boolean;onAction:(action:GameAction)=>unknown;active?:boolean;eliminated?:boolean}){
 const {amount,repayment}=marbleLoanTerms(loanRulesVersion);
 const ko=language==='ko',m=(n:number)=>moneyText(n,language),crisis=due>cash,remaining=Math.max(0,due-cash-amount);
 const [pending,setPending]=useState(false),[failed,setFailed]=useState(false),lock=useRef(false);
 const reason=eliminated?(ko?'파산한 플레이어는 대출할 수 없어요.':'Un jugador eliminado no puede pedir préstamos.'):!active?(ko?'내 차례에 대출받을 수 있어요.':'Puedes pedir un préstamo en tu turno.'):debt>0?(ko?`기존 대출을 전액 상환해야 다시 빌릴 수 있어요.${crisis?' 도시 매각으로 부족액을 마련하세요.':''}`:`Paga toda la deuda antes de pedir otro préstamo.${crisis?' Vende propiedades para cubrir el faltante.':''}`):disabled?(ko?'이동·거래 처리 후 대출할 수 있어요.':'Espera a que termine el movimiento o la operación.'):!borrow?(ko?'현재 결정을 먼저 마쳐 주세요. 이 단계에서는 대출할 수 없어요.':'Termina primero la decisión actual; no puedes pedir un préstamo en esta fase.') : '';
 const act=async(action:GameAction|undefined)=>{if(!action||disabled||!active||eliminated||lock.current)return;lock.current=true;setPending(true);setFailed(false);try{if(await onAction(action)===false)setFailed(true);}catch{setFailed(true);}finally{lock.current=false;setPending(false);}};
 const after=crisis?(remaining>0?(ko?`대출 후에도 ${m(remaining)} 부족 · 도시 매각으로 마련하세요.`:`Tras el préstamo faltan ${m(remaining)}; vende propiedades.`):(ko?`즉시 ${m(due)} 결제 후 현금 ${m(cash+amount-due)}`:`Se paga ${m(due)} y quedan ${m(cash+amount-due)}`)):(ko?`대출 후 현금 ${m(cash+amount)}`:`efectivo después ${m(cash+amount)}`);
 return <section className={`mp-finance ${crisis?'is-crisis':''} ${compact?'is-compact':''}`} aria-label={ko?'대출·상환':'Préstamo y pago'}>
  {!compact&&<h3>{ko?'대출·상환':'Préstamo y pago'}</h3>}
  <dl><div><dt>{ko?'내 현금':'Efectivo'}</dt><dd>{m(cash)}</dd></div><div><dt>{ko?'대출':'Deuda'}</dt><dd>{m(debt)}</dd></div>{crisis&&<><div><dt>{ko?'지급 필요':'Pago pendiente'}</dt><dd>{m(due)}</dd></div><div><dt>{ko?'부족액':'Faltante'}</dt><dd>{m(due-cash)}</dd></div></>}</dl>
  {reason?<p className="mp-finance-reason">{reason}</p>:<p>{ko?`받기 ${amount} · 상환 ${repayment} · ${after}`:`Recibes ${amount} y devuelves ${repayment} · ${after}`}</p>}
  <button type="button" className="mp-finance-action" disabled={!borrow||disabled||pending||!active||eliminated||debt>0} onClick={()=>void act(borrow)}>{pending?(ko?'처리 중…':'Procesando…'):(ko?`${amount} 대출받기 · 상환액 ${repayment}`:`Pedir ${amount} · devolver ${repayment}`)}</button>
  {debt>0&&!crisis&&<><p>{cash>=debt?(ko?`전액 ${m(debt)} 상환 후 현금 ${m(cash-debt)} · 남은 대출 0`:`Pago total ${m(debt)} · efectivo después ${m(cash-debt)} · deuda 0`):(ko?`전액 상환까지 현금 ${m(debt-cash)} 부족`:`Faltan ${m(debt-cash)} para pagar todo`)}</p><button type="button" disabled={!repay||disabled||pending||!active||eliminated} onClick={()=>void act(repay)}>{ko?`대출 ${m(debt)} 전액 상환`:`Pagar ${m(debt)} en total`}</button></>}
  {crisis&&!compact&&<small>{ko?'자금이 충분해지면 기존 지급은 자동 처리돼요. 별도 결제 버튼은 없습니다.':'El pago pendiente se liquida automáticamente al reunir fondos.'}</small>}
  {failed&&<p role="alert">{ko?'거래하지 못했어요. 현금과 가능한 행동을 확인해 주세요.':'No se pudo completar. Revisa el efectivo y las acciones disponibles.'}</p>}
 </section>;
}
