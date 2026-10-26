# Deployment

The landing page and app are a Vite static site. This section records the current project state as checked on 2026-10-23, then gives the safe next steps for the existing project and private Site.

## Connected baseline verified at Site revision 19 — 2026-10-23

- Supabase project: `yeonseok-lisbeth-games`, ref `yqswgvqkqofxcfypvbbi`, URL `https://yqswgvqkqofxcfypvbbi.supabase.co`. The current plan is Free Nano in Singapore (`ap-southeast-1`). Anonymous sign-ins are enabled.
- The eight checked-in migrations were applied in a Dashboard SQL Editor transaction. Remote checks confirmed 13 tables, RLS and grants, Realtime publication settings, the three cleanup jobs below, and the 400,000-character monthly translation cap. Dashboard application did not populate Supabase CLI migration history; repair that history before using `db push`.
- The canonical `action` and `shared-event` function code is deployed through the Dashboard. Gateway JWT verification is disabled in `supabase/config.toml`; each function checks the bearer token with `auth.getUser`. Supabase holds the service-role secret. Do not turn off handler authentication or put that key in frontend configuration.
- Google Cloud project `My First Project` (`project-057b7aa4-ec66-4e43-906`) has Cloud Translation API enabled. Its API key is restricted to Translation API and stored in Supabase as `GOOGLE_TRANSLATE_API_KEY`. The key value is not recorded here.
- Ignored local `.env.local` and ChatGPT Site environment revision 1 contain the public project URL and publishable key under `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; neither key value belongs in source or docs. ChatGPT Site production revision 19 is deployed from source `63ac3a11d410141971cbd0c617d226731157c709`, with owner-only access, one user, zero external users, and a connected artifact containing 508 files (149,029,026 bytes). Revision 18 was the older same-browser demo.
- Live verification at revision 19 passed with two distinct Supabase anonymous users: room create/join and mutual Catchmind start. Google translation and original-message display passed for two Korean→Spanish and two Spanish→Korean ordinary chat messages. A nine-stroke jellyfish drawing appeared live in the peer's Chrome; the Spanish answer `medusa` was accepted and one point was reflected for each player. Local image, answer and score checks also passed. Evidence is in the chat output artifacts `production-catchmind-running.png` and `production-catchmind-result.png` (outside this repository).

## Current release update — 2026-10-23

Migration 202610230009_feedback_member_submission.sql was applied in a Dashboard SQL Editor transaction after the eight baseline migrations. It permits existing p1 and p2 feedback-space members to submit entries, retains membership checks and p1-only status updates, and leaves direct table insertion revoked. The returned policies were feedback_members_create INSERT, feedback_p1_status UPDATE, and feedback_space_read SELECT. CLI history still needs reconciliation for all nine applied versions before db push; do not replay migration 009 against the updated database. See [the canonical main report](reviews/CANONICAL-MAIN-20261023.md) for the source/frontend update.

## Supabase

1. Link the existing project with the Supabase CLI (`supabase login`, then `supabase link --project-ref yqswgvqkqofxcfypvbbi`). Do not create a replacement project.
2. Anonymous sign-ins are enabled. Check the deployed Site URL in the Auth redirect allow-list when preparing the new build. Anonymous Auth gives each browser an identity; room IDs alone do not grant access.
3. **Do not run `supabase db push` yet.** The nine migrations listed below already ran through the Dashboard, but CLI history is not recorded. After linking, inspect `supabase migration list` and confirm the remote schema still matches the applied state. Mark only versions missing from remote history as applied; the command below assumes all nine are missing:

   ```sh
   supabase migration repair --status applied 202610100001 202610100002 202610100003 202610100004 202610110005 202610180006 202610180007 202610180008 202610230009
   supabase migration list
   ```

   `migration repair` records history; it does not execute the SQL again. Verify the nine versions now match before any later `supabase db push`. See the [official migration history repair guide](https://supabase.com/docs/guides/deployment/database-migrations).

   The applied schema was remotely checked for 13 tables, RLS/grants, Realtime publication and these `pg_cron` jobs: `dos-seven-day-cleanup`, `feedback-seven-day-cleanup`, and `shared-event-session-five-minute-cleanup`. The database enforces a 400,000-character monthly translation reservation cap.
4. When updating the deployed function code, build the game engine bundle, then deploy **both** functions from the repository root:

   ```sh
   npm ci
   npm run build:edge
   supabase functions deploy action
   supabase functions deploy shared-event
   ```

   The canonical `action` and `shared-event` code is already deployed through the Dashboard. Both functions use Supabase's `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` secrets, supplied by Supabase. Keep the service-role key in the function environment; it must never be a `VITE_` variable or shipped to the browser. The checked-in `supabase/config.toml` disables gateway JWT verification because each handler validates the bearer token with `auth.getUser`, including current signing keys. Preserve that in-function authentication.

5. The ignored local `.env.local` and Site environment revision 1 contain the two public build values below; Site revision 19 was built and published with these settings. If either value changes, rebuild the root app and publish a new Site revision because an already-built static site cannot pick up changed build variables. Leave both values blank only when intentionally preparing the labelled same-browser practice mode.

After connecting, use two separate browser profiles to create and join an invite, agree on a game from both seats, and verify an action reaches the other seat. Confirm a third identity cannot read or join the full room. Site hosting access and Supabase room membership are separate: both participants must also be allowed by the site's existing access policy.

## Existing private Site

Build and deploy the **root application**, the only maintained landing and game application. `npm run build` still produces the static `dist` for other hosts. For the existing private ChatGPT Site, `npm run build:site` packages that same Vite output as `dist/client`, adds the Idea Box Worker at `dist/server/index.js`, and includes `dist/.openai/hosting.json` and the generated D1 migration. The game catalog, rooms, and landing retain their existing Supabase paths; only `/feedback` calls the same-origin Worker API.

Room invitations use `/play?room=<room-id>` so direct visits and refreshes work on static hosts without a dynamic `/room/<id>` rewrite. The app still accepts legacy room links on hosts that support SPA fallback.

For the existing ChatGPT Site, update its registered source checkout and keep the existing project ID and **custom two-person audience**. The tracked `.openai/hosting.json` removes `static` and declares only logical D1 binding `DB`; Sites provisions and connects it. Set the nonsecret `FEEDBACK_OWNER_USER_ID` runtime variable to the owner's stable `oai-authenticated-user-id` for this Site. The authenticated owner's `GET /api/feedback` response includes `siteUserId` for checking the value; that ID is shown only to that signed-in visitor. Until the variable is set and checked, both visitors can read and submit, but status changes and legacy imports remain disabled. Do not use the old Supabase p1 role, email address, or a browser space ID for this value.

From the registered Site source checkout, run `npm ci`, `npm test`, `npm run build:site`, and the desktop `node scripts/verify-shared-feedback.mjs`. Inspect `dist/server/index.js`, `dist/server/wrangler.json`, `dist/client/index.html`, `dist/client/feedback.html`, `dist/.openai/hosting.json`, and `dist/.openai/drizzle/0000_kind_deadpool.sql`. Package and save the pushed source commit with the Sites source helper, then deploy that saved version only after review. Sites applies the D1 migration before Worker upload. Keep the Supabase public build values for the game paths. A local build does not publish the Site.

Before production release, confirm the two already-allowed Site accounts can submit and see the same entry across separate desktop browsers and reloads; only the owner account may change status. Confirm a missing Site identity and a forged browser `oai-authenticated-user-id` header cannot access the API, and that a cross-origin write is rejected. Keep the Site audience unchanged. The old `dos-feedback-space` browser key and Supabase feedback tables may contain historical records; this release does not erase or merge them.

After release, copy only entries whose provenance the owner has reviewed via owner-only `POST /api/feedback/import` using the current signed-in Site session and same-origin JSON request. Required fields are `legacySourceId`, `category`, `title`, `body`, `status`, and original `createdAt`. The unique legacy ID makes retries harmless and conflicts explicit. Preserve the Supabase original and omit test notes. Imported records have no asserted Site author; their original timestamp remains subject to the seven-day visibility rule. Keep personal post bodies out of source, logs, and QA artifacts.

## Public build values

Set these when building the root application for any static host:

- `VITE_SUPABASE_URL`: the Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: the Supabase publishable/anon key. This is public by design; database RLS and RPC grants enforce access.

Rebuild after changing either variable. Never put the Supabase service-role key or Google key in `VITE_` variables.

## Cloudflare Pages alternative

For a separately configured Cloudflare Pages host, use the repository root, build command `npm run build`, and output directory `dist`. The checked-in `public/_redirects` is copied to `dist` and sends deep links such as `/room/<id>` to the SPA entry point. Set the two public build values for production, and for preview only if those deployments should use the backend. Cloudflare serves the static application; rooms still depend on the configured Supabase backend. `/feedback` requires the protected same-origin Worker and D1; a static-only host will show a connection error there.

## Optional chat translation

Translation uses Google Cloud Translation Basic v2 from the Supabase Edge Function. In a dedicated Google Cloud project used only by this app, enable the Cloud Translation API, create a server-side API key restricted to that API, and set it as the Supabase function secret `GOOGLE_TRANSLATE_API_KEY`. Do not add it to the site build or source tree.

The database reserves at most 400,000 characters per UTC month across all rooms in this Supabase project. This is an application-side hard limit, independent of Google's rate quotas; Google budget notifications alone are not a hard spending cap. Failed requests consume their reservations, and each message is claimed once. Use a Google project dedicated to this app: other callers using the same billing account's free credit cannot be bounded by this database. Translation shows the original message when the key is absent, a request fails, or the app's cap is reached.

## Operations and known limits

Supabase's free plan may pause inactive projects. There is no app-side automatic restore or uptime guarantee; a paused project must be resumed in Supabase before online rooms work again. The static Site can still load while the backend is unavailable, but online rooms cannot operate.

The Rhythm screen lazy-loads the vendored official Ruffle player and the two original unmodified SWFs from <https://vidkidz.tistory.com/431>, with a source-page fallback. The largest bundled asset is below Cloudflare Pages' 25 MiB per-file limit. A Chromium smoke check accepted loading the main SWF, but full gameplay, keyboard, audio, and companion-file behavior remain unverified. The post does not declare a redistribution license for the SWFs; keep the local copy private until rights for the chosen hosting audience are established. See `docs/RHYTHM.md`.
