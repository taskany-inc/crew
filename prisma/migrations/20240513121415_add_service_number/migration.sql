-- AlterTable
ALTER TABLE "UserServices" ADD COLUMN     "organizationUnitId" TEXT;

-- AddForeignKey
ALTER TABLE "UserServices" ADD CONSTRAINT "UserServices_organizationUnitId_fkey" FOREIGN KEY ("organizationUnitId") REFERENCES "OrganizationUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
