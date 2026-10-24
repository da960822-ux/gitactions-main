import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  auth:{getSession:vi.fn(async()=>({data:{session:{access_token:'test'}}})),signInAnonymously:vi.fn()},
  rpc:vi.fn(),functions:{invoke:vi.fn()},
}));
vi.mock('./supabase',()=>({onlineDb:db}));
type Options={existing?:boolean;game?:string|null;pending?:string|null;seat?:string;beforeError?:boolean;beforeThrows?:boolean;joinError?:boolean};
async function fixture(options:Options={}) {
  vi.resetModules();
  const server={joined:false,version:7,game:options.game??null,pending:options.pending===undefined?'domino':options.pending,seat:options.seat??'p2'};
  let createdRooms=0;
  const snapshot=()=>({room:{version:server.version,game_id:server.game,pending_game:server.pending},seat:server.seat,members:[{seat:'p1',nickname:'Host',language:'ko'},{seat:'p2',nickname:'Guest',language:'es'}],view:server.game?{phase:'play'}:null,messages:[]});
  db.rpc.mockImplementation(async(name:string)=>{
    if(name==='create_room'){
      server.joined=true;server.version=0;server.game=null;server.pending=null;server.seat='p1';
      return{data:`created-${++createdRooms}`,error:null};
    }
    if(name==='join_room'){
      if(options.joinError)return{data:null,error:new Error('room_full')};
      server.joined=true;return{data:null,error:null};
    }
    if(name==='room_snapshot'){
      if(!server.joined){
        if(options.beforeThrows)throw new Error('fetch_failed');
        if(options.beforeError)return{data:null,error:new Error('unavailable')};
        return{data:options.existing?snapshot():null,error:null};
      }
      return{data:snapshot(),error:null};
    }
    throw new Error(`Unexpected RPC ${name}`);
  });
  db.functions.invoke.mockImplementation(async(_name:string,{body}:any)=>{
    if(body.version!==server.version)return{error:{message:'stale_state'}};
    server.version++;
    if(body.selectGame){server.game=body.selectGame;server.pending=null;}
    return{error:null};
  });
  const {client}=await import('./client');
  return{client,server,snapshot};
}
beforeEach(()=>{vi.clearAllMocks();});
afterEach(()=>{vi.restoreAllMocks();});

describe('explicit initial invitation acceptance',()=>{
  it('joins a new second seat and accepts the captured proposed game exactly once',async()=>{
    const {client}=await fixture();
    await client.joinRoom('invite','Guest','es',true);
    expect(db.rpc.mock.calls.map(([name])=>name)).toEqual(['room_snapshot','join_room','room_snapshot','room_snapshot']);
    expect(db.functions.invoke).toHaveBeenCalledTimes(1);
    expect(db.functions.invoke.mock.calls[0][1].body).toMatchObject({roomId:'invite',selectGame:'domino',version:7});
    expect(client.getSnapshot()).toMatchObject({roomId:'invite',playerId:'p2',gameId:'domino',pendingGame:null,version:8,error:null});
  });

  it('keeps the existing default join flow without accepting or checking membership implicitly',async()=>{
    const {client}=await fixture();
    await client.joinRoom('invite','Guest','es');
    expect(db.rpc.mock.calls.map(([name])=>name)).toEqual(['join_room','room_snapshot']);
    expect(db.functions.invoke).not.toHaveBeenCalled();
    expect(client.getSnapshot()).toMatchObject({gameId:null,pendingGame:'domino'});
  });

  it('does not infer a new member from the empty local cache when the server already knows the member',async()=>{
    const {client}=await fixture({existing:true});
    expect(client.getSnapshot().players).toEqual([]);
    await client.joinRoom('invite','Guest','es',true);
    expect(db.functions.invoke).not.toHaveBeenCalled();
    expect(client.getSnapshot()).toMatchObject({roomId:'invite',pendingGame:'domino',playerId:'p2'});
  });

  it.each([{game:'davinci',pending:'domino'},{game:null,pending:null},{game:null,pending:'domino',seat:'p1'}])('does not auto-accept an active game, absent proposal or first seat: %j',async options=>{
    const {client}=await fixture(options);
    await client.joinRoom('invite','Guest','es',true);
    expect(db.functions.invoke).not.toHaveBeenCalled();
  });

  it.each([{beforeError:true},{beforeThrows:true}])('fails closed on membership lookup failure but preserves a successful join: %j',async options=>{
    const {client}=await fixture(options);
    await expect(client.joinRoom('invite','Guest','es',true)).resolves.toBeUndefined();
    expect(db.functions.invoke).not.toHaveBeenCalled();
    expect(client.getSnapshot()).toMatchObject({roomId:'invite',playerId:'p2',gameId:null,pendingGame:'domino',error:null,invitationNotice:'invitation_acceptance_failed'});
  });

  it('does not accept after a rejected join',async()=>{
    const {client}=await fixture({joinError:true});
    await expect(client.joinRoom('invite','Guest','es',true)).rejects.toThrow('room_full');
    expect(db.functions.invoke).not.toHaveBeenCalled();
  });

  it('does not retry stale consent against a replacement proposal and leaves manual acceptance available',async()=>{
    const {client,server}=await fixture();
    db.functions.invoke.mockImplementationOnce(async()=>{server.version=8;server.pending='splendor';return{error:{message:'stale_state'}};});
    await expect(client.joinRoom('invite','Guest','es',true)).resolves.toBeUndefined();
    expect(db.functions.invoke).toHaveBeenCalledTimes(1);
    expect(client.getSnapshot()).toMatchObject({roomId:'invite',playerId:'p2',gameId:null,pendingGame:'splendor',version:8,error:null,invitationNotice:'invitation_changed'});
    await client.selectGame('splendor');
    expect(db.functions.invoke).toHaveBeenCalledTimes(2);
    expect(db.functions.invoke.mock.calls[1][1].body).toMatchObject({selectGame:'splendor',version:8});
    expect(client.getSnapshot()).toMatchObject({gameId:'splendor',invitationNotice:null});
  });

  it('keeps entry successful after a transport failure without resending uncertain acceptance',async()=>{
    const {client}=await fixture();
    db.functions.invoke.mockResolvedValueOnce({error:{name:'FunctionsFetchError',message:'Response lost'}});
    await expect(client.joinRoom('invite','Guest','es',true)).resolves.toBeUndefined();
    expect(db.functions.invoke).toHaveBeenCalledTimes(1);
    expect(client.getSnapshot()).toMatchObject({roomId:'invite',playerId:'p2',pendingGame:'domino',gameId:null,invitationNotice:'invitation_acceptance_failed'});
  });

  it('retains a game confirmed by refresh after the acceptance response was lost',async()=>{
    const {client,server}=await fixture();
    db.functions.invoke.mockImplementationOnce(async()=>{server.version++;server.game='domino';server.pending=null;return{error:{name:'FunctionsFetchError',message:'Response lost'}};});
    await client.joinRoom('invite','Guest','es',true);
    expect(db.functions.invoke).toHaveBeenCalledTimes(1);
    expect(client.getSnapshot()).toMatchObject({roomId:'invite',gameId:'domino',pendingGame:null,version:8,invitationNotice:null});
  });

  it('an existing member still cannot auto-accept through an opt-in rejoin after the local cache was reset',async()=>{
    const {client,server}=await fixture();
    await client.joinRoom('invite','Guest','es');
    expect(server.joined).toBe(true);
    await client.joinRoom('invite','Guest','es',true);
    expect(db.functions.invoke).not.toHaveBeenCalled();
  });

  it('loads a different joined room even when its authoritative version is lower than the previous room',async()=>{
    const {client,server}=await fixture();
    await client.joinRoom('old','Guest','es');
    server.version=1;
    await client.joinRoom('new','Guest','es');
    expect(client.getSnapshot()).toMatchObject({roomId:'new',version:1,playerId:'p2',pendingGame:'domino'});
  });

  it('resets the previous room version and state on every successful create before proposing its game',async()=>{
    const {client}=await fixture({game:'davinci'});
    await client.joinRoom('old','Guest','es');
    expect(client.getSnapshot()).toMatchObject({roomId:'old',version:7,playerId:'p2',gameId:'davinci'});
    for(const roomId of ['created-1','created-2']){
      await expect(client.createRoom('Host','ko')).resolves.toBe(roomId);
      expect(client.getSnapshot()).toMatchObject({roomId,version:0,playerId:'p1',gameId:null,pendingGame:null,view:null,error:null,invitationNotice:null});
      await expect(client.selectGame('domino')).resolves.toBeUndefined();
      expect(db.functions.invoke.mock.calls.at(-1)![1].body).toMatchObject({roomId,version:0,selectGame:'domino'});
      expect(client.getSnapshot().version).toBe(1);
    }
  });

  it('clears an acceptance notice when a later authoritative refresh confirms a running game',async()=>{
    const {client,server}=await fixture();
    db.functions.invoke.mockResolvedValueOnce({error:{message:'unavailable'}});
    await client.joinRoom('invite','Guest','es',true);
    expect(client.getSnapshot().invitationNotice).toBe('invitation_acceptance_failed');
    server.game='domino';server.pending=null;server.version++;
    await client.reconnectRoom();
    expect(client.getSnapshot()).toMatchObject({gameId:'domino',invitationNotice:null});
    expect(db.functions.invoke).toHaveBeenCalledTimes(1);
  });

  it('pins ordinary selection versions and never replaces a new proposal after stale refresh',async()=>{
    const {client,server}=await fixture();
    await client.joinRoom('invite','Guest','es');
    db.functions.invoke.mockImplementationOnce(async()=>{server.version++;server.pending='splendor';return{error:{message:'stale_state'}};});
    await expect(client.selectGame('domino')).rejects.toThrow('stale_state');
    expect(db.functions.invoke).toHaveBeenCalledTimes(1);
    expect(client.getSnapshot()).toMatchObject({version:8,pendingGame:'splendor',gameId:null});
  });

  it('rejects a queued selection before sending if another queued operation advances the snapshot version',async()=>{
    const {client,server}=await fixture();
    await client.joinRoom('invite','Guest','es');
    let release!:()=>void;
    db.functions.invoke.mockImplementationOnce(async()=>{await new Promise<void>(resolve=>{release=resolve;});server.version++;return{error:null};});
    const first=client.sendReaction('wow');
    await vi.waitFor(()=>expect(release).toBeTypeOf('function'));
    const selection=client.selectGame('domino');
    const rejected=expect(selection).rejects.toThrow('stale_state');
    release();await first;await rejected;
    expect(db.functions.invoke).toHaveBeenCalledTimes(1);
    expect(client.getSnapshot().pendingGame).toBe('domino');
  });
});
