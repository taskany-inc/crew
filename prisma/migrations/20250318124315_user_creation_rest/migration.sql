-- AlterEnum
ALTER TYPE "UserCreationRequestStatus" ADD VALUE 'Draft';

-- AlterTable
ALTER TABLE "UserCreationRequest" ADD COLUMN     "externalGroupId" TEXT,
ADD COLUMN     "externalPersonId" TEXT;
