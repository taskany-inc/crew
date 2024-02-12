/*
  Warnings:

  - You are about to drop the column `hireStream` on the `Vacancy` table. All the data in the column will be lost.
  - Added the required column `hireStreamId` to the `Vacancy` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Vacancy" DROP COLUMN "hireStream",
ADD COLUMN     "hireStreamId" TEXT NOT NULL;
