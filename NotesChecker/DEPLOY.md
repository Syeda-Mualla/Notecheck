# Publish the existing app on Replit

This is the coursework note-generation edition. Keep the existing Supabase, Google and Gemini accounts for this deployment so saved data remains available. Account ownership can be transferred separately. No new database or authentication system is needed.

## 1. Import the code

Use the client's Replit account or a project they have invited you to edit. Import the ZIP using Replit's import flow, or import the private GitHub repository if already available. Ensure package.json, app, components and lib are at the project root, not inside an extra folder. Do not ask Agent to rebuild or migrate the application.

The package includes .replit with Node 22, a build command and a production start command. Check the imported settings before publishing:

| Setting | Value |
| --- | --- |
| Deployment type | Autoscale (server required; not Static) |
| Build command | npm ci && npm run build |
| Run command | npm run start -- --hostname 0.0.0.0 |
| Local port | 3000 |

## 2. Copy your working environment values into Secrets

Open your local .env.local privately. Add the following names and their existing values in Replit Secrets, and confirm they are available to the published app as well as its build. Do not upload .env.local or paste credentials into chat, source files or GitHub.

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
PROFILE_SESSION_SECRET
PROFILE_PIN_ALEX
PROFILE_PIN_MAYA
PROFILE_PIN_JORDAN
LLM_API_KEY
GEMINI_MODEL
NEXT_PUBLIC_GOOGLE_CLIENT_ID
```

If your working local key is named GEMINI_API_KEY, use that name instead of LLM_API_KEY, or copy its value into LLM_API_KEY. Only one is necessary. GEMINI_FALLBACK_MODEL is optional; leave it unset unless tested. Copy the working model name rather than guessing another one.

The Google OAuth client secret stays in Supabase's Google provider settings. Do not add it to the frontend. Existing profile PINs remain unchanged because their hashes are already saved in Supabase.

## 3. Publish and obtain the permanent HTTPS URL

Use Publish and review the hosting plan with the account owner. Use the published address, not the temporary editor preview. A successful build alone does not verify Google sign-in or AI access.

## 4. Allow the published URL in the two account dashboards

If the live address is https://YOUR-APP.replit.app, use your actual address in the following places:

| Dashboard | Setting | Value |
| --- | --- | --- |
| Supabase Authentication, URL Configuration | Site URL | Your live HTTPS app URL |
| Supabase Authentication, URL Configuration | Redirect URLs | Your live HTTPS app URL; keep localhost for development |
| Google Cloud, existing Web OAuth client | Authorised JavaScript origins | Your live HTTPS origin, without a path |
| Google Cloud, existing Web OAuth client | Authorised redirect URIs | Keep the existing Supabase /auth/v1/callback URL |

Do not replace the Supabase callback with the app homepage. Keep the existing Google client ID and secret paired. If Google is still in testing, add the client's login email to Google OAuth test users. This allows the client review; it is not unrestricted public OAuth access.

Rebuild and republish whenever NEXT_PUBLIC_ values change, because they are compiled into the browser bundle.

## 5. One acceptance pass on the live link

1. Open the published URL in a normal browser tab, sign in with Google and open Maya's profile.
2. Confirm the saved breakfast goal and draft appear. Use the same Google account as the local test; different accounts have separate profiles.
3. Set start to 09:00 am and finish to 08:00 am. Confirm the red warning, then restore finish to 10:00 am.
4. Replace one of four breakfast points with the guitar sentence. Run Check goals, confirm it is flagged, apply the suggestion and run Check goals again. Review the replacement before accepting it.
5. Wait for Saved, sign out, close the tab, reopen and sign back in. Confirm the corrected text remains. Review scores are session-only; rerun review when needed.
6. Export after a clean review. Open the new Google Doc and confirm the date, times and all four points are present.
7. Test a 14-day draft on another profile so Maya's completed example remains intact. Confirm 14 unique dates, completed review and 14 entries in the export. Saving partial generation is expected if an AI request fails; use Generate remaining days.
8. Open the live URL on a phone using the same Google account. Confirm saved data loads and controls fit the screen.

If any step fails, capture the visible error and the hosting log for that request, with secrets hidden. Do not call the deployment complete until the core live flow passes.

## Verification for this package

Local automated checks cover date validation, timing, full review coverage, profile tokens, export proof invalidation and save conflicts. They do not verify your hosted credentials. User screenshots have demonstrated one-day generation, automatic reverse-time warnings and an unrelated point receiving a 75% goal-alignment result. Correction re-review, saved-data reopening, the longer draft and the live deployment still need the acceptance pass above.

Official references:
- https://docs.replit.com/features/project-setup/configuration
- https://docs.replit.com/features/publishing/deployment-types
- https://docs.replit.com/build/import-from-providers
- https://supabase.com/docs/guides/auth/social-login/auth-google

Future edits: update the same hosted project and republish. Keep the same database and secrets. Do not delete database records or rerun setup to deploy a UI change.
