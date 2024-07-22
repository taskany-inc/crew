-- AlterTable
ALTER TABLE "UserCreationRequest" ADD COLUMN     "creatorId" TEXT;

-- AddForeignKey
ALTER TABLE "UserCreationRequest" ADD CONSTRAINT "UserCreationRequest_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
