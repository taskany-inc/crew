-- CreateTable
CREATE TABLE "Attach" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT timezone('utc'::text, now()),
    "link" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Attach_pkey" PRIMARY KEY ("id")
);
