-- AlterTable
ALTER TABLE "Token" ADD COLUMN     "player_id" TEXT;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "UserSettings"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
