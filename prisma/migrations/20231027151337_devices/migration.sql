-- CreateTable
CREATE TABLE "Device" (
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "Device_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "UserDevice" (
    "userId" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT timezone('utc'::text, now())
);

-- CreateIndex
CREATE UNIQUE INDEX "Device_name_key" ON "Device"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserDevice_deviceName_deviceId_key" ON "UserDevice"("deviceName", "deviceId");

-- AddForeignKey
ALTER TABLE "UserDevice" ADD CONSTRAINT "UserDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDevice" ADD CONSTRAINT "UserDevice_deviceName_fkey" FOREIGN KEY ("deviceName") REFERENCES "Device"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
