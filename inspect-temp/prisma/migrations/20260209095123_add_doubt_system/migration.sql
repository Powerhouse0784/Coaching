-- CreateTable
CREATE TABLE "doubts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "class" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "imageUrl" TEXT,
    "imageName" TEXT,
    "pdfUrl" TEXT,
    "pdfName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "isSolved" BOOLEAN NOT NULL DEFAULT false,
    "solvedAt" TIMESTAMP(3),
    "views" INTEGER NOT NULL DEFAULT 0,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "doubts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doubt_replies" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "imageName" TEXT,
    "pdfUrl" TEXT,
    "pdfName" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "doubtId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "doubt_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doubt_upvotes" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doubtId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "doubt_upvotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doubt_reply_upvotes" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "replyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "doubt_reply_upvotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "doubts_studentId_idx" ON "doubts"("studentId");

-- CreateIndex
CREATE INDEX "doubts_subject_idx" ON "doubts"("subject");

-- CreateIndex
CREATE INDEX "doubts_status_idx" ON "doubts"("status");

-- CreateIndex
CREATE INDEX "doubts_createdAt_idx" ON "doubts"("createdAt");

-- CreateIndex
CREATE INDEX "doubt_replies_doubtId_idx" ON "doubt_replies"("doubtId");

-- CreateIndex
CREATE INDEX "doubt_replies_userId_idx" ON "doubt_replies"("userId");

-- CreateIndex
CREATE INDEX "doubt_replies_isPinned_idx" ON "doubt_replies"("isPinned");

-- CreateIndex
CREATE UNIQUE INDEX "doubt_upvotes_doubtId_userId_key" ON "doubt_upvotes"("doubtId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "doubt_reply_upvotes_replyId_userId_key" ON "doubt_reply_upvotes"("replyId", "userId");

-- AddForeignKey
ALTER TABLE "doubts" ADD CONSTRAINT "doubts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doubt_replies" ADD CONSTRAINT "doubt_replies_doubtId_fkey" FOREIGN KEY ("doubtId") REFERENCES "doubts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doubt_replies" ADD CONSTRAINT "doubt_replies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doubt_upvotes" ADD CONSTRAINT "doubt_upvotes_doubtId_fkey" FOREIGN KEY ("doubtId") REFERENCES "doubts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doubt_upvotes" ADD CONSTRAINT "doubt_upvotes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doubt_reply_upvotes" ADD CONSTRAINT "doubt_reply_upvotes_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "doubt_replies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doubt_reply_upvotes" ADD CONSTRAINT "doubt_reply_upvotes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
