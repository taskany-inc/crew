-- AlterTable
ALTER TABLE "Achievement" ADD COLUMN     "bonusRuleId" TEXT;

-- CreateTable
CREATE TABLE "BonusRule" (
    "id" TEXT NOT NULL,
    "bonusAmountForAchievement" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "BonusRule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_bonusRuleId_fkey" FOREIGN KEY ("bonusRuleId") REFERENCES "BonusRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
