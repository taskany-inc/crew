-- AlterTable
ALTER TABLE "UserRoleModel" ADD COLUMN     "editScheduledDeactivation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "viewScheduledDeactivation" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ScheduledDeactivation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "deactivateDate" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "disableAccount" BOOLEAN NOT NULL,
    "location" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "newOrganization" TEXT,
    "teamLead" TEXT NOT NULL,
    "newTeamLead" TEXT,
    "organizationRole" TEXT,
    "newOrganizationRole" TEXT,
    "organizationalGroup" TEXT,
    "newOrganizationalGroup" TEXT,
    "workMode" TEXT,
    "workModeComment" TEXT,
    "testingDevices" JSONB,
    "devices" JSONB,
    "comments" TEXT,
    "unitId" INTEGER,
    "transferPercentage" INTEGER,
    "canceled" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "ScheduledDeactivation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ScheduledDeactivation" ADD CONSTRAINT "ScheduledDeactivation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledDeactivation" ADD CONSTRAINT "ScheduledDeactivation_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
