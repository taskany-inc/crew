-- AlterTable
ALTER TABLE "ScheduledDeactivation" ADD COLUMN     "unitIdString" TEXT,
ALTER COLUMN "unitId" DROP NOT NULL;
