-- CreateTable
CREATE TABLE "assignments_v2" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "totalMarks" INTEGER NOT NULL,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSize" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teacherId" TEXT NOT NULL,

    CONSTRAINT "assignments_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_submissions_v2" (
    "id" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" TEXT NOT NULL,
    "remarks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "assignment_submissions_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSize" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "assignment_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assignments_v2_teacherId_idx" ON "assignments_v2"("teacherId");

-- CreateIndex
CREATE INDEX "assignments_v2_subject_idx" ON "assignments_v2"("subject");

-- CreateIndex
CREATE INDEX "assignments_v2_class_idx" ON "assignments_v2"("class");

-- CreateIndex
CREATE INDEX "assignments_v2_dueDate_idx" ON "assignments_v2"("dueDate");

-- CreateIndex
CREATE INDEX "assignment_submissions_v2_assignmentId_idx" ON "assignment_submissions_v2"("assignmentId");

-- CreateIndex
CREATE INDEX "assignment_submissions_v2_studentId_idx" ON "assignment_submissions_v2"("studentId");

-- CreateIndex
CREATE INDEX "assignment_submissions_v2_status_idx" ON "assignment_submissions_v2"("status");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_submissions_v2_assignmentId_studentId_key" ON "assignment_submissions_v2"("assignmentId", "studentId");

-- CreateIndex
CREATE INDEX "assignment_comments_assignmentId_idx" ON "assignment_comments"("assignmentId");

-- CreateIndex
CREATE INDEX "assignment_comments_userId_idx" ON "assignment_comments"("userId");

-- AddForeignKey
ALTER TABLE "assignments_v2" ADD CONSTRAINT "assignments_v2_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions_v2" ADD CONSTRAINT "assignment_submissions_v2_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions_v2" ADD CONSTRAINT "assignment_submissions_v2_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_comments" ADD CONSTRAINT "assignment_comments_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_comments" ADD CONSTRAINT "assignment_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
