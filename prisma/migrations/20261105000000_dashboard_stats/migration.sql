-- Dashboard stats: student grade + daily goal, per-day watch log, quiz attempts.
-- Written to be idempotent because earlier schema changes were applied with `db push` in places.

ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "grade" TEXT;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "dailyGoalMinutes" INTEGER NOT NULL DEFAULT 120;

CREATE TABLE IF NOT EXISTS "watch_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "seconds" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "watch_logs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "watch_logs_userId_day_key" ON "watch_logs"("userId", "day");
CREATE INDEX IF NOT EXISTS "watch_logs_userId_day_idx" ON "watch_logs"("userId", "day");

CREATE TABLE IF NOT EXISTS "quiz_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "correct" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "totalMarks" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "quiz_attempts_userId_createdAt_idx" ON "quiz_attempts"("userId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "watch_logs" ADD CONSTRAINT "watch_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
