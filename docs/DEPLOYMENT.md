# Deployment

The landing page and app are a Vite static site. Rooms work across browsers only after the Supabase backend is configured; without the two public build variables the app runs its labelled same-browser demo.

## Supabase

1. Create a Supabase project and link this repository with the Supabase CLI (`supabase login`, then `supabase link --project-ref <project-ref>`).
2. In Supabase Auth, enable **Anonymous sign-ins**. Add the deployed site URL to the Auth site's allowed redirect URLs. Anonymous Auth is how each browser receives a user identity; room IDs alone do not grant access.
3. Apply **all eight checked-in migrations** in order with `supabase db push`. They create the room, feedback and shared-event RPCs, RLS policies and Realtime publication entries. Do not apply only the rooms migration. Confirm these `pg_cron` jobs exist after applying them: `dos-seven-day-cleanup`, `feedback-seven-day-cleanup`, and `shared-event-session-five-minute-cleanup`.
4. Build the game engine bundle, then deploy **both** functions from the repository root:

   ```sh
   npm ci
   npm run build:edge
   supabase functions deploy action
   supabase functions deploy shared-event
   ```

   Both functions use Supabase's `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` secrets. Supabase supplies these to deployed functions. Keep the service-role key in the function environment; it must never be a `VITE_` variable or shipped to the browser. The checked-in `supabase/config.toml` disables gateway JWT verification for these functions because each handler validates the bearer token with `auth.getUser`, including current signing keys. Preserve that in-function authentication.

5. Copy `.env.example` to `.env.local`, fill only the two public Supabase values below, then rebuild and publish the root application. An already-built static site cannot pick up changed build variables without a rebuild. Leave both values blank for the labelled same-browser practice mode; this mode does not simulate an online partner.

After connecting, use two separate browser profiles to create and join an invite, agree on a game from both seats, and verify an action reaches the other seat. Confirm a third identity cannot read or join the full room. Site hosting access and Supabase room membership are separate: both participants must also be allowed by the site's existing access policy.

## Existing private Site

Build and deploy the **root application**, not the standalone `post-hero-preview` workspace. `npm run build` produces `dist`, including the `/play` and `/feedback` entry files and third-party notices. The game catalog, rooms and feedback routes all belong to this root application.

Room invitations use `/play?room=<room-id>` so direct visits and refreshes work on static hosts without a dynamic `/room/<id>` rewrite. The app still accepts legacy room links on hosts that support SPA fallback.

For the existing ChatGPT Site, update its registered source checkout and keep that checkout's `.openai/hosting.json` project ID and audience. Package the root application's `dist` as that Site's static directory and publish a saved version of that same Site. Supabase connection values are build inputs; adding runtime environment variables to an already-built static Site does not replace rebuilding `dist`. Keep the current owner-only access policy unless the owner separately requests a sharing change.

## Public build values

Set these when building the root application for any static host:

- `VITE_SUPABASE_URL`: the Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: the Supabase publishable/anon key. This is public by design; database RLS and RPC grants enforce access.

Rebuild after changing either variable. Never put the Supabase service-role key or Google key in `VITE_` variables.

## Cloudflare Pages alternative

For a separately configured Cloudflare Pages host, use the repository root, build command `npm run build`, and output directory `dist`. The checked-in `public/_redirects` is copied to `dist` and sends deep links such as `/room/<id>` to the SPA entry point. Set the two public build values for production, and for preview only if those deployments should use the backend.

## Optional chat translation

Translation uses Google Cloud Translation Basic v2 from the Supabase Edge Function. In a dedicated Google Cloud project used only by this app, enable the Cloud Translation API, create a server-side API key restricted to that API, and set it as the Supabase function secret `GOOGLE_TRANSLATE_API_KEY`. Do not add it to the site build or source tree.

The database reserves at most 400,000 characters per UTC month across all rooms in this Supabase project. This is an application-side hard limit, independent of Google's rate quotas; Google budget notifications alone are not a hard spending cap. Failed requests consume their reservations, and each message is claimed once. Use a Google project dedicated to this app: other callers using the same billing account's free credit cannot be bounded by this database. Translation shows the original message when the key is absent, a request fails, or the app's cap is reached.

## Operations and known limits

Supabase's free plan may pause inactive projects. There is no app-side automatic restore or uptime guarantee; a paused project must be resumed in Supabase before online rooms work again. Cloudflare Pages serves the independent static landing page while the app backend is unavailable.

The Rhythm screen lazy-loads the vendored official Ruffle player and the two original unmodified SWFs from <https://vidkidz.tistory.com/431>, with a source-page fallback. The largest bundled asset is below Cloudflare Pages' 25 MiB per-file limit. A Chromium smoke check accepted loading the main SWF, but full gameplay, keyboard, audio, and companion-file behavior remain unverified. The post does not declare a redistribution license for the SWFs; keep the local copy private until rights for the chosen hosting audience are established. See `docs/RHYTHM.md`.
