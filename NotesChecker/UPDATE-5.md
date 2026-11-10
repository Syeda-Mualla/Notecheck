Review interface update

Replace components/course-app.tsx, app/globals.css, lib/course/domain.ts and tests/course.test.cjs. Keep .env.local and database unchanged. Restart npm run dev. If Update 4 was skipped, replace app/api/course/route.ts too.

Bullet note fields and bullet exports; separate timestamp and goal checks; accessible native dialog with per-session findings. Goal percentage = aligned note points / total note points, only after complete validated AI review. It is not goal achievement or compliance. Edits invalidate scores. Save changes moved to toolbar; autosave retained.

15 automated tests and production build passed. Live browser, modal keyboard behaviour and model review still need acceptance testing.
