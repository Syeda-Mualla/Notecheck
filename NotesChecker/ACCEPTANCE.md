# Live acceptance checklist

Use fictional data only. These checks must run in your configured accounts before calling the new version complete.

1. Open the landing page on a laptop and a phone; no client dashboard appears before Google sign-in.
2. Sign in. Three profiles appear. Wrong PIN shows an error; correct PIN opens only the chosen profile. Five wrong attempts trigger a temporary lock.
3. Enter Alex's goal: “Practise preparing a simple lunch twice a week using a checklist and fewer verbal prompts.” Wait for Saved.
4. Sign in on another device with the same Google account, unlock Alex, and confirm the saved goal appears. Confirm Maya's goals remain separate. Confirm another Google account cannot see your saved draft.
5. Generate three days first. Confirm dates, start/finish times and 3–4 lines each. Check a 3-month prompt resolves visibly to the intended range, then generate if quota allows. A 90-day draft uses roughly 13 generation requests plus about 13 review requests.
6. Stop generation after a batch, reload and resume missing days. No duplicate days should appear. If the AI fails, already saved batches remain visible.
7. Edit a start/finish time to be missing or reversed. Set two entry dates/times to overlap. Code findings should appear without needing AI. Correct them and confirm the time findings clear.
8. Put an unrelated fictional line into the draft, such as “Spent the session cleaning the office car park” for the lunch-preparation goal. Run review. Inspect the goal quote and suggestion. Apply the suggestion. The draft changes, the correction count appears, and review becomes stale until rechecked. AI may need prompt tuning if it misses or overflags real test examples.
9. Recheck a corrected draft. Red/green states reflect the current review; a failed AI response never shows a clean goal review.
10. Export. Grant Drive access; open the created Doc and verify goals, dates, lines and the fictional label. Existing Docs should be unchanged. Edit a reviewed draft and ensure export is blocked until rechecked.
11. Edit the same profile on two devices. Save from device A, then save the stale draft from device B. B must show a conflict, not overwrite A. Copy any unsaved work before reloading.
12. Sign out and back in; goals and drafts persist. Google expiry or provider errors should show a useful error, not discard saved work.

Record: account used, browser/device, date range, pass/fail, exact error text (never keys or tokens). Report failures before deployment.
