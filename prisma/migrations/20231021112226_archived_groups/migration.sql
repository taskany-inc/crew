-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false;
