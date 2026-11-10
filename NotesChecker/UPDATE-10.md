# Update 10 — New participant profiles and goal-based draft writing

Install over Update 9. This package contains the complete source including previous fixes.

## 1. Database (do this first)
Open your existing Supabase project > SQL Editor > New query.
Copy all text from database/update-10-profiles.sql into the query and click Run.
This expands the permitted profile keys. It does not delete or rename old records, change access rules, or overwrite saved drafts. Old test profiles remain stored but are no longer shown by this version.

## 2. Replit files
Replace these existing files with their full contents from this ZIP:
- lib/course/domain.ts
- app/api/course/route.ts
- tests/course.test.cjs
- database/schema.sql (reference for new installations; existing projects use the migration above)

Create these new files and copy their full contents:
- lib/course/profile-goals.ts
- tests/profiles.test.cjs
- database/update-10-profiles.sql

The supplied goal text is in server-side seed code. Keep this project private; do not publish its source repository publicly.

## 3. Test and publish
Run npm test and npm run build. Republish only after both succeed.
Sign out of the app, refresh and sign back in. The login initialises the new profiles for that account.

Existing secret settings are retained:
- Ahmad uses PROFILE_PIN_ALEX
- Wiremu uses PROFILE_PIN_MAYA
- Derek uses PROFILE_PIN_JORDAN
No secret values need to be shared or changed for this update. If old profile passcodes were previously changed directly in the database, the new profiles use the secret values, not the old hashes.

## 4. Check the result
One Google login sees all three profiles. Unlock each and verify the goals: Ahmad 5, Wiremu 2, Derek 5, each with its supporting strategy text. New profiles start without the old test notes. Test a short generation, save, sign back in and confirm the same profile retains its draft. User edits to saved goals are not overwritten on later sign-ins. Each Google account still has its own workspace; this update does not restrict sign-in to one account or share records across different accounts.

## Writing changes
Natural Australian English; clear worker/participant subjects; specific goal links; less repetition and generic praise; observable responses; no invented diagnoses or personal history; no claims of licence/employment/recovery from merely practising a step. Generated examples retain the existing fictional coursework identification. Goals alone do not verify actual activities or session times.

## Verification and limits
36 automated tests and TypeScript checks pass. Tests cover owner-isolated profile seeding, retaining old test data, preserving edited goals, idempotent loading, and all supplied goals. Database migration, deployment build, and live model output still require verification in your environment. No live account was accessed or changed here.
