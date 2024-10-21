-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "created_by_id" TEXT;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "UserSettings"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
