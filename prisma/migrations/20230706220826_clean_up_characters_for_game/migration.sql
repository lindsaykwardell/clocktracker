/*
  Warnings:

  - You are about to drop the `game` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "game";

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "date" TIMESTAMP(3) NOT NULL,
    "script" TEXT NOT NULL,
    "location_type" "LocationType" NOT NULL DEFAULT 'ONLINE',
    "location" TEXT NOT NULL,
    "player_count" INTEGER NOT NULL,
    "final3" BOOLEAN,
    "win" BOOLEAN NOT NULL,
    "notes" TEXT NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "alignment" "Alignment" NOT NULL,
    "gameId" TEXT,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;
