Date range clarity update

Replace components/course-app.tsx and app/api/course/route.ts. If you skipped Update 2, replace app/layout.tsx too. Keep .env.local unchanged. Restart npm run dev.

Date boxes now exclusively control the range. Both endpoints count. Instructions control content and session times only. The summary shows exact dates and entry count. Generate remaining days appears only when dates are missing. Three months is not a requirement; the current technical limit remains 100 days per draft. Existing saved drafts are unchanged.
