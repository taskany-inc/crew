-- CreateTable
CREATE TABLE "ExternalService" (
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "linkPrefix" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "ExternalService_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "UserServices" (
    "userId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT timezone('utc'::text, now())
);

-- CreateIndex
CREATE UNIQUE INDEX "ExternalService_name_key" ON "ExternalService"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserServices_serviceName_serviceId_key" ON "UserServices"("serviceName", "serviceId");

-- AddForeignKey
ALTER TABLE "UserServices" ADD CONSTRAINT "UserServices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserServices" ADD CONSTRAINT "UserServices_serviceName_fkey" FOREIGN KEY ("serviceName") REFERENCES "ExternalService"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
