-- AlterTable
ALTER TABLE "SupplementalPosition" ADD COLUMN     "userTransferToRequestId" TEXT;

-- AlterTable
ALTER TABLE "UserCreationRequest" ADD COLUMN     "transferToGroupId" TEXT,
ADD COLUMN     "transferToSupervisorId" TEXT,
ADD COLUMN     "transferToTitle" TEXT;

-- AddForeignKey
ALTER TABLE "SupplementalPosition" ADD CONSTRAINT "SupplementalPosition_userTransferToRequestId_fkey" FOREIGN KEY ("userTransferToRequestId") REFERENCES "UserCreationRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
