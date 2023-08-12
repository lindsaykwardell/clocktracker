-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "parent_game_id" TEXT;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_parent_game_id_fkey" FOREIGN KEY ("parent_game_id") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;
