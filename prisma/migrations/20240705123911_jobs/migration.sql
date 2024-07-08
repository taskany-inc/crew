/*
  Warnings:

  - A unique constraint covering the columns `[jobId]` on the table `ScheduledDeactivation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ScheduledDeactivation" ADD COLUMN     "jobId" TEXT;

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "kind" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "delay" INTEGER,
    "retry" INTEGER,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "force" BOOLEAN NOT NULL DEFAULT false,
    "cron" TEXT,
    "error" TEXT,
    "date" TIMESTAMP(3),
    "createdAt" TIMESTAMP NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledDeactivation_jobId_key" ON "ScheduledDeactivation"("jobId");

-- AddForeignKey
ALTER TABLE "ScheduledDeactivation" ADD CONSTRAINT "ScheduledDeactivation_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
