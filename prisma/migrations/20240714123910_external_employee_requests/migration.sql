-- AlterTable
ALTER TABLE "Attach" ADD COLUMN     "userCreationRequestId" TEXT;

-- AlterTable
ALTER TABLE "OrganizationUnit" ADD COLUMN     "external" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UserCreationRequest" ADD COLUMN     "accessToInternalSystems" BOOLEAN,
ADD COLUMN     "externalOrganizationSupervisorLogin" TEXT,
ADD COLUMN     "type" TEXT;

-- CreateTable
CREATE TABLE "OrganizationDomain" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,

    CONSTRAINT "OrganizationDomain_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Attach" ADD CONSTRAINT "Attach_userCreationRequestId_fkey" FOREIGN KEY ("userCreationRequestId") REFERENCES "UserCreationRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
