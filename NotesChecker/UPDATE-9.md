# Update 9 — Structured Gemini responses

Install over Update 8 in the existing Replit project.

Replace these two runtime files (entire contents):
- lib/course/server.ts
- app/api/course/route.ts

Replace these test files:
- tests/model.test.cjs
- tests/course.test.cjs

Run npm test and npm run build, then Republish. Refresh the live app and test the 21-day range again. If some dates are saved, use Resume generation to keep them; otherwise use Generate notes.

No secrets or model changes are required by this update.

Changes: Gemini receives a JSON schema for generation and goal review, including required fields and expected array lengths. Generated dates are constrained to the requested dates. Both generation and its validation-repair request use the schema. Existing date/time/quote validation remains authoritative. The parser accepts a complete Markdown JSON wrapper without inventing or repairing any JSON values. Empty responses and truncation have distinct error messages.

Verification: 34 automated tests and TypeScript checks pass. Tests include the actual route's schema requests and rejection/repair of reversed times. Live Gemini credentials are unavailable here; the deployment build and live generation must still be tested in Replit. A provider 503 is temporary service unavailability and cannot be eliminated by this update.
