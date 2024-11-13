-- CreateTable
CREATE TABLE "_userCurator" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_userCurator_AB_unique" ON "_userCurator"("A", "B");

-- CreateIndex
CREATE INDEX "_userCurator_B_index" ON "_userCurator"("B");

-- AddForeignKey
ALTER TABLE "_userCurator" ADD CONSTRAINT "_userCurator_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_userCurator" ADD CONSTRAINT "_userCurator_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
