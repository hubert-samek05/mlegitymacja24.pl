-- CreateEnum
CREATE TYPE "CredentialTypeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "credential_types" ADD COLUMN     "category" TEXT;

-- CreateTable
CREATE TABLE "credential_type_requests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "defaultValidityMonths" INTEGER NOT NULL DEFAULT 24,
    "status" "CredentialTypeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "companyId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "credentialTypeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credential_type_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "credential_type_requests_companyId_idx" ON "credential_type_requests"("companyId");

-- CreateIndex
CREATE INDEX "credential_type_requests_status_idx" ON "credential_type_requests"("status");

-- CreateIndex
CREATE INDEX "credential_types_category_idx" ON "credential_types"("category");

-- AddForeignKey
ALTER TABLE "credential_type_requests" ADD CONSTRAINT "credential_type_requests_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credential_type_requests" ADD CONSTRAINT "credential_type_requests_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credential_type_requests" ADD CONSTRAINT "credential_type_requests_credentialTypeId_fkey" FOREIGN KEY ("credentialTypeId") REFERENCES "credential_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
