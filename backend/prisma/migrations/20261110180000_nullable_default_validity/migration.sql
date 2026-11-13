-- AlterTable
ALTER TABLE "credential_type_requests" ALTER COLUMN "defaultValidityMonths" DROP NOT NULL;

-- AlterTable
ALTER TABLE "credential_types" ALTER COLUMN "defaultValidityMonths" DROP NOT NULL;

