ALTER TABLE "credentials" ADD COLUMN "companyNumber" TEXT;
ALTER TABLE "credentials" ADD COLUMN "securityCode" TEXT;
CREATE UNIQUE INDEX "credentials_securityCode_key" ON "credentials"("securityCode");
