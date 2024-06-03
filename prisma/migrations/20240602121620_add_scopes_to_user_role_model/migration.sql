-- AlterTable
ALTER TABLE "UserRoleModel" ADD COLUMN     "editRoleScopes" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "editUserRole" BOOLEAN NOT NULL DEFAULT false;
