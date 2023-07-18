/*
  Warnings:

  - Added the required column `from_user_id` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "from_user_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "UserSettings"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
