-- AlterEnum
ALTER TYPE "UserCreationRequestStatus" ADD VALUE 'Canceled';

-- AlterTable
ALTER TABLE "UserCreationRequest" ADD COLUMN     "cancelComment" TEXT;
