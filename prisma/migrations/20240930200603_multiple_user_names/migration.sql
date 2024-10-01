-- CreateTable
CREATE TABLE "UserNames" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "UserNames_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserNames" ADD CONSTRAINT "UserNames_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
