/*
  Warnings:

  - A unique constraint covering the columns `[jobId]` on the table `SupplementalPosition` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ExternalService" ADD COLUMN     "type" TEXT;

-- AlterTable
ALTER TABLE "ScheduledDeactivation" ADD COLUMN     "applicationForReturnOfEquipment" TEXT,
ADD COLUMN     "lineManagerIds" TEXT[],
ALTER COLUMN "teamLead" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SupplementalPosition" ADD COLUMN     "jobId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SupplementalPosition_jobId_key" ON "SupplementalPosition"("jobId");

-- AddForeignKey
ALTER TABLE "SupplementalPosition" ADD CONSTRAINT "SupplementalPosition_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
