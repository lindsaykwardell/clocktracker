/*
  Warnings:

  - Changed the type of `win` on the `Game` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "WinStatus" AS ENUM ('WIN', 'LOSS', 'NOT_RECORDED');

-- AlterTable

ALTER TABLE "Game" ADD COLUMN "win_" "WinStatus";

UPDATE "Game" SET "win_" = CASE WHEN "win" = true THEN 'WIN'::"WinStatus" ELSE 'LOSS'::"WinStatus" END;

ALTER TABLE "Game" DROP COLUMN "win";
ALTER TABLE "Game" RENAME COLUMN "win_" TO "win";
ALTER TABLE "Game" ALTER COLUMN "win" SET NOT NULL;