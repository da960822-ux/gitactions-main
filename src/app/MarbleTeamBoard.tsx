import { MarbleRuleGuide } from './MarbleRuleGuide';
import { marblePropertyRules } from '../games/rules';
import { MarblePropertyLedger, MarblePropertySale } from './MarblePropertyLedger';
import { marbleTakeoverPrice } from '../games/marble';
import type { GameAction, GameId, Language } from '../core/types';
import { fourSeats, fourTeam, localized as l, type FourSeat, type FourView, type Localized } from '../core/fourPlayer';
import { marbleBuildCost, type MarbleActionEvent } from '../games/marble';
import type { MarbleView } from '../games/fourMarble';
import { useEffect, useRef, useState } from 'react';
import { MarbleTeamMap } from './MarbleTeamMap';
import { MarblePawn, MarblePawnPicker } from './MarblePawn';
import { MarblePropertyArt } from './MarblePropertyArt';
import { MarbleEventStage } from './MarbleEventStage';
import { useMarbleTeamMotion } from './useMarbleTeamMotion';
import { cityArtNames, moneyText, rentValue } from './marble-visuals';
import { getPreferences, setPreferences, setScene, unlock, playCue } from '../audio/audio';
import { gameCatalog } from '../games/catalog';
import './marble-team-board.css';
import './marble-context.css';
import './marble-ownership.css';

const text=(language:Language,ko:string,es:string)=>language==='ko'?ko:es;
const phaseNames:Record<string,Localized>={roll:l('주사위를 굴리세요','Lanza los dados'),decision:l('도시를 구매할까요?','¿Comprar esta ciudad?'),main:l('다음 여행을 준비하세요','Prepara el próximo viaje'),island:l('무인도에서 나가기','Salir de la isla'),'train-decision':l('열차 목적지 선택','Elige destino en tren'),'event-decision':l('효과를 적용할 도시','Ciudad para el efecto'),'rent-decision':l('통행료 지급','Pagar alquiler'),debt:l('지급 방법 선택','Resolver el pago'),finished:l('여행 종료','Fin del viaje')};
type Props={view:FourView;language:Language;runAction:(action:GameAction)=>void|Promise<unknown>;nickname?:string;roomId?:string;version?:number;onReplay?:()=>void|Promise<void>;onExit?:()=>void;onSelectGame?:(game:GameId)=>void|Promise<void>;error?:string;busy?:boolean;playerNames?:Partial<Record<FourSeat,Localized>>};
export default function MarbleTeamBoard({view:raw,language,runAction,nickname,roomId,onReplay,onExit,onSelectGame,error,busy=false,playerNames}:Props){
  const view=raw as MarbleView,s=view.publicState;
  const names:Record<FourSeat,Localized>={p1:l(nickname??'나',nickname??'Tú'),p2:l('상대 1','Rival 1'),p3:l('팀원 AI','Compañero IA'),p4:l('상대 2','Rival 2'),...playerNames};
  const pawnView={actions:view.turn==='p1'&&!s.eliminated.p1&&!view.result?view.actions:[],board:{pawns:s.pawns,pawnLocked:s.pawnLocked,seats:fourSeats}};
  const motion=useMarbleTeamMotion(view),pos=s.positions[view.turn],tile=view.publicBoard[pos],property=s.properties[pos];
  const [selected,setSelected]=useState(pos),[pending,setPending]=useState(false),[failure,setFailure]=useState(''),[bankrupt,setBankrupt]=useState(false),[prefs,setPrefs]=useState(()=>getPreferences('marble')),[exiting,setExiting]=useState<'exit'|'restart'|null>(null);
  const exitDialog=useRef<HTMLDialogElement>(null);
  const citySheet=useRef<HTMLDetailsElement>(null),actionPanel=useRef<HTMLElement>(null),actionLock=useRef(false);
  const arrivalSequence=[...(s.actionLog??[])].reverse().find(e=>e.type==='arrival'&&e.actor===view.turn)?.sequence??0;
  const settledRent=[...(s.actionLog??[])].reverse().find(e=>e.type==='rent'&&e.actor===view.turn&&e.tile===pos&&e.sequence>arrivalSequence)?.amount;
  const landingRent=s.pendingRent?.amount??(property&&s.pendingPayment?.creditor===property.owner?s.pendingPayment.amount:typeof settledRent==='number'?settledRent:rentValue({...tile,houses:property?.houses??0},true));
  const human=view.turn==='p1'&&!s.eliminated.p1&&!view.result,disabled=busy||pending;
  const choices=human?view.actions:[],by=(type:string)=>choices.filter(option=>option.action.type===type),first=(type:string)=>by(type)[0];
  const owned=Object.entries(s.properties).filter(([,p])=>p.owner==='p1');
  const selectedCity=view.publicBoard[selected],selectedProperty=s.properties[selected];
  const selectedBuild=by('build').find(option=>option.action.payload?.tile===selected),builds=by('build');
  const primaryAction=view.phase==='roll'?first('roll')
   :view.phase==='decision'?first('buy')??first('decline')
   :view.phase==='main'?selectedBuild??builds.find(option=>Number(option.action.payload?.tile)===pos)??builds[0]??first('takeover')??first('endTurn')
   :view.phase==='island'?first('attempt-doubles')??first('pay-escape')??first('use-escape-pass')
   :view.phase==='train-decision'?first('choose-train')??first('skip-train')
   :view.phase==='event-decision'?first('choose-event-city')
   :view.phase==='rent-decision'?first('pay-rent')??first('use-rent-pass')
   :view.phase==='debt'?first('borrow')??first('sell-property')??first('declare-bankruptcy')
   :undefined;
  const sameAction=(a:GameAction,b?:GameAction)=>!!b&&a.type===b.type&&JSON.stringify(a.payload??{})===JSON.stringify(b.payload??{});
  const latestTransaction=[...(s.actionLog??[])].reverse().find(event=>Object.values(event.moneyDelta??{}).some(delta=>typeof delta==='number'&&delta!==0)) as MarbleActionEvent|undefined;
  const transactionDelta=Number(latestTransaction?.moneyDelta?.p1??0);
  const accountLabel=(account:unknown)=>account==='bank'?text(language,'은행','Banco'):account==='fund'?text(language,'공동 기금','Fondo común'):fourSeats.includes(account as FourSeat)?names[account as FourSeat][language]:'';
  const latestFlow=latestTransaction?.fromAccount&&latestTransaction?.toAccount&&Number(latestTransaction.amount)>0?`${accountLabel(latestTransaction.fromAccount)} → ${accountLabel(latestTransaction.toAccount)} · ${moneyText(Number(latestTransaction.amount),language)}`:'';
  const primaryIndex=Number(primaryAction?.action.payload?.tile??pos),primaryCity=view.publicBoard[primaryIndex]??tile;
  const primaryProp=s.properties[primaryIndex],primaryCost=primaryAction?.action.type==='buy'?Number(primaryCity.price??0):primaryAction?.action.type==='build'?marbleBuildCost(primaryCity,primaryProp?.houses??0,3):primaryAction?.action.type==='pay-rent'?Number(s.pendingRent?.amount??0):0;
  const primaryAfter=s.money.p1-primaryCost;
  const [target,setTarget]=useState('');
  const destinations=by(view.phase==='event-decision'?'choose-event-city':'choose-train');
  const selectedDestination=destinations.find(option=>JSON.stringify(option.action)===target)??destinations[0];
  useEffect(()=>{
    if(!exiting||!exitDialog.current)return;const dialog=exitDialog.current,previous=document.activeElement as HTMLElement|null;dialog.showModal();
    return()=>{dialog.close();previous?.focus();};
  },[exiting]);
  useEffect(()=>{setScene('marble');return()=>setScene(null);},[]);
  useEffect(()=>{setSelected(pos);setBankrupt(false);setFailure('');setTarget('');},[pos,view.phase]);
  const act=async(action:GameAction)=>{
    if(disabled||actionLock.current||!choices.some(option=>option.action.type===action.type&&JSON.stringify(option.action.payload??{})===JSON.stringify(action.payload??{})))return;
    actionLock.current=true;setPending(true);setFailure('');
    try{await unlock();if(await runAction(action)===false)setFailure(text(language,'행동을 완료하지 못했어요. 다시 선택해 주세요.','No se pudo completar. Vuelve a elegir.'));}
    catch(cause){setFailure(cause instanceof Error?cause.message:text(language,'다시 시도해 주세요.','Inténtalo de nuevo.'));playCue('marble','error');}
    finally{actionLock.current=false;setPending(false);}
  };
  const inspect=(index:number)=>{setSelected(index);if(citySheet.current)citySheet.current.open=true;};
  const button=(type:string,primary=false)=>{const choice=first(type);return choice&&!sameAction(choice.action,primaryAction?.action)?<button key={type} className={primary?'mt-primary':'mt-secondary'} disabled={disabled} onClick={()=>void act(choice.action)}>{choice.label[language]}</button>:null;};
  const bank=(seat:FourSeat)=>{
    const player=view.players.find(player=>player.id===seat)!;
    return <article className={`mt-bank mt-bank-${fourTeam(seat)} ${view.turn===seat&&!view.result?'is-current':''} ${s.eliminated[seat]?'is-bankrupt':''}`} data-marble-seat={seat} key={seat}>
      <MarblePawn pawn={s.pawns[seat]} language={language} label={names[seat][language]}/>
      <div><strong><span className="mp-seat-key" aria-label={text(language,`${seat.slice(1)}번`, `Asiento ${seat.slice(1)}`)}>{seat.slice(1)}</span> {names[seat][language]} {view.turn===seat&&!view.result&&<span className="mt-turn-dot" title={text(language,'차례','Turno')}/>}</strong><span>{text(language,`현금 ${moneyText(s.money[seat],language)}${s.debt[seat]?` · 대출 ${s.debt[seat]}`:''}`,`Efectivo ${moneyText(s.money[seat],language)}${s.debt[seat]?` · deuda ${s.debt[seat]}`:''}`)}</span></div>
      <dl><div><dt>{text(language,'순자산','Patrimonio')}</dt><dd>{moneyText(player.score,language)}</dd></div><div><dt>{text(language,'위치','Casilla')}</dt><dd>{s.eliminated[seat]?text(language,'파산','Quiebra'):s.positions[seat]+1}</dd></div></dl>

    </article>;
  };
  return <section className="marble-native-team marble-team-board is-modern" data-marble-player-count="4" aria-label={text(language,'도시 여행 4인 팀전','Marble por equipos de cuatro')}>
    <header className="mt-top"><div><h1>{text(language,'부루마블','Marble')} <span>2 × 2</span></h1><small>{text(language,`여행 ${Math.min(120,s.turns+1)} / 120 · 기금 ${s.fundPool}`,`Turno ${Math.min(120,s.turns+1)} / 120 · fondo ${s.fundPool}`)}</small></div><nav aria-label={text(language,'도시 여행 메뉴','Menú de Marble')}>
      <details className="mt-help"><summary>{text(language,'게임 방법','Cómo jugar')}</summary><div>{s.propertyRulesVersion===1?<MarbleRuleGuide language={language} rules={marblePropertyRules[language]} options={{marbleEconomyVersion:3,marbleCityRouteVersion:3,marblePropertyRulesVersion:1}} teamMode/>:<><h2>{text(language,'두 팀의 세계 여행','Un viaje entre dos equipos')}</h2><p>{text(language,'나와 팀원 AI가 한 팀입니다. 같은 팀 도시에서는 통행료를 내지 않으며, 돈과 도시는 개인별입니다.','Tú y tu compañero IA forman un equipo. Sin alquiler entre aliados; dinero y propiedades individuales.')}</p><p>{text(language,'각자 1500으로 출발하고 출발 통과 시 200을 받습니다. 도시를 사고 최대 3단계로 건설합니다. 16종 열쇠 카드, 열차, 기금, 무인도 효과가 적용됩니다.','Empiezan con 1500 y reciben 200 al pasar la salida. Compra ciudades y construye hasta tres niveles. Hay 16 cartas, tren, fondo e isla.')}</p><p>{text(language,'대출은 300을 받고 330을 갚습니다. 같은 팀 두 명 모두 파산하면 패배하며, 120차례 뒤에는 두 팀원의 순자산 합계를 비교합니다.','El préstamo da 300 y se devuelven 330. Pierde el equipo si quiebran ambos; tras 120 turnos se compara la suma del patrimonio neto.')}</p><p>{text(language,'지도에서 도시를 누르면 가격·단계별 통행료·소유권을 확인할 수 있습니다.','Pulsa una ciudad del mapa para ver precio, alquileres y propietario.')}</p></>}</div></details>
      <details className="mt-menu"><summary>{text(language,'설정·메뉴','Ajustes y menú')}</summary><div>
        <label><input type="checkbox" checked={prefs.sfxEnabled} onChange={e=>{const value={...prefs,sfxEnabled:e.target.checked};setPrefs(value);setPreferences('marble',value);void unlock();}}/>{text(language,'효과음','Sonidos')}</label>
        <label>{text(language,'음량','Volumen')}<input type="range" min="0" max="1" step=".05" value={prefs.sfxVolume} onChange={e=>{const value={...prefs,sfxVolume:Number(e.target.value)};setPrefs(value);setPreferences('marble',value);}}/></label>
        {onSelectGame&&<label>{text(language,'다른 게임','Otro juego')}<select defaultValue="marble" onChange={e=>void onSelectGame(e.target.value as GameId)}>{gameCatalog.filter(game=>['davinci','domino','splendor','minhwatu','marble'].includes(game.id)).map(game=><option key={game.id} value={game.id}>{game.title[language]}</option>)}</select></label>}
        {onReplay&&!view.result&&<button disabled={disabled} onClick={()=>setExiting('restart')}>{text(language,'새 판','Nueva partida')}</button>}
        {onExit&&<button onClick={()=>setExiting('exit')}>{text(language,'게임 선택으로','Elegir juego')}</button>}
        <small>{roomId?text(language,'이 창에서만 유지되는 AI 팀전','Partida contra IA en esta ventana'):text(language,'팀원에게 자산을 넘길 수 없어요.','No se transfieren bienes entre aliados.')}</small>
      </div></details>
    </nav></header>
    <a href="#marble-team-action" className="mt-skip" onClick={e=>{e.preventDefault();(actionPanel.current?.querySelector<HTMLElement>('button:not(:disabled)')??actionPanel.current)?.focus();}}>{text(language,'내 행동으로 이동','Ir a tu acción')}</a>
    <div className="mt-play-surface"><div className="mt-four-board"><div className="mt-banks mt-rivals">{bank('p2')}{bank('p4')}</div>
      <MarbleTeamMap view={view} language={language} seatNames={names} selectedTile={selected} onInspect={inspect} displayPositions={motion.positions} traveler={motion.traveler} changedProperties={motion.changedProperties} centerContent={<section className="mp-center-action mt-center-action" aria-label={text(language,'현재 도착과 다음 행동','Llegada y acción actual')}>
        <small className="mp-center-action-phase">{human?phaseNames[view.phase]?.[language]:`${names[view.turn][language]} · ${text(language,'차례','turno')}`}</small>
        <h3>{primaryCity.name[language]}</h3>
        <p>{primaryCity.kind==='property'?text(language,`${primaryProp?`소유 · ${names[primaryProp.owner][language]} · ${primaryProp.houses}단계`:'미소유'} · 통행료 ${rentValue({...primaryCity,houses:primaryProp?.houses??0},true)}`,`${primaryProp?`Dueño · ${names[primaryProp.owner][language]} · nivel ${primaryProp.houses}`:'Sin dueño'} · alquiler ${rentValue({...primaryCity,houses:primaryProp?.houses??0},true)}`):text(language,`현금 ${moneyText(s.money.p1,language)} · 기금 ${moneyText(s.fundPool,language)}`,`Efectivo ${moneyText(s.money.p1,language)} · fondo ${moneyText(s.fundPool,language)}`)}</p>
        {human&&builds.length>0&&<small className="mp-build-count-note">{text(language,`지금 건설 가능한 도시 ${builds.length}곳`,`${builds.length} ciudades disponibles para construir`)}</small>}
        {primaryAction?.action.type==='build'&&primaryProp&&<small className="mp-build-count-note">{text(language,`건설 후 통행료 ${rentValue({...primaryCity,houses:primaryProp.houses},true)} → ${rentValue({...primaryCity,houses:primaryProp.houses+1},true)}`,`Renta después de construir ${rentValue({...primaryCity,houses:primaryProp.houses},true)} → ${rentValue({...primaryCity,houses:primaryProp.houses+1},true)}`)}</small>}
        {primaryAction&&human&&<div className="mp-center-action-choice"><span>{primaryCost?text(language,`비용 ${moneyText(primaryCost,language)} · 실행 후 현금 ${moneyText(primaryAfter,language)}`,`Costo ${moneyText(primaryCost,language)} · efectivo después ${moneyText(primaryAfter,language)}`):text(language,`내 현금 ${moneyText(s.money.p1,language)}`,`Mi efectivo ${moneyText(s.money.p1,language)}`)}</span><button className="mt-primary" disabled={disabled} onClick={()=>void act(primaryAction.action)}>{primaryAction.label[language]} ↗</button></div>}
        {latestTransaction&&<div className="mp-center-receipt"><b>{latestTransaction.title[language]}</b>{latestFlow&&<span>{latestFlow}</span>}<span>{latestTransaction.text[language]}</span>{transactionDelta!==0&&<strong>{text(language,'내 현금','Tu efectivo')} {transactionDelta>0?'+':''}{moneyText(transactionDelta,language)}</strong>}</div>}
      </section>}/>
      <div className="mt-banks mt-allies">{bank('p1')}{bank('p3')}</div>
    </div>
    <aside className="mt-captain-panel" aria-label={text(language,'내 여행과 행동','Tu viaje y acciones')}>
      <section ref={actionPanel} id="marble-team-action" tabIndex={-1} className="mt-action-panel" aria-busy={disabled}>
        <div className="mt-dice-status"><h2>{view.result?phaseNames.finished[language]:human?phaseNames[view.phase]?.[language]:`${names[view.turn][language]} · ${text(language,'차례','turno')}`}</h2><div className={`mt-dice ${motion.rolling?'is-rolling':''}`} aria-label={text(language,'주사위 결과','Resultado de dados')}>{[0,1].map(i=><span key={i} aria-label={String(s.lastRoll[i]??0)}>{s.lastRoll[i]??'·'}</span>)}</div></div>
        <div className="mt-landing"><h3>{tile.name[language]}</h3>{tile.kind==='property'?<p>{property?`${names[property.owner][language]} · ${fourTeam(property.owner)===fourTeam(view.turn)?text(language,'팀 통행료 면제','Sin alquiler entre aliados'):`${text(language,'통행료','Alquiler')} ${landingRent}`}`:text(language,`매입 ${tile.price} · 통행료 ${tile.rent}`,`Compra ${tile.price} · alquiler ${tile.rent}`)}</p>:<p>{view.phase==='island'?text(language,`남은 ${s.islandTurns.p1}차례 · 탈출권 ${s.escapePasses.p1}`,`${s.islandTurns.p1} turnos restantes · pases ${s.escapePasses.p1}`):text(language,`공동 기금 ${s.fundPool}`,`Fondo común ${s.fundPool}`)}</p>}</div>
        {human&&view.phase==='decision'&&<strong className="mt-cash-after">{text(language,`구매 후 현금 ${moneyText(s.money.p1-(tile.price??0),language)}`,`Efectivo después ${moneyText(s.money.p1-(tile.price??0),language)}`)}</strong>}
        {human&&view.phase==='main'&&s.takeoverTile===pos&&property&&<p className="mt-cash-after">{(()=>{const price=marbleTakeoverPrice(tile,property.houses,3);return price===null?text(language,'랜드마크 · 인수 불가','Monumento · no se puede adquirir'):text(language,s.money.p1>=price?`인수 ${price} · 인수 후 현금 ${s.money.p1-price}`:`인수 ${price} · 현금 ${price-s.money.p1} 부족`,s.money.p1>=price?`Adquirir ${price} · efectivo restante ${s.money.p1-price}`:`Adquirir ${price} · faltan ${price-s.money.p1}`);})()}</p>}
        {human&&view.phase==='debt'&&<div className="mt-debt-alert" role="alert"><strong>{text(language,`지급 필요 ${s.pendingPayment?.amount}`,`Pago pendiente ${s.pendingPayment?.amount}`)}</strong><span>{text(language,`내 현금 ${s.money.p1} · 대출 ${s.debt.p1}`,`Tu efectivo ${s.money.p1} · deuda ${s.debt.p1}`)}</span></div>}
        {human&&view.phase==='rent-decision'&&<strong className="mt-cash-after">{text(language,`통행료 ${s.pendingRent?.amount}`,`Alquiler ${s.pendingRent?.amount}`)}</strong>}
        <div className="mt-main-actions">{button('roll',true)}{button('buy',true)}{button('takeover',true)}{button('decline')}{button('endTurn',builds.length===0)}{button('attempt-doubles',true)}{button('pay-escape')}{button('use-escape-pass')}{button('pay-rent',true)}{button('use-rent-pass')}</div>
        {human&&destinations.length>0&&<div className="mt-destinations"><label htmlFor="mt-destination">{view.phase==='event-decision'?text(language,'도시 선택','Elegir ciudad'):text(language,`목적지 · 운임 ${s.trainFare}`,`Destino · pasaje ${s.trainFare}`)}</label><select id="mt-destination" value={JSON.stringify(selectedDestination.action)} onChange={e=>setTarget(e.target.value)}>{destinations.map(option=><option key={JSON.stringify(option.action)} value={JSON.stringify(option.action)}>{option.label[language]}</option>)}</select><button className="mt-primary" disabled={disabled} onClick={()=>void act(selectedDestination.action)}>{text(language,'이 도시로','Confirmar ciudad')}</button>{button('skip-train')}</div>}
        {human&&view.phase==='debt'&&<><MarblePropertySale choices={by('sell-property')} language={language} runAction={act} disabled={disabled}/><p>{text(language,'대출: 받기 300 · 상환 330','Préstamo: recibes 300 · devuelves 330')}</p>{button('borrow',true)}{first('declare-bankruptcy')&&(!bankrupt?<button className="mt-danger" disabled={disabled} onClick={()=>setBankrupt(true)}>{text(language,'파산 검토','Revisar quiebra')}</button>:<div className="mt-debt-alert"><p>{text(language,'내 도시·건물은 은행에 반환되고 나는 탈락합니다. 팀원은 계속합니다.','Tus propiedades vuelven al banco y quedas eliminado. Tu compañero continúa.')}</p>{button('declare-bankruptcy')}<button onClick={()=>setBankrupt(false)}>{text(language,'취소','Cancelar')}</button></div>)}</>}
        {(error||failure)&&<p className="mt-error" role="alert">{error||failure}</p>}
      </section>
      {human&&builds.some(option=>!sameAction(option.action,primaryAction?.action))&&<section className="mt-build" aria-label={text(language,'건설 가능한 도시','Ciudades disponibles para construir')}><h3>{text(language,`다른 도시 건설 · ${builds.length}곳`,`Construir en otras ciudades · ${builds.length}`)}</h3>{builds.filter(option=>!sameAction(option.action,primaryAction?.action)).map(option=>{const index=Number(option.action.payload!.tile),city=view.publicBoard[index],prop=s.properties[index],cost=marbleBuildCost(city,prop.houses,3),before=rentValue({...city,houses:prop.houses},true),after=rentValue({...city,houses:prop.houses+1},true);return <article className="mt-build-option" key={index}><div><strong>{city.name[language]} · {prop.houses} → {prop.houses+1}단계</strong><span>{text(language,`건설 ${cost} · 현금 ${s.money.p1-cost} · 통행료 ${before} → ${after}`,`Costo ${cost} · efectivo ${s.money.p1-cost} · alquiler ${before} → ${after}`)}</span></div><button className="mt-primary" disabled={disabled} onClick={()=>void act(option.action)}>{text(language,'여기에 건설','Construir aquí')}</button></article>;})}</section>}
      {human&&by('choose-pawn').length>0&&<details className="mt-pawn-picker"><summary>{text(language,'내 말 선택','Elegir tu ficha')}</summary><MarblePawnPicker view={pawnView} language={language} playerId="p1" runAction={act}/></details>}
      {human&&view.phase!=='debt'&&(first('borrow')||first('repay'))&&<details className="mt-loan"><summary>{text(language,'대출·상환','Préstamo y pago')}</summary><p>{text(language,'300을 받고 330을 갚습니다. 개인 대출은 하나만 가능합니다.','Recibes 300 y devuelves 330. Solo un préstamo individual pendiente.')}</p>{button('borrow')}{button('repay')}</details>}
      {motion.event&&<MarbleEventStage events={s.actionLog} event={motion.event} animating={motion.rolling||!!motion.traveler} language={language} playerId="p1" playerNames={names} result={view.result}/>}
      {latestTransaction&&<section className="mt-latest-transaction"><h3>{text(language,'최근 금전 이동','Último movimiento de dinero')}</h3><MarbleEventStage events={s.actionLog} event={latestTransaction as any} language={language} playerId="p1" playerNames={names}/></section>}
      <details ref={citySheet} className="mt-city-sheet" data-marble-owner={selectedProperty?.owner??'bank'}><summary>{text(language,'도시 살펴보기','Ver ciudad')} · {selectedCity.name[language]}</summary>{selectedCity.kind==='property'?<><MarblePropertyArt city={cityArtNames[selectedCity.name.ko]??''} level={selectedProperty?.houses??0} routeVersion={3} language={language} owner={selectedProperty?.owner??null} ownerLabel={selectedProperty?names[selectedProperty.owner][language]:text(language,'은행','Banco')}/><h3>{selectedCity.name[language]}</h3><p>{text(language,'소유','Dueño')} · {selectedProperty?names[selectedProperty.owner][language]:text(language,'은행','Banco')}</p><p>{text(language,'매입가','Compra')} {selectedCity.price}</p><MarblePropertyLedger tile={selectedCity} language={language} economicVersion={3} propertyRulesVersion={s.propertyRulesVersion} multiplier={(selectedCity as any).monopolyMultiplier??1}/>{selectedBuild&&<button disabled={disabled} onClick={()=>document.querySelector<HTMLElement>('.mp-center-action button')?.focus()}>{text(language,'중앙 건설 행동으로 이동','Ir a construir')}</button>}</>:<p>{selectedCity.name[language]}</p>}</details>
      <details className="mt-portfolio"><summary>{text(language,`내 도시 ${owned.length}`,`Mis ciudades ${owned.length}`)}</summary><div>{owned.map(([index,prop])=><button key={index} onClick={()=>inspect(Number(index))}><MarblePropertyArt city={cityArtNames[view.publicBoard[Number(index)].name.ko]??''} level={prop.houses} routeVersion={3} language={language} owner={prop.owner} ownerLabel={names[prop.owner][language]}/><span>{view.publicBoard[Number(index)].name[language]}</span><small>{text(language,`${prop.houses}단계`,`Nivel ${prop.houses}`)}</small></button>)}</div></details>
      {(s.actionLog?.length??0)>0&&<details className="mt-history"><summary>{text(language,'여행 기록','Historial del viaje')}</summary><ol>{s.actionLog.slice(-8).reverse().map(event=><li key={event.sequence}><strong>{event.title[language]}</strong><span>{event.text[language]}</span></li>)}</ol></details>}
      {view.result&&<section className="mt-result" role="status"><h2>{view.result.winner==='draw'?text(language,'무승부','Empate'):view.result.winner==='A'?text(language,'우리 팀 승리','Ganó tu equipo'):text(language,'상대 팀 승리','Ganó el equipo rival')}</h2><p>{view.result.scores.A} : {view.result.scores.B}</p><p>{view.result.reason[language]}</p>{onReplay&&<button className="mt-primary" onClick={()=>void onReplay()}>{text(language,'다시 여행하기','Volver a viajar')}</button>}</section>}
    </aside></div>
    {exiting&&<dialog className="mt-exit-dialog" ref={exitDialog} onCancel={event=>{event.preventDefault();setExiting(null);}} aria-labelledby="mt-exit-title"><h2 id="mt-exit-title">{exiting==='restart'?text(language,'새 여행을 시작할까요?','¿Empezar un nuevo viaje?'):text(language,'이번 여행을 끝낼까요?','¿Terminar este viaje?')}</h2><p>{text(language,'이 창의 진행 상황은 저장되지 않습니다.','El progreso de esta ventana no se guarda.')}</p><div><button onClick={()=>setExiting(null)}>{text(language,'계속 플레이','Seguir jugando')}</button><button className="mt-danger" onClick={()=>{if(exiting==='restart'){setExiting(null);void onReplay?.();}else onExit?.();}}>{exiting==='restart'?text(language,'새 판 시작','Empezar de nuevo'):text(language,'종료','Terminar')}</button></div></dialog>}
  </section>;
}
