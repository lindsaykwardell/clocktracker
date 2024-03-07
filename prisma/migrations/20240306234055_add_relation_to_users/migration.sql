-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "end" SET DEFAULT NOW() + interval '1.5 hours';

-- AlterTable
ALTER TABLE "KoFiPayment" ADD COLUMN     "user_id" TEXT;

-- AddForeignKey
ALTER TABLE "KoFiPayment" ADD CONSTRAINT "KoFiPayment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "UserSettings"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
