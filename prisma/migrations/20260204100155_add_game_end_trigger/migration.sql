-- CreateEnum
CREATE TYPE "GameEndTrigger" AS ENUM ('NOT_RECORDED', 'TWO_PLAYERS_LEFT_ALIVE', 'NO_LIVING_DEMON', 'CHARACTER_ABILITY', 'GAME_ENDED_EARLY', 'OTHER');

-- CreateEnum
CREATE TYPE "DeathCause" AS ENUM ('ABILITY', 'NOMINATION');

-- CreateEnum
CREATE TYPE "DeathType" AS ENUM ('DEATH', 'EXECUTION');

-- AlterTable
ALTER TABLE "Game"
ADD COLUMN     "end_trigger" "GameEndTrigger" NOT NULL DEFAULT 'NOT_RECORDED',
ADD COLUMN     "end_trigger_note" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "end_trigger_role_id" TEXT,
ADD COLUMN     "end_trigger_participant_id" TEXT;

-- AlterTable
ALTER TABLE "Token" ADD COLUMN     "grimoire_participant_id" TEXT;

-- CreateTable
CREATE TABLE "DeathEvent" (
    "id" SERIAL NOT NULL,
    "game_id" TEXT NOT NULL,
    "grimoire_page" INTEGER NOT NULL,
    "participant_id" TEXT NOT NULL DEFAULT '',
    "is_revival" BOOLEAN NOT NULL DEFAULT false,
    "death_type" "DeathType",
    "cause" "DeathCause",
    "by_participant_id" TEXT,
    "player_name" TEXT NOT NULL DEFAULT '',
    "role_id" TEXT,
    "by_role_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeathEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_end_trigger_role_id_fkey" FOREIGN KEY ("end_trigger_role_id") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeathEvent" ADD CONSTRAINT "DeathEvent_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeathEvent" ADD CONSTRAINT "DeathEvent_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeathEvent" ADD CONSTRAINT "DeathEvent_by_role_id_fkey" FOREIGN KEY ("by_role_id") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
