-- CreateEnum
CREATE TYPE "DeathCause" AS ENUM ('EXECUTION', 'ABILITY');

-- CreateTable
CREATE TABLE "DeathEvent" (
    "id" SERIAL NOT NULL,
    "game_id" TEXT NOT NULL,
    "grimoire_page" INTEGER NOT NULL,
    "seat_order" INTEGER NOT NULL,
    "is_revival" BOOLEAN NOT NULL DEFAULT false,
    "cause" "DeathCause",
    "by_seat_page" INTEGER,
    "by_seat_order" INTEGER,
    "player_name" TEXT NOT NULL DEFAULT '',
    "role_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeathEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DeathEvent" ADD CONSTRAINT "DeathEvent_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeathEvent" ADD CONSTRAINT "DeathEvent_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
