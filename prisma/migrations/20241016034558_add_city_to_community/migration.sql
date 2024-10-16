-- AlterTable
ALTER TABLE "Community" ADD COLUMN     "city_id" TEXT,
ADD COLUMN     "location" TEXT;

-- AddForeignKey
ALTER TABLE "Community" ADD CONSTRAINT "Community_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
