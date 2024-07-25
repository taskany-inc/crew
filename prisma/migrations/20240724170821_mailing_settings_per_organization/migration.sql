-- DropIndex
DROP INDEX "MailingSettings_userId_key";

-- AlterTable
ALTER TABLE "MailingSettings" ADD COLUMN     "organizationUnitId" TEXT;

-- AddForeignKey
ALTER TABLE "MailingSettings" ADD CONSTRAINT "MailingSettings_organizationUnitId_fkey" FOREIGN KEY ("organizationUnitId") REFERENCES "OrganizationUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
