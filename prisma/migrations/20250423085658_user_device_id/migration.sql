-- AlterTable
ALTER TABLE "UserDevice" ADD COLUMN     "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "UserDevice_pkey" PRIMARY KEY ("id");
