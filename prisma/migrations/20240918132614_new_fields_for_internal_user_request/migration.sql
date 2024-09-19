-- AlterTable
ALTER TABLE "SupplementalPosition" ADD COLUMN     "unitId" TEXT;

-- AlterTable
ALTER TABLE "UserCreationRequest" ADD COLUMN     "workEmail" TEXT;

-- CreateTable
CREATE TABLE "_userCoordinators" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_userLineManagers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_userCoordinators_AB_unique" ON "_userCoordinators"("A", "B");

-- CreateIndex
CREATE INDEX "_userCoordinators_B_index" ON "_userCoordinators"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_userLineManagers_AB_unique" ON "_userLineManagers"("A", "B");

-- CreateIndex
CREATE INDEX "_userLineManagers_B_index" ON "_userLineManagers"("B");

-- AddForeignKey
ALTER TABLE "_userCoordinators" ADD CONSTRAINT "_userCoordinators_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_userCoordinators" ADD CONSTRAINT "_userCoordinators_B_fkey" FOREIGN KEY ("B") REFERENCES "UserCreationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_userLineManagers" ADD CONSTRAINT "_userLineManagers_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_userLineManagers" ADD CONSTRAINT "_userLineManagers_B_fkey" FOREIGN KEY ("B") REFERENCES "UserCreationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
