/*
  Warnings:

  - A unique constraint covering the columns `[jobId]` on the table `UserCreationRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "UserCreationRequest" ADD COLUMN     "jobId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "UserCreationRequest_jobId_key" ON "UserCreationRequest"("jobId");

-- AddForeignKey
ALTER TABLE "UserCreationRequest" ADD CONSTRAINT "UserCreationRequest_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
