import {createClient} from 'npm:@supabase/supabase-js@2';
import {engines as bundledEngines,executeAction,chatMessageForGame,reactionMessageForId,isCorrectGuess,getCatchmindDrawDurationMs,getCatchmindHintStage} from '../_shared/engines.js';
const engines:Record<string,any>=bundledEngines;

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json'}});
const uuid=(s:unknown)=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
function playerViews(gameId:string|null,state:any){const engine=gameId?engines[gameId]:null;if(!engine||!state)return{p1:null,p2:null};return Object.fromEntries(['p1','p2'].map(p=>[p,{...engine.getPlayerView(state,p),deadlineAt:state.deadlineAt??null}]));}
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return json({error:'method_not_allowed'},405);
 try{
  const auth=req.headers.get('Authorization');if(!auth?.startsWith('Bearer '))return json({error:'authentication_required'},401);
  const url=Deno.env.get('SUPABASE_URL')!,key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db=createClient(url,key,{auth:{persistSession:false}});
  const {data:identity,error:authError}=await db.auth.getUser(auth.slice(7));if(authError||!identity.user)return json({error:'authentication_required'},401);
  const raw=await req.text();if(raw.length>26000)return json({error:'payload_too_large'},413);const input=JSON.parse(raw);
  if(!uuid(input.roomId)||!uuid(input.requestId)||!Number.isSafeInteger(input.version)||input.version<0)return json({error:'invalid_request'},400);
  const [roomResult,membersResult,stateResult,receipt]=await Promise.all([db.from('rooms').select('*').eq('id',input.roomId).single(),db.from('room_members').select('*').eq('room_id',input.roomId),db.from('room_states').select('state').eq('room_id',input.roomId).single(),db.from('action_receipts').select('version,user_id').eq('room_id',input.roomId).eq('request_id',input.requestId).maybeSingle()]);
  const room=roomResult.data,members=membersResult.data??[],member=members.find(m=>m.user_id===identity.user.id);
  if(!room||!member||Date.parse(room.expires_at)<=Date.now())return json({error:'room_unavailable'},403);
  if(receipt.data){if(receipt.data.user_id!==identity.user.id)return json({error:'invalid_request'},403);return json({version:receipt.data.version});}
  if(stateResult.error||membersResult.error)throw new Error('room_unavailable');
  if(room.version!==input.version)return json({error:'stale_state'},409);
  let state=stateResult.data.state,gameId=room.game_id,pending=room.pending_game,pendingBy=room.pending_by,chat:any=null;
  const operations=[input.selectGame!==undefined,input.chat!==undefined,input.reaction!==undefined,input.action!==undefined,input.tick===true].filter(Boolean).length;
  if(operations!==1)return json({error:'invalid_operation'},400);
  // Expiration and hint reveals are computed from the trusted server clock.
  const now=Date.now();
  let timedOut=false,advancedHint=false;
  if(gameId==='catchmind'&&state?.phase==='drawing'&&state.deadlineAt&&Date.parse(state.deadlineAt)<=now){
   state=executeAction(engines.catchmind,state,state.drawer,{type:'timeout'}).state;state.deadlineAt=null;
   timedOut=true;
  }else if(gameId==='catchmind'&&state?.phase==='drawing'&&state.deadlineAt&&input.tick===true){
   const target=getCatchmindHintStage(state,now);
   while((state.hintStage||0)<target){state=executeAction(engines.catchmind,state,state.drawer,{type:'reveal-hint'}).state;advancedHint=true;}
  }
  if(input.selectGame!==undefined){
   if(!['davinci','catchmind','domino','jaipur','splendor','minhwatu','marble','rhythm'].includes(input.selectGame))return json({error:'invalid_game'},400);
   if(members.length!==2||!(pending===input.selectGame&&pendingBy!==identity.user.id)){pending=input.selectGame;pendingBy=identity.user.id;}
   else{gameId=input.selectGame;pending=null;pendingBy=null;state=engines[gameId]?.createInitialState(crypto.getRandomValues(new Uint32Array(1))[0])??null;}
  }else if(input.reaction!==undefined){
   chat=reactionMessageForId(input.reaction);
  }else if(input.chat!==undefined){
   const message=chatMessageForGame(gameId,input.chat),text=message.text;let correct=false;
   if(message.status==='pending'&&gameId==='catchmind'&&state?.phase==='drawing'&&state.drawer!==member.seat&&text.length<=60){correct=isCorrectGuess(state,text);state=executeAction(engines.catchmind,state,member.seat,{type:'guess',payload:{text}}).state;if(state.phase!=='drawing')state.deadlineAt=null;}
   chat={text:correct?'':text,status:correct?'correct':message.status};
  }else if(input.action!==undefined){
   const engine=engines[gameId];if(!engine)return json({error:'no_game'},400);
   if(input.action.type==='timeout'||gameId==='catchmind'&&(input.action.type==='guess'||input.action.type==='reveal-hint'))return json({error:'use_chat_or_server_clock'},400);
   state=executeAction(engine,state,member.seat,input.action).state;
   if(gameId==='catchmind'){if(input.action.type==='choose')state.deadlineAt=new Date(Date.now()+getCatchmindDrawDurationMs(state)).toISOString();else if(state.phase!=='drawing')state.deadlineAt=null;}
  }else if(input.tick){if(gameId!=='catchmind'||(!timedOut&&!advancedHint))return json({version:room.version});}
  const {data:version,error}=await db.rpc('commit_action',{p_room:room.id,p_user:identity.user.id,p_version:input.version,p_request:input.requestId,p_state:state,p_views:playerViews(gameId,state),p_game:gameId,p_pending:pending,p_pending_by:pendingBy,p_chat:chat});
  if(error)return json({error:error.message},error.message.includes('stale_state')?409:400);
  if(chat?.status==='pending'&&gameId==='catchmind'){
   const recipient=members.find(m=>m.seat!==member.seat);
   if(!recipient||recipient.language===member.language){await db.from('chat_messages').update({status:'original'}).eq('id',input.requestId);}
   else await translate(db,input.requestId,chat.text,member.language,recipient.language);
  }
  return json({version});
 }catch(error){console.error('action_failed',error instanceof Error?error.name:'unknown');return json({error:error instanceof Error?error.message:'action_failed'},400);}
});

async function translate(db:any,messageId:string,text:string,source:string,target:string){
 const apiKey=Deno.env.get('GOOGLE_TRANSLATE_API_KEY');
 if(!apiKey){await db.from('chat_messages').update({status:'unavailable',target_language:target}).eq('id',messageId);return;}
 const {data:reserved,error}=await db.rpc('reserve_translation',{p_message:messageId,p_target:target});
 if(error||!reserved){if(error)await db.from('chat_messages').update({status:'unavailable'}).eq('id',messageId).eq('status','pending');return;}
 try{
  const response=await fetch('https://translation.googleapis.com/language/translate/v2',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':apiKey},body:JSON.stringify({q:text,source,target,format:'text'}),signal:AbortSignal.timeout(6000)});
  if(!response.ok)throw new Error('translation_unavailable');const data=await response.json();const translation=data.data?.translations?.[0]?.translatedText;
  if(typeof translation!=='string')throw new Error('translation_unavailable');
  await db.from('chat_messages').update({translation,status:'translated'}).eq('id',messageId).eq('status','processing');
 }catch{await db.from('chat_messages').update({status:'unavailable'}).eq('id',messageId).eq('status','processing');}
}
