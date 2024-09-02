/*
  Warnings:

  - A unique constraint covering the columns `[favorite_id]` on the table `Game` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "favorite_id" INTEGER;

-- CreateTable
CREATE TABLE "FavoriteGame" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteGame_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteGame_game_id_key" ON "FavoriteGame"("game_id");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteGame_user_id_game_id_key" ON "FavoriteGame"("user_id", "game_id");

-- CreateIndex
CREATE UNIQUE INDEX "Game_favorite_id_key" ON "Game"("favorite_id");

-- AddForeignKey
ALTER TABLE "FavoriteGame" ADD CONSTRAINT "FavoriteGame_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "UserSettings"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteGame" ADD CONSTRAINT "FavoriteGame_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
