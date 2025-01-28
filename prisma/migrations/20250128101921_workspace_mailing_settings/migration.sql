-- AlterTable
ALTER TABLE "MailingSettings" ADD COLUMN     "email" TEXT,
ADD COLUMN     "workSpaceNotify" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
