import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { fourDavinciEngine as engine, type FourDavinciState, type FourDavinciView } from '../games/fourDavinci';
import DaVinciTeamTable, { daVinciTeamAction, fourDaVinciGuessLabel, fourDaVinciTileFeedback, fourDaVinciEventCue } from './DaVinciTeamTable';

function ready(seed: number) {
  let state=engine.createInitialState(seed) as FourDavinciState;
  while(state.phase==='setup')state=engine.applyAction(state,state.turn,engine.chooseAiAction(engine.getPlayerView(state,state.turn),state.turn,()=>.5)!);
  return state;
}
const viewFor=(state:FourDavinciState)=>engine.getPlayerView(state,'p1') as FourDavinciView;
const render=(view:FourDavinciView)=>renderToStaticMarkup(createElement(DaVinciTeamTable,{view,language:'ko',runAction:vi.fn(),nickname:'구름',roomId:'native-four',onReplay:vi.fn(),onExit:vi.fn(),onSelectGame:vi.fn()}));

describe('native four-seat Da Vinci table',()=>{
  it('turns only hidden own tiles into reveal choices after a stock-empty miss',()=>{
    let state=ready(17);state={...state,deck:[],phase:'guess',drawnIndex:null};
    const wrong=state.hands.p2[0].value===0?1:0;
    state=engine.applyAction(state,'p1',{type:'guess',payload:{target:'p2',index:0,value:wrong}});
    const html=render(viewFor(state));
    expect(html).toContain('공개할 내 비공개 타일을 고르세요');
    expect(html.match(/aria-label="내 \d+번 타일 공개"/g)).toHaveLength(state.hands.p1.filter(tile=>!tile.revealed).length);
    expect(html).not.toContain('선택한 타일을 추측하세요');
  });
  it('renders four physical racks with its own title, actions and score instead of a two-player board',()=>{
    const html=render(viewFor(ready(17)));
    for(const seat of ['p1','p2','p3','p4'])expect(html).toContain(`dv4-rack-${seat}`);
    expect(html.match(/class="dv4-rack /g)).toHaveLength(4);
    expect(html).toContain('다빈치 코드 네 사람 게임판');
    expect(html).toContain('구름');expect(html).toContain('우리 팀');expect(html).toContain('팀원');
    expect(html).toContain('상대 1');expect(html).toContain('상대 2');expect(html).toContain('최근 추리');
    expect(html).not.toContain('table-game dv-table');expect(html).not.toContain('dv-team-targets');expect(html).not.toContain('상대 P2 선택');
  });
  it('makes hidden tiles in both opposing racks direct targets after drawing, but never teammate tiles',()=>{
    const state=ready(17);state.phase='guess';
    const html=render(viewFor(state));
    for(const seat of ['p2','p4'])expect(html.match(new RegExp(`<button[^>]+data-seat="${seat}"`,'g'))).toHaveLength(state.hands[seat as 'p2'|'p4'].length);
    expect(html.match(/<button[^>]+data-seat="p3"/g)).toBeNull();
    expect(html).toContain('추측할 숫자 또는 조커');
    expect(html).toContain('상대의 숨은 타일을 누르세요');
    expect(html).not.toContain('추측 확정');
  });
  it('masks all hidden enemy and teammate values, including hostile numbers and hidden joker portraits',()=>{
    const state=ready(17), view=viewFor(state);
    view.policy.racks.p2[0].value=876543;view.policy.racks.p3[0].value=765432;view.policy.racks.p4[0].value=654321;
    view.policy.racks.p3[1].value='joker';
    const html=render(view);
    for(const sentinel of ['876543','765432','654321'])expect(html).not.toContain(sentinel);
    expect(html).toContain('숫자 숨김');
    const teammate=html.slice(html.indexOf('dv4-rack-p3'),html.indexOf('dv4-rack-p2'));
    expect(teammate).not.toContain('dv-joker-portrait');
    expect(teammate).not.toContain('조커');
  });
  it('keeps each initial joker placement distinct and preserves the approved portrait and labeled gaps',()=>{
    let state=engine.createInitialState(0) as FourDavinciState, found=false;
    for(let seed=0;seed<3000;seed++){const candidate=engine.createInitialState(seed) as FourDavinciState;if(candidate.hands.p1.filter(tile=>tile.value==='joker').length===2){state=candidate;found=true;break;}}
    expect(found).toBe(true);
    let view=viewFor(state);const first=view.policy.ownJokerToPlace!;
    expect(render(view)).toContain('dv-joker-portrait');expect(render(view)).toContain('1번째 빈 칸에 조커 배치');expect(render(view)).toContain('여기 놓기');
    state=engine.applyAction(state,'p1',{type:'place-joker',payload:{index:0}});view=viewFor(state);
    expect(view.policy.ownJokerToPlace!.color).not.toBe(first.color);
    state=engine.applyAction(state,'p1',{type:'place-joker',payload:{index:1}});
    expect(render(viewFor(state))).toContain('>준비 완료</button>');
    expect(render(viewFor(state))).not.toContain('dv4-joker-placement');
  });
  it('labels one explicit commit with the actual enemy, tile, color and chosen number or joker',()=>{
    const tile={color:'black' as const,value:null,revealed:false};
    expect(fourDaVinciGuessLabel('ko',{seat:'p4',index:2},tile,7)).toBe('상대 2 3번 검정 = 7 추측');
    expect(fourDaVinciGuessLabel('es',{seat:'p2',index:0},tile,'joker')).toBe('Rival 1 · ficha 1 negra = comodín');
    const state=ready(17);state.phase='guess';const view=viewFor(state);
    expect(daVinciTeamAction(view,'p4',{type:'guess',payload:{index:0,value:'joker'}})).toEqual({type:'guess',payload:{target:'p4',index:0,value:'joker'}});
    expect(daVinciTeamAction(view,'p4',{type:'guess',payload:{target:'p2',index:0,value:7}})).toBeNull();
    expect(daVinciTeamAction(view,'p2',{type:'guess',payload:{target:'p3',index:0,value:7}})).toBeNull();
    expect(daVinciTeamAction(view,'p2',{type:'guess',payload:{index:999,value:7}})).toBeNull();
  });
  it('animates the actual four-seat target of a correct hit without borrowing a two-seat actor channel',()=>{
    const state=ready(17);state.turn='p4';state.phase='guess';
    const next=engine.applyAction(state,'p4',{type:'guess',payload:{target:'p1',index:1,value:state.hands.p1[1].value}}),view=viewFor(next),event=view.policy.log.at(-1)!;
    expect(fourDaVinciTileFeedback(view,event,'p1',1).flipping).toBe(true);
    expect(fourDaVinciTileFeedback(view,event,'p2',1).flipping).toBe(false);
    expect(fourDaVinciTileFeedback(view,event,'p4',1).flipping).toBe(false);
    next.turn='p3';next.phase='guess';
    const teammateHit=engine.applyAction(next,'p3',{type:'guess',payload:{target:'p2',index:0,value:next.hands.p2[0].value}}),teamView=viewFor(teammateHit),teamEvent=teamView.policy.log.at(-1)!;
    expect(fourDaVinciTileFeedback(teamView,teamEvent,'p2',0).flipping).toBe(true);
    expect(fourDaVinciTileFeedback(teamView,teamEvent,'p3',0).flipping).toBe(false);
  });
  it('flips the actor drawn tile on a miss, rather than the guessed target, for all four seats',()=>{
    let state=ready(17);state.turn='p2';state.phase='draw';state=engine.applyAction(state,'p2',{type:'draw'});
    if(state.phase==='place-joker')state=engine.applyAction(state,'p2',{type:'place-joker',payload:{index:1}});
    const drawn=state.drawnIndex!;
    const next=engine.applyAction(state,'p2',{type:'guess',payload:{target:'p3',index:0,value:state.hands.p3[0].value===0?1:0}}),view=viewFor(next),event=view.policy.log.at(-1)!;
    expect(fourDaVinciTileFeedback(view,event,'p2',drawn).flipping).toBe(true);
    expect(fourDaVinciTileFeedback(view,event,'p3',0).flipping).toBe(false);
    expect(view.policy.log.filter(item=>item.actor!=='p1').every(item=>item.insertedIndex===undefined)).toBe(true);
  });
  it('uses native public event sounds for every real seat and a team victory cue at the finish',()=>{
    const state=ready(17);state.turn='p3';state.phase='guess';
    const next=engine.applyAction(state,'p3',{type:'guess',payload:{target:'p4',index:0,value:state.hands.p4[0].value}}),event=viewFor(next).policy.log.at(-1)!;
    expect(fourDaVinciEventCue(event)).toBe('correct');
    expect(fourDaVinciEventCue(event,{winner:'A',scores:{A:6,B:3},reason:{ko:'승리',es:'Victoria'}})).toBe('win');
    expect(fourDaVinciEventCue({...event,type:'draw'})).toBe('draw');
    expect(fourDaVinciEventCue({...event,type:'wrong-guess'})).toBe('error');
    expect(fourDaVinciEventCue({...event,type:'ready'})).toBeNull();
  });
  it('keeps the native final winning reveal and own replay result',()=>{
    const state=ready(17);state.turn='p3';state.phase='guess';
    state.hands.p4=state.hands.p4.map(tile=>({...tile,revealed:true}));state.hands.p2=state.hands.p2.map((tile,index)=>({...tile,revealed:index!==1}));
    const next=engine.applyAction(state,'p3',{type:'guess',payload:{target:'p2',index:1,value:state.hands.p2[1].value}}),view=viewFor(next),event=view.policy.log.at(-1)!;
    expect(fourDaVinciTileFeedback(view,event,'p2',1).winning).toBe(true);
    expect(render(view)).toContain('is-winning-reveal');expect(render(view)).toContain('우리 팀 승리!');expect(render(view)).toContain('>다시 하기</button>');expect(render(view)).not.toContain('>새 판</button>');
    expect(daVinciTeamAction(view,'p2',{type:'draw'})).toBeNull();
  });
});
