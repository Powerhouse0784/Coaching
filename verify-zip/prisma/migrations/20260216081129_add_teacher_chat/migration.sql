-- CreateTable
CREATE TABLE "teacher_chat_messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileType" TEXT,
    "fileSize" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "senderId" TEXT NOT NULL,

    CONSTRAINT "teacher_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "teacher_chat_messages_senderId_idx" ON "teacher_chat_messages"("senderId");

-- CreateIndex
CREATE INDEX "teacher_chat_messages_createdAt_idx" ON "teacher_chat_messages"("createdAt");

-- AddForeignKey
ALTER TABLE "teacher_chat_messages" ADD CONSTRAINT "teacher_chat_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
