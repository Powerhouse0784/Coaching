-- AlterTable
ALTER TABLE "video_progress" ADD COLUMN     "viewCounted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "watchedSeconds" INTEGER NOT NULL DEFAULT 0;
