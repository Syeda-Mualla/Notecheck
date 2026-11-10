# Update 6 — deployment preparation

If Update 5 is installed, replace components/course-app.tsx and app/api/course/route.ts. Add .replit and DEPLOY.md; update README.md. Keep .env.local unchanged. Restart the dev server.

This is also a cumulative full package for a fresh import. It does not contain credentials or saved database records.

- Clicks during autosave now explain that saving must finish, instead of silently doing nothing.
- One-day and one-session labels use singular wording.
- Server execution allowance is 120 seconds and browser requests allow 125 seconds, accommodating the configured AI fallback and one generation validation retry. Hosting must support that request duration.
- Replit configuration and a complete deployment/acceptance guide are included.

No account settings have been changed and no public deployment has been performed by this update.
