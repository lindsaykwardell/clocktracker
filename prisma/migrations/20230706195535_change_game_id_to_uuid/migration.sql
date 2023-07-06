/*
  Warnings:

  - The primary key for the `game` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "game" DROP CONSTRAINT "game_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "game_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "game_id_seq";
