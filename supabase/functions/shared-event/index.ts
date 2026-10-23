import { createClient } from 'npm:@supabase/supabase-js@2';
import { executeSharedEventRequest } from '../_shared/engines.js';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  try {
    const bearer = request.headers.get('Authorization');
    if (!bearer?.startsWith('Bearer ')) return json({ error: 'authentication_required' }, 401);
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    const { data, error } = await db.auth.getUser(bearer.slice(7));
    if (error || !data.user) return json({ error: 'authentication_required' }, 401);
    // Bound the streamed body before decoding, including requests without Content-Length.
    const reader = request.body?.getReader();
    const chunks: Uint8Array[] = []; let size = 0;
    if (reader) for (;;) {
      const part = await reader.read(); if (part.done) break;
      size += part.value.byteLength;
      if (size > 16_384) { await reader.cancel(); return json({ error: 'payload_too_large' }, 413); }
      chunks.push(part.value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    let input: unknown;
    try { input = JSON.parse(new TextDecoder().decode(bytes)); } catch { return json({ error: 'invalid_event_request' }, 400); }
    const rpc = async (name: string, args: Record<string, unknown>) => {
      const result = await db.rpc(name, args); if (result.error) throw new Error(result.error.message); return result.data;
    };
    const result = await executeSharedEventRequest({
      read: (sessionId: string, actor: string) => rpc('read_event_session_for_action', { p_session: sessionId, p_verified_actor: actor }),
      receipt: async (sessionId: string, requestId: string) => {
        const result = await db.from('event_session_receipts').select('user_id,signature').eq('session_id', sessionId).eq('request_id', requestId).maybeSingle();
        if (result.error) throw new Error('event_session_unavailable'); return result.data;
      },
      commit: (sessionId: string, actor: string, action: { revision: number; requestId: string }, next: unknown) => rpc('commit_event_session_action', { p_session: sessionId, p_verified_actor: actor, p_expected_revision: action.revision, p_request: action.requestId, p_signature: action, p_next_state: next }),
    }, data.user.id, input, Date.now());
    return json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const code = /^(invalid_event_|event_|stale_event_state|not_event_)/.test(message) ? message : 'event_request_failed';
    return json({ error: code }, code === 'stale_event_state' ? 409 : 400);
  }
});
