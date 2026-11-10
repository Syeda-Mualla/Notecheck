Generation reliability update
Replace components/course-app.tsx, app/api/course/route.ts, lib/course/domain.ts and tests/course.test.cjs. Keep .env.local. Restart npm run dev.
Normalises valid times and entry order; assigns IDs in code; rejects missing/duplicate days; retries a validation failure once. Existing draft is kept until the first replacement batch succeeds. Later failures retain completed new batches. 14 tests and production build passed. Live model retest required.
