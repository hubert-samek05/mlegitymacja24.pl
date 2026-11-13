-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "failureReason" TEXT;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "pastDueSince" TIMESTAMP(3),
ADD COLUMN     "pendingPlanId" TEXT;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_pendingPlanId_fkey" FOREIGN KEY ("pendingPlanId") REFERENCES "subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

