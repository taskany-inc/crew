-- DropForeignKey
ALTER TABLE "UserCreationRequest" DROP CONSTRAINT "UserCreationRequest_groupId_fkey";

-- AlterTable
ALTER TABLE "UserCreationRequest" ALTER COLUMN "groupId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "UserCreationRequest" ADD CONSTRAINT "UserCreationRequest_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
