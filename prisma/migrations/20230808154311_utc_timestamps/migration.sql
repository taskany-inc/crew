-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "createdAt" SET DEFAULT timezone('utc', current_timestamp),
ALTER COLUMN "updatedAt" SET DEFAULT timezone('utc', current_timestamp);

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "createdAt" SET DEFAULT timezone('utc', current_timestamp),
ALTER COLUMN "updatedAt" SET DEFAULT timezone('utc', current_timestamp);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "createdAt" SET DEFAULT timezone('utc', current_timestamp),
ALTER COLUMN "updatedAt" SET DEFAULT timezone('utc', current_timestamp);

-- AlterTable
ALTER TABLE "VerificationToken" ALTER COLUMN "createdAt" SET DEFAULT timezone('utc', current_timestamp),
ALTER COLUMN "updatedAt" SET DEFAULT timezone('utc', current_timestamp);
