-- AlterTable
ALTER TABLE "UserCreationRequest" ADD COLUMN     "userTargetId" TEXT;

-- AddForeignKey
ALTER TABLE "UserCreationRequest" ADD CONSTRAINT "UserCreationRequest_userTargetId_fkey" FOREIGN KEY ("userTargetId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
