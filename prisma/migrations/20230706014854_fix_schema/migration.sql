-- CreateEnum
CREATE TYPE "Alignment" AS ENUM ('GOOD', 'EVIL');

-- CreateTable
CREATE TABLE "game" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "date" TIMESTAMP(3) NOT NULL,
    "script" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "player_count" INTEGER NOT NULL,
    "initial_character" TEXT NOT NULL,
    "alignment" "Alignment" NOT NULL,
    "final3" BOOLEAN,
    "win" BOOLEAN NOT NULL,
    "notes" TEXT NOT NULL,

    CONSTRAINT "game_pkey" PRIMARY KEY ("id")
);
