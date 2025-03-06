/*
  Warnings:

  - A unique constraint covering the columns `[main]` on the table `OrganizationUnit` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AppConfig" ADD COLUMN     "corporateAppName" TEXT;

-- AlterTable
ALTER TABLE "OrganizationDomain" ADD COLUMN     "type" TEXT,
ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "OrganizationUnit" ADD COLUMN     "main" BOOLEAN;

-- AlterTable
ALTER TABLE "UserCreationRequest" ADD COLUMN     "transferFromGroup" TEXT;

-- CreateTable
CREATE TABLE "Link" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_OrganizationDomainToOrganizationUnit" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_OrganizationDomainToOrganizationUnit_AB_unique" ON "_OrganizationDomainToOrganizationUnit"("A", "B");

-- CreateIndex
CREATE INDEX "_OrganizationDomainToOrganizationUnit_B_index" ON "_OrganizationDomainToOrganizationUnit"("B");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationUnit_main_key" ON "OrganizationUnit"("main");

-- AddForeignKey
ALTER TABLE "_OrganizationDomainToOrganizationUnit" ADD CONSTRAINT "_OrganizationDomainToOrganizationUnit_A_fkey" FOREIGN KEY ("A") REFERENCES "OrganizationDomain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrganizationDomainToOrganizationUnit" ADD CONSTRAINT "_OrganizationDomainToOrganizationUnit_B_fkey" FOREIGN KEY ("B") REFERENCES "OrganizationUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
