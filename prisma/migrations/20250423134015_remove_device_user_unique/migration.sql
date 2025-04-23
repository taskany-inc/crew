/*
  Warnings:

  - You are about to drop the column `active` on the `UserDevice` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "UserDevice_deviceName_deviceId_key";

-- AlterTable
ALTER TABLE "UserDevice" DROP COLUMN "active",
ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "archivedAt" TIMESTAMP(3);
