-- AlterTable
ALTER TABLE "BonusHistory" ADD COLUMN     "ruleId" TEXT;

-- AddForeignKey
ALTER TABLE "BonusHistory" ADD CONSTRAINT "BonusHistory_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "BonusRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
