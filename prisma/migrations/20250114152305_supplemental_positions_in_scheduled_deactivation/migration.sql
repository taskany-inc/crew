-- AlterTable
ALTER TABLE "SupplementalPosition" ADD COLUMN     "scheduledDeactivationId" TEXT;

-- AddForeignKey
ALTER TABLE "SupplementalPosition" ADD CONSTRAINT "SupplementalPosition_scheduledDeactivationId_fkey" FOREIGN KEY ("scheduledDeactivationId") REFERENCES "ScheduledDeactivation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
