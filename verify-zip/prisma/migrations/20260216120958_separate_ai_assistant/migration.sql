-- CreateTable
CREATE TABLE "ai_assistant_messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileType" TEXT,
    "fileSize" TEXT,
    "isAI" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teacherId" TEXT NOT NULL,

    CONSTRAINT "ai_assistant_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_assistant_messages_teacherId_idx" ON "ai_assistant_messages"("teacherId");

-- CreateIndex
CREATE INDEX "ai_assistant_messages_createdAt_idx" ON "ai_assistant_messages"("createdAt");

-- CreateIndex
CREATE INDEX "ai_assistant_messages_isAI_idx" ON "ai_assistant_messages"("isAI");

-- AddForeignKey
ALTER TABLE "ai_assistant_messages" ADD CONSTRAINT "ai_assistant_messages_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
