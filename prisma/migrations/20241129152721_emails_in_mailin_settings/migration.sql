-- DropForeignKey
ALTER TABLE "MailingSettings" DROP CONSTRAINT "MailingSettings_userId_fkey";

-- AlterTable
ALTER TABLE "MailingSettings" ADD COLUMN     "additionalEmails" TEXT[],
ADD COLUMN     "plainEmails" BOOLEAN,
ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "MailingSettings" ADD CONSTRAINT "MailingSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
