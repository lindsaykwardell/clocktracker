/*
  Warnings:

  - You are about to drop the column `country_id` on the `City` table. All the data in the column will be lost.
  - You are about to drop the column `state_id` on the `City` table. All the data in the column will be lost.
  - You are about to drop the `Country` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `State` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "City" DROP CONSTRAINT "City_country_id_fkey";

-- DropForeignKey
ALTER TABLE "City" DROP CONSTRAINT "City_state_id_fkey";

-- DropForeignKey
ALTER TABLE "State" DROP CONSTRAINT "State_country_id_fkey";

-- AlterTable
ALTER TABLE "City" DROP COLUMN "country_id",
DROP COLUMN "state_id";

-- DropTable
DROP TABLE "Country";

-- DropTable
DROP TABLE "State";
