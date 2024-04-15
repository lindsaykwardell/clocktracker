/*
  Warnings:

  - Made the column `script_id` on table `Script` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Script" ALTER COLUMN "script_id" SET NOT NULL;
