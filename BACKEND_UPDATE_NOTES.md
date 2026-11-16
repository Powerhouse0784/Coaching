# Website + App backend — ek hi repo, saare patches merged

Ye tumhari `backend-frontend.zip` (Coaching repo) hai jisme app ke saare backend patches pehle se lage hue hain:
dashboard stats (watch_logs, quiz_attempts, grade, dailyGoalMinutes), teacher dashboard, doubts, profile, quiz, videos (bookmarks/watch-stats/video-progress),
students directory, student teachers, mobile-session (login yaad rakhna), teacher chat (member list) aur push notifications (push_tokens + /api/push/register).

## Lagane ka tareeka
1. Is zip ki files apne Coaching repo par same path par replace karo (git me diff dekh sakte ho).
2. `npx prisma migrate deploy`  → 2 nayi migrations: `20261105000000_dashboard_stats`, `20261115000000_push_tokens`.
3. `npx prisma generate` (local) aur deploy.
Website ke purane routes/pages touch nahi kiye; sirf upar likhe routes + prisma schema (naye columns/tables) badle hain.

## Verified
`tsc --noEmit` clean (poori website repo), 11 test suites pass (backend-tests/): auth, dashboard, doubts, payments, profile, student-assignments, student-notes, students-directory, teacher-dashboard, teacher-chat, push.
Chalane ke liye: `backend-tests/` ko repo ke `tests/` me rakho, phir `npx tsx tests/<name>.test.ts`. (tests/ ko deploy me mat rakho: `next build` unki typing check karta hai.)
NOT verified: asli database / live deploy.
