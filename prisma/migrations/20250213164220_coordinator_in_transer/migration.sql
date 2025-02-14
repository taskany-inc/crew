-- AlterTable
ALTER TABLE "ScheduledDeactivation" ADD COLUMN     "coordinatorId" TEXT,
ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AddForeignKey
ALTER TABLE "ScheduledDeactivation" ADD CONSTRAINT "ScheduledDeactivation_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
