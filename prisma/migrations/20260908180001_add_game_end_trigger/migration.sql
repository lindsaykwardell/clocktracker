-- CreateEnum
CREATE TYPE "GameEndTrigger" AS ENUM ('NOT_RECORDED', 'TWO_PLAYERS_LEFT_ALIVE', 'NO_LIVING_DEMON', 'CHARACTER_ABILITY', 'GAME_ENDED_EARLY', 'OTHER');

-- CreateEnum
CREATE TYPE "GameEndTriggerType" AS ENUM ('DEATH', 'EXECUTION', 'CHARACTER_CHANGE', 'EXTRA_WIN_CONDITION', 'OTHER');

-- CreateEnum
CREATE TYPE "GameEndTriggerCause" AS ENUM ('ABILITY', 'NOMINATION', 'FAILED_ABILITY');

-- CreateEnum
CREATE TYPE "GrimoireEventCause" AS ENUM ('ABILITY', 'NOMINATION');

-- CreateEnum
CREATE TYPE "GrimoireEventType" AS ENUM ('NOT_RECORDED', 'DEATH', 'EXECUTION', 'REVIVE', 'ROLE_CHANGE', 'SEAT_CHANGE', 'ALIGNMENT_CHANGE');

-- AlterTable
ALTER TABLE "Game"
ADD COLUMN     "end_trigger" "GameEndTrigger" NOT NULL DEFAULT 'NOT_RECORDED',
ADD COLUMN     "end_trigger_type" "GameEndTriggerType",
ADD COLUMN     "end_trigger_cause" "GameEndTriggerCause",
ADD COLUMN     "end_trigger_note" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "end_trigger_role_id" TEXT,
ADD COLUMN     "end_trigger_participant_id" TEXT;

-- AlterTable
ALTER TABLE "Token" ADD COLUMN     "grimoire_participant_id" TEXT;

-- CreateTable
CREATE TABLE "GrimoireEvent" (
    "id" SERIAL NOT NULL,
    "game_id" TEXT NOT NULL,
    "grimoire_page" INTEGER NOT NULL,
    "participant_id" TEXT NOT NULL DEFAULT '',
    "event_type" "GrimoireEventType" NOT NULL DEFAULT 'NOT_RECORDED',
    "cause" "GrimoireEventCause",
    "by_participant_id" TEXT,
    "player_name" TEXT NOT NULL DEFAULT '',
    "role_id" TEXT,
    "by_role_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrimoireEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_end_trigger_role_id_fkey" FOREIGN KEY ("end_trigger_role_id") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrimoireEvent" ADD CONSTRAINT "GrimoireEvent_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrimoireEvent" ADD CONSTRAINT "GrimoireEvent_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrimoireEvent" ADD CONSTRAINT "GrimoireEvent_by_role_id_fkey" FOREIGN KEY ("by_role_id") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
