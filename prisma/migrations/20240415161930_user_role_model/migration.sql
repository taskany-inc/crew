-- AlterTable
ALTER TABLE "ApiToken" ADD COLUMN     "roleCode" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "roleCode" TEXT;

-- CreateTable
CREATE TABLE "UserRoleModel" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createUser" BOOLEAN NOT NULL DEFAULT false,
    "editUser" BOOLEAN NOT NULL DEFAULT false,
    "editUserActiveState" BOOLEAN NOT NULL DEFAULT false,
    "editUserAchievements" BOOLEAN NOT NULL DEFAULT false,
    "editUserBonuses" BOOLEAN NOT NULL DEFAULT false,
    "viewUserBonuses" BOOLEAN NOT NULL DEFAULT false,
    "viewUserExtendedInfo" BOOLEAN NOT NULL DEFAULT false,
    "editFullGroupTree" BOOLEAN NOT NULL DEFAULT false,
    "editAdministratedGroupTree" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserRoleModel_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserRoleModel_code_key" ON "UserRoleModel"("code");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleCode_fkey" FOREIGN KEY ("roleCode") REFERENCES "UserRoleModel"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiToken" ADD CONSTRAINT "ApiToken_roleCode_fkey" FOREIGN KEY ("roleCode") REFERENCES "UserRoleModel"("code") ON DELETE SET NULL ON UPDATE CASCADE;
