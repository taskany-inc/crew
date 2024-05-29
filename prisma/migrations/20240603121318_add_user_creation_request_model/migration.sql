-- CreateEnum
CREATE TYPE "UserCreationRequestStatus" AS ENUM ('Approved', 'Denied');

-- AlterTable
ALTER TABLE "UserRoleModel" ADD COLUMN     "editUserCreationRequests" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "UserCreationRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "supervisorLogin" TEXT NOT NULL,
    "organizationUnitId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createExternalAccount" BOOLEAN NOT NULL,
    "status" "UserCreationRequestStatus",
    "comment" TEXT,
    "services" JSONB NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "UserCreationRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserCreationRequest" ADD CONSTRAINT "UserCreationRequest_supervisorLogin_fkey" FOREIGN KEY ("supervisorLogin") REFERENCES "User"("login") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCreationRequest" ADD CONSTRAINT "UserCreationRequest_organizationUnitId_fkey" FOREIGN KEY ("organizationUnitId") REFERENCES "OrganizationUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCreationRequest" ADD CONSTRAINT "UserCreationRequest_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
