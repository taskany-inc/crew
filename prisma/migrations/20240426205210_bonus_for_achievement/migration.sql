-- CreateTable
CREATE TABLE "BonusForAchievementRule" (
    "id" TEXT NOT NULL,
    "bonusesPerCrewAchievement" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "externalAchievementId" TEXT,
    "externalAchievementCategoryId" TEXT,

    CONSTRAINT "BonusForAchievementRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BonusForAchievementRule_achievementId_key" ON "BonusForAchievementRule"("achievementId");

-- AddForeignKey
ALTER TABLE "BonusForAchievementRule" ADD CONSTRAINT "BonusForAchievementRule_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
