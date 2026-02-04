-- CreateEnum
CREATE TYPE "GameEndTrigger" AS ENUM ('NOT_RECORDED', 'TWO_PLAYERS_LEFT_ALIVE', 'NO_LIVING_DEMON', 'CHARACTER_ABILITY', 'GAME_ENDED_EARLY', 'OTHER');

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "end_trigger" "GameEndTrigger" NOT NULL DEFAULT 'NOT_RECORDED',
ADD COLUMN     "end_trigger_note" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "end_trigger_role_id" TEXT;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_end_trigger_role_id_fkey" FOREIGN KEY ("end_trigger_role_id") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
