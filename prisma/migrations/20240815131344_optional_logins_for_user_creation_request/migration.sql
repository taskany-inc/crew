-- DropForeignKey
ALTER TABLE "UserCreationRequest" DROP CONSTRAINT "UserCreationRequest_buddyLogin_fkey";

-- DropForeignKey
ALTER TABLE "UserCreationRequest" DROP CONSTRAINT "UserCreationRequest_coordinatorLogin_fkey";

-- DropForeignKey
ALTER TABLE "UserCreationRequest" DROP CONSTRAINT "UserCreationRequest_recruiterLogin_fkey";

-- DropForeignKey
ALTER TABLE "UserCreationRequest" DROP CONSTRAINT "UserCreationRequest_supervisorLogin_fkey";

-- AlterTable
ALTER TABLE "UserCreationRequest" ADD COLUMN     "buddyId" TEXT,
ADD COLUMN     "coordinatorId" TEXT,
ADD COLUMN     "recruiterId" TEXT,
ADD COLUMN     "supervisorId" TEXT,
ALTER COLUMN "supervisorLogin" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "UserCreationRequest" ADD CONSTRAINT "UserCreationRequest_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCreationRequest" ADD CONSTRAINT "UserCreationRequest_buddyId_fkey" FOREIGN KEY ("buddyId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCreationRequest" ADD CONSTRAINT "UserCreationRequest_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCreationRequest" ADD CONSTRAINT "UserCreationRequest_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
