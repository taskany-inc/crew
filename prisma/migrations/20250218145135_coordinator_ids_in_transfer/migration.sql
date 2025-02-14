/*
  Warnings:

  - You are about to drop the column `coordinatorId` on the `ScheduledDeactivation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ScheduledDeactivation" DROP CONSTRAINT "ScheduledDeactivation_coordinatorId_fkey";

-- AlterTable
ALTER TABLE "ScheduledDeactivation" DROP COLUMN "coordinatorId",
ADD COLUMN     "coordinatorIds" TEXT[];
