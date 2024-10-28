-- AlterTable
ALTER TABLE "UserCreationRequest" ADD COLUMN     "reasonToGrantPermissionToServices" TEXT;

-- CreateTable
CREATE TABLE "PermissionService" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,

    CONSTRAINT "PermissionService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_userCurators" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_PermissionServiceToUserCreationRequest" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_userCurators_AB_unique" ON "_userCurators"("A", "B");

-- CreateIndex
CREATE INDEX "_userCurators_B_index" ON "_userCurators"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PermissionServiceToUserCreationRequest_AB_unique" ON "_PermissionServiceToUserCreationRequest"("A", "B");

-- CreateIndex
CREATE INDEX "_PermissionServiceToUserCreationRequest_B_index" ON "_PermissionServiceToUserCreationRequest"("B");

-- AddForeignKey
ALTER TABLE "_userCurators" ADD CONSTRAINT "_userCurators_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_userCurators" ADD CONSTRAINT "_userCurators_B_fkey" FOREIGN KEY ("B") REFERENCES "UserCreationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionServiceToUserCreationRequest" ADD CONSTRAINT "_PermissionServiceToUserCreationRequest_A_fkey" FOREIGN KEY ("A") REFERENCES "PermissionService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionServiceToUserCreationRequest" ADD CONSTRAINT "_PermissionServiceToUserCreationRequest_B_fkey" FOREIGN KEY ("B") REFERENCES "UserCreationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
