-- AlterTable
ALTER TABLE "Attach" ADD COLUMN     "scheduledDeactivationId" TEXT;

-- AddForeignKey
ALTER TABLE "Attach" ADD CONSTRAINT "Attach_scheduledDeactivationId_fkey" FOREIGN KEY ("scheduledDeactivationId") REFERENCES "ScheduledDeactivation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
