import { legacyInitial } from './marble.effectFixtures';
import { describe, expect, it } from 'vitest';
import { classicKoreaBoard, classicKoreaProfile } from './marbleBoardProfiles';
import { marbleEngine, createClassicKoreaResearchState } from './marble';
import { fourMarbleEngine, createFourClassicKoreaResearchState } from './fourMarble';

describe('2015 Korea route research profile', () => {
  it('matches all32 observed positions without changing tourism into ordinary cities', () => {
    expect(classicKoreaBoard.map(t => t.name.ko)).toEqual(['시작','강릉','오락실','춘천','북한산','경주','안동','천안','감옥','서울대공원','인천','대전','포츈카드','청주','설악산','세종','엑스포','여수','지리산','제주','포츈카드','포항','울산','대구','기차여행','어린이대공원','전주','광주','포츈카드','부산','복불복','서울']);
    expect([0,8,16,24].map(i => classicKoreaBoard[i].kind)).toEqual(['start','island','expo','train']);
    expect(classicKoreaBoard.filter(t => t.kind === 'property')).toHaveLength(18);
    const tourism = classicKoreaBoard.filter(t => t.kind === 'tourism'); expect(tourism).toHaveLength(5); expect(tourism.every(t => !t.group)).toBe(true);
    expect(tourism.filter(t => t.tourismGroup === 'mountain')).toHaveLength(3);
    expect(tourism.filter(t => t.tourismGroup === 'park')).toHaveLength(2);
    expect(Array.from({length:8},(_,i)=>classicKoreaBoard.filter(t=>t.group===`korea-g${i+1}`).length)).toEqual([2,3,2,2,2,3,2,2]);
    expect(classicKoreaBoard.filter(t => t.kind === 'property').every(t => t.cityEconomy?.profile === 'mobile-2013-first-x3-v1')).toBe(true);
    expect(classicKoreaBoard[31]).toMatchObject({ price: 300, rent: 120 });
  });
  for (const [name, engine, create] of [['2p',marbleEngine,createClassicKoreaResearchState],['4p',fourMarbleEngine,createFourClassicKoreaResearchState]] as const) {
    it(`${name} exposes32 only via explicit blocked research state and leaves default40 intact`, () => {
      const preview = create(9), view: any = engine.getPlayerView(preview as any, 'p1');
      const board = view.board ?? view.publicState, tiles = view.board?.tiles ?? view.publicBoard;
      expect(preview.cityRouteVersion).toBe(4); expect(preview.constructionRulesVersion).toBe(2); expect(board.boardSize).toBe(32); expect(tiles).toHaveLength(32);
      expect(board.profileMetadata).toMatchObject({ status:'research-pending',size:32 }); expect(board.profileMetadata.pendingRules).toContain('tourism-growth-and-tolls');
      expect(view.actions).toEqual([]); expect(engine.validateAction(preview as any,'p1',{type:'roll'})).toBeTruthy();
      expect(()=>engine.applyAction(preview as any,'p1',{type:'roll'})).toThrow();
      tiles[1].name.ko = 'changed'; expect(classicKoreaBoard[1].name.ko).toBe('강릉');
      board.profileMetadata.pendingRules.length=0; expect(classicKoreaProfile.pendingRules.length).toBeGreaterThan(0);
      const live: any = engine.getPlayerView(legacyInitial(engine, 9) as any,'p1');
      expect(live.board?.tiles ?? live.publicBoard).toHaveLength(40); expect((live.board ?? live.publicState).constructionRulesVersion).toBe(1); expect(live.actions.some((c:any)=>c.action.type==='roll')).toBe(true);
    });
  }
  it('retains every saved 2p route resolver, including premodern18 and both earlier40 versions', () => {
    const state = legacyInitial(marbleEngine, 1);
    expect(marbleEngine.getPlayerView({...state,boardVersion:undefined},'p1').board.tiles).toHaveLength(18);
    for (const cityRouteVersion of [undefined,2,3] as const) {
      const tiles = marbleEngine.getPlayerView({...state,cityRouteVersion},'p1').board.tiles;
      expect(tiles).toHaveLength(40);
      expect(tiles[3].name.ko).toBe(cityRouteVersion===undefined?'산토도밍고':'뉴욕');
    }
  });
});

it('saved production40 never exposes provisional independent purchase/build actions', () => {
  for (const engine of [marbleEngine,fourMarbleEngine]) {
    const state: any = legacyInitial(engine, 51);
    expect(state.constructionRulesVersion).toBe(1); expect(state.boardProfile).toBeUndefined(); expect(state.economyProfile).toBeUndefined();
    state.phase='decision'; state.pendingTile=1; state.positions.p1=1; state.buildSite=1;
    const choices=engine.getPlayerView(state,'p1').actions.map((choice:any)=>choice.action);
    expect(choices.filter((a:any)=>a.type==='buy')).toEqual([{type:'buy'}, ...[0,1,2].map(targetLevel=>({type:'buy',payload:{targetLevel}}))]);
    expect(choices.some((a:any)=>a.payload?.buildings || a.payload?.landmark)).toBe(false);
    const bought:any=engine.applyAction(state,'p1',{type:'buy'});
    expect(bought.properties[1]).toEqual({owner:'p1',houses:0}); expect(bought.money.p1).toBe(2920);
    const built:any=engine.applyAction(bought,'p1',{type:'build',payload:{tile:1}});
    expect(built.properties[1]).toEqual({owner:'p1',houses:1}); expect(built.money.p1).toBe(2890);
    expect(engine.getPlayerView(built,'p1').actions.some((choice:any)=>choice.action.payload?.buildings)).toBe(false);
  }
});
