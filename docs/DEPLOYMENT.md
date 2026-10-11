# Deployment

The landing page and app are a Vite static site. Rooms work across browsers only after the Supabase backend is configured; without the two public build variables the app runs its labelled same-browser demo.

## Supabase

1. Create a Supabase project and link this repository with the Supabase CLI (`supabase login`, then `supabase link --project-ref <project-ref>`).
2. In Supabase Auth, enable **Anonymous sign-ins**. Add the deployed site URL to the Auth site's allowed redirect URLs. Anonymous Auth is how each browser receives a user identity; room IDs alone do not grant access.
3. Apply the checked-in schema and schedule: `supabase db push`. The migration creates the room RPCs and RLS policies and schedules daily seven-day cleanup with `pg_cron`. Confirm the `dos-seven-day-cleanup` job exists in the database after applying it.
4. Build the game engine bundle, then deploy the action function:

   ```sh
   npm ci
   npm run build:edge
   supabase functions deploy action
   ```

   The function uses Supabase's `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` secrets. Supabase supplies these to deployed functions. Keep the service-role key in the function environment; it must never be a `VITE_` variable or shipped to the browser.

## Cloudflare Pages

Create a Pages project from this repository with the root directory set to the repository root, build command `npm run build`, and output directory `dist`. The checked-in `public/_redirects` is copied to `dist` and sends deep links such as `/room/<id>` to the SPA entry point.

Set these build-time variables for production (and preview if you want preview deployments to use the backend):

- `VITE_SUPABASE_URL`: the Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: the Supabase publishable/anon key. This is public by design; database RLS and RPC grants enforce access.

Rebuild after changing either variable. Never put the Supabase service-role key or Google key in Cloudflare's `VITE_` variables.

## Optional chat translation

Translation uses Google Cloud Translation Basic v2 from the Supabase Edge Function. In a dedicated Google Cloud project used only by this app, enable the Cloud Translation API, create a server-side API key restricted to that API, and set it as the Supabase function secret `GOOGLE_TRANSLATE_API_KEY`. Do not add it to the site build or source tree.

The database reserves at most 400,000 characters per UTC month across all rooms in this Supabase project. This is an application-side hard limit, independent of Google's rate quotas; Google budget notifications alone are not a hard spending cap. Failed requests consume their reservations, and each message is claimed once. Use a Google project dedicated to this app: other callers using the same billing account's free credit cannot be bounded by this database. Translation shows the original message when the key is absent, a request fails, or the app's cap is reached.

## Operations and known limits

Supabase's free plan may pause inactive projects. There is no app-side automatic restore or uptime guarantee; a paused project must be resumed in Supabase before online rooms work again. Cloudflare Pages serves the independent static landing page while the app backend is unavailable.

The Rhythm screen lazy-loads the vendored official Ruffle player and the two original unmodified SWFs from <https://vidkidz.tistory.com/431>, with a source-page fallback. The largest bundled asset is below Cloudflare Pages' 25 MiB per-file limit. A Chromium smoke check accepted loading the main SWF, but full gameplay, keyboard, audio, and companion-file behavior remain unverified. The post does not declare a redistribution license for the SWFs; keep the local copy private until rights for the chosen hosting audience are established. See `docs/RHYTHM.md`.
