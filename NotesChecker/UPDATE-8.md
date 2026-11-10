# Update 8: Gemini failure diagnostics

This update replaces the generic AI failure with safe, actionable error messages. It does not prove that live API configuration or quota is fixed.

## If Update 7 is already installed
Replace the complete contents of these two existing files in Replit:
1. lib/course/server.ts
2. lib/course/generation.ts

Also replace tests/generation.test.cjs and add tests/model.test.cjs to keep the test suite current.
Do not replace secrets or recreate the Replit project.

Run npm test and npm run build, then republish the existing deployment.
Open the live site and refresh. Try generating a short date range first.
If generation fails, copy the error visible on the page. Do not share request headers, tokens, cookies or API keys.
Also provide the non-secret values of GEMINI_MODEL and GEMINI_FALLBACK_MODEL when investigating configuration.

## Changes
- Identifies API key rejection, access denial, unsupported model, quota/rate limits, provider failures, timeout, blocked output and invalid JSON.
- Keeps raw provider messages and credentials out of browser errors.
- Trims model settings and accepts an optional models/ prefix; avoids calling the same fallback twice.
- Preserves fallback behaviour and saved drafts.
- Shows Generate notes rather than Resume when zero days were saved.
- Retries malformed AI responses within the existing bounded retry loop.

## Verification
30 automated tests pass, including mocked provider errors, fallback, saved-batch recovery and configuration failures. TypeScript check passes. Live credentials were not available, so a successful live generation and deployment build still need verification in Replit.
