/*
  Warnings:

  - Made the column `unitId` on table `ScheduledDeactivation` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ScheduledDeactivation" ADD COLUMN     "cancelComment" TEXT,
ADD COLUMN     "newOrganizationUnitId" TEXT,
ADD COLUMN     "organizationUnitId" TEXT,
ALTER COLUMN "organization" DROP NOT NULL,
ALTER COLUMN "unitId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "ScheduledDeactivation" ADD CONSTRAINT "ScheduledDeactivation_organizationUnitId_fkey" FOREIGN KEY ("organizationUnitId") REFERENCES "OrganizationUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledDeactivation" ADD CONSTRAINT "ScheduledDeactivation_newOrganizationUnitId_fkey" FOREIGN KEY ("newOrganizationUnitId") REFERENCES "OrganizationUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
