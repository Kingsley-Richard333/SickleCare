# Sicklecare

React + Vite web app for people living with sickle cell disease. Works in a browser, installs as a phone app (PWA),
and can be packaged for Android and iPhone with Capacitor.

## Run it
    npm install
    npm run dev        # local development
    npm test           # symptom checker rules and translation checks
    npm run build      # production build into dist/

Copy `.env.example` to `.env` and add your Supabase URL and anon key. Vite reads
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; existing `NEXT_PUBLIC_SUPABASE_URL`
and `NEXT_PUBLIC_SUPABASE_ANON_KEY` settings are also supported, as is
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Restart the dev server after changing
environment variables. Only use a public anon/publishable key in the frontend,
never a Supabase service-role key.

## Where things are
- `LAUNCH.md`: the full checklist from here to going live. Start here.
- `supabase/setup.sql`: the whole database in one file, for a new project. `supabase/fixes.sql` is only for projects that ran the older separate files. `supabase/parts/` holds the individual pieces for reference.
- `supabase/notifications.sql` and `supabase/functions/`: email alerts and account deletion.
- `MOBILE.md`: building the Android and iPhone apps.
- `I18N.md`: adding languages and translating pages.
- `src/lib/assess.js`: the symptom checker's decision rules (doctor review needed).
- `src/data/articles.js`: the Learn guides (doctor review needed).
- `src/config.js`: your contact email and the "draft" switch for the legal pages.
