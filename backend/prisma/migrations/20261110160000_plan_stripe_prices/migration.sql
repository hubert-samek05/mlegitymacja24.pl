-- AlterTable
ALTER TABLE "subscription_plans" ADD COLUMN     "stripePriceMonthlyId" TEXT,
ADD COLUMN     "stripePriceYearlyId" TEXT,
ADD COLUMN     "stripeProductId" TEXT;
