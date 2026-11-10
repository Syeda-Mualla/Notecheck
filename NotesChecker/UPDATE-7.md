# Update 7 — continuous generation and prompt wording

Replace these files in the EXISTING Replit project:
- components/course-app.tsx
- lib/course/domain.ts
- lib/course/generation.ts (new)
- tests/generation.test.cjs (new)

Keep your current Secrets, package.json, package-lock.json and deployment configuration. This archive includes your uploaded Next.js 16.4.0 manifest and live-address fix unchanged.

What changed:
- Generation continues automatically through seven-day batches for the selected range.
- Temporary generation/network failures get up to two retries with short backoff.
- Completed batches are saved before continuing. Resume requests only missing dates.
- Progress shows saved days versus selected days; interruption messages distinguish AI errors from uncertain saves.
- Actions wait for an in-progress autosave and cannot start twice concurrently.
- The default prompt and regeneration confirmation use professional wording. Only an exact match of the previous default is migrated when loading; custom instructions are preserved. Coursework safeguards are unchanged.

Validation: 20 automated tests passed, including a third-batch failure after 14 days, retry exhaustion, resume without duplicates, pause, and save failure. Tests use mocked AI/storage, not live services. Production dependency installation stalled in this environment; run these checks on Replit before republishing:

    npm test && npm run build

Then Republish and test 21 dates on Maya. Confirm 21 unique dates, wait for Saved, reload the profile, and confirm all 21 remain. Test goal review and Google Docs export. Keep the tab open during generation; generation does not run as a background job after the tab closes.

A save conflict must be resolved before continuing. If saving cannot be confirmed, keep the tab open and copy any unsaved content before reloading.

Model configuration: GEMINI_MODEL and GEMINI_FALLBACK_MODEL come from Replit Secrets. The archive does not reveal the live model names. No model was changed.

Hosting: when moving to a new account/domain, update the hardcoded origin allowlist in app/api/course/route.ts and Google/Supabase URL settings.
