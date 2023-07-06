/*
  Warnings:

  - You are about to drop the `games` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "games";

-- CreateTable
CREATE TABLE "game" (
    "id" BIGSERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "date" TIMESTAMP(3) NOT NULL,
    "script" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "playerCount" TEXT NOT NULL,
    "initial_character" TEXT NOT NULL,
    "alignment" "Alignment" NOT NULL,
    "final3" BOOLEAN,
    "win" BOOLEAN NOT NULL,
    "notes" TEXT NOT NULL,

    CONSTRAINT "game_pkey" PRIMARY KEY ("id")
);
