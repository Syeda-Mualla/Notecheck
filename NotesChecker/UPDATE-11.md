# Update 11 — cross-client timestamp checks

## Install over Update 10
Back up your Replit project first. Replace these three files using their complete contents:
- lib/course/domain.ts
- app/api/course/route.ts
- components/course-app.tsx
Add tests/cross-profile.test.cjs to the tests folder.
No new secrets, packages or database migration are needed for this update.
Run npm test and npm run build in Replit. If successful, republish the existing app and refresh the live page.

## Test on the live app
1. In Ahmad, save a session on the chosen test date from 09:00 to 10:00. Wait for Saved.
2. In Wiremu, use the same date and 09:30 to 10:30. Click Check timestamps under Review & correct.
3. Expect a warning naming Ahmad and Wiremu, both time ranges and the date.
4. Change Wiremu to 10:00–11:00 and check again. The Ahmad/Wiremu conflict should disappear (unless Derek also overlaps).
5. Test Derek at 09:45–10:15 on that date. Both other clients should appear as conflicts.
6. Change Derek to a different date and check again. Same times on different dates do not overlap.
7. Leave a deliberate overlap and attempt export after goal review. Export must be blocked.
8. Correct the times, rerun both reviews, and export successfully.
Use a test account or restore the original draft after testing.

## Scope and limits
All three active profiles under one Google account are treated as one provider. Other Google accounts are isolated. The current draft is compared with the latest saved draft of each other active profile, including dates outside its displayed generation range if still stored as entries. It does not search previously replaced drafts, exported Google Docs or unsaved changes on another device.
The feature flags conflicts; it does not reschedule sessions or invent replacement times. Valid sessions finish later on the same day; overnight sessions are not supported. Saved conflicts remain editable but cannot pass export validation. Checks use code, not Gemini.
The server checks again before creating an export. This is a snapshot check, not a transaction locking every profile: a simultaneous edit after that check can introduce a new conflict. Recheck after any other profile changes.
Only the other participant name, date and times appear in findings, not their note text or goals.

## Verification
48 automated tests passed and TypeScript checking passed locally. Tests cover interval boundaries, overlapping IDs across profiles, retired profiles, account-scoped queries, current edits, database failure, and blocked export. Live Google/Supabase and the production build still need verification in Replit.
