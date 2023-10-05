-- CreateEnum
CREATE TYPE "BonusAction" AS ENUM ('ADD', 'SUBTRACT');

-- CreateTable
CREATE TABLE "BonusHistory" (
    "id" TEXT NOT NULL,
    "action" "BonusAction" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "actingUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "BonusHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BonusHistory" ADD CONSTRAINT "BonusHistory_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonusHistory" ADD CONSTRAINT "BonusHistory_actingUserId_fkey" FOREIGN KEY ("actingUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
