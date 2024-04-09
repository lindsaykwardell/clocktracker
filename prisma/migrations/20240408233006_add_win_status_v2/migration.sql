/*
  Warnings:

  - Added the required column `win_v2` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WinStatus_V2" AS ENUM ('GOOD_WINS', 'EVIL_WINS', 'NOT_RECORDED');

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "win_v2" "WinStatus_V2" NOT NULL DEFAULT 'NOT_RECORDED';