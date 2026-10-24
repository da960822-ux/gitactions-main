import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { fourSeats } from '../core/fourPlayer';
import { fourMinhwatuEngine as engine, type FourMinhwatuState, type MinhwatuPolicyView } from '../games/fourMinhwatu';
import { MinhwatuTeamTable, minhwatuTeamPresentation } from './MinhwatuTeamTable';

function markup(state: FourMinhwatuState, language: 'ko'|'es'='ko') {
  const view=engine.getPlayerView(state,'p1');
  return {view,html:renderToStaticMarkup(createElement(MinhwatuTeamTable,{view,language,nickname:'구름',roomId:'test-native-four',version:1,runAction:vi.fn(),onExit:vi.fn(),onReplay:vi.fn(),onSelectGame:vi.fn()}))};
}

describe('native four-seat Minhwatu table',()=>{
  it('owns four banks, teams, field, bottom hand and game controls without rendering a two-player table or generic controls',()=>{
    const {html}=markup(engine.createInitialState(76));
    expect(html).toContain('class="mh4-table minhwatu-table"');
    for(const seat of fourSeats)expect(html).toContain(`data-minhwatu-seat="${seat}"`);
    expect(html).toContain('mh4-field-cards');expect(html).toContain('mh4-human');expect(html).toContain('mh4-hand-cards');
    expect(html).toContain('구름');expect(html).toContain('AI 팀원');expect(html).toContain('우리 팀');expect(html).toContain('상대 팀');
    expect(html).toContain('게임 방법');expect(html).toContain('최근 행동');expect(html).toContain('게임 바꾸기');expect(html).toContain('나가기');
    expect(html).not.toContain('hwatu-hand-choice');expect(html).not.toContain('hwatu-team-capture-strip');expect(html).not.toContain('hwatu-seat-strip');
    expect(html).not.toContain('four-card');expect(html).not.toContain('<select');
  });

  it('preserves original SVG card faces, capture symbols and eight exact individual yaku counters per owner',()=>{
    const state=engine.createInitialState(76) as FourMinhwatuState,{html}=markup(state);
    expect(html.match(/class="mh4-yakus"/g)).toHaveLength(4);
    expect(html.match(/<li class=""/g)).toHaveLength(32);
    for(const label of ['홍단','청단','초단','고도리','11월 완성','5월 완성','10월 완성','12월 완성'])expect(html).toContain(label);
    for(const card of [...state.hands.p1,...state.table])expect(html).toContain(`/images/hwatu/${card.id.split('-').map(part=>part.padStart(2,'0')).join('-')}.svg`);
    expect(html).toContain('mh4-capture-mark');expect(html).toContain('가져올 수 있음');expect(html.match(/>패를 고르세요</g)).toHaveLength(1);
  });

  it('never exposes teammate/opponent hands or deck order while keeping all public capture owners distinct',()=>{
    const state=engine.createInitialState(41) as FourMinhwatuState;
    for(const seat of fourSeats.filter(seat=>seat!=='p1'))state.captures[seat]=[state.hands[seat].pop()!];
    const {view,html}=markup(state),projected=minhwatuTeamPresentation(view);
    for(const seat of ['p2','p3','p4'] as const){
      const captured=state.captures[seat][0];expect(html).toContain(`/images/hwatu/${captured.id.split('-').map(part=>part.padStart(2,'0')).join('-')}.svg`);
      for(const card of state.hands[seat])expect(html).not.toContain(`/images/hwatu/${card.id.split('-').map(part=>part.padStart(2,'0')).join('-')}.svg`);
    }
    for(const card of state.deck)expect(html).not.toContain(`/images/hwatu/${card.id.split('-').map(part=>part.padStart(2,'0')).join('-')}.svg`);
    expect(projected.ownHand).toEqual(state.hands.p1);expect(projected.board).not.toHaveProperty('deck');expect(projected).not.toHaveProperty('hands');
    expect(html).toContain('크게 보기');
  });

  it('offers duplicate-month targets directly while disabling human hand controls during a pending revealed-card choice',()=>{
    const state=engine.createInitialState(1) as FourMinhwatuState;
    const pack=[...Object.values(state.hands).flat(),...state.table,...state.deck];
    state.pending={card:pack.find(card=>card.id==='3-1')!};state.table=[pack.find(card=>card.id==='3-2')!,pack.find(card=>card.id==='3-3')!];state.phase='capture-draw';state.turn='p1';
    const {view,html}=markup(state);
    expect(view.actions.map(option=>option.action)).toEqual([{type:'capture',payload:{targetIndex:0}},{type:'capture',payload:{targetIndex:1}}]);
    expect(html.match(/class="mh4-field-card is-target"/g)).toHaveLength(2);
    expect(html.match(/>바닥 패를 고르세요</g)).toHaveLength(1);
    expect(html).not.toContain('class="mh4-confirm"');
    const buttons=html.match(/<button[^>]*class="mh4-hand-card[^>]*>/g)??[];
    expect(buttons.length).toBe(5);for(const button of buttons)expect(button).toContain('disabled=""');
  });

  it('maps completed team wins correctly to the existing Minhwatu sound primitive and owns its replay result',()=>{
    const state=engine.createInitialState(1) as FourMinhwatuState;
    state.result={winner:'A',scores:{A:130,B:80},reason:{ko:'팀 점수',es:'Puntos por equipos'}};state.phase='finished';
    state.events=[{sequence:100,type:'win',title:{ko:'정산',es:'Resultado'}}];
    const {view,html}=markup(state),projected=minhwatuTeamPresentation(view);
    expect(projected.result?.winner).toBe('p1');expect(projected.log.at(-1)?.winner).toBe('p1');
    expect(html).toContain('우리 팀 승리');expect(html).toContain('한 판 더');expect(html).not.toContain('hwatu-result');
  });

  it('retains monotonic public motion events and localized native controls',()=>{
    let state=engine.createInitialState(76) as FourMinhwatuState;
    for(let step=0;step<6&&!state.result;step++){const action=engine.chooseAiAction(engine.getPlayerView(state,state.turn),state.turn,()=>0)!;state=engine.applyAction(state,state.turn,action);}
    const view=engine.getPlayerView(state,'p1') as MinhwatuPolicyView,projected=minhwatuTeamPresentation(view);
    expect(projected.log.some(event=>event.type==='play')).toBe(true);expect(projected.log.some(event=>event.type==='draw')).toBe(true);expect(projected.log.some(event=>event.type==='capture')).toBe(true);
    expect(projected.log.every((event,index)=>index===0||event.sequence>projected.log[index-1].sequence)).toBe(true);
    for(const hidden of [...state.deck,...state.hands.p2,...state.hands.p3,...state.hands.p4])expect(JSON.stringify(view.minhwatu.events)).not.toContain(`"id":"${hidden.id}"`);
    const {html}=markup(state,'es');expect(html).toContain('Compañero IA');expect(html).toContain('Cómo jugar');expect(html).toContain('Actividad');
  });
});
