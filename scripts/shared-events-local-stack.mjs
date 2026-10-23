// Genuine local Auth/Postgres/PostgREST/Realtime/Edge services for the independent shared-event QA.
import { execFileSync } from 'node:child_process';
import { createHmac, randomBytes } from 'node:crypto';
import { startLocalGateway } from './shared-events-local-gateway.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const prefix = 'shared-qa';
const dir = '/tmp/shared-events-local-qa';
await mkdir(dir, { recursive: true, mode: 0o700 });
const password = randomBytes(24).toString('hex');
const secret = randomBytes(32).toString('hex');
const jwt = role => {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const body = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ role, iss: 'supabase-local-qa', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 })}`;
  return `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`;
};
const config = { url: 'http://127.0.0.1:55431', anon: jwt('anon'), service: jwt('service_role'), password };
await writeFile(`${dir}/config.json`, JSON.stringify(config), { mode: 0o600 });
await writeFile(`${dir}/vite.env`, `VITE_SUPABASE_URL=${config.url}\nVITE_SUPABASE_ANON_KEY=${config.anon}\n`, { mode: 0o600 });
const docker = args => execFileSync('docker', args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
try { docker(['network', 'create', prefix]); } catch { /* A prior run may have left its private network. */ }
const run = (name, image, env, args = [], command = []) => {
  try { docker(['rm', '-fv', `${prefix}-${name}`]); } catch { /* Nothing to remove on the first run. */ }
  return docker(['run', '-d', '--name', `${prefix}-${name}`, '--network', prefix, '--add-host', 'host.docker.internal:host-gateway', ...Object.entries(env).flatMap(([key, value]) => ['-e', `${key}=${value}`]), ...args, image, ...command]);
};
const sleep = ms => new Promise(done => setTimeout(done, ms));
async function ready(url, label) {
  for (let attempt = 0; attempt < 90; attempt++) {
    try { const response = await fetch(url); if (response.status < 500) { console.log(`${label} ready`); return; } } catch { /* Starting. */ }
    await sleep(500);
  }
  throw new Error(`${label} did not start; inspect its Docker logs`);
}
run('db', 'postgres:17-alpine', { POSTGRES_PASSWORD: password, POSTGRES_DB: 'postgres' }, ['-p', '127.0.0.1:55432:5432'], ['postgres', '-c', 'wal_level=logical', '-c', 'max_replication_slots=20', '-c', 'max_wal_senders=20']);
for (let attempt = 0; ; attempt++) {
  try { docker(['exec', `${prefix}-db`, 'pg_isready', '-U', 'postgres']); break; } catch { if (attempt > 60) throw new Error('Postgres did not start'); await sleep(500); }
}
const sql = text => execFileSync('docker', ['exec', '-i', `${prefix}-db`, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1'], { input: text, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
// Supabase Realtime's row-change adapter needs wal2json, absent from the small stock PostgreSQL image.
docker(['cp', '/etc/ssl/certs/ca-certificates.crt', `${prefix}-db:/etc/ssl/certs/ca-certificates.crt`]);
docker(['exec', `${prefix}-db`, 'apk', 'add', '--no-cache', 'build-base']);
execFileSync('curl', ['-fsSL', 'https://github.com/eulerto/wal2json/archive/refs/tags/wal2json_2_6.tar.gz', '-o', `${dir}/wal2json.tar.gz`]);
docker(['cp', `${dir}/wal2json.tar.gz`, `${prefix}-db:/tmp/wal2json.tar.gz`]);
docker(['exec', `${prefix}-db`, 'sh', '-c', 'mkdir -p /tmp/wal2json-src && tar xzf /tmp/wal2json.tar.gz -C /tmp/wal2json-src --strip-components=1 && make -C /tmp/wal2json-src USE_PGXS=1 with_llvm=no && make -C /tmp/wal2json-src USE_PGXS=1 with_llvm=no install']);
sql("alter system set output_plugin_libraries='pgoutput','test_decoding','wal2json';");
sql('select pg_reload_conf();');
sql(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create role authenticator login password '${password}' noinherit; grant anon,authenticated,service_role to authenticator;
create role supabase_auth_admin login superuser password '${password}';
alter role supabase_auth_admin set search_path=auth;
create role supabase_admin login superuser replication password '${password}';
create role dashboard_user nologin;
create schema auth authorization supabase_auth_admin;
create schema _realtime authorization supabase_admin;
create schema realtime authorization supabase_admin;
create publication supabase_realtime;
grant usage on schema public to anon,authenticated,service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;`);
const internalNoProxy = '127.0.0.1,localhost,host.docker.internal,shared-qa-db,shared-qa-auth,shared-qa-rest';
run('auth', 'supabase/gotrue:v2.197.0', {
  GOTRUE_API_HOST: '0.0.0.0', GOTRUE_API_PORT: '9999', API_EXTERNAL_URL: `${config.url}/auth/v1`,
  GOTRUE_DB_DRIVER: 'postgres', GOTRUE_DB_DATABASE_URL: `postgres://supabase_auth_admin:${password}@${prefix}-db:5432/postgres`,
  GOTRUE_SITE_URL: 'http://127.0.0.1:55440', GOTRUE_DISABLE_SIGNUP: 'false', GOTRUE_JWT_SECRET: secret,
  GOTRUE_JWT_ADMIN_ROLES: 'service_role', GOTRUE_JWT_AUD: 'authenticated', GOTRUE_JWT_DEFAULT_GROUP_NAME: 'authenticated', GOTRUE_JWT_EXP: '3600',
  GOTRUE_EXTERNAL_ANONYMOUS_USERS_ENABLED: 'true', GOTRUE_EXTERNAL_EMAIL_ENABLED: 'true', GOTRUE_MAILER_AUTOCONFIRM: 'true',
  GOTRUE_RATE_LIMIT_ANONYMOUS_USERS: '1000', NO_PROXY: internalNoProxy,
}, ['-p', '127.0.0.1:55433:9999']);
await ready('http://127.0.0.1:55433/health', 'Auth');
sql(`grant usage on schema auth to anon,authenticated,service_role;
grant execute on function auth.uid() to anon,authenticated,service_role;`);
for (const file of ['202610180006_shared_event_sessions.sql', '202610180007_shared_event_round_commit.sql', '202610180008_shared_event_lifecycle.sql']) {
  // Cron scheduling needs the Supabase pg_cron extension; all executable application SQL is unmodified.
  sql((await readFile(resolve('supabase/migrations', file), 'utf8')).replace(/select cron\.schedule\([\s\S]*$/, ''));
}
run('rest', 'postgrest/postgrest:v14.18', {
  PGRST_DB_URI: `postgres://authenticator:${password}@${prefix}-db:5432/postgres`, PGRST_DB_SCHEMAS: 'public',
  PGRST_DB_ANON_ROLE: 'anon', PGRST_JWT_SECRET: secret, PGRST_DB_USE_LEGACY_GUCS: 'false', NO_PROXY: internalNoProxy,
}, ['-p', '127.0.0.1:55434:3000']);
await ready('http://127.0.0.1:55434/', 'PostgREST');
run('realtime', 'supabase/realtime:v2.143.3', {
  PORT: '4000', DB_HOST: `${prefix}-db`, DB_PORT: '5432', DB_USER: 'supabase_admin', DB_PASSWORD: password,
  DB_NAME: 'postgres', DB_AFTER_CONNECT_QUERY: 'SET search_path TO _realtime', DB_ENC_KEY: 'supabaserealtime',
  API_JWT_SECRET: secret, METRICS_JWT_SECRET: secret, SECRET_KEY_BASE: randomBytes(64).toString('hex'),
  ERL_AFLAGS: '-proto_dist inet_tcp', DNS_NODES: "''", RLIMIT_NOFILE: '10000', APP_NAME: 'realtime',
  SEED_SELF_HOST: 'true', RUN_JANITOR: 'true', DISABLE_HEALTHCHECK_LOGGING: 'true', NO_PROXY: internalNoProxy,
}, ['-p', '127.0.0.1:55436:4000', '--hostname', 'realtime-dev.supabase-realtime']);

const gateway = await startLocalGateway();
const edgeArgs = ['-p', '127.0.0.1:55435:9000', '--mount', `type=bind,src=${resolve('supabase/functions')},dst=/functions,readonly`];
const edgeEnv = { SUPABASE_URL: 'http://host.docker.internal:55431', SUPABASE_ANON_KEY: config.anon, SUPABASE_SERVICE_ROLE_KEY: config.service, NO_PROXY: internalNoProxy, no_proxy: internalNoProxy };
if (process.env.CODEX_PROXY_CERT) {
  edgeArgs.push('--mount', 'type=bind,src=/etc/ssl/certs/ca-certificates.crt,dst=/etc/ssl/certs/ca-certificates.crt,readonly');
  edgeEnv.DENO_CERT = '/etc/ssl/certs/ca-certificates.crt'; edgeEnv.SSL_CERT_FILE = edgeEnv.DENO_CERT; edgeEnv.DENO_TLS_CA_STORE = 'system';
}
run('edge', 'supabase/edge-runtime:v1.77.4', edgeEnv, edgeArgs, ['start', '--main-service', '/functions/shared-event']);
await ready(`${config.url}/functions/v1/shared-event`, 'Edge');
console.log(`Local Supabase services ready at ${config.url}. QA credentials are in ${dir}/config.json; Vite environment in ${dir}/vite.env. No cloud resources used.`);
process.on('SIGINT', () => { gateway.close(); process.exit(0); });
process.on('SIGTERM', () => { gateway.close(); process.exit(0); });
