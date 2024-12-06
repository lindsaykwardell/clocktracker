/*
  Warnings:

  - The primary key for the `GameV2` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Character" DROP CONSTRAINT "Character_game_v2_id_fkey";

-- DropForeignKey
ALTER TABLE "FavoriteGame" DROP CONSTRAINT "FavoriteGame_game_v2_id_fkey";

-- AlterTable
ALTER TABLE "Character" ALTER COLUMN "game_v2_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "FavoriteGame" ALTER COLUMN "game_v2_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "GameV2" DROP CONSTRAINT "GameV2_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "GameV2_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "GameV2_id_seq";

-- AddForeignKey
ALTER TABLE "FavoriteGame" ADD CONSTRAINT "FavoriteGame_game_v2_id_fkey" FOREIGN KEY ("game_v2_id") REFERENCES "GameV2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_game_v2_id_fkey" FOREIGN KEY ("game_v2_id") REFERENCES "GameV2"("id") ON DELETE SET NULL ON UPDATE CASCADE;
