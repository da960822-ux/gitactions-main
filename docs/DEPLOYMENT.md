# Deployment

The landing page and app are a Vite static site. This section records the current project state as checked on 2026-10-23, then gives the safe next steps for the existing project and private Site.

## Current production state — 2026-10-23

- Supabase project: `yeonseok-lisbeth-games`, ref `yqswgvqkqofxcfypvbbi`, URL `https://yqswgvqkqofxcfypvbbi.supabase.co`. The current plan is Free Nano in Singapore (`ap-southeast-1`). Anonymous sign-ins are enabled.
- The eight checked-in migrations were applied in a Dashboard SQL Editor transaction. Remote checks confirmed 13 tables, RLS and grants, Realtime publication settings, the three cleanup jobs below, and the 400,000-character monthly translation cap. Dashboard application did not populate Supabase CLI migration history; repair that history before using `db push`.
- The canonical `action` and `shared-event` function code is deployed through the Dashboard. Gateway JWT verification is disabled in `supabase/config.toml`; each function checks the bearer token with `auth.getUser`. Supabase holds the service-role secret. Do not turn off handler authentication or put that key in frontend configuration.
- Google Cloud project `My First Project` (`project-057b7aa4-ec66-4e43-906`) has Cloud Translation API enabled. Its API key is restricted to Translation API and stored in Supabase as `GOOGLE_TRANSLATE_API_KEY`. The key value is not recorded here.
- Ignored local `.env.local` and ChatGPT Site environment revision 1 contain the public project URL and publishable key under `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; neither key value belongs in source or docs. The currently deployed ChatGPT Site revision 18 is still the older same-browser demo. A backend-connected production build and publish are pending, so online play and live translation have not yet been verified through the Site.
- Separate from the current Site revision, two-browser verification against the configured backend succeeded with distinct anonymous users: room create/join, Catchmind selection from both seats, and ordinary KO→ES and ES→KO chat translation with each original shown alongside its translation. This confirms that checked client/backend path, not the currently deployed Site or every translation mode.

## Supabase

1. Link the existing project with the Supabase CLI (`supabase login`, then `supabase link --project-ref yqswgvqkqofxcfypvbbi`). Do not create a replacement project.
2. Anonymous sign-ins are enabled. Check the deployed Site URL in the Auth redirect allow-list when preparing the new build. Anonymous Auth gives each browser an identity; room IDs alone do not grant access.
3. **Do not run `supabase db push` yet.** The eight migrations listed below already ran through the Dashboard, but CLI history is not recorded. After linking, inspect `supabase migration list` and confirm the remote schema still matches the applied state. Mark only versions missing from remote history as applied; the command below assumes all eight are missing:

   ```sh
   supabase migration repair --status applied 202610100001 202610100002 202610100003 202610100004 202610110005 202610180006 202610180007 202610180008
   supabase migration list
   ```

   `migration repair` records history; it does not execute the SQL again. Verify the eight versions now match before any later `supabase db push`. See the [official migration history repair guide](https://supabase.com/docs/guides/deployment/database-migrations).

   The applied schema was remotely checked for 13 tables, RLS/grants, Realtime publication and these `pg_cron` jobs: `dos-seven-day-cleanup`, `feedback-seven-day-cleanup`, and `shared-event-session-five-minute-cleanup`. The database enforces a 400,000-character monthly translation reservation cap.
4. When updating the deployed function code, build the game engine bundle, then deploy **both** functions from the repository root:

   ```sh
   npm ci
   npm run build:edge
   supabase functions deploy action
   supabase functions deploy shared-event
   ```

   The canonical `action` and `shared-event` code is already deployed through the Dashboard. Both functions use Supabase's `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` secrets, supplied by Supabase. Keep the service-role key in the function environment; it must never be a `VITE_` variable or shipped to the browser. The checked-in `supabase/config.toml` disables gateway JWT verification because each handler validates the bearer token with `auth.getUser`, including current signing keys. Preserve that in-function authentication.

5. The ignored local `.env.local` and Site environment revision 1 already contain the two public build values below. Rebuild the root application and publish the new `dist` to the existing private Site. Revision 18 still serves the older same-browser demo until that release is published. An already-built static site cannot pick up changed build variables without a rebuild. Leave both values blank only when intentionally preparing the labelled same-browser practice mode.

After connecting, use two separate browser profiles to create and join an invite, agree on a game from both seats, and verify an action reaches the other seat. Confirm a third identity cannot read or join the full room. Site hosting access and Supabase room membership are separate: both participants must also be allowed by the site's existing access policy.

## Existing private Site

Build and deploy the **root application**, not the standalone `post-hero-preview` workspace. `npm run build` produces `dist`, including the `/play` and `/feedback` entry files and third-party notices. The game catalog, rooms and feedback routes all belong to this root application.

Room invitations use `/play?room=<room-id>` so direct visits and refreshes work on static hosts without a dynamic `/room/<id>` rewrite. The app still accepts legacy room links on hosts that support SPA fallback.

For the existing ChatGPT Site, update its registered source checkout and keep that checkout's `.openai/hosting.json` project ID and audience. From the repository root, run `npm ci`, `npm test`, and `npm run build`; package the resulting root `dist` as that Site's static directory, then publish a saved version of that same Site. This prepares the release artifact; a successful local build alone does not mean the Site was published. Supabase connection values are build inputs; adding runtime environment variables to an already-built static Site does not replace rebuilding `dist`. Keep the current owner-only access policy unless the owner separately requests a sharing change.

## Public build values

Set these when building the root application for any static host:

- `VITE_SUPABASE_URL`: the Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: the Supabase publishable/anon key. This is public by design; database RLS and RPC grants enforce access.

Rebuild after changing either variable. Never put the Supabase service-role key or Google key in `VITE_` variables.

## Cloudflare Pages alternative

For a separately configured Cloudflare Pages host, use the repository root, build command `npm run build`, and output directory `dist`. The checked-in `public/_redirects` is copied to `dist` and sends deep links such as `/room/<id>` to the SPA entry point. Set the two public build values for production, and for preview only if those deployments should use the backend. Cloudflare serves the static application; rooms still depend on the configured Supabase backend.

## Optional chat translation

Translation uses Google Cloud Translation Basic v2 from the Supabase Edge Function. In a dedicated Google Cloud project used only by this app, enable the Cloud Translation API, create a server-side API key restricted to that API, and set it as the Supabase function secret `GOOGLE_TRANSLATE_API_KEY`. Do not add it to the site build or source tree.

The database reserves at most 400,000 characters per UTC month across all rooms in this Supabase project. This is an application-side hard limit, independent of Google's rate quotas; Google budget notifications alone are not a hard spending cap. Failed requests consume their reservations, and each message is claimed once. Use a Google project dedicated to this app: other callers using the same billing account's free credit cannot be bounded by this database. Translation shows the original message when the key is absent, a request fails, or the app's cap is reached.

## Operations and known limits

Supabase's free plan may pause inactive projects. There is no app-side automatic restore or uptime guarantee; a paused project must be resumed in Supabase before online rooms work again. The static Site can still load while the backend is unavailable, but online rooms cannot operate.

The Rhythm screen lazy-loads the vendored official Ruffle player and the two original unmodified SWFs from <https://vidkidz.tistory.com/431>, with a source-page fallback. The largest bundled asset is below Cloudflare Pages' 25 MiB per-file limit. A Chromium smoke check accepted loading the main SWF, but full gameplay, keyboard, audio, and companion-file behavior remain unverified. The post does not declare a redistribution license for the SWFs; keep the local copy private until rights for the chosen hosting audience are established. See `docs/RHYTHM.md`.
