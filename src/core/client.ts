import { type SupabaseClient, type RealtimeChannel } from '@supabase/supabase-js';
import { engines } from './registry';
import { createMatchState } from './newMatch';
import { aiTurnDelay, chooseSimpleAiAction, supportsAi } from '../games/simpleAi';
import { executeAction, RETENTION_MS, chatMessageForGame, reactionMessageForId } from './authority';
import type { ReactionId } from './reactions';
import type { GameId, GameAction, Language, PlayerId } from './types';
import { advanceCatchmind, getCatchmindHintStage, isCorrectGuess, getCatchmindDrawDurationMs } from '../games/catchmind';

export interface RoomPlayer { id: PlayerId; nickname: string; language: Language; ready: boolean }
export interface ChatMessage { id: string; playerId: PlayerId; text: string; translation?: string; targetLanguage?: Language; status: 'original'|'translated'|'limit'|'unavailable'|'correct'; createdAt:string }
export interface RoomSnapshot { roomId:string|null; mode:'demo'|'online'|'solo'; playerId:PlayerId; players:RoomPlayer[]; gameId:GameId|null; version:number; view:any|null; messages:ChatMessage[]; pendingGame:GameId|null; error:string|null; connection?:'local'|'connecting'|'connected'|'reconnecting'; syncEpoch?:number; invitationNotice?:'invitation_changed'|'invitation_acceptance_failed'|null }
import { onlineDb } from './supabase';
export const isOnlineConfigured = Boolean(onlineDb);
const emptySnapshot = (): RoomSnapshot => ({roomId:null,mode:isOnlineConfigured?'online':'demo',playerId:'p1',players:[],gameId:null,version:0,view:null,messages:[],pendingGame:null,error:null,connection:isOnlineConfigured?'connecting':'local',syncEpoch:0});
class RoomClient {
  constructor(private db:SupabaseClient|null = onlineDb, private solo = false) {}
  private botTimer:ReturnType<typeof setTimeout>|null=null;
  private snapshot = emptySnapshot();
  private state:any=null;
  private listeners=new Set<(snapshot:RoomSnapshot)=>void>();
  private channels:RealtimeChannel[]=[];
  private pendingBy:PlayerId|null=null;
  private expiresAt=0;
  private refreshId=0;
  private resyncRequired=false;
  private requestQueue:Promise<void>=Promise.resolve();
  getSnapshot = () => this.snapshot;
  private emit() { this.snapshot={...this.snapshot}; for(const cb of this.listeners) cb(this.snapshot); this.scheduleBot(); }
  private cancelBot() { if(this.botTimer!==null)clearTimeout(this.botTimer);this.botTimer=null; }
  private scheduleBot() {
    this.cancelBot();
    if(!this.solo || !this.listeners.size || !this.state || !this.snapshot.gameId || this.state.result)return;
    const game=this.snapshot.gameId,engine=engines[game]!;
    const action=chooseSimpleAiAction(game,engine.getPlayerView(this.state,'p2'),'p2');
    if(!action)return;
    this.botTimer=setTimeout(()=>{
      this.botTimer=null;
      try { this.state=executeAction(engine,this.state,'p2',action).state;this.snapshot.version++;this.localView();this.emit(); }
      catch(error) { this.snapshot.error=error instanceof Error?error.message:'ai_action_failed';this.emitWithoutBot(); }
    },aiTurnDelay(game));
  }
  private emitWithoutBot() { this.snapshot={...this.snapshot};for(const cb of this.listeners)cb(this.snapshot); }
  private localView() { const engine=this.snapshot.gameId?engines[this.snapshot.gameId]:null; this.snapshot.view=engine&&this.state?{...engine.getPlayerView(this.state,this.snapshot.playerId),deadlineAt:this.state.deadlineAt??null}:null; }
  private async session() { if(!this.db)return; const {data}=await this.db.auth.getSession(); if(!data.session){const {error}=await this.db.auth.signInAnonymously();if(error)throw error;} }
  private name(value:string) { const name=value.trim(); if(!name || name.length>24)throw new Error('nickname_required'); return name; }
  async createRoom(nickname:string,language:Language):Promise<string> {
    nickname=this.name(nickname);
    if(!this.db){this.snapshot={...emptySnapshot(),roomId:(this.solo?'solo-':'')+crypto.randomUUID(),mode:this.solo?'solo':'demo',connection:'local',players:[{id:'p1',nickname,language,ready:true},{id:'p2',nickname:this.solo?(language==='ko'?'컴퓨터':'Computadora'):(language==='ko'?'로컬 플레이어 2':'Jugador local 2'),language:this.solo?language:(language==='ko'?'es':'ko'),ready:true}]};this.state=null;this.expiresAt=Date.now()+RETENTION_MS;this.emit();return this.snapshot.roomId!;}
    await this.session();const {data,error}=await this.db.rpc('create_room',{p_nickname:nickname,p_language:language});if(error)throw error;this.refreshId++;this.resyncRequired=false;this.snapshot={...emptySnapshot(),roomId:data};await this.refresh();return data;
  }
  async joinRoom(roomId:string,nickname:string,language:Language,acceptInvitation=false):Promise<void> {
    if(this.solo)throw new Error('solo_session_only');
    nickname=this.name(nickname);
    if(!this.db){if(this.snapshot.roomId!==roomId || this.expiresAt<Date.now())throw new Error('demo_same_browser_only');this.localSeat('p2');return;}
    await this.session();
    let newMember=false, membershipCheckFailed=false;
    if(acceptInvitation){
      try { const before=await this.db.rpc('room_snapshot',{p_room:roomId});newMember=!before.error&&!before.data;membershipCheckFailed=!!before.error; }
      catch { membershipCheckFailed=true; }
    }
    const {error}=await this.db.rpc('join_room',{p_room:roomId,p_nickname:nickname,p_language:language});if(error)throw error;
    if(this.snapshot.roomId!==roomId){this.refreshId++;this.resyncRequired=false;this.snapshot={...emptySnapshot(),roomId};}
    else this.snapshot.invitationNotice=null;
    await this.refresh();
    if(!acceptInvitation || this.snapshot.roomId!==roomId || this.snapshot.playerId!=='p2' || this.snapshot.gameId || !this.snapshot.pendingGame)return;
    if(membershipCheckFailed){this.snapshot.invitationNotice='invitation_acceptance_failed';this.emit();return;}
    if(!newMember)return;
    const invitedGame=this.snapshot.pendingGame;
    try { await this.invoke({selectGame:invitedGame}); }
    catch(cause) {
      // Joining succeeded. A changed proposal needs a fresh manual choice, never another acceptance.
      if(this.snapshot.roomId===roomId){this.snapshot.invitationNotice=this.snapshot.gameId?null:cause instanceof Error&&cause.message==='stale_state'?'invitation_changed':'invitation_acceptance_failed';this.emit();}
    }
  }
  subscribeRoom(roomId:string,onChange:(snapshot:RoomSnapshot)=>void) {
    if(this.db && this.snapshot.roomId!==roomId){this.refreshId++;this.resyncRequired=false;this.snapshot={...emptySnapshot(),roomId};}
    this.listeners.add(onChange);onChange(this.snapshot);
    if(this.db){
      let live=true;
      const current=()=>live && this.snapshot.roomId===roomId;
      const failed=(e:Error)=>{if(current()){this.resyncRequired=true;this.snapshot.error=e.message;this.snapshot.connection='reconnecting';this.emit();}};
      this.snapshot.roomId=roomId;
      void this.session().then(()=>{if(current())return this.refresh();}).catch(failed);
      const refresh=()=>{if(current())void this.refresh().catch(failed);};
      const ch=this.db.channel(`room:${roomId}`).on('postgres_changes',{event:'*',schema:'public',table:'rooms',filter:`id=eq.${roomId}`},refresh).on('postgres_changes',{event:'*',schema:'public',table:'room_views',filter:`room_id=eq.${roomId}`},refresh).on('postgres_changes',{event:'*',schema:'public',table:'chat_messages',filter:`room_id=eq.${roomId}`},refresh).on('postgres_changes',{event:'*',schema:'public',table:'room_members',filter:`room_id=eq.${roomId}`},refresh).subscribe(status=>{
        if(!current())return;
        if(status==='SUBSCRIBED'){
          const recovering=this.snapshot.connection==='reconnecting';
          this.snapshot.connection='connected';this.emit();
          void this.refresh(recovering).catch(failed);
        }else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status)){
          this.resyncRequired=true;this.snapshot.connection='reconnecting';this.emit();
        }
      });this.channels.push(ch);
      const resume=()=>{if(current() && (typeof document==='undefined' || document.visibilityState!=='hidden'))void this.reconnectRoom().catch(failed);};
      if(typeof window!=='undefined'){window.addEventListener('online',resume);window.addEventListener('focus',resume);document.addEventListener('visibilitychange',resume);}
      return ()=>{live=false;if(this.snapshot.roomId===roomId)this.refreshId++;this.listeners.delete(onChange);if(typeof window!=='undefined'){window.removeEventListener('online',resume);window.removeEventListener('focus',resume);document.removeEventListener('visibilitychange',resume);}void this.db?.removeChannel(ch);this.channels=this.channels.filter(x=>x!==ch);};
    }this.scheduleBot();return ()=>{this.listeners.delete(onChange);if(!this.listeners.size)this.cancelBot();};
  }
  async reconnectRoom() {
    if(!this.db || !this.snapshot.roomId)return;
    const roomId=this.snapshot.roomId;
    await this.session();
    if(roomId!==this.snapshot.roomId)return;
    await this.refresh(true);
  }
  private async refresh(resync=false) {
    if(!this.db || !this.snapshot.roomId)return;
    if(resync)this.resyncRequired=true;
    const roomId=this.snapshot.roomId;
    const refreshId=++this.refreshId;
    const {data,error}=await this.db.rpc('room_snapshot',{p_room:roomId});if(refreshId!==this.refreshId || roomId!==this.snapshot.roomId)return;if(error)throw error;
    if(!data){this.snapshot={...emptySnapshot(),roomId,error:'room_expired'};this.emit();return;}
    if(data.room.version<this.snapshot.version)return;
    const syncEpoch=(this.snapshot.syncEpoch??0)+(this.resyncRequired && this.snapshot.view!==null?1:0);
    this.resyncRequired=false;
    this.snapshot={roomId:this.snapshot.roomId,mode:'online',playerId:data.seat,players:data.members.map((x:any)=>({id:x.seat,nickname:x.nickname,language:x.language,ready:true})),gameId:data.room.game_id,version:data.room.version,view:data.view,pendingGame:data.room.pending_game,error:null,connection:this.snapshot.connection,syncEpoch,invitationNotice:data.room.game_id?null:this.snapshot.invitationNotice??null,messages:data.messages.map((x:any)=>({id:x.id,playerId:x.seat,text:x.text,translation:x.translation||undefined,targetLanguage:x.target_language||undefined,status:x.status==='pending'||x.status==='processing'?'original':x.status,createdAt:x.created_at}))};this.emit();
  }
  async sendAction(action:GameAction) {
    if(this.db){await this.invoke({action});return;}
    this.checkLocal();const engine=this.snapshot.gameId?engines[this.snapshot.gameId]:null;if(!engine)throw new Error('no_game');
    if(action.type==='timeout')throw new Error('server_clock_only');
    await this.tick();this.state=executeAction(engine,this.state,this.snapshot.playerId,action).state;
    if(this.snapshot.gameId==='catchmind'&&this.state.rulesVersion!==2){if(action.type==='choose')this.state.deadlineAt=new Date(Date.now()+getCatchmindDrawDurationMs(this.state)).toISOString();else if(this.state.phase!=='drawing')this.state.deadlineAt=null;}
    this.snapshot.version++;this.localView();this.emit();
  }
  private checkLocal() {if(!this.snapshot.roomId || this.expiresAt<Date.now())throw new Error('room_expired');}
  async selectGame(gameId:GameId) {
    if(this.db){await this.invoke({selectGame:gameId});this.snapshot.invitationNotice=null;this.emit();return;}
    this.checkLocal();if(this.solo&&!supportsAi(gameId))throw new Error('solo_game_unavailable');if(!this.solo&&!(this.snapshot.pendingGame===gameId && this.pendingBy!==this.snapshot.playerId)){this.snapshot.pendingGame=gameId;this.pendingBy=this.snapshot.playerId;this.emit();return;}
    const previousGameId=this.snapshot.gameId,previousState=this.state;
    this.snapshot.gameId=gameId;this.snapshot.pendingGame=null;this.pendingBy=null;this.state=createMatchState(gameId,crypto.getRandomValues(new Uint32Array(1))[0],previousGameId,previousState);if(gameId==='catchmind'&&this.state.rulesVersion===2)this.state.playerLanguages={p1:this.snapshot.players.find(player=>player.id==='p1')?.language??'ko',p2:this.snapshot.players.find(player=>player.id==='p2')?.language??'es'};if(this.solo&&gameId==='domino'&&(previousGameId!=='domino'||!previousState))this.state=executeAction(engines.domino!,this.state,'p1',{type:'configure',payload:{difficulty:'hard'}}).state;this.snapshot.version++;this.localView();this.emit();
  }
  async sendChat(text:string) {
    const message=chatMessageForGame(this.snapshot.gameId,text);text=message.text;
    if(this.db){await this.invoke({chat:text});return;}
    this.checkLocal();await this.tick();let correct=false;
    if(message.status==='pending' && this.snapshot.gameId==='catchmind' && this.state?.phase==='drawing' && this.state?.drawer!==this.snapshot.playerId){const matching=isCorrectGuess(this.state,text);try{await this.sendAction({type:'guess',payload:{text}});correct=matching;}catch{/* Human chat remains available when guess not accepted. */}}
    const saved:ChatMessage={id:crypto.randomUUID(),playerId:this.snapshot.playerId,text:correct?'':text,status:correct?'correct':message.status==='pending'?'unavailable':'original',createdAt:new Date().toISOString()};
    this.snapshot.messages=[...this.snapshot.messages,saved].filter(x=>Date.now()-Date.parse(x.createdAt)<RETENTION_MS);this.emit();
  }
  async sendReaction(reactionId:ReactionId) {
    const message=reactionMessageForId(reactionId);
    if(this.db){await this.invoke({reaction:reactionId});return;}
    this.checkLocal();
    this.snapshot.messages=[...this.snapshot.messages,{id:crypto.randomUUID(),playerId:this.snapshot.playerId,text:message.text,status:message.status,createdAt:new Date().toISOString()}].filter(x=>Date.now()-Date.parse(x.createdAt)<RETENTION_MS);this.emit();
  }
  async tick() {
    if(this.snapshot.gameId!=='catchmind'||!this.snapshot.view)return;
    const now=Date.now(), view=this.snapshot.view, board=view.board;
    if(board?.rulesVersion===2){
      const due=view.phase==='choosing'&&board.choosingDeadlineAt&&Date.parse(board.choosingDeadlineAt)<=now
        ||view.phase==='round-over'&&board.roundOverAt&&Date.parse(board.roundOverAt)<=now
        ||view.phase==='drawing'&&view.deadlineAt&&(Date.parse(view.deadlineAt)<=now||getCatchmindHintStage({settings:board.settings,deadlineAt:view.deadlineAt,rulesVersion:2} as any,now)>board.hintStage);
      if(!due)return;
      if(this.db){await this.invoke({tick:true});return;}
      const next=advanceCatchmind(this.state,now);
      if(next!==this.state){this.state=next;this.snapshot.version++;this.localView();this.emit();}
      return;
    }
    if(!view.deadlineAt)return;
    const expired=Date.parse(view.deadlineAt)<=now;
    if(this.db){if(expired)await this.invoke({tick:true});return;}
    if(this.state?.phase==='drawing'){
      let changed=false;
      if(expired){this.state=executeAction(engines.catchmind!,this.state,this.state.drawer,{type:'timeout'}).state;this.state.deadlineAt=null;changed=true;}
      if(changed){this.snapshot.version++;this.localView();this.emit();}
    }
  }
  private invoke(operation:Record<string,unknown>) {
    const roomId=this.snapshot.roomId;
    const selectionVersion=operation.selectGame!==undefined || operation.action && (['domino','jaipur','splendor'].includes(this.snapshot.gameId??'') || this.snapshot.gameId==='catchmind'&&['choose','settings'].includes((operation.action as GameAction).type)) ? this.snapshot.version : null;
    const drawingDeadline=this.snapshot.gameId==='catchmind'&&operation.action&&this.snapshot.view?.phase==='drawing'?this.snapshot.view.deadlineAt:null;
    const catchmindIdentity=this.snapshot.gameId==='catchmind'&&this.snapshot.view?.board?.rulesVersion===2&& (operation.action||operation.chat) ? {roundId:this.snapshot.view.board.roundId,expectedPhase:this.snapshot.view.phase}:null;
    const request=this.requestQueue.then(()=>this.invokeNow(operation,roomId,selectionVersion,drawingDeadline,catchmindIdentity));
    this.requestQueue=request.catch(()=>{});return request;
  }
  private async invokeNow(operation:Record<string,unknown>,roomId:string|null,selectionVersion:number|null,drawingDeadline:string|null,catchmindIdentity:{roundId:string;expectedPhase:string}|null) {
    const requestId=crypto.randomUUID();
    for(let attempt=0;attempt<2;attempt++){
      if(!roomId || roomId!==this.snapshot.roomId)throw new Error('room_expired');
      if(selectionVersion!==null && selectionVersion!==this.snapshot.version)throw new Error('stale_state');
      if(drawingDeadline && drawingDeadline!==this.snapshot.view?.deadlineAt)throw new Error('stale_state');
      const {error}=await this.db!.functions.invoke('action',{body:{roomId,version:this.snapshot.version,requestId,...operation,...catchmindIdentity}});
      if(!error){await this.refresh();return;}
      if(selectionVersion!==null && ['FunctionsFetchError','FunctionsRelayError'].includes(error.name)){
        if(roomId===this.snapshot.roomId){
          this.resyncRequired=true;this.snapshot.connection='reconnecting';this.emit();
          try{await this.refresh(true);}catch{/* Completion is unknown; preserve the table and offer an explicit snapshot retry. */}
        }
        throw new Error('action_confirmation_unknown');
      }
      let code=error.message;try{const body=await error.context?.json();code=body?.error||code;}catch{/* Transport errors have no JSON response. */}
      if(code==='stale_state'&&attempt===0){await this.refresh();if(selectionVersion!==null || catchmindIdentity && (this.snapshot.view?.board?.roundId!==catchmindIdentity.roundId || this.snapshot.view?.phase!==catchmindIdentity.expectedPhase))throw new Error('stale_state');continue;}throw new Error(code);
    }
  }
  async closeRoom() {
    if(this.db){const {error}=await this.db.rpc('close_room',{p_room:this.snapshot.roomId});if(error)throw error;}
    try {
      if(this.snapshot.roomId && localStorage.getItem('dos-last-room')===this.snapshot.roomId)localStorage.removeItem('dos-last-room');
    } catch {/* An optional room shortcut must not prevent closing a room. */}
    this.cancelBot();this.snapshot=emptySnapshot();this.state=null;this.expiresAt=0;this.emit();
  }
  async setLanguage(language:Language) {if(!['ko','es'].includes(language))throw new Error('invalid_language');if(this.db){const {error}=await this.db.rpc('set_language',{p_room:this.snapshot.roomId,p_language:language});if(error)throw error;await this.refresh();}else{this.snapshot.players=this.snapshot.players.map(p=>p.id===this.snapshot.playerId?{...p,language}:p);this.emit();}}
  localSeat(player:PlayerId) {if(this.solo)throw new Error('solo_seat_fixed');if(this.db)throw new Error('online_seat_fixed');this.snapshot.playerId=player;this.localView();this.emit();}
}
export const client = new RoomClient();

export const soloClient = new RoomClient(null, true);
