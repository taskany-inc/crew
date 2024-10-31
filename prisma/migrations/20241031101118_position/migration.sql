-- CreateEnum
CREATE TYPE "PositionStatus" AS ENUM ('ACTIVE', 'DECREE', 'FIRED');

-- AlterTable
ALTER TABLE "SupplementalPosition" ADD COLUMN     "main" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "role" TEXT,
ADD COLUMN     "status" "PositionStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "workEndDate" TIMESTAMP(3),
ADD COLUMN     "workStartDate" TIMESTAMP(3);
