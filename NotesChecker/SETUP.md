# Setup — perform in client-owned accounts

Do not replace the old NoteCheck project. Extract this edition into a NEW folder. Keep this edition's .env.local separate. Node.js 22 LTS and npm are recommended for this package.

## 1. Supabase database

1. Create a Supabase project in the account intended to own the app.
2. In SQL Editor, run the entire database/schema.sql file once.
3. Copy the project URL and anon key (or publishable key) into NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
4. Copy the project's service-role key into SUPABASE_SERVICE_ROLE_KEY. This key is server-only and bypasses database row security. Never paste it in chat, put it in a NEXT_PUBLIC_ variable, or commit it.
5. The schema intentionally denies anon/authenticated direct table access. Server routes verify the Supabase user and constrain every read/update to that owner. Do not add public read/write policies.

## 2. Google login for Supabase

1. In the client-owned Google Cloud project, configure an OAuth consent screen and a Web application OAuth client.
2. In Supabase Authentication > Sign In / Providers, enable Google and enter that client's ID and secret. The client secret belongs in Supabase's provider configuration, not in the browser app.
3. Copy the callback URL shown by Supabase (typically https://PROJECT.supabase.co/auth/v1/callback) into the Google OAuth client's authorised redirect URIs.
4. In Supabase URL Configuration set Site URL to http://localhost:3000 for local development and allow http://localhost:3000 as a redirect URL. Add the final HTTPS app URL before deployment and update Site URL then.
5. While the Google consent screen is in testing, add both your Google email and the client's intended login email as test users. This does not make the OAuth project publicly verified.

## 3. Google Docs export

1. Enable Google Drive API in the same Google Cloud project.
2. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID to the Web OAuth client ID.
3. Add http://localhost:3000 as an authorised JavaScript origin on that client. Add the deployed HTTPS origin later. Origins must match exactly.
4. The export popup requests drive.file permission to create the new document. It does not request access to all Drive files. Export may prompt separately from sign-in. Choose the Google account in which the export should be created.
5. Supabase login uses its provider callback; Drive export uses the Google Identity Services popup. Configure both as above. A Google API key and Drive Picker are not needed for this edition.

## 4. Local environment

In the NEW project folder:

```powershell
Copy-Item .env.example .env.local
npm ci
```

Edit .env.local with the values above. Set LLM_API_KEY and GEMINI_MODEL to a working hosted Gemini key/model. Existing GEMINI_API_KEY is accepted by code too, but LLM_API_KEY takes precedence. Leave fallback blank unless you have tested it.

Generate PROFILE_SESSION_SECRET locally:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output into PROFILE_SESSION_SECRET. Keep it private.

Choose the three initial profile passcodes in PROFILE_PIN_ALEX, PROFILE_PIN_MAYA and PROFILE_PIN_JORDAN (4–8 digits). The template values are demo defaults, not secrets for real data. Communicate practice passcodes to authorised testers separately. Profiles are created on first login. Changing env PIN values later does not reset existing hashes. Ask the maintainer to perform a targeted reset if needed; do not delete saved profiles just to change a passcode.

```powershell
npm test
npm run build
npm run dev
```

## 5. Deployment after the local account tests

Import the new edition into your hosting account as a Next.js app. Add all environment variables in host settings; do not upload .env.local. Configure Supabase and Google hosted URLs before the final build. NEXT_PUBLIC_ values are bundled at build time, so rebuild after changing them.

Use the same Supabase project across devices. A paid hosting upgrade is not itself a functional requirement of this code; choose the hosting plan based on actual use. Provider limits and billing belong to the account owner. Do not open this as a public service for real participant data: persistent cost/rate controls, stronger operational access controls and data governance require a separate production pass.

Official references:
- https://supabase.com/docs/guides/auth/social-login/auth-google
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://developers.google.com/workspace/drive/api/guides/manage-uploads
