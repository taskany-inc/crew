-- AlterTable
ALTER TABLE "UserRoleModel" ADD COLUMN     "createExistingUserRequest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "createExternalFromMainUserRequest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "createExternalUserRequest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "createInternalUserRequest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "decideOnUserCreationRequest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "editExternalFromMainUserRequest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "editExternalUserRequest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "editInternalUserRequest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "readManyExternalFromMainUserRequests" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "readManyExternalUserRequests" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "readManyInternalUserRequests" BOOLEAN NOT NULL DEFAULT false;
