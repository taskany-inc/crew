/*
  Warnings:

  - A unique constraint covering the columns `[disableAccountJobId]` on the table `UserCreationRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "UserCreationRequest" ADD COLUMN     "disableAccountJobId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "UserCreationRequest_disableAccountJobId_key" ON "UserCreationRequest"("disableAccountJobId");

-- AddForeignKey
ALTER TABLE "UserCreationRequest" ADD CONSTRAINT "UserCreationRequest_disableAccountJobId_fkey" FOREIGN KEY ("disableAccountJobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
