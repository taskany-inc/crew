/*
  Warnings:

  - A unique constraint covering the columns `[value]` on the table `ApiToken` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ApiToken" ADD COLUMN     "value" UUID NOT NULL DEFAULT gen_random_uuid();

-- CreateIndex
CREATE UNIQUE INDEX "ApiToken_value_key" ON "ApiToken"("value");


UPDATE "ApiToken" SET value = id;

UPDATE "ApiToken" SET id = gen_random_uuid();

