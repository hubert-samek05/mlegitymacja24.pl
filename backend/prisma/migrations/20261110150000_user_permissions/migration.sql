-- AlterTable
ALTER TABLE "users" ADD COLUMN     "permissions" TEXT[] DEFAULT ARRAY['credentials.issue', 'credentials.manage', 'verifications.view']::TEXT[];

