import { engines } from './registry';
import { executeAction } from './authority';
import type { GameId } from './types';

export function createMatchState(gameId:GameId,seed:number,previousGameId:GameId|null=null,previousState:any=null):any {
  const engine=engines[gameId];
  if(!engine)return null;
  let state=engine.createInitialState(seed);
  if(gameId!==previousGameId||!previousState)return state;
  if(gameId==='domino'){
    const settings=previousState.settings??{},payload:Record<string,unknown>={};
    if(['1v1','partners','humans-vs-bots'].includes(previousState.mode))payload.mode=previousState.mode;
    if(['easy','normal','hard'].includes(settings.difficulty))payload.difficulty=settings.difficulty;
    if([100,200].includes(settings.targetScore))payload.targetScore=settings.targetScore;
    state=executeAction(engine,state,'p1',{type:'configure',payload}).state;
  }else if(gameId==='catchmind'){
    const action={type:'settings',payload:{settings:previousState.settings}};
    if(!engine.validateAction(state,'p1',action))state=executeAction(engine,state,'p1',action).state;
  }
  return state;
}
