-- AlterTable
ALTER TABLE "UserCreationRequest" ADD COLUMN     "date" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MailingSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createUserRequest" BOOLEAN NOT NULL DEFAULT false,
    "createScheduledUserRequest" BOOLEAN NOT NULL DEFAULT false,
    "scheduledDeactivation" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MailingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MailingSettings_userId_key" ON "MailingSettings"("userId");

-- AddForeignKey
ALTER TABLE "MailingSettings" ADD CONSTRAINT "MailingSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
