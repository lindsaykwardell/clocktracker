-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';

-- CreateTable
CREATE TABLE "KoFiPayment" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "is_subscription_payment" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KoFiPayment_pkey" PRIMARY KEY ("id")
);
