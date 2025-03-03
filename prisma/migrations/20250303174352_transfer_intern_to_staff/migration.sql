-- AlterTable
ALTER TABLE "SupplementalPosition" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "UserCreationRequest" ADD COLUMN     "applicationForReturnOfEquipment" TEXT,
ADD COLUMN     "devices" JSONB,
ADD COLUMN     "internshipOrganizationGroup" TEXT,
ADD COLUMN     "internshipOrganizationId" TEXT,
ADD COLUMN     "internshipRole" TEXT,
ADD COLUMN     "internshipSupervisor" TEXT,
ADD COLUMN     "testingDevices" JSONB;
