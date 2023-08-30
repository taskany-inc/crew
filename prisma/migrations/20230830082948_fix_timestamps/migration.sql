-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "createdAt" SET DEFAULT timezone('utc'::text, now()),
ALTER COLUMN "updatedAt" SET DEFAULT timezone('utc'::text, now());

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "createdAt" SET DEFAULT timezone('utc'::text, now()),
ALTER COLUMN "updatedAt" SET DEFAULT timezone('utc'::text, now());

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "createdAt" SET DEFAULT timezone('utc'::text, now()),
ALTER COLUMN "updatedAt" SET DEFAULT timezone('utc'::text, now());

-- AlterTable
ALTER TABLE "VerificationToken" ALTER COLUMN "createdAt" SET DEFAULT timezone('utc'::text, now()),
ALTER COLUMN "updatedAt" SET DEFAULT timezone('utc'::text, now());
