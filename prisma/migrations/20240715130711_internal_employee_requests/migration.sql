-- AlterTable
ALTER TABLE "UserCreationRequest" ADD COLUMN     "buddyLogin" TEXT,
ADD COLUMN     "coordinatorLogin" TEXT,
ADD COLUMN     "creationCause" TEXT,
ADD COLUMN     "equipment" TEXT,
ADD COLUMN     "extraEquipment" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "newUser" BOOLEAN,
ADD COLUMN     "recruiterLogin" TEXT,
ADD COLUMN     "unitId" TEXT,
ADD COLUMN     "workMode" TEXT,
ADD COLUMN     "workModeComment" TEXT,
ADD COLUMN     "workSpace" TEXT;

-- AddForeignKey
ALTER TABLE "UserCreationRequest" ADD CONSTRAINT "UserCreationRequest_buddyLogin_fkey" FOREIGN KEY ("buddyLogin") REFERENCES "User"("login") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCreationRequest" ADD CONSTRAINT "UserCreationRequest_recruiterLogin_fkey" FOREIGN KEY ("recruiterLogin") REFERENCES "User"("login") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCreationRequest" ADD CONSTRAINT "UserCreationRequest_coordinatorLogin_fkey" FOREIGN KEY ("coordinatorLogin") REFERENCES "User"("login") ON DELETE SET NULL ON UPDATE CASCADE;
