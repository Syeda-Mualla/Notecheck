# Noteschecker — fictional coursework edition

A separate version of NoteCheck. Sign in with Google, unlock one of three fictional profiles, save goals, generate dated daily notes, review and correct the draft, and export a new Google Doc.

**Use made-up clients and events only.** This version intentionally generates practice content and allows it to be rewritten. It is not the original real-record checker. Existing-Docs import is not exposed in this version. Keep your old project separately; do not merge these folders into it.

For publishing the already configured app, read **DEPLOY.md**. For first-time accounts, read **SETUP.md** first. A real Supabase project and Google configuration are required. There is no fake login or local-only database fallback.

## Run after setup

```powershell
npm ci
npm test
npm run build
npm run dev
```

Open http://localhost:3000. Credentials belong in .env.local. Only .env.example is committed.

## Included

- Dark, Netflix-inspired welcome and three fictional profiles: Alex Morgan, Maya Patel and Jordan Lee.
- Google login through Supabase Auth, verified server-side for API requests.
- Persistent per-account goals, prompt, date range and draft in Supabase Postgres.
- Salted profile passcodes checked server-side; one-hour signed unlock session; five incorrect attempts trigger a five-minute pause. Practice control only, not protection for actual participant records.
- Autosave after editing pauses and a visible save status. Wait for Saved before closing. Unsaved changes trigger a browser warning. Failed saves remain visible and must be resolved.
- Save revision checks to prevent one device silently overwriting another device. Reload saved draft fetches current server data. This is not simultaneous live collaboration.
- Start and end date controls are the sole source for generation dates. Both dates are included. Dates or durations in free-text instructions never override the selected range.
- 1–100 days inclusive; one entry per day, 3–4 lines, editable dates/times/lines. Three calendar months fits the cap.
- Hosted AI generation/review in batches of up to seven days. Completed generation batches save immediately. Resume missing days after a failure. Stop takes effect after the active batch. A replaced draft has no version-history restore; confirmation is required before replacement.
- Code checks missing/invalid times, end-before-start and same-day overlaps. AI reviews every line against the entered goals and must return matching source text for each line.
- Suggested corrections apply only to the editable fictional draft. Changes invalidate review. Red indicates findings; green indicates the current reviewed draft has no identified findings. This is not a compliance score.
- New Google Docs export with a fictional-coursework heading. Export requires current successful goal review and clean time checks, including server-side proof validation. Existing Docs are not modified. Repeated export clicks create separate files.

## Account storage

The same Google login loads the same three profiles on another device using the same configured Supabase project. Different Google accounts have separate copies of the fictional profiles. Goals, prompts, date range and drafts persist; review results, unlock tokens and exported URLs are session-only and must be re-established after reopening. Profile data has no automatic expiry; the owner can delete records in Supabase. Browser auth sessions persist until sign-out or expiry. Google Drive access tokens are held in memory for export.

## Verification status

15 automated domain/API tests pass, and the production build passes in the development environment. Tests use controlled model responses and mocked identity/database calls where appropriate. They cover date ranges, incomplete AI output, missing/overlapping times, exact review coverage, passcode binding, edit-invalidated export proof and save conflicts.

Live OAuth, Supabase SQL execution, cross-device storage, Gemini quality and Google export still require verification in the configured accounts. Browser automation could not run here because downloading a browser executable failed. Use ACCEPTANCE.md. This is implemented code ready for integration testing, not a claim of completed hosted deployment or production certification.

## Structure

- components/course-app.tsx — UI workflow, batching, autosave and editor
- lib/course/domain.ts — dates, time checks, AI result validation
- lib/course/server.ts — identity verification, database calls, profile tokens and model requests
- app/api/course/route.ts — authenticated coursework API
- database/schema.sql — server-owned Postgres table with browser access denied
- lib/google/auth.ts — separate Google Drive export permission
- tests/course.test.cjs — regression checks

Legacy parsing helpers are retained as a starting point for a later existing-Docs version. They are not wired into the current user workflow.
