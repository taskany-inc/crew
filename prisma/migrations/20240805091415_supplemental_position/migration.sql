-- CreateTable
CREATE TABLE "SupplementalPosition" (
    "id" TEXT NOT NULL,
    "organizationUnitId" TEXT NOT NULL,
    "userId" TEXT,
    "percentage" INTEGER NOT NULL,
    "userCreationRequestId" TEXT,

    CONSTRAINT "SupplementalPosition_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SupplementalPosition" ADD CONSTRAINT "SupplementalPosition_organizationUnitId_fkey" FOREIGN KEY ("organizationUnitId") REFERENCES "OrganizationUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplementalPosition" ADD CONSTRAINT "SupplementalPosition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplementalPosition" ADD CONSTRAINT "SupplementalPosition_userCreationRequestId_fkey" FOREIGN KEY ("userCreationRequestId") REFERENCES "UserCreationRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
