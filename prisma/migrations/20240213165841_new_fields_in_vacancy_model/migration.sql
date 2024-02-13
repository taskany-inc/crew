/*
  Warnings:

  - Added the required column `hiringManagerId` to the `Vacancy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hrId` to the `Vacancy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Vacancy` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "VacancyStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'CLOSED', 'ON_CONFIRMATION');

-- AlterTable
ALTER TABLE "Vacancy" ADD COLUMN     "activeSince" TIMESTAMP(3),
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP NOT NULL DEFAULT timezone('utc'::text, now()),
ADD COLUMN     "grade" INTEGER,
ADD COLUMN     "hiringManagerId" TEXT NOT NULL,
ADD COLUMN     "hrId" TEXT NOT NULL,
ADD COLUMN     "status" "VacancyStatus" NOT NULL,
ADD COLUMN     "timeAtWork" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unit" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT timezone('utc'::text, now());

-- AddForeignKey
ALTER TABLE "Vacancy" ADD CONSTRAINT "Vacancy_hiringManagerId_fkey" FOREIGN KEY ("hiringManagerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vacancy" ADD CONSTRAINT "Vacancy_hrId_fkey" FOREIGN KEY ("hrId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
